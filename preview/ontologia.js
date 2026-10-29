(()=>{"use strict";
const __config = (()=>{
// Everything tunable lives here: colours, type scale, speeds, particle density, atmosphere.
const CONFIG = {
  // the cat (3D model). rim: faint blue back-light in the dark room (0 = absolutely no light, she becomes invisible); eye: glow colour
  cat: { url: 'assets/cat.glb', litEyes: 0, rim: .5, rimColor: '#4a6aa6', eye: '#ffc94d', yaw: -.5, look: { max: 38, lag: .32, speed: 80, fadeIn: 1.1, fadeOut: 1.6, interest: 4.5, eye: .5, attend: [2, 4.5], rest: [1.4, 3.4], chance: .8 },   // look: max head turn (deg), lag (s: head spring time), speed (deg/s cap), fadeIn/fadeOut (s: how the effect eases in and out), seconds she stays interested after the cursor stops, extra eye turn
     defaults: { pose: 'SitIdle', x: .84, y: .995, h: .3, dark: true, delay: 1800 } },
  font: { family: "'Courier Prime','Cutive Mono','Courier New',monospace", unit: { min: 15, max: 24, perVw: 1 / 78 }, lineHeight: 1.62, charEm: .6 },
  // the only four text colours (rgb)
  palette: { white: [244, 236, 222], gold: [242, 205, 110], orange: [255, 138, 43], blue: [156, 176, 200] },
  glow: .3,                                   // text glow strength (0 = none)
  type: {
    charMs: 40, jitter: .35,                  // typewriter: base ms per letter and random variation
    pauses: { ',': 110, ';': 160, ':': 160, '.': 230, '?': 230, '!': 230, '\n': 260 },
    cursorStepMs: .36,                        // cursor step as a fraction of letter time (<1 = cursor runs ahead)
    lead: [3, 9],                             // how many letters ahead of the text the cursor may run
    hesitate: { chance: .06, ms: [240, 520] },// occasional pause at a word boundary (scenes with hesitate:true)
    speedScale: 1,                            // global multiplier (use <1 to speed everything up)
  },
  motion: { float: 1, floatSpeed: 1, mouseRadius: 5.5, mousePush: .95, spring: .07, damping: .84 }, // radius in font-sizes
  stars: { areaPerStar: 8500, min: 55, max: 260, drift: 1, twinkle: 1, mouseRadius: 130, glow: .6, energyDrift: 2.2, bigDim: .7, behindText: [.5, .12] }, // glow: halo strength multiplier
  // camera: follows the writing, breathes, drifts, tilts and shakes with the scene's energy (override per scene with cam:{...})
  camera: { follow: .16, zoom: [1, 1.035], drift: [14, 9], tilt: .35, shake: 5, tau: 1.15, max: .12 },
  vibe: { amp: .05 },                         // letter vibration at full energy (fraction of font size)
  bg: { tau: 2.6, cutTau: .35 },              // seconds for colour transitions
  // the text lives in 3D: every composition is a "room" on a winding path through space; the camera flies between rooms
  space: { perspective: 1300, step: 1050, sway: [.55, .3], yaw: 11, pitch: 4.5, face: .55, track: .6, travelDolly: .4, travelYaw: 4, travelRoll: 1.6, flyTau: 1.15, parallax: { x: 52, y: 30, yaw: 1, pitch: .7, tau: .9 }, gap: 28 },
  audio: { volume: .7, keyGain: .6, room: .1 },   // typewriter sound (set volume 0 to silence)
  caretLight: .04,                             // how strongly the typed words light the room (per scene: lamp: 0..1)
  hintDelayMs: 1800,                          // when the quiet "click to continue" star appears
}
// atmosphere palettes: top / bottom colour, soft light colour + strength + position
const BGS = {
  void:     { top: [3, 3, 6],    bot: [1, 1, 3],    glow: [28, 22, 18],   a: .10, x: .5,  y: .9 },
  midnight: { top: [6, 10, 24],  bot: [2, 3, 10],   glow: [34, 52, 100],  a: .30, x: .72, y: .18 },
  navy:     { top: [9, 18, 44],  bot: [3, 6, 18],   glow: [44, 76, 140],  a: .34, x: .3,  y: .3 },
  slate:    { top: [20, 26, 36], bot: [8, 11, 18],  glow: [78, 94, 116],  a: .26, x: .5,  y: .15 },
  dusk:     { top: [24, 22, 44], bot: [10, 8, 18],  glow: [150, 88, 96],  a: .28, x: .5,  y: 1.0 },
  burnt:    { top: [36, 13, 4],  bot: [11, 4, 2],   glow: [150, 58, 14],  a: .40, x: .5,  y: 1.0 },
  ember:    { top: [48, 18, 8],  bot: [10, 4, 5],   glow: [196, 74, 26],  a: .32, x: .35, y: .9 },
  amber:    { top: [66, 26, 5],  bot: [22, 8, 2],   glow: [200, 98, 20],  a: .40, x: .5,  y: .85 },
  gold:     { top: [104, 58, 10],bot: [40, 18, 4],  glow: [232, 160, 56], a: .40, x: .5,  y: .55 },
  pitch:    { top: [1, 1, 2],    bot: [0, 0, 1],    glow: [8, 8, 14],    a: .03, x: .5,  y: .6 },
  nightblue:{ top: [7, 13, 30],  bot: [2, 4, 11],   glow: [34, 58, 104],  a: .24, x: .5,  y: .35 },
  paper:    { top: [12, 10, 9],  bot: [5, 4, 4],    glow: [64, 48, 32],   a: .20, x: .5,  y: .4 },
}

return {CONFIG,BGS}})()
const __data_text = (()=>{
// SOURCE TEXT — edit freely. Markers (never rendered):
//   (no marker, first passage)  starts automatically
//   **  blank start: clears the screen, begins a new composition
//   *   new passage appended to what is already on screen (click to advance)
const RAW = String.raw`Me cuesta mucho plasmar lo abstracto en palabras. Mi lengua es más lenta que mis pensamientos, y se vuelve tímida cuando debe explicarse. **Cuando escribo, es imposible no perderme entre las ramas de preguntas y respuestas que surgen tras cada letra, punto, coma. *Vomito mis palabras.

**Me gusta pensar en las personas que amo, y me gusta ver lo que amo de ellas en partes de mí; *me gusta darles las gracias en silencio y saber que no volveré a verlas. **Me gusta pensar en lo que me duele y saber que también va a sanar.

**Me gustan los misterios, las preguntas, las redes de conexiones invisibles entre conceptos aparentemente desconectados. Me gusta pensar que soy separada, y reconocer que no lo soy.
**Me gustan los pájaros. Me gustan los insectos, pero no tocarlos. Me gustan los gatos, pero soy alérgica a ellos; aún así los acaricio.

**Quiero ser humana. Anhelo ser humana. Amo ser humana. *Me gusta abrazar y reír y llorar y tener miedo, enfrentarlo y darme cuenta de que estaré bien después de todo. *Me gusta conmoverme, maravillarme. *Me gusta mirar montañas y sentirme lejana. *Me gusta mirar nubes y sentirme pequeña. *Me gusta ver mis manos y notar las arrugas donde mis dedos se doblan. *Me gusta observar el borde saturado entre la luz y la sombra. *Me gusta el color naranja del sol al amanecer. *Me gusta hacer regalos, compartir canciones, dar consejos, aprender. **Me gusta ver el rostro de mi abuelita cuando me miro en el espejo.

**Lloro con frecuencia pensando en las personas que voy a amar en el futuro; no porque me duela no conocerlas aún, sino porque la simple idea de amar me desborda el corazón. *Lloro también pensando en las personas que amo ahora y lo agradecida que estoy por presenciarlas. El amor me abruma y escapa en lágrimas. **Soy sensible. *Me invento historias cuando escucho música a solas. *Cuando el viento pasa, me imagino que me abraza. *No puedo dormir sin abrazar a mi peluche y besar su frente.

**Me gusta ser privada. *Me gusta que nadie sepa mucho de mí. *Me gusta no hablar de mis logros. *Me gusta nunca mencionar lo que pasa en mi cabeza. *Me gusta no responder hasta que me pregunten. *Me gusta observar. 

**No prendo la luz de mi pieza porque quiero minimizar el costo de mi presencia. Abro mi puerta despacio para no hacer ruido. 
*A veces siento que hacerme invisible es quitar un peso de encima, aún cuando sé que soy amada. *Me sorprende que las personas piensen en mí cuando no estoy ahí.

**Quisiera ser mamá, pero me da miedo fallarles. 
*Quisiera ser pareja, pero siento que no estoy hecha para el tipo de amor que buscan de mí. 
**Me gusta crecer y preguntar y elegir y cuidar y consentir y comprender. Me gusta la disciplina, la vida ascética, el control de los impulsos.
**Me gusta la ternura y las caricias. Me gusta cuando mis amigas sostienen mi mano.

**Cuando sea grande, quiero aprender a ser pequeña. 

**Y por qué?
*y por qué?
*y por qué?
*y por qué? 

*y por qué lo busco? 
*y por qué lo hago? 
*y por qué lo pienso? 
*y por qué lo siento? 
*y por qué lo oculto? 

*por qué saludo a los pájaros en mi ventana cuando salgo de mi casa? 
*y por qué pinté mi pieza de amarillo? 
*y por qué recojo flores caídas, sabiendo que con el tiempo se secarán?
*y por qué me detengo a mirar hormigas? 
*y por qué dibujo lo que amo?
*y por qué temo cuando soy? 

*y por qué evito ser vista? 
*y por qué anhelo ser entendida?
*por qué oro en secreto?
*y por qué me hago preguntas?
*por qué no paro de buscar? 

*y por qué me levanto en las mañanas? 
*y por qué elegí esta carrera?
*por qué quiero contar historias? 
*y por qué no paro de llorar?

**por qué me hiciste humana, y qué debo encontrar? 

**Quiero ser humano y amarillo y naranja y gato y ciervo y nube y sol y estrella y mar torrencial. *Quiero ser palabra y sentimiento y fuego y árbol y pájaro y rayo de luz entre las hojitas de un guayacán. *Quiero ser canción y silencio y grito y armonía y pelusa y piedrita y amor y amada y adulta y niña y nada en particular.

**Todo 
*Todo
*Todo lleva a ti

**Hay algo en mi que exige, inevitablemente, ser.
*Entre más lo encuentro, menos lo conozco.

**...

**¿Para qué vuela el canario, si ya existe el avión?
*¿Y para qué también canta, si igual lo hace el gorrión?

**Me gusta cuando las personas organizan sus pensamientos de manera cuidadosa y elocuente, haciendo uso correcto de la puntuación y estructura gramatical, siendo claros y explícitos con el punto al que quieren llegar.

*Ya terminé de pensar.`
// Parse into steps: [{ kind:'start'|'new'|'add', text, scene, k }]  (scene = composition index, k = position inside it)
function parse(raw = RAW) {
  const parts = raw.split(/(\*\*|\*)/), steps = []; let scene = -1, k = 0
  const push = (kind, chunk) => { const text = chunk.replace(/\s*\n\s*/g, '\n').trim(); if (!text) return; if (kind !== 'add') { scene++; k = 0 } steps.push({ kind, text, scene, k: k++ }) }
  push('start', parts[0])
  for (let i = 1; i < parts.length; i += 2) push(parts[i] === '**' ? 'new' : 'add', parts[i + 1] || '')
  return steps
}

return {RAW,parse}})()
const __data_cues = (()=>{
// CUES: small moments tied to words of the poem. The poem itself (text.js) is never touched.
//   at: 'text'    finds that text inside a passage (the passage that contains it);  after: 'text' = right after it
//   in: 'text'    only apply in the passage that contains this text      occ: n = nth occurrence (default 0)      all: true = every occurrence
//   pause: ms     wait before the next letter (before `at`, right after `after`)
//   fx: 'name'    effect fired when the first letter of `at` is typed (end: true = last letter, each: true = every letter)
//   look of the letters in `at`:  size: em factor | shrink: n (gradually to n) | glow: n | color: 'gold'.. | speed: typing time x | still: true (no float, no mouse)
//                                 wave: 'y' | 'x' | vanish: opacity the letters fade to (vt: seconds)
// fx names (see Director.onCue): spill, tear, threads, sunrise, edge, zoom (v), wind, bloom, dissolve
const BEAT = 230   // ms: one extra period's worth of silence, on top of the normal period pause
const CUES = [
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
function resolveCues(text) {
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

return {CUES,resolveCues}})()
const __data_scenes = (()=>{
// One entry per composition (a composition starts at the first passage or at every ** marker). Order = order in text.js.
// Coordinates are fractions of the screen: x,y = top-left of the block, w = line width, size = multiple of the base font size.
//   items: [...]   hand-placed block per passage (k = position inside the composition)
//   flow:  {x,y,w,size,gap,align}   blocks stack one under the other
//   scatter:{size:[from,to], w:[min,max]}  restless, collision-avoiding placement (size/ramps follow progress through the composition)
// extras: speed/speedRamp = typing tempo (<1 faster, >1 slower); energy/energyRamp (0..1) = how restless the world is (letter vibration, camera shake, star speed);
// cam:{zoom:[from,to],follow,drift:[x,y],tilt,tiltRamp,shake} = camera; item.punch = camera hit when the passage starts; bgSteps/starSteps = per-passage background / star density.
// bg: atmosphere name (or bgRamp:[a,b,...] to travel through them while the composition grows). stars: 0..1 density (or starRamp:[from,to]).
// colors: names from CONFIG.palette (cycled) unless an item gives its own. speed < 1 = faster typing. hesitate: words occasionally stall.
// The title card (before the poem): types itself, holds, then the first passage begins.
const TITLE = { text: 'Ontología', x: .2, y: .46, w: .6, size: 5.8, color: 'gold', speed: 3.2, hold: 2600, bg: 'void', stars: .24 }
// OPENING: before the title, the cat sits at the bottom centre looking at the viewer. Clicking her (or Enter / Space) makes her stretch,
// then the title types itself and the poem continues as usual. If she can't load within `wait` ms the title simply starts.
//   cat: placement (x,y = feet position, h = height as a fraction of the screen), amb/key = light strength, delay = ms before she fades in
// Any scene can carry cat:{...} (see engine/cat.js): pose, yaw, dark, look:false (no cursor following), lookMax (deg), maxW (max width as a screen fraction),
//   stretchAt (ms: one Stretch), pet (press + stroke on her), petStretch (she stretches after a long stroke), pitch (rad, seen from above), hold + hide:'left' + peeks:[ms,...] (PeekHide from the screen edge).
const OPENING = { wait: 7000, hintAfter: 2600, reactMs: 1500, cat: { pose: 'SitIdle', x: .455, y: .955, h: .38, yaw: -.14, pet: true, dark: false, gate: true, amb: .6, key: 1, delay: 700 } }
const SCENES = [
/* 0  intro */          { lamp: .1, bg: 'void', stars: .16, colors: ['white'], speed: 1.35, hesitate: true, delay: 1000, energy: .05, cam: { zoom: [1, 1.08], follow: .06, drift: [5, 3] }, items: [{ x: .09, y: .64, w: .33, size: .95 }] },
/* 1  writing / spill */{ bg: 'midnight', stars: .34, speed: .8, delay: 1500, tau: 3.2, energyRamp: [.25, .75], cam: { zoom: [1.02, 1], follow: .2, shake: 8 }, items: [
    { x: .08, y: .13, w: .42, size: 1.0, color: 'white', z: -380 },
    { x: .30, y: .40, w: .66, size: 3.4, color: 'orange', speed: .55, hold: 1, punch: .1, z: 90 }] },
/* 2  loved ones */     { depth: { z: [-260, 60], ry: [-7, 7] }, bg: 'midnight', stars: .42, speed: 1.1, delay: 1500, energy: .12, cam: { zoom: [1, 1.04], follow: .16 }, items: [
    { x: .14, y: .20, w: .46, size: 1.15, color: 'white' }, { x: .46, y: .54, w: .40, size: 1.0, color: 'blue', speed: 1.35 }] },
/* 3  pain / healing */ { bg: 'dusk', stars: .3, colors: ['blue'], speed: 1.3, delay: 1700, tau: 3, energy: .08, cam: { zoom: [1.03, 1.07], follow: .1 }, items: [{ x: .52, y: .58, w: .36, size: 1.0 }] },
/* 4  mysteries */      { bg: 'navy', stars: .5, colors: ['blue'], speed: .85, energy: .22, cam: { zoom: [1, 1.05], tilt: .3 }, items: [{ x: .46, y: .24, w: .42, size: 1.2 }] },
/* 5  birds & insects */{ cat: { pose: 'SitIdle', x: .80, y: .97, h: .46, yaw: -.35, pet: true, petStretch: true, dark: false, amb: .6, key: 1.1, delay: 1600, stretchAt: 10500, maxW: .3 }, bg: 'burnt', stars: .38, colors: ['gold'], speed: .8, energy: .3, cam: { zoom: [1, 1.04], drift: [20, 8] }, items: [{ x: .08, y: .56, w: .52, size: 1.25 }] },
/* 6  being human */    { depth: { z: [-420, 120], ry: [-9, 9] }, bgRamp: ['amber', 'gold', 'gold'], starRamp: [.5, 1], colors: ['white', 'gold'], speedRamp: [.7, .42], tau: 2.2, energyRamp: [.3, .85], cam: { zoom: [1, .93], follow: .1, tilt: .5, shake: 4 },
    items: [{ x: .06, y: .08, w: .66, size: 2.7, color: 'white' }], scatter: { size: [1.25, 1.05], w: [.34, .44], pad: 26 } },
/* 7  abuelita */       { bg: 'ember', stars: .3, colors: ['gold'], speed: 1.15, delay: 1400, energy: .12, cam: { zoom: [1.04, 1.1], follow: .1 }, items: [{ x: .28, y: .38, w: .44, size: 1.2, mirror: true }] },
/* 8  crying */         { depth: { z: [-240, 80], ry: [-6, 6] }, bgRamp: ['midnight', 'navy'], stars: .42, speed: .95, energy: .3, cam: { zoom: [1, 1.05], drift: [16, 12] }, items: [
    { x: .08, y: .16, w: .50, size: 1.1, color: 'blue' }, { x: .42, y: .58, w: .50, size: 1.1, color: 'white' }] },
/* 9  sensitive */      { depth: { z: [-340, 60], ry: [-8, 8] }, bg: 'navy', stars: .46, speed: .8, delay: 1100, energy: .2, cam: { zoom: [1, 1.03] }, items: [
    { x: .10, y: .18, w: .5, size: 2.4, color: 'white' }, { x: .46, y: .44, w: .40, size: 1.0, color: 'blue' },
    { x: .12, y: .62, w: .40, size: 1.0, color: 'blue' }, { x: .50, y: .78, w: .40, size: 1.0, color: 'blue' }] },
/* 10 private (list) */ { cat: { pose: 'PeekHide', hold: true, hide: 'left', x: 0, y: .985, h: .4, yaw: 0, dark: false, look: false, amb: .6, key: 1.1, delay: 300, maxW: .2, peeks: [4500, 21000, 46000] }, mouse: 'shy', depth: { z: [-520, 80], ry: [-9, 9] }, bg: 'void', stars: .14, colors: ['blue'], speed: 1.2, hesitate: true, energy: .04, cam: { zoom: [1, 1.02], drift: [6, 4] }, items: [
    { x: .12, y: .18, w: .30, size: .88 }, { x: .56, y: .29, w: .30, size: .88 }, { x: .20, y: .45, w: .30, size: .88 },
    { x: .60, y: .57, w: .32, size: .88 }, { x: .27, y: .73, w: .34, size: .88 }, { x: .64, y: .83, w: .22, size: .88 }] },
/* 11 dark room */      { cat: { pose: 'SitIdle', x: .84, y: .995, h: .36, pet: true, dark: true, delay: 2200 }, lantern: { radius: 9, caret: 8, base: [.16, .16, .62] }, lamp: .16, depth: { z: [0, 0], step: -150, ry: [-4, 4] }, bg: 'pitch', stars: .03, colors: ['blue'], speed: 1.25, hesitate: true, delay: 1700, tau: 2.4, energyRamp: [.02, .1], cam: { zoom: [1, 1.1], follow: .12, drift: [6, 4] },
    bgSteps: [{ bg: 'pitch' }, { bg: 'pitch' }, { bg: 'nightblue', tau: 3.4 }],   // almost pitch black, until "Me sorprende que las personas…" lifts it to a faint blue
    starSteps: [.03, .03, .16], flow: { x: .30, y: .30, w: .42, size: .95, gap: .7 } },
/* 12 mother / partner*/{ depth: { z: [-260, 40], ry: [-6, 6] }, bg: 'navy', stars: .24, speed: 1.1, energy: .12, cam: { zoom: [1.02, 1.05] }, items: [
    { x: .10, y: .30, w: .50, size: 1.2, color: 'blue' }, { x: .42, y: .58, w: .50, size: 1.0, color: 'white' }] },
/* 13 growing */        { bg: 'slate', stars: .3, colors: ['white'], speed: .75, energy: .2, cam: { zoom: [1, 1.06] }, items: [{ x: .10, y: .24, w: .56, size: 1.3 }] },
/* 14 tenderness */     { cat: { pose: 'Flopped', x: .27, y: .98, h: .42, yaw: .35, pitch: .55, pet: true, dark: false, amb: .5, key: 1, delay: 1800, lookMax: 22, maxW: .4 }, mouse: 'attract', pull: .6, bg: 'ember', stars: .4, colors: ['white'], speed: .95, energy: .15, cam: { zoom: [1.05, 1] }, items: [{ x: .50, y: .46, w: .40, size: 1.3 }] },
/* 15 "pequeña" */      { lamp: .1, bg: 'void', stars: .18, colors: ['white'], speed: 1.4, delay: 1600, energy: .03, cam: { zoom: [1, 1.08], follow: .05 }, items: [{ x: .25, y: .88, w: .50, size: 1.5, align: 'center' }] },
/* 16 questions */      { echo: true, tremble: true, margin: .08, depth: { z: [-700, 220], ry: [-10, 10] }, bgRamp: ['navy', 'dusk', 'burnt', 'amber'], starRamp: [.4, 1], colors: ['white', 'gold', 'orange', 'blue'], speedRamp: [.8, .22], delay: 1400, energyRamp: [.3, 1],
    cam: { zoom: [1, .88], follow: .08, track: .3, tilt: 1.2, tiltRamp: 2.2, shake: 12 },
    items: [{ x: .14, y: .12, w: .46, size: 2.2 }, { x: .50, y: .30, w: .42, size: 1.75 }, { x: .12, y: .50, w: .40, size: 1.45 }, { x: .56, y: .60, w: .34, size: 1.25 }],
    scatter: { size: [1.05, .74], w: [.18, .3], pad: 14 } },
/* 17 "me hiciste" */   { tremble: true, bg: 'midnight', stars: .6, colors: ['white'], speed: 1, delay: 1800, energy: .4, cam: { zoom: [.92, 1.03], shake: 3 }, items: [{ x: .12, y: .38, w: .76, size: 2.5 }] },
/* 18 "Quiero ser…" */  { tremble: true, depth: { z: [0, 0], step: -200 }, bgRamp: ['amber', 'gold'], stars: 1, colors: ['white', 'white', 'gold'], speedRamp: [.6, .4], tau: 2, energyRamp: [.5, .9], cam: { zoom: [.97, .9], follow: .08, tilt: .4 }, flow: { x: .10, y: .12, w: .78, size: 1.75, gap: 1.0 } },
/* 19 Todo */           { mouse: 'converge', pull: 1, room: { yaw: 0, pitch: 0 }, depth: { z: [0, 0] }, bg: 'void', stars: .34, cut: true, speed: 2.1, delay: 700, energy: .3, cam: { zoom: [1, 1], follow: 0, drift: [4, 3], calm: true }, punch: .09, items: [
    { x: .10, y: .10, w: .6, size: 4.6, color: 'white', z: -520 }, { x: .34, y: .36, w: .6, size: 4.6, color: 'gold', z: -260 }, { x: .12, y: .64, w: .84, size: 3.7, color: 'orange', z: 0 }] },
/* 20 "Hay algo" */     { depth: { z: [-200, 0] }, bgRamp: ['midnight', 'navy'], stars: .55, speed: 1.0, delay: 1600, energy: .12, cam: { zoom: [1.04, 1] }, items: [
    { x: .16, y: .33, w: .66, size: 1.55, color: 'white' }, { x: .40, y: .54, w: .50, size: 1.05, color: 'blue', mouse: 'blur' }] },
/* 21 "..." */         { lamp: .1, room: { yaw: 0, pitch: 0 }, bg: 'void', stars: .12, colors: ['white'], speed: 3.4, delay: 2200, energy: .02, cam: { zoom: [1, 1.14], follow: 0, drift: [0, 0], calm: true }, items: [{ x: .44, y: .42, w: .2, size: 4.6 }] },
/* 22 canario */        { depth: { z: [-300, 40], ry: [-6, 6] }, bg: 'dusk', stars: .5, speed: .9, delay: 1500, energy: .22, cam: { zoom: [1, 1.03] }, items: [
    { x: .10, y: .26, w: .62, size: 1.4, color: 'gold' }, { x: .36, y: .52, w: .58, size: 1.4, color: 'blue' }] },
/* 23 ordered ending */ { room: { yaw: 0, pitch: 0, x: 0, y: 0 }, bg: 'paper', stars: .2, speed: .8, delay: 1800, ordered: true, energy: 0, cam: { zoom: [1, 1], follow: 0, drift: [0, 0], tilt: 0, shake: 0, calm: true }, items: [
    { x: .27, y: .22, w: .46, size: 1.05, color: 'white', lh: 1.95 }, { x: .27, w: .46, size: 1.05, color: 'gold', stack: true, gap: 2 }] },
]

return {TITLE,OPENING,SCENES}})()
const __engine_atmosphere = (()=>{
const {BGS} = __config
// Slowly morphing backdrop: vertical gradient + two very soft lights, drawn on a tiny canvas that the browser scales up smoothly.
const KEYS = ['t0', 't1', 't2', 'b0', 'b1', 'b2', 'g0', 'g1', 'g2', 'a', 'x', 'y']
const flat = b => [...b.top, ...b.bot, ...b.glow, b.a, b.x, b.y]
const lerpBg = (a, b, t) => { const A = flat(BGS[a] || a), B = flat(BGS[b] || b); return A.map((v, i) => v + (B[i] - v) * t) }
class Atmosphere {
  constructor(canvas) { this.c = canvas; this.x = canvas.getContext('2d'); this.w = canvas.width = 192; this.h = canvas.height = 108; this.cur = flat(BGS.void); this.tgt = this.cur.slice(); this.tau = 2.6; this.lamp = { x: .5, y: .5, a: 0, rgb: [255, 200, 120], tx: .5, ty: .5, ta: 0, trgb: [255, 200, 120] } }
  // the writing lights the room: (x,y) 0..1 on screen, a = strength, rgb = colour of the text being typed
  setLamp(x, y, a, rgb) { const L = this.lamp; L.tx = (x + .14) / 1.28; L.ty = (y + .14) / 1.28; L.ta = a; L.trgb = rgb }
  set(bg, tau = 2.6) { this.tgt = Array.isArray(bg) ? bg.slice() : flat(BGS[bg]); this.tau = tau }
  update(dt, t, instant, pulse = 0, energy = 0) {
    const k = instant ? 1 : 1 - Math.exp(-dt / Math.max(.05, this.tau)); for (let i = 0; i < this.cur.length; i++) this.cur[i] += (this.tgt[i] - this.cur[i]) * k
    const c = this.cur, x = this.x, w = this.w, h = this.h, rgb = (i, s = 1) => `rgb(${c[i] * s | 0},${c[i + 1] * s | 0},${c[i + 2] * s | 0})`
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgb(0)); g.addColorStop(1, rgb(3)); x.globalCompositeOperation = 'source-over'; x.fillStyle = g; x.fillRect(0, 0, w, h)
    const gx = (c[10] + Math.sin(t * .045) * .05) * w, gy = (c[11] + Math.cos(t * .037) * .04) * h, a = c[9] * (1 + pulse * .4 + energy * .25 * Math.sin(t * 1.9))
    x.globalCompositeOperation = 'lighter'
    let r = x.createRadialGradient(gx, gy, 0, gx, gy, w * .62); r.addColorStop(0, `rgba(${c[6] | 0},${c[7] | 0},${c[8] | 0},${a})`); r.addColorStop(1, `rgba(${c[6] | 0},${c[7] | 0},${c[8] | 0},0)`); x.fillStyle = r; x.fillRect(0, 0, w, h)
    const hx = w - gx * .8 + w * .1, hy = h * .15 + (1 - gy / h) * h * .3
    const L = this.lamp, kp = instant ? 1 : 1 - Math.exp(-dt / .35), ka = instant ? 1 : 1 - Math.exp(-dt / (L.ta > L.a ? .5 : 1.8))
    L.x += (L.tx - L.x) * kp; L.y += (L.ty - L.y) * kp; L.a += (L.ta - L.a) * ka; for (let i = 0; i < 3; i++) L.rgb[i] += (L.trgb[i] - L.rgb[i]) * kp
    if (L.a > .004) { const lx = L.x * w, ly = L.y * h, col = `${L.rgb[0] | 0},${L.rgb[1] | 0},${L.rgb[2] | 0}`; r = x.createRadialGradient(lx, ly, 0, lx, ly, w * .2); r.addColorStop(0, `rgba(${col},${L.a * .7})`); r.addColorStop(.45, `rgba(${col},${L.a * .2})`); r.addColorStop(1, `rgba(${col},0)`); x.fillStyle = r; x.fillRect(0, 0, w, h) }
    r = x.createRadialGradient(hx, hy, 0, hx, hy, w * .45); r.addColorStop(0, `rgba(${c[6] * .6 | 0},${c[7] * .6 | 0},${c[8] * .7 | 0},${a * .35})`); r.addColorStop(1, `rgba(${c[6] | 0},${c[7] | 0},${c[8] | 0},0)`); x.fillStyle = r; x.fillRect(0, 0, w, h)
  }
}

return {lerpBg,Atmosphere}})()
const __engine_stars = (()=>{
const {CONFIG} = __config
// Slow-rising four-point stars with real glow. Sprites are drawn once (tapered points, hot core, soft bloom) and blitted additively.
// The sky is connected to the writing: stars brighten near the caret, flare when a sentence ends, speed up and flicker with the
// scene's energy, take on the colour of the text being written, and move with the camera (parallax by depth).
const rgb = c => CONFIG.palette[c]
function starSprite(col, halo, S = 256) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'), m = S / 2, L = S * .2, w = L * .03
  x.translate(m, m)
  if (halo) { const g = x.createRadialGradient(0, 0, 0, 0, 0, m)
    g.addColorStop(0, `rgba(${col},${.62 * halo})`); g.addColorStop(.09, `rgba(${col},${.36 * halo})`); g.addColorStop(.28, `rgba(${col},${.12 * halo})`); g.addColorStop(.6, `rgba(${col},${.03 * halo})`); g.addColorStop(1, `rgba(${col},0)`)
    x.fillStyle = g; x.fillRect(-m, -m, S, S) }
  const star = (l, ww) => { x.beginPath(); x.moveTo(0, -l); x.quadraticCurveTo(ww, -ww, l, 0); x.quadraticCurveTo(ww, ww, 0, l); x.quadraticCurveTo(-ww, ww, -l, 0); x.quadraticCurveTo(-ww, -ww, 0, -l); x.closePath() }
  const g = x.createRadialGradient(0, 0, 0, 0, 0, L); g.addColorStop(0, '#fffaf0'); g.addColorStop(.2, `rgb(${col})`); g.addColorStop(1, `rgba(${col},.55)`)
  x.fillStyle = g; star(L, w); x.fill()
  const c = x.createRadialGradient(0, 0, 0, 0, 0, L * .4); c.addColorStop(0, 'rgba(255,252,240,.7)'); c.addColorStop(1, 'rgba(255,252,240,0)'); x.fillStyle = c; x.fillRect(-L, -L, L * 2, L * 2)
  x.fillStyle = 'rgba(255,252,240,.8)'; star(L * .42, w * .8); x.fill()
  return cv
}
class Stars {
  constructor(canvas, reduced) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.reduced = reduced; this.density = .2; this.hintOn = 0; this.hintA = 0
    this.names = ['white', 'gold', 'orange', 'blue']; this.mix = { white: 1, gold: 1, orange: 1, blue: 1 }; this.tw = { ...this.mix }; this.tint = null
    this.energy = 0; this.act = 0; this.cam = { x: 0, y: 0, z: 1, r: 0 }; this.focus = { x: -999, y: -999 }; this.bursts = []; this.drops = []; this.pull = 0; this.thr = 0; this.thrT = 0; this.wind = 0; this.windT = 0; this.hush = 0; this.hushT = 0; this.avoid = []; this.sp = {}
    for (const n of this.names) this.sp[n] = [starSprite(rgb(n).join(','), 0), starSprite(rgb(n).join(','), .6 * CONFIG.stars.glow), starSprite(rgb(n).join(','), CONFIG.stars.glow)]
    this.mouse = { x: -999, y: -999 }; this.resize()
  }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2); this.d = d; this.W = this.c.width = Math.round(innerWidth * d); this.H = this.c.height = Math.round(innerHeight * d)
    const C = CONFIG.stars, n = Math.max(C.min, Math.min(C.max, Math.round(innerWidth * innerHeight / C.areaPerStar))), r = Math.random, old = this.s
    this.s = Array.from({ length: n }, (_, i) => { const big = r(), z = big < .62 ? .25 + r() * .25 : big < .92 ? .5 + r() * .25 : .8 + r() * .2
      const cr = r(), color = cr < .46 ? 'white' : cr < .74 ? 'gold' : cr < .86 ? 'orange' : 'blue'
      return { x: r(), y: r(), z, size: (4.5 + z * z * 26) * (.8 + r() * .5), vy: (4 + z * 20) * (.7 + r() * .6), ph: r() * 6.28, w: .25 + r() * .5, amp: 6 + r() * 16, tw: .4 + r() * .9, color,
        halo: z > .62 ? (r() < .6 ? 2 : 1) : z > .36 ? (r() < .6 ? 1 : 0) : 0, thr: r(), act: old?.[i]?.act ?? 0, dx: 0, dy: 0, vx: 0, vyy: 0, rot: (r() - .5) * .3, tone: .55 + r() * .45, fl: 0, px: 0, py: 0, dim: 1 } })
  }
  setDensity(d) { this.density = d }
  setMix(m) { this.mix = { white: 1, gold: 1, orange: 1, blue: 1, ...m } }
  hint(on, x, y) { this.hintOn = on ? 1 : 0; this.hx = x ?? .5; this.hy = y ?? null }   // x,y: fractions of the screen (default: bottom centre)
  // a sentence just ended at screen point (x,y): nearby stars flare and a new star is born there
  flare(x, y) {
    const d = this.d, near = []; for (const s of this.s) { if (s.act < .3) continue; near.push([Math.hypot(s.px / d - x, s.py / d - y), s]) }
    near.sort((a, b) => a[0] - b[0]); for (const [dist, s] of near.slice(0, 2)) if (dist < 420) s.fl = .45
    if (this.bursts.length < 4) this.bursts.push({ x: (x + 16 + Math.random() * 14) * d, y: (y - 30 - Math.random() * 18) * d, t: 0, life: 2.4 + Math.random(), col: this.tint || 'gold', size: 13 + Math.random() * 9, rot: (Math.random() - .5) * .5 })
  }
  // a click: one small, quiet star blooms exactly where you pressed
  bloom(x, y) { const d = this.d; if (this.bursts.length < 5) this.bursts.push({ x: x * d, y: y * d, t: 0, life: 1.6, col: this.tint || 'gold', size: 12 + Math.random() * 6, rot: (Math.random() - .5) * .5 }) }
  // a single star let go from a letter (x,y in css px): used for tears and for "spilled" words. o: {vx,vy,g,life,size,col,a,spin}
  drop(x, y, o) { if (this.drops.length > 70) return; const d = this.d; this.drops.push({ x: x * d, y: y * d, vx: o.vx * d, vy: o.vy * d, g: o.g * d, t: 0, life: o.life, col: o.col || 'gold', size: o.size * d, a: o.a ?? .8, rot: Math.random() * 1.2 - .6, spin: o.spin ?? (Math.random() - .5) * 1.2 }) }
  update(dt, t) {
    const x = this.x, W = this.W, H = this.H, d = this.d, mouse = this.mouse, mr = CONFIG.stars.mouseRadius * d, still = this.reduced, ks = 1 - Math.exp(-dt / 1.4), C = CONFIG.stars
    const en = this.energy, act = this.act, cam = this.cam, drift = C.drift * (1 + en * C.energyDrift), twk = 1 + en * 1.4, f = this.focus, kt = 1 - Math.exp(-dt / 1.2)
    for (const n of this.names) this.tw[n] += (this.mix[n] * (n === this.tint ? 1.7 : 1) - this.tw[n]) * kt
    x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'
    this.thr += (this.thrT - this.thr) * (1 - Math.exp(-dt / 2.4)); const pts = this.thr > .02 ? [] : null
    this.hush += (this.hushT - this.hush) * (1 - Math.exp(-dt / 5))   // the ending: the sky slows almost to a stop
    this.wind += (this.windT - this.wind) * (1 - Math.exp(-dt / 1.2)); this.windT *= Math.exp(-dt / 5)   // a gust: stars drift sideways, then it dies down
    for (const s of this.s) {
      if (this.wind > .01) { s.x += this.wind * (.01 + .035 * s.z) * dt; if (s.x > 1.04) s.x = -.04 }
      s.act += ((s.thr < this.density ? 1 : 0) - s.act) * ks; s.fl *= Math.exp(-dt * 1.1); if (s.act < .01) continue
      if (!still) { s.y -= s.vy * dt * drift * (1 - .97 * this.hush) / innerHeight; if (s.y < -.05) { s.y = 1.05; s.x = Math.random() } }
      let px = s.x * W + (still ? 0 : Math.sin(t * s.w + s.ph) * s.amp * d), py = s.y * H
      const kz = 1 + (cam.z - 1) * (.2 + .8 * s.z), par = .15 + .65 * s.z   // depth: near stars follow the camera more
      px = W / 2 + (px - W / 2) * kz + cam.x * d * par; py = H / 2 + (py - H / 2) * kz + cam.y * d * par
      const mx = px + s.dx - mouse.x * d, my = py + s.dy - mouse.y * d, dist = Math.hypot(mx, my)
      const pr = this.pull > .01 ? mr * (2.4 + this.pull * 2.2) : mr, sg = this.pull > .01 ? -.55 * this.pull : 1   // tender / converging scenes: stars lean toward the pointer instead of fleeing it
      if (!still && dist < pr && dist > 1) { const q = 1 - dist / pr; s.vx += mx / dist * q * q * 60 * dt * 6 * sg; s.vyy += my / dist * q * q * 60 * dt * 6 * sg }
      s.vx += -s.dx * 2.2 * dt; s.vyy += -s.dy * 2.2 * dt; s.vx *= .94; s.vyy *= .94; s.dx += s.vx * dt * 20; s.dy += s.vyy * dt * 20
      s.px = px + s.dx; s.py = py + s.dy
      const tw = still ? .8 : .62 + .38 * Math.sin(t * s.tw * C.twinkle * twk + s.ph * 3) * Math.sin(t * s.tw * .37 + s.ph)
      const fd = Math.hypot(s.px / d - f.x, s.py / d - f.y), fb = fd < 320 ? 1 + (1 - fd / 320) * .25 : 1   // stars lean (gently) toward the caret
      // keep the sky out of the way of the writing: a star that sits behind a text block fades down (big ones almost out)
      const pad = s.size * d * .9; let hit = false; for (const r of this.avoid) if (s.px > r.x0 * d - pad && s.px < r.x1 * d + pad && s.py > r.y0 * d - pad && s.py < r.y1 * d + pad) { hit = true; break }
      s.dim += ((hit ? (s.z > .5 ? C.behindText[1] : C.behindText[0]) : 1) - s.dim) * (1 - Math.exp(-dt / .4))
      const a = Math.max(0, Math.min(1, s.act * s.tone * (.35 + .65 * tw) * this.tw[s.color] * (.5 + s.z * .8) * (1 + act * .2 + s.fl * .6) * fb * (s.z > .62 ? C.bigDim : 1) * s.dim))
      if (a < .015) continue
      if (pts && s.z > .4 && a > .1) pts.push(s.px, s.py, a, s.color)
      const S = s.size * d * 2.6 * kz * (1 + s.fl * .7)
      x.globalAlpha = a; x.save(); x.translate(s.px, s.py); x.rotate(s.rot); x.drawImage(this.sp[s.color][Math.min(2, s.halo + (s.fl > .25 ? 1 : 0))], -S / 2, -S / 2, S, S); x.restore()
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) { const b = this.bursts[i]; b.t += dt; const u = b.t / b.life; if (u >= 1) { this.bursts.splice(i, 1); continue }
      b.y -= 22 * dt * d; const S = b.size * d * 2.6 * (1 + u * .4); x.globalAlpha = Math.pow(Math.sin(u * Math.PI), .8) * .3
      x.save(); x.translate(b.x, b.y); x.rotate(b.rot + u * .5); x.drawImage(this.sp[b.col][1], -S / 2, -S / 2, S, S); x.restore() }
    // "redes de conexiones invisibles": hair-thin threads between nearby stars, only while a passage asks for them
    if (pts && pts.length > 7) { const D = 270 * d; x.lineWidth = Math.max(1, d * .8); x.lineCap = 'round'
      for (let i = 0; i < pts.length; i += 4) { let c = 0; for (let j = i + 4; j < pts.length && c < 3; j += 4) { const dx = pts[j] - pts[i], dy = pts[j + 1] - pts[i + 1], dist = Math.hypot(dx, dy); if (dist > D || dist < 12 * d) continue
        x.globalAlpha = Math.min(1, (1 - dist / D) * .5 * this.thr * Math.min(pts[i + 2], pts[j + 2]) * (.7 + .3 * Math.sin(t * .5 + i))); x.strokeStyle = `rgb(${rgb(pts[i + 3])})`; x.beginPath(); x.moveTo(pts[i], pts[i + 1]); x.lineTo(pts[j], pts[j + 1]); x.stroke(); c++ } } }
    for (let i = this.drops.length - 1; i >= 0; i--) { const q = this.drops[i]; q.t += dt; const u = q.t / q.life; if (u >= 1) { this.drops.splice(i, 1); continue }
      q.vy += q.g * dt; q.vx *= Math.exp(-dt * .9); q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.spin * dt
      const S = q.size * 2.6 * (1 - u * .35); x.globalAlpha = Math.min(1, u * 9) * Math.pow(1 - u, .7) * q.a; x.save(); x.translate(q.x, q.y); x.rotate(q.rot); x.drawImage(this.sp[q.col][1], -S / 2, -S / 2, S, S); x.restore() }
    // quiet "continue" beacon at the bottom centre
    this.hintA += (this.hintOn - this.hintA) * (1 - Math.exp(-dt / .7))
    if (this.hintA > .02) { const S = 44 * d, p = .5 + .5 * Math.sin(t * 2.2); x.globalAlpha = this.hintA * (.3 + .6 * p); const hx = (this.hx ?? .5) * W, top = this.hy != null ? this.hy * H - S : H - 52 * d - S; x.drawImage(this.sp.gold[2], hx - S, top, S * 2, S * 2) }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'
  }
}

return {starSprite,Stars}})()
const __engine_space = (()=>{
const {CONFIG} = __config
// A tiny 3D camera that mirrors the CSS transform maths exactly (row-major 4x4, column vectors, CSS rotation conventions).
// The DOM does the drawing (stage > room > block, all preserve-3d under one `perspective`); this class does the picking:
// where is a letter on screen (project) and which point of a block is under the mouse (local) -- so the mouse physics work in 3D.
const rad = d => d * Math.PI / 180
const mul = (a, b) => { const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c]; return o }
const T = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1]
const RX = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1] }
const RY = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1] }
const RZ = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }
class Space {
  constructor() { this.cam = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 } }
  get P() { return CONFIG.space.perspective }
  // CSS for the stage (= the inverse of the camera pose)
  css() { const c = this.cam, f = n => n.toFixed(3); return `rotateZ(${f(-c.roll)}deg) rotateX(${f(-c.pitch)}deg) rotateY(${f(-c.yaw)}deg) translate3d(${f(-c.x)}px,${f(-c.y)}px,${f(-c.z)}px)` }
  camM() { const c = this.cam; return mul(RZ(-c.roll), mul(RX(-c.pitch), mul(RY(-c.yaw), T(-c.x, -c.y, -c.z)))) }
  // block-local pixel (from the block's top-left) -> camera space
  blockM(b) { const W = innerWidth, H = innerHeight, r = b.room, cw = b.w / 2, ch = b.h / 2
    const room = mul(T(r.x, r.y, r.z), mul(RY(r.yaw), RX(r.pitch)))
    const blk = mul(T(b.x + cw - W / 2, b.y + ch - H / 2, b.z || 0), mul(RY(b.ry || 0), mul(RX(b.rx || 0), T(-cw, -ch, 0))))
    return mul(this.camM(), mul(room, blk)) }
  project(b, u, v) { const M = this.blockM(b), P = this.P, X = M[0] * u + M[1] * v + M[3], Y = M[4] * u + M[5] * v + M[7], Z = M[8] * u + M[9] * v + M[11], den = P - Z
    return den < 60 ? null : { x: innerWidth / 2 + X * P / den, y: innerHeight / 2 + Y * P / den } }
  // screen bounding box of a block's text (width tw = longest line), or null if behind the camera
  rect(b) { const M = this.blockM(b), P = this.P, w = b.tw ?? b.w, h = b.h; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    for (const [u, v] of [[0, 0], [w, 0], [0, h], [w, h]]) { const X = M[0] * u + M[1] * v + M[3], Y = M[4] * u + M[5] * v + M[7], Z = M[8] * u + M[9] * v + M[11], den = P - Z; if (den < 60) return null
      const sx = innerWidth / 2 + X * P / den, sy = innerHeight / 2 + Y * P / den; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy) }
    return { x0, y0, x1, y1 } }
  // which point of block b lies under screen point (sx, sy)? (ray / plane intersection)
  local(b, sx, sy) { const M = this.blockM(b), P = this.P, mx = sx - innerWidth / 2, my = sy - innerHeight / 2
    const a1 = P * M[0] + mx * M[8], b1 = P * M[1] + mx * M[9], c1 = mx * P - P * M[3] - mx * M[11]
    const a2 = P * M[4] + my * M[8], b2 = P * M[5] + my * M[9], c2 = my * P - P * M[7] - my * M[11], det = a1 * b2 - a2 * b1
    return Math.abs(det) < 1e-6 ? null : { u: (c1 * b2 - c2 * b1) / det, v: (a1 * c2 - a2 * c1) / det } }
}

