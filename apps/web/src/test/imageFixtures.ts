import { FeatureType, type IImage, type IImageObject } from '@visual-ai/shared';

export const DEFAULT_TEST_IMAGE: IImage = {
  name: 'test-image',
  resolution: '1024x1024',
  aspectRatio: '1:1',
  width: 1024,
  height: 1024,
  format: 'png',
  bytes: 0,
};

export type ImageObjectTestOverrides = {
  [K in keyof IImageObject]?: K extends 'createdAt'
    ? Date | string
    : K extends 'images'
      ? Array<Partial<IImage> | IImage>
      : IImageObject[K];
};

/** Builds a typed history/explore row for component tests (accepts ISO date strings and partial images). */
export function makeImageObject(overrides: ImageObjectTestOverrides = {}): IImageObject {
  const { createdAt, images, featureType, ...rest } = overrides;
  const hasImages = Object.prototype.hasOwnProperty.call(overrides, 'images');
  const hasId = Object.prototype.hasOwnProperty.call(overrides, '_id');

  return {
    _id: hasId ? overrides._id : 'one',
    userId: 'user_test',
    prompt: 'A fox in neon rain',
    featureType: featureType ?? FeatureType.IMAGE,
    isFavorite: false,
    createdAt:
      createdAt === undefined
        ? new Date('2026-01-02T10:00:00.000Z')
        : typeof createdAt === 'string'
          ? new Date(createdAt)
          : createdAt,
    images: hasImages
      ? (images ?? []).map((img) => ({
          ...DEFAULT_TEST_IMAGE,
          ...img,
        }))
      : [
          {
            ...DEFAULT_TEST_IMAGE,
            aiImagePublicId: 'pub/test',
          },
        ],
    ...rest,
  };
}
