import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CONFIG } from '../config.js'
import { attention } from './attention.js'
// The cat: a real 3D model on its own transparent canvas (between the stars and the text; it never covers the poem).
// Milestone 6a: loading, framing, SitIdle, and the dark-room behaviour (in total darkness; a click makes her eyes glow).
const C = () => CONFIG.cat
// Model analysis (pure: no renderer needed). Finds the parts by mesh name and the two eyes' vertices for the glow.
export function analyze(gltf) {
  const root = gltf.scene, parts = {}, skinned = []
  // the model may be exported with extra armatures (control rig, metarig) and hundreds of bone-widget empties next to the deform rig. Only subtrees that hold a mesh are kept,
  // so bone names and animation tracks resolve to exactly one skeleton.
  for (const c of [...root.children]) { let has = false; c.traverse(o => { if (o.isMesh) has = true }); if (!has) root.remove(c) }
  const names = new Set(); root.traverse(o => names.add(o.name))
  const bound = c => c.tracks.reduce((n, t) => n + (names.has(t.name.slice(0, t.name.lastIndexOf('.'))) ? 1 : 0), 0)   // how many of the clip's tracks find a bone in THIS skeleton
  root.traverse(o => { if (o.isMesh) { parts[o.name] = o; if (o.isSkinnedMesh) skinned.push(o) } })
  const eyes = parts.Eyes, pos = eyes?.geometry.attributes.position, sides = [[], []]
  if (pos) for (let i = 0; i < pos.count; i++) sides[pos.getX(i) > 0 ? 0 : 1].push(i)
  const clusters = sides.map(ids => { if (!ids.length) return []; let cx = 0, cy = 0, cz = 0; for (const i of ids) { cx += pos.getX(i); cy += pos.getY(i); cz += pos.getZ(i) } cx /= ids.length; cy /= ids.length; cz /= ids.length
    return ids.map(i => [i, (pos.getX(i) - cx) ** 2 + (pos.getY(i) - cy) ** 2 + (pos.getZ(i) - cz) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, 10).map(a => a[0]) })
  // the file holds each clip twice ("SitIdle" is an empty 2-key action, "SitIdle.001" has the motion): keep the variant that moves
  const motion = c => c.tracks.reduce((n, t) => { const k = t.getValueSize(); let d = 0; for (let j = 0; j < k; j++) { let lo = 1e9, hi = -1e9; for (let i = 0; i < t.times.length; i++) { const x = t.values[i * k + j]; lo = Math.min(lo, x); hi = Math.max(hi, x) } d = Math.max(d, hi - lo) } return n + (d > 1e-4 ? 1 : 0) }, 0)
  const clips = {}; for (const a of gltf.animations) { const base = a.name.replace(/\.\d+$/, ''); const sc = c => bound(c) * 1e4 + motion(c); if (!clips[base] || sc(a) > sc(clips[base])) clips[base] = a }
  return { root, parts, skinned, eyeIdx: clusters, clips }
}
// ---- looking: rotate the neck chain + head (+ eyes) in WORLD space about each bone's own origin, so no bone-axis knowledge is needed ----
const _pq = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _t = new THREE.Quaternion(), _id = new THREE.Quaternion(), _r = new THREE.Quaternion()
export function findBones(root) { const g = n => root.getObjectByName(n) || root.getObjectByName(n.replace(/\./g, '')); return { chain: [['DEF-spine.004', .15], ['DEF-spine.005', .25], ['DEF-spine.006', .6]].map(([n, w]) => ({ bone: g(n), w })).filter(a => a.bone), eyes: ['DEF-eye.L', 'DEF-eye.R'].map(g).filter(Boolean), ears: ['DEF-ear1.L', 'DEF-ear1.R'].map(g).filter(Boolean) } }
export function aimBones(b, q, eyeQ = q, eyeW = .5) {   // q / eyeQ: world-space delta rotations, applied ON TOP of whatever pose the animation produced this frame
  const turn = (bone, w, qq) => { if (w <= 0) return; _t.copy(_id).slerp(qq, w); bone.parent.updateWorldMatrix(true, false); bone.parent.getWorldQuaternion(_pq); _pi.copy(_pq).invert(); _t.premultiply(_pi).multiply(_pq); bone.quaternion.premultiply(_t); bone.updateMatrixWorld(true) }
  for (const { bone, w } of b.chain) turn(bone, w, q)
  for (const e of b.eyes) turn(e, eyeW, eyeQ)
}
// critically damped spring (no overshoot, continuous velocity, speed-limited): a target that jumps never makes the value snap
export function smoothDamp(s, target, tau, dt, maxSpeed = Infinity) {
  const w = 2 / Math.max(tau, 1e-3), x = w * dt, e = 1 / (1 + x + .48 * x * x + .235 * x * x * x), lim = maxSpeed * tau
  const ch = Math.max(-lim, Math.min(lim, s.x - target)), tg = s.x - ch, tmp = (s.v + w * ch) * dt
  s.v = (s.v - w * tmp) * e; s.x = tg + (ch + tmp) * e; return s.x
}
const ease = e => e * e * (3 - 2 * e)
const _qy = new THREE.Quaternion(), _qx = new THREE.Quaternion(), _ax = new THREE.Vector3(1, 0, 0), _ay = new THREE.Vector3(0, 1, 0)
const lookQ = (out, yaw, pitch) => out.copy(_qy.setFromAxisAngle(_ay, yaw)).multiply(_qx.setFromAxisAngle(_ax, -pitch))
const _f0 = new THREE.Vector3(), _hp = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _idq = new THREE.Quaternion()
const halo = () => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,236,170,.95)'); g.addColorStop(.12, 'rgba(255,205,90,.55)'); g.addColorStop(.4, 'rgba(255,170,40,.14)'); g.addColorStop(1, 'rgba(255,150,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c) }

