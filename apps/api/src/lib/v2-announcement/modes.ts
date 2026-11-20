import {
    DEFAULT_DAILY_CAP,
    partitionPendingByAge,
    sendInBatches,
    type PendingBatch,
    type SendSummary,
    type SentEntry,
} from "./batching.js"
import type { Recipient } from "./recipients.js"
import type { RenderedMessage } from "./resend-client.js"

export const USAGE = [
    "Usage: bun scripts/send-v2-announcement.ts <mode> [options]",
    "  --dry-run               render, print count + sample, write HTML preview; sends nothing",
    "  --test-to <email>       send one message to <email>; marks nobody",
    "  --confirm               real send to eligible users (needs full mail env)",
    `  --daily-cap <n>         max messages per run, default ${DEFAULT_DAILY_CAP}, max ${DEFAULT_DAILY_CAP}`,
    "  --limit <n>             send to at most n users this run",
].join("\n")

const SAMPLE_SIZE = 3
const PLACEHOLDER_POSTAL_ADDRESS = "[MAIL_POSTAL_ADDRESS not set]"
const PLACEHOLDER_UNSUBSCRIBE_URL = "https://example.invalid/email/unsubscribe?token=preview"
const REAL_SEND_REQUIRED_ENV = [
    "MAIL_FROM",
    "MAIL_POSTAL_ADDRESS",
    "RESEND_API_KEY",
    "UNSUBSCRIBE_SECRET",
    "API_PUBLIC_URL",
] as const

export class CliError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "CliError"
    }
}

export type Mode = { kind: "dry-run" } | { kind: "test"; to: string } | { kind: "send" }

export interface CliOptions {
    mode: Mode
    dailyCap: number
    limit?: number
}

function parsePositiveInt(raw: string, flag: string): number {
    const value = Number(raw)
    if (!Number.isInteger(value) || value < 1) {
        throw new CliError(`${flag} must be a positive integer, got "${raw}"`)
    }
    return value
}

interface RawFlags {
    dryRun: boolean
    confirm: boolean
    testTo?: string
    dailyCap?: string
    limit?: string
}

// Hand-rolled: @types/node here predates util.parseArgs.
function readFlags(argv: readonly string[]): RawFlags {
    const flags: RawFlags = { dryRun: false, confirm: false }
    const valueOf = (index: number, flag: string): string => {
        const value = argv[index + 1]
        if (value === undefined || value.startsWith("--")) {
            throw new CliError(`${flag} requires a value`)
        }
        return value
    }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === "--dry-run") flags.dryRun = true
        else if (arg === "--confirm") flags.confirm = true
        else if (arg === "--test-to") flags.testTo = valueOf(i++, arg)
        else if (arg === "--daily-cap") flags.dailyCap = valueOf(i++, arg)
        else if (arg === "--limit") flags.limit = valueOf(i++, arg)
        else throw new CliError(`Unknown argument "${arg}"`)
    }
    return flags
}

export function parseCli(argv: readonly string[]): CliOptions {
    const flags = readFlags(argv)
    const dailyCap = flags.dailyCap
        ? parsePositiveInt(flags.dailyCap, "--daily-cap")
        : DEFAULT_DAILY_CAP
    if (dailyCap > DEFAULT_DAILY_CAP) {
        throw new CliError(`--daily-cap may not exceed ${DEFAULT_DAILY_CAP}`)
    }
    const limit = flags.limit ? parsePositiveInt(flags.limit, "--limit") : undefined

    const modes: Mode[] = []
    if (flags.dryRun) modes.push({ kind: "dry-run" })
    if (flags.testTo) modes.push({ kind: "test", to: flags.testTo })
    if (flags.confirm) modes.push({ kind: "send" })
    const [mode, ...extra] = modes
    if (!mode || extra.length > 0) {
        throw new CliError("Choose exactly one of --dry-run, --test-to <email>, --confirm")
    }
    return { mode, dailyCap, ...(limit ? { limit } : {}) }
}

/** Real sends refuse to start unless every identity/safety env var is present. */
export function assertRealSendAllowed(env: Readonly<Record<string, string | undefined>>): void {
    const missing = REAL_SEND_REQUIRED_ENV.filter((name) => !env[name]?.trim())
    if (missing.length > 0) {
        throw new CliError(`Refusing to send: missing env ${missing.join(", ")}`)
    }
}

export interface RunDeps {
    loadRecipients: () => Promise<Recipient[]>
    /** Batches reserved by an earlier (possibly crashed) run; replayed before anything new. */
    loadPendingBatches: () => Promise<PendingBatch<Recipient>[]>
    /** Renders for a recipient; implementations choose real or placeholder links. */
    renderFor: (recipient: Recipient) => Promise<RenderedMessage>
    writePreview: (html: string) => Promise<string>
    sendBatch: (batch: Recipient[], idempotencyKey: string) => Promise<string[]>
    sendTest: (to: string) => Promise<string>
    reserveBatch: (batch: Recipient[], idempotencyKey: string) => Promise<void>
    markBatchSent: (sent: SentEntry<Recipient>[]) => Promise<void>
    /** Injectable clock; decides which pending batches Resend can still dedupe. */
    now?: () => Date
    env: Readonly<Record<string, string | undefined>>
    log: (line: string) => void
}

