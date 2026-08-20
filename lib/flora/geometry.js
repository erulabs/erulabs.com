// Builds one merged skinned BufferGeometry for the whole plant.
//
// Everything is authored in the STRAIGHT bind pose: tubes run along +Y, ribbons
// lie in the XY plane extending +Y. All curvature -- stem arc, leaf droop, petal
// splay and curl, wind -- comes from bone rotations. That keeps this file
// loop-simple, gives every joint something meaningful to do so the physics reads
// everywhere, and makes linear blend skinning safe because nothing twists.
//
// NOT a candidate for instancing: dryad-style leaf instancing works because its
// leaves are rigid. Ours are skinned by unique bones and share this one mesh.

import { BufferAttribute, BufferGeometry } from 'three'

import { KIND_LEAF, KIND_PETAL, KIND_RECEPTACLE, KIND_STEM } from './genome.js'
import { createRng } from './rng.js'

const RADIAL_SEGMENTS = 5
// Vertices across a ribbon: two edges, two mid-panels, one midrib.
const CROSS_SEGMENTS = 5
// Three stations per bone is the minimum that bends smoothly instead of faceting.
const RINGS_PER_BONE = 3

const TEETH = 7

function smoothstep(a, b, x) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

// Width profiles, normalised to [0,1] of the organ's half width.
function widthAt(organ, t) {
  if (organ.profile === 'petal') {
    // Obovate paddle: already broad where it leaves the receptacle, at full width
    // a third of the way out, and held there until it rounds off at the end. Both
    // ends matter for a full head. A petal that tapers to a point at its base
    // leaves a wedge of bare paper against its neighbour at the centre; one that
    // tapers to a point at its tip leaves the same wedge out where the whorl is
    // widest, which is most of what makes a big bloom read as a wheel of spokes.
    const base = organ.baseWidth
    // Elliptical end rather than a linear taper: a petal that loses its width
    // over the last fifth is pointed, and points are where the gaps are, because
    // the tips sit on the largest circle the whorl sweeps.
    const end = Math.sqrt(1 - Math.pow(smoothstep(0.8, 1.0, t), 2))
    return (base + (1 - base) * smoothstep(0, 0.34, t)) * end
  }
  // Lanceolate leaf: narrow at the petiole, widest around 45%, drawn to a point.
  return Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8)
}

function organAO(kind) {
  if (kind === KIND_PETAL) return 0.5
  if (kind === KIND_RECEPTACLE) return 0.45
  if (kind === KIND_LEAF) return 0.72
  return 0.85
}

// Staggered bloom-in. Ordered so the drawing reads as one continuous sweep up the
// plant: the stem draws itself bottom to top, each leaf unfurls as the sweep
// passes its insertion height, and the flower opens last.
function growthOffset(kind, heightFrac, param) {
  if (kind === KIND_STEM) return param * 0.55
  if (kind === KIND_LEAF) return 0.08 + heightFrac * 0.5 + param * 0.06
  if (kind === KIND_RECEPTACLE) return 0.6
  return 0.66 + param * 0.08
}

function organColor(genome, kind, param, out) {
  if (kind === KIND_PETAL || kind === KIND_RECEPTACLE) {
    out[0] = genome.petalHue + genome.petalTipHueShift * param
    out[1] = genome.petalSat * (kind === KIND_RECEPTACLE ? 1 : 1 - 0.25 * (1 - param))
    out[2] = genome.petalBaseVal + (genome.petalVal - genome.petalBaseVal) * param
  } else {
    out[0] = genome.foliageHue
    out[1] = genome.foliageSat
    out[2] = genome.foliageVal + genome.foliageTipLift * param
  }
}

function organCounts(organ) {
  const stations = organ.bones.length * RINGS_PER_BONE + 1
  if (organ.shape === 'ribbon') {
    return {
      vertices: stations * CROSS_SEGMENTS,
      indices: (stations - 1) * (CROSS_SEGMENTS - 1) * 6,
    }
  }
  return { vertices: stations * RADIAL_SEGMENTS, indices: (stations - 1) * RADIAL_SEGMENTS * 6 }
}

