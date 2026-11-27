/**
 * Shaders for the home hero wall. One program draws every tile; per-tile values
 * arrive as uniforms. All lengths are CSS pixels, y pointing down, origin at the
 * canvas's top-left corner, so they line up with the DOM wall's layout maths.
 */

export const HERO_VERTEX = /* glsl */ `
attribute vec3 position;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uPad;
uniform vec2 uDir;
uniform float uBend;

varying vec2 vLocal;
varying vec2 vPx;

void main() {
  vec2 quad = uSize + 2.0 * uPad;
  // Plane positions run -0.5..0.5 with y up; flip to the page's y-down space.
  vec2 local = vec2(position.x, -position.y) * quad;
  vLocal = local;

  // Bow the tile along its exit direction: the middle leads, the edges trail.
  vec2 n = local / max(uSize, vec2(1.0)) * 2.0;
  float bow = max(0.0, 1.0 - 0.5 * dot(n, n));
  vec2 px = uCenter + local + uDir * bow * uBend;
  vPx = px;

  vec2 clip = px / uResolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

export const HERO_FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uCover;
uniform float uRadius;
uniform float uAlpha;
uniform vec3 uShadow;
uniform vec2 uDir;
uniform float uSplit;
uniform float uBulge;
uniform vec2 uPointer;
uniform float uLightRadius;
uniform float uLight;
uniform vec3 uLightColor;
uniform float uDim;
uniform float uRim;
uniform float uRimWidth;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform float uRimGlow;
uniform float uRimGlowSigma;

varying vec2 vLocal;
varying vec2 vPx;

float roundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// Magnify toward the centre, like a shallow lens laid over the print.
vec2 bulge(vec2 uv) {
  float r2 = clamp(dot(uv, uv) * 4.0, 0.0, 1.0);
  return uv * (1.0 - uBulge * (1.0 - r2));
}

vec3 sampleSplit(vec2 uv) {
  vec2 base = vec2(uv.x, -uv.y) * uCover + 0.5;
  vec2 offset = vec2(uDir.x, -uDir.y) * uSplit;
  float r = texture2D(tMap, base + offset).r;
  float g = texture2D(tMap, base).g;
  float b = texture2D(tMap, base - offset).b;
  return vec3(r, g, b);
}

void main() {
  vec2 halfSize = uSize * 0.5;
  float edge = roundedBox(vLocal, halfSize, uRadius);
  float inside = 1.0 - smoothstep(-0.75, 0.75, edge);

  float shadowEdge = roundedBox(vLocal - vec2(0.0, uShadow.x), halfSize, uRadius);
  float shadow = uShadow.z * (1.0 - smoothstep(-uShadow.y, uShadow.y, shadowEdge));

  vec3 color = sampleSplit(bulge(vLocal / uSize)) * uDim;
  vec2 toLight = (vPx - uPointer) / uLightRadius;
  color += uLightColor * uLight * exp(-dot(toLight, toLight));
  // Spotlight rim, as the DOM wall's two inset shadows: a soft copper glow, then
  // a crisp ring over it. Blended toward copper, not added, so a bright or cool
  // image cannot push the rim to white or cyan.
  float inset = max(-edge, 0.0);
  // An edge blurred by a gaussian sits at half strength on the edge itself.
  float halo = 0.5 * exp(-0.5 * (inset * inset) / (uRimGlowSigma * uRimGlowSigma));
  float ring = 1.0 - smoothstep(uRimWidth - 0.5, uRimWidth + 0.5, inset);
  color = mix(color, uRimColor, uRim * uRimGlow * halo);
  color = mix(color, uRimColor, uRim * uRimStrength * ring);

  // Premultiplied output: the tile over its own black shadow.
  float alpha = inside + shadow * (1.0 - inside);
  gl_FragColor = vec4(color * inside, alpha) * uAlpha;
}
`;
