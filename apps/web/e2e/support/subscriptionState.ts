import { CURRENT_INTRO_VERSION } from '@visual-ai/shared';
import mongoose from 'mongoose';

import { mongoUri } from './legacyUser';

const USERS_COLLECTION = 'users';

/**
 * Puts the shared E2E user back on the free plan with no stored subscription (Mongo-direct).
 * Also marks the V2 intro as seen: its modal backdrop otherwise blocks every studio click.
 */
export async function resetToFree(userId: string): Promise<void> {
  const conn = await mongoose.createConnection(mongoUri()).asPromise();
  try {
    const result = await conn.collection(USERS_COLLECTION).updateOne(
      { userId },
      {
        $set: { plan: 'free', seenIntroVersion: CURRENT_INTRO_VERSION },
        $unset: { subscription: '' },
      },
    );
    if (result.matchedCount !== 1) {
      throw new Error(`[e2e] resetToFree: user ${userId} not found`);
    }
  } finally {
    await conn.close();
  }
}
