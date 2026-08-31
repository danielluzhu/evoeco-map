# evoeco-map

A global map for every EvoEco customer location, built from the announcements
published at [evoeco.substack.com](https://evoeco.substack.com).

**Live site: <https://danielluzhu.github.io/evoeco-map/>**

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
| `assets/logos/`       | Customer logos, 128px PNG, one per slug                 |

## Map geometry

Country outlines come from [Natural Earth](https://www.naturalearthdata.com/)
1:110m via [world-atlas](https://github.com/topojson/world-atlas), converted
from TopoJSON to projected SVG paths at build time. The projection is
equirectangular, so `x = (lon + 180) / 360` and `y = (90 - lat) / 180` — the
same formula the renderer uses to place pins, which is what keeps the markers
registered to the coastlines.

Coordinates are approximate site centroids, good to roughly the campus or
building, not survey grade.

## Logos

Each customer's mark is fetched once from that organisation's own site (or its
favicon service) and committed as a 128px PNG under `assets/logos/`, trimmed of
transparent padding so it fills its tile. Nothing is hotlinked, so the pages
make no third-party requests.

Marks sit on a light tile because many are dark-on-transparent and would
otherwise vanish against the dark card. A logo that is *sparse white ink* would
have the opposite problem, so those get a dark tile instead — detected by
measuring the near-white fraction of the opaque pixels rather than by hand.

Four customers have no logo: Ygnacio Center, Columbia Property Trust and WCI
have no live site, and the City of Fremont publishes only a 16px favicon, too
small to use. Those fall back to a CSS monogram of the customer's initials.

The logos are third-party trademarks, reproduced to identify each customer.
