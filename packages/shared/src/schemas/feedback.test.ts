import { describe, expect, it } from 'vitest';

import {
  FEEDBACK_ADMIN_MAX_PAGE,
  FEEDBACK_ADMIN_MAX_PAGE_SIZE,
  FEEDBACK_MESSAGE_MAX_LENGTH,
} from '../models/feedback.js';
import {
  AdminFeedbackQuerySchema,
  CreateFeedbackSchema,
  FeedbackContextSchema,
  FeedbackEligibilityRequestSchema,
  UpdateFeedbackAdminSchema,
} from './feedback.js';

describe('CreateFeedbackSchema', () => {
  it('accepts a popup rating alone', () => {
    expect(CreateFeedbackSchema.safeParse({ source: 'popup', rating: 5 }).success).toBe(true);
  });

  it('rejects a popup without a rating or with an out-of-range rating', () => {
    expect(CreateFeedbackSchema.safeParse({ source: 'popup' }).success).toBe(false);
    expect(CreateFeedbackSchema.safeParse({ source: 'popup', rating: 0 }).success).toBe(false);
    expect(CreateFeedbackSchema.safeParse({ source: 'popup', rating: 6 }).success).toBe(false);
    expect(CreateFeedbackSchema.safeParse({ source: 'popup', rating: 3.5 }).success).toBe(false);
  });

  it('requires a type and non-empty message for menu feedback', () => {
    expect(
      CreateFeedbackSchema.safeParse({ source: 'menu', type: 'bug', message: 'Broken' }).success,
    ).toBe(true);
    expect(
      CreateFeedbackSchema.safeParse({ source: 'menu', type: 'bug', message: '   ' }).success,
    ).toBe(false);
    expect(CreateFeedbackSchema.safeParse({ source: 'menu', message: 'x' }).success).toBe(false);
    expect(
      CreateFeedbackSchema.safeParse({ source: 'menu', type: 'rating', message: 'x' }).success,
    ).toBe(false);
  });

  it('trims and caps the message', () => {
    const parsed = CreateFeedbackSchema.parse({ source: 'popup', rating: 4, message: '  hi  ' });
    expect(parsed.message).toBe('hi');
    const tooLong = 'a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1);
    expect(
      CreateFeedbackSchema.safeParse({ source: 'popup', rating: 4, message: tooLong }).success,
    ).toBe(false);
  });

  it('rejects an unknown source', () => {
    expect(CreateFeedbackSchema.safeParse({ source: 'email', rating: 4 }).success).toBe(false);
  });
});

describe('FeedbackContextSchema', () => {
  it('accepts an empty context and a full one', () => {
    expect(FeedbackContextSchema.safeParse({}).success).toBe(true);
    expect(
      FeedbackContextSchema.safeParse({ route: '/a', viewport: { w: 1200, h: 800 } }).success,
    ).toBe(true);
  });

  it('caps string length and rejects bad viewports', () => {
    expect(FeedbackContextSchema.safeParse({ route: 'x'.repeat(301) }).success).toBe(false);
    expect(FeedbackContextSchema.safeParse({ viewport: { w: -1, h: 5 } }).success).toBe(false);
  });
});

describe('FeedbackEligibilityRequestSchema', () => {
  it('accepts known triggers only', () => {
    expect(FeedbackEligibilityRequestSchema.safeParse({ trigger: 'download' }).success).toBe(true);
    expect(FeedbackEligibilityRequestSchema.safeParse({ trigger: 'other' }).success).toBe(false);
  });
});

describe('UpdateFeedbackAdminSchema', () => {
  it('accepts status and note, rejects unknown status', () => {
    expect(
      UpdateFeedbackAdminSchema.safeParse({ status: 'planned', adminNote: 'ok' }).success,
    ).toBe(true);
    expect(UpdateFeedbackAdminSchema.safeParse({ status: 'nope' }).success).toBe(false);
  });
});

describe('AdminFeedbackQuerySchema', () => {
  it('applies defaults and coerces query strings', () => {
    const parsed = AdminFeedbackQuerySchema.parse({
      rating: '2',
      testimonial: 'true',
      from: '2026-01-01',
    });
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBeGreaterThan(0);
    expect(parsed.rating).toBe(2);
    expect(parsed.testimonial).toBe(true);
    expect(parsed.from).toBeInstanceOf(Date);
  });

  it('caps the page number', () => {
    expect(
      AdminFeedbackQuerySchema.safeParse({ page: String(FEEDBACK_ADMIN_MAX_PAGE) }).success,
    ).toBe(true);
    expect(
      AdminFeedbackQuerySchema.safeParse({ page: String(FEEDBACK_ADMIN_MAX_PAGE + 1) }).success,
    ).toBe(false);
    expect(AdminFeedbackQuerySchema.safeParse({ page: '1e300' }).success).toBe(false);
  });

  it('caps the page size', () => {
    expect(
      AdminFeedbackQuerySchema.safeParse({ limit: String(FEEDBACK_ADMIN_MAX_PAGE_SIZE + 1) })
        .success,
    ).toBe(false);
  });
});