/**
 * Fresh recipients this run may mail: the stricter of --limit and --daily-cap, minus what
 * replayed pending batches already spend. Stale batches never count, so a batch that fails
 * every run stalls fresh sending only until it ages out of the replay window.
 */
export function pickRunRecipients(
    eligible: readonly Recipient[],
    options: CliOptions,
    alreadyQueued = 0,
): Recipient[] {
    const allowance = Math.min(options.limit ?? options.dailyCap, options.dailyCap)
    return eligible.slice(0, Math.max(0, allowance - alreadyQueued))
}

async function runDryRun(options: CliOptions, deps: RunDeps): Promise<number> {
    const eligible = await deps.loadRecipients()
    const runBatch = pickRunRecipients(eligible, options)
    const sample = eligible[0] ?? {
        userId: "sample",
        email: "sample@example.com",
        firstName: "",
    }
    const { html } = await deps.renderFor(sample)
    const previewPath = await deps.writePreview(html)
    deps.log(
        `DRY RUN: ${eligible.length} eligible recipients, ${runBatch.length} would be sent this run`,
    )
    eligible
        .slice(0, SAMPLE_SIZE)
        .forEach((r) => deps.log(`  sample: ${r.email} (${r.firstName || "Hi there"})`))
    deps.log(`Preview HTML: ${previewPath}`)
    return 0
}

async function runTest(to: string, deps: RunDeps): Promise<number> {
    const id = await deps.sendTest(to)
    deps.log(`Test message sent to ${to} (resend id ${id}); no user was marked`)
    return 0
}

function logSummary(summary: SendSummary, eligibleTotal: number, deps: RunDeps): void {
    const remaining = eligibleTotal - summary.sent.length
    deps.log(`Sent ${summary.sent.length}, failed ${summary.failed.length}, remaining ${remaining}`)
    summary.failed.forEach((f) => deps.log(`  FAILED ${f.userId}: ${f.reason}`))
}

/**
 * Batches older than Resend's key lifetime are never replayed: it could mail them again as new
 * (including members who have since opted out). They also stay out of fresh selection (pendingKey
 * is still set) until an operator reconciles them.
 */
function reportStaleBatches(stale: readonly PendingBatch<Recipient>[], deps: RunDeps): void {
    stale.forEach(({ key, items, reservedAt }) => {
        deps.log(
            `DELIVERY UNKNOWN, reconcile manually: batch ${key} reserved ${reservedAt?.toISOString() ?? "at an unknown time"} ` +
                `is too old to replay safely; not resent. Users: ${items.map((i) => i.userId).join(", ")}`,
        )
    })
}

async function runSend(options: CliOptions, deps: RunDeps): Promise<number> {
    assertRealSendAllowed(deps.env)
    const { replayable: pending, stale } = partitionPendingByAge(
        await deps.loadPendingBatches(),
        (deps.now ?? (() => new Date()))(),
    )
    reportStaleBatches(stale, deps)
    const pendingCount = pending.reduce((total, batch) => total + batch.items.length, 0)
    const eligible = await deps.loadRecipients()
    const runBatch = pickRunRecipients(eligible, options, pendingCount)
    if (pendingCount > 0) {
        deps.log(`Replaying ${pendingCount} recipients from interrupted batch(es) first`)
    }
    deps.log(
        `SEND SUMMARY: ${runBatch.length} of ${eligible.length} eligible recipients (cap ${options.dailyCap}, from ${deps.env.MAIL_FROM})`,
    )
    const summary = await sendInBatches(
        runBatch,
        {
            sendBatch: deps.sendBatch,
            reserveBatch: deps.reserveBatch,
            markBatchSent: deps.markBatchSent,
        },
        pending,
    )
    logSummary(summary, eligible.length + pendingCount, deps)
    return summary.failed.length > 0 || stale.length > 0 ? 1 : 0
}

/** Entry point shared by the script and tests; returns the process exit code. */
export async function runCli(argv: readonly string[], deps: RunDeps): Promise<number> {
    try {
        const options = parseCli(argv)
        const { mode } = options
        if (mode.kind === "dry-run") return await runDryRun(options, deps)
        if (mode.kind === "test") return await runTest(mode.to, deps)
        return await runSend(options, deps)
    } catch (error) {
        if (error instanceof CliError) {
            deps.log(`${error.message}\n${USAGE}`)
            return 2
        }
        throw error
    }
}

export const PLACEHOLDERS = {
    postalAddress: PLACEHOLDER_POSTAL_ADDRESS,
    unsubscribeUrl: PLACEHOLDER_UNSUBSCRIBE_URL,
} as const
