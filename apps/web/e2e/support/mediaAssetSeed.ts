import mongoose from 'mongoose';

import { mongoUri } from './legacyUser';

const MEDIA_ASSETS_COLLECTION = 'mediaassets';

export type SeedAudioAssetOptions = {
  userId: string;
  /** Unique per test so parallel or repeated runs never collide on the unique jobId index. */
  token: string;
  durationSec: number;
};

export type SeededAsset = { id: string; title: string };

/** Opens one Mongo connection for the callback and always closes it. */
async function withMediaAssets<T>(fn: (assets: mongoose.mongo.Collection) => Promise<T>) {
  const conn = await mongoose.createConnection(mongoUri()).asPromise();
  try {
    return await fn(conn.collection(MEDIA_ASSETS_COLLECTION));
  } finally {
    await conn.close();
  }
}

/** Inserts one saved audio asset Mongo-direct, shaped like a finished fake music job. */
export async function seedAudioAsset(options: SeedAudioAssetOptions): Promise<SeededAsset> {
  const title = `e2e-media-${options.token}`;
  const doc = {
    userId: options.userId,
    type: 'audio',
    feature: 'music',
    modelKey: 'LYRIA_2',
    title,
    url: `https://res.cloudinary.com/e2e-mock-guard/video/upload/e2e/${title}.mp3`,
    publicId: '',
    resourceType: 'video',
    prompt: title,
    durationSec: options.durationSec,
    jobId: `job-${options.token}`,
    creditsCharged: 0,
    saved: true,
    createdAt: new Date(),
  };
  const { insertedId } = await withMediaAssets((assets) => assets.insertOne(doc));
  return { id: insertedId.toString(), title };
}

export async function deleteAudioAsset(id: string): Promise<void> {
  await withMediaAssets((assets) => assets.deleteOne({ _id: new mongoose.Types.ObjectId(id) }));
}
