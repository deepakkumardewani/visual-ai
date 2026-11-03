import { resolve } from 'node:path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

const USERS_COLLECTION = 'users';
const API_ENV_PATH = resolve(process.cwd(), '../api/.env');

function mongoUri(): string {
  const parsed = dotenv.config({
    path: API_ENV_PATH,
    processEnv: {},
    quiet: true,
  }).parsed;
  const uri = process.env.MONGO_URI ?? parsed?.MONGO_URI;
  if (!uri) {
    throw new Error(`[e2e] MONGO_URI missing (looked in ${API_ENV_PATH})`);
  }
  return uri;
}

/**
 * A throwaway user inserted straight into Mongo (bypassing mongoose defaults) so it has no
 * `plan` or `subscription` fields, like users created before the Pro tier existed.
 */
export async function withLegacyUser<T>(
  fn: (user: {
    userId: string;
    rawDoc: () => Promise<Record<string, unknown> | null>;
  }) => Promise<T>,
): Promise<T> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userId = `e2e_legacy_${suffix}`;
  const conn = await mongoose.createConnection(mongoUri()).asPromise();
  const users = conn.collection(USERS_COLLECTION);
  try {
    await users.insertOne({
      userId,
      userName: userId,
      email: `${userId}@e2e.invalid`,
      referrals: [],
      history: [],
    });
    return await fn({ userId, rawDoc: () => users.findOne({ userId }) });
  } finally {
    await users.deleteOne({ userId });
    await conn.close();
  }
}
