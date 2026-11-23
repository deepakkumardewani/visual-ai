import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import StylePresets from '@/components/Song/StylePresets.vue';
import {
  SONG_EXAMPLE_IDEAS,
  SONG_SAMPLE_LOOP_URL,
  SONG_STYLE_CHIPS,
} from '@/components/Song/songPresets';

const sampleLoop = vi.hoisted(() => ({ url: '' }));

vi.mock('@/components/Song/songPresets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/Song/songPresets')>()),
  get SONG_SAMPLE_LOOP_URL() {
    return sampleLoop.url;
  },
}));

const mountPresets = (currentStyle = '') => mount(StylePresets, { props: { currentStyle } });

describe('StylePresets', () => {
  it('renders one chip per quick-start style', () => {
    const chips = mountPresets().findAll('[data-testid="style-chip"]');
    expect(chips.map((chip) => chip.text())).toEqual([...SONG_STYLE_CHIPS]);
  });

  it('emits the chip text when a chip is clicked', async () => {
    const wrapper = mountPresets();
    await wrapper.findAll('[data-testid="style-chip"]')[1]!.trigger('click');
    expect(wrapper.emitted('chip')).toEqual([['Synth-pop, dreamy']]);
  });

  it('marks only the chip matching the current style as pressed', () => {
    const chips = mountPresets('Jazz, smoky').findAll('[data-testid="style-chip"]');
    const pressed = chips.filter((chip) => chip.attributes('aria-pressed') === 'true');
    expect(pressed.map((chip) => chip.text())).toEqual(['Jazz, smoky']);
  });

  it('shows exactly three example ideas, each with genre and mood', () => {
    const ideas = mountPresets().findAll('[data-testid="song-example-idea"]');
    expect(ideas).toHaveLength(3);
    expect(ideas[0]!.text()).toContain('Road trip anthem');
    expect(ideas[0]!.text()).toContain('Indie rock, upbeat, windows down');
  });

  it('emits the full idea, including its lyrics seed, when an example is clicked', async () => {
    const wrapper = mountPresets();
    await wrapper.findAll('[data-testid="song-example-idea"]')[2]!.trigger('click');
    const [emitted] = wrapper.emitted('example')![0] as [(typeof SONG_EXAMPLE_IDEAS)[number]];
    expect(emitted.genre).toBe('Acoustic pop');
    expect(emitted.lyricsSeed).toContain('[Chorus]');
    expect(emitted.lyricsSeed.length).toBeGreaterThanOrEqual(10);
  });

  it('hides the sample loop row while no URL is configured (gap G14)', () => {
    expect(SONG_SAMPLE_LOOP_URL).toBe('');
    expect(mountPresets().find('[data-testid="song-sample-loop"]').exists()).toBe(false);
  });

  it('renders the sample loop through the shared track card once a URL is supplied', () => {
    sampleLoop.url = 'https://cdn.test/loop.mp3';
    const wrapper = mount(StylePresets, {
      props: { currentStyle: '' },
      global: {
        stubs: { TrackCard: { props: ['track'], template: '<div :data-title="track.title" />' } },
      },
    });
    const row = wrapper.find('[data-testid="song-sample-loop"]');
    expect(row.exists()).toBe(true);
    expect(row.attributes('data-title')).toBe('Sample song loop');
    sampleLoop.url = '';
  });
});
