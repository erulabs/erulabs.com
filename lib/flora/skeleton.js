// Builds the bone graph. Two halves on purpose: buildSkeletonSpec() produces
// plain typed arrays (what the physics solver and geometry builder consume), and
// instantiateSkeleton() turns that into three.js Bones.
//
// Everything is emitted parent-before-child, which the radius pass, the geometry
// builder and the physics solver all rely on.

import { Bone, Euler, Skeleton } from 'three'

import { KIND_LEAF, KIND_PETAL, KIND_RECEPTACLE, KIND_STEM } from './genome.js'
import { createRng } from './rng.js'

// Murray's law exponent. r_parent^n = sum(r_child^n) -- the "pipe model" that
// gives branching structures their natural taper.
const PIPE_EXPONENT = 2.2

// Bone texture is sized ceil(sqrt(bones*4)) rounded up to a power of two, so 128
// bones costs a 32x32 RGBA float upload per frame. Past that it stops being free.
export const MAX_BONES = 128

// Mass is volume in px^3 times a density, and drag area is the projected area in
// px^2. Keeping both in real scene units means gravity and wind stay comparable
// without a fudge factor between them.
const DENSITY = 1e-3
const BLADE_THICKNESS = 1

const _euler = new Euler()

function createAccumulator() {
  return { parentIdx: [], length: [], kind: [], restEuler: [], offsetY: [], tipRadius: [], organs: [] }
}

function addBone(acc, parent, length, kind, offsetY, ex, ey, ez, tipRadius) {
  const idx = acc.parentIdx.length
  acc.parentIdx.push(parent)
  acc.length.push(length)
  acc.kind.push(kind)
  acc.offsetY.push(offsetY)
  acc.restEuler.push(ex, ey, ez)
  acc.tipRadius.push(tipRadius)
  return idx
}

export function buildSkeletonSpec(genome) {
  // A separate stream from the genome's, so adding a gene later doesn't shift
  // the skeleton's random sequence and change every existing seed.
  const rng = createRng((genome.seed ^ 0x5bf03635) >>> 0)
  const acc = createAccumulator()

  const stemBones = buildStem(acc, genome, rng)
  const tipBone = stemBones[stemBones.length - 1]
  const bloomBone = buildBloom(acc, genome, rng, tipBone)
  buildLeaves(acc, genome, rng, stemBones)

  const count = acc.parentIdx.length
  const spec = {
    count,
    parentIdx: Int16Array.from(acc.parentIdx),
    length: Float32Array.from(acc.length),
    kind: Uint8Array.from(acc.kind),
    restEuler: Float32Array.from(acc.restEuler),
    offsetY: Float32Array.from(acc.offsetY),
    tipRadius: Float32Array.from(acc.tipRadius),
    radius: new Float32Array(count),
    // Roughly places the bloom near the origin. plant.js then measures where the
    // flower actually ends up once the rest pose and gravity droop are applied,
    // and offsets the whole plant so the bloom registers exactly with the avatar
    // -- a curved stem can otherwise carry it a long way off to one side.
    rootOffset: [0, -(genome.stemHeight + bloomLift(genome)), 0],
    bloomLift: bloomLift(genome),
    height: genome.stemHeight,
    organs: acc.organs,
    bloomBone,
  }

  computeRadii(spec, genome)
  computeBindPositions(spec)
  attachOrganProfiles(spec)

  return spec
}

// Roughly how far the open bloom rises above the stem tip.
function bloomLift(genome) {
  return genome.petalLength * 0.38 * Math.cos(Math.min(genome.petalTilt, 1.45))
}

function buildStem(acc, genome, rng) {
  const n = genome.stemSegments
  const segLen = genome.stemHeight / n
  const bones = []

  for (let i = 0; i < n; i++) {
    // Bend accumulates toward the tip, so the stalk arcs over the way a real one
    // does rather than leaning like a straight rod.
    const t = n === 1 ? 0 : i / (n - 1)
    const bendZ = (genome.stemLean + genome.stemCurve * t) / n + rng.gauss(0, genome.stemWander)
    const bendX = rng.gauss(0, genome.stemWander * 0.7)
    const parent = i === 0 ? -1 : bones[i - 1]
    bones.push(addBone(acc, parent, segLen, KIND_STEM, i === 0 ? 0 : segLen, bendX, 0, bendZ, genome.stemTipRadius))
  }

  // Continue the stalk well below the simulated root. The visible flower keeps
  // its compact, responsive bone chain, while the page clips this inexpensive
  // rigid tail so the plant always feels rooted somewhere beyond the viewport.
  acc.organs.push({ kind: KIND_STEM, bones, shape: 'tube', tailLength: 1700 })
  return bones
}