function createWriter(vertexCount, indexCount) {
  return {
    v: 0,
    i: 0,
    position: new Float32Array(vertexCount * 3),
    normal: new Float32Array(vertexCount * 3),
    skinIndex: new Uint16Array(vertexCount * 4),
    skinWeight: new Float32Array(vertexCount * 4),
    outlineDir: new Float32Array(vertexCount * 3),
    organBase: new Float32Array(vertexCount * 3),
    hsv: new Float32Array(vertexCount * 3),
    param: new Float32Array(vertexCount),
    kind: new Float32Array(vertexCount),
    radius: new Float32Array(vertexCount),
    arc: new Float32Array(vertexCount),
    growth: new Float32Array(vertexCount),
    hatchSeed: new Float32Array(vertexCount),
    ao: new Float32Array(vertexCount),
    hull: new Float32Array(vertexCount),
    index: vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount),
  }
}

// Walks an organ's chain and yields, per station, the distance along it, the
// normalised parameter, and the two bones that station is skinned to.
function stationAt(spec, organ, cum, r) {
  const bones = organ.bones
  const n = bones.length
  const u = r / RINGS_PER_BONE
  const k = Math.min(Math.floor(u), n - 1)
  const t = u - k

  // Bone-centre weighting: a vertex at the middle of a bone is fully that bone's,
  // and a vertex on a joint is an even 50/50 blend. That is what makes a bend
  // smooth instead of creasing at the joint ring.
  const f = u - 0.5
  const i0 = Math.floor(f)
  const frac = f - i0

  return {
    dist: cum[k] + t * spec.length[bones[k]],
    param: organ.length > 0 ? (cum[k] + t * spec.length[bones[k]]) / organ.length : 0,
    lerp: t,
    node: k,
    boneA: bones[Math.min(Math.max(i0, 0), n - 1)],
    boneB: bones[Math.min(Math.max(i0 + 1, 0), n - 1)],
    weightA: 1 - frac,
    weightB: frac,
  }
}

function cumulative(spec, organ) {
  const bones = organ.bones
  const cum = new Float32Array(bones.length + 1)
  for (let k = 0; k < bones.length; k++) cum[k + 1] = cum[k] + spec.length[bones[k]]
  return cum
}

function writeShared(w, vi, st, organ, genome, hatchSeed, hsv, ox, oy, oz) {
  w.skinIndex[vi * 4] = st.boneA
  w.skinIndex[vi * 4 + 1] = st.boneB
  w.skinWeight[vi * 4] = st.weightA
  w.skinWeight[vi * 4 + 1] = st.weightB

  organColor(genome, organ.kind, st.param, hsv)
  w.hsv[vi * 3] = hsv[0]
  w.hsv[vi * 3 + 1] = hsv[1]
  w.hsv[vi * 3 + 2] = hsv[2]

  // Where this organ sprouts from, in bind space. The bloom-in animation
  // collapses each organ toward this point, so it unfurls from its base rather
  // than scaling about the origin.
  w.organBase[vi * 3] = ox
  w.organBase[vi * 3 + 1] = oy
  w.organBase[vi * 3 + 2] = oz

  w.param[vi] = st.param
  w.kind[vi] = organ.kind
  w.growth[vi] = Math.min(growthOffset(organ.kind, organ.heightFrac, st.param), 1)
  w.hatchSeed[vi] = hatchSeed
  w.ao[vi] = organAO(organ.kind) + (1 - organAO(organ.kind)) * st.param
}

