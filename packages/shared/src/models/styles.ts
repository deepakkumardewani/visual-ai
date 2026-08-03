/**
 * Style preset catalog — single source of truth for style modifiers.
 * Each preset has: id, label, promptSuffix (rich descriptor block appended when the
 * LLM enhancer does not run), and styleDescription (natural-language description
 * used to instruct the LLM enhancer to rewrite the prompt in that style).
 *
 * Both strings must stay strictly subject-neutral: medium, optics, lighting, color,
 * texture and composition only. Image models read descriptor tags as scene content,
 * so a token like "expressive eyes" or "elegant pose" materialises a person the user
 * never asked for. styles.test.ts enforces this with a banned-token guard.
 *
 * Follows the `as const satisfies` pattern from registry.ts to derive the StyleId union type.
 */

export interface StylePreset {
  id: string;
  label: string;
  promptSuffix: string;
  styleDescription: string;
}

export const STYLE_PRESETS = [
  { id: 'none', label: 'None', promptSuffix: '', styleDescription: '' },
  {
    id: '3d_render',
    label: '3D Render',
    promptSuffix:
      '3D render, octane render, smooth shading, studio lighting, subsurface scattering, high detail, clean topology, 8k',
    styleDescription:
      'a polished 3D rendered scene with smooth materials, soft studio lighting, and crisp realistic shading',
  },
  {
    id: 'acrylic',
    label: 'Acrylic',
    promptSuffix:
      'acrylic painting, visible brush strokes, thick impasto texture, vibrant pigments, canvas texture, painterly composition, gallery quality',
    styleDescription:
      'an acrylic painting with bold visible brush strokes, layered impasto texture, and vibrant saturated pigments on canvas',
  },
  {
    id: 'anime',
    label: 'Anime',
    promptSuffix:
      'anime style, cel shading, clean line art, vivid colors, detailed background, studio anime key visual',
    styleDescription:
      'a Japanese anime illustration with clean line art, cel shading, expressive linework, and vivid color palettes',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    promptSuffix:
      'cinematic film still, dramatic lighting, shallow depth of field, anamorphic lens, film grain, color graded, epic composition, 35mm',
    styleDescription:
      'a cinematic film still with dramatic lighting, shallow depth of field, anamorphic framing, and moody color grading',
  },
  {
    id: 'creative',
    label: 'Creative',
    promptSuffix:
      'imaginative surreal concept, unexpected juxtapositions, bold color palette, dreamlike atmosphere, intricate details, artistic composition',
    styleDescription:
      'an imaginative, surreal artwork with unexpected juxtapositions, dreamlike atmosphere, and bold artistic choices',
  },
  {
    id: 'dynamic',
    label: 'Dynamic',
    promptSuffix:
      'dynamic composition, strong motion blur, dramatic angles, energetic movement, high contrast lighting, sense of speed and action',
    styleDescription:
      'a high-energy scene with dramatic camera angles, motion, strong diagonals, and high-contrast lighting that conveys action',
  },
  {
    id: 'fashion',
    label: 'Fashion',
    promptSuffix:
      'high fashion editorial photography, polished studio lighting, glossy magazine quality, sharp focus, refined art direction',
    styleDescription:
      'a high-fashion editorial photograph with polished editorial art direction, controlled studio lighting, and glossy magazine aesthetics',
  },
  {
    id: 'game_concept',
    label: 'Game Concept',
    promptSuffix:
      'game concept art, key art, digital painting, dramatic composition, detailed environment design, rich color palette, atmospheric depth, trending on ArtStation',
    styleDescription:
      'AAA video game concept art — a detailed digital painting with dramatic composition, atmospheric depth, and rich environment design',
  },
  {
    id: 'graphic_2d',
    label: 'Graphic Design 2D',
    promptSuffix:
      'flat 2D graphic design, vector illustration, bold geometric shapes, limited color palette, clean lines, modern minimal composition',
    styleDescription:
      'a flat 2D vector-style graphic design with bold geometric shapes, clean lines, and a limited modern color palette',
  },
  {
    id: 'graphic_3d',
    label: 'Graphic Design 3D',
    promptSuffix:
      '3D graphic design, isometric render, soft gradients, smooth plastic materials, pastel color palette, clean studio background, modern aesthetic',
    styleDescription:
      'a modern 3D graphic design render with smooth materials, soft gradients, playful shapes, and a clean studio background',
  },
  {
    id: 'illustration',
    label: 'Illustration',
    promptSuffix:
      'detailed digital illustration, refined line work, rich textures, harmonious color palette, storybook quality, expressive lighting',
    styleDescription:
      'a detailed digital illustration with refined line work, rich textures, and an expressive, harmonious color palette',
  },
  {
    id: 'photography',
    label: 'Photography',
    promptSuffix:
      'professional photography, DSLR, sharp focus, natural lighting, high dynamic range, detailed textures, realistic depth of field, 8k',
    styleDescription:
      'a professional photograph shot on a DSLR with natural lighting, sharp focus, realistic depth of field, and true-to-life detail',
  },
  {
    id: 'portrait',
    label: 'Portrait',
    promptSuffix:
      '85mm lens, soft directional window light, shallow depth of field, close intimate framing, fine surface detail, creamy studio-quality bokeh',
    styleDescription:
      'an intimate close-framed photograph with soft flattering light, shallow depth of field, and finely detailed, lifelike surface texture',
  },
  {
    id: 'raytraced',
    label: 'Raytraced',
    promptSuffix:
      'raytraced render, physically-based rendering, realistic reflections and refractions, global illumination, caustics, ultra detailed materials',
    styleDescription:
      'a physically-based raytraced render with realistic reflections, refractions, global illumination, and ultra-detailed materials',
  },
  {
    id: 'stock_photo',
    label: 'Stock Photo',
    promptSuffix:
      'professional stock photography, bright even lighting, clean composition, crisp focus, commercial quality, neutral background, high resolution',
    styleDescription:
      'a polished commercial stock photograph with bright even lighting, clean uncluttered composition, and crisp professional focus',
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
