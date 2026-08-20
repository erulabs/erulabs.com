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
varying float vAcross;

void main() {
  vec3 N = normalize(vNormalView);
  float backFace = gl_FrontFacing ? 0.0 : 1.0;
  if (backFace > 0.5) N = -N;

  // Paper tooth, in CSS pixels so the grain looks the same on a retina display.
  // Colored pencil only catches the high points -- same as graphite, just pigment.
  vec2 sp = gl_FragCoord.xy / uPixelRatio;
  float tooth = vnoise(sp * 0.90) * 0.55 + vnoise(sp * 2.70) * 0.30 + vnoise(sp * 6.10) * 0.15;
  float stick = smoothstep(0.28, 0.78, tooth);

  float key = dot(N, uKeyDir) * 0.5 + 0.5;
  float fill = dot(N, uFillDir) * 0.5 + 0.5;
  float lum = clamp(key * 0.72 + fill * 0.28, 0.0, 1.0);
  lum *= mix(0.68, 1.0, vAO);
  float shade = clamp(1.0 - lum, 0.0, 1.0);
  float grazing = pow(1.0 - abs(N.z), 2.0);

  // KIND_STEM = 0, KIND_LEAF = 1, KIND_PETAL = 2, KIND_RECEPTACLE = 3.
  float isStem = 1.0 - step(0.5, abs(vKind));
  float isLeaf = 1.0 - step(0.5, abs(vKind - 1.0));
  float isPetal = 1.0 - step(0.5, abs(vKind - 2.0));
  float isReceptacle = 1.0 - step(0.5, abs(vKind - 3.0));
  float radial = 1.0 - smoothstep(0.0, max(uBlushSpread, 0.001), vParam);
  radial = pow(radial, 1.15);

  // Pigment pools differently at every scale: broad clouding from wet colour,
  // small tooth where the paper catches it, and almost invisible edge blooms.
  float cloud = vnoise(sp * 0.055 + vec2(vHatchSeed * 4.7, vParam * 2.1));
  float mottling = mix(0.78, 1.08, cloud) * mix(0.82, 1.0, stick);
  vec3 pigment = hsv2rgb(vec3(fract(vHSV.x), vHSV.y, vHSV.z));
  pigment *= mix(0.84, 1.06, lum);

  // Petals are thin, translucent membranes. The throat carries most of the
  // colour; toward the rim the paper shines through and back-facing petals glow.
  float petalVein = exp(-abs(vAcross) * 13.0);
  float rayVeins = pow(0.5 + 0.5 * cos((abs(vAcross) * 7.0 + vParam * 1.7) * 3.14159), 9.0);
  rayVeins *= smoothstep(0.04, 0.76, vParam) * (1.0 - smoothstep(0.8, 1.0, vParam));
  float petalDeposit = (0.26 + radial * 0.58) * uBlushAmount;
  petalDeposit += (petalVein * 0.1 + rayVeins * 0.035) * radial;
  petalDeposit *= mix(0.94, 1.28, vHSV.y);
  petalDeposit *= mottling * mix(1.0, 0.72, backFace);
  petalDeposit *= mix(1.0, 0.7, grazing);
  vec3 petalColor = mix(pigment, uPaper, backFace * 0.24 + grazing * 0.12);

  // Leaves keep their waxy body colour but reveal a pale midrib and fine,
  // alternating side veins. Their highlights are broad, never plastic-sharp.
  float midrib = exp(-abs(vAcross) * 24.0);
  float sideVeins = pow(0.5 + 0.5 * cos((vParam * 9.0 + abs(vAcross) * 2.2) * 3.14159), 18.0);
  sideVeins *= smoothstep(0.08, 0.9, abs(vAcross));
  float leafDeposit = uFoliageAmount * (0.68 + 0.22 * mottling) * (isLeaf + isStem * 0.78);
  vec3 leafColor = pigment * mix(0.72, 1.02, lum);
  leafColor = mix(leafColor, vec3(0.72, 0.76, 0.57), midrib * 0.2 + sideVeins * 0.075);

  // The receptacle is a pollen-dusted dome rather than a flat polygon. Two noise
  // scales suggest hundreds of florets without spending geometry on each anther.
  float pollen = smoothstep(0.58, 0.86, vnoise(sp * 0.34 + vec2(vHatchSeed * 8.0, 3.7)));
  float pollenFine = smoothstep(0.7, 0.9, vnoise(sp * 0.92 + vec2(9.1, vHatchSeed * 5.0)));
  vec3 pollenGold = hsv2rgb(vec3(fract(vHSV.x + 0.018), min(1.0, vHSV.y * 1.08), min(1.0, vHSV.z * 1.12)));
  vec3 centerColor = mix(pigment * mix(0.82, 1.04, lum), pollenGold, pollen * 0.5 + pollenFine * 0.24);
  float centerDeposit = 0.68 + 0.17 * mottling;

  vec3 color = uPaper;
  color = mix(color, petalColor, clamp(petalDeposit * isPetal, 0.0, 0.86));
  color = mix(color, leafColor, clamp(leafDeposit, 0.0, 0.82));
  color = mix(color, centerColor, clamp(centerDeposit * isReceptacle, 0.0, 0.94));

  // A final whisper of contact shade gives overlaps depth without turning the
  // illustration into hard-edged CGI.
  color *= mix(0.95, 1.0, vAO + isPetal * 0.08);
  gl_FragColor = vec4(color, 1.0);
}
`
