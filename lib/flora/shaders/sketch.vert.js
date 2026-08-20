// Skinning here reuses three's own chunks rather than hand-rolling it.
//
// This works because the skinning define comes from the OBJECT, not the
// material: WebGLPrograms.getParameters sets `skinning: object.isSkinnedMesh`
// unconditionally, and the ShaderMaterial vertex prefix then emits
// `#define USE_SKINNING` plus the skinIndex/skinWeight attribute declarations.
// It must be a ShaderMaterial and NOT a RawShaderMaterial -- the raw variant
// skips that prefix entirely and skinning silently does nothing.
//
// Do not declare bindMatrix / bindMatrixInverse / boneTexture as uniforms here;
// the renderer pushes them out-of-band for any SkinnedMesh.

export const SKETCH_VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>

attribute vec3 aOutlineDir;
attribute vec3 aOrganBase;
attribute vec3 aHSV;
attribute float aParam;
attribute float aKind;
attribute float aRadius;
attribute float aArc;
attribute float aGrowth;
attribute float aHatchSeed;
attribute float aAO;
attribute float aAcross;

uniform float uGrowth;

varying vec3 vHSV;
varying vec3 vNormalView;
varying float vParam;
varying float vKind;
varying float vAO;
varying float vHatchSeed;
varying float vArc;
varying float vAcross;

void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>

  // Bloom-in. Each organ collapses toward the point it sprouts from, staggered by
  // aGrowth, so the plant draws itself stem-first and the flower opens last.
  float g = clamp((uGrowth - aGrowth) * 3.0, 0.0, 1.0);
  g = g * g * (3.0 - 2.0 * g);
  transformed = mix(aOrganBase, transformed, g);

  #include <skinning_vertex>

  vHSV = aHSV;
  vNormalView = normalize(transformedNormal);
  vParam = aParam;
  vKind = aKind;
  vAO = aAO;
  vHatchSeed = aHatchSeed;
  vArc = aArc;
  vAcross = aAcross;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`
