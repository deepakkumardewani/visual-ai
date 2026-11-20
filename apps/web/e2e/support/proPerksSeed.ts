import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';
import mongoose from 'mongoose';

import type { IImageObject } from '@visual-ai/shared';

import { E2E_WEB_ORIGIN, requireEnv } from './env';
import { mongoUri } from './legacyUser';

const USERS_COLLECTION = 'users';
const PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// Explore sorts newest first; seeding in the future keeps seeded items on the first page.
const FUTURE_OFFSET_MS = DAY_MS;

export const MOCK_CLOUD_UPLOAD = 'https://res.cloudinary.com/e2e-mock-guard/image/upload';

export type SeedImageOptions = {
  prompt: string;
  /** Omit to create a legacy doc that predates the `isPrivate` field. */
  isPrivate?: boolean;
  /** Cloudinary public id, also the stored original URL's file name. */
  publicId: string;
};

export type SeededImage = { id: string; originalUrl: string; prompt: string };

export function uniqueToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 10);
}

function buildHistoryEntry(options: SeedImageOptions, createdAt: Date) {
  const _id = new mongoose.Types.ObjectId();
  const originalUrl = `${MOCK_CLOUD_UPLOAD}/${options.publicId}.png`;
  return {
    entry: {
      _id,
      prompt: options.prompt,
      featureType: 'image',
      isFavorite: false,
      createdAt,
      modelName: 'E2E Seed',
      imageType: 'horizontal',
      ...(options.isPrivate === undefined ? {} : { isPrivate: options.isPrivate }),
      images: [
        {
          name: `${options.publicId}.png`,
          aiImageUrl: originalUrl,
          aiImagePublicId: options.publicId,
          resolution: '1024x1024',
          aspectRatio: '1:1',
          width: 1024,
          height: 1024,
          format: 'png',
          bytes: 1000,
        },
      ],
    },
    seeded: { id: _id.toString(), originalUrl, prompt: options.prompt },
  };
}

/** Opens one Mongo connection for the callback and always closes it. */
export async function withUsers<T>(fn: (users: mongoose.mongo.Collection) => Promise<T>) {
  const conn = await mongoose.createConnection(mongoUri()).asPromise();
  try {
    return await fn(conn.collection(USERS_COLLECTION));
  } finally {
    await conn.close();
  }
}

export type CreditBalance = { credits: number; dailyCredits: number };

export async function readCredits(userId: string): Promise<CreditBalance> {
  return withUsers(async (users) => {
    const doc = await users.findOne({ userId }, { projection: { credits: 1, dailyCredits: 1 } });
    if (!doc) throw new Error(`[e2e] user ${userId} not found`);
    return { credits: doc.credits as number, dailyCredits: (doc.dailyCredits as number) ?? 0 };
  });
}

/** Active Pro subscription written Mongo-direct, as the webhook would leave it. */
export async function makePro(userId: string): Promise<void> {
  await withUsers(async (users) => {
    const result = await users.updateOne(
      { userId },
      {
        $set: {
          plan: 'pro',
          subscription: {
            providerSubscriptionId: `sub_e2e_${uniqueToken()}`,
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + PERIOD_DAYS * DAY_MS),
            cancelAtPeriodEnd: false,
          },
        },
      },
    );
    if (result.matchedCount !== 1) throw new Error(`[e2e] makePro: user ${userId} not found`);
  });
}

/** Pushes one history entry onto an existing user and returns its id and stored URL. */
export async function pushHistoryImage(
  userId: string,
  options: SeedImageOptions,
): Promise<SeededImage> {
  const { entry, seeded } = buildHistoryEntry(options, new Date());
  await withUsers((users) => users.updateOne({ userId }, { $push: { history: entry } }));
  return seeded;
}

export type HistorySnapshot = { history: unknown[] };

/**
 * Replaces the user's whole history with `count` seeded entries (Mongo-direct) so the history-full
 * level is deterministic regardless of what the shared account already holds. Returns a snapshot
 * for `restoreHistory`; callers must restore it in a finally/afterEach.
 */
export async function replaceHistoryWithSeed(
  userId: string,
  count: number,
  token: string,
): Promise<HistorySnapshot> {
  const createdAt = new Date();
  const entries = Array.from(
    { length: count },
    (_, index) =>
      buildHistoryEntry(
        {
          prompt: `hist ${index} ${token}`,
          isPrivate: false,
          publicId: `e2e/hist_${index}_${token}`,
        },
        createdAt,
      ).entry,
  );
  return withUsers(async (users) => {
    const doc = await users.findOne({ userId }, { projection: { history: 1 } });
    if (!doc) throw new Error(`[e2e] user ${userId} not found`);
    await users.updateOne({ userId }, { $set: { history: entries } });
    return { history: (doc.history as unknown[]) ?? [] };
  });
}