function buildBloom(acc, genome, rng, tipBone) {
  const stemLen = genome.stemHeight / genome.stemSegments

  const receptacle = addBone(
    acc,
    tipBone,
    genome.receptacleRadius * 1.4,
    KIND_RECEPTACLE,
    stemLen,
    genome.headTilt,
    genome.headTurn,
    0,
    genome.receptacleRadius
  )
  acc.organs.push({
    kind: KIND_RECEPTACLE,
    bones: [receptacle],
    shape: 'dome',
    radius: genome.receptacleRadius,
    depth: genome.receptacleRadius * 0.42,
    frontOffset: genome.receptacleRadius * 0.88,
  })

  // The quiet green star behind the corolla is easy to omit and surprisingly
  // important: it explains how the flower attaches to the stalk, especially when
  // the head nods far enough for its underside to show.
  buildSepals(acc, genome, rng, receptacle)

  // Fit the corolla into the bone budget. A 21-petal double whorl at three bones
  // each would overrun 128 on its own, so shorten the petal chains first (they
  // lose some curl) and only drop the second whorl if that is not enough. Petal
  // COUNT gives last, because it is the most visible thing about a flower.
  const spent = acc.parentIdx.length + genome.leafCount * 4
  let rows = genome.petalRows
  let perRow = genome.petalCount
  // Four joints over a petal this long, so the recurve arrives as a curve rather
  // than as two visible kinks. Sparse whorls keep all four; dense ones give them
  // straight back to the budget below.
  let segments = 4
  // Spend the budget in the order a viewer notices least. Two joints per petal is
  // the floor worth having -- one joint is a rigid flap -- so whorls are given up
  // before the last of the curl, and petal COUNT gives last of all, because it is
  // the most visible thing about a flower.
  while (rows * perRow * segments > MAX_BONES - spent) {
    if (segments > 2) segments--
    else if (rows > 2) rows--
    else if (perRow > 5) perRow = perRow === 21 ? 13 : perRow === 13 ? 8 : 5
    else if (segments > 1) segments--
    else if (rows > 1) rows--
    else break
  }

  for (let row = 0; row < rows; row++) {
    // Inner rows sit markedly more upright and shorter, the way a real corolla
    // nests: the outer whorl opens flat while the middle is still a standing
    // cluster of half-length petals cupping the centre.
    const rowT = rows === 1 ? 0 : row / (rows - 1)
    const tilt = genome.petalTilt * (1 - rowT * 0.38)
    const lengthScale = 1 - rowT * 0.45
    // Stagger the whorls across one petal step. A half-step per row only works
    // for two rows: at three, the third row comes back into line with the first
    // and the head grows radial spokes of bare paper.
    const rowPhase = (row / rows) * ((Math.PI * 2) / perRow) + row * 0.11

    for (let p = 0; p < perRow; p++) {
      const irregularity = genome.petalIrregularity
      const azimuth = rowPhase + (p / perRow) * Math.PI * 2 + rng.gauss(0, irregularity)
      const individualLength = Math.max(0.7, Math.min(1.3, 1 + rng.gauss(0, irregularity * 0.9)))
      const individualWidth = Math.max(0.7, Math.min(1.3, 1 + rng.gauss(0, irregularity)))
      const segLen = (genome.petalLength * lengthScale * individualLength) / segments
      const bones = []

      for (let s = 0; s < segments; s++) {
        const first = s === 0
        // The whole petal is swung out at its base; later segments only add the
        // recurve, which is what gives the bloom its silhouette.
        const bendZ = first ? tilt + rng.gauss(0, 0.055) : (genome.petalCurl + rng.gauss(0, 0.05)) / segments
        const bendX = first ? rng.gauss(0, 0.045) : rng.gauss(0, 0.018)
        const bendY = first ? azimuth : 0
        const parent = first ? receptacle : bones[s - 1]
        const offset = first ? genome.receptacleRadius * 0.8 : segLen
        bones.push(addBone(acc, parent, segLen, KIND_PETAL, offset, bendX, bendY, bendZ, 0.4))
      }

      acc.organs.push({
        kind: KIND_PETAL,
        bones,
        shape: 'ribbon',
        halfWidth: (genome.petalWidth * lengthScale * individualWidth) / 2,
        // Deeper than a leaf's. A petal this wide needs to cup, or it reads as a
        // flat paper cut-out and the shading has no form to describe.
        crease: genome.petalCup * (1 + rng.gauss(0, 0.08)),
        serration: 0,
        profile: 'petal',
        baseWidth: genome.petalBaseWidth * rng.range(0.92, 1.08),
        shoulder: Math.min(Math.max(genome.petalShoulder + rng.gauss(0, 0.035), 0.38), 0.9),
        waist: Math.max(0, genome.petalWaist + rng.gauss(0, 0.018)),
        waistAt: Math.min(Math.max(genome.petalWaistAt + rng.gauss(0, 0.025), 0.2), 0.72),
        tipRound: Math.min(Math.max(genome.petalTipRound + rng.gauss(0, 0.06), 0.15), 1),
        tipNotch: Math.max(0, genome.petalTipNotch + rng.gauss(0, 0.018)),
        edgeWave: genome.petalEdgeWave * rng.range(0.65, 1.35),
        edgeLobes: genome.petalEdgeLobes * rng.range(0.9, 1.1),
        twist: genome.petalTwist + rng.gauss(0, 0.055),
        asymmetry: rng.gauss(0, 0.055),
        hueShift: genome.rowHueShift * (rowT - 0.35) + rng.gauss(0, 0.006),
        satScale: 1 - rowT * rng.range(0.02, 0.12),
        valueScale: 1 - rowT * rng.range(0.015, 0.09),
        across: 2,
      })
    }
  }

  return receptacle
}

