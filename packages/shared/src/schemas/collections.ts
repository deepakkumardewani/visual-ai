import { z } from 'zod';

const collectionNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be 60 characters or fewer');

const imageIdsSchema = z.array(z.string().min(1)).min(1, 'At least one image id is required');

export const CreateCollectionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  name: collectionNameSchema,
});

export type CreateCollectionRequest = z.infer<typeof CreateCollectionSchema>;

export const RenameCollectionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  name: collectionNameSchema,
});

export type RenameCollectionRequest = z.infer<typeof RenameCollectionSchema>;

export const CollectionMembershipSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  imageIds: imageIdsSchema,
});

export type CollectionMembershipRequest = z.infer<typeof CollectionMembershipSchema>;

export const ListCollectionsQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export type ListCollectionsQuery = z.infer<typeof ListCollectionsQuerySchema>;

export const DeleteCollectionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export type DeleteCollectionRequest = z.infer<typeof DeleteCollectionSchema>;
