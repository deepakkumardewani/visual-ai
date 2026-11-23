import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JobProgress from '@/components/Studio/JobProgress.vue';
import jobProgressSource from '@/components/Studio/JobProgress.vue?raw';

let wrapper: VueWrapper | undefined;

const timeText = () => wrapper!.get('[data-testid="time-code"]').text();

describe('JobProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.useRealTimers();
  });

  it('announces the stage copy in a status region', () => {
    wrapper = mount(JobProgress, { props: { stage: 'mastering', elapsedMs: 0 } });

    const status = wrapper.get('[role="status"]');
    expect(status.text()).toBe('Mastering');
    expect(status.attributes('data-testid')).toBe('job-progress-stage');
  });

  it('tells the user they can leave the page', () => {
    wrapper = mount(JobProgress, { props: { stage: 'queued', elapsedMs: 0 } });

    expect(wrapper.text()).toContain('You can leave this page; it will appear in History.');
  });

  it('shows the server elapsed time and keeps counting every second', async () => {
    wrapper = mount(JobProgress, { props: { stage: 'composing', elapsedMs: 12_000 } });
    expect(timeText()).toBe('0:12');

    await vi.advanceTimersByTimeAsync(3000);

    expect(timeText()).toBe('0:15');
  });

  it('re-bases the clock on a new server report instead of double counting', async () => {
    wrapper = mount(JobProgress, { props: { stage: 'composing', elapsedMs: 5000 } });
    await vi.advanceTimersByTimeAsync(4000);
    expect(timeText()).toBe('0:09');

    await wrapper.setProps({ elapsedMs: 8000 });

    expect(timeText()).toBe('0:08');
  });

  it('hides the ticking clock from assistive tech so only the stage is read out', () => {
    wrapper = mount(JobProgress, { props: { stage: 'saving', elapsedMs: 0 } });

    expect(
      wrapper.get('[data-testid="time-code"]').element.closest('[aria-hidden="true"]'),
    ).not.toBeNull();
    expect(wrapper.get('.job-progress__track').attributes('aria-hidden')).toBe('true');
  });

  it('stops the shimmer animation under prefers-reduced-motion', () => {
    const reducedBlock =
      jobProgressSource.split('@media (prefers-reduced-motion: reduce)')[1] ?? '';

    expect(reducedBlock).toContain('animation: none');
  });
});
