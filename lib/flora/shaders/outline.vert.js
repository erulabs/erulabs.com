import { NOISE_GLSL } from './noise.glsl.js'

// Inverted-hull outline, with two departures from the textbook version.
//
// 1. It extrudes along an authored aOutlineDir, not along the normal. Leaves and
//    petals are open zero-thickness ribbons: their back faces are coincident with
//    their front faces and their normals point out of the plane, so extruding
//    along the normal produces no silhouette at all when a leaf faces the camera.
//    aOutlineDir is non-zero only on boundary vertices and says which way the
//    silhouette should grow.
//
// 2. It extrudes in VIEW space after skinning. Object-space extrusion scales with
//    the parent group, so the outline would thin to nothing as the plant collapses
//    to 0.4x on scroll. Under an orthographic camera, view units are pixels.
//
// 3. Tubes (aHull=1) still draw as a back-face hull. Ribbons (aHull=0) draw the
//    extruded rim on either face -- a facing card has no visible back faces, which
//    is why a leaf blade used to disappear while its petiole stayed inked.

export const OUTLINE_VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>

${NOISE_GLSL}

attribute vec3 aOutlineDir;
attribute vec3 aOrganBase;
attribute float aRadius;
attribute float aArc;
attribute float aGrowth;
attribute float aHull;
attribute float aKind;

uniform float uOutlinePx;
uniform float uOutlineMinPx;
uniform float uWobblePx;
uniform float uScale;
uniform float uTime;
uniform float uBoilHz;
uniform float uGrowth;

varying float vArc;
varying float vBoilSeed;
varying float vHull;
varying float vRim;
varying float vKind;

void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  // Needed even though this pass ignores normals: this is the chunk that declares
  // mat4 skinMatrix, which is what skins the outline direction below.
  #include <skinnormal_vertex>
  #include <begin_vertex>

  float g = clamp((uGrowth - aGrowth) * 3.0, 0.0, 1.0);
  g = g * g * (3.0 - 2.0 * g);
  transformed = mix(aOrganBase, transformed, g);

  #include <skinning_vertex>

  float boilStep = floor(uTime * uBoilHz);
  float boilSeed = hash21(vec2(boilStep, 17.0));
  vBoilSeed = boilSeed;
  vArc = aArc;
  vHull = aHull;
  vKind = aKind;

  vec4 mv = modelViewMatrix * vec4(transformed, 1.0);

  float dirLen = length(aOutlineDir);
  vRim = dirLen;
  if (dirLen > 0.001) {
    vec3 skinnedDir = (skinMatrix * vec4(aOutlineDir, 0.0)).xyz;
    vec3 dv = (modelViewMatrix * vec4(skinnedDir, 0.0)).xyz;
    float l = length(dv.xy);
    if (l > 0.00001) {
      // Width in CSS pixels. A hard floor so facing (lit) edges still read --
      // without it, thin petal rims clamp to a fraction of a pixel, wobble pulls
      // the hull inside the fill, and the contour vanishes. The organ-radius cap
      // still holds on a collapsed stem so the outline cannot eat the stalk.
      float minPx = uOutlineMinPx * mix(0.55, 1.0, smoothstep(0.35, 1.0, uScale));
      float px = max(minPx, min(uOutlinePx, 0.45 * aRadius * uScale));
      float wob = (vnoise(vec2(aArc * 0.35, boilSeed * 31.0)) - 0.5) * uWobblePx;
      mv.xy += (dv.xy / l) * max(minPx * g, px * g + wob);
    }
  }

  gl_Position = projectionMatrix * mv;
}
`
