// Per-joint angular spring-dampers: a lumped-mass Euler-Bernoulli cantilever,
// which is the standard model for plant stems in the biomechanics literature.
//
// Each joint gets two rotational DOF -- bend about the axes perpendicular to its
// rest direction. No twist, because plants don't twist and because omitting it
// keeps linear blend skinning free of candy-wrapper artefacts.
//
// Chosen over a position-based (XPBD) solver deliberately. PBD solves for
// positions, but bone.quaternion needs rotations, and reconstructing one from
// the other leaves a fraction of a degree of per-frame jitter. Invisible on a
// character; very visible on a 1px hatched stem outline that boils at 10Hz.
// This formulation produces the quaternion directly, in one pass, with no
// constraint iterations and no jitter.

import { Euler } from 'three'

import { KIND_LEAF, KIND_PETAL, KIND_RECEPTACLE, KIND_STEM } from './genome.js'

// omega * dt < 0.6 keeps semi-implicit Euler unconditionally stable at 60Hz.
const MAX_FREQUENCY = 5.0
// A chain of joints under gravity is an inverted pendulum: each joint only holds
// itself up while omega^2 > g/comDist. Real gravity at this pixel scale loses
// that race and every mid-stem joint pins against its bend limit. Gravity's job
// here is only to give the plant a settled droop, so it is scaled down until the
// slow 0.5-1.5Hz sway the brief asks for is comfortably stable.
const GRAVITY = 300

// Drag coefficient rolled together with air density: F = DRAG * A * |v| * v,
// with A in px^2 and v in px/s.
const WIND_FORCE = 1.6e-5

// Quadratic drag integrated explicitly will run away if the relative speed or the
// resulting angular velocity is allowed to grow without bound. Both caps sit far
// above anything a light breeze produces, so they never engage in normal motion --
// they exist so a resumed background tab or a pathological genome cannot explode.
const MAX_REL_SPEED = 420

// Organs shelter each other from the wind: a corolla of fifteen petals does not
// present fifteen petals' worth of drag. Without this the summed area runs away
// up the hierarchy and the joint carrying the bloom whips around.
const SHELTER = 0.5
const MAX_ANGULAR_VELOCITY = 9

const _euler = new Euler()
const _wind = [0, 0, 0]

// Natural frequency band, damping ratio, and bend limit per organ. Frequency is
// what separates a heavy stalk swaying in 1.5s arcs from a petal quivering at 4Hz.
function dynamicsFor(kind, param) {
  switch (kind) {
    case KIND_PETAL:
      return { hz: 2.0 + 1.35 * param, zeta: 0.16, maxBend: 0.46 }
    case KIND_LEAF:
      return { hz: 1.35 + 1.15 * param, zeta: 0.15, maxBend: 0.68 }
    case KIND_RECEPTACLE:
      return { hz: 1.45, zeta: 0.2, maxBend: 0.25 }
    case KIND_STEM:
    default:
      // Graded along the stalk: stiff slow base, looser tip. Most of the visible
      // bend lands in the upper stem, which is correct -- a real stem's bending
      // stiffness goes as r^4, so its base is orders of magnitude stiffer.
      return { hz: 0.95 - 0.24 * param, zeta: 0.2, maxBend: 0.3 }
  }
}

