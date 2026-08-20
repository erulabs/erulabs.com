// Deterministic RNG. Everything downstream of a seed goes through here -- a
// single Math.random() anywhere in generation breaks ?seed= reproducibility.

export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed) {
  const next = mulberry32(seed)

  return {
    next,
    // Uniform in [a, b).
    range: (a, b) => a + (b - a) * next(),
    // Uniform integer in [a, b] inclusive.
    int: (a, b) => a + Math.floor((b - a + 1) * next()),
    pick: list => list[Math.floor(next() * list.length)],
    chance: p => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    // Box-Muller. Most botanical traits cluster around a mean rather than
    // spreading uniformly, so this is usually the one you want.
    gauss: (mean, sd) => {
      const u1 = 1 - next()
      const u2 = next()
      return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    },
  }
}
