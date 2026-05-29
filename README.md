# collecto

A Pinterest-style image gallery built with React + TypeScript + Vite. Drop images
into a folder and they appear in a masonry grid with tag filtering, search, light/dark
mode, and a zoomable image viewer.

## Adding images

Put image files under **`public/images/`**. Subfolders are scanned recursively, so you
can organise by category:

```
public/images/
  matcha_martini_drink.svg
  kitchen/
    green_kitchen_decor.jpg
    forest_mug_set_ceramic.png
  fashion/
    moss_knit_sweater.jpeg
```

Supported extensions: `.jpg .jpeg .png .gif .webp .avif .svg`.

### Tags from file names

The file name (minus extension) is split on `_` to produce **tags**. For example
`green_leather_bag.jpg` gets the tags `green`, `leather`, `bag`. Tags appear in the
sidebar as colored chips with a count; each tag's color is derived deterministically
from its name.

A trailing purely-numeric segment is treated as a counter and **dropped**, so
`a_b_c_1.jpg` and `a_b_c_2.jpg` both produce the tag set `{a, b, c}` instead of
spawning a new `1` / `2` tag for each file.

### Dynamic discovery (no rebuild needed)

Image discovery happens at **runtime** by fetching JSON directory listings from
`/images/`. In dev, `vite-plugin-images.ts` serves those listings; in production,
nginx serves them via `autoindex_format json`. Drop files into the served
`images/` folder and refresh — they appear without rebuilding the bundle.

## Features

- **Tag sidebar** — colored count chips; click to filter. Multi-select combines tags
  with **AND** (e.g. `green` + `bag` shows images tagged with both).
- **Search** — matches file name, tags, and folder.
- **Sort** — name ↑ / name ↓ / most tags / shuffle (default: name ascending).
- **Light / dark mode** — toggled in the top bar, remembered in `localStorage`.
- **Masonry grid** — responsive Pinterest-style columns.
- **Image viewer** — fit-to-screen on open, scroll to zoom (toward the cursor),
  drag to pan when zoomed, double-click to toggle zoom, prev/next buttons,
  `←`/`→` to navigate, `X` or `Esc` to close.
- **Slim scrollbars** that only appear on hover.

## Scripts

```bash
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # eslint

node scripts/gen-demo.mjs   # regenerate the bundled demo images
```

The bundled demo images under `public/images/` are placeholders — delete them and add
your own whenever you like.
