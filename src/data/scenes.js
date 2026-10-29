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
export const TITLE = { text: 'Ontología', x: .2, y: .46, w: .6, size: 5.8, color: 'gold', speed: 3.2, hold: 2600, bg: 'void', stars: .24 }
// OPENING: before the title, the cat sits at the bottom centre looking at the viewer. Clicking her (or Enter / Space) makes her stretch,
// then the title types itself and the poem continues as usual. If she can't load within `wait` ms the title simply starts.
//   cat: placement (x,y = feet position, h = height as a fraction of the screen), amb/key = light strength, delay = ms before she fades in
// Any scene can carry cat:{...} (see engine/cat.js): pose, yaw, dark, look:false (no cursor following), lookMax (deg), maxW (max width as a screen fraction),
//   stretchAt (ms: one Stretch), pet (press + stroke on her), petStretch (she stretches after a long stroke), pitch (rad, seen from above), hold + hide:'left' + peeks:[ms,...] (PeekHide from the screen edge).
export const OPENING = { wait: 7000, hintAfter: 2600, reactMs: 1500, cat: { pose: 'SitIdle', x: .455, y: .955, h: .38, yaw: -.14, pet: true, dark: false, gate: true, amb: .6, key: 1, delay: 700 } }
// which creatures a scene brings (so their models can load a few scenes ahead): scene index -> kinds
export const CRITTER_SCENES = { 2: ['butterfly'], 5: ['hummer', 'butterfly'], 16: ['sparrows'], 18: ['sparrows'], 22: ['canary', 'sparrows'] }
export const SCENES = [
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
/* 14 tenderness */     { cat: { pose: 'Flopped', x: .27, y: .9, h: .42, yaw: 0, pitch: .2, pet: true, dark: false, amb: .5, key: 1, delay: 1800, lookMax: 22, maxW: .4 }, mouse: 'attract', pull: .6, bg: 'ember', stars: .4, colors: ['white'], speed: .95, energy: .15, cam: { zoom: [1.05, 1] }, items: [{ x: .50, y: .46, w: .40, size: 1.3 }] },
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
    { x: .10, y: .26, w: .62, size: 1.4, color: 'gold' }, { x: .2, y: .6, w: .56, size: 1.4, color: 'blue' }] },
/* 23 ordered ending */ { room: { yaw: 0, pitch: 0, x: 0, y: 0 }, bg: 'paper', stars: .2, speed: .8, delay: 1800, ordered: true, energy: 0, cam: { zoom: [1, 1], follow: 0, drift: [0, 0], tilt: 0, shake: 0, calm: true }, items: [
    { x: .1, y: .22, w: .46, size: 1.05, color: 'white', lh: 1.95 }, { x: .1, w: .46, size: 1.05, color: 'gold', stack: true, gap: 2 }] },
]
