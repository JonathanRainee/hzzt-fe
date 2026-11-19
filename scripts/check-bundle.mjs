// Enforces the performance budget from plan/plan.md Section 5.9.
//  - initial JS (entry + modulepreload chunks listed in dist/index.html), gzipped <= 150 KB
//  - any other (lazy) JS chunk, gzipped <= 60 KB
//  - all CSS, gzipped <= 25 KB
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const KB = 1024
const BUDGET = { initialJs: 150 * KB, lazyJs: 60 * KB, css: 25 * KB }
const DIST = new URL('../dist/', import.meta.url).pathname

const gz = (file) => gzipSync(readFileSync(join(DIST, file))).length
const fmt = (n) => `${(n / KB).toFixed(2)} KB`

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const referenced = new Set(
  [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1]),
)
const assets = readdirSync(join(DIST, 'assets')).map((f) => `assets/${f}`)
const js = assets.filter((f) => f.endsWith('.js'))
const css = assets.filter((f) => f.endsWith('.css'))

const failures = []
const rows = []

// The charts chunk (d3 + our SVG charts) must only load on routes that show a chart,
// so it must never be part of the initial load.
const eagerCharts = js.filter((f) => /\/charts-/.test(f) && referenced.has(f))
if (eagerCharts.length > 0)
  failures.push(`charts chunk is loaded eagerly: ${eagerCharts.join(', ')}`)

const initial = js.filter((f) => referenced.has(f))
const initialSize = initial.reduce((sum, f) => sum + gz(f), 0)
rows.push(['Initial JS', initialSize, BUDGET.initialJs])
if (initialSize > BUDGET.initialJs) failures.push('Initial JS')

for (const f of js.filter((f) => !referenced.has(f))) {
  const size = gz(f)
  rows.push([`Lazy chunk ${f}`, size, BUDGET.lazyJs])
  if (size > BUDGET.lazyJs) failures.push(f)
}

const cssSize = css.reduce((sum, f) => sum + gz(f), 0)
rows.push(['CSS', cssSize, BUDGET.css])
if (cssSize > BUDGET.css) failures.push('CSS')

for (const [name, size, limit] of rows) {
  const ok = size <= limit ? 'ok  ' : 'FAIL'
  console.log(`${ok} ${name.padEnd(48)} ${fmt(size).padStart(10)} / ${fmt(limit)} (gzip)`)
}

if (failures.length > 0) {
  console.error(`\nBundle budget exceeded: ${failures.join(', ')}`)
  process.exit(1)
}
console.log('\nBundle budget OK')
