// Her attention comes and goes: she follows the cursor for a few seconds, then looks back at you, then may follow again.
// Pure state machine (testable without WebGL). att = {on, until}. Returns the same object, updated.
const between = (r, a, b) => a + r() * (b - a)
export function attention(att, t, moved, L, r = Math.random) {
  if (t < att.until) return att
  if (att.on) { att.on = 0; att.until = t + between(r, ...L.rest) }                                   // done watching: rest, looking ahead
  else if (moved && r() < L.chance) { att.on = 1; att.until = t + between(r, ...L.attend) }          // the cursor is moving and she feels like watching
  else att.until = t + .45                                                                              // not now; ask again in a moment
  return att
}
