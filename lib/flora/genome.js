// The gene vector. A continuous morphospace, not a species enum -- but with hard
// consistency rules applied afterwards, because unconstrained random sampling in
// a high-dimensional space mostly produces things that don't read as plants.

import { createRng } from './rng.js'

export const KIND_STEM = 0
export const KIND_LEAF = 1
export const KIND_PETAL = 2
export const KIND_RECEPTACLE = 3

// Petal counts in real flowers overwhelmingly land on Fibonacci numbers. Snapping
// to this list is the single cheapest thing that makes a random sample look
// botanical rather than generated.
const FIBONACCI_PETALS = [3, 5, 8, 13, 21]

// Alternate (golden angle), opposite, decussate. Real phyllotaxis is one of a
// small number of arrangements, never an arbitrary angle.
const PHYLLOTAXIS = [137.507, 180, 90]

export function createGenome(seed) {
  const rng = createRng(seed)

  const g = {
    seed,

    // --- Stem ---------------------------------------------------------------
    // Built in pixels: at scale 1 the tip lands on the avatar centre, so the
    // stem height is also the distance the plant descends below it.
    stemHeight: rng.range(300, 430),
    stemSegments: rng.int(8, 12),
    // Thick enough to read as the thing holding the bloom up. A stalk drawn at a
    // hair's width under a head this size looks like a mistake rather than a plant.
    stemBaseRadius: rng.range(4.4, 7.6),
    stemTipRadius: rng.range(1.5, 2.6),
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
    foliageHue: rng.range(0.2, 0.34),
    foliageSat: rng.range(0.5, 0.8),
    foliageVal: rng.range(0.38, 0.6),
    // Tips are younger and lighter.
    foliageTipLift: rng.range(0.05, 0.2),

    // Petal hue is the colored-pencil wash at the corolla, not a fill. Reds,
    // roses, a little coral -- the graphite does the drawing.
    petalHue: 0,
    petalSat: rng.range(0.58, 0.86),
    petalVal: rng.range(0.78, 0.94),
    petalTipHueShift: rng.range(-0.015, 0.03),
    petalBaseVal: rng.range(0.62, 0.82),

    // --- Dynamics -----------------------------------------------------------
    stiffness: rng.range(1.0, 1.4),
    windGain: rng.range(0.7, 1.0),
    windPhase: rng.range(0, Math.PI * 2),
    windAngle: rng.range(-0.5, 0.5),

    // --- Leaves -------------------------------------------------------------
    leafCount: rng.int(2, 4),
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

    // --- Bloom --------------------------------------------------------------
    petalCount: 0,
    // How full the corolla is. 0 is a spare whorl with daylight showing between
    // the petals; 1 is a packed head with none. One gene rather than four,
    // because fullness is not one decision -- petal width, how broad the petal is
    // where it leaves the receptacle, the number of whorls and how far neighbours
    // are allowed to overlap all have to move together or the head reads as a
    // wheel of spokes no matter how wide the petals get.
    corollaFullness: rng.range(0.25, 1),
    // Derived from fullness below.
    petalRows: 0,
    petalBaseWidth: 0,
    // The bloom is the subject of the drawing, not a detail on top of a stalk: a
    // petal runs about a third of the stem's length, which opens into a head
    // roughly two thirds as wide as the whole plant is tall.
    petalLength: rng.range(96, 172),
    // Width itself is derived below, from how much of the whorl each petal has to
    // cover. This is only the per-flower variation around that: some flowers carry
    // a broader petal than they strictly need.
    petalBroad: rng.range(0.82, 1.18),
    petalWidth: 0,
    // Splay away from vertical: low = tulip/bell, high = daisy/flat. Floored high
    // enough that a petal this long always opens far enough to show its face
    // rather than closing into a fan seen edge-on.
    petalTilt: rng.range(0.62, 1.35),
    // Backwards recurve along the petal, as on a shooting star. At this size the
    // recurve is most of the silhouette, so it is worth pushing.
    petalCurl: rng.range(-0.45, 0.85),
    receptacleRadius: rng.range(8, 17),
    // Flowers nod toward the light, and the camera is the light here. Without
    // this the bloom is seen edge-on and reads as a flat fan rather than a face.
    headTilt: rng.range(0.75, 1.2),
    phyllotaxis: 0,
  }

  // Warm blush wrapping around hue 0: coral and rose on one side, wine on the
  // other. Never foliage-green, never a full-spectrum lottery -- this is a
  // graphite drawing with one colored pencil.
  g.petalHue = rng.next() < 0.38 ? rng.range(0.93, 1.0) : rng.range(0.0, 0.055)

  // Count and fullness are not independent. A whorl's circumference grows with
  // radius faster than any petal can widen, so past a certain size the only thing
  // that actually closes the gaps between petal tips is having more petals: the
  // full end of the range has to land on 13 and 21, the spare end on 3 and 5.
  const countT = Math.min(g.corollaFullness * 0.75 + rng.next() * 0.45, 0.999)
  g.petalCount = FIBONACCI_PETALS[Math.floor(countT * FIBONACCI_PETALS.length)]
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
  g.petalRows = g.corollaFullness > 0.68 ? 3 : 2

  // The fraction of its full width the petal already has where it leaves the
  // receptacle. This is the whole difference between a wheel of spokes and a
  // flower: a petal that tapers away to nothing at its base leaves a wedge of
  // bare paper between itself and its neighbour that no amount of extra width
  // further out can close.
  g.petalBaseWidth = 0.2 + 0.45 * g.corollaFullness

  // Width from the room each petal has to fill, measured on the circle the whorl
  // sweeps at the petal TIPS: the widest point, and the only place gaps really
  // show. A packed head is asked to overlap there, a spare one is allowed its
  // daylight. Sampling a width in pixels instead makes fullness a lottery -- the
  // same 60px petal closes a 21-petal head and leaves a 5-petal one full of holes.
  const tipRadius = g.receptacleRadius * 0.8 + g.petalLength * Math.sin(g.petalTilt)
  const tipShare = (2 * Math.PI * tipRadius) / g.petalCount
  g.petalWidth = tipShare * (0.55 + 0.85 * g.corollaFullness) * g.petalBroad

  // A petal wider than it is long stops reading as a petal, which is the binding
  // limit on a three- or five-petal head: those flowers show gaps between their
  // tips in life too, and closing them here would just make a pinwheel.
  g.petalWidth = Math.min(Math.max(g.petalWidth, 20), g.petalLength * 0.85)

  return g
}
