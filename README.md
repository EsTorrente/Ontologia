# Ontología
Interactive typographic poem: typewriter text, slowly changing atmosphere, floating four-point stars. No cat, no illustrations (by design, for now).

```
npm install
npm run dev                          # local
npm run build                        # static site -> dist/
VITE_BASE=/repo-name/ npm run build  # GitHub Pages (project site)
```
Add `?speed=0.3` to the URL to play faster while testing.

`preview/index.html` runs the whole experience by double-click, without Vite. Rebuild it after editing `src/` with `node scripts/bundle-preview.mjs`.

## Where to edit
| What | File |
|---|---|
| The poem and its `**` / `*` markers | `src/data/text.js` |
| Position, size, colour, speed, background and star density of every composition | `src/data/scenes.js` |
| Palette, typewriter timing, cursor lead, glow, mouse physics, star count, background colours | `src/config.js` |
| Engines: `src/engine/` (`director` = sequence + placement, `typesetter` = letters, `stars`, `atmosphere`) | |

Controls: click / tap / Space / Enter / → . A click while a passage is typing completes it; the next click advances. A quiet star at the bottom centre appears when it is waiting for you.

## Milestone 2 knobs
- `scenes.js` per scene: `speed` / `speedRamp` (typing tempo, <1 = faster), `energy` / `energyRamp` (0..1: letter vibration, camera shake, star speed), `cam:{zoom,follow,drift,tilt,shake}`, `bgSteps` / `starSteps` (per-passage background and star density), item `punch` (camera hit).
- `config.js`: `camera`, `vibe.amp`, `stars.glow`, `type.charMs`.
- Dev tip: `?speed=0.3` plays faster; `?debug` exposes `window.__ont`.

## Milestone 3
- **Tremble** (letter vibration + camera shake) only happens in scenes with `tremble: true` in `scenes.js`: from "Y por qué?" through "Quiero ser humano…". It is off everywhere else and cuts to zero at "Todo". Outside those scenes a `punch` is only a soft camera push.
- **3D space.** Every composition is a *room* on a winding path through space (`CONFIG.space`: perspective, `step` = depth between rooms, `sway`, `yaw`/`pitch` = room angle, `face` = how much the camera squares up to it, `travel*` = the swoop between rooms). The camera flies from room to room (a spring, so it eases in and out), and inside a room it follows the active block's depth (`track`) and the caret. Per scene: `room:{x,y,z,yaw,pitch}` to place a room by hand; `depth:{z:[min,max], ry:[min,max], step}` for a seeded depth spread; per item `z` / `ry`; `cam:{track, calm:true}` (calm = no sway, used for "Todo", "...", and the ordered ending). Implemented with CSS 3D (no new dependency): `src/engine/space.js` mirrors the CSS maths so the mouse still disturbs letters on their tilted planes.
- **Typing sound** (`src/engine/audio.js`, synthesised, no files): tick + soft thock per letter, deeper for the space bar, a ratchet for line breaks; deeper keys for bigger type, a little harder when restless. Browsers only allow sound after a gesture, so the very first line is silent until the first click / key. Toggle with the small `sonido` button (bottom right) or the M key. Tune in `CONFIG.audio`.

## Milestone 3.1
- **Background edge:** the atmosphere canvas is oversized (128%) and its parallax is clamped, so no transition can reveal an edge (measured: ≥94 px of spare margin over the whole poem).
- **Parallax:** the camera leans toward the cursor (`CONFIG.space.parallax`: x, y, yaw, pitch, tau), so near words slide against far ones. Set all to 0 to disable.
- **No covering:** layout now works on the *projected* rectangles (depth and perspective included) with a gap (`CONFIG.space.gap`). A block that would touch another slides to the nearest free spot and, if the screen is crowded, shrinks a little. Margins include room for the parallax lean.
- **Stars:** big stars are dimmer (`CONFIG.stars.glow`, `bigDim`), and any star behind a text block fades (`behindText: [small, big]`) so the writing always has a clean background.

## Milestone 4
- **Title:** `TITLE` in `scenes.js` ("Ontología" types itself, holds, then the first passage begins).
- **Cues** (`src/data/cues.js`): pauses and effects tied to words, without touching `text.js`. `{ at | after: 'text', pause: ms }`, `{ at, fx, each?, end? }`, `{ at, shrink }`. Currently: pauses before "aún así los acaricio" and after the first two "…ser humana."; `spill` ("Vomito mis palabras." throws stars), `tear` ("escapa en lágrimas": stars fall), `threads` (hair-thin lines between stars), `sunrise`, `edge` (hard light/shadow split), `zoom` + `shrink` ("pequeña").
- **Mouse modes** per scene or item (`mouse:` in `scenes.js`): `repel` (default), `attract` (tenderness: letters come closer and warm to gold; stars lean in, `pull`), `converge` ("Todo lleva a ti"), `blur` ("Entre más lo encuentro…").
- **Dark room** (`lantern:{radius,caret,base:[per passage]}`): text is only lit near the pointer and the caret; holding the button slowly widens the light (the door opens); the room lifts at "Me sorprende…".
- **Caret light:** the typed words softly light the room (`CONFIG.caretLight`, per scene `lamp: 0..1`).
- **Questions:** `echo:true` leaves a faint far-away copy of each question; tremble follows the mouse (still = calm, restless = stirred).
- **Mirror:** `mirror:true` on an item (abuelita).

