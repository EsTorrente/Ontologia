// CUES: small moments tied to words of the poem. The poem itself (text.js) is never touched.
//   at: 'text'    finds that text inside a passage (the passage that contains it);  after: 'text' = right after it
//   in: 'text'    only apply in the passage that contains this text      occ: n = nth occurrence (default 0)      all: true = every occurrence
//   pause: ms     wait before the next letter (before `at`, right after `after`)
//   fx: 'name'    effect fired when the first letter of `at` is typed (end: true = last letter, each: true = every letter)
//   look of the letters in `at`:  size: em factor | shrink: n (gradually to n) | glow: n | color: 'gold'.. | speed: typing time x | still: true (no float, no mouse)
//                                 wave: 'y' | 'x' | vanish: opacity the letters fade to (vt: seconds)
// fx names (see Director.onCue): spill, tear, threads, sunrise, edge, zoom (v), wind, bloom, dissolve
const BEAT = 230   // ms: one extra period's worth of silence, on top of the normal period pause
export const CUES = [
  // pauses
  { at: 'aún así los acaricio', pause: 1800 },
  { after: 'Quiero ser humana.', pause: BEAT },
  { after: 'Anhelo ser humana.', pause: BEAT },
  { at: 'Me gusta pensar que soy separada', pause: BEAT },
  // crescendo: each "humana" is a little larger and warmer than the last
  { at: 'humana', in: 'Anhelo ser humana', occ: 1, size: 1.14, glow: .5 },
  { at: 'humana', in: 'Anhelo ser humana', occ: 2, size: 1.3, glow: 1, color: 'gold' },
  // tempo of the words
  { at: 'Vomito', speed: .5 },
  { at: 'Lloro', all: true, speed: 2.2 },
  { at: 'miedo', all: true, speed: 2 },
  { at: 'abuelita', pause: 380, speed: 2.2 },
  { at: 'silencio', all: true, speed: 2.4, shrink: .62, vanish: .45, vt: 4 },
  // words that do what they say
  { at: 'invisible', in: 'hacerme invisible', speed: 2.4, vanish: .08, vt: 6 },
  { at: 'nada en particular', fx: 'dissolve', each: true },
  { at: 'estrella', in: 'mar torrencial', fx: 'bloom', end: true, speed: 2.2 },
  { at: 'mar torrencial', wave: 'y' },
  { at: 'Cuando el viento pasa, me imagino que me abraza', fx: 'wind', wave: 'x' },
  { at: 'la disciplina, la vida ascética, el control de los impulsos', still: true },
  // creatures (3D models): kind = hummer | butterfly | canary | sparrows; side = enter from -1 left / 1 right; at = [x, y] home (screen fractions)
  { at: 'Me gustan los pájaros', fx: 'critter', kind: 'hummer', side: 1 },
  { at: 'también va a sanar', fx: 'critter', kind: 'butterfly', side: 1, y: .3 },
  { at: 'Me gusta la ternura y las caricias', fx: 'critter', kind: 'butterfly', side: -1, y: .35 },
  { at: 'Me gustan los insectos', fx: 'critter', kind: 'butterfly', side: -1 },
  { at: 'por qué saludo a los pájaros', fx: 'critter', kind: 'sparrows', side: -1, y: .3 },
  { at: 'pájaro y rayo de luz', fx: 'critter', kind: 'sparrows', side: 1, y: .25 },
  { at: '¿Para qué vuela el canario', fx: 'critter', kind: 'canary', home: [.8, 0] },
  { at: '¿Y para qué también canta', fx: 'critter', kind: 'sparrows', side: 1, y: .22 },
  // "Todo, Todo, Todo lleva a ti": a polaroid slides in with each Todo (photos in public/assets/pol1..3.jpg; layout in Director.polaroid)
  { at: 'Todo', fx: 'polaroid' },
  // stars leave the words
  { at: 'Vomito mis palabras.', fx: 'spill', each: true },
  { at: 'escapa en lágrimas', fx: 'tear', each: true },
  // invisible connections: hair-thin threads appear between the stars
  { at: 'redes de conexiones invisibles', fx: 'threads' },
  // light
  { at: 'Me gusta el color naranja del sol al amanecer', fx: 'sunrise' },
  { at: 'Me gusta observar el borde saturado entre la luz y la sombra', fx: 'edge' },
  // small
  { at: 'quiero aprender a ser pequeña', shrink: .42 },
  { at: 'quiero aprender', fx: 'zoom', v: -.17 },
]

// Turns the cues that apply to one passage into letter-indexed tables (letters = every character except spaces / line breaks).
export function resolveCues(text) {
  const out = { pause: {}, fx: {}, style: [] }, li = c => text.slice(0, c).replace(/\s/g, '').length
  for (const q of CUES) {
    if (q.in && !text.includes(q.in)) continue
    const key = q.at ?? q.after, found = []; for (let s = text.indexOf(key); s >= 0; s = text.indexOf(key, s + key.length)) found.push(s)
    for (const s of (q.all ? found : found.slice(q.occ || 0, (q.occ || 0) + 1))) {
      const e = s + key.length, a = li(s), z = li(e) - 1
      if (q.pause) { const i = q.after ? li(e) : a; out.pause[i] = (out.pause[i] || 0) + q.pause }
      if (q.fx) { const ids = q.each ? Array.from({ length: z - a + 1 }, (_, n) => a + n) : [q.end ? z : a]; for (const i of ids) (out.fx[i] = out.fx[i] || []).push({ ...q, i, ord: i - a, first: i === a, last: i === z }) }
      if (['size', 'shrink', 'glow', 'color', 'speed', 'still', 'wave', 'vanish'].some(k => q[k] != null)) out.style.push({ ...q, a, z })
    }
  }
  return out
}
