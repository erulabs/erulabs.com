import { NOISE_GLSL } from './noise.glsl.js'

export const OUTLINE_FRAG = /* glsl */ `
precision highp float;

${NOISE_GLSL}

uniform vec3 uPaper;
uniform vec3 uGraphite;
uniform float uPixelRatio;

varying float vArc;
varying float vBoilSeed;
varying float vHull;
varying float vRim;

void main() {
  // Tubes: classic inverted hull -- expanded back faces form a ring around the
  // fill. Ribbons: those back faces point away on a card that faces the camera,
  // so instead keep the extruded rim (vRim is 0 on interior vertices) on either
  // face. That is why a facing leaf used to vanish while its petiole did not.
  if (vHull > 0.5) {
    if (gl_FrontFacing) discard;
  } else if (vRim < 0.35) {
    discard;
  }

  vec2 sp = gl_FragCoord.xy / uPixelRatio;
  float tooth = vnoise(sp * 0.90) * 0.55 + vnoise(sp * 2.70) * 0.30 + vnoise(sp * 6.10) * 0.15;
  float stick = smoothstep(0.34, 0.76, tooth);

  // Pressure varies along the stroke so the contour breathes instead of reading
  // as a uniform machine-traced line. Floor is high: this pass is the whole
  // graphite drawing, and a gappy contour leaves the plant looking unfinished.
  float pressure = 0.82 + 0.18 * vnoise(vec2(vArc * 0.6, vBoilSeed * 13.0));
  float a = pressure * mix(0.84, 1.0, stick);

  gl_FragColor = vec4(mix(uPaper, uGraphite, a), 1.0);
}
`
