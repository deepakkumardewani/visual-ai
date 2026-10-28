import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const preference = vi.hoisted(() => ({ value: 'no-preference' as 'no-preference' | 'reduce' }));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    usePreferredReducedMotion: () => preference,
  };
});

import Waveform from '@/components/Dashboard/Composer/VoiceInput/Waveform.vue';

describe('Waveform', () => {
  beforeEach(() => {
    preference.value = 'no-preference';
  });

  it('renders reactive bars when motion is allowed and reactiveWaveform is true', () => {
    const wrapper = mount(Waveform, {
      props: { level: 0.5, reactiveWaveform: true },
    });
    const root = wrapper.get('[data-testid="voice-waveform"]');
    const bars = root.findAll('span');
    expect(bars).toHaveLength(5);
    expect(bars[0].attributes('style')).toContain('height:');
  });

  it('clamps bar heights using level and index offset', () => {
    const wrapper = mount(Waveform, {
      props: { level: 0, reactiveWaveform: true },
    });
    const bars = wrapper.get('[data-testid="voice-waveform"]').findAll('span');
    // center bar uses max(0.12, level) => 12%
    expect(bars[2].attributes('style')).toBe('height: 12%;');
    // edge bar uses max(0.12, level - 0.16) => 12%
    expect(bars[0].attributes('style')).toBe('height: 12%;');
  });

  it('caps bar height at 100% for high levels', () => {
    const wrapper = mount(Waveform, {
      props: { level: 0.95, reactiveWaveform: true },
    });
    const bars = wrapper.get('[data-testid="voice-waveform"]').findAll('span');
    expect(bars[4].attributes('style')).toBe('height: 100%;');
  });

  it('returns no bar heights when reactiveWaveform is false', () => {
    const wrapper = mount(Waveform, {
      props: { level: 0.8, reactiveWaveform: false },
    });
    expect(wrapper.get('[data-testid="voice-waveform"]').findAll('span')).toHaveLength(1);
  });

  it('renders the static level meter when reactiveWaveform is false', () => {
    const wrapper = mount(Waveform, {
      props: { level: 0.4, reactiveWaveform: false },
    });
    const root = wrapper.get('[data-testid="voice-waveform"]');
    expect(root.findAll('span')).toHaveLength(1);
    expect(root.find('span').attributes('style')).toBe('opacity: 0.61;');
  });

  it('renders the static level meter when reduced motion is preferred', () => {
    preference.value = 'reduce';
    const wrapper = mount(Waveform, {
      props: { level: 0.2, reactiveWaveform: true },
    });
    const root = wrapper.get('[data-testid="voice-waveform"]');
    expect(root.findAll('span')).toHaveLength(1);
    expect(root.find('span').attributes('style')).toBe('opacity: 0.48;');
  });

  it('uses the static meter path when reactiveWaveform is false regardless of motion preference', () => {
    preference.value = 'no-preference';
    const wrapper = mount(Waveform, {
      props: { level: 0.15, reactiveWaveform: false },
    });
    const root = wrapper.get('[data-testid="voice-waveform"]');
    expect(root.findAll('span')).toHaveLength(1);
    expect(root.find('span').attributes('style')).toBe('opacity: 0.4475;');
  });
});
