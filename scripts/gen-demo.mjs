// Generates demo images under public/images so the gallery has content out of the box.
// Filenames follow the a_b_c.ext tag pattern; some live in subfolders.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), 'public', 'images')

// [folder, filename(without ext), [stop colors], width, height]
const defs = [
  ['', 'olive_linen_tank', ['#8a8f5c', '#b9bd86'], 600, 800],
  ['', 'matcha_martini_drink', ['#6f8f2a', '#aacb3c'], 600, 820],
  ['', 'sage_ceramic_vase', ['#9cae84', '#d6e0c2'], 600, 560],
  ['', 'fern_cargo_pants', ['#4f5d2f', '#7c8c4e'], 600, 900],
  ['kitchen', 'green_kitchen_decor', ['#5b7d4f', '#9dc08b'], 600, 520],
  ['kitchen', 'forest_mug_set_ceramic', ['#2f5132', '#4f8056'], 600, 600],
  ['kitchen', 'avocado_bowl_plate', ['#5a7d2a', '#8fae4a'], 600, 700],
  ['kitchen', 'olive_watering_plant', ['#3e5e2c', '#6f9148'], 600, 760],
  ['fashion', 'moss_knit_sweater', ['#7d8a3a', '#aebd5e'], 600, 820],
  ['fashion', 'emerald_satin_skirt', ['#1f6b3a', '#3fa066'], 600, 880],
  ['fashion', 'green_leather_bag', ['#536b32', '#86a056'], 600, 720],
  ['fashion', 'jade_beaded_necklace', ['#3a6b46', '#67a07a'], 600, 600],
  ['fashion', 'olive_slide_sandals', ['#6b7d3a', '#9caf5e'], 600, 460],
  ['fashion', 'green_manicure_rings', ['#4f7d4a', '#86b07e'], 600, 640],
  ['pets', 'green_sweater_dog', ['#46603a', '#7c9560'], 600, 700],
  ['decor', 'olive_velvet_chair', ['#5b6b3a', '#8e9d5e'], 600, 740],
  ['decor', 'green_floral_pillow', ['#3a6b52', '#67a085'], 600, 560],
]

function svg(name, [c1, c2], w, h) {
  const label = name.replace(/_/g, ' ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.78}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.28}" fill="#ffffff" opacity="0.10"/>
  <circle cx="${w * 0.2}" cy="${h * 0.8}" r="${Math.min(w, h) * 0.34}" fill="#000000" opacity="0.08"/>
  <text x="${w / 2}" y="${h / 2}" fill="#ffffff" opacity="0.92" font-family="system-ui, sans-serif"
    font-size="${Math.round(w * 0.062)}" font-weight="700" text-anchor="middle"
    dominant-baseline="middle" style="letter-spacing:.5px">${label}</text>
</svg>
`
}

let n = 0
for (const [folder, name, colors, w, h] of defs) {
  const dir = folder ? path.join(root, folder) : root
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg(name, colors, w, h))
  n++
}
console.log(`Generated ${n} demo images under public/images`)
