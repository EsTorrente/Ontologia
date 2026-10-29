// A quiet clock for the poem: synthesised ticks (alternating tick / tock) whose tempo follows the writing (data/tempo.js).
// At the track's scene it fades into OntologiaAudio.mp3; when the track ends the ticks come back. Uses the typewriter's AudioContext,
// so the "sonido" button / M key mutes it too, and nothing plays before the first click (browser rule).
import { TEMPO } from '../data/tempo.js'
const lerp = (a, b, t) => a + (b - a) * t
export class Metronome {
  constructor(audio) {
    this.audio = audio; this.armed = false; this.built = false; this.mode = 'metro'   // metro | track
    this.bpm = TEMPO.start; this.target = TEMPO.start; this.glide = TEMPO.glide; this.next = 0; this.n = 0; this.done = false; this.hold = null; this._on = -1; this.stopAt = 0
  }
  get ctx() { return this.audio.ctx }
  arm() { this.armed = true; this.warm() }    // the title has begun (and the song starts downloading quietly)
  build() {
    const c = this.ctx; this.built = true
    this.master = c.createGain(); this.master.gain.value = 0; this.master.connect(c.destination)
    this.mGain = c.createGain(); this.mGain.gain.value = 0; this.tGain = c.createGain(); this.tGain.gain.value = 0
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9500; this.mGain.connect(lp); lp.connect(this.master); this.tGain.connect(this.master)
    const d = c.createDelay(.3), fb = c.createGain(), wet = c.createGain(); d.delayTime.value = .067; fb.gain.value = .22; wet.gain.value = .06
    lp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(this.master)   // a little room so it sits in the space instead of on top of it
    this.bus = [0, 1].map(i => { const g = c.createGain(); if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = i ? .12 : -.12; g.connect(p); p.connect(this.mGain) } else g.connect(this.mGain); return g })
    this.next = c.currentTime + .4; this.mGain.gain.setValueAtTime(0, c.currentTime); this.mGain.gain.linearRampToValueAtTime(TEMPO.level, c.currentTime + 3.5)   // fades in
  }
  // one clock tick, like an escapement: a crisp "ti-ck" made of two very short clicks about 25 ms apart (the second a little softer and lower),
  // each a burst of high-passed noise plus a few small metallic resonances. Dry and light: no knock, no pitch sweep.
  tick(t, k) {
    const c = this.ctx, bus = this.bus[k % 2], r = Math.random, v = .85 + r() * .15
    const click = (at, amp, f) => {
      const nz = c.createBufferSource(); nz.buffer = this.audio.noise; nz.playbackRate.value = .95 + r() * .1
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800 * f
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4300 * f; bp.Q.value = 1.1
      const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.9 * amp, at + .0005); g.gain.exponentialRampToValueAtTime(.0001, at + .014)
      nz.connect(hp); hp.connect(bp); bp.connect(g); g.connect(bus); nz.start(at, r() * .15, .03)
      // small inharmonic ringing, like a tiny metal part being struck
      for (const [hz, gn, dur] of [[3100, .06, .04], [4650, .045, .028], [6350, .03, .02]]) {
        const o = c.createOscillator(), e = c.createGain(); o.type = 'sine'; o.frequency.value = hz * f * (.985 + r() * .03)
        e.gain.setValueAtTime(0, at); e.gain.linearRampToValueAtTime(gn * amp, at + .0006); e.gain.exponentialRampToValueAtTime(.0001, at + dur); o.connect(e); e.connect(bus); o.start(at); o.stop(at + dur + .02)
      }
      const b = c.createOscillator(), be = c.createGain(); b.type = 'sine'; b.frequency.value = 950 * f   // just enough body so it is not thin
      be.gain.setValueAtTime(0, at); be.gain.linearRampToValueAtTime(.07 * amp, at + .001); be.gain.exponentialRampToValueAtTime(.0001, at + .018); b.connect(be); be.connect(bus); b.start(at); b.stop(at + .04)
    }
    click(t, v, 1); click(t + .026, v * .5, .82)
  }
  // tempo for a passage: a number, a [from, to] ramp across the scene's passages, or { bpm, glide }
  step(step, steps) {
    if (this.hold != null) return
    let e = TEMPO.scenes[step.scene]; if (e == null) return
    let g = TEMPO.glide; if (e && e.bpm != null) { g = e.glide ?? g; e = e.bpm }
    if (Array.isArray(e)) { const n = steps.filter(s => s.scene === step.scene).length, p = n > 1 ? step.k / (n - 1) : 1; e = lerp(e[0], e[1], p) }
    this.target = e; this.glide = g
  }
  // the song starts when the chosen passage appears ('shown') or has finished being written ('typed')
  at(step, when) { const T = TEMPO.track; if (step && (T.when || 'typed') === when && step.scene === T.scene && (step.k || 0) === (T.k || 0)) this.toTrack() }
  shown(step) { this.at(step, 'shown') }
  typed(step) { this.at(step, 'typed') }
  trackEl() {
    if (this.el) return this.el
    const el = this.el = new Audio(); el.preload = 'none'; el.src = import.meta.env.BASE_URL + 'assets/sounds/' + TEMPO.track.file
    el.addEventListener('ended', () => this.backToMetro()); el.addEventListener('error', () => { if (this.mode === 'track') this.backToMetro() })
    return el
  }
  warm() { if (this.warmed) return; this.warmed = true; try { const el = this.trackEl(); el.preload = 'auto'; el.load() } catch (e) {} }   // start downloading a few scenes ahead
  toTrack() {
    const c = this.ctx, T = TEMPO.track; if (this.mode !== 'metro' || this.done) return
    if (!c || !this.built) { this.wantTrack = true; return }   // sound is not unlocked yet: start the song as soon as it is
    let el; try { el = this.trackEl(); if (!this.src) { this.src = c.createMediaElementSource(el); this.src.connect(this.tGain) } } catch (e) { console.warn('[tempo] track unavailable', e); this.done = true; this.hold = T.after; this.target = T.after; return }
    this.mode = 'track'; this.hold = T.after; this.target = T.after; this.bpm = T.after
    try { el.currentTime = 0 } catch (e) {}
    const p = el.play(); if (p && p.catch) p.catch(() => this.backToMetro())
    const t = c.currentTime
    this.tGain.gain.cancelScheduledValues(t); this.tGain.gain.setValueAtTime(0, t); this.tGain.gain.linearRampToValueAtTime(1, t + T.fadeIn)           // the track rises...
    this.mGain.gain.cancelScheduledValues(t); this.mGain.gain.setValueAtTime(this.mGain.gain.value, t); this.mGain.gain.setTargetAtTime(0, t + .4, T.fadeOut / 3.2)   // ...as the ticks sink away
    this.stopAt = t + T.fadeOut + 1.5
  }
  backToMetro() {
    const c = this.ctx, T = TEMPO.track; if (this.mode !== 'track' || !c) return
    this.mode = 'metro'; this.done = true; this.hold = T.after; this.bpm = this.target = T.after; this.next = c.currentTime + .3; const t = c.currentTime
    this.tGain.gain.cancelScheduledValues(t); this.tGain.gain.setTargetAtTime(0, t, .6)
    this.mGain.gain.cancelScheduledValues(t); this.mGain.gain.setValueAtTime(0, t); this.mGain.gain.linearRampToValueAtTime(TEMPO.level, t + (T.back ?? 1))
  }
  update(dt) {
    const c = this.ctx; if (!c || c.state !== 'running' || !this.armed) return
    if (!this.built) this.build()
    if (this.wantTrack) { this.wantTrack = false; this.toTrack() }
    const on = this.audio.on ? 1 : 0; if (on !== this._on) { this._on = on; this.master.gain.setTargetAtTime(on, c.currentTime, .15) }   // sound off = silent, but the clock (and the track) keep time
    this.bpm += (this.target - this.bpm) * (1 - Math.exp(-Math.min(dt, .1) / Math.max(.2, this.glide)))
    if (this.mode === 'track') { const el = this.el; if (el && isFinite(el.duration) && el.duration - el.currentTime < (TEMPO.track.tail ?? 0)) this.backToMetro() }   // the song's last seconds are silence: the clock returns as it dies away
    if (this.mode === 'track' && c.currentTime > this.stopAt) return   // the ticks have sunk away; nothing to schedule
    const now = c.currentTime
    if (this.next < now - .05) this.next = now + .02   // after a stall (hidden tab, heavy frame) just carry on, never burst
    while (this.next < now + .3) { this.tick(this.next, this.n++); this.next += 60 / Math.max(30, this.bpm) }
  }
  dispose() { try { this.el?.pause() } catch (e) {} this.master?.disconnect() }
}
