import { z } from 'zod';

import {
  FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE,
  FEEDBACK_ADMIN_MAX_PAGE,
  FEEDBACK_ADMIN_MAX_PAGE_SIZE,
  FEEDBACK_ADMIN_NOTE_MAX_LENGTH,
  FEEDBACK_CONTEXT_STRING_MAX_LENGTH,
  FEEDBACK_DISPLAY_NAME_MAX_LENGTH,
  FEEDBACK_MENU_TYPES,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_RATING_MAX,
  FEEDBACK_RATING_MIN,
  FEEDBACK_STATUSES,
  FEEDBACK_TRIGGERS,
  FEEDBACK_TYPES,
  FEEDBACK_VIEWPORT_MAX,
} from '../models/feedback.js';

const contextString = z.string().trim().max(FEEDBACK_CONTEXT_STRING_MAX_LENGTH).optional();
const viewportDimension = z.number().int().positive().max(FEEDBACK_VIEWPORT_MAX);

export const FeedbackContextSchema = z.object({
  route: contextString,
  lastModelId: contextString,
  plan: contextString,
  creditsTier: contextString,
  appVersion: contextString,
  userAgent: contextString,
  viewport: z.object({ w: viewportDimension, h: viewportDimension }).optional(),
});

const ratingField = z.number().int().min(FEEDBACK_RATING_MIN).max(FEEDBACK_RATING_MAX);
const messageField = z.string().trim().max(FEEDBACK_MESSAGE_MAX_LENGTH);

const PopupFeedbackSchema = z.object({
  source: z.literal('popup'),
  rating: ratingField,
  message: messageField.optional(),
  testimonialConsent: z.boolean().optional(),
  displayName: z.string().trim().max(FEEDBACK_DISPLAY_NAME_MAX_LENGTH).optional(),
  context: FeedbackContextSchema.optional(),
});

const MenuFeedbackSchema = z.object({
  source: z.literal('menu'),
  type: z.enum(FEEDBACK_MENU_TYPES),
  message: messageField.min(1, 'Message is required'),
  context: FeedbackContextSchema.optional(),
});

export const CreateFeedbackSchema = z.discriminatedUnion('source', [
  PopupFeedbackSchema,
  MenuFeedbackSchema,
]);

export const FeedbackEligibilityRequestSchema = z.object({
  trigger: z.enum(FEEDBACK_TRIGGERS),
});

export const UpdateFeedbackAdminSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  adminNote: z.string().trim().max(FEEDBACK_ADMIN_NOTE_MAX_LENGTH).optional(),
});

export const AdminFeedbackQuerySchema = z.object({
  type: z.enum(FEEDBACK_TYPES).optional(),
  status: z.enum(FEEDBACK_STATUSES).optional(),
  rating: z.coerce.number().int().min(FEEDBACK_RATING_MIN).max(FEEDBACK_RATING_MAX).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  testimonial: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).max(FEEDBACK_ADMIN_MAX_PAGE).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(FEEDBACK_ADMIN_MAX_PAGE_SIZE)
    .default(FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE),
});

export type FeedbackContext = z.infer<typeof FeedbackContextSchema>;
export type CreateFeedbackRequest = z.infer<typeof CreateFeedbackSchema>;
export type FeedbackEligibilityRequest = z.infer<typeof FeedbackEligibilityRequestSchema>;
export type UpdateFeedbackAdminRequest = z.infer<typeof UpdateFeedbackAdminSchema>;
export type AdminFeedbackQuery = z.infer<typeof AdminFeedbackQuerySchema>;
