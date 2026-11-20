import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PricingCreditStory from '@/components/Pricing/PricingCreditStory.vue';

describe('PricingCreditStory', () => {
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TZ;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('shows the local reset time in the daily credits beat', () => {
    process.env.TZ = 'Asia/Kolkata';
    const wrapper = mount(PricingCreditStory);
    const row = wrapper.findAll('.story__row')[0];

    expect(row.text()).toContain('Daily Credits');
    expect(row.text()).toMatch(/Resets daily at 5:30\sAM in your local time/i);
    expect(row.text()).toContain('do not roll over');
  });

  it('reflects a different time zone offset', () => {
    process.env.TZ = 'America/New_York';
    const wrapper = mount(PricingCreditStory);
    expect(wrapper.text()).toMatch(/Resets daily at 8:00\sPM in your local time/i);
  });

  it('describes persistent credits and pay-per-use beats', () => {
    const rows = mount(PricingCreditStory).findAll('.story__row');

    expect(rows).toHaveLength(3);
    expect(rows[1].text()).toContain('Persistent Credits');
    expect(rows[1].text()).toContain('never expire');
    expect(rows[2].text()).toContain('Pay Per Use');
  });
});
