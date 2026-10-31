import { createHmac } from 'node:crypto';
import { resolve } from 'node:path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { requireEnv } from './env';

// Same wire format as apps/api/src/lib/unsubscribe-token.ts (base64url(`userId.purpose`) + "." + base64url(hmac)).
const PURPOSE = 'unsubscribe';
const USERS_COLLECTION = 'users';
const API_ENV_PATH = resolve(process.cwd(), '../api/.env');

export function signUnsubscribeToken(userId: string): string {
  const payload = Buffer.from(`${userId}.${PURPOSE}`).toString('base64url');
  const signature = createHmac('sha256', requireEnv('UNSUBSCRIBE_SECRET'))
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

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

/** A throwaway Mongo user row so the opt-out write is observable and never touches the shared e2e user. */
export async function withTempUser<T>(
  fn: (user: { userId: string; isOptedOut: () => Promise<boolean> }) => Promise<T>,
): Promise<T> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userId = `e2e_unsub_${suffix}`;
  const conn = await mongoose.createConnection(mongoUri()).asPromise();
  const users = conn.collection(USERS_COLLECTION);
  try {
    await users.insertOne({
      userId,
      userName: userId,
      email: `${userId}@e2e.invalid`,
      emailOptOut: false,
      referrals: [],
      history: [],
    });
    return await fn({
      userId,
      isOptedOut: async () => (await users.findOne({ userId }))?.emailOptOut === true,
    });
  } finally {
    await users.deleteOne({ userId });
    await conn.close();
  }
}
