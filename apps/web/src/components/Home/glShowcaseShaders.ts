/**
 * Shaders for the home showcase. One program draws every print; per-tile values
 * arrive as uniforms. Lengths are CSS pixels, y down, origin at the canvas's
 * top-left corner, matching the DOM rows' layout boxes.
 */

export const SHOWCASE_VERTEX = /* glsl */ `
attribute vec3 position;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec2 uSize;

varying vec2 vLocal;

void main() {
  // Plane positions run -0.5..0.5 with y up; flip to the page's y-down space.
  vec2 local = vec2(position.x, -position.y) * uSize;
  vLocal = local;
  vec2 clip = (uCenter + local) / uResolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

export const SHOWCASE_FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uCover;
uniform float uRadius;
uniform float uZoom;
uniform float uDim;
uniform vec3 uBacking;
uniform float uTime;
uniform float uPhase;
uniform float uRipple;
uniform float uSplit;

varying vec2 vLocal;

float roundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// A slow swell across the print, like paper lifting in a draught; 0 strength is flat.
vec2 ripple(vec2 uv) {
  float wave = sin(uv.x * 9.0 + uv.y * 3.0 + uTime * 2.4 + uPhase);
  float swell = sin(uv.y * 6.0 - uTime * 1.7 + uPhase * 0.5);
  return uv + vec2(swell * 0.35, wave) * uRipple;
}

vec3 sampleSplit(vec2 uv) {
  vec2 base = vec2(uv.x, -uv.y) * uCover / uZoom + 0.5;
  // Scroll runs vertically, so the channels smear along it.
  vec2 offset = vec2(0.0, uSplit);
  float r = texture2D(tMap, base + offset).r;
  float g = texture2D(tMap, base).g;
  float b = texture2D(tMap, base - offset).b;
  return vec3(r, g, b);
}

void main() {
  float edge = roundedBox(vLocal, uSize * 0.5, uRadius);
  float inside = 1.0 - smoothstep(-0.75, 0.75, edge);

  vec3 color = sampleSplit(ripple(vLocal / uSize));
  // The DOM spotlight fades an image over its tile backing, not over the page.
  color = mix(uBacking, color, uDim);
  gl_FragColor = vec4(color * inside, inside);
}
`;
