/**
 * Builds and draws the /v3 showcase prints: one textured quad per tile, all
 * sharing one shader program. Frame state comes in; nothing here reads the DOM.
 */
import type { Mesh, Program, Texture, Transform } from 'ogl';

import { coverScale } from '@/components/LandingV3/glHeroGeometry';
import { SHOWCASE_FRAGMENT, SHOWCASE_VERTEX } from '@/components/LandingV3/glShowcaseShaders';
import type { GlStage, GlStageSize } from '@/components/LandingV3/glStage';

/** Matches ShowcaseTile's `.tile__media { border-radius: 12px }`. */
const TILE_RADIUS_PX = 12;
/** UV swell at full scroll speed; small, so prompts' subjects stay readable. */
const RIPPLE_MAX = 0.012;
/** Colour channel offset at full scroll speed, in UV units. */
const SPLIT_MAX = 0.016;
/** Spreads tiles' ripple phases so the wall does not wave in lockstep. */
const PHASE_STEP = 1.7;

/** One tile's quad for one frame, in canvas CSS pixels. */
export interface PrintQuad {
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
  readonly zoom: number;
  readonly dim: number;
}

export interface ShowcaseFrameState {
  /** One quad per print, in the order the images were given. */
  readonly quads: readonly PrintQuad[];
  /** 0..1 scroll energy; 0 draws the plain DOM look. */
  readonly energy: number;
  /** +1 scrolling down, -1 up: which way the channels smear. */
  readonly direction: number;
  readonly time: number;
}

export interface ShowcaseScene {
  render: (state: ShowcaseFrameState) => void;
  dispose: () => void;
}

export interface ShowcaseSceneParts {
  /** Decoded images, one per print, in tile order. */
  readonly images: readonly HTMLImageElement[];
  /** The tiles' backing colour (0..1 RGB) the spotlight dims toward. */
  readonly backing: readonly [number, number, number];
}

type UniformMap = Program['uniforms'];

interface PrintEntry {
  readonly texture: Texture;
  readonly imageAspect: number;
  readonly mesh: Mesh;
  readonly phase: number;
  uniforms: Partial<UniformMap>;
}

function createProgram(stage: GlStage, backing: ShowcaseSceneParts['backing']): Program {
  return new stage.ogl.Program(stage.gl, {
    vertex: SHOWCASE_VERTEX,
    fragment: SHOWCASE_FRAGMENT,
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
      uCover: { value: [1, 1] },
      uRadius: { value: TILE_RADIUS_PX },
      uZoom: { value: 1 },
      uDim: { value: 1 },
      uBacking: { value: [...backing] },
      uTime: { value: 0 },
      uPhase: { value: 0 },
      uRipple: { value: 0 },
      uSplit: { value: 0 },
    },
  });
}

function buildEntry(
  stage: GlStage,
  parts: { image: HTMLImageElement; program: Program; scene: Transform; index: number },
): PrintEntry {
  const { ogl, gl } = stage;
  const geometry = new ogl.Plane(gl);
  const mesh = new ogl.Mesh(gl, { geometry, program: parts.program, frustumCulled: false });
  const entry: PrintEntry = {
    texture: new ogl.Texture(gl, { image: parts.image }),
    imageAspect: parts.image.naturalWidth / parts.image.naturalHeight,
    mesh,
    phase: parts.index * PHASE_STEP,
    uniforms: {},
  };
  // A shared program draws every print, so each mesh swaps its own values in before drawing.
  mesh.onBeforeRender(() => Object.assign(parts.program.uniforms, entry.uniforms));
  mesh.setParent(parts.scene);
  return entry;
}

function printUniforms(
  entry: PrintEntry,
  quad: PrintQuad,
  frame: { state: ShowcaseFrameState; size: GlStageSize },
): Partial<UniformMap> {
  const { state, size } = frame;
  return {
    tMap: { value: entry.texture },
    uResolution: { value: [size.width, size.height] },
    uCenter: { value: [quad.centerX, quad.centerY] },
    uSize: { value: [quad.width, quad.height] },
    uCover: { value: [...coverScale(quad.width / quad.height, entry.imageAspect)] },
    uZoom: { value: quad.zoom },
    uDim: { value: quad.dim },
    uTime: { value: state.time },
    uPhase: { value: entry.phase },
    uRipple: { value: RIPPLE_MAX * state.energy },
    uSplit: { value: SPLIT_MAX * state.energy * state.direction },
  };
}

export function createShowcaseScene(stage: GlStage, parts: ShowcaseSceneParts): ShowcaseScene {
  const program = createProgram(stage, parts.backing);
  const scene: Transform = new stage.ogl.Transform();
  const entries = parts.images.map((image, index) =>
    buildEntry(stage, { image, program, scene, index }),
  );

  return {
    render: (state) => {
      const size = stage.getSize();
      entries.forEach((entry, index) => {
        const quad = state.quads[index];
        entry.mesh.visible = Boolean(quad);
        if (quad) entry.uniforms = printUniforms(entry, quad, { state, size });
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