function emitTube(w, spec, organ, genome, hatchSeed, hsv) {
  const stations = organ.bones.length * RINGS_PER_BONE + 1
  const baseVertex = w.v
  const cum = cumulative(spec, organ)

  const ox = spec.bindPos[organ.bones[0] * 3]
  const oy = spec.bindPos[organ.bones[0] * 3 + 1]
  const oz = spec.bindPos[organ.bones[0] * 3 + 2]

  for (let r = 0; r < stations; r++) {
    const st = stationAt(spec, organ, cum, r)
    const radius = organ.radii[st.node] + (organ.radii[st.node + 1] - organ.radii[st.node]) * st.lerp

    for (let a = 0; a < RADIAL_SEGMENTS; a++) {
      const angle = (a / RADIAL_SEGMENTS) * Math.PI * 2
      const cx = Math.cos(angle)
      const cz = Math.sin(angle)
      const vi = w.v

      w.position[vi * 3] = ox + cx * radius
      w.position[vi * 3 + 1] = oy + st.dist
      w.position[vi * 3 + 2] = oz + cz * radius

      w.normal[vi * 3] = cx
      w.normal[vi * 3 + 2] = cz

      // A tube is closed and convex, so its own normal is a valid silhouette
      // direction. Ribbons are not, and author this differently below.
      w.outlineDir[vi * 3] = cx
      w.outlineDir[vi * 3 + 2] = cz

      w.radius[vi] = radius
      w.arc[vi] = st.dist + angle * radius
      writeShared(w, vi, st, organ, genome, hatchSeed, hsv, ox, oy, oz)
      w.hull[vi] = 1
      w.v++
    }
  }

  for (let r = 0; r < stations - 1; r++) {
    for (let a = 0; a < RADIAL_SEGMENTS; a++) {
      const a1 = (a + 1) % RADIAL_SEGMENTS
      const lo0 = baseVertex + r * RADIAL_SEGMENTS + a
      const lo1 = baseVertex + r * RADIAL_SEGMENTS + a1
      const hi0 = baseVertex + (r + 1) * RADIAL_SEGMENTS + a
      const hi1 = baseVertex + (r + 1) * RADIAL_SEGMENTS + a1
      w.index[w.i++] = lo0
      w.index[w.i++] = hi0
      w.index[w.i++] = lo1
      w.index[w.i++] = lo1
      w.index[w.i++] = hi0
      w.index[w.i++] = hi1
    }
  }
}

function emitRibbon(w, spec, organ, genome, hatchSeed, hsv) {
  const stations = organ.bones.length * RINGS_PER_BONE + 1
  const baseVertex = w.v
  const cum = cumulative(spec, organ)

  const ox = spec.bindPos[organ.bones[0] * 3]
  const oy = spec.bindPos[organ.bones[0] * 3 + 1]
  const oz = spec.bindPos[organ.bones[0] * 3 + 2]

  // Which local axis the blade's width runs along, X or Z. It matters because the
  // bone carrying the organ is rotated azimuth-about-Y and then bent about Z: a
  // blade authored across X ends up with its width swinging into the vertical and
  // its face pointing tangentially, so it stands on edge like a windmill vane and
  // vanishes for every azimuth that happens to point at the camera. Local Z stays
  // tangential to the whorl under that rotation whatever the bend, which puts the
  // face along the flower's axis -- what headTilt then tips toward the viewer.
  // A leaf wants the opposite: its face up, presented to the sky, so it keeps X.
  const across = organ.kind === KIND_PETAL ? 2 : 0
  const fold = across === 2 ? 0 : 2

  for (let r = 0; r < stations; r++) {
    const st = stationAt(spec, organ, cum, r)
    let halfWidth = organ.halfWidth * widthAt(organ, st.param)
    if (organ.serration > 0) {
      halfWidth *= 1 + organ.serration * 0.3 * Math.sin(st.param * Math.PI * 2 * TEETH)
    }
    const isTip = r === stations - 1

    for (let c = 0; c < CROSS_SEGMENTS; c++) {
      const xn = (c / (CROSS_SEGMENTS - 1)) * 2 - 1
      const vi = w.v
      // Raised midrib. A flat blade reads as a paper cut-out; the crease is what
      // makes it catch light like a leaf. Scaled by the LOCAL width so the fold is
      // a channel of constant angle -- scaling it by the organ's widest point
      // instead crimps the narrow base almost shut, which on a broad petal shows
      // up as exactly the gap the base width is there to close.
      w.position[vi * 3] = ox
      w.position[vi * 3 + 1] = oy + st.dist
      w.position[vi * 3 + 2] = oz
      w.position[vi * 3 + across] += xn * halfWidth
      w.position[vi * 3 + fold] += organ.crease * halfWidth * (1 - Math.abs(xn))

      // Analytic normal of the creased surface. A fold proportional to the local
      // width has a constant cross-slope, so this is just the crease depth.
      const slope = organ.crease * Math.sign(xn)
      const inv = 1 / Math.hypot(slope, 1)
      w.normal[vi * 3 + across] = slope * inv
      w.normal[vi * 3 + fold] = inv

      // Only boundary vertices grow the silhouette. Interior ones must be exactly
      // zero: a flat ribbon's normal points out of its own plane, so extruding
      // along it produces no outline at all when the leaf faces the camera.
      if (Math.abs(xn) > 0.99) {
        w.outlineDir[vi * 3 + across] = Math.sign(xn)
      } else if (isTip) {
        w.outlineDir[vi * 3 + 1] = 1
      }

      w.radius[vi] = Math.max(halfWidth, 0.35)
      w.arc[vi] = st.dist + xn * halfWidth
      writeShared(w, vi, st, organ, genome, hatchSeed, hsv, ox, oy, oz)
      w.v++
    }
  }

  for (let r = 0; r < stations - 1; r++) {
    for (let c = 0; c < CROSS_SEGMENTS - 1; c++) {
      const a = baseVertex + r * CROSS_SEGMENTS + c
      const b = a + 1
      const cc = baseVertex + (r + 1) * CROSS_SEGMENTS + c
      const d = cc + 1
      w.index[w.i++] = a
      w.index[w.i++] = b
      w.index[w.i++] = cc
      w.index[w.i++] = b
      w.index[w.i++] = d
      w.index[w.i++] = cc
    }
  }
}

