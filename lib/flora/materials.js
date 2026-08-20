import { DoubleSide, ShaderMaterial, Vector3 } from 'three'

import { BLUSH_AMOUNT, BLUSH_SPREAD, FOLIAGE_AMOUNT, GRAPHITE, PAPER } from './palette.js'
import { OUTLINE_FRAG } from './shaders/outline.frag.js'
import { OUTLINE_VERT } from './shaders/outline.vert.js'
import { SKETCH_FRAG } from './shaders/sketch.frag.js'
import { SKETCH_VERT } from './shaders/sketch.vert.js'

// Fully opaque, no blending, no alphaTest, no discard. Paper is composited inside
// the fragment shader, so the depth test alone resolves leaf-over-leaf with no
// draw-order dependence and no flicker as the bones move. Organ silhouettes are
// authored into the geometry rather than cut out with alpha, which also keeps the
// outline hull tracing the visible shape instead of a rectangle.
function common() {
  return { transparent: false, depthWrite: true, depthTest: true }
}

// Shared by both passes so a single uniform write updates the whole plant.
export function createSharedUniforms() {
  return {
    uPaper: { value: new Vector3(...PAPER) },
    uGraphite: { value: new Vector3(...GRAPHITE) },
    uTime: { value: 0 },
    uScale: { value: 1 },
    uPixelRatio: { value: 1 },
    uGrowth: { value: 0 },
    // Roughly "on twos": stepping the noise at ~9Hz reads as hand-drawn frames,
    // while the motion underneath stays smooth at 60.
      uBoilHz: { value: 5 },
  }
}

export function createSketchMaterial(shared) {
  return new ShaderMaterial({
    ...common(),
    // Leaf and petal blades are open surfaces with no back, so a leaf turned away
    // from the camera would simply vanish under FrontSide. The fragment shader
    // flips the normal for back faces.
    side: DoubleSide,
    vertexShader: SKETCH_VERT,
    fragmentShader: SKETCH_FRAG,
    uniforms: {
      ...shared,
      uKeyDir: { value: new Vector3(-0.45, 0.78, 0.44).normalize() },
      uFillDir: { value: new Vector3(0.55, -0.35, 0.76).normalize() },
      uBlushAmount: { value: BLUSH_AMOUNT },
      uBlushSpread: { value: BLUSH_SPREAD },
      uFoliageAmount: { value: FOLIAGE_AMOUNT },
    },
  })
}

export function createOutlineMaterial(shared) {
  return new ShaderMaterial({
    ...common(),
    // DoubleSide: tubes still draw as an inverted hull (the fragment shader
    // discards front faces when aHull is set), while facing ribbons keep the
    // extruded rim -- BackSide alone is invisible on a card that faces the camera.
    side: DoubleSide,
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    // A ribbon's back face is exactly coplanar with its front face, so nudge the
    // hull back to keep it from fighting the main pass at equal depth.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      ...shared,
      uOutlinePx: { value: 1.75 },
      uOutlineMinPx: { value: 1.05 },
      uWobblePx: { value: 0.32 },
    },
  })
}
