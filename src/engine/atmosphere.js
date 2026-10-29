import { BGS } from '../config.js'
// Slowly morphing backdrop: vertical gradient + two very soft lights, drawn on a tiny canvas that the browser scales up smoothly.
const KEYS = ['t0', 't1', 't2', 'b0', 'b1', 'b2', 'g0', 'g1', 'g2', 'a', 'x', 'y']
const flat = b => [...b.top, ...b.bot, ...b.glow, b.a, b.x, b.y]
export const lerpBg = (a, b, t) => { const A = flat(BGS[a] || a), B = flat(BGS[b] || b); return A.map((v, i) => v + (B[i] - v) * t) }
export class Atmosphere {
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
