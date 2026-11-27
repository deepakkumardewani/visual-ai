import { describe, expect, it } from 'vitest';

import type { AdminFeedbackFilters } from '@/types/feedback';
import { buildAdminQuery } from '@/utils/feedbackApi';

const base: AdminFeedbackFilters = {
  type: '',
  status: '',
  rating: '',
  from: '',
  to: '',
  testimonial: false,
  page: 1,
};

describe('buildAdminQuery', () => {
  it('sends only defined filters', () => {
    const params = new URLSearchParams(
      buildAdminQuery({ ...base, type: 'bug', testimonial: true }),
    );
    expect(params.get('type')).toBe('bug');
    expect(params.get('testimonial')).toBe('true');
    expect(params.has('status')).toBe(false);
    expect(params.has('rating')).toBe(false);
    expect(params.get('page')).toBe('1');
  });

  it('includes the whole `to` day', () => {
    const params = new URLSearchParams(
      buildAdminQuery({ ...base, from: '2026-01-10', to: '2026-01-10' }),
    );
    const from = new Date(params.get('from')!).getTime();
    const to = new Date(params.get('to')!).getTime();
    expect(to - from).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(params.get('to')).toBe(new Date('2026-01-10T23:59:59.999').toISOString());
  });

  it('ignores invalid dates instead of throwing', () => {
    let query = '';
    expect(() => {
      query = buildAdminQuery({ ...base, from: '202611-11-27', to: '+275760-99-99' });
    }).not.toThrow();
    const params = new URLSearchParams(query);
    expect(params.has('from')).toBe(false);
    expect(params.has('to')).toBe(false);
  });
});
