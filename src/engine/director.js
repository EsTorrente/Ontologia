import { CONFIG, BGS } from '../config.js'
import { parse } from '../data/text.js'
import { CRITTER_SCENES, SCENES, TITLE, OPENING } from '../data/scenes.js'
import { Atmosphere, lerpBg } from './atmosphere.js'
import { Stars } from './stars.js'
import { Typesetter } from './typesetter.js'
import { Space } from './space.js'
import { TypeSound } from './audio.js'
import { Metronome } from './metronome.js'

const mulberry = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const lerp = (a, b, t) => a + (b - a) * t
// Plays the poem: reads the marked text, composes every passage on screen, drives atmosphere + stars, and handles input.
export class Director {
  constructor({ atm, stars, stage }) {
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.steps = parse(); this.i = -1; this.busy = true; this.ended = false; this.scene = -1; this.sceneBlocks = []
    this.atm = new Atmosphere(atm); this.stars = new Stars(stars, this.reduced); this.type = new Typesetter(stage, this.reduced)
    this.space = new Space(); this.type.space = this.space; this.rooms = new Map(); this.room = null; this.vel = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 }; this.snap = true; this.travel = 0; this.travelDir = 1; this.push = 0; this.tremble = 0; this.trembleT = 0
    this.par = { x: 0, y: 0 }; this.parT = { x: 0, y: 0 }; this.audio = new TypeSound(); this.metro = new Metronome(this.audio); stage.parentElement.style.perspective = CONFIG.space.perspective + 'px'; this.makeSoundButton(stage.parentElement)
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
      if (this.critters?.click(e.clientX, e.clientY)) { this.cur.press = 1; return }   // birds answer when you press on them
      if (this.cat?.hit(e.clientX, e.clientY)) { this.cat.poke(); this.cur.press = 1; return }
      if (this.cat?.petStart(e.clientX, e.clientY)) { this.cur.press = 1; return }   // pressing on her = petting; it never advances the poem   // clicking the cat in the dark opens her eyes (and does not advance the poem)
      if (this.type.lamp) this.type.lamp.doorT = 1; if (!this.ended) { this.type.ripple(e.clientX, e.clientY); this.stars.bloom(e.clientX, e.clientY) } this.cur.press = 1; this.advance() }
    this.onUp = () => { this.cat?.petEnd(); if (this.type.lamp) this.type.lamp.doorT = 0 }   // dark room: holding the button slowly opens the door (the lantern widens)
    this.onKey = e => { this.audio.unlock(); if (e.key === 'm' || e.key === 'M') { this.toggleSound(); return } if (['Enter', ' ', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); if (this.gate) { if (this.cat?.ready) this.openFromCat(); return } this.advance() } }
    this.onResize = () => { this.critters?.resize(); clearTimeout(this.rt); this.rt = setTimeout(() => this.relayout(), 180) }
    addEventListener('pointermove', this.onPointer); document.addEventListener('pointerleave', this.onLeave); addEventListener('pointerdown', this.onDown); addEventListener('pointerup', this.onUp); addEventListener('pointercancel', this.onUp); addEventListener('keydown', this.onKey); addEventListener('resize', this.onResize)
    this.makeCursor(); this.makeOverlays(); this.cat = null; this.gate = false; this.opened = false; this.catHover = 0; this.atm.update(1, 0, true); this.stars.setDensity(.12)
    const qs = new URLSearchParams(location.search), skipGate = qs.has('nogate') || qs.has('cat')   // ?nogate: straight to the title; ?cat / ?cat=lit: old debug views
    const go = () => { this.type.measure(); if (skipGate) { this.later(2500, () => this.ensureCat()); this.later(900, () => this.showTitle()) } else this.later(500, () => this.openGate()) }
    document.fonts?.ready ? document.fonts.ready.then(go) : go()
    this.raf = requestAnimationFrame(this.loop = now => { const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.tick(dt); this.raf = requestAnimationFrame(this.loop) })
  }
  // the 3D cat is loaded lazily (own chunk) a moment after the title, so the opening never waits for it. Any failure leaves the poem untouched.
  // the 3D cat loads in its own chunk (once). Resolves true when she is ready, false on any failure (the poem never depends on her).
  // ---- critters (birds, butterfly): lazy, one shared canvas; cues spawn them, scenes end them ----
  ensureCritters() { return this.critP ||= (async () => { try { const { Critters } = await import('./critters.js'), c = new Critters(this.stage.parentElement, this.stage.parentElement.querySelector('.vignette'), this.audio, this.reduced, (x, y) => this.stars.bloom(x, y)); this.critters = c; return c } catch (e) { console.warn('[critters]', e); return null } })() }
  preloadCritters(scene) { const k = CRITTER_SCENES; const kinds = new Set(); for (let s = scene; s <= scene + 3; s++) (k[s] || []).forEach(x => kinds.add(x)); if (kinds.size) this.later(2500, () => this.ensureCritters().then(c => kinds.forEach(x => c?.preload(x)))) }
  ensureCat() { return this.catP ||= (async () => { try { const { Cat } = await import('./cat.js'), cat = new Cat(this.stage.parentElement, this.stage.parentElement.querySelector('.vignette'), this.reduced); cat.audio = this.audio; cat.sfx().prefetch(); cat.onPetFx = (x, y, k) => { const r = Math.random; this.stars.drop(x + (r() - .5) * 26, y + (r() - .5) * 18, { vx: (r() - .5) * 46 * k, vy: -(26 + r() * 48) * k, g: -12 - r() * 14, life: 1.8 + r() * 1.3, size: 6 + r() * 6, col: r() < .55 ? 'gold' : r() < .5 ? 'orange' : 'white', a: .9, spin: (r() - .5) * 2.4 }) }; this.cat = cat
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
  openFromCat(x, y) { try { this.cat?.audio && this.cat.sfx().trill(.8, 1) } catch {}
    if (!this.gate || this.opened) return; this.opened = true; this.stars.hint(false); this.cur.press = 1
    if (x != null) this.stars.bloom(x, y)
    const dur = this.cat?.react() || 0   // she acknowledges you (Stretch); the title begins while she settles
    this.later(dur ? Math.min(OPENING.reactMs, dur * 1000 * .75) : 300, () => { this.gate = false; this.showTitle() })
  }
  later(ms, f) { const id = setTimeout(() => { this.timers = this.timers.filter(x => x !== id); f() }, ms); this.timers.push(id) }
  destroy() { this.pols?.forEach(e => e.remove()); this.metro?.dispose(); this.ev?.remove(); this.cat?.dispose(); cancelAnimationFrame(this.raf); this.timers.forEach(clearTimeout); removeEventListener('pointermove', this.onPointer); document.removeEventListener('pointerleave', this.onLeave); removeEventListener('pointerdown', this.onDown); this.critters?.dispose(); removeEventListener('pointerup', this.onUp); removeEventListener('pointercancel', this.onUp); removeEventListener('keydown', this.onKey); removeEventListener('resize', this.onResize) }
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
    const s = 1 + c.press * .7 + Math.max(this.catHover, this.critters?.hover ? 1 : 0) * .7 + .08 * Math.sin(this.t * 2.6), tw = .75 + .25 * Math.sin(this.t * 1.7)
    c.el.style.transform = `translate3d(${(c.x - 11).toFixed(1)}px,${(c.y - 11).toFixed(1)}px,0) rotate(${(this.t * 7 % 360).toFixed(1)}deg) scale(${s.toFixed(3)})`; c.el.style.opacity = (c.a * tw).toFixed(3); c.el.classList.toggle('hot', Math.max(this.catHover, this.critters?.hover ? 1 : 0) > .5) }
  clearOverlays() { this.ovSun.classList.remove('on'); this.ovEdge.classList.remove('on'); this.sunT = 140 }
  tickOverlays(dt) { if (this.ovSun.classList.contains('on')) { this.sunY += (this.sunT - this.sunY) * (1 - Math.exp(-dt / 2.6)); this.ovSun.style.setProperty('--y', this.sunY.toFixed(1) + '%') }
    if (this.ovEdge.classList.contains('on')) { const e = this.ovEdge.style; e.setProperty('--p', (50 + this.par.x * 7 + Math.sin(this.t * .09) * 3).toFixed(2) + '%'); e.setProperty('--a', (108 + Math.sin(this.t * .05) * 5 - this.par.y * 4).toFixed(2) + 'deg') } }
  // ---- camera + energy: everything on screen breathes with the writing ----
  makeSoundButton(host) { const b = document.createElement('button'); b.className = 'snd'; b.type = 'button'; b.setAttribute('aria-label', 'sonido'); this.sndBtn = b; host.appendChild(b); b.onclick = () => this.toggleSound(); this.paintSound() }
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
    this.metro.update(dt); this.cat?.update(dt, this.t); this.critters?.update(dt, this.t, this.type.mouse, this.ms)
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
    this.metro.arm()   // the clock starts with the title
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
      case 'critter': if (!quiet || c.always) this.ensureCritters().then(k => k?.spawn(c.kind, c)); break
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
      case 'polaroid': if (!quiet) this.polaroid(); break
      case 'edge': this.ovEdge.classList.add('on'); break
    }
  }
  // click / key: finish the line being typed, otherwise move to the next passage
  advance(auto) {
    if (this.busy || this.ended) return
    const a = this.type.active; if (a && a.typing) { this.type.finish(a); return }
    if (this.i + 1 >= this.steps.length) return
    this.stars.hint(false); this.hintTimer = 0
    const step = this.steps[++this.i], scn = SCENES[step.scene] || {}; this.metro.step(step, this.steps)
    if (step.kind !== 'add') { this.newScene(step, scn) } else this.show(step, scn)
  }
  newScene(step, scn) {
    this.polaroidsLeave(); this.polN = 0; this.critters?.leave(); this.preloadCritters(step.scene); if (step.scene >= 21) this.endVid()
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
    this.metro.shown(step)
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
  // the closing drawing (transparent webm): loaded quietly a few scenes before the end, plays once when "Ya terminé de pensar." is done and then rests on its last frame
  endVid() { if (this.ev) return this.ev; const v = this.ev = document.createElement('video'); v.className = 'endvid'; v.src = import.meta.env.BASE_URL + 'assets/end.webm'; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('aria-hidden', 'true'); this.stage.parentElement.insertBefore(v, this.stage); return v }
  // ---- polaroids: photos that slide in from outside the screen, one per "Todo", and slide away when the scene ends ----
  polaroid() {
    const L = [{ x: .80, y: .22, r: 7, from: [.5, -.9] }, { x: .87, y: .55, r: -6, from: [1, .1] }, { x: .67, y: .38, r: 2.5, from: [-.4, -1] }], n = this.polN = (this.polN || 0) + 1, o = L[n - 1]; if (!o) return
    const e = document.createElement('div'); e.className = 'pol'; e.setAttribute('aria-hidden', 'true'); const im = new Image(); im.src = import.meta.env.BASE_URL + 'assets/pol' + n + '.jpg'; im.alt = ''; e.appendChild(im)
    e.style.cssText = `left:${o.x * 100}%;top:${o.y * 100}%;--r:${o.r}deg;--fx:${o.from[0] * 120}vw;--fy:${o.from[1] * 120}vh;z-index:${n}`
    this.stage.parentElement.insertBefore(e, this.stage); (this.pols ||= []).push(e); const go = () => requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add('in'))); im.decode ? im.decode().then(go, go) : go()
  }
  polaroidsLeave() { const l = this.pols; if (!l?.length) return; this.pols = []; l.forEach((e, i) => { e.classList.add('out'); setTimeout(() => e.remove(), 1700 + i * 150) }) }
  finale() { this.later(2600, () => { const v = this.endVid(); v.play().catch(() => {}); requestAnimationFrame(() => v.classList.add('on')) }); this.later(1600, () => { this.type.calmT = 1; this.stars.hushT = 1; this.stars.setDensity(.12); this.atm.set('pitch', 7); this.energyT = 0; this.trembleT = 0
      this.camCfg = { ...this.camCfg, drift: [0, 0], tilt: 0, shake: 0, calm: true }; this.lastBlock?.cur.classList.add('end'); this.later(4000, () => { this.type.frozen = true }) }) }
  afterType() { this.metro.typed(this.steps[this.i]); if (SCENES[this.scene]?.echo && this.lastBlock && !this.reduced) this.addGhost(this.lastBlock)
    if (this.i + 1 >= this.steps.length) { this.ended = true; this.finale(); return }
    const lb = this.lastBlock; if (lb && lb.cpx != null) { const p = this.proj(lb, lb.cpx, lb.cpy); this.stars.flare(p.x, p.y) }
    this.hintTimer = CONFIG.hintDelayMs }
  relayout() { this.cat?.resize(); this.type.measure(); const done = []
    for (const b of this.sceneBlocks) { if (b.leaving) continue; const o = this.spec(b.step, b.scn, done.map(q => ({ x: q.x, y: q.y, z: q.z, w: q.w, h: q.h, tw: q.tw }))); this.type.place(b, o.x, o.y, o.w, o.size, o.lh, o.z, o.ry); b.tw = o.tw; done.push(b) }
    for (const r of this.rooms.values()) this.placeRoom(r)
    this.stars.resize() }
}
