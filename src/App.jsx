import { useEffect, useRef } from 'react'
import { Director } from './engine/director.js'
// React only hosts the layers; the experience itself runs in plain JS (no per-frame renders).
export default function App() {
  const atm = useRef(), stars = useRef(), stage = useRef()
  useEffect(() => { const d = new Director({ atm: atm.current, stars: stars.current, stage: stage.current }); if (new URLSearchParams(location.search).has('debug')) window.__ont = d; return () => { d.destroy(); stage.current && (stage.current.innerHTML = '') } }, [])
  return (<main className="ont">
    <h1 className="sr">Ontología</h1>
    <canvas ref={atm} className="atm" aria-hidden="true" />
    <canvas ref={stars} className="stars" aria-hidden="true" />
    <div className="vignette" aria-hidden="true" /><div className="grain" aria-hidden="true" />
    <div ref={stage} className="stage" aria-live="polite" />
  </main>)
}
