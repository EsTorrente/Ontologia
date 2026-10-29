import { CONFIG } from '../config.js'
// A tiny 3D camera that mirrors the CSS transform maths exactly (row-major 4x4, column vectors, CSS rotation conventions).
// The DOM does the drawing (stage > room > block, all preserve-3d under one `perspective`); this class does the picking:
// where is a letter on screen (project) and which point of a block is under the mouse (local) -- so the mouse physics work in 3D.
const rad = d => d * Math.PI / 180
const mul = (a, b) => { const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c]; return o }
const T = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1]
const RX = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1] }
const RY = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1] }
const RZ = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }
export class Space {
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