## Cat (Milestone 6a)
- Model: `public/assets/cat.glb` (loaded lazily, own chunk; if it fails to load the poem is unaffected). Needs the `three` dependency (`npm install`).
- Dark room (scene 11): she sits at the right edge in total darkness. Click her: her eyes glow (that click does not advance the poem).
- Debug: add `?cat=lit` to the URL to see her in plain light in any scene, or `?cat` to see her in the dark.
- Knobs in `config.js` → `cat`: `rim` (faint back-light so she is barely visible; 0 = no light at all), `eye` (glow colour), `yaw`, `defaults` (x, y, h). Per scene: `cat: {...}` in `scenes.js`.
- Note: the .glb contains each clip twice; the plain-named ones ("SitIdle") are empty, the ".001" ones hold the motion. The loader picks the one with motion automatically.

- Watching (6b): once her eyes are open she follows the star cursor with head + eyes (`config.cat.look`); if the cursor rests ~4.5 s she looks ahead again.

## Opening cat (Milestone 6c)
- The experience now starts with **the cat sitting at the bottom centre, looking at you** (SitIdle; her head and eyes follow the star cursor when it moves). A faint star appears over her head after a few seconds. **Click her** (or press Enter / Space): she stretches (`Stretch`, then settles back into `SitIdle`, cross-faded), the title "Ontología" types itself, and the poem continues as before; she fades out as the first passage begins. Clicks anywhere else only send a small ripple of stars. Hovering her makes the star cursor swell.
- Safety net: if the model can't load (or takes longer than `OPENING.wait`, 7 s) the title simply starts. The poem never depends on her.
- Knobs: `OPENING` in `src/data/scenes.js` (placement `x, y, h`, light `amb` / `key`, `delay`, `hintAfter`, `reactMs`, `wait`). Debug: `?nogate` skips the gate; `?cat` / `?cat=lit` are the old debug views.
- `preview/index.html` (no Vite) has no 3D, so it skips the gate and goes straight to the title. The cat needs `npm run dev` / `npm run build`.

- Gaze (6c): her head + eyes follow the cursor only *sometimes* (`CONFIG.cat.look`: `attend` seconds following, `rest` seconds looking ahead, `chance`), layered additively on top of whatever clip is playing; she does not track while she stretches. Placement of the opening cat: `OPENING.cat` (`x`, `y`, `h`).
- Fix (6e): the head/eye aiming had two bugs (rotation applied in the wrong bone frame, and a quaternion overwritten before `slerp` read it, which cancelled the aim). Verified numerically against the real skeleton: requested 15° / 30° / 60° head turns now come out exactly as requested. Dev tip: `window.__ont.cat.watchW` (with `?debug`) shows how strongly she is following (0 = looking ahead, 1 = following).

## Milestone 8.1
- **Cat materials:** the body and eyes keep the model's own alpha blending again (soft edges, vertex alpha). In lit scenes her eyes show their natural texture (`CONFIG.cat.litEyes`: 0 = natural, 1 = glowing gold); in the dark room they are black until you click her, then they glow gold. Fixed a bug where the glow value never reached the eye shader (a statement had ended up inside a comment), which left the eyes black.
- **Petting sounds** (`src/engine/catsound.js`, files in `public/assets/sounds/`): a trill when you start petting (at most every 5 s), a purr that fades in while you stroke (a little louder when you move faster) and out when you stop, a double trill when she stretches after long petting, and a soft trill when her eyes open in the dark. They use the poem's audio context, so the "sonido" button / M key mutes them. Level: `VOL` in `catsound.js`.

## Critters (Milestone 9)
3D birds and a butterfly live on one transparent canvas under the text (`src/engine/critters.js`). Cues in `src/data/cues.js` (`fx: 'critter'`, `kind: hummer | butterfly | canary | sparrows`) bring them in; they leave when the scene changes. Models (`public/assets/{hummer,butterfly,canary,sparrows}.glb`) load lazily a few scenes ahead.
- hummer ("pájaros"): hovers, follows a moving pointer, dashes away when clicked (chirp + star bloom)
- butterfly ("insectos"): lands and rests; flutters away if the pointer comes close ("pero no tocarlos")
- sparrows ("saludo a los pájaros", "pájaro", "gorrión"): a flock that scatters when clicked or startled
- canary (wooden mobile, "¿Para qué vuela el canario"): hangs from the top and sways; click makes it swing and sing
Like the cat, they only load in the Vite build, not the double-click preview. Assets add about 19 MB.

## Metronome and song
- A synthesised, clock-like tick (`src/engine/metronome.js`, no sample files) starts with the title at a steady 65 bpm (`src/data/tempo.js`).
- Once the first text has been written, the ticks sink away and `public/assets/sounds/song-04.mp3` fades in (streamed from an `<audio>` element, not decoded). When the song is about to end (its last seconds are silent) the ticks fade back in at 65 bpm and stay there.
- The "sonido" button / M key mutes everything (the clock and the song keep their time silently). If the song can't load, the metronome simply carries on.
- Knobs in `tempo.js`: `start`, `level`, `track` (`scene`/`k`/`when` = what starts the song, `fadeIn`, `fadeOut`, `tail`, `back`, `after`), and `scenes` (optional tempo changes per scene; empty = steady).
