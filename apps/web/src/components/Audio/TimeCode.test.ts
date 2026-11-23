import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TimeCode from '@/components/Audio/TimeCode.vue';

const render = (seconds: number) => mount(TimeCode, { props: { seconds } });

describe('TimeCode', () => {
  it.each([
    [0, '0:00'],
    [5.9, '0:05'],
    [65, '1:05'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
  ])('formats %s seconds as %s', (seconds, text) => {
    expect(render(seconds).text()).toBe(text);
  });

  it.each([[-4], [Number.NaN], [Number.POSITIVE_INFINITY]])('reads %s as 0:00', (seconds) => {
    expect(render(seconds).text()).toBe('0:00');
  });

  it('exposes a machine-readable duration on a time element', () => {
    const time = render(75.8).get('time');

    expect(time.attributes('datetime')).toBe('PT75S');
    expect(time.classes()).toContain('tw-tabular-nums');
  });
});
