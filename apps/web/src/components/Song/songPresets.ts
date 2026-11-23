import { SONG_LYRICS_LIMITS, SONG_PROMPT_LIMITS } from '@visual-ai/shared';

export interface SongExampleIdea {
  id: string;
  label: string;
  genre: string;
  mood: string;
  lyricsSeed: string;
}

/** Quick-start styles; picking one fills the style field with `genre, mood`. */
export const SONG_STYLE_CHIPS = [
  'Indie folk, warm',
  'Synth-pop, dreamy',
  'Lo-fi hip hop, mellow',
  'Rock ballad, soaring',
  'Jazz, smoky',
  'Acoustic pop, hopeful',
] as const;

export const SONG_EXAMPLE_IDEAS: readonly SongExampleIdea[] = [
  {
    id: 'road-trip',
    label: 'Road trip anthem',
    genre: 'Indie rock',
    mood: 'upbeat, windows down',
    lyricsSeed:
      '[Verse]\nMap folded on the dashboard, sun low on the glass\n[Chorus]\nKeep driving, keep driving, let the miles go past',
  },
  {
    id: 'rainy-night',
    label: 'Rainy night lullaby',
    genre: 'Lo-fi piano',
    mood: 'soft, sleepy',
    lyricsSeed:
      '[Verse]\nRain on the window, the city hums low\n[Chorus]\nClose your eyes now, let the quiet grow',
  },
  {
    id: 'birthday',
    label: 'Birthday song for a friend',
    genre: 'Acoustic pop',
    mood: 'joyful, singalong',
    lyricsSeed:
      '[Verse]\nAnother year around the sun, you wear it well\n[Chorus]\nHappy birthday to you, the best story I tell',
  },
];

/** Gap G14: the sample loop row stays hidden until the owner supplies a URL. */
export const SONG_SAMPLE_LOOP_URL = '';

/** Why Generate is off, or '' when both fields are valid. */
export function songDisabledReason(promptText: string, lyricsText: string): string {
  if (promptText.trim().length < SONG_PROMPT_LIMITS.min) {
    return `Describe the style in at least ${SONG_PROMPT_LIMITS.min} characters.`;
  }
  if (lyricsText.trim().length < SONG_LYRICS_LIMITS.min) {
    return `Write at least ${SONG_LYRICS_LIMITS.min} characters of lyrics.`;
  }
  if (lyricsText.length > SONG_LYRICS_LIMITS.max) {
    return `Lyrics are over ${SONG_LYRICS_LIMITS.max} characters. Use AI help > Fit to limit.`;
  }
  return '';
}
