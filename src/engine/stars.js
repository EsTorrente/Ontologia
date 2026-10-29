import { CONFIG } from '../config.js'
// Slow-rising four-point stars with real glow. Sprites are drawn once (tapered points, hot core, soft bloom) and blitted additively.
// The sky is connected to the writing: stars brighten near the caret, flare when a sentence ends, speed up and flicker with the
// scene's energy, take on the colour of the text being written, and move with the camera (parallax by depth).
const rgb = c => CONFIG.palette[c]
export function starSprite(col, halo, S = 256) {
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
export class Stars {
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
