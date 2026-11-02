import type { HighlightProps } from './components/Highlight.js';

export type HighlightData = Omit<HighlightProps, 'eyebrow'>;

/**
 * Titles mirror the in-app What's New modal (apps/web/src/components/Intro/slides.ts);
 * V2Announcement.test.ts fails if the two drift apart.
 */
export const DASHBOARD_FEATURE = {
  image: 'dashboard.jpg',
  alt: 'The new Create studio with model, style and size controls beside your results',
  title: 'New dashboard',
  description: 'A cleaner studio with Create, Explore and Assets in one place.',
} as const satisfies HighlightData;

export const HIGHLIGHTS: readonly HighlightData[] = [
  {
    image: 'models.png',
    alt: 'Model picker listing the new image models',
    title: 'New models',
    description: 'More image models to pick from, each tuned for a different look.',
  },
  {
    image: 'styles.png',
    alt: 'Style picker with thumbnails of each style',
    title: 'Style picker',
    description: 'Apply a style in one click and see it on a thumbnail first.',
  },
  {
    image: 'sizes.png',
    alt: 'Aspect ratio options in the sidebar',
    title: 'More sizes',
    description: 'Choose from more aspect ratios for posts, wallpapers and prints.',
  },
  {
    image: 'voice.jpg',
    alt: 'Prompt bar with the microphone button next to the Generate button',
    title: 'Voice dictation',
    description: 'Tap the mic and say your prompt instead of typing it.',
  },
  {
    image: 'prompts.jpg',
    alt: 'Prompt tools menu with improve, random, describe and save actions',
    title: 'Improve, generate and save prompts',
    description: 'Polish a prompt, get a fresh idea, or save your favourites for later.',
  },
  {
    image: 'explore.jpg',
    alt: 'The Explore feed of community creations',
    title: 'Explore',
    description: 'Browse what the community is creating and remix what inspires you.',
  },
  {
    image: 'tools.jpg',
    alt: 'Tools row under a generated image, from Download to Remove background',
    title: 'Tools',
    description: 'Upscale or remove the background from any image, right under the result.',
  },
  {
    image: 'reference.jpg',
    alt: 'The reference menu next to the prompt with an Add reference button',
    title: 'Reference images',
    description: 'Guide a generation with your own picture.',
  },
  {
    image: 'remove-background.jpg',
    alt: 'Assets page showing an image next to its background-free cutout',
    title: 'Remove background',
    description: 'Cut out the subject of any image in one click.',
  },
];
