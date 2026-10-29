// The cat's voice: a purr that rises while she is petted, trills when she is touched. Plays through the poem's own audio context,
// so the "sonido" button / M key mutes her too, and nothing plays before the first click (browser rule).
const FILES = { purr: 'purr', t1: 'Trill1', t2: 'Trill2', dt: 'DoubleTrill' }
const VOL = .8   // overall level of the cat sounds
export class CatSound {
  constructor(audio) { this.audio = audio; this.buf = {}; this.started = false; this.loop = null; this.gain = null; this.level = 0; this.lastTrill = -99 }
  get ctx() { return this.audio.ctx }
  // the files are fetched as soon as the cat exists (no audio context needed); they are decoded on the first click, which creates the context
  prefetch() { return this.pre ||= Promise.all(Object.entries(FILES).map(async ([k, f]) => { try { const r = await fetch(import.meta.env.BASE_URL + 'assets/sounds/' + f + '.mp3'); return [k, await r.arrayBuffer()] } catch (e) { console.warn('[cat] sound', f, e); return [k, null] } })).then(a => Object.fromEntries(a)) }
  async load() {
    const ctx = this.ctx; if (this.started || !ctx) return this.loaded; this.started = true
    this.loaded = (async () => { const raw = await this.prefetch(); await Promise.all(Object.entries(raw).map(async ([k, ab]) => { if (ab) try { this.buf[k] = await ctx.decodeAudioData(ab.slice(0)) } catch (e) { console.warn('[cat] decode', k, e) } })) })(); return this.loaded
  }
  ok() { const c = this.ctx; return !!c && this.audio.on && c.state === 'running' }
  play(k, g = .6, rate = 1, again = false) {
    // the very first click: the context may still be waking up and the buffers decoding - wait for them (up to 2.5 s) instead of staying silent
    if (!again && this.ctx && this.audio.on && (!this.buf[k] || this.ctx.state !== 'running')) { const t0 = performance.now(); Promise.all([this.load(), this.ctx.resume?.()]).then(() => { if (performance.now() - t0 < 2500) this.play(k, g, rate, true) }).catch(() => {}); return }
    if (!this.ok() || !this.buf[k]) return; const c = this.ctx, s = c.createBufferSource(), gn = c.createGain(); s.buffer = this.buf[k]; s.playbackRate.value = rate; gn.gain.value = g * VOL; s.connect(gn); gn.connect(c.destination); s.start() }
  trill(g = .6, gap = 5) { const now = performance.now() / 1000; if (now - this.lastTrill < gap) return; this.lastTrill = now; this.play(Math.random() < .5 ? 't1' : 't2', g, .96 + Math.random() * .08) }
  doubleTrill(g = .65) { this.play('dt', g) }
  // level 0..1: how much she is purring right now (loops while > 0, fades in and out)
  purr(level) {
    const c = this.ctx; this.level = level; if (!c || !this.buf.purr) return
    if (level > .02 && !this.loop && this.ok()) { const s = c.createBufferSource(), g = c.createGain(); s.buffer = this.buf.purr; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(c.destination); s.start(); this.loop = s; this.gain = g }
    if (!this.gain) return
    this.gain.gain.setTargetAtTime(this.audio.on ? level * VOL * .9 : 0, c.currentTime, .25)
    if (level <= .02 && !this.stopT) this.stopT = setTimeout(() => { this.stopT = null; if (this.level <= .02 && this.loop) { try { this.loop.stop() } catch (e) {} this.loop = null; this.gain = null } }, 1400)
  }
  dispose() { try { this.loop?.stop() } catch (e) {} clearTimeout(this.stopT) }
}