function buildSepals(acc, genome, rng, receptacle) {
  const count = genome.sepalCount
  const segments = 2

  for (let i = 0; i < count; i++) {
    const azimuth = (i / count) * Math.PI * 2 + rng.gauss(0, 0.08)
    const length = genome.sepalLength * rng.range(0.78, 1.16)
    const segLen = length / segments
    const bones = []

    for (let s = 0; s < segments; s++) {
      const first = s === 0
      const parent = first ? receptacle : bones[s - 1]
      bones.push(
        addBone(
          acc,
          parent,
          segLen,
          KIND_LEAF,
          first ? genome.receptacleRadius * 0.45 : segLen,
          rng.gauss(0, 0.035),
          first ? azimuth : 0,
          first ? genome.petalTilt * 0.9 + rng.gauss(0, 0.08) : rng.range(0.03, 0.15),
          0.35
        )
      )
    }

    acc.organs.push({
      kind: KIND_LEAF,
      bones,
      shape: 'ribbon',
      halfWidth: (genome.sepalWidth * rng.range(0.82, 1.15)) / 2,
      crease: 0.2,
      serration: rng.range(0, 0.14),
      profile: 'leaf',
      edgeWave: rng.range(0.01, 0.045),
      twist: rng.gauss(0, 0.08),
      asymmetry: rng.gauss(0, 0.05),
      across: 2,
      isSepal: true,
    })
  }
}

