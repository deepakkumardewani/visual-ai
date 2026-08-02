import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_FEED,
  getCommunityFeedItem,
  type CommunityFeedItem,
} from '@/utils/communityMock';

describe('communityMock', () => {
  it('exports 8–12 typed feed items with required fields', () => {
    expect(COMMUNITY_FEED.length).toBeGreaterThanOrEqual(8);
    expect(COMMUNITY_FEED.length).toBeLessThanOrEqual(12);

    for (const item of COMMUNITY_FEED) {
      expect(item.id).toBeTruthy();
      expect(item.imageUrl).toMatch(/^https:\/\//);
      expect(item.author).toBeTruthy();
      expect(item.authorUserId).toBeTruthy();
      expect(item.prompt).toBeTruthy();
      expect(item.aspectRatio).toMatch(/^\d+:\d+$/);
      expect(item.createdAt).toBeTruthy();
    }
  });

  it('returns a feed item by id', () => {
    const first = COMMUNITY_FEED[0];
    expect(getCommunityFeedItem(first.id)).toEqual(first);
  });

  it('returns undefined for unknown id', () => {
    expect(getCommunityFeedItem('missing-id')).toBeUndefined();
  });

  it('uses unique ids across the feed', () => {
    const ids = COMMUNITY_FEED.map((item: CommunityFeedItem) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
