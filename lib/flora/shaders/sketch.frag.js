import { NOISE_GLSL } from './noise.glsl.js'

export const SKETCH_FRAG = /* glsl */ `
precision highp float;

${NOISE_GLSL}

uniform vec3 uPaper;
uniform vec3 uKeyDir;
uniform vec3 uFillDir;
uniform float uBlushAmount;
uniform float uBlushSpread;
uniform float uFoliageAmount;
uniform float uPixelRatio;

varying vec3 vHSV;
varying vec3 vNormalView;
varying float vParam;
varying float vKind;
varying float vAO;
varying float vHatchSeed;
varying float vArc;

void main() {
  vec3 N = normalize(vNormalView);
  if (!gl_FrontFacing) N = -N;

  // Paper tooth, in CSS pixels so the grain looks the same on a retina display.
  // Colored pencil only catches the high points -- same as graphite, just pigment.
  vec2 sp = gl_FragCoord.xy / uPixelRatio;
  float tooth = vnoise(sp * 0.90) * 0.55 + vnoise(sp * 2.70) * 0.30 + vnoise(sp * 6.10) * 0.15;
  float stick = smoothstep(0.34, 0.76, tooth);

  // Form for the wash only. Graphite never enters this pass; the outline hull
  // is the pencil drawing, and the interior is paper plus a hint of colour.
  float key = dot(N, uKeyDir) * 0.5 + 0.5;
  float fill = dot(N, uFillDir) * 0.5 + 0.5;
  float lum = clamp(key * 0.75 + fill * 0.25, 0.0, 1.0);
  lum *= mix(0.62, 1.0, vAO);
  float shade = clamp(1.0 - lum, 0.0, 1.0);

  // KIND_STEM = 0, KIND_LEAF = 1, KIND_PETAL = 2, KIND_RECEPTACLE = 3.
  // Petal blush from the throat; a quieter green dust along the stalk.
  float isStem = 1.0 - step(0.5, abs(vKind));
  float isLeaf = 1.0 - step(0.5, abs(vKind - 1.0));
  float isPetal = 1.0 - step(0.5, abs(vKind - 2.0));
  float isReceptacle = 1.0 - step(0.5, abs(vKind - 3.0));
  float radial = 1.0 - smoothstep(0.0, max(uBlushSpread, 0.001), vParam);
  radial = pow(radial, 1.25);
  float blotch = mix(0.55, 1.0, vnoise(sp * 0.16 + vec2(vHatchSeed * 2.7, vParam * 3.4)));
  float grain = blotch * mix(0.55, 1.0, stick);
  float blush = (isPetal * radial + isReceptacle * 0.95) * grain;
  float foliage = (isStem * 0.7 + isLeaf * 0.28) * grain;

  // High-value wash, multiplied over paper. Saturation is the colored pencil;
  // value stays light so the interior never reads as a fill.
  float bloom = isPetal + isReceptacle;
  float s = vHSV.y * mix(0.55, 0.98, bloom);
  float val = mix(0.9, 0.7, shade);
  vec3 wash = hsv2rgb(vec3(fract(vHSV.x), s, val));
  float washAmt = (blush * uBlushAmount + foliage * uFoliageAmount) * mix(0.85, 1.0, shade);

  gl_FragColor = vec4(uPaper * mix(vec3(1.0), wash, washAmt), 1.0);
}
`
