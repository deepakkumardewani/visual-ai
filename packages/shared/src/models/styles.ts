/**
 * Style preset catalog — single source of truth for style modifiers.
 * Each preset has: id, label, and promptSuffix (empty for None, non-empty for others).
 *
 * Follows the `as const satisfies` pattern from registry.ts to derive the StyleId union type.
 */

export interface StylePreset {
  id: string;
  label: string;
  promptSuffix: string;
}

export const STYLE_PRESETS = [
  { id: 'none', label: 'None', promptSuffix: '' },
  { id: '3d_render', label: '3D Render', promptSuffix: '3D rendered' },
  { id: 'acrylic', label: 'Acrylic', promptSuffix: 'acrylic painting' },
  { id: 'anime', label: 'Anime', promptSuffix: 'anime style' },
  {
    id: 'cinematic',
    label: 'Cinematic',
    promptSuffix: 'cinematic lighting, cinematic composition',
  },
  { id: 'creative', label: 'Creative', promptSuffix: 'creative and imaginative' },
  { id: 'dynamic', label: 'Dynamic', promptSuffix: 'dynamic composition, energetic' },
  { id: 'fashion', label: 'Fashion', promptSuffix: 'fashion photography, haute couture' },
  { id: 'game_concept', label: 'Game Concept', promptSuffix: 'game concept art' },
  { id: 'graphic_2d', label: 'Graphic Design 2D', promptSuffix: 'graphic design, 2D illustration' },
  { id: 'graphic_3d', label: 'Graphic Design 3D', promptSuffix: 'graphic design, 3D render' },
  { id: 'illustration', label: 'Illustration', promptSuffix: 'detailed illustration' },
  { id: 'photography', label: 'Photography', promptSuffix: 'professional photography' },
  { id: 'portrait', label: 'Portrait', promptSuffix: 'portrait photography' },
  { id: 'raytraced', label: 'Raytraced', promptSuffix: 'raytraced, physically-based rendering' },
  {
    id: 'stock_photo',
    label: 'Stock Photo',
    promptSuffix: 'stock photography, professional quality',
  },
] as const satisfies readonly StylePreset[];

/**
 * Derive StyleId union type from STYLE_PRESETS catalog.
 * This ensures the type is always in sync with the catalog at build time.
 */
export type StyleId = (typeof STYLE_PRESETS)[number]['id'];

/**
 * Look up a style preset by id.
 * Throws if id is not found in the catalog.
 *
 * @param id - The style id to look up
 * @returns The StylePreset object
 * @throws Error if id is not found
 */
export function getStylePreset(id: string): StylePreset {
  const preset = STYLE_PRESETS.find((p) => p.id === id);
  if (!preset) {
    throw new Error(`Unknown style id: ${id}`);
  }
  return preset;
}
