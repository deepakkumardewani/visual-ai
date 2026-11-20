/**
 * Builds and draws the /v3 hero wall: one textured, segmented quad per tile, all
 * sharing one shader program. Frame state comes in; nothing here reads the DOM.
 */
import type { Mesh, Program, Texture, Transform } from 'ogl';

import {
  isRaised,
  spotlightShare,
  tileFrame,
  type TileFrame,
  type WallPointer,
  type WallProgress,
  type WallTile,
} from '@/components/LandingV2/heroWallLayout';

import {
  coverScale,
  exitDirection,
  parseAspect,
  quadContains,
  shadowPadding,
  tileQuad,
  tileShadow,
  type TileQuad,
  type TileShadow,
} from '@/components/LandingV3/glHeroGeometry';
import { HERO_FRAGMENT, HERO_VERTEX } from '@/components/LandingV3/glHeroShaders';
import { createSpotlightYield } from '@/components/LandingV3/glSpotlightYield';
import type { GlStage, GlStageSize } from '@/components/LandingV3/glStage';

/** Enough vertices for the exit bow to read as a curve rather than a fold. */
const PLANE_SEGMENTS = 16;
/** Exit bow at full exit, as a share of the tile's shorter side. */
const BEND_MAX = 0.08;
/** Colour channel offset at full exit, in UV units. */
const SPLIT_MAX = 0.014;
const BULGE_REST = 0.03;
/** Extra bulge on the tile nearest the cursor. */
const BULGE_HOVER = 0.05;
const LIGHT_RADIUS_PX = 340;
const LIGHT_STRENGTH = 0.16;
/** The brand amber (`--tw-accent`) lifted toward paper white, so the light warms rather than tints. */
const LIGHT_COLOR = [1, 0.86, 0.7] as const;
const MIN_VISIBLE_OPACITY = 0.001;
/**
 * Warm wash over the spotlit tile, aimed at its centre. Kept below the cursor
 * light: the rim and the dim mark the tile, and more wash bleaches bright skies
 * the DOM wall leaves alone.
 */
const SPOTLIGHT_LIGHT = 0.1;
/** Extra bulge on the spotlit tile, matching the cursor's hover bulge. */
const BULGE_SPOTLIGHT = BULGE_HOVER;
/**
 * The rim at full spotlight, matching HeroWall's `.wall__tile::after` insets:
 * a 1.5px ring at 0.85 over a 32px blurred glow at 0.3 (a CSS blur is two
 * gaussian sigmas, hence 16px). Its colour is the `--tw-accent` token, read by
 * the session.
 */
const RIM_STRENGTH = 0.85;
const RIM_WIDTH_PX = 1.5;
const RIM_GLOW = 0.3;
const RIM_GLOW_SIGMA_PX = 16;
/** Above every layer's draw order (see drawOrder), so the lit tile's rim is never cut. */
const RAISED_ORDER = Number.MAX_SAFE_INTEGER;

/** One frame of input for the whole wall. */
export interface HeroFrameState {
  readonly progress: WallProgress;
  /** Eased pointer, -1..1 from the viewport centre (parallax, as in the DOM wall). */
  readonly pointer: WallPointer;
  /** Eased pointer in canvas CSS pixels (light position). */
  readonly lightAt: WallPointer;
  /** 0..1 how present the cursor light is (0 until the pointer first moves). */
  readonly lightLevel: number;
  /** The pointer moved recently; over a tile, the cursor light takes over from the spotlight. */
  readonly cursorMoving: boolean;
  readonly time: number;
  /** 0..1 master gain on the shader effects; 0 draws the plain DOM look. */
  readonly effect: number;
}

export interface HeroScene {
  render: (state: HeroFrameState) => void;
  dispose: () => void;
}

interface TileSource {
  readonly tile: WallTile;
  readonly texture: Texture;
  readonly cover: readonly [number, number];
  readonly dir: WallPointer;
  readonly shadow: TileShadow;
  readonly pad: number;
}

interface TileEntry extends TileSource {
  readonly mesh: Mesh;
  /** Layer draw order, restored once the tile is no longer lit. */
  readonly order: number;
  /** This frame's uniforms, computed in `render` and applied just before the draw call. */
  uniforms: Partial<UniformMap>;
}