function buildLeaves(acc, genome, rng, stemBones) {
  const n = stemBones.length
  const count = genome.leafCount
  const handedness = rng.sign()

  for (let i = 0; i < count; i++) {
    const evenT =
      count === 1
        ? genome.leafInsertLow
        : genome.leafInsertLow + (genome.leafInsertHigh - genome.leafInsertLow) * (i / (count - 1))
    const spacing = (genome.leafInsertHigh - genome.leafInsertLow) / Math.max(count - 1, 1)
    const t = Math.min(Math.max(evenT + rng.gauss(0, spacing * 0.1), genome.leafInsertLow), genome.leafInsertHigh)
    // Which stem bone the leaf hangs off, and where along it.
    const along = t * n
    const hostIdx = Math.min(Math.floor(along), n - 1)
    const host = stemBones[hostIdx]
    const offsetY = (along - hostIdx) * acc.length[host]

    // Preserve enough depth for parallax, but keep the alternating left/right
    // rhythm legible from the fixed camera instead of letting several leaves
    // project onto the same side by chance.
    const azimuth = rng.gauss(0, 0.24)
    const side = i % 2 === 0 ? handedness : -handedness
    const maturity = 1 - (count > 1 ? (i / (count - 1)) * 0.16 : 0)

    // Petiole: two bones, swung away from the stem and drooping.
    const petioleSeg = (genome.petioleLength * maturity * rng.range(0.86, 1.14)) / 2
    const petiole = []
    for (let s = 0; s < 2; s++) {
      const first = s === 0
      const bendZ = first ? genome.leafAngle * side : genome.leafDroop * 0.4 * side
      const bendY = first ? azimuth : 0
      const parent = first ? host : petiole[s - 1]
      petiole.push(addBone(acc, parent, petioleSeg, KIND_LEAF, first ? offsetY : petioleSeg, 0, bendY, bendZ, 0.9))
    }

    acc.organs.push({ kind: KIND_LEAF, bones: petiole, shape: 'tube' })

    // Blade: two more bones continuing the petiole, arching over.
    const bladeSeg = (genome.bladeLength * maturity * rng.range(0.86, 1.14)) / 2
    const blade = []
    for (let s = 0; s < 2; s++) {
      const parent = s === 0 ? petiole[petiole.length - 1] : blade[s - 1]
      const offset = s === 0 ? petioleSeg : bladeSeg
      blade.push(addBone(acc, parent, bladeSeg, KIND_LEAF, offset, 0, 0, genome.leafDroop * side, 0.5))
    }

    acc.organs.push({
      kind: KIND_LEAF,
      bones: blade,
      shape: 'ribbon',
      halfWidth: (genome.bladeWidth * maturity * rng.range(0.84, 1.16)) / 2,
      crease: genome.bladeCrease,
      serration: genome.bladeSerration,
      profile: 'leaf',
      edgeWave: rng.range(0.015, 0.065),
      twist: genome.leafTwist + rng.gauss(0, 0.08),
      asymmetry: rng.gauss(0, 0.075),
    })
  }
}

// Bind-pose world positions of each bone's base. The bind pose is straight, so
// this is a pure +Y accumulation, and geometry.js can author vertices directly
// in this space -- exactly the space Skeleton derives its inverses from.
function computeBindPositions(spec) {
  const { count, parentIdx, offsetY, rootOffset } = spec
  const bindPos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p = parentIdx[i]
    if (p < 0) {
      bindPos[i * 3] = rootOffset[0]
      bindPos[i * 3 + 1] = rootOffset[1]
      bindPos[i * 3 + 2] = rootOffset[2]
    } else {
      bindPos[i * 3] = bindPos[p * 3]
      bindPos[i * 3 + 1] = bindPos[p * 3 + 1] + offsetY[i]
      bindPos[i * 3 + 2] = bindPos[p * 3 + 2]
    }
  }
  spec.bindPos = bindPos
}

