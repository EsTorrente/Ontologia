// Everything tunable lives here: colours, type scale, speeds, particle density, atmosphere.
export const CONFIG = {
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
export const BGS = {
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
