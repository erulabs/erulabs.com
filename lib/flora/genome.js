// The gene vector. A continuous morphospace, not a species enum -- but with hard
// consistency rules applied afterwards, because unconstrained random sampling in
// a high-dimensional space mostly produces things that don't read as plants.

import { createRng } from './rng.js'

export const KIND_STEM = 0
export const KIND_LEAF = 1
export const KIND_PETAL = 2
export const KIND_RECEPTACLE = 3

// Real flowers strongly favor a small set of meristem symmetries. Include the
// three-, four- and six-part families as well as Fibonacci spirals so seeds can
// range from iris-like simplicity to dense composite heads.
const BOTANICAL_PETAL_COUNTS = [3, 4, 5, 6, 8, 13, 21]

// Restrained botanical pigments. These are families rather than fixed colours:
// every seed wanders inside one family, while the throat and pollen are chosen as
// a botanical complement. Keeping the covariance is what makes a pale petal with
// a dark wine throat feel intentional rather than randomly colourised.
const BLOOM_PALETTES = [
  { hue: [0.97, 1.015], sat: [0.12, 0.42], val: [0.92, 1], throat: [0.94, 0.99], center: [0.09, 0.14] },
  { hue: [0.015, 0.07], sat: [0.3, 0.65], val: [0.86, 0.98], throat: [0.98, 0.025], center: [0.1, 0.145] },
  { hue: [0.07, 0.115], sat: [0.42, 0.72], val: [0.86, 0.98], throat: [0.015, 0.055], center: [0.11, 0.16] },
  { hue: [0.115, 0.17], sat: [0.12, 0.42], val: [0.93, 1], throat: [0.075, 0.12], center: [0.08, 0.13] },
  { hue: [0.92, 0.975], sat: [0.5, 0.82], val: [0.66, 0.9], throat: [0.96, 0.015], center: [0.09, 0.14] },
  { hue: [0.84, 0.92], sat: [0.42, 0.74], val: [0.72, 0.93], throat: [0.9, 0.97], center: [0.1, 0.145] },
  { hue: [0.72, 0.83], sat: [0.2, 0.5], val: [0.86, 0.98], throat: [0.79, 0.9], center: [0.09, 0.14] },
  { hue: [0.6, 0.7], sat: [0.3, 0.62], val: [0.78, 0.95], throat: [0.68, 0.78], center: [0.12, 0.17] },
  {
    hue: [0.94, 0.985],
    sat: [0.64, 0.88],
    val: [0.54, 0.76],
    throat: [0.88, 0.94],
    center: [0.16, 0.22],
    centerSat: [0.35, 0.58],
    centerVal: [0.62, 0.82],
  },
]

// Alternate (golden angle), opposite, decussate. Real phyllotaxis is one of a
// small number of arrangements, never an arbitrary angle.
const PHYLLOTAXIS = [137.507, 180, 90]