export function buildGeometry(spec, genome) {
  const rng = createRng((genome.seed ^ 0x2f1e3d4c) >>> 0)
  const hsv = [0, 0, 0]

  let vertexCount = 0
  let indexCount = 0
  for (let o = 0; o < spec.organs.length; o++) {
    const c = organCounts(spec.organs[o])
    vertexCount += c.vertices
    indexCount += c.indices
  }

  const rootY = spec.rootOffset[1]
  const span = Math.max(spec.height, 1)

  const w = createWriter(vertexCount, indexCount)
  for (let o = 0; o < spec.organs.length; o++) {
    const organ = spec.organs[o]
    // Where this organ sits up the plant, 0 at the ground and 1 at the bloom.
    organ.heightFrac = Math.min(Math.max((spec.bindPos[organ.bones[0] * 3 + 1] - rootY) / span, 0), 1)
    const hatchSeed = rng.range(0, 10)
    if (organ.shape === 'ribbon') emitRibbon(w, spec, organ, genome, hatchSeed, hsv)
    else emitTube(w, spec, organ, genome, hatchSeed, hsv)
  }

  if (process.env.NODE_ENV !== 'production') assertWeightsNormalised(w, vertexCount)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(w.position, 3))
  geometry.setAttribute('normal', new BufferAttribute(w.normal, 3))
  geometry.setAttribute('skinIndex', new BufferAttribute(w.skinIndex, 4))
  geometry.setAttribute('skinWeight', new BufferAttribute(w.skinWeight, 4))
  geometry.setAttribute('aOutlineDir', new BufferAttribute(w.outlineDir, 3))
  geometry.setAttribute('aOrganBase', new BufferAttribute(w.organBase, 3))
  geometry.setAttribute('aHSV', new BufferAttribute(w.hsv, 3))
  geometry.setAttribute('aParam', new BufferAttribute(w.param, 1))
  geometry.setAttribute('aKind', new BufferAttribute(w.kind, 1))
  geometry.setAttribute('aRadius', new BufferAttribute(w.radius, 1))
  geometry.setAttribute('aArc', new BufferAttribute(w.arc, 1))
  geometry.setAttribute('aGrowth', new BufferAttribute(w.growth, 1))
  geometry.setAttribute('aHatchSeed', new BufferAttribute(w.hatchSeed, 1))
  geometry.setAttribute('aAO', new BufferAttribute(w.ao, 1))
  geometry.setAttribute('aHull', new BufferAttribute(w.hull, 1))
  geometry.setIndex(new BufferAttribute(w.index, 1))

  return geometry
}

// Weights that don't sum to 1 collapse vertices toward the origin, and the
// symptom (a plant with a spike through it) is nowhere near the cause.
function assertWeightsNormalised(w, vertexCount) {
  for (let i = 0; i < vertexCount; i++) {
    const sum = w.skinWeight[i * 4] + w.skinWeight[i * 4 + 1] + w.skinWeight[i * 4 + 2] + w.skinWeight[i * 4 + 3]
    if (Math.abs(sum - 1) > 1e-4) {
      throw new Error(`flora: skin weights for vertex ${i} sum to ${sum}, expected 1`)
    }
  }
}