export function createSolver(spec, genome) {
  const n = spec.count
  const solver = {
    n,
    spec,
    thetaX: new Float32Array(n),
    thetaZ: new Float32Array(n),
    velX: new Float32Array(n),
    velZ: new Float32Array(n),
    restX: new Float32Array(n),
    restZ: new Float32Array(n),
    azimuth: new Float32Array(n),
    omega: new Float32Array(n),
    zeta: new Float32Array(n),
    maxBend: new Float32Array(n),
    windForce: WIND_FORCE,
    invInertia: new Float32Array(n),
    subtreeMass: new Float32Array(n),
    subtreeArea: new Float32Array(n),
    comDist: new Float32Array(n),
    // Accumulated world-space bend, filled in parent-before-child each step.
    absX: new Float32Array(n),
    absZ: new Float32Array(n),
    absVelX: new Float32Array(n),
    absVelZ: new Float32Array(n),
  }

  for (let i = 0; i < n; i++) {
    solver.restX[i] = spec.restEuler[i * 3]
    solver.azimuth[i] = spec.restEuler[i * 3 + 1]
    solver.restZ[i] = spec.restEuler[i * 3 + 2]
    solver.thetaX[i] = solver.restX[i]
    solver.thetaZ[i] = solver.restZ[i]
  }

  computeSubtrees(solver)

  // Position along the owning organ, 0 at its base and 1 at its tip. Grading
  // stiffness by this rather than by a capped depth is what lets a long stem
  // curve smoothly instead of hinging at whichever joint the cap fell on.
  const chainParam = new Float32Array(n)
  for (let o = 0; o < spec.organs.length; o++) {
    const bones = spec.organs[o].bones
    for (let k = 0; k < bones.length; k++) {
      chainParam[bones[k]] = bones.length > 1 ? k / (bones.length - 1) : 0
    }
  }

  for (let i = 0; i < n; i++) {
    const param = chainParam[i]
    const d = dynamicsFor(spec.kind[i], param)
    const hz = Math.min(d.hz * genome.stiffness, MAX_FREQUENCY)
    solver.omega[i] = 2 * Math.PI * hz
    solver.zeta[i] = d.zeta
    solver.maxBend[i] = d.maxBend
    const inertia = Math.max(solver.subtreeMass[i] * solver.comDist[i] * solver.comDist[i], 1e-4)
    solver.invInertia[i] = 1 / inertia
  }

  settle(solver)
  return solver
}

// Lumped subtree mass, drag area, and centre-of-mass distance. Applying the
// subtree's force at its CoM is what couples the chain: a base stem bone carries
// the whole plant's inertia, a petal carries almost none, and that mass
// hierarchy is most of what makes plant motion legible.
function computeSubtrees(solver) {
  const { spec, n } = solver
  const moment = new Float32Array(n)

  for (let i = n - 1; i >= 0; i--) {
    solver.subtreeMass[i] += spec.boneMass[i]
    solver.subtreeArea[i] += spec.boneArea[i]
    // Own mass acts at the bone's midpoint.
    moment[i] += spec.boneMass[i] * spec.length[i] * 0.5

    const p = spec.parentIdx[i]
    if (p >= 0) {
      solver.subtreeMass[p] += solver.subtreeMass[i]
      solver.subtreeArea[p] += solver.subtreeArea[i] * SHELTER
      // Shift the child's moment into the parent's frame.
      moment[p] += moment[i] + solver.subtreeMass[i] * spec.offsetY[i]
    }
  }

  for (let i = 0; i < n; i++) {
    solver.comDist[i] = solver.subtreeMass[i] > 0 ? moment[i] / solver.subtreeMass[i] : spec.length[i] * 0.5
  }
}

// The plant should look like it has been standing there, not like it is sagging
// into place on frame 1. Solve each joint's gravity equilibrium by fixed-point
// iteration: theta_eq = theta_rest + gravityTorque(theta_eq) / (I * omega^2).
// The spring's rest angle stays the genome's design angle -- only the starting
// pose moves.
function settle(solver) {
  const n = solver.n
  for (let pass = 0; pass < 12; pass++) {
    accumulateAbsolute(solver)
    for (let i = 0; i < n; i++) {
      const k = solver.omega[i] * solver.omega[i]
      if (k <= 0) continue
      const tau = GRAVITY * solver.subtreeMass[i] * solver.comDist[i] * Math.sin(solver.absZ[i])
      solver.thetaZ[i] = solver.restZ[i] + (tau * solver.invInertia[i]) / k
      clampBend(solver, i)
    }
  }
  solver.velX.fill(0)
  solver.velZ.fill(0)
}

