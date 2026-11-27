/**
 * Shaders for the home scene-handover veil: one full-screen triangle of animated
 * film grain over a soft edge darkening. Every term scales with `uStrength`, so
 * 0 draws a fully transparent frame.
 */

/** Grain changes this many times a second, like projected film rather than TV static. */
const GRAIN_FPS = 24;
/** Frame seeds wrap here; large seeds lose float precision and the grain freezes into bands. */
const GRAIN_SEED_WRAP = 64;
/** Darkening at the centre and the extra amount towards the corners, at full strength. */
const VEIL_CENTER = 0.08;
const VEIL_EDGE = 0.22;
/** Peak opacity of the light and dark specks at full strength. */
const GRAIN_LIGHT = 0.09;
const GRAIN_DARK = 0.12;

const glslFloat = (value: number): string => value.toFixed(3);

export const TRANSITION_VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const TRANSITION_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uStrength;

varying vec2 vUv;

// Sine-free hash (Dave Hoskins' hash12): no lattice or diagonal banding at pixel scale.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  float frame = mod(floor(uTime * ${glslFloat(GRAIN_FPS)}), ${glslFloat(GRAIN_SEED_WRAP)});
  // -0.5..0.5 per device pixel; positive values lift, negative ones darken.
  float speck = hash(floor(gl_FragCoord.xy) + frame * vec2(37.0, 17.0)) - 0.5;
  float vignette = smoothstep(0.2, 0.85, length(vUv - 0.5));

  float veil = ${glslFloat(VEIL_CENTER)} + ${glslFloat(VEIL_EDGE)} * vignette;
  float light = max(speck, 0.0) * 2.0 * ${glslFloat(GRAIN_LIGHT)};
  float dark = max(-speck, 0.0) * 2.0 * ${glslFloat(GRAIN_DARK)};

  // Premultiplied output: only the light specks carry colour, the rest only covers.
  float alpha = clamp((veil + light + dark) * uStrength, 0.0, 1.0);
  gl_FragColor = vec4(vec3(light * uStrength), alpha);
}
`;
