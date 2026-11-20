#!/usr/bin/env node
// Fails when the production Cloudinary cloud name appears in any env file that is not
// a `.env.production*` file, so dev, e2e and staging never spend production quota.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_CLOUD_NAME = 'ddzuitkzt';
const ENV_FILE_PATTERN = /^\.env(\..+)?$/;
const PRODUCTION_FILE_PATTERN = /^\.env\.production/;

const appsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_ENV_DIRS = [path.join(appsDir, 'web'), path.join(appsDir, 'api')];

/** Returns paths of non-production env files containing the production cloud name. */
export function findLeakingEnvFiles(dirs = DEFAULT_ENV_DIRS) {
  const leaks = [];
  for (const dir of dirs) {
    let names;
    try {
      names = readdirSync(dir);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const name of names) {
      if (!ENV_FILE_PATTERN.test(name) || PRODUCTION_FILE_PATTERN.test(name)) continue;
      const file = path.join(dir, name);
      if (readFileSync(file, 'utf8').includes(PRODUCTION_CLOUD_NAME)) leaks.push(file);
    }
  }
  return leaks;
}

/** Prints the result and returns the process exit code. */
export function run(dirs) {
  const leaks = findLeakingEnvFiles(dirs);
  if (leaks.length === 0) {
    console.log('OK: no non-production env file references the production Cloudinary cloud.');
    return 0;
  }
  console.error(
    `Production Cloudinary cloud "${PRODUCTION_CLOUD_NAME}" found in non-production env files:`,
  );
  for (const file of leaks) console.error(`  - ${file}`);
  console.error(
    'Repoint them to the dev cloud (see agent_docs/cloudinary-cost-and-pro/GO-LIVE.md).',
  );
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(run());