function accumulateAbsolute(solver) {
  const { spec, n } = solver
  for (let i = 0; i < n; i++) {
    const p = spec.parentIdx[i]
    if (p < 0) {
      solver.absX[i] = solver.thetaX[i]
      solver.absZ[i] = solver.thetaZ[i]
      solver.absVelX[i] = solver.velX[i]
      solver.absVelZ[i] = solver.velZ[i]
    } else {
      solver.absX[i] = solver.absX[p] + solver.thetaX[i]
      solver.absZ[i] = solver.absZ[p] + solver.thetaZ[i]
      solver.absVelX[i] = solver.absVelX[p] + solver.velX[i]
      solver.absVelZ[i] = solver.absVelZ[p] + solver.velZ[i]
    }
  }
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function clampBend(solver, i) {
  const lim = solver.maxBend[i]
  const lo = solver.restZ[i] - lim
  const hi = solver.restZ[i] + lim
  if (solver.thetaZ[i] < lo) solver.thetaZ[i] = lo
  else if (solver.thetaZ[i] > hi) solver.thetaZ[i] = hi

  const loX = solver.restX[i] - lim
  const hiX = solver.restX[i] + lim
  if (solver.thetaX[i] < loX) solver.thetaX[i] = loX
  else if (solver.thetaX[i] > hiX) solver.thetaX[i] = hiX
}

export function stepSolver(solver, wind, dt, time, windEnabled) {
  const { spec, n } = solver
  accumulateAbsolute(solver)

  for (let i = 0; i < n; i++) {
    const mass = solver.subtreeMass[i]
    const com = solver.comDist[i]
    const sz = Math.sin(solver.absZ[i])
    const cz = Math.cos(solver.absZ[i])
    const sx = Math.sin(solver.absX[i])
    const cx = Math.cos(solver.absX[i])

    let fx = 0
    let fy = -GRAVITY * mass
    let fz = 0

    if (windEnabled) {
      wind.sample(time, spec.bindPos[i * 3], spec.bindPos[i * 3 + 1], _wind)
      // Subtracting the CoM's own velocity gives aerodynamic damping for free:
      // the plant settles after a gust instead of ringing.
      const relX = _wind[0] - -com * cz * solver.absVelZ[i]
      const relY = _wind[1]
      const relZ = _wind[2] - com * cx * solver.absVelX[i]
      const speed = Math.min(Math.hypot(relX, relY, relZ), MAX_REL_SPEED)
      const drag = solver.windForce * solver.subtreeArea[i] * speed
      fx += drag * relX
      fy += drag * relY
      fz += drag * relZ
    }

    // Torque of the lumped subtree force about the joint's two bend axes.
    const tauZ = com * (-sz * fy - cz * fx)
    const tauX = com * (cx * fz - sx * fy)

    const w = solver.omega[i]
    const damp = 2 * solver.zeta[i] * w
    const k = w * w

    const accZ = tauZ * solver.invInertia[i] - damp * solver.velZ[i] - k * (solver.thetaZ[i] - solver.restZ[i])
    const accX = tauX * solver.invInertia[i] - damp * solver.velX[i] - k * (solver.thetaX[i] - solver.restX[i])

    solver.velZ[i] = clamp(solver.velZ[i] + accZ * dt, -MAX_ANGULAR_VELOCITY, MAX_ANGULAR_VELOCITY)
    solver.velX[i] = clamp(solver.velX[i] + accX * dt, -MAX_ANGULAR_VELOCITY, MAX_ANGULAR_VELOCITY)
    solver.thetaZ[i] += solver.velZ[i] * dt
    solver.thetaX[i] += solver.velX[i] * dt
    clampBend(solver, i)
  }
}

export function writePose(solver, bones) {
  for (let i = 0; i < solver.n; i++) {
    _euler.set(solver.thetaX[i], solver.azimuth[i], solver.thetaZ[i], 'YZX')
    bones[i].quaternion.setFromEuler(_euler)
  }
}