export function createGenome(seed) {
  const rng = createRng(seed)
  const palette = rng.pick(BLOOM_PALETTES)

  const g = {
    seed,

    // --- Stem ---------------------------------------------------------------
    // Built in pixels: at scale 1 the tip lands on the avatar centre, so the
    // stem height is also the distance the plant descends below it.
    stemHeight: rng.range(310, 440),
    stemSegments: rng.int(9, 13),
    // Thick enough to read as the thing holding the bloom up. A stalk drawn at a
    // hair's width under a head this size looks like a mistake rather than a plant.
    stemBaseRadius: rng.range(4.2, 7.2),
    stemTipRadius: rng.range(1.35, 2.35),
    stemTaperPower: rng.range(1.1, 1.9),
    // Overall lean off vertical, and how much the stem arcs over toward the tip.
    stemLean: rng.gauss(0, 0.1),
    stemCurve: rng.range(0.1, 0.42) * rng.sign(),
    // Small per-joint wander so the stalk isn't a perfect arc.
    stemWander: rng.range(0.006, 0.022),

    // --- Colour -------------------------------------------------------------
    // HSV, hue in turns [0,1). Foliage hue is authored but the sketch shader
    // draws stem and leaf in graphite only; it survives on the attribute so a
    // later wash can pick it up without a geometry rebuild.
    foliageHue: rng.range(0.235, 0.36),
    foliageSat: rng.range(0.32, 0.62),
    foliageVal: rng.range(0.32, 0.52),
    // Tips are younger and lighter.
    foliageTipLift: rng.range(0.05, 0.2),

    // Petal hue is the colored-pencil wash at the corolla, not a fill. Reds,
    // roses, a little coral -- the graphite does the drawing.
    petalHue: rng.range(palette.hue[0], palette.hue[1]),
    petalSat: rng.range(palette.sat[0], palette.sat[1]),
    petalVal: rng.range(palette.val[0], palette.val[1]),
    petalTipHueShift: rng.range(-0.018, 0.025),
    petalBaseVal: 0,
    throatHue: rng.range(palette.throat[0], palette.throat[1]),
    centerHue: rng.range(palette.center[0], palette.center[1]),
    centerSat: rng.range(...(palette.centerSat || [0.48, 0.7])),
    centerVal: rng.range(...(palette.centerVal || [0.84, 0.96])),
    rowHueShift: rng.chance(0.28) ? rng.range(-0.075, 0.075) : rng.range(-0.018, 0.018),

    // --- Dynamics -----------------------------------------------------------
    stiffness: rng.range(0.92, 1.28),
    windGain: rng.range(0.48, 0.84),
    windPhase: rng.range(0, Math.PI * 2),
    windAngle: rng.range(-0.5, 0.5),

    // --- Leaves -------------------------------------------------------------
    leafCount: rng.int(2, 5),
    // Where along the stem the lowest and highest leaves attach.
    leafInsertLow: rng.range(0.18, 0.34),
    leafInsertHigh: rng.range(0.58, 0.78),
    petioleLength: rng.range(22, 46),
    bladeLength: rng.range(58, 104),
    bladeWidth: rng.range(16, 32),
    // 0 = smooth margin, 1 = strongly toothed.
    bladeSerration: rng.range(0, 0.55),
    // Elevation of the petiole away from the stem axis.
    leafAngle: rng.range(0.75, 1.25),
    // How much the blade arches over under its own weight.
    leafDroop: rng.range(0.2, 0.55),
    bladeCrease: rng.range(0.1, 0.26),
    leafTwist: rng.gauss(0, 0.12),

    // --- Bloom --------------------------------------------------------------
    petalCount: 0,
    // How full the corolla is. 0 is a spare whorl with daylight showing between
    // the petals; 1 is a packed head with none. One gene rather than four,
    // because fullness is not one decision -- petal width, how broad the petal is
    // where it leaves the receptacle, the number of whorls and how far neighbours
    // are allowed to overlap all have to move together or the head reads as a
    // wheel of spokes no matter how wide the petals get.
    corollaFullness: rng.range(0.18, 1),
    // Derived from fullness below.
    petalRows: 0,
    petalBaseWidth: 0,
    // The bloom is the subject of the drawing, not a detail on top of a stalk: a
    // petal runs about a third of the stem's length, which opens into a head
    // roughly two thirds as wide as the whole plant is tall.
    petalLength: rng.range(82, 208),
    // Width itself is derived below, from how much of the whorl each petal has to
    // cover. This is only the per-flower variation around that: some flowers carry
    // a broader petal than they strictly need.
    petalBroad: rng.range(0.66, 1.3),
    petalWidth: 0,
    // Splay away from vertical: low = tulip/bell, high = daisy/flat. Floored high
    // enough that a petal this long always opens far enough to show its face
    // rather than closing into a fan seen edge-on.
    petalTilt: rng.range(0.95, 1.38),
    // Backwards recurve along the petal, as on a shooting star. At this size the
    // recurve is most of the silhouette, so it is worth pushing.
    petalCurl: rng.range(-0.34, 0.68),
    // Silhouette traits. They are sampled continuously, but correlated below so
    // one flower tends toward a coherent rounded, pointed, or notched character.
    petalShape: rng.next(),
    petalTipRound: rng.range(0.18, 1),
    petalTipNotch: 0,
    petalShoulder: rng.range(0.4, 0.9),
    petalWaist: rng.range(0, 0.18),
    petalWaistAt: rng.range(0.25, 0.62),
    petalEdgeWave: rng.range(0.005, 0.14),
    petalEdgeLobes: rng.range(1.5, 6.5),
    petalCup: rng.range(0.08, 0.46),
    petalTwist: rng.gauss(0, 0.16),
    petalIrregularity: rng.range(0.02, 0.13),
    receptacleRadius: rng.range(8, 27),
    // Flowers nod toward the light, and the camera is the light here. Without
    // this the bloom is seen edge-on and reads as a flat fan rather than a face.
    headTilt: rng.range(0.92, 1.2),
    headTurn: rng.gauss(0, 0.12),
    sepalCount: rng.int(4, 6),
    sepalLength: rng.range(28, 54),
    sepalWidth: rng.range(7, 14),
    phyllotaxis: 0,
  }

  // The base is deeper and warmer than the illuminated petal edge.
  g.petalBaseVal = Math.max(0.54, g.petalVal - rng.range(0.1, 0.24))
  if (g.petalHue > 1) g.petalHue -= 1
  if (g.throatHue > 1) g.throatHue -= 1

  // Coherent regions within the continuous silhouette space. The boundaries are
  // intentionally soft because all traits still carry their own seed variation:
  // ray, star, round, notched, spooned and ruffled flowers can blend into one
  // another rather than looking like six prefabricated models.
  if (g.petalShape < 0.17) {
    g.petalBroad *= rng.range(0.55, 0.72)
    g.petalShoulder = rng.range(0.74, 0.92)
    g.petalTipRound = rng.range(0.12, 0.42)
    g.petalEdgeWave *= 0.45
  } else if (g.petalShape < 0.34) {
    g.petalBroad *= rng.range(0.72, 0.92)
    g.petalShoulder = rng.range(0.48, 0.72)
    g.petalTipRound = rng.range(0.08, 0.38)
  } else if (g.petalShape < 0.56) {
    g.petalBroad *= rng.range(1.02, 1.2)
    g.petalShoulder = rng.range(0.62, 0.86)
    g.petalTipRound = rng.range(0.76, 1)
    g.petalEdgeWave *= 0.65
  } else if (g.petalShape < 0.76) {
    g.petalBroad *= rng.range(0.94, 1.16)
    g.petalShoulder = rng.range(0.6, 0.86)
    g.petalTipRound = rng.range(0.8, 1)
    g.petalTipNotch = rng.range(0.1, 0.32)
  } else if (g.petalShape < 0.9) {
    g.petalWaist = rng.range(0.18, 0.4)
    g.petalWaistAt = rng.range(0.28, 0.5)
    g.petalShoulder = rng.range(0.72, 0.92)
    g.petalTipRound = rng.range(0.62, 1)
    g.petalCup = Math.max(g.petalCup, rng.range(0.28, 0.5))
  } else {
    g.petalBroad *= rng.range(0.9, 1.12)
    g.petalTipRound = rng.range(0.62, 1)
    g.petalEdgeWave = rng.range(0.08, 0.17)
    g.petalEdgeLobes = rng.range(3, 5.5)
    g.petalIrregularity = Math.max(g.petalIrregularity, rng.range(0.08, 0.15))
    if (rng.chance(0.45)) g.petalTipNotch = rng.range(0.06, 0.2)
  }
  g.petalBroad = Math.min(Math.max(g.petalBroad, 0.48), 1.42)

  // Count and fullness are not independent. A whorl's circumference grows with
  // radius faster than any petal can widen, so past a certain size the only thing
  // that actually closes the gaps between petal tips is having more petals: the
  // full end of the range lands on 13 and 21, while sparse heads can express
  // three-, four-, five- and six-part floral symmetries.
  const countT = Math.min(g.corollaFullness * 0.72 + rng.next() * 0.42, 0.999)
  g.petalCount = BOTANICAL_PETAL_COUNTS[Math.floor(countT * BOTANICAL_PETAL_COUNTS.length)]
  if (g.petalShape >= 0.17 && rng.chance(0.18)) g.petalCount = rng.pick([3, 4, 5, 6])
  if (g.petalShape < 0.17 && g.petalCount < 8) g.petalCount = 8
  g.phyllotaxis = (PHYLLOTAXIS[rng.int(0, PHYLLOTAXIS.length - 1)] * Math.PI) / 180

  // A tall thin stalk cannot hold up a 21-petal head without looking wrong, and
  // the head wins that argument: petal count is the most visible thing about a
  // flower, so thicken the stalk rather than thin the bloom.
  if (g.petalCount >= 13) {
    g.stemBaseRadius = Math.max(g.stemBaseRadius, 5.4)
  }

  // Two whorls always -- a single one leaves the centre of a head this size bare,
  // and every flower with big petals nests at least tepals over sepals. A packed
  // head gets a third, which is where the clustered middle comes from.
  g.petalRows = g.corollaFullness > 0.76 ? 3 : g.corollaFullness > 0.38 ? 2 : 1
  if (g.petalCount <= 4 && g.corollaFullness > 0.28) g.petalRows = Math.max(g.petalRows, 2)
  if (g.petalShape > 0.9 && g.corollaFullness > 0.56) g.petalRows = Math.max(g.petalRows, 2)

  // The fraction of its full width the petal already has where it leaves the
  // receptacle. This is the whole difference between a wheel of spokes and a
  // flower: a petal that tapers away to nothing at its base leaves a wedge of
  // bare paper between itself and its neighbour that no amount of extra width
  // further out can close.
  g.petalBaseWidth = 0.16 + 0.48 * g.corollaFullness

  // Width from the room each petal has to fill, measured on the circle the whorl
  // sweeps at the petal TIPS: the widest point, and the only place gaps really
  // show. A packed head is asked to overlap there, a spare one is allowed its
  // daylight. Sampling a width in pixels instead makes fullness a lottery -- the
  // same 60px petal closes a 21-petal head and leaves a 5-petal one full of holes.
  const tipRadius = g.receptacleRadius * 0.8 + g.petalLength * Math.sin(g.petalTilt)
  const tipShare = (2 * Math.PI * tipRadius) / g.petalCount
  g.petalWidth = tipShare * (0.5 + 0.88 * g.corollaFullness) * g.petalBroad

  // A petal wider than it is long stops reading as a petal, which is the binding
  // limit on a three- or five-petal head: those flowers show gaps between their
  // tips in life too, and closing them here would just make a pinwheel.
  g.petalWidth = Math.min(Math.max(g.petalWidth, 18), g.petalLength * 0.82)

  // Dense heads need a larger visible pollen disc to keep their centre from
  // becoming a dark knot of overlapping geometry; sparse flowers can be finer.
  g.receptacleRadius *= 0.88 + 0.22 * g.corollaFullness

  return g
}
