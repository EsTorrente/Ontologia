import { CONFIG } from '../config.js'
import { resolveCues } from '../data/cues.js'
// Text as living letters. Layout is computed analytically (monospace) so compositions can be planned before anything is drawn;
// every letter is a real DOM span moved by one shared animation loop (float, mouse disturbance, spring return). No React renders per frame.
const rnd = (a, b) => a + Math.random() * (b - a)
export class Typesetter {
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