return {Space}})()
const __engine_audio = (()=>{
const {CONFIG} = __config
// Typewriter keys, synthesised (no audio files): a short filtered-noise "tick" + a soft low "thock" per letter,
// a deeper hit for the space bar and a small ratchet for line breaks. Browsers only allow sound after a gesture:
// the context is created on the first click / key press (letters typed before that are silent).
class TypeSound {
  constructor() { this.ctx = null; this.last = 0; this.on = true; try { this.on = localStorage.getItem('ont-sound') !== 'off' } catch (e) {} }
  unlock() {
    if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { this.build(new AC()) } catch (e) { this.ctx = null; return } }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
  }
  build(ctx) {
    const A = CONFIG.audio; this.ctx = ctx
    this.out = ctx.createGain(); this.out.gain.value = A.volume
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7200; this.out.connect(lp); lp.connect(ctx.destination)
    // a very small "room" so the keys feel intimate rather than dry
    const d = ctx.createDelay(.3); d.delayTime.value = .071; const fb = ctx.createGain(); fb.gain.value = .24; const wet = ctx.createGain(); wet.gain.value = A.room
    lp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(ctx.destination)
    const n = Math.floor(ctx.sampleRate * .25), buf = ctx.createBuffer(1, n, ctx.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1; this.noise = buf
  }
  setOn(v) { this.on = v; try { localStorage.setItem('ont-sound', v ? 'on' : 'off') } catch (e) {} }
  // ch: the letter; size: block scale (bigger type = deeper keys); energy 0..1 (a little brighter and harder when restless)
  key(ch, size = 1, energy = 0) {
    const c = this.ctx; if (!this.on || !c || c.state !== 'running') return
    const now = c.currentTime; if (now - this.last < .02) return; this.last = now
    const A = CONFIG.audio, r = Math.random, sp = ch === ' ', nl = ch === '\n', pitch = Math.max(.62, Math.min(1.1, 1 / (.82 + .18 * size)))
    const vel = A.keyGain * (.62 + r() * .5) * (1 + energy * .35) * (sp ? .8 : 1)
    const dest = c.createGain(); dest.gain.value = 1; let node = dest
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = (r() - .5) * .3; dest.connect(p); node = p }
    node.connect(this.out)
    // tick
    const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = .85 + r() * .3
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1; bp.frequency.value = (sp ? 850 : 1700 + r() * 1700 + energy * 500) * pitch
    const g = c.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vel * (nl ? .5 : 1), now + .002); g.gain.exponentialRampToValueAtTime(.0001, now + (sp ? .07 : nl ? .2 : .045))
    s.connect(bp); bp.connect(g); g.connect(dest); s.start(now, r() * .1, .25); s.stop(now + .3)
    // thock
    const o = c.createOscillator(); o.type = 'triangle'; const f0 = (sp ? 100 : nl ? 70 : 150 + r() * 55) * pitch
    o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f0 * .55, now + .08)
    const g2 = c.createGain(); g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(vel * (sp ? .85 : .5), now + .003); g2.gain.exponentialRampToValueAtTime(.0001, now + (sp ? .13 : .095))
    o.connect(g2); g2.connect(dest); o.start(now); o.stop(now + .16)
  }
}

