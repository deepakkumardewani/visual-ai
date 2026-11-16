/**
 * Builds and draws the /v3 hero wall: one textured, segmented quad per tile, all
 * sharing one shader program. Frame state comes in; nothing here reads the DOM.
 */
import type { Mesh, Program, Texture, Transform } from 'ogl';

import {
  tileFrame,
  type WallPointer,
  type WallProgress,
  type WallTile,
} from '@/components/LandingV2/heroWallLayout';

import {
  coverScale,
  exitDirection,
  parseAspect,
  shadowPadding,
  tileQuad,
  tileShadow,
  type TileShadow,
} from '@/components/LandingV3/glHeroGeometry';
import { HERO_FRAGMENT, HERO_VERTEX } from '@/components/LandingV3/glHeroShaders';
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

/** One frame of input for the whole wall. */
export interface HeroFrameState {
  readonly progress: WallProgress;
  /** Eased pointer, -1..1 from the viewport centre (parallax, as in the DOM wall). */
  readonly pointer: WallPointer;
  /** Eased pointer in canvas CSS pixels (light position). */
  readonly lightAt: WallPointer;
  /** 0..1 how present the cursor light is (0 until the pointer first moves). */
  readonly lightLevel: number;
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
  /** This frame's uniforms, computed in `render` and applied just before the draw call. */
  uniforms: Partial<UniformMap>;
}

type UniformMap = Program['uniforms'];

function createProgram(stage: GlStage): Program {
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
  readonly opacity: number;
  readonly uniforms: Partial<UniformMap>;
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
  const hover = Math.exp(
    -((quad.centerX - state.lightAt.x) ** 2 + (quad.centerY - state.lightAt.y) ** 2) /
      LIGHT_RADIUS_PX ** 2,
  );
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
    uBulge: { value: (BULGE_REST + BULGE_HOVER * hover * state.lightLevel) * state.effect },
    uPointer: { value: [state.lightAt.x, state.lightAt.y] },
    uLight: { value: LIGHT_STRENGTH * state.lightLevel * state.effect },
  };
  return { opacity: quad.opacity, uniforms };
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
    const mesh = buildMesh(stage, { program: parts.program, order: orders[index] ?? index });
    const entry: TileEntry = { ...source, mesh, uniforms: {} };
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

export interface SceneParts {
  readonly tiles: readonly WallTile[];
  /** Decoded images, one per tile, in tile order. */
  readonly images: readonly HTMLImageElement[];
}

export function createHeroScene(stage: GlStage, parts: SceneParts): HeroScene {
  const program = createProgram(stage);
  const scene: Transform = new stage.ogl.Transform();
  const entries = buildEntries(stage, { ...parts, program, scene });

  return {
    render: (state) => {
      const size = stage.getSize();
      entries.forEach((entry) => {
        const draw = tileDraw(entry, state, size);
        entry.uniforms = draw.uniforms;
        entry.mesh.visible = draw.opacity > MIN_VISIBLE_OPACITY;
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
