// Paper and graphite constants for the sketch renderer.
//
// PAPER must match the page background: the flora shader is fully opaque and
// composites pigment over PAPER internally, so uncovered fragments have to be
// indistinguishable from whatever is behind the canvas. The page is white today
// (styles/globals.css sets no background); if that ever changes, change this too.
export const PAPER = [1.0, 1.0, 1.0]

// Graphite is a cool near-black with a blue-grey cast. Never #000 -- pure black
// is the single most reliable way to make a drawing look computer-generated.
export const GRAPHITE = [0.2, 0.18, 0.2]

// Colored-pencil wash inside the graphite contour. Amount is the multiply
// strength at the corolla; spread is how far along a petal (0 at the base, 1 at
// the tip) the blush is allowed to travel before it dies. Foliage is a quieter
// green dust along the stem -- a hint, not a fill.
export const BLUSH_AMOUNT = 0.82
export const BLUSH_SPREAD = 0.84
export const FOLIAGE_AMOUNT = 0.72
