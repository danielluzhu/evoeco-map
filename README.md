# evoeco-map

A global map for every EvoEco customer location, built from the announcements
published at [evoeco.substack.com](https://evoeco.substack.com).

Each customer gets its own page under `maps/`: a whole-world equirectangular
map with that site pinned and labelled, every other EvoEco site shown dimmed
for context, and a fact panel with the site, region, coordinates, and
announcement date.

Open `index.html` for the overview, or any file in `maps/` directly — the
pages are static and work from the filesystem, no build step or server needed.

## Layout

| Path                  | Contents                                              |
| --------------------- | ----------------------------------------------------- |
| `index.html`          | Overview map plus a card per location                  |
| `maps/<slug>.html`    | One global map per customer location                   |
| `data/locations.json` | Source of truth: customer, site, coordinates, post URL |
| `assets/world.js`     | Country outlines, pre-projected to SVG path data       |
| `assets/locations.js` | `data/locations.json` as a script for `file://` use    |
| `assets/map.js`       | Renderer shared by every page                          |
| `assets/map.css`      | Shared styles                                          |

## Map geometry

Country outlines come from [Natural Earth](https://www.naturalearthdata.com/)
1:110m via [world-atlas](https://github.com/topojson/world-atlas), converted
from TopoJSON to projected SVG paths at build time. The projection is
equirectangular, so `x = (lon + 180) / 360` and `y = (90 - lat) / 180` — the
same formula the renderer uses to place pins, which is what keeps the markers
registered to the coastlines.

Coordinates are approximate site centroids, good to roughly the campus or
building, not survey grade.
