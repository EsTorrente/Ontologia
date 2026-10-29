// Builds preview/ontologia.js: the engine as one plain script, so preview/index.html works by double-click (no Vite, no server).
// Usage: node scripts/bundle-preview.mjs
import fs from 'node:fs'
const mods = ['config', 'data/text', 'data/cues', 'data/scenes', 'engine/atmosphere', 'engine/stars', 'engine/space', 'engine/audio', 'engine/typesetter', 'engine/director']
const id = p => '__' + p.replace(/[^a-z]/gi, '_')
let out = '(()=>{"use strict";\n'
for (const m of mods) {
  let src = fs.readFileSync(`src/${m}.js`, 'utf8'), names = []
  src = src.replace(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)'\s*$/gm, (_, list, from) => { const t = 'ABCDEFGHIJ'; const p = mods.find(x => x.endsWith(from.replace(/^\.\.?\//, '').replace(/\.js$/, ''))); return `const {${list.trim()}} = ${id(p)}` })
  src = src.replace(/^export\s+(const|let|function|class)\s+([A-Za-z0-9_$]+)/gm, (_, k, n) => { names.push(n); return `${k} ${n}` })
  out += `const ${id(m)} = (()=>{\n${src}\nreturn {${names.join(',')}}})()\n`
}
out += `const {Director} = ${id('engine/director')}
const mount = () => { const r = document.getElementById('root'); r.innerHTML = '<main class="ont"><h1 class="sr">Ontología</h1><canvas class="atm" aria-hidden="true"></canvas><canvas class="stars" aria-hidden="true"></canvas><div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div class="stage" aria-live="polite"></div></main>'
  const q = s => r.querySelector(s), d = new Director({ atm: q('.atm'), stars: q('.stars'), stage: q('.stage') }); if (new URLSearchParams(location.search).has('debug')) window.__ont = d }
mount()
})()\n`
fs.mkdirSync('preview', { recursive: true }); fs.writeFileSync('preview/ontologia.js', out); fs.copyFileSync('src/styles.css', 'preview/ontologia.css'); console.log('preview/ontologia.js', out.length, 'bytes')