// Radius comes from two mechanisms real stems combine: the pipe model (branch
// cross-sections sum) and secondary growth (thickness accumulates with distance
// from the growing tip). Take whichever is larger.
function computeRadii(spec, genome) {
  const { count, parentIdx, length, kind, tipRadius, radius } = spec
  const baseR = genome.stemBaseRadius

  const distFromTip = new Float32Array(count)
  const pipe = new Float32Array(count)
  const childCount = new Int16Array(count)

  for (let i = 0; i < count; i++) {
    if (parentIdx[i] >= 0) childCount[parentIdx[i]]++
  }

  // A child always has a higher index than its parent, so one reverse pass
  // resolves the whole tree. Each bone must convert its accumulated sum back
  // into a radius BEFORE contributing to its parent -- passing the raw sum up
  // compounds it exponentially and the base ends up thousands of pixels wide.
  let totalLen = 0
  for (let i = count - 1; i >= 0; i--) {
    if (childCount[i] === 0) {
      distFromTip[i] = length[i]
      pipe[i] = tipRadius[i]
    } else {
      pipe[i] = Math.pow(pipe[i], 1 / PIPE_EXPONENT)
    }
    const p = parentIdx[i]
    if (p >= 0) {
      distFromTip[p] = Math.max(distFromTip[p], distFromTip[i] + length[p])
      pipe[p] += Math.pow(pipe[i], PIPE_EXPONENT)
    }
    if (kind[i] === KIND_STEM) totalLen = Math.max(totalLen, distFromTip[i])
  }

  for (let i = 0; i < count; i++) {
    if (kind[i] === KIND_STEM) {
      const s = totalLen > 0 ? Math.min(distFromTip[i] / totalLen, 1) : 0
      const growth = tipRadius[i] + (baseR - tipRadius[i]) * Math.pow(s, genome.stemTaperPower)
      radius[i] = Math.max(pipe[i], growth)
    } else {
      // Petioles, petals and the receptacle are short enough that the pipe model
      // alone reads correctly; secondary growth would just fatten them.
      radius[i] = Math.max(pipe[i], tipRadius[i])
    }
  }

  spec.distFromTip = distFromTip
  spec.totalLength = totalLen
}

// Geometry samples radius continuously along a chain, so each organ carries a
// per-node profile with one more entry than it has bones. This pass also assigns
// the per-bone mass and drag area the physics solver runs on.
function attachOrganProfiles(spec) {
  const mass = new Float32Array(spec.count)
  const area = new Float32Array(spec.count)

  for (let o = 0; o < spec.organs.length; o++) {
    const organ = spec.organs[o]
    const bones = organ.bones
    const radii = new Float32Array(bones.length + 1)
    for (let i = 0; i < bones.length; i++) radii[i] = spec.radius[bones[i]]
    radii[bones.length] = spec.tipRadius[bones[bones.length - 1]]
    organ.radii = radii

    let total = 0
    for (let i = 0; i < bones.length; i++) total += spec.length[bones[i]]
    organ.length = total

    for (let i = 0; i < bones.length; i++) {
      const b = bones[i]
      const len = spec.length[b]
      if (organ.shape === 'ribbon') {
        // A blade is a thin sheet: almost no volume, but a large face to the
        // wind. That ratio is exactly why leaf tips flutter while the stalk
        // barely moves, so it is worth expressing honestly rather than tuning.
        const width = organ.halfWidth * 2
        mass[b] = width * len * BLADE_THICKNESS * DENSITY
        area[b] = width * len * 0.7
      } else {
        const r = radii[i]
        mass[b] = Math.PI * r * r * len * DENSITY
        area[b] = 2 * r * len
      }
    }
  }

  spec.boneMass = mass
  spec.boneArea = area
}

export function instantiateSkeleton(spec) {
  const bones = []

  for (let i = 0; i < spec.count; i++) {
    const bone = new Bone()
    const p = spec.parentIdx[i]
    if (p < 0) {
      bone.position.set(spec.rootOffset[0], spec.rootOffset[1], spec.rootOffset[2])
    } else {
      bone.position.set(0, spec.offsetY[i], 0)
      bones[p].add(bone)
    }
    bones.push(bone)
  }

  const root = bones[0]

  // Order matters: Skeleton derives boneInverses from the CURRENT world matrices,
  // so the bind pose has to be the straight one the geometry is authored in.
  // Apply the rest curvature only after, or it bakes into the inverses and
  // cancels itself out.
  root.updateMatrixWorld(true)
  const skeleton = new Skeleton(bones)

  applyRestPose(spec, bones)
  root.updateMatrixWorld(true)

  return { bones, root, skeleton }
}

export function applyRestPose(spec, bones) {
  for (let i = 0; i < spec.count; i++) {
    _euler.set(spec.restEuler[i * 3], spec.restEuler[i * 3 + 1], spec.restEuler[i * 3 + 2], 'YZX')
    bones[i].quaternion.setFromEuler(_euler)
  }
}