return {TypeSound}})()
const __engine_typesetter = (()=>{
const {CONFIG} = __config
const {resolveCues} = __data_cues
// Text as living letters. Layout is computed analytically (monospace) so compositions can be planned before anything is drawn;
// every letter is a real DOM span moved by one shared animation loop (float, mouse disturbance, spring return). No React renders per frame.
const rnd = (a, b) => a + Math.random() * (b - a)
class Typesetter {
  constructor(root, reduced) { this.root = root; this.reduced = reduced; this.blocks = []; this.vibe = 0; this.onStrike = null; this.space = null; this.mouse = { x: -999, y: -999, on: false }; this.lamp = null; this.calm = 0; this.calmT = 0; this.frozen = false; this.ripples = []; this.active = null; this.measure() }
  get unit() { const u = CONFIG.font.unit; return Math.max(u.min, Math.min(u.max, innerWidth * u.perVw)) }
  measure() { // real advance width of the font (falls back to the nominal .6em)
    const s = document.createElement('span'); s.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:100px ${CONFIG.font.family}`; s.textContent = 'M'.repeat(40); document.body.appendChild(s)
    const w = s.getBoundingClientRect().width / 40 / 100; s.remove(); this.charEm = w > .4 && w < .8 ? w : CONFIG.font.charEm
  }
  // planned size of a block (px)
  dims(text, size, wFrac, lh) { const fp = this.unit * size, cw = fp * this.charEm, cols = Math.max(8, Math.floor(wFrac * innerWidth / cw)); let lines = 0
    for (const para of text.split('\n')) { let cur = 0, n = 1; for (const wd of para.split(' ')) { const L = wd.length; if (cur === 0) cur = L; else if (cur + 1 + L <= cols) cur += 1 + L; else { n++; cur = L } } lines += n }
    const widest = Math.min(cols, Math.max(...text.split('\n').map(p => p.length))); return { fp, cols, w: cols * cw + 1, tw: widest * cw, h: lines * fp * (lh || CONFIG.font.lineHeight), lines } }
  add(o) { // o: {text,x,y,w(frac),size,color,align,lh,speed,hesitate,spec}
    const d = this.dims(o.text, o.size, o.w, o.lh), el = document.createElement('div'); el.className = 'blk'; el.style.cssText = `left:${o.x}px;top:${o.y}px;transform:${this.t3(o)};width:${d.w}px;font-size:${d.fp}px;text-align:${o.align || 'left'};--rgb:${CONFIG.palette[o.color].join(',')};--glow:${CONFIG.glow};line-height:${o.lh || CONFIG.font.lineHeight}`
    const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = o.text; el.appendChild(sr)
    const vis = document.createElement('div'); vis.className = 'vis'; vis.setAttribute('aria-hidden', 'true'); el.appendChild(vis)
    const letters = []; const fs = d.fp
    o.text.split('\n').forEach((para, pi) => { if (pi) vis.appendChild(document.createElement('br'))
      para.split(' ').forEach((wd, wi, arr) => { const w = document.createElement('span'); w.className = 'wd'
        for (const ch of wd) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.appendChild(s)
          letters.push({ el: s, ch, ph: Math.random() * 6.28, f1: rnd(.35, .75), f2: rnd(.3, .65), amp: rnd(.5, 1) * fs * .045, jx: rnd(-.5, .5) * fs * .03, jy: rnd(-.5, .5) * fs * .04, rot: rnd(-.7, .7), vw: rnd(18, 36), warm: 0, bl: 0, tr: 0, tg: 0, gs: null, cx: 0, cy: 0, ox: 0, oy: 0, vx: 0, vy: 0, ey: 0, shown: false }) }
        vis.appendChild(w); if (wi < arr.length - 1) vis.appendChild(document.createTextNode(' ')) }) })
    const cues = resolveCues(o.text)   // pauses / effects / shrinking ranges tied to words (src/data/cues.js)
    letters.forEach((l, i) => { l.idx = i })
    for (const r of cues.style) for (let i = r.a; i <= r.z; i++) { const l = letters[i], st = l.el.style; if (!l) continue
      if (r.shrink != null) { const u = r.z > r.a ? (i - r.a) / (r.z - r.a) : 1; st.fontSize = (1 - (1 - r.shrink) * Math.pow(u, .85)).toFixed(3) + 'em' }
      if (r.size) st.fontSize = r.size + 'em'
      if (r.glow != null) { st.setProperty('--glow', r.glow); l.gs = r.glow }
      if (r.color) st.color = `rgb(${CONFIG.palette[r.color]})`
      if (r.speed) l.spd = r.speed
      if (r.still) { l.still = true; l.rot = 0; l.jx = 0; l.jy = 0 }
      if (r.wave) l.wave = r.wave
      if (r.vanish != null) { l.fxc = 'vanish'; st.setProperty('--vo', r.vanish); st.setProperty('--vt', (r.vt || 5) + 's') } }
    if (o.lantern) vis.classList.add('lamp')
    let refl = null   // a mirror: a faint, flipped, warmer copy of the words below them (letters keep their motion mirrored)
    if (o.mirror) { refl = document.createElement('div'); refl.className = 'refl'; refl.setAttribute('aria-hidden', 'true'); const cl = vis.cloneNode(true); cl.querySelector('.cur')?.remove(); refl.appendChild(cl); el.appendChild(refl)
      cl.querySelectorAll('.ch').forEach((e, i) => { letters[i].rel = e }) }
    const cur = document.createElement('i'); cur.className = 'cur'; vis.appendChild(cur); this.root.appendChild(el)
    const b = { el, vis, cur, letters, text: o.text, ri: 0, ci: 0, typing: false, tChar: 0, tCur: 0, lead: 4, idle: 0, speed: o.speed || 1, speed0: 1, hesitate: !!o.hesitate, x: o.x, y: o.y, z: o.z || 0, ry: o.ry || 0, rx: o.rx || 0, room: o.room, w: d.w, h: el.offsetHeight || d.h, size: o.size, fp: d.fp, leaving: false, rect: null, spec: o.spec, onDone: null, cues, hold: false, mode: o.mouse || 'repel', lamp: !!o.lantern, rgb: CONFIG.palette[o.color], cl: 0, refl }
    this.blocks.push(b); this.settle(b); return b }
  t3(o) { return `translateZ(${(o.z || 0).toFixed(1)}px) rotateY(${(o.ry || 0).toFixed(2)}deg) rotateX(${(o.rx || 0).toFixed(2)}deg)` }
  settle(b) { // cache letter centres for the mouse (offset-based, so the camera transform never skews it)
    b.h = b.el.offsetHeight; b.rect = { left: 0, top: 0, right: b.w, bottom: b.h }; if (b.refl) b.refl.style.height = b.h + 'px'
    for (const l of b.letters) { const e = l.el; l.cx = e.offsetLeft + e.offsetWidth / 2; l.cy = e.offsetTop + e.offsetHeight / 2 } this.curPos(b, b.ci) }
  place(b, x, y, wFrac, size, lh, z = b.z, ry = b.ry) { const d = this.dims(b.text, size, wFrac, lh); Object.assign(b.el.style, { left: x + 'px', top: y + 'px', width: d.w + 'px', fontSize: d.fp + 'px', transform: this.t3({ z, ry, rx: b.rx }) }); b.x = x; b.y = y; b.z = z; b.ry = ry; b.w = d.w; b.fp = d.fp; this.settle(b) }
  start(b, onDone) { if (this.active && this.active !== b) this.active.cur.classList.add('off'); this.active = b; b.typing = true; b.onDone = onDone; b.cur.classList.remove('off'); b.lead = this.lead() }
  lead() { const [a, c] = CONFIG.type.lead; return Math.round(rnd(a, c)) }
  strike(b, i, quiet) { const l = b.letters[i]; if (!l || l.shown) return; l.shown = true; l.el.classList.add('on'); l.rel && l.rel.classList.add('on'); if (l.fxc) l.el.classList.add(l.fxc); l.ey = this.reduced ? 0 : b.fp * (.16 + this.vibe * .3); this.onStrike && this.onStrike(b, i, quiet); const f = b.cues && b.cues.fx[i]; if (f && this.onCue) for (const c of f) this.onCue(b, c, i, quiet) }
  finish(b) { if (!b.typing) return; while (b.ri < b.letters.length) this.strike(b, b.ri++, true); b.ci = b.letters.length; this.curPos(b, b.ci); this.done(b) }
  done(b) { b.typing = false; b.idle = 0; const f = b.onDone; b.onDone = null; f && f(b) }
  curPos(b, i) { const L = b.letters; if (!L.length) return; const l = L[Math.min(i, L.length - 1)].el, x = l.offsetLeft + (i >= L.length ? l.offsetWidth : 0), y = l.offsetTop + l.offsetHeight / 2 - b.fp * .6
    b.cpx = x; b.cpy = y + b.fp * .6; b.cur.style.transform = `translate3d(${x - 1}px,${y}px,0)`; b.cur.style.height = b.fp * 1.2 + 'px'; b.idle = 0; b.cur.classList.remove('still') }
  delay(b, ch) { const T = CONFIG.type; let ms = T.charMs * (1 + (Math.random() * 2 - 1) * T.jitter); if (ch === ' ') ms *= .55; ms += (T.pauses[ch] || 0) * .8
    if (ch === ' ' && b.hesitate && Math.random() < T.hesitate.chance) ms += rnd(...T.hesitate.ms); return ms * b.speed * T.speedScale / 1000 }
  leave(b, ms = 1500) { b.leaving = true; b.typing = false; if (this.active === b) this.active = null; b.el.classList.add('leave'); b.el.style.transitionDuration = ms + 'ms'; setTimeout(() => { b.el.remove(); this.blocks = this.blocks.filter(x => x !== b) }, ms + 100) }
  // a faint far-away copy of a passage (the echo of the questions): plain text, no per-letter work
  ghost(o) { const d = this.dims(o.text, o.size, o.w), el = document.createElement('div'), r = Math.random
    el.className = 'blk ghost'; el.setAttribute('aria-hidden', 'true'); el.textContent = o.text
    el.style.cssText = `left:${o.x}px;top:${o.y}px;transform:${this.t3(o)};width:${d.w}px;font-size:${d.fp}px;line-height:${CONFIG.font.lineHeight};opacity:0;--rgb:${o.rgb.join(',')};--dx:${((r() - .5) * 60).toFixed(0)}px;--dy:${((r() - .5) * 40).toFixed(0)}px;--dur:${(11 + r() * 12).toFixed(1)}s`
    this.root.appendChild(el); requestAnimationFrame(() => { el.style.opacity = (.11 + r() * .07).toFixed(2) }); return el }
  setOpacity(b, o) { b.el.style.opacity = o }
  // dark-room lantern: a CSS mask on the block lets the text show only near the pointer and near the caret while it types
  lampBlock(b, dt) { const L = this.lamp, fp = b.fp, v = b.vis.style, lm = this.mouse.on && this.space && b.rect ? this.space.local(b, this.mouse.x, this.mouse.y) : null, typing = b.typing ? 1 : 0
    b.cl += (typing - b.cl) * Math.min(1, dt / (typing ? .3 : 2.4))
    v.setProperty('--mx', (lm ? lm.u : -9999).toFixed(0) + 'px'); v.setProperty('--my', (lm ? lm.v : -9999).toFixed(0) + 'px'); v.setProperty('--mr', Math.max(1, L.r * fp * (1 + L.door * 1.2)).toFixed(0) + 'px')
    v.setProperty('--cx', (b.cpx || 0).toFixed(0) + 'px'); v.setProperty('--cy', (b.cpy || 0).toFixed(0) + 'px'); v.setProperty('--cr', Math.max(1, b.cl * L.caret * fp).toFixed(0) + 'px'); v.setProperty('--base', L.base.toFixed(3)) }
  ripple(x, y) { if (!this.reduced) this.ripples.push({ x, y, t: 0 }) }   // a click sends a soft wave through the letters
  update(dt, t) {
    this.calm += (this.calmT - this.calm) * (1 - Math.exp(-dt / 3)); for (const r of this.ripples) r.t += dt; if (this.ripples.length) this.ripples = this.ripples.filter(r => r.t < 1.5)
    if (this.lamp) { const L = this.lamp; L.base += (L.baseT - L.base) * (1 - Math.exp(-dt / 1.6)); L.door += (L.doorT - L.door) * (1 - Math.exp(-dt / (L.doorT > L.door ? 1.7 : .7))) }
    const M = CONFIG.motion, s = Math.min(3, dt * 60), R = M.mouseRadius, mouse = this.mouse
    for (const b of this.blocks) {
      if (b.typing) { // letters: one every ~charMs; cursor runs ahead at a fraction of that
        const n = b.letters.length; b.tChar -= dt
        while (b.tChar <= 0 && b.ri < n) { const pz = b.cues.pause[b.ri]; if (pz && !b.paused) b.paused = {}; if (pz && !b.paused[b.ri]) { b.paused[b.ri] = 1; b.tChar = pz * b.speed0 * CONFIG.type.speedScale / 1000; break }   // a written pause: the cursor waits, blinking
          const ch = b.letters[b.ri].ch; this.strike(b, b.ri); b.ri++; if (b.ri % 4 === 0) b.lead = this.lead(); b.tChar += this.delay(b, ch) * (b.letters[b.ri - 1].spd || 1) }
        if (b.ci < b.ri) b.ci = b.ri
        const target = Math.min(n, b.ri + b.lead); b.tCur -= dt
        if (b.ci < target && b.tCur <= 0) { b.ci++; this.curPos(b, b.ci); b.tCur = Math.max(.012, CONFIG.type.charMs / 1000 * b.speed * CONFIG.type.cursorStepMs * rnd(.7, 1.3) * CONFIG.type.speedScale) }
        const hold = b.tChar > .35 && b.ci >= target && b.ri < n; if (hold !== b.hold) { b.hold = hold; b.cur.classList.toggle('still', hold) }
        if (b.ri >= n) { b.ci = n; this.curPos(b, n); this.done(b) }
      } else if (!b.leaving) { b.idle += dt; if (b.idle > .25 && !b.cur.classList.contains('still')) b.cur.classList.add('still') }
      if (b.leaving) continue
      if (b.lamp && this.lamp) this.lampBlock(b, dt)
      const rl = this.ripples.length && b.rect && this.space ? this.ripples.map(r => { const p = this.space.local(b, r.x, r.y); return p && { u: p.u, v: p.v, front: r.t * 15 * b.fp, a: 1 - r.t / 1.5 } }).filter(Boolean) : null
      const V = this.reduced ? 0 : this.vibe * (b.typing ? 1 : .65) * CONFIG.vibe.amp * b.fp   // erratic scenes: letters tremble
      if (b.mode === 'shy') {   // "me gusta ser privada": a line dims when the pointer comes near it, and relaxes when you stay still or go away
        const m = this.mouse, q = m.on && !m.still && b.rect && this.space ? this.space.local(b, m.x, m.y) : null; let tg = 1
        if (q) { const dx = Math.max(b.rect.left - q.u, 0, q.u - b.rect.right), dy = Math.max(b.rect.top - q.v, 0, q.v - b.rect.bottom), d = Math.hypot(dx, dy), R3 = 3.4 * b.fp; if (d < R3) tg = .1 + .9 * (d / R3) }
        b.shy = (b.shy ?? 1) + (tg - (b.shy ?? 1)) * (1 - Math.exp(-dt / (tg < b.shy ? .35 : 1.4))); b.vis.style.opacity = b.shy.toFixed(3) }
      const mode = b.mode, rr = (mode === 'converge' ? 16 : R) * b.fp, lm = !this.reduced && !this.frozen && mouse.on && this.space && b.rect ? this.space.local(b, mouse.x, mouse.y) : null, near = !!lm && lm.u > b.rect.left - rr && lm.u < b.rect.right + rr && lm.v > b.rect.top - rr && lm.v < b.rect.bottom + rr
      for (const l of b.letters) {
        if (!l.shown) continue
        let tx = 0, ty = 0, f = 0
        if (!this.reduced) { const fm = M.float * (1 - this.calm); tx = Math.sin(t * l.f1 * M.floatSpeed + l.ph) * l.amp * .7 * fm; ty = Math.cos(t * l.f2 * M.floatSpeed + l.ph * 1.3) * l.amp * fm
          if (l.wave === 'y') ty += Math.sin(t * 2.4 + l.idx * .65) * b.fp * .1; else if (l.wave === 'x') tx += Math.sin(t * 1.6 - l.idx * .3) * b.fp * .22 * (.5 + .5 * Math.sin(t * .5 - l.idx * .05))   // sea / wind
          if (l.still) { tx = 0; ty = 0 }
          if (near && !l.still) { const dx = l.cx - lm.u, dy = l.cy - lm.v, d = Math.hypot(dx, dy), m30 = Math.min(b.fp, 30)
            { const tq = 1 - d / (3 * b.fp); if (tq > l.tr) l.tr = tq }   // letters the pointer touches keep a warm glow for a while
            if (mode === 'converge') {   // "Todo lleva a ti": the words lean toward the pointer
              if (d > 1) { const k = Math.min(d * .22, b.fp * .65) * Math.min(d / (b.fp * 2.5), 1); tx -= dx / d * k; ty -= dy / d * k } }
            else if (d < rr && d > .5) { f = 1 - d / rr
              if (mode === 'attract') { const k = f * f * m30 * .6; tx = tx * (1 - .8 * f) - dx / d * k; ty = ty * (1 - .8 * f) - dy / d * k }   // tenderness: they come closer and settle
              else { const k = f * f * m30 * M.mousePush * (mode === 'blur' ? 1.7 : 1); tx += dx / d * k + Math.sin(t * 7 + l.ph) * f * m30 * .1; ty += dy / d * k + Math.cos(t * 6 + l.ph) * f * m30 * .1 } } } }
        if (mode === 'attract') {   // touched letters warm up to the golden palette colour, and cool down slowly
          l.warm += (f - l.warm) * Math.min(1, dt * (f > l.warm ? 5 : 1.2))
          if (l.warm > .03) { const g = CONFIG.palette.gold, c = b.rgb, w = Math.min(1, l.warm * 1.7); l.el.style.color = `rgb(${c[0] + (g[0] - c[0]) * w | 0},${c[1] + (g[1] - c[1]) * w | 0},${c[2] + (g[2] - c[2]) * w | 0})`; l.cw = 1 } else if (l.cw) { l.el.style.color = ''; l.cw = 0 } }
        else if (mode === 'blur') {   // "entre más lo encuentro, menos lo conozco": the closer you look, the softer the letters
          l.bl += (f - l.bl) * Math.min(1, dt * (f > l.bl ? 6 : 1.6)); const px = l.bl * Math.min(b.fp, 30) * .1
          if (px > .08) { l.el.style.filter = `blur(${px.toFixed(2)}px)`; l.cw = 1 } else if (l.cw) { l.el.style.filter = ''; l.cw = 0 } }
        l.tr *= Math.exp(-dt * .55); if (l.tr > .04) { l.el.style.setProperty('--glow', (CONFIG.glow + l.tr * .6).toFixed(2)); l.tg = 1 } else if (l.tg) { if (l.gs != null) l.el.style.setProperty('--glow', l.gs); else l.el.style.removeProperty('--glow'); l.tg = 0 }
        if (rl) for (const q of rl) { const dx = l.cx - q.u, dy = l.cy - q.v, d = Math.hypot(dx, dy), w = b.fp * 1.7, e = Math.abs(d - q.front); if (e < w && d > 1) { const k = (1 - e / w) * q.a * Math.min(b.fp, 30) * .03; l.vx += dx / d * k; l.vy += dy / d * k } }
        l.vx += (tx - l.ox) * M.spring * s; l.vy += (ty - l.oy) * M.spring * s; const dm = Math.pow(M.damping, s); l.vx *= dm; l.vy *= dm; l.ox += l.vx * s; l.oy += l.vy * s; l.ey *= Math.exp(-dt * 8)
        let qx = 0, qy = 0, qr = 0; if (V > .02) { const w = l.vw; qx = Math.sin(t * w + l.ph * 5) * V; qy = Math.cos(t * w * 1.13 + l.ph * 3) * V * .8; qr = Math.sin(t * w * .7 + l.ph) * V / b.fp * 38 }
        if (V > .02 || Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.ey) + Math.abs(tx - l.ox) + Math.abs(ty - l.oy) > .004 || !l.set) { l.set = true; l.el.style.transform = `translate3d(${(l.ox + l.jx + qx).toFixed(2)}px,${(l.oy + l.jy + l.ey + qy).toFixed(2)}px,0) rotate(${(l.rot + qr).toFixed(2)}deg)`; if (l.rel) l.rel.style.transform = l.el.style.transform }
      }
    }
  }
}

return {Typesetter}})()
const __engine_director = (()=>{
const {CONFIG, BGS} = __config
const {parse} = __data_text
const {SCENES, TITLE, OPENING} = __data_scenes
const {Atmosphere, lerpBg} = __engine_atmosphere
const {Stars} = __engine_stars
const {Typesetter} = __engine_typesetter
const {Space} = __engine_space
const {TypeSound} = __engine_audio
const mulberry = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const lerp = (a, b, t) => a + (b - a) * t
// Plays the poem: reads the marked text, composes every passage on screen, drives atmosphere + stars, and handles input.
class Director {
  constructor({ atm, stars, stage }) {
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.steps = parse(); this.i = -1; this.busy = true; this.ended = false; this.scene = -1; this.sceneBlocks = []
    this.atm = new Atmosphere(atm); this.stars = new Stars(stars, this.reduced); this.type = new Typesetter(stage, this.reduced)
    this.space = new Space(); this.type.space = this.space; this.rooms = new Map(); this.room = null; this.vel = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 }; this.snap = true; this.travel = 0; this.travelDir = 1; this.push = 0; this.tremble = 0; this.trembleT = 0
    this.par = { x: 0, y: 0 }; this.parT = { x: 0, y: 0 }; this.audio = new TypeSound(); stage.parentElement.style.perspective = CONFIG.space.perspective + 'px'; this.makeSoundButton(stage.parentElement)
    const sp = +(new URLSearchParams(location.search).get('speed')); if (sp) CONFIG.type.speedScale = sp
    if (this.reduced) CONFIG.type.speedScale *= .4
    this.t = 0; this.last = performance.now(); this.hintTimer = 0; this.timers = []
    this.stage = stage; this.atmEl = atm; this.state = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 }; this.view = { x: 0, y: 0, z: 1, r: 0 }; this.camCfg = CONFIG.camera; this.camP = 0
    this.energy = 0; this.energyT = .05; this.act = 0; this.punch = 0; this.lastBlock = null; this.lastFlare = 0; this.type.onStrike = (b, i, q) => this.onStrike(b, i, q); this.type.onCue = (b, c, i, q) => this.onCue(b, c, i, q); this.zoomT = 0; this.zoomE = 0; this.titled = false
    this.ms = 0; this.msN = 0; this.mdist = 0; this.lx = -1; this.ly = -1; this.ghosts = []
    this.onPointer = e => { this.cat?.aim(e.clientX, e.clientY); this.cat?.petMove(e.clientX, e.clientY); this.catHoverT = (this.gate && !this.opened && !!this.cat?.hitGate(e.clientX, e.clientY)) || (!this.gate && !!this.cat?.hitBody(e.clientX, e.clientY)) ? 1 : 0;   // the star swells over her when she can be touched
      if (this.lx >= 0) this.mdist += Math.hypot(e.clientX - this.lx, e.clientY - this.ly); this.lx = e.clientX; this.ly = e.clientY; this.parT.x = e.clientX / innerWidth * 2 - 1; this.parT.y = e.clientY / innerHeight * 2 - 1; this.type.mouse.x = e.clientX; this.type.mouse.y = e.clientY; this.type.mouse.over = !!e.target.closest?.('.snd'); this.stars.mouse.x = e.clientX; this.stars.mouse.y = e.clientY; this.type.mouse.on = true }
    this.onLeave = () => { this.cat?.petEnd(); this.parT.x = this.parT.y = 0; this.type.mouse.on = false; this.stars.mouse.x = this.stars.mouse.y = -999 }
    this.onDown = e => { if (e.button > 0 || e.target.closest?.('.snd')) return; this.audio.unlock()
      if (this.gate) { if (this.cat?.hitGate(e.clientX, e.clientY)) this.openFromCat(e.clientX, e.clientY); else if (!this.opened) this.stars.bloom(e.clientX, e.clientY); return }   // gate: only the cat answers
      if (this.cat?.hit(e.clientX, e.clientY)) { this.cat.poke(); this.cur.press = 1; return }
      if (this.cat?.petStart(e.clientX, e.clientY)) { this.cur.press = 1; return }   // pressing on her = petting; it never advances the poem   // clicking the cat in the dark opens her eyes (and does not advance the poem)
      if (this.type.lamp) this.type.lamp.doorT = 1; if (!this.ended) { this.type.ripple(e.clientX, e.clientY); this.stars.bloom(e.clientX, e.clientY) } this.cur.press = 1; this.advance() }
    this.onUp = () => { this.cat?.petEnd(); if (this.type.lamp) this.type.lamp.doorT = 0 }   // dark room: holding the button slowly opens the door (the lantern widens)
    this.onKey = e => { this.audio.unlock(); if (e.key === 'm' || e.key === 'M') { this.toggleSound(); return } if (['Enter', ' ', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); if (this.gate) { if (this.cat?.ready) this.openFromCat(); return } this.advance() } }
    this.onResize = () => { clearTimeout(this.rt); this.rt = setTimeout(() => this.relayout(), 180) }
    addEventListener('pointermove', this.onPointer); document.addEventListener('pointerleave', this.onLeave); addEventListener('pointerdown', this.onDown); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onUp); addEventListener('keydown', this.onKey); addEventListener('resize', this.onResize)
    this.makeCursor(); this.makeOverlays(); this.cat = null; this.gate = false; this.opened = false; this.catHover = 0; this.atm.update(1, 0, true); this.stars.setDensity(.12)
    const qs = new URLSearchParams(location.search), skipGate = qs.has('nogate') || qs.has('cat')   // ?nogate: straight to the title; ?cat / ?cat=lit: old debug views
    const go = () => { this.type.measure(); if (skipGate) { this.later(2500, () => this.ensureCat()); this.later(900, () => this.showTitle()) } else this.later(500, () => this.openGate()) }
    document.fonts?.ready ? document.fonts.ready.then(go) : go()
    this.raf = requestAnimationFrame(this.loop = now => { const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.tick(dt); this.raf = requestAnimationFrame(this.loop) })
  }
  // the 3D cat is loaded lazily (own chunk) a moment after the title, so the opening never waits for it. Any failure leaves the poem untouched.
  // the 3D cat loads in its own chunk (once). Resolves true when she is ready, false on any failure (the poem never depends on her).
  ensureCat() { return this.catP ||= (async () => { try { const { Cat } = await import('./cat.js'), cat = new Cat(this.stage.parentElement, this.stage.parentElement.querySelector('.vignette'), this.reduced); cat.audio = this.audio; this.cat = cat
      const dbg = new URLSearchParams(location.search).get('cat'); if (dbg !== null) this.wantCat = { pose: 'SitIdle', x: .84, y: .995, h: .3, dark: dbg !== 'lit', delay: 300 }   // ?cat=lit shows her in plain light, ?cat in the dark
      const ok = await cat.load(); if (ok && this.wantCat) cat.enter(this.wantCat); return ok } catch (e) { console.warn('[cat]', e); return false } })() }
  // ---- the opening gate: the cat sits and looks at you; a click makes her stretch, then the title begins ----
  openGate() {
    this.gate = true; const O = OPENING; let settled = false
    const fallback = () => { if (!this.gate || this.opened) return; this.gate = false; this.stars.hint(false); this.showTitle() }   // no cat (yet): never leave the viewer waiting
    this.later(O.wait, () => { if (!settled) fallback() })
    this.ensureCat().then(ok => { settled = true; if (!this.gate) return; if (!ok) return fallback()
      this.cat.enter(O.cat); this.later(O.cat.delay + O.hintAfter, () => { if (this.gate && !this.opened) { const r = this.cat.rect; this.stars.hint(true, .455, r ? Math.max(.06, (r.cy - r.h / 2) / innerHeight - .07) : .45) } }) })
  }
  openFromCat(x, y) {
    if (!this.gate || this.opened) return; this.opened = true; this.stars.hint(false); this.cur.press = 1
    if (x != null) this.stars.bloom(x, y)
    const dur = this.cat?.react() || 0   // she acknowledges you (Stretch); the title begins while she settles
    this.later(dur ? Math.min(OPENING.reactMs, dur * 1000 * .75) : 300, () => { this.gate = false; this.showTitle() })
  }
  later(ms, f) { const id = setTimeout(() => { this.timers = this.timers.filter(x => x !== id); f() }, ms); this.timers.push(id) }
  destroy() { this.cat?.dispose(); cancelAnimationFrame(this.raf); this.timers.forEach(clearTimeout); removeEventListener('pointermove', this.onPointer); document.removeEventListener('pointerleave', this.onLeave); removeEventListener('pointerdown', this.onDown); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onUp); removeEventListener('keydown', this.onKey); removeEventListener('resize', this.onResize) }
  // ---- light overlays (a rising sun, a hard edge between light and shadow): DOM layers between the atmosphere and the stars ----
  makeOverlays() { const host = this.stage.parentElement, mk = c => { const e = document.createElement('div'); e.className = 'ov ' + c; e.setAttribute('aria-hidden', 'true'); host.insertBefore(e, this.stars.c); return e }
    this.ovSun = mk('sun'); this.ovEdge = mk('edge'); this.sunY = 140 }
  // ---- star cursor: the arrow is replaced by a small four-point star that follows the hand with a little lag ----
  makeCursor() { const fine = matchMedia('(pointer:fine)').matches; this.cur = { x: -99, y: -99, a: 0, press: 0, on: fine }; if (!fine) return
    const el = document.createElement('div'); el.className = 'scur'; el.setAttribute('aria-hidden', 'true')
    el.innerHTML = '<svg viewBox="-12 -12 24 24" width="22" height="22"><path d="M0-11Q1.3-1.3 11 0Q1.3 1.3 0 11Q-1.3 1.3-11 0Q-1.3-1.3 0-11Z"/></svg>'
    this.stage.parentElement.appendChild(el); this.cur.el = el; document.documentElement.classList.add('scur-on') }
  tickCursor(dt) { const c = this.cur; if (!c.on) return; const m = this.type.mouse, k = this.reduced ? 1 : 1 - Math.exp(-dt / .05)
    if (m.on) { if (c.a < .05) { c.x = m.x; c.y = m.y } c.x += (m.x - c.x) * k; c.y += (m.y - c.y) * k }
    c.a += ((m.on && !m.over ? 1 : 0) - c.a) * (1 - Math.exp(-dt / .25)); c.press *= Math.exp(-dt * 4); this.catHover += ((this.catHoverT || 0) - this.catHover) * (1 - Math.exp(-dt / .18))   // over the cat at the gate: the star swells ("click me")
    const s = 1 + c.press * .7 + this.catHover * .7 + .08 * Math.sin(this.t * 2.6), tw = .75 + .25 * Math.sin(this.t * 1.7)
    c.el.style.transform = `translate3d(${(c.x - 11).toFixed(1)}px,${(c.y - 11).toFixed(1)}px,0) rotate(${(this.t * 7 % 360).toFixed(1)}deg) scale(${s.toFixed(3)})`; c.el.style.opacity = (c.a * tw).toFixed(3) }
  clearOverlays() { this.ovSun.classList.remove('on'); this.ovEdge.classList.remove('on'); this.sunT = 140 }
  tickOverlays(dt) { if (this.ovSun.classList.contains('on')) { this.sunY += (this.sunT - this.sunY) * (1 - Math.exp(-dt / 2.6)); this.ovSun.style.setProperty('--y', this.sunY.toFixed(1) + '%') }
    if (this.ovEdge.classList.contains('on')) { const e = this.ovEdge.style; e.setProperty('--p', (50 + this.par.x * 7 + Math.sin(this.t * .09) * 3).toFixed(2) + '%'); e.setProperty('--a', (108 + Math.sin(this.t * .05) * 5 - this.par.y * 4).toFixed(2) + 'deg') } }
  // ---- camera + energy: everything on screen breathes with the writing ----
  makeSoundButton(host) { const b = document.createElement('button'); b.className = 'snd'; b.type = 'button'; b.setAttribute('aria-label', 'sonido de la máquina de escribir'); this.sndBtn = b; host.appendChild(b); b.onclick = () => this.toggleSound(); this.paintSound() }
  paintSound() { this.sndBtn.textContent = 'sonido'; this.sndBtn.classList.toggle('off', !this.audio.on) }
  toggleSound() { this.audio.setOn(!this.audio.on); this.paintSound() }
  // screen position of a point inside a block (3D aware)
  proj(b, u, v) { return (b && this.space.project(b, u, v)) || { x: innerWidth / 2, y: innerHeight / 2 } }
  caret() { const b = this.type.active || this.lastBlock; return b && b.cpx != null ? b : null }
  kick(a) { if (this.tremble > .5) this.punch = Math.min(.16, this.punch + a); else this.push = Math.min(.12, this.push + a * .9) }   // outside the trembling scenes a "hit" is only a soft push of the camera
  onStrike(b, i, quiet) { const ch = b.letters[i].ch; if (!quiet) this.audio.key(ch, b.size, this.energy * this.tremble)
    if ('.?!'.includes(ch) && this.t - this.lastFlare > .7) { this.lastFlare = this.t; const p = this.proj(b, b.cpx, b.cpy); this.stars.flare(p.x, p.y) } }
  // a "room" = one composition, placed on a winding path through space (override per scene with room:{x,y,z,yaw,pitch})
  roomFor(i, scn) { let r = this.rooms.get(i); if (r) return r
    const S = CONFIG.space, o = scn.room || {}, el = document.createElement('div'); el.className = 'room'; this.stage.appendChild(el)
    r = { i, el, fx: o.x ?? Math.sin(i * 1.37 + .4) * S.sway[0], fy: o.y ?? Math.cos(i * .93 + 1.1) * S.sway[1], z: o.z ?? -i * S.step, yaw: this.reduced ? 0 : o.yaw ?? Math.sin(i * 1.9 + .6) * S.yaw, pitch: this.reduced ? 0 : o.pitch ?? Math.cos(i * 1.3) * S.pitch }
    this.placeRoom(r); this.rooms.set(i, r); return r }
  placeRoom(r) { r.x = r.fx * innerWidth; r.y = r.fy * innerHeight; r.el.style.transform = `translate3d(${r.x.toFixed(1)}px,${r.y.toFixed(1)}px,${r.z.toFixed(1)}px) rotateY(${r.yaw.toFixed(2)}deg) rotateX(${r.pitch.toFixed(2)}deg)` }
  spring(k, target, w, dt) { const c = this.state, v = this.vel; v[k] += (w * w * (target - c[k]) - 2 * w * v[k]) * dt; c[k] += v[k] * dt }
  updateCamera(dt) {
    const R = this.room; if (!R) return
    const S = CONFIG.space, c = this.camCfg, cam = this.state, W = innerWidth, H = innerHeight, t = this.t, p = this.camP, P = S.perspective, red = this.reduced, b = this.caret()
    this.travel *= Math.exp(-dt / 1.5); this.push *= Math.exp(-dt * 1.1); this.tremble += (this.trembleT - this.tremble) * (this.trembleT ? 1 - Math.exp(-dt / .6) : 1)
    this.zoomE += (this.zoomT - this.zoomE) * (1 - Math.exp(-dt / 1.8))
    const zoom = Math.max(.55, lerp(c.zoom[0], c.zoom[1], p) + this.push + this.zoomE), dir = this.travelDir, tv = red ? 0 : this.travel
    let tx = R.x, ty = R.y, tz = R.z + P * (1 - 1 / zoom) + (b ? b.z * (c.track ?? S.track) : 0)
    let tyaw = R.yaw * S.face, tpit = R.pitch * S.face, troll = 0
    if (!red) {
      if (b) { const M = CONFIG.camera.max, ux = b.x + b.cpx - W / 2, uy = b.y + b.cpy - H / 2; tx += Math.max(-W * M, Math.min(W * M, ux * c.follow)); ty += Math.max(-H * M, Math.min(H * M, uy * c.follow)) }
      tx += Math.sin(t * .07) * c.drift[0] + Math.sin(t * .043 + 1.3) * c.drift[0] * .5; ty += Math.cos(t * .058) * c.drift[1]
      const PA = S.parallax, kp = 1 - Math.exp(-dt / PA.tau); this.par.x += (this.parT.x - this.par.x) * kp; this.par.y += (this.parT.y - this.par.y) * kp   // mouse parallax: the camera leans toward the cursor, so near words slide against far ones
      tx += this.par.x * PA.x; ty += this.par.y * PA.y; tyaw += this.par.x * PA.yaw; tpit -= this.par.y * PA.pitch
      const sw = c.calm ? 0 : 1; tz += tv * P * S.travelDolly; tyaw += sw * (Math.sin(t * .05) * .6 + tv * dir * S.travelYaw); tpit += sw * Math.cos(t * .043) * .4
      troll = Math.sin(t * .09) * c.tilt + (c.tiltRamp || 0) * p + tv * dir * S.travelRoll
    }
    if (this.snap) { Object.assign(cam, { x: tx, y: ty, z: tz, yaw: tyaw, pitch: tpit, roll: troll }); Object.keys(this.vel).forEach(k => this.vel[k] = 0); this.snap = false }
    else { const w = 2.2 / Math.max(.3, (c.tau ?? S.flyTau) * (red ? .5 : 1)); this.spring('x', tx, w, dt); this.spring('y', ty, w, dt); this.spring('z', tz, w, dt); this.spring('yaw', tyaw, w, dt); this.spring('pitch', tpit, w, dt); this.spring('roll', troll, w, dt) }
    // trembling is only for the questions (tremble:true scenes); everywhere else the camera is perfectly steady
    const en = this.energy * this.tremble * (this.me ?? 1), sh = red ? 0 : c.shake * Math.pow(en, 1.5); this.punch *= Math.exp(-dt * 5)
    const f = this.space.cam; Object.assign(f, cam)
    if (sh > 0) { f.x += (Math.sin(t * 23.1) + Math.sin(t * 37.7 + 2)) * .5 * sh; f.y += (Math.sin(t * 29.3 + 1) + Math.sin(t * 41.9)) * .5 * sh; f.roll += Math.sin(t * 17.3) * sh * .03 }
    f.z += P * this.punch
    this.stage.style.transform = this.space.css()
    // simplified 2D view for the sky + atmosphere parallax
    const rel = P / Math.max(P * .4, P - (R.z - f.z)), vx = Math.max(-500, Math.min(500, -(f.x - R.x) * .5)), vy = Math.max(-300, Math.min(300, -(f.y - R.y) * .5))
    this.view = { x: vx, y: vy, z: Math.max(.6, Math.min(1.5, rel)), r: f.roll }
    const ax = Math.max(-.09 * W, Math.min(.09 * W, vx * .12)), ay = Math.max(-.09 * H, Math.min(.09 * H, vy * .12))   // clamped well inside the 14% overscan; scale never drops below 1
    this.atmEl.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) scale(${Math.max(1, 1.04 + (this.view.z - 1) * .25).toFixed(3)})`
  }
  tick(dt) {
    this.cat?.update(dt, this.t)
    this.energy += (this.energyT - this.energy) * (1 - Math.exp(-dt / 1.6))
    const typing = this.type.active && this.type.active.typing ? 1 : 0; this.act += (typing - this.act) * (1 - Math.exp(-dt / (typing ? .25 : 1.2)))
    const sp = this.mdist / Math.max(dt, .001); this.mdist = 0; this.ms += (sp - this.ms) * (1 - Math.exp(-dt / .55)); this.msN = Math.min(1, this.ms / 900)
    this.me = this.tremble ? .4 + .9 * this.msN : 1   // the questions tremble with the hand: a still mouse calms the letters, a restless one stirs them
    this.tickOverlays(dt); this.tickCursor(dt); this.stillT = this.ms < 60 ? (this.stillT || 0) + dt : 0; this.type.mouse.still = this.stillT > 1.4; this.updateCamera(dt); this.type.vibe = Math.pow(this.energy, 1.35) * this.tremble * this.me
    const cp = this.caret(), fp = cp ? this.proj(cp, cp.cpx, cp.cpy) : { x: -999, y: -999 }
    if ((this.fr = (this.fr || 0) + 1) % 3 === 0) this.stars.avoid = this.type.blocks.filter(b => !b.leaving && b.ri > 0).map(b => this.space.rect(b)).filter(Boolean)
    Object.assign(this.stars, { energy: this.energy, act: this.act, cam: this.view, focus: fp })
    if (cp && fp.x > -900) { const W = innerWidth, H = innerHeight; this.atm.setLamp(fp.x / W, fp.y / H, (this.lampA ?? CONFIG.caretLight) * this.act, cp.rgb || [255, 200, 120]) } else this.atm.setLamp(.5, .5, 0, this.atm.lamp.trgb)
    this.atm.update(dt, this.t, false, this.act, this.energy); this.stars.update(dt, this.t); this.type.update(dt, this.t)
    if (this.hintTimer > 0 && !this.busy) { this.hintTimer -= dt * 1000; if (this.hintTimer <= 0) this.stars.hint(true) } }
  // ---- the title: "Ontología" types itself, holds, then the first passage begins (a swoop from the title room to room 0) ----
  showTitle() {
    const T = TITLE, room = this.roomFor(-1, { room: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 } }); this.titled = true
    this.room = room; this.type.root = room.el; this.camCfg = { ...CONFIG.camera, zoom: [1, 1.1], follow: 0, drift: [6, 4], tilt: .2 }; this.camP = 0
    this.atm.set(T.bg, 1.2); this.stars.setDensity(T.stars); this.energyT = .04; this.trembleT = 0; this.stars.tint = T.color
    const d = this.type.dims(T.text, T.size, T.w), b = this.type.add({ text: T.text, x: T.x * innerWidth, y: T.y * innerHeight - d.h / 2, w: T.w, size: T.size, color: T.color, align: 'center', speed: T.speed, room, z: 0 })
    b.tw = d.tw; this.lastBlock = b
    this.type.start(b, () => this.later(T.hold, () => { this.busy = false; this.advance(true) }))
  }
  // ---- cues (src/data/cues.js): effects tied to words ----
  onCue(b, c, i, quiet) {
    const l = b.letters[i]
    switch (c.fx) {
      case 'tear': if (quiet || Math.random() > .42) break; { const p = this.proj(b, l.cx, l.cy + b.fp * .3), r = Math.random
        this.stars.drop(p.x, p.y, { vx: (r() - .5) * 10, vy: 4 + r() * 10, g: 46 + r() * 30, life: 3 + r() * 1.6, size: 7 + r() * 6, col: 'blue', a: .85 }) } break
      case 'spill': if (quiet || Math.random() > .62) break; { const p = this.proj(b, l.cx, l.cy), r = Math.random, col = r() < .5 ? 'orange' : 'white'
        this.stars.drop(p.x, p.y, { vx: 60 + r() * 190, vy: -140 + r() * 120, g: 430 + r() * 160, life: 1.5 + r() * 1.2, size: 9 + r() * 9, col, a: .9, spin: (r() - .5) * 4 }) } break
      case 'zoom': this.zoomT = c.v || 0; break
      case 'threads': this.stars.thrT = 1; break
      case 'dissolve': {   // "nada en particular": the letters turn into stars that rise, and the letters fade after them
        l.el.style.setProperty('--md', (c.ord * .09).toFixed(2) + 's'); l.el.classList.add('melt'); if (quiet) break
        if (Math.random() < .7) { const p = this.proj(b, l.cx, l.cy), r = Math.random; this.stars.drop(p.x, p.y, { vx: (r() - .5) * 16, vy: -(10 + r() * 26), g: -4 - r() * 8, life: 3.6 + r() * 2, size: 7 + r() * 8, col: r() < .6 ? 'white' : 'gold', a: .7, spin: (r() - .5) * .8 }) } break }
      case 'bloom': { if (quiet) break   // "estrella": a few stars rise out of the word
        const n = c.at.length; for (let k = 0; k < 6; k++) { const q = b.letters[Math.max(0, i - Math.floor(Math.random() * n))], p = this.proj(b, q.cx, q.cy), r = Math.random
          this.stars.drop(p.x, p.y, { vx: (r() - .5) * 26, vy: -(26 + r() * 40), g: -10, life: 3 + r() * 2, size: 9 + r() * 10, col: r() < .5 ? 'gold' : 'white', a: .8, spin: (r() - .5) * .6 }) } break }
      case 'wind': this.stars.windT = 1; break
      case 'sunrise': this.sunT = 86; this.ovSun.classList.add('on'); break
      case 'edge': this.ovEdge.classList.add('on'); break
    }
  }
  // click / key: finish the line being typed, otherwise move to the next passage
  advance(auto) {
    if (this.busy || this.ended) return
    const a = this.type.active; if (a && a.typing) { this.type.finish(a); return }
    if (this.i + 1 >= this.steps.length) return
    this.stars.hint(false); this.hintTimer = 0
    const step = this.steps[++this.i], scn = SCENES[step.scene] || {}
    if (step.kind !== 'add') { this.newScene(step, scn) } else this.show(step, scn)
  }
  newScene(step, scn) {
    this.wantCat = scn.cat || (new URLSearchParams(location.search).get('cat') !== null ? this.wantCat : null); scn.cat ? this.cat?.enter(scn.cat) : (new URLSearchParams(location.search).has('cat') ? 0 : this.cat?.leave())
    const first = this.scene < 0 && !this.titled, prev = this.room; this.zoomT = 0; this.stars.thrT = 0; this.clearOverlays(); this.fadeGhosts(); this.scene = step.scene; this.sceneBlocks = []
    const old = this.type.blocks.filter(b => !b.leaving); old.forEach(b => this.type.leave(b, scn.cut ? 320 : 1500))
    const room = this.roomFor(step.scene, scn); this.room = room; this.type.root = room.el; this.lastBlock = null
    if (first || scn.cut) { this.snap = true; this.travel = 0 } else { this.travel = 1; this.travelDir = room.x >= (prev?.x ?? 0) ? 1 : -1 }
    for (const [i, r] of this.rooms) if (r !== room) { this.rooms.delete(i); setTimeout(() => r.el.remove(), scn.cut ? 500 : 2200) }
    this.applyMood(step, scn); this.busy = true
    this.later(first ? 0 : scn.cut ? 600 : (scn.delay ?? 1100), () => { this.busy = false; this.show(step, scn) })
    if (!first) this.busy = true
  }
  applyMood(step, scn) {
    const n = this.steps.filter(s => s.scene === step.scene).length, p = n > 1 ? step.k / (n - 1) : 0, tau = scn.cut ? CONFIG.bg.cutTau : (scn.tau ?? CONFIG.bg.tau) * (this.reduced ? .5 : 1)
    const bs = scn.bgSteps?.[step.k], b = typeof bs === 'string' ? { bg: bs } : bs   // per-step background (e.g. the dark room)
    if (b) this.atm.set(b.bg, (b.tau ?? tau) * (this.reduced ? .5 : 1))
    else if (scn.bgRamp) { const r = scn.bgRamp, f = p * (r.length - 1), j = Math.min(r.length - 2, Math.floor(f)); this.atm.set(r.length === 1 ? r[0] : lerpBg(r[j], r[j + 1], f - j), tau) } else this.atm.set(scn.bg || 'void', tau)
    this.stars.setDensity(scn.starSteps?.[step.k] ?? (scn.starRamp ? lerp(scn.starRamp[0], scn.starRamp[1], p) : scn.stars ?? .3))
    this.stars.setMix(scn.bg === 'gold' || scn.bg === 'amber' ? { blue: .35 } : scn.bg === 'navy' || scn.bg === 'midnight' || scn.bg === 'slate' ? { orange: .45, gold: .8 } : {})
    this.trembleT = scn.tremble ? 1 : 0; if (!scn.tremble && scn.cut) this.tremble = 0   // letters + camera only tremble in tremble:true scenes
    this.lampA = scn.lamp ?? CONFIG.caretLight; this.stars.pull = scn.pull || 0
    if (scn.lantern) { const L = scn.lantern, b0 = L.base[Math.min(step.k, L.base.length - 1)]; if (!this.type.lamp) this.type.lamp = { r: L.radius, caret: L.caret, base: b0, baseT: b0, door: 0, doorT: 0 }; else this.type.lamp.baseT = b0 } else this.type.lamp = null
    this.energyT = scn.energyRamp ? lerp(scn.energyRamp[0], scn.energyRamp[1], p) : scn.energy ?? .12
    this.camCfg = { ...CONFIG.camera, ...(scn.cam || {}) }; this.camP = p
  }
  // ---- composition ----
  spec(step, scn, before) { // returns {x,y,w,size,color,align,lh,speed}
    const vw = innerWidth, vh = innerHeight, k = step.k, colors = scn.colors || ['white'], it = scn.items?.[k], m = Math.max(18, vw * (scn.margin ?? .055))
    let o
    if (it) { o = { ...it, size: it.size ?? 1, color: it.color || colors[k % colors.length] }
      if (it.stack && before.length) { const p = before[before.length - 1]; o.x = p.x; o.y = p.y + p.h + (it.gap ?? 1.6) * this.type.unit * o.size * 1.4 } else { o.x = it.x * vw; o.y = it.y * vh } }
    else if (scn.flow) { const f = scn.flow, p = before[before.length - 1]; o = { size: f.size, w: f.w, align: f.align, color: colors[k % colors.length], x: f.x * vw, y: p ? p.y + p.h + f.gap * this.type.unit * f.size * 1.6 : f.y * vh } }
    else { const s = scn.scatter || { size: [1.2, .9], w: [.3, .4], pad: 18 }, n = this.steps.filter(x => x.scene === step.scene).length, p = n > 1 ? k / (n - 1) : 0, rng = mulberry(step.scene * 131 + k * 17 + 7)
      let size = lerp(s.size[0], s.size[1], p) * (vw < 700 ? .78 : 1), best = null
      for (let pass = 0; pass < 3 && (!best || best.score > 0); pass++, size *= .88) for (let tr = 0; tr < 70; tr++) {
        const w = lerp(s.w[0], s.w[1], rng()), d = this.type.dims(step.text, size, w), x = m + rng() * Math.max(1, vw - d.w - 2 * m), y = m + rng() * Math.max(1, vh - d.h - 2 * m - 30)
        let score = 0; for (const b of before) { const ox = Math.min(x + d.tw, b.x + b.w) - Math.max(x, b.x) + 0, oy = Math.min(y + d.h, b.y + b.h) - Math.max(y, b.y); const pad = s.pad ?? 18; const ex = Math.min(x + d.tw + pad, b.x + b.tw + pad) - Math.max(x - pad, b.x - pad), ey = Math.min(y + d.h + pad, b.y + b.h + pad) - Math.max(y - pad, b.y - pad); if (ex > 0 && ey > 0) score += ex * ey }
        const prev = before[before.length - 1]; if (prev) score += Math.max(0, 180 - Math.hypot(x - prev.x, y - prev.y)) * .02   // keep neighbours from stacking, but allow clusters
        if (!best || score < best.score) best = { score, x, y, w, size }
        if (score === 0 && tr > 24) break }
      o = { size: best.size, w: best.w, x: best.x, y: best.y, color: colors[k % colors.length] } }
    o.w = o.w ?? .4; const d = this.type.dims(step.text, o.size, o.w, o.lh)
    // depth: explicit item z / ry, or a seeded spread from the scene's depth:{z:[min,max], ry:[min,max], step}
    const dp = scn.depth, rz = mulberry(step.scene * 977 + k * 31 + 5); o.z = it?.z ?? (dp ? lerp(dp.z[0], dp.z[1], rz()) + (dp.step || 0) * k : 0); o.ry = it?.ry ?? (dp?.ry ? lerp(dp.ry[0], dp.ry[1], rz()) : 0); o.rx = it?.rx ?? 0
    // keep the block on screen after perspective scaling (a block nearer the camera is bigger and spreads away from the centre)
    let q = this.onscreen(o.x, o.y, d, o.z, m, o.ry); o.x = q.x; o.y = q.y; o.tw = d.tw
    if (before.length && !it?.stack) this.fit(o, step.text, before, m)
    const nn = this.steps.filter(x => x.scene === step.scene).length, pp = nn > 1 ? k / (nn - 1) : 0
    o.speed = (it?.speed ?? (scn.speedRamp ? lerp(scn.speedRamp[0], scn.speedRamp[1], pp) : scn.speed ?? 1)) * (o.hold ? 1.5 : 1); o.punch = it?.punch ?? scn.punch; o.hesitate = scn.hesitate; o.mouse = it?.mouse ?? scn.mouse; o.lantern = !!scn.lantern; o.text = step.text; return o
  }

  // ---- layout that understands 3D: projected rectangles must not touch (a block nearer the camera is bigger and spreads from the centre) ----
  onscreen(x, y, d, z, m, ry = 0) { const vw = innerWidth, vh = innerHeight, P = CONFIG.space.perspective, sc = P / Math.max(200, P - z), hw = d.w * sc / 2 * (1.1 + Math.abs(ry) * .012), hh = d.h * sc / 2   // a block turned about Y (ry) swings one edge toward the camera: keep extra room
    const PA = CONFIG.space.parallax, mx = m + PA.x * .7, my = m * .8 + PA.y * .7   // room for the camera to lean toward the cursor
    const cx = Math.max(mx + hw, Math.min(vw / 2 + (x + d.w / 2 - vw / 2) * sc, vw - mx - hw)), cy = Math.max(my + hh, Math.min(vh / 2 + (y + d.h / 2 - vh / 2) * sc, vh - my - hh))
    return { x: vw / 2 + (cx - vw / 2) / sc - d.w / 2, y: vh / 2 + (cy - vh / 2) / sc - d.h / 2 } }
  prect(x, y, d, z) { const vw = innerWidth, vh = innerHeight, P = CONFIG.space.perspective, sc = P / Math.max(200, P - z), X = vw / 2 + (x - vw / 2) * sc, Y = vh / 2 + (y - vh / 2) * sc; return { x0: X, y0: Y, x1: X + d.tw * sc, y1: Y + d.h * sc } }
  overlap(a, b, pad) { const ex = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + pad * 2, ey = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) + pad * 2; return ex > 0 && ey > 0 ? ex * ey : 0 }
  fit(o, text, before, m) {   // keep the intended spot if it is free; otherwise slide to the nearest free spot, shrinking a little if the screen is crowded
    const pad = CONFIG.space.gap, others = before.map(b => this.prect(b.x, b.y, { tw: b.tw ?? b.w, h: b.h }, b.z || 0))
    const hit = (x, y, d) => { const r = this.prect(x, y, d, o.z); let s = 0; for (const t of others) s += this.overlap(r, t, pad); return s }
    let best = null
    for (let shr = 0; shr < 7; shr++) {
      const size = o.size * (1 - shr * .07), d = this.type.dims(text, size, o.w, o.lh), step = this.type.unit * size * 1.5 + 8
      for (let ring = 0; ring <= 14; ring++) for (let a = 0, n = ring ? 16 : 1; a < n; a++) {
        const ang = a / n * 6.2832 + ring * .7, p = this.onscreen(o.x + Math.cos(ang) * ring * step * 1.25, o.y + Math.sin(ang) * ring * step * .8, d, o.z, m, o.ry), ov = hit(p.x, p.y, d)
        const sc = ov * 4 + Math.hypot(p.x - o.x, p.y - o.y) * .5 + shr * 4000
        if (!best || sc < best.sc) best = { sc, x: p.x, y: p.y, size, d }
        if (ov === 0) { Object.assign(o, { x: p.x, y: p.y, size, tw: d.tw }); return } } }
    Object.assign(o, { x: best.x, y: best.y, size: best.size, tw: best.d.tw }) }
  show(step, scn) {
    if (step.kind === 'add') { this.zoomT = 0; this.clearOverlays() }
    if (!this.sceneBlocks.length && step.kind === 'add') this.applyMood(step, scn)
    if (step.kind === 'add') this.applyMood(step, scn)
    const o = this.spec(step, scn, this.sceneBlocks.map(b => ({ x: b.x, y: b.y, z: b.z, w: b.w, h: b.h, tw: b.tw ?? b.w }))); o.room = this.room; const b = this.type.add(o); b.tw = o.tw; b.step = step; b.scn = scn
    this.sceneBlocks.forEach((p, i, a) => { const age = a.length - i; this.type.setOpacity(p, Math.max(.62, 1 - .08 * age)) })   // earlier lines recede, never vanish
    this.sceneBlocks.push(b); this.lastBlock = b; this.stars.tint = o.color; if (o.punch) this.kick(o.punch)
    if (scn.ordered) b.el.classList.add('ordered')
    this.type.start(b, () => { this.afterType() })
  }
  // the questions leave a faint echo far behind the writing; it stays until the composition ends
  addGhost(b) { const r = Math.random, o = { x: r() * innerWidth * .7, y: r() * innerHeight * .8, w: .2 + r() * .2, size: b.size * (.8 + r() * .5), z: -(240 + r() * 820), text: b.text, rgb: b.rgb }
    this.fit(o, b.text, this.sceneBlocks.map(q => ({ x: q.x, y: q.y, z: q.z, w: q.w, h: q.h, tw: q.tw ?? q.w })), 20)
    this.ghosts.push(this.type.ghost(o)); if (this.ghosts.length > 18) this.fadeOne(this.ghosts.shift()) }
  fadeOne(e) { e.style.transitionDuration = '1500ms'; e.classList.add('leave') }
  fadeGhosts() { this.ghosts.forEach(e => this.fadeOne(e)); this.ghosts = [] }
  // ---- the ending: "Ya terminé de pensar." Everything settles: letters stop floating, the stars almost stop, the room sinks to black ----
  finale() { this.later(1600, () => { this.type.calmT = 1; this.stars.hushT = 1; this.stars.setDensity(.12); this.atm.set('pitch', 7); this.energyT = 0; this.trembleT = 0
      this.camCfg = { ...this.camCfg, drift: [0, 0], tilt: 0, shake: 0, calm: true }; this.lastBlock?.cur.classList.add('end'); this.later(4000, () => { this.type.frozen = true }) }) }
  afterType() { if (SCENES[this.scene]?.echo && this.lastBlock && !this.reduced) this.addGhost(this.lastBlock)
    if (this.i + 1 >= this.steps.length) { this.ended = true; this.finale(); return }
    const lb = this.lastBlock; if (lb && lb.cpx != null) { const p = this.proj(lb, lb.cpx, lb.cpy); this.stars.flare(p.x, p.y) }
    this.hintTimer = CONFIG.hintDelayMs }
  relayout() { this.cat?.resize(); this.type.measure(); const done = []
    for (const b of this.sceneBlocks) { if (b.leaving) continue; const o = this.spec(b.step, b.scn, done.map(q => ({ x: q.x, y: q.y, z: q.z, w: q.w, h: q.h, tw: q.tw }))); this.type.place(b, o.x, o.y, o.w, o.size, o.lh, o.z, o.ry); b.tw = o.tw; done.push(b) }
    for (const r of this.rooms.values()) this.placeRoom(r)
    this.stars.resize() }
}

return {Director}})()
const {Director} = __engine_director
const mount = () => { const r = document.getElementById('root'); r.innerHTML = '<main class="ont"><h1 class="sr">Ontología</h1><canvas class="atm" aria-hidden="true"></canvas><canvas class="stars" aria-hidden="true"></canvas><div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div class="stage" aria-live="polite"></div></main>'
  const q = s => r.querySelector(s), d = new Director({ atm: q('.atm'), stars: q('.stars'), stage: q('.stage') }); if (new URLSearchParams(location.search).has('debug')) window.__ont = d }
mount()
})()
