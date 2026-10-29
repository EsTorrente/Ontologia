import { CONFIG } from '../config.js'
// Typewriter keys, synthesised (no audio files): a short filtered-noise "tick" + a soft low "thock" per letter,
// a deeper hit for the space bar and a small ratchet for line breaks. Browsers only allow sound after a gesture:
// the context is created on the first click / key press (letters typed before that are silent).
export class TypeSound {
  constructor() { this.ctx = null; this.last = 0; this.on = true; try { this.on = localStorage.getItem('ont-sound') !== 'off' } catch (e) {} }
  unlock() {
    if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { this.build(new AC()) } catch (e) { this.ctx = null; return } }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
  }
  build(ctx) {
    const A = CONFIG.audio; this.ctx = ctx
    this.out = ctx.createGain(); this.out.gain.value = A.volume
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7200; this.out.connect(lp); lp.connect(ctx.destination)
    // a very small "room" so the keys feel intimate rather than dry
    const d = ctx.createDelay(.3); d.delayTime.value = .071; const fb = ctx.createGain(); fb.gain.value = .24; const wet = ctx.createGain(); wet.gain.value = A.room
    lp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(ctx.destination)
    const n = Math.floor(ctx.sampleRate * .25), buf = ctx.createBuffer(1, n, ctx.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1; this.noise = buf
  }
  setOn(v) { this.on = v; try { localStorage.setItem('ont-sound', v ? 'on' : 'off') } catch (e) {} }
  // ch: the letter; size: block scale (bigger type = deeper keys); energy 0..1 (a little brighter and harder when restless)
  key(ch, size = 1, energy = 0) {
    const c = this.ctx; if (!this.on || !c || c.state !== 'running') return
    const now = c.currentTime; if (now - this.last < .02) return; this.last = now
    const A = CONFIG.audio, r = Math.random, sp = ch === ' ', nl = ch === '\n', pitch = Math.max(.62, Math.min(1.1, 1 / (.82 + .18 * size)))
    const vel = A.keyGain * (.62 + r() * .5) * (1 + energy * .35) * (sp ? .8 : 1)
    const dest = c.createGain(); dest.gain.value = 1; let node = dest
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = (r() - .5) * .3; dest.connect(p); node = p }
    node.connect(this.out)
    // tick
    const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = .85 + r() * .3
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1; bp.frequency.value = (sp ? 850 : 1700 + r() * 1700 + energy * 500) * pitch
    const g = c.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vel * (nl ? .5 : 1), now + .002); g.gain.exponentialRampToValueAtTime(.0001, now + (sp ? .07 : nl ? .2 : .045))
    s.connect(bp); bp.connect(g); g.connect(dest); s.start(now, r() * .1, .25); s.stop(now + .3)
    // thock
    const o = c.createOscillator(); o.type = 'triangle'; const f0 = (sp ? 100 : nl ? 70 : 150 + r() * 55) * pitch
    o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f0 * .55, now + .08)
    const g2 = c.createGain(); g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(vel * (sp ? .85 : .5), now + .003); g2.gain.exponentialRampToValueAtTime(.0001, now + (sp ? .13 : .095))
    o.connect(g2); g2.connect(dest); o.start(now); o.stop(now + .16)
  }
}