import { CatSound } from './catsound.js'
export class Cat {
  constructor(host, before, reduced = false) {
    this.reduced = reduced; this.mx = innerWidth / 2; this.my = innerHeight / 2; this.lastMove = -99; this.tNow = 0; this.watchW = 0; this.env = 0; this.sy = { x: 0, v: 0 }; this.sp = { x: 0, v: 0 }; this.ey = { x: 0, v: 0 }; this.ep = { x: 0, v: 0 }; this.headRest = new THREE.Vector3(); this.base = null
    this.pet = { on: false, in: false, x: 0, y: 0, acc: 0, v: 0, until: 0, time: 0 }; this.petEnv = 0; this.petW = 0; this.lean = 0; this.hand = 0; this.callT = 0; this.nextCall = 0
    this.host = host; this.a = 0; this.aT = 0; this.eyeG = 0; this.eyeT = 0; this.poked = false; this.cfg = null; this.ready = false; this.rect = null
    this.el = document.createElement('canvas'); this.el.className = 'cat3d'; this.el.setAttribute('aria-hidden', 'true'); host.insertBefore(this.el, before || null)
    this.audio = null; this.snd = null; this.litT = 1; this.uLit = { value: 1 }   // audio: set by the Director (shared context); uLit: 0 in the dark room, 1 when she is lit
    this.uGlow = { value: 0 }; this.uGold = { value: new THREE.Color(C().eye) }
  }
  async load() {
    try {
      this.r = new THREE.WebGLRenderer({ canvas: this.el, alpha: true, antialias: true, powerPreference: 'low-power' }); this.r.setClearColor(0, 0)
      this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -3000, 3000); this.cam.position.z = 1000
      this.amb = new THREE.AmbientLight(0xffffff, 0); this.rim = new THREE.DirectionalLight(C().rimColor, 0); this.rim.position.set(-.7, .9, -1); this.key = new THREE.DirectionalLight(0xffe2b0, 0); this.key.position.set(-.55, .85, 1)
      this.hemi = new THREE.HemisphereLight(0xbcd0ff, 0x8a4a2a, 0); this.fill = new THREE.DirectionalLight(0x8fb0ff, 0); this.fill.position.set(1, -.2, .6)   // sky/ground fill: gives the fur form; cool fill from the opposite side of the warm key
      this.scene.add(this.amb, this.rim, this.key, this.hemi, this.fill)
      const gltf = await new GLTFLoader().loadAsync(import.meta.env.BASE_URL + C().url), m = analyze(gltf); this.m = m
      this.pivot = new THREE.Group(); this.pivot.add(m.root); this.scene.add(this.pivot)
      // materials: body keeps its texture (lit only by whatever light exists); eyes are unlit and glow on demand
      const eyeSrc = m.parts.Eyes?.material, hi = m.parts.Highlights
      this.bodyMats = []
      for (const o of Object.values(m.parts)) { if (o.name === 'Eyes' || o.name === 'Highlights') continue; o.material.transparent = true; o.material.alphaTest = .02; o.material.depthWrite = true;   // keep the model's own alpha blending (soft edges, vertex alpha); alphaTest only drops fully empty pixels so depth stays clean
 this.bodyMats.push(o.material); o.frustumCulled = false }
      if (eyeSrc) { const g = new THREE.MeshBasicMaterial({ map: eyeSrc.map, transparent: true, vertexColors: true, side: THREE.DoubleSide, depthWrite: false }); g.onBeforeCompile = sh => { sh.uniforms.uGlow = this.uGlow; sh.uniforms.uGold = this.uGold; sh.uniforms.uLit = this.uLit
        sh.fragmentShader = 'uniform float uGlow; uniform vec3 uGold; uniform float uLit;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float lum = dot(diffuseColor.rgb, vec3(.299,.587,.114)); diffuseColor.rgb = mix(diffuseColor.rgb * uLit, uGold * (.3 + 1.2 * lum) * 1.0, uGlow);') }   // natural texture (and alpha) when lit, black in the dark, gold glow on demand
        m.parts.Eyes.material = g; m.parts.Eyes.renderOrder = 2; m.parts.Eyes.frustumCulled = false }
      if (hi) { hi.visible = false; hi.frustumCulled = false; hi.renderOrder = 3 }
      this.halos = [0, 1].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, opacity: 0 })); s.renderOrder = 10; this.scene.add(s); return s })
      this.bones = findBones(m.root); this.mixer = new THREE.AnimationMixer(m.root); this.play('SitIdle'); this.mixer.update(0); m.root.updateMatrixWorld(true)
      this.ready = true; this.resize(); if (this.pending) this.enter(this.pending); return true
    } catch (e) { console.warn('[cat] could not load', e); this.ready = false; return false }
  }
  play(name, fade = .4) {
    const clip = this.m?.clips[name]; if (!clip) return; const next = this.mixer.clipAction(clip); if (this.cur === next) return
    next.setLoop(name === 'Flopped' ? THREE.LoopPingPong : THREE.LoopRepeat, Infinity); next.reset().fadeIn(fade).play(); this.cur?.fadeOut(fade); this.cur = next
  }
  // ---- placement: the cat is framed in pixels (orthographic), feet at cfg.y, centred at cfg.x, height cfg.h of the screen ----
  resize() {
    const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 2); if (!this.r) return
    this.r.setPixelRatio(d); this.r.setSize(W, H, false); Object.assign(this.cam, { left: -W / 2, right: W / 2, top: H / 2, bottom: -H / 2 }); this.cam.updateProjectionMatrix()
    if (this.cfg && this.ready) this.frame()
  }
  // bounding box of a clip's pose, unioned over a few moments of the clip (so she never moves out of frame)
  poseBox(name, ts = null) {
    const clip = this.m.clips[name], b = new THREE.Box3(), tmp = new THREE.Box3(); if (!clip) return b.setFromObject(this.m.root, true)
    const mx = new THREE.AnimationMixer(this.m.root), a = mx.clipAction(clip); a.play()
    for (const t of ts || [0, 1, 2, 3, 4, 5].map(i => clip.duration * i / 6)) { mx.setTime(t); this.pivot.updateMatrixWorld(true); b.union(tmp.setFromObject(this.m.root, true)) }
    mx.stopAllAction(); mx.uncacheRoot(this.m.root); this.cur = null; this.play(name, 0); this.mixer.update(0); this.pivot.updateMatrixWorld(true); return b
  }
  frame() {
    const { m, cfg } = this, W = innerWidth, H = innerHeight; this.unaim()   // measure the pose without any look offset
    this.pivot.scale.setScalar(1); this.pivot.position.set(0, 0, 0); this.pivot.rotation.set(cfg.pitch ?? 0, cfg.yaw ?? C().yaw, 0)   // pitch > 0 = seen from above; this.pivot.updateMatrixWorld(true)
    const b = this.poseBox(cfg.pose || 'SitIdle'), size = b.getSize(new THREE.Vector3()), ctr = b.getCenter(new THREE.Vector3())
    let s = (cfg.h * H) / Math.max(size.y, 1e-4)
    // hide:'left' = her hidden pose (frame 0 of the clip) sits just past the left edge of the screen; only what slides in is ever visible (PeekHide)
    const hb = cfg.hide ? this.poseBox(cfg.pose, [0]) : null, shown = hb ? Math.max(b.max.x - hb.max.x, 1e-3) : Math.max(size.x, size.z)
    if (cfg.maxW) s = Math.min(s, cfg.maxW * W / shown)   // never wider than a fraction of the screen (portrait phones)
    this.scale = s
    this.pivot.scale.setScalar(s); this.pivot.position.set(hb ? -W / 2 - hb.max.x * s - 6 : (cfg.x - .5) * W - ctr.x * s, (.5 - cfg.y) * H - b.min.y * s, 0); this.pivot.updateMatrixWorld(true)
    const w = shown * s, h = size.y * s; this.rect = { cx: hb ? w / 2 : cfg.x * W, cy: cfg.y * H - h / 2, w, h }
    if (cfg.hold) { this.hold(cfg.pose); this.mixer.update(0); this.pivot.updateMatrixWorld(true) }   // measuring restarts the clip; put a frozen pose back
    this.base = null; this.bones.chain.length && this.bones.chain[this.bones.chain.length - 1].bone.getWorldPosition(this.headRest)   // where the head sits at rest: the look target is measured from here, never from the animated pose
  }
  // ---- states ----
  enter(cfg) {
    this.cfg = { ...C().defaults, ...cfg }; if (!this.ready) { this.pending = cfg; return }
    this.pending = null; this.clearTimers(); this.mixer.stopAllAction(); this.cur = null; this.a = 0; this.aT = 0; this.env = 0; this.att = null; this.reactUntil = 0; this.poked = false; Object.assign(this.pet, { on: false, in: false, acc: 0, v: 0, until: 0, time: 0 }); this.petEnv = this.petW = this.lean = 0; this.callT = 0; this.nextCall = 0; this.eyeT = 0; this.eyeG = 0; this.uGlow.value = 0; this.frame()   // a fresh scene always starts invisible
    this.cfg.hold ? this.hold(this.cfg.pose) : this.play(this.cfg.pose || 'SitIdle', 0)
    const dark = !!this.cfg.dark; const A = this.cfg.amb ?? .9, Kk = this.cfg.key ?? 1.1; // classic three-point setup (lit scenes): KEY warm, high, front-left | FILL cool, soft, front-right (about 1:3 of the key) | BACK light high behind on the key's opposite side, for the edge. Dark room: only the faint blue rim, as before.
    this.amb.intensity = dark ? 0 : A * .12; this.hemi.intensity = dark ? 0 : A * .45; this.key.intensity = dark ? 0 : Kk * 2.1; this.fill.intensity = dark ? 0 : Kk * .8; this.rimI = dark ? C().rim : 1.5
    this.key.position.set(-.65, .75, 1); this.fill.position.set(.85, .05, .9); this.rim.position.set(...(dark ? [-.7, .9, -1] : [.6, .95, -1])); if (this.m.parts.Highlights) this.m.parts.Highlights.visible = !dark
    this.litT = dark ? 0 : 1; this.eyeT = dark ? 0 : (C().litEyes ?? 0)   // lit: her natural eyes (litEyes: 1 = glowing gold); dark: black until clicked
    this.later(this.cfg.delay ?? 1800, () => { this.aT = 1 })
    for (const ms of this.cfg.peeks || []) this.later(ms, () => this.peek(this.reduced ? .6 : 1))      // PeekHide at these moments (ms after the scene begins)
    if (this.cfg.stretchAt) this.later(this.cfg.stretchAt, () => this.react('Stretch'))                // a single quiet Stretch
  }
  later(ms, f) { (this.tms ||= []).push(setTimeout(f, ms)) }
  clearTimers() { (this.tms || []).forEach(clearTimeout); this.tms = []; clearTimeout(this.tm) }
  // a clip frozen on one pose (e.g. PeekHide's first frame = hidden behind the screen edge)
  hold(name, t = 0) {
    const clip = this.m?.clips[name]; if (!clip) return this.play('SitIdle', 0); const a = this.mixer.clipAction(clip)
    this.cur?.stop(); a.reset(); a.setEffectiveWeight(1); a.time = t; a.paused = true; a.play(); this.cur = a
  }
  // one peek: slides in from the edge and retreats, then stays on the last frame (identical to the hidden pose). Returns its length in seconds.
  peek(speed = 1) {
    const clip = this.m?.clips.PeekHide; if (!this.ready || !clip || this.tNow < (this.reactUntil || 0)) return 0
    const a = this.mixer.clipAction(clip); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = speed
    this.cur?.stop(); a.reset(); a.setEffectiveWeight(1); a.play(); this.cur = a; this.reactUntil = this.tNow + clip.duration / speed + .3; return clip.duration / speed
  }
  aim(x, y) { this.mx = x; this.my = y; this.lastMove = this.tNow }   // the star cursor moved
  // THE MIXER ONLY WRITES A BONE WHEN ITS ANIMATED VALUE CHANGED since the last frame. Held poses (the eyes, parts of the neck) are left alone, so an offset
  // applied last frame would be applied AGAIN on top of itself and pile up. So every frame: restore the pure animated pose, let the mixer run, remember that pose, add the offset.
  look_bones() { return this._lb ||= [...this.bones.chain.map(c => c.bone), ...this.bones.eyes] }
  unaim() { if (!this.base) return; this.look_bones().forEach((b, i) => b.quaternion.copy(this.base[i])) }
  capture() { const L = this.look_bones(); this.base ||= L.map(() => new THREE.Quaternion()); L.forEach((b, i) => this.base[i].copy(b.quaternion)) }
  // WATCHING: a look OFFSET layered on top of the animation (SitIdle keeps its own head / eye / ear motion untouched).
  // The offset is a pair of angles measured from the cat's resting head toward the cursor, so it never depends on the animated pose.
  // Springs (head slower, eyes quicker and leading), a soft clamp and an eased fade in/out keep it from ever snapping.
  watch(dt) {
    const L = C().look, W = innerWidth, H = innerHeight, rd = this.reduced, P = this.pet
    const moved = this.tNow - this.lastMove < L.interest, att = attention(this.att ||= { on: 0, until: 0 }, this.tNow, moved, L)
    const want = this.cfg?.look !== false && (this.poked || this.cfg?.dark === false) && att.on && this.tNow > (this.reactUntil || 0) ? 1 : 0
    const fade = want ? (L.fadeIn ?? 1) : (this.tNow < (this.reactUntil || 0) ? .5 : (L.fadeOut ?? 1.5))   // a deliberate reaction (Stretch) takes over a little faster
    this.env += Math.sign(want - this.env) * Math.min(Math.abs(want - this.env), dt / (rd ? fade * 1.6 : fade)); this.watchW = ease(this.env)
    if (!this.bones.chain.length) return
    const f0 = _f0.set(0, 0, 1).applyQuaternion(this.pivot.quaternion), fy = Math.atan2(f0.x, f0.z), fp = Math.asin(Math.max(-1, Math.min(1, f0.y)))
    const dx = this.mx - (W / 2 + this.headRest.x), dy = (H / 2 - this.headRest.y) - this.my, dz = H * .8
    const mxA = (this.cfg?.lookMax ?? L.max) * (rd ? .4 : 1) * Math.PI / 180, soft = (a, m) => m * Math.tanh(a / m)   // smooth limit: approaches the max, never a hard stop
    let ty = soft(Math.atan2(dx, dz) - fy, mxA), tp = soft(Math.atan2(dy, Math.hypot(dx, dz)) - fp, mxA * .6)
    // PETTING: instead of looking at the cursor she pushes her head into the hand: turned toward the side the hand is on, slightly lowered, with a gentle nod that follows the stroking speed
    const pw = this.petW, hand = Math.max(-1, Math.min(1, ((P.on ? P.x : this.mx) - (W / 2 + this.headRest.x)) / Math.max((this.rect?.w || 200) * .5, 1))); this.hand = hand
    if (pw > 0) { const bob = rd ? 0 : Math.sin(this.tNow * (3.2 + Math.min(P.v / 250, 3))) * .035; ty += (hand * .28 - ty) * pw; tp += (-.14 + bob - tp) * pw }
    if (this.env <= 0 && this.petEnv <= 0) { for (const k of [this.sy, this.ey]) { k.x = ty; k.v = 0 } for (const k of [this.sp, this.ep]) { k.x = tp; k.v = 0 }; return }   // invisible: park the springs on the target so fading in starts calm
    const d = Math.min(dt, .05), sp = (L.speed ?? 80) * Math.PI / 180, lag = L.lag * (rd ? 2 : 1) * (1 - .35 * pw)
    smoothDamp(this.sy, ty, lag, d, sp); smoothDamp(this.sp, tp, lag, d, sp); smoothDamp(this.ey, ty, lag * .45, d, sp * 1.6); smoothDamp(this.ep, tp, lag * .45, d, sp * 1.6)
    const w = Math.max(this.watchW, pw)
    lookQ(_q, this.sy.x * w, this.sp.x * w)           // head chain: offset scaled by the eased fade
    lookQ(_r, this.ey.x * w, this.ep.x * w)           // eyes: their own, faster spring
    aimBones(this.bones, _q, _r, L.eye)
  }
  // ---- touch: press + stroke on her body = petting (a tap = a short nuzzle). Only an intentional press counts; she never reacts to a passing cursor. ----
  hitBody(x, y, k = .55) { const r = this.rect; if (!r || this.a < .5 || !this.cfg?.pet || (this.cfg.dark && !this.poked)) return false; return ((x - r.cx) / (r.w * k)) ** 2 + ((y - r.cy) / (r.h * k)) ** 2 < 1 }
  petStart(x, y) { if (!this.hitBody(x, y)) return false; Object.assign(this.pet, { on: true, in: true, x, y, acc: 0, until: this.tNow + .8, time: 0 }); if (this.audio) this.sfx().trill(.75, 1.2); this.petFx(x, y, 6, 1); return true }
  petMove(x, y) { const P = this.pet; if (!P.on) return; P.acc += Math.hypot(x - P.x, y - P.y); P.x = x; P.y = y; P.in = this.hitBody(x, y, .72) }
  petFx(x, y, n, k) { if (this.onPetFx && !this.reduced) for (let i = 0; i < n; i++) this.onPetFx(x, y, k) }
  petEnd() { this.pet.on = false }
  petTick(dt) {
    const P = this.pet, rd = this.reduced
    P.v += (P.acc / Math.max(dt, 1e-3) - P.v) * (1 - Math.exp(-dt / .18)); P.acc = 0   // stroking speed, px/s
    const on = ((P.on && P.in) || this.tNow < P.until) && this.tNow > (this.reactUntil || 0) ? 1 : 0
    this.petEnv += Math.sign(on - this.petEnv) * Math.min(Math.abs(on - this.petEnv), dt / (on ? .35 : .9)); this.petW = ease(this.petEnv)
    if (on && P.on && P.in && P.v > 40) { this.fxT = (this.fxT || 0) - dt; if (this.fxT <= 0) { this.fxT = .1 + Math.random() * .08; this.petFx(P.x, P.y, 1, Math.min(1.6, .5 + P.v / 500)) } }   // stroking: little sparks rise from the hand
    if (this.audio) this.sfx().purr(this.petW * (.6 + .4 * Math.min(1, P.v / 500)))   // she purrs while petted, a little more when you stroke
    if (on && P.on) { P.time += dt; if (this.cfg?.petStretch && P.time > 7) { P.time = 0; this.react('Stretch', true); if (this.audio) this.sfx().doubleTrill() } }   // petted for a long while: she stretches, pleased
    const lean = rd ? 0 : -this.hand * .04 * this.petW
    this.lean += (lean - this.lean) * (1 - Math.exp(-dt / .3)); this.pivot.rotation.z = this.lean   // leans a little toward the hand
  }
  // privacy scene: linger at the left edge, where she hides, and she peeks out to see who is there
  callTick(dt) {
    if (!this.cfg?.hide || !this.rect) return; const r = this.rect
    this.callT = this.mx < 56 && this.my > r.cy - r.h && this.my < r.cy + r.h * .6 ? this.callT + dt : 0
    if (this.callT > .8 && this.tNow > (this.reactUntil || 0) && this.tNow > this.nextCall) { this.callT = 0; this.nextCall = this.tNow + 8; this.peek(this.reduced ? .6 : 1) }
  }
  leave() { this.pending = null; this.clearTimers(); this.aT = 0 }
  hit(x, y) { const r = this.rect; if (!r || this.a < .5 || this.poked || !this.cfg?.dark) return false; return ((x - r.cx) / (r.w * .62)) ** 2 + ((y - r.cy) / (r.h * .62)) ** 2 < 1 }
  // OPENING: she is the invitation. A generous click target (the whole sitting cat), only while she is visible and the gate is open.
  hitGate(x, y) { const r = this.rect; if (!r || this.a < .5 || !this.cfg?.gate) return false; return ((x - r.cx) / (r.w * .75)) ** 2 + ((y - r.cy) / (r.h * .62)) ** 2 < 1 }
  // one-shot acknowledgement: Stretch, then she settles back into SitIdle (cross-faded, never snapped). Returns the clip length in seconds (0 if unavailable).
  react(name = 'Stretch', quiet = false) {
    const clip = this.m?.clips[name], idle = this.m?.clips.SitIdle; if (!this.ready || !clip || !idle) return 0
    if (name === 'Stretch' && !quiet && this.audio) this.sfx().trill(.8, 1.2)   // she trills as she stretches
    this.reactUntil = this.tNow + clip.duration + .5; const a = this.mixer.clipAction(clip); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; this.cur?.fadeOut(.35); a.reset().fadeIn(.35).play(); this.cur = a
    const done = e => { if (e.action !== a) return; this.mixer.removeEventListener('finished', done); const i = this.mixer.clipAction(idle); i.reset().fadeIn(.6).play(); a.fadeOut(.6); this.cur = i }
    this.mixer.addEventListener('finished', done); return clip.duration
  }
  sfx() { return this.snd ||= new CatSound(this.audio) }
  poke() { this.poked = true; this.eyeT = 1; if (this.audio) this.sfx().trill(.8, 1.2) }   // click: the eyes open in the dark
  update(dt, t) {
    if (!this.ready) return
    this.a += (this.aT - this.a) * (1 - Math.exp(-dt / 1.1)); this.el.style.opacity = this.a.toFixed(3)
    if (this.a < .01 && this.aT === 0) { if (this.visible) { this.visible = false; this.r.clear() } return }
    this.visible = true; this.tNow = t; this.unaim(); this.mixer.update(dt); this.capture(); this.petTick(dt); this.callTick(dt); this.watch(dt)
    const et = this.eyeT * (1 - .45 * this.petW); this.eyeG += (et - this.eyeG) * (1 - Math.exp(-dt / (et > this.eyeG ? .9 : .4))); this.uGlow.value = this.eyeG   // while petted the glow softens (a relaxed, half-closed look)
    this.uLit.value += (this.litT - this.uLit.value) * (1 - Math.exp(-dt / .8))
    if (this.audio?.ctx && !this._pl) { this._pl = true; this.sfx().load() }   // load her sounds as soon as the browser allows audio
    this.rim.intensity = this.rimI * (.85 + .15 * Math.sin(t * .4))
    // halos follow the two eyes (skinned vertices -> world)
    const eyes = this.m.parts.Eyes, v = new THREE.Vector3(), p = new THREE.Vector3()
    this.halos.forEach((hs, k) => { const ids = this.m.eyeIdx[k]; if (!ids?.length || !eyes) return; p.set(0, 0, 0); for (const i of ids) { eyes.getVertexPosition(i, v); p.add(v) } p.multiplyScalar(1 / ids.length); eyes.localToWorld(p)
      hs.position.copy(p); hs.position.z += 20; const sz = (this.scale || 1) * .09; hs.scale.set(sz, sz, 1); hs.material.opacity = this.eyeG * (.82 + .18 * Math.sin(t * 1.7 + k)) })
    this.r.render(this.scene, this.cam)
  }
  dispose() { this.snd?.dispose(); this.clearTimers(); this.mixer?.stopAllAction(); this.r?.dispose(); this.el.remove() }
}