type UniformMap = Program['uniforms'];

function createProgram(stage: GlStage, rimColor: RgbColor): Program {
  return new stage.ogl.Program(stage.gl, {
    vertex: HERO_VERTEX,
    fragment: HERO_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // The y-down flip in the vertex shader reverses winding; culling would drop every quad.
    cullFace: false,
    uniforms: {
      tMap: { value: null },
      uResolution: { value: [1, 1] },
      uCenter: { value: [0, 0] },
      uSize: { value: [1, 1] },
      uPad: { value: 0 },
      uDir: { value: [0, -1] },
      uBend: { value: 0 },
      uCover: { value: [1, 1] },
      uRadius: { value: 0 },
      uAlpha: { value: 0 },
      uShadow: { value: [0, 0, 0] },
      uSplit: { value: 0 },
      uBulge: { value: 0 },
      uPointer: { value: [0, 0] },
      uLightRadius: { value: LIGHT_RADIUS_PX },
      uLight: { value: 0 },
      uLightColor: { value: [...LIGHT_COLOR] },
      uDim: { value: 1 },
      uRim: { value: 0 },
      uRimWidth: { value: RIM_WIDTH_PX },
      uRimColor: { value: [...rimColor] },
      uRimStrength: { value: RIM_STRENGTH },
      uRimGlow: { value: RIM_GLOW },
      uRimGlowSigma: { value: RIM_GLOW_SIGMA_PX },
    },
  });
}

function createSource(
  stage: GlStage,
  parts: { tile: WallTile; image: HTMLImageElement },
): TileSource {
  const { ogl, gl } = stage;
  const { tile, image } = parts;
  const shadow = tileShadow(tile);
  return {
    tile,
    texture: new ogl.Texture(gl, { image }),
    cover: coverScale(
      parseAspect(tile.image.aspectRatio),
      image.naturalWidth / image.naturalHeight,
    ),
    dir: exitDirection(tile),
    shadow,
    pad: shadowPadding(shadow),
  };
}

interface TileDraw {
  readonly quad: TileQuad;
  readonly opacity: number;
  readonly raised: boolean;
  readonly uniforms: Partial<UniformMap>;
}

/**
 * Light, bulge, rim and dim for one tile. The cursor light gives way as the
 * spotlight rises, and on the spotlit tile the light swings to its centre.
 */
function lightUniforms(
  quad: TileQuad,
  frame: TileFrame,
  state: HeroFrameState,
): Partial<UniformMap> {
  const cursor = state.lightLevel * (1 - spotlightShare(state.progress));
  const hover = Math.exp(
    -((quad.centerX - state.lightAt.x) ** 2 + (quad.centerY - state.lightAt.y) ** 2) /
      LIGHT_RADIUS_PX ** 2,
  );
  const aim = {
    x: state.lightAt.x + (quad.centerX - state.lightAt.x) * frame.glow,
    y: state.lightAt.y + (quad.centerY - state.lightAt.y) * frame.glow,
  };
  const bulge = BULGE_REST + BULGE_HOVER * hover * cursor + BULGE_SPOTLIGHT * frame.glow;
  const light = LIGHT_STRENGTH * cursor + SPOTLIGHT_LIGHT * frame.glow;
  return {
    uBulge: { value: bulge * state.effect },
    uPointer: { value: [aim.x, aim.y] },
    uLight: { value: light * state.effect },
    uRim: { value: frame.glow * state.effect },
    // Not ramped by `effect`: the DOM wall dims too, so the handover shows no jump.
    uDim: { value: frame.brightness },
  };
}

