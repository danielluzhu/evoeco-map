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
| `assets/evoeco/`      | EvoEco's own mark, and the favicons cut from it         |
| `assets/fonts/`       | Oswald 700, self-hosted, for headings                   |

## Map geometry

Country outlines come from [Natural Earth](https://www.naturalearthdata.com/)
1:110m via [world-atlas](https://github.com/topojson/world-atlas), converted
from TopoJSON to projected SVG paths at build time. The projection is
equirectangular, so `x = (lon + 180) / 360` and `y = (90 - lat) / 180` — the
same formula the renderer uses to place pins, which is what keeps the markers
registered to the coastlines.

Coordinates are approximate site centroids, good to roughly the campus or
building, not survey grade.

## Typography

Headings are set in Oswald 700, picked by measuring the logo rather than by eye.
The mark's cap-O is 0.624 as wide as it is tall and its stems are 0.202 of cap
height; Oswald is 0.586 and 0.222, the closest fit on both counts among the
open-licensed condensed grotesques tried (Anton, Archivo Black, Fjalla One,
Barlow Condensed, Saira Condensed and others were wider of the mark on one axis
or both).

The font is committed under `assets/fonts/` rather than linked, so the pages
still make no third-party requests. It is the 12KB latin subset, under the SIL
Open Font License; the licence travels with it in `OFL.txt`.

Body copy stays on the system sans. Oswald is a display face — it earns the
headings and the overview's four figures, and would cost legibility everywhere
else.

## Colours

The palette is EvoEco's own. Both greens are sampled straight out of the logo —
`#36B350` from the lit face of its V, `#348B41` from the shaded one — and the
logo's letter grey `#404041` is kept for ink on white. Everything else is
achromatic black and white, so the greens are the only hue on the page.

The bright green leads (pins, links, the eyebrow rule); the deeper one is for
marks that support rather than lead — the crosshair, and the leader lines from
a nudged pin back to its true coordinate.

## Logos

Each customer's mark is fetched once from that organisation's own site (or its
favicon service) and committed as a 128px PNG under `assets/logos/`, trimmed of
transparent padding so it fills its tile. Nothing is hotlinked, so the pages
make no third-party requests.

Marks sit on a light tile because many are dark-on-transparent and would
otherwise vanish against the dark card. A logo that is *sparse white ink* would
have the opposite problem, so those get a dark tile instead — detected by
measuring the near-white fraction of the opaque pixels rather than by hand.

Three customers have no logo: Ygnacio Center and WCI have no live site, and
the City of Fremont publishes only a 16px favicon, too small to use. Those fall
back to a CSS monogram of the customer's initials.

The logos are third-party trademarks, reproduced to identify each customer.