export async function restoreHistory(userId: string, snapshot: HistorySnapshot): Promise<void> {
  await withUsers((users) => users.updateOne({ userId }, { $set: { history: snapshot.history } }));
}

export async function pullHistoryImages(userId: string, ids: string[]): Promise<void> {
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  await withUsers((users) =>
    users.updateOne({ userId }, { $pull: { history: { _id: { $in: objectIds } } } }),
  );
}

export type ExploreSeed = {
  userIds: string[];
  privateItem: SeededImage;
  legacyItem: SeededImage;
  publicItem: SeededImage;
};

/**
 * Three throwaway users (Pro-to-be private, legacy without the field, free public), one image
 * each. Plans are never written as Pro here: callers upgrade `userIds[0]` via the signed webhook.
 */
export async function seedExploreUsers(token: string): Promise<ExploreSeed> {
  const createdAt = new Date(Date.now() + FUTURE_OFFSET_MS);
  const privateImg = buildHistoryEntry(
    { prompt: `private pro ${token}`, isPrivate: true, publicId: `e2e/priv_${token}` },
    createdAt,
  );
  const legacyImg = buildHistoryEntry(
    { prompt: `legacy ${token}`, publicId: `e2e/legacy_${token}` },
    createdAt,
  );
  const publicImg = buildHistoryEntry(
    { prompt: `public free ${token}`, isPrivate: false, publicId: `e2e/pub_${token}` },
    createdAt,
  );
  const rows = [
    { suffix: 'pro', img: privateImg, plan: 'free' },
    { suffix: 'legacy', img: legacyImg, plan: undefined },
    { suffix: 'free', img: publicImg, plan: 'free' },
  ];
  const userIds = rows.map((row) => `e2e_explore_${row.suffix}_${token}`);

  await withUsers(async (users) => {
    await users.insertMany(
      rows.map((row, index) => ({
        userId: userIds[index],
        userName: userIds[index],
        email: `${userIds[index]}@e2e.invalid`,
        referrals: [],
        ...(row.plan ? { plan: row.plan } : {}),
        history: [row.img.entry],
      })),
    );
  });

  return {
    userIds,
    privateItem: privateImg.seeded,
    legacyItem: legacyImg.seeded,
    publicItem: publicImg.seeded,
  };
}

export async function deleteUsers(userIds: string[]): Promise<void> {
  await withUsers((users) => users.deleteMany({ userId: { $in: userIds } }));
}

export async function readPlan(userId: string): Promise<string | undefined> {
  return withUsers(async (users) => {
    const doc = await users.findOne({ userId }, { projection: { plan: 1 } });
    return doc?.plan as string | undefined;
  });
}
const USER_PROFILE_URL = /\/users\/user_/;
const PROGRESS_URL = /\/progress\?jobId=/;
const STUDIO_CREDITS = 500;
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** Stubs an at-cap generation's progress (POST /generate/image comes from generationStub): the API's completed payload with no _id and savedToHistory false. */
export async function stubUnsavedGeneration(page: Page, prompt: string) {
  const e2eUserId = requireEnv('E2E_CLERK_USER_ID');
  const replicateUrl = `https://replicate.delivery/e2e/${uniqueToken()}/out.png`;
  await page.route(USER_PROFILE_URL, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const user = (await response.json()) as Record<string, unknown>;
    return route.fulfill({
      response,
      json: { ...user, credits: STUDIO_CREDITS, dailyCredits: 0 },
    });
  });
  await page.route('https://replicate.delivery/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: Buffer.from(PNG_BASE64, 'base64'),
    }),
  );
  await page.route(PROGRESS_URL, (route) => {
    const image: Omit<IImageObject, '_id' | 'createdAt' | 'featureType'> & {
      featureType: string;
      createdAt: string;
    } = {
      userId: e2eUserId,
      prompt,
      featureType: 'image',
      createdAt: new Date().toISOString(),
      modelName: 'E2E Stub',
      imageType: 'horizontal',
      images: [
        {
          name: 'unsaved',
          aiImageUrl: replicateUrl,
          resolution: '1x1',
          aspectRatio: '16:9',
          width: 1,
          height: 1,
          format: 'png',
          bytes: 70,
        },
      ],
    };
    const body = { status: 'completed', image, userCreditsRemaining: 10, savedToHistory: false };
    return route.fulfill({
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });
}
