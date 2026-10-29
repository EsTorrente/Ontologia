// Critters: the birds and the butterfly (3D models) on one transparent canvas under the text. They appear on cues (src/data/cues.js: fx 'critter'),
// live inside one scene, react to the pointer and fly away when the scene ends. Models load lazily, one at a time, only when a scene is near.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// size = longest side of the model as a fraction of the screen height; yaw/rx/rz = model correction so that it flies to the right, seen from the side
const KINDS = {
  hummer:    { file: 'hummer.glb',    size: .15,  fly: 'hover_skeletal.1', yaw: 1.5708, tilt: .5, tiltX: 0, rx: 0, rz: 0, hit: .62 },
  butterfly: { file: 'butterfly.glb', size: .12,  fly: 'hover', perch: 'idle', yaw: 1.5708, rx: -1.5708, rxFly: -1.0, tilt: .45, rz: 0, hit: .7 },
  canary:    { file: 'canary.glb',    size: 1.1,  fly: 'AnimationStack', yaw: 0, rx: 0, rz: 0, hit: .2, hang: true },   // a wooden mobile: hangs from the top edge and sways
  sparrows:  { file: 'sparrows.glb',  size: .4,   fly: 'Scene', yaw: -1.5708, rx: 0, rz: 0, hit: .5, lift: 0x8c8276 },   // black birds: a warm emissive lift so they read on the dark
}
const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.floor(Math.random() * a.length)]
export { KINDS }
export class Critters {
  constructor(host, before, audio, reduced, onChirp) {
    this.audio = audio; this.reduced = reduced; this.onChirp = onChirp; this.list = []; this.cache = {}; this.hover = false; this.fr = 0
    const c = this.canvas = document.createElement('canvas'); c.className = 'critcv'; c.setAttribute('aria-hidden', 'true'); host.insertBefore(c, before)
    this.r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, powerPreference: 'low-power' }); this.r.setClearColor(0, 0)
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(0, 1, 1, 0, -4000, 4000); this.cam.position.z = 1500
    this.amb = new THREE.AmbientLight(0xfff1dc, 1.35); this.key = new THREE.DirectionalLight(0xffe2b0, 1.5); this.key.position.set(-.5, .8, 1); this.rim = new THREE.DirectionalLight(0x9cb0c8, .9); this.rim.position.set(.8, .3, -1)
    this.scene.add(this.amb, this.key, this.rim); this.resize()
  }
  resize() { const d = Math.min(devicePixelRatio || 1, 1.5); this.r.setPixelRatio(d); this.r.setSize(innerWidth, innerHeight, false); Object.assign(this.cam, { left: 0, right: innerWidth, top: innerHeight, bottom: 0 }); this.cam.updateProjectionMatrix() }
  load(kind) {
    return this.cache[kind] ||= new GLTFLoader().loadAsync(import.meta.env.BASE_URL + 'assets/' + KINDS[kind].file).then(g => {
      g.scene.traverse(o => { if (o.isMesh) { o.frustumCulled = false; for (const m of [].concat(o.material)) { m.side = THREE.DoubleSide; if (KINDS[kind].lift && m.emissive) { m.emissive.setHex(KINDS[kind].lift); m.emissiveIntensity = 1; m.emissiveMap = m.map || null } } } })
      const box = new THREE.Box3().setFromObject(g.scene, true), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
      return { g, max: Math.max(size.x, size.y, size.z), center, top: box.max.y } }).catch(e => { console.warn('[critters] could not load', kind, e); return null })
  }
  preload(kind) { if (KINDS[kind]) this.load(kind) }
  // opts: { x, y (start, screen fractions), side: -1 | 1 (enter from the left / right), at: [x, y] home }
  async spawn(kind, o = {}) {
    const K = KINDS[kind]; if (!K || this.dead) return; if (o.one !== false && this.list.some(c => c.kind === kind && !c.leaving)) return
    const base = await this.load(kind); if (!base || this.dead) return
    const m = clone(base.g.scene), holder = new THREE.Group(), pivot = new THREE.Group(); m.position.copy(base.center).multiplyScalar(-1); if (K.hang) m.position.y = -base.top; holder.add(m); pivot.add(holder); this.scene.add(pivot)
    const px = K.size * innerHeight * (o.scale || 1), mixer = new THREE.AnimationMixer(m), acts = {}
    for (const clip of base.g.animations) acts[clip.name] = mixer.clipAction(clip)
    const side = o.side || (Math.random() < .5 ? -1 : 1), W = innerWidth, H = innerHeight
    const c = { kind, K, pivot, holder, mixer, acts, px, scale: px / base.max, x: side < 0 ? -px : W + px, y: (o.y ?? rnd(.2, .5)) * H, vx: 0, vy: 0, heading: side < 0 ? 0 : Math.PI, hT: side < 0 ? 0 : Math.PI, t: 0, state: 'in', home: o.home ? [o.home[0] * W, o.home[1] * H] : null,
      leaving: false, op: 0, bank: 0, pitch: 0, next: 0, cur: null, seed: Math.random() * 100, flee: 0 }
    holder.scale.setScalar(c.scale); pivot.visible = false; this.play(c, K.fly, 1); this.list.push(c); this.pickHome(c, true); return c
  }
  play(c, name, ts = 1) { const a = c.acts[name] || Object.values(c.acts)[0]; if (!a) return; if (c.cur !== a) { a.reset().fadeIn(.4).play(); c.cur?.fadeOut(.4); c.cur = a } a.timeScale = ts }
  // ----- where it likes to be -----
  spot(c, avoid) { const W = innerWidth, H = innerHeight; let best = null
    for (let i = 0; i < 14; i++) { const p = [rnd(.07, .93) * W, rnd(.14, .86) * H], d = avoid ? Math.hypot(p[0] - avoid.x, p[1] - avoid.y) : Math.hypot(p[0] - c.x, p[1] - c.y) + rnd(0, 200); if (!best || d > best.d) best = { p, d } }
    return best.p }
  pickHome(c, first) { const W = innerWidth, H = innerHeight, m = this.mouse
    if (c.kind === 'butterfly') c.home = first && c.home ? c.home : this.spot(c, m?.on ? m : null)
    else if (c.kind === 'canary') c.home = c.home || [pick([.14, .86, .78]) * W, 0]
    else if (c.kind === 'sparrows') c.home = first && c.home ? c.home : [rnd(.55, .85) * W, rnd(.18, .34) * H]
    else c.home = c.home || [.2 * W, .28 * H] }
  hit(x, y) { for (const c of this.list) { if (c.leaving || c.op < .5) continue; const cy = c.K.hang ? c.px * .38 : c.y; if (Math.hypot(x - c.x, y - cy) < c.px * c.K.hit * (c.K.hang ? 1 : .55)) return c } return null }
  click(x, y) { const c = this.hit(x, y); if (!c) return false; this.react(c, x, y); return true }
  react(c, x, y) {
    if (c.kind === 'butterfly') { this.flee(c); return }
    this.chirp(c.kind, c.x, c.y)
    if (c.kind === 'hummer') { c.state = 'dash'; c.dashT = 0; c.dashTo = this.spot(c, { x: c.x, y: c.y }) }
    else if (c.kind === 'canary') c.sway = .09
    else if (c.kind === 'sparrows') { c.state = 'scatter'; c.leaving = true; c.t0 = c.t; c.out = [c.x < innerWidth / 2 ? -1 : 1, -.6] }
  }
  flee(c) { c.state = 'fly'; c.fleeT = c.t; const m = this.mouse; c.home = this.spot(c, m?.on ? m : { x: c.x, y: c.y }); c.next = c.t + rnd(9, 16) }
  leave() { for (const c of this.list) if (!c.leaving) { c.leaving = true; c.t0 = c.t; c.out = [c.x < innerWidth / 2 ? -1 : 1, -.5] } }
  // ----- sound: small synthesised calls (no files) -----
  chirp(kind, x, y) {
    const a = this.audio, ctx = a?.ctx; this.onChirp && this.onChirp(x, y); if (!ctx || !a.on || ctx.state !== 'running') return
    const now = ctx.currentTime, out = ctx.createGain(); out.gain.value = .5; out.connect(ctx.destination)
    const tone = (t, f0, f1, dur, g, vib = 0) => { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur)
      if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 26; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .02) }
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + dur * .2); e.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(e); e.connect(out); o.start(t); o.stop(t + dur + .03) }
    if (kind === 'canary') { let t = now; for (let i = 0; i < 9; i++) { const f = rnd(2300, 4200); tone(t, f, f * (Math.random() < .5 ? 1.35 : .72), rnd(.07, .13), .1, 90); t += rnd(.09, .15) } }
    else if (kind === 'sparrows') { let t = now; for (let i = 0; i < 4; i++) { const f = rnd(3300, 4300); tone(t, f, f * 1.18, .05, .09); tone(t + .06, f * 1.12, f * .96, .05, .07); t += rnd(.16, .24) } }
    else tone(now, 5200, 7000, .07, .08, 60), tone(now + .11, 6600, 5000, .08, .07, 60)
  }
  // ----- per-frame -----
  update(dt, t, mouse, ms = 0) {
    this.mouse = mouse; if (!this.list.length && !this.on) return
    const W = innerWidth, H = innerHeight; this.on = this.list.length > 0
    for (const c of this.list) this.step(c, dt, mouse, ms, W, H)
    this.list = this.list.filter(c => { if (c.dead) { this.scene.remove(c.pivot); return false } return true })
    if ((this.fr = (this.fr + 1) % 3) === 0) this.hover = !!mouse?.on && !!this.hit(mouse.x, mouse.y)
    if (!this.list.length) { this.r.clear(); this.on = false; return }
    this.r.render(this.scene, this.cam)
  }
  spring(c, tx, ty, tau, dt) { const w = 2.2 / Math.max(.05, tau); c.vx += (w * w * (tx - c.x) - 2 * w * c.vx) * dt; c.vy += (w * w * (ty - c.y) - 2 * w * c.vy) * dt; c.x += c.vx * dt; c.y += c.vy * dt }
  step(c, dt, m, ms, W, H) {
    c.t += dt; const red = this.reduced, K = c.K; c.mixer.update(dt)
    c.op += ((c.leaving ? 0 : 1) - c.op) * (1 - Math.exp(-dt / (c.leaving ? 1.2 : .5)))
    let tx = c.x, ty = c.y, tau = .9, ts = 1, face = null
    const near = m?.on ? Math.hypot(m.x - c.x, m.y - c.y) : 1e9
    if (K.hang) { c.sway = (c.sway || 0) * Math.exp(-dt / 2.2); const sw = Math.sin(c.t * 1.1 + c.seed) * .035 + c.sway * Math.sin(c.t * 5.5); const u = clamp(c.t / 4.5, 0, 1); c.x = c.home[0]; c.y = -4 - Math.pow(1 - u, 3) * c.px * .5   // it lowers itself into the scene from above while fading in
      c.holder.rotation.set(0, Math.sin(c.t * .55 + c.seed) * .6 + c.sway * 2.5 * Math.sin(c.t * 3.2), 0); c.pivot.rotation.z = sw; c.pivot.position.set(c.x, H - c.y, 0)
      c.op += ((c.leaving ? 0 : 1) - c.op) * (1 - Math.exp(-dt / (c.leaving ? .8 : 1.8))); if (c.leaving && c.t - c.t0 > 3) c.dead = true; this.opac(c); return }
    if (c.leaving) { const e = c.out || [1, -.5]; tx = c.x + e[0] * 900; ty = c.y + e[1] * 500; tau = c.kind === 'sparrows' ? .5 : 1.1; ts = 1.6; if (c.t - c.t0 > 3.2 || c.x < -c.px * 2 || c.x > W + c.px * 2) c.dead = true }
    else if (c.kind === 'hummer') {
      if (c.state === 'dash') { c.dashT += dt; tx = c.dashTo[0]; ty = c.dashTo[1]; tau = .22; ts = 2; if (c.dashT > 1) c.state = 'hover' }
      else { const mv = m?.on && (ms > 30 || near < 260); let hx, hy
        if (mv) { const sd = m.x < W / 2 ? 1 : -1; hx = m.x + sd * c.px * 1.0; hy = m.y - c.px * .8; face = m.x > c.x ? 0 : Math.PI } else { hx = c.home[0] + Math.sin(c.t * .45) * 60; hy = c.home[1] + Math.cos(c.t * .6) * 30 }
        tx = hx + Math.sin(c.t * 5 + c.seed) * 5; ty = hy + Math.cos(c.t * 4.3 + c.seed) * 8; tau = c.state === 'in' ? 1.2 : .65; if (c.state === 'in' && Math.hypot(tx - c.x, ty - c.y) < 60) c.state = 'hover' }
    }
    else if (c.kind === 'butterfly') {
      const perched = c.state === 'perch'
      if (perched && near < 150 + clamp(ms * .1, 0, 120)) this.flee(c)
      else if (perched && c.t > c.next) this.flee(c)
      if (c.state === 'in') { tx = c.home[0]; ty = c.home[1]; tau = 1.6; if (Math.hypot(tx - c.x, ty - c.y) < 40) { c.state = 'perch'; c.next = c.t + rnd(9, 15) } }
      else if (c.state === 'fly') { tx = c.home[0] + Math.sin(c.t * 2.1 + c.seed) * 16; ty = c.home[1] + Math.sin(c.t * 3.3 + c.seed) * 12; tau = 1.1; if (Math.hypot(c.home[0] - c.x, c.home[1] - c.y) < 36 && c.t - c.fleeT > .8) { c.state = 'perch'; c.next = c.t + rnd(9, 15) } }
      else { tx = c.home[0]; ty = c.home[1] + Math.sin(c.t * 1.2 + c.seed) * 1.5; tau = .5 }
      ts = c.state === 'perch' ? 1 : 1.3
      if (c.state === 'perch') this.play(c, K.perch, 1); else this.play(c, K.fly, ts)
    }
    else if (c.kind === 'canary') {
      const flying = c.state === 'in' || c.state === 'fly'
      if (c.state === 'in') { tx = c.home[0]; ty = c.home[1]; tau = 1.8; if (Math.hypot(tx - c.x, ty - c.y) < 50) { c.state = 'perch'; c.next = c.t + rnd(8, 13) } }
      else if (c.state === 'perch') { tx = c.home[0]; ty = c.home[1] + Math.sin(c.t * 1.6 + c.seed) * 4 - (c.hop ? 22 * Math.sin(clamp((c.t - c.next + .3) * 6, 0, 3.14)) : 0); tau = .5; if (c.t > c.next) { c.hop = 0; c.state = 'fly'; this.pickHome(c) } }
      else { tx = c.home[0]; ty = c.home[1]; tau = 1.3; if (Math.hypot(tx - c.x, ty - c.y) < 50) { c.state = 'perch'; c.next = c.t + rnd(8, 13) } }
      ts = flying ? 1.7 : .55
    }
    else if (c.kind === 'sparrows') {
      // a fly-by: crosses the whole screen once, gently rising and falling, then is gone (never hangs in the air)
      c.dir ??= c.heading === 0 ? 1 : -1; c.y0 ??= c.y; tx = c.dir > 0 ? W + c.px * 3 : -c.px * 3; ty = c.y0 + Math.sin(c.t * .9 + c.seed) * 30 - c.t * 6; tau = 2.6; ts = 1.3
      if (c.dir > 0 ? c.x > W + c.px * .8 : c.x < -c.px * .8) c.dead = true
    }
    if (red) { c.x = tx; c.y = ty; c.vx = c.vy = 0 } else this.spring(c, tx, ty, tau, dt)
    if (c.kind !== 'butterfly' || c.state !== 'perch') this.play(c, K.fly, ts)
    const rxT = (K.rxFly != null && !(c.kind === 'butterfly' && c.state === 'perch')) ? K.rxFly : K.rx; c.rxc = c.rxc == null ? rxT : c.rxc + (rxT - c.rxc) * (1 - Math.exp(-dt / .5))
    // heading: fly to the right (0) or to the left (pi); a little banking and pitch
    c.hT = face != null ? face : Math.abs(c.vx) > 14 ? (c.vx > 0 ? 0 : Math.PI) : c.hT
    c.heading += ((c.hT - c.heading)) * (1 - Math.exp(-dt / .22)); c.bank += (clamp(Math.abs(c.vx) * .0004, 0, .25) - c.bank) * (1 - Math.exp(-dt / .3))
    // nose follows the direction of travel: climbing = nose up, diving = nose down (the turn through the camera comes from the heading easing)
    const perched = c.kind === 'butterfly' && c.state === 'perch', pT = perched ? 0 : clamp(Math.atan2(-c.vy, Math.abs(c.vx) + 70) * 1.05, -.85, .85); c.pitchA = (c.pitchA || 0) + (pT - (c.pitchA || 0)) * (1 - Math.exp(-dt / .35))
    const sgn = Math.cos(c.heading) >= 0 ? 1 : -1
    c.holder.rotation.set(c.rxc + (K.tiltX || 0), K.yaw + c.heading + (K.tilt || 0) * sgn, K.rz + c.bank * sgn, 'YXZ')
    c.pivot.position.set(c.x, H - c.y, 0); c.pivot.rotation.z = c.pitchA * sgn; this.opac(c)
  }
  opac(c) { c.pivot.visible = c.op > .02; c.holder.traverse(o => { if (o.isMesh) for (const mm of [].concat(o.material)) { mm.transparent = c.op < .98 || mm.transparent; mm.opacity = c.op } }) }
  dispose() { this.dead = true; this.r.dispose(); this.canvas.remove() }
}
