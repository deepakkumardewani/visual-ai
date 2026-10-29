export interface IntroSlideData {
  id: string;
  title: string;
  description: string;
  /** WebM first, MP4 fallback. */
  sources: { src: string; type: string }[];
  poster: string;
  alt: string;
  /** Intrinsic media size; reserves layout space so the stage never shifts. */
  width: number;
  height: number;
}

const MEDIA_WIDTH = 960;
const MEDIA_HEIGHT = 600;

function slide(
  mediaId: number,
  id: string,
  title: string,
  description: string,
  alt: string,
): IntroSlideData {
  const base = `/intro/slide-${mediaId}`;
  return {
    id,
    title,
    description,
    sources: [
      { src: `${base}.webm`, type: 'video/webm' },
      { src: `${base}.mp4`, type: 'video/mp4' },
    ],
    poster: `${base}.webp`,
    alt,
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
  };
}

/**
 * Display order is the array order (dashboard first by deliberate choice).
 * The first argument is the media file number in public/intro, which is
 * independent of display order so media files never need renaming.
 */
export const INTRO_SLIDES: readonly IntroSlideData[] = [
  slide(
    4,
    'dashboard',
    'New dashboard',
    'A cleaner studio with Create, Explore and Assets in one place.',
    'The redesigned dashboard with its three tabs',
  ),
  slide(
    1,
    'models',
    'New models',
    'More image models to pick from, each tuned for a different look.',
    'Model picker listing the new image models',
  ),
  slide(
    2,
    'styles',
    'Style picker',
    'Apply a style in one click and see it on a thumbnail first.',
    'Style picker with thumbnails of each style',
  ),
  slide(
    3,
    'sizes',
    'More sizes',
    'Choose from more aspect ratios for posts, wallpapers and prints.',
    'Aspect ratio options in the sidebar',
  ),
  slide(
    5,
    'voice',
    'Voice dictation',
    'Tap the mic and say your prompt instead of typing it.',
    'Microphone button recording a spoken prompt',
  ),
  slide(
    6,
    'prompts',
    'Improve, generate and save prompts',
    'Polish a prompt, get a fresh idea, or save your favourites for later.',
    'Prompt tools menu with improve, generate and save actions',
  ),
  slide(
    7,
    'explore',
    'Explore',
    'Browse what the community is creating and remix what inspires you.',
    'Opening an image from the Explore feed to view it on the full Explore page',
  ),
  slide(
    8,
    'tools',
    'Tools',
    'Upscale or remove the background from any image, right under the result.',
    'Zooming across the tools row under a generated image, from Download to Remove background',
  ),
  slide(
    9,
    'reference',
    'Reference images',
    'Guide a generation with your own picture.',
    'Clicking the upload icon and adding a reference image next to the prompt',
  ),
  slide(
    10,
    'remove-background',
    'Remove background',
    'Cut out the subject of any image in one click.',
    'Uploading an image, removing its background and showing the cutout result',
  ),
];

export const INTRO_SLIDE_COUNT = INTRO_SLIDES.length;
