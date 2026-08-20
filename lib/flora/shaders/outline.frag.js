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
varying float vKind;

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

  // The supporting stem is drawn with firmer pressure; petals get the nearly
  // disappearing edge of a botanical study. Equal black contours make every
  // overlap shout at once and flatten the entire bloom.
  float isStem = 1.0 - step(0.5, abs(vKind));
  float isLeaf = 1.0 - step(0.5, abs(vKind - 1.0));
  float isPetal = 1.0 - step(0.5, abs(vKind - 2.0));
  float isCenter = 1.0 - step(0.5, abs(vKind - 3.0));
  float pressure = 0.7 + 0.3 * vnoise(vec2(vArc * 0.43, vBoilSeed * 13.0));
  float organPressure = isStem * 0.78 + isLeaf * 0.5 + isPetal * 0.34 + isCenter * 0.1;
  float a = pressure * organPressure * mix(0.75, 1.0, stick);

  gl_FragColor = vec4(mix(uPaper, uGraphite, a), 1.0);
}
`
