import { describe, expect, it } from 'vitest';

import { feedbackAlertSubject, feedbackDigestSubject } from './index.js';
import { renderFeedbackAlert, renderFeedbackDigest } from './render.js';
import type { FeedbackAlertData } from './FeedbackAlert.js';
import type { FeedbackDigestData } from './FeedbackDigest.js';

const alert: FeedbackAlertData = {
  type: 'bug',
  rating: 1,
  message: 'Broken <script>alert(1)</script> upscaler',
  userEmail: 'sam@example.com',
  route: '/create/image',
  plan: 'free',
  adminUrl: 'https://app.example.test/admin/feedback',
};

const digest: FeedbackDigestData = {
  periodLabel: 'Mar 3 - Mar 10',
  totalCount: 5,
  countByType: { rating: 3, idea: 2 },
  avgRating: 4.5,
  ratingTrend: 'up',
  ratingDelta: 0.5,
  newIdeas: [{ message: 'Zip export' }],
  quotes: [{ quote: 'Great tool', displayName: 'Sam' }],
  adminUrl: 'https://app.example.test/admin/feedback',
};

describe('renderFeedbackAlert', () => {
  it('renders the message, sender and admin link', async () => {
    const { html, text } = await renderFeedbackAlert(alert);
    expect(html).toContain('sam@example.com');
    expect(text).toContain('sam@example.com');
    expect(html).toContain(alert.adminUrl);
  });

  it('escapes user-supplied markup', async () => {
    const { html } = await renderFeedbackAlert(alert);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('builds a subject with rating and type', () => {
    expect(feedbackAlertSubject(alert)).toContain('1/5 bug');
    expect(feedbackAlertSubject({ type: 'bug' })).toContain('bug');
  });
});

describe('renderFeedbackDigest', () => {
  it('renders counts, trend, ideas, quotes and link', async () => {
    const { html, text } = await renderFeedbackDigest(digest);
    expect(text).toContain('5 new feedback items');
    expect(text).toContain('idea: 2');
    expect(text).toContain('4.5');
    expect(text).toContain('up 0.5');
    expect(text).toContain('Zip export');
    expect(text).toContain('Great tool');
    expect(html).toContain(digest.adminUrl);
  });

  it('handles an empty week', async () => {
    const { text } = await renderFeedbackDigest({
      ...digest,
      totalCount: 0,
      countByType: {},
      avgRating: null,
      ratingTrend: null,
      ratingDelta: null,
      newIdeas: [],
      quotes: [],
    });
    expect(text).toContain('Nothing new this week.');
    expect(text).toContain('No ratings this week.');
  });

  it('puts the total in the subject', () => {
    expect(feedbackDigestSubject(digest)).toContain('5 new');
  });
});