/** Per-tile uniforms for one frame. */
function tileDraw(entry: TileSource, state: HeroFrameState, size: GlStageSize): TileDraw {
  const frame = tileFrame(entry.tile, {
    ...state.progress,
    pointer: state.pointer,
    time: state.time,
  });
  const quad = tileQuad(entry.tile, frame, size);
  const exit = state.progress.scroll * state.effect;
  const uniforms: Partial<UniformMap> = {
    tMap: { value: entry.texture },
    uResolution: { value: [size.width, size.height] },
    uCenter: { value: [quad.centerX, quad.centerY] },
    uSize: { value: [quad.width, quad.height] },
    uPad: { value: entry.pad },
    uDir: { value: [entry.dir.x, entry.dir.y] },
    uBend: { value: BEND_MAX * Math.min(quad.width, quad.height) * exit },
    uCover: { value: [...entry.cover] },
    uRadius: { value: quad.radius },
    uAlpha: { value: quad.opacity },
    uShadow: { value: [entry.shadow.offsetY, entry.shadow.blur, entry.shadow.alpha] },
    uSplit: { value: SPLIT_MAX * exit },
    ...lightUniforms(quad, frame, state),
  };
  return { quad, opacity: quad.opacity, raised: isRaised(frame), uniforms };
}

function buildMesh(stage: GlStage, parts: { program: Program; order: number }): Mesh {
  const { ogl, gl } = stage;
  const geometry = new ogl.Plane(gl, {
    widthSegments: PLANE_SEGMENTS,
    heightSegments: PLANE_SEGMENTS,
  });
  const mesh = new ogl.Mesh(gl, { geometry, program: parts.program, frustumCulled: false });
  mesh.renderOrder = parts.order;
  return mesh;
}

function buildEntries(
  stage: GlStage,
  parts: SceneParts & { program: Program; scene: Transform },
): TileEntry[] {
  const orders = drawOrder(parts.tiles);
  return parts.tiles.map((tile, index) => {
    const image = parts.images[index];
    if (!image) throw new Error(`GlHeroWall: missing image for tile ${index}`);
    const source = createSource(stage, { tile, image });
    const order = orders[index] ?? index;
    const mesh = buildMesh(stage, { program: parts.program, order });
    const entry: TileEntry = { ...source, mesh, order, uniforms: {} };
    // A shared program draws every tile, so each mesh swaps its own values in before drawing.
    mesh.onBeforeRender(() => Object.assign(parts.program.uniforms, entry.uniforms));
    mesh.setParent(parts.scene);
    return entry;
  });
}

/** Far layers first, then layout order inside a layer, as the DOM z-index does. */
function drawOrder(tiles: readonly WallTile[]): readonly number[] {
  return tiles.map((tile, index) => tile.layer * tiles.length + index);
}

/** 0..1 RGB. */
export type RgbColor = readonly [number, number, number];

export interface SceneParts {
  readonly tiles: readonly WallTile[];
  /** Decoded images, one per tile, in tile order. */
  readonly images: readonly HTMLImageElement[];
  /** The spotlight rim's colour, the same accent token the DOM rim uses. */
  readonly rimColor: RgbColor;
}

export function createHeroScene(stage: GlStage, parts: SceneParts): HeroScene {
  const program = createProgram(stage, parts.rimColor);
  const scene: Transform = new stage.ogl.Transform();
  const entries = buildEntries(stage, { ...parts, program, scene });
  const spotlightYield = createSpotlightYield();
  // From the previous frame: the hit test needs this frame's quads, which need the yield.
  let cursorOnTile = false;

  return {
    render: (state) => {
      const size = stage.getSize();
      const cursorInUse = state.cursorMoving && cursorOnTile;
      const frameState = { ...state, progress: spotlightYield.apply(state.progress, cursorInUse) };
      cursorOnTile = false;
      entries.forEach((entry) => {
        const draw = tileDraw(entry, frameState, size);
        entry.uniforms = draw.uniforms;
        entry.mesh.visible = draw.opacity > MIN_VISIBLE_OPACITY;
        entry.mesh.renderOrder = draw.raised ? RAISED_ORDER : entry.order;
        if (entry.mesh.visible && quadContains(draw.quad, state.lightAt)) cursorOnTile = true;
      });
      stage.renderer.render({ scene });
    },
    dispose: () => {
      // A lost context already freed everything; its handles are dead.
      if (stage.gl.isContextLost()) return;
      entries.forEach((entry) => {
        entry.mesh.geometry.remove();
        stage.gl.deleteTexture(entry.texture.texture);
      });
      program.remove();
    },
  };
}
