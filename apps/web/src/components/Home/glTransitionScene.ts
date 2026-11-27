/**
 * Builds and draws the home handover veil: one full-screen triangle, one program.
 * Frame state comes in; nothing here reads the DOM.
 */
import type { Mesh } from 'ogl';

import type { GlStage } from '@/components/Home/glStage';
import { TRANSITION_FRAGMENT, TRANSITION_VERTEX } from '@/components/Home/glTransitionShaders';

/**
 * Grain is drawn at one device pixel per CSS pixel: on a 2x screen the specks
 * would be too fine to read as film, and a full-screen pass costs a quarter.
 */
const GRAIN_DEVICE_PIXEL_RATIO = 1;

export interface TransitionFrameState {
  /** 0..1 veil strength; 0 draws a fully transparent frame. */
  readonly strength: number;
  /** Seconds, drives the grain flicker. */
  readonly time: number;
}

export interface TransitionScene {
  render: (state: TransitionFrameState) => void;
  dispose: () => void;
}

function createVeilMesh(stage: GlStage): Mesh {
  const { ogl, gl } = stage;
  const program = new ogl.Program(gl, {
    vertex: TRANSITION_VERTEX,
    fragment: TRANSITION_FRAGMENT,
    depthTest: false,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
  });
  return new ogl.Mesh(gl, { geometry: new ogl.Triangle(gl), program, frustumCulled: false });
}

function lowerResolution(stage: GlStage): void {
  const { width, height } = stage.getSize();
  stage.renderer.dpr = GRAIN_DEVICE_PIXEL_RATIO;
  // The stage resizes through renderer.setSize, which reads dpr, so later resizes keep it.
  stage.renderer.setSize(width, height);
}

export function createTransitionScene(stage: GlStage): TransitionScene {
  lowerResolution(stage);
  const mesh = createVeilMesh(stage);
  const { uniforms } = mesh.program;

  return {
    render: ({ strength, time }) => {
      uniforms.uStrength.value = strength;
      uniforms.uTime.value = time;
      stage.renderer.render({ scene: mesh });
    },
    dispose: () => {
      // A lost context already freed everything; its handles are dead.
      if (stage.gl.isContextLost()) return;
      mesh.geometry.remove();
      mesh.program.remove();
    },
  };
}
