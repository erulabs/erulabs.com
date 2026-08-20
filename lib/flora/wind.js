// Procedural wind field. Two bands matter and both have to be present: slow
// gusting (0.05-0.3 Hz) and the plant's own resonance (0.3-4 Hz). Gusts alone
// read as a wobbling object; resonance alone reads as a vibration.

function hash1(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123
  return s - Math.floor(s)
}

// 1D value noise, cubic interpolated, remapped to [-1, 1].
function noise1(x) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return (hash1(i) * (1 - u) + hash1(i + 1) * u) * 2 - 1
}

// How fast a gust crosses the plant, in px/s.
const GUST_SPEED = 500

// Nominal wind speed in px/s. The plant stands about 380px, so this is a gentle
// drift rather than a gale -- the brief is a light breeze.
// Calibrated by measuring stem-tip travel: a typical genome traces a ~20px arc
// over roughly 4 seconds, which reads as a light breeze rather than a gale.
const WIND_SPEED = 250

export function createWind(genome) {
  const baseAngle = genome.windAngle
  const phase = genome.windPhase

  return {
    strength: genome.windGain,

    // Writes the wind vector at world position (px, py) into out.
    sample(t, px, py, out) {
      const theta = baseAngle + 0.25 * noise1(t * 0.05 + phase)
      const dx = Math.cos(theta)
      const dy = Math.sin(theta)

      // Travelling-wave phase. Without this every organ moves in unison and the
      // whole thing reads as one wobbling object rather than as wind.
      const travel = (px * dx + py * 0.55) / GUST_SPEED

      const gust =
        0.24 * (0.72 + 0.28 * Math.sin(2 * Math.PI * 0.017 * t)) +
        0.52 * noise1(0.075 * (t - travel) + phase) +
        0.22 * noise1(0.27 * (t - travel) + phase * 1.7) +
        0.08 * noise1(1.15 * (t - travel) + phase * 2.3) +
        0.025 * noise1(2.7 * (t - travel) + phase * 3.1)

      const mag = this.strength * WIND_SPEED * gust
      out[0] = dx * mag
      out[1] = dy * mag * 0.25
      // A little out-of-plane so the plant doesn't look like a flat cut-out.
      out[2] = 0.22 * mag
    },
  }
}
