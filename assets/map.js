/* Renders a global (whole-world) map with one customer location in focus.
   Depends on window.WORLD (assets/world.js) for country path geometry. */
(function () {
  var W = 1000, H = 500;
  // Equirectangular: matches the projection baked into world.js.
  function px(lon) { return (lon + 180) / 360 * W; }
  function py(lat) { return (90 - lat) / 180 * H; }

  // Crop the poles — Antarctica and the high Arctic carry no sites and waste vertical space.
  var VIEW = { x: 0, y: 14, w: W, h: 404 };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function graticule() {
    var d = [];
    for (var lon = -150; lon <= 150; lon += 30) d.push('M' + px(lon).toFixed(1) + ' 0V' + H);
    for (var lat = -60; lat <= 60; lat += 30) d.push('M0 ' + py(lat).toFixed(1) + 'H' + W);
    return '<path class="graticule" d="' + d.join('') + '"/>';
  }

  function dms(v, pos, neg) {
    var h = v >= 0 ? pos : neg, a = Math.abs(v);
    var deg = Math.floor(a), min = Math.floor((a - deg) * 60);
    var sec = ((a - deg - min / 60) * 3600).toFixed(1);
    return deg + '°' + min + "'" + sec + '"' + h;
  }

  // Sites in the same metro project to within a pin's width of each other — eight
  // Bay Area sites land inside two map units. Nudge overlapping pins apart just
  // enough to be separately visible, and draw a leader back to the true point.
  var MIN_SEP = 6.5;
  function layout(all, fixedSlug) {
    var p = all.map(function (l) {
      var x = px(l.lon), y = py(l.lat);
      return { loc: l, x: x, y: y, ax: x, ay: y, fixed: l.slug === fixedSlug };
    });
    for (var iter = 0; iter < 400; iter++) {
      var moved = false;
      for (var i = 0; i < p.length; i++) {
        for (var j = i + 1; j < p.length; j++) {
          var dx = p[j].x - p[i].x, dy = p[j].y - p[i].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d >= MIN_SEP) continue;
          if (d < 1e-6) { dx = (i % 2 ? 1 : -1) * 0.6; dy = (j % 2 ? 1 : -1) * 0.6; d = 0.85; }
          var ux = dx / d, uy = dy / d, push = (MIN_SEP - d) / 2;
          // A focused pin holds its true position; its crosshair and label depend on it.
          if (p[i].fixed) { p[j].x += ux * push * 2; p[j].y += uy * push * 2; }
          else if (p[j].fixed) { p[i].x -= ux * push * 2; p[i].y -= uy * push * 2; }
          else { p[i].x -= ux * push; p[i].y -= uy * push; p[j].x += ux * push; p[j].y += uy * push; }
          moved = true;
        }
      }
      // Constant pull home, so pins settle as close to true position as separation allows.
      for (var k = 0; k < p.length; k++) {
        if (p[k].fixed) { p[k].x = p[k].ax; p[k].y = p[k].ay; continue; }
        p[k].x += (p[k].ax - p[k].x) * 0.05;
        p[k].y += (p[k].ay - p[k].y) * 0.05;
      }
      if (!moved) break;
    }
    p.forEach(function (q) {
      q.displaced = Math.sqrt((q.x - q.ax) * (q.x - q.ax) + (q.y - q.ay) * (q.y - q.ay)) > 0.6;
    });
    return p;
  }

  function leader(q) {
    if (!q.displaced) return '';
    return '<path class="leader" d="M' + q.ax.toFixed(2) + ' ' + q.ay.toFixed(2) +
      'L' + q.x.toFixed(2) + ' ' + q.y.toFixed(2) + '"/>' +
      '<circle class="anchor" cx="' + q.ax.toFixed(2) + '" cy="' + q.ay.toFixed(2) + '" r="0.9"/>';
  }

  window.formatCoords = function (lat, lon) {
    return dms(lat, 'N', 'S') + ' ' + dms(lon, 'E', 'W');
  };

  window.renderMap = function (el, focus, all) {
    var fx = px(focus.lon), fy = py(focus.lat);
    var s = '<svg viewBox="' + VIEW.x + ' ' + VIEW.y + ' ' + VIEW.w + ' ' + VIEW.h + '" role="img" ' +
      'aria-label="World map showing ' + esc(focus.customer) + ' in ' + esc(focus.city) + ', ' + esc(focus.country) + '">';
    s += graticule();

    var c = window.WORLD.countries;
    for (var i = 0; i < c.length; i++) {
      s += '<path class="country" d="' + c[i].d + '"><title>' + esc(c[i].name) + '</title></path>';
    }

    // Crosshair through the focus site.
    s += '<path class="crosshair" d="M0 ' + fy.toFixed(2) + 'H' + W + 'M' + fx.toFixed(2) + ' ' + VIEW.y + 'V' + (VIEW.y + VIEW.h) + '"/>';

    // Every other site gets a full pin too, held back so the focus still leads.
    if (all) {
      var pts = layout(all, focus.slug);
      for (var j = 0; j < pts.length; j++) {
        var q = pts[j];
        if (q.loc.slug === focus.slug) continue;
        var ox = q.x.toFixed(2), oy = q.y.toFixed(2);
        s += '<g class="site-ctx">' + leader(q);
        s += '<circle class="ctx-halo" cx="' + ox + '" cy="' + oy + '" r="4.2"/>';
        s += '<circle class="ctx-pin" cx="' + ox + '" cy="' + oy + '" r="2.1"/>';
        s += '<circle class="hit" cx="' + ox + '" cy="' + oy + '" r="7"><title>' +
          esc(q.loc.customer + ' — ' + q.loc.city + ', ' + q.loc.country) + '</title></circle>';
        s += '</g>';
      }
    }

    // Focus marker.
    s += '<circle class="halo pulse" cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r="9"/>';
    s += '<circle class="halo" cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r="9"/>';
    s += '<circle class="pin focus-pin" cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r="4.2"/>';

    // Callout label, flipped to whichever side has room.
    var name = focus.customer, where = focus.city + ', ' + focus.country;
    var bw = Math.max(name.length, where.length) * 6.1 + 18, bh = 30;
    var left = fx > W * 0.62;
    var bx = left ? fx - 16 - bw : fx + 16;
    var by = Math.min(Math.max(fy - bh / 2, VIEW.y + 4), VIEW.y + VIEW.h - bh - 4);
    s += '<path class="crosshair" style="opacity:.9;stroke-dasharray:none" d="M' + fx.toFixed(2) + ' ' + fy.toFixed(2) +
      'L' + (left ? bx + bw : bx).toFixed(2) + ' ' + (by + bh / 2).toFixed(2) + '"/>';
    s += '<rect class="label-box" x="' + bx.toFixed(2) + '" y="' + by.toFixed(2) + '" width="' + bw.toFixed(2) +
      '" height="' + bh + '" rx="4"/>';
    s += '<text class="label-text" x="' + (bx + 9).toFixed(2) + '" y="' + (by + 13).toFixed(2) + '">' + esc(name) + '</text>';
    s += '<text class="label-sub" x="' + (bx + 9).toFixed(2) + '" y="' + (by + 24).toFixed(2) + '">' + esc(where) + '</text>';

    s += '</svg>';
    el.innerHTML = s;
  };

  window.renderOverview = function (el, all, opts) {
    opts = opts || {};
    var s = '<svg viewBox="' + VIEW.x + ' ' + VIEW.y + ' ' + VIEW.w + ' ' + VIEW.h + '" ' +
      'aria-label="World map of all ' + all.length + ' EvoEco customer locations">';
    // Backdrop spans the viewBox so clicks on empty ocean reach the reset handler.
    s += '<rect class="map-bg" x="' + VIEW.x + '" y="' + VIEW.y + '" width="' + VIEW.w + '" height="' + VIEW.h + '"/>';
    s += graticule();
    var c = window.WORLD.countries;
    for (var i = 0; i < c.length; i++) {
      s += '<path class="country" d="' + c[i].d + '"><title>' + esc(c[i].name) + '</title></path>';
    }
    var pts = layout(all, null);
    for (var j = 0; j < pts.length; j++) {
      var q = pts[j], loc = q.loc, x = q.x.toFixed(2), y = q.y.toFixed(2);
      var label = esc(loc.customer + ' — ' + loc.city + ', ' + loc.country);
      s += '<g class="site" data-slug="' + esc(loc.slug) + '" role="button" tabindex="0" aria-label="' + label + '">';
      s += leader(q);
      s += '<circle class="halo" cx="' + x + '" cy="' + y + '" r="4.8"/>';
      s += '<circle class="pin" cx="' + x + '" cy="' + y + '" r="2.6"/>';
      // Invisible, generously sized hit target — the drawn pin is too small to click reliably.
      s += '<circle class="hit" cx="' + x + '" cy="' + y + '" r="8"><title>' + label + '</title></circle>';
      s += '</g>';
    }
    s += '</svg>';
    el.innerHTML = s;

    var svg = el.querySelector('svg');
    var groups = el.querySelectorAll('.site');
    var selected = null;

    function apply(slug) {
      selected = slug;
      el.classList.toggle('has-selection', !!slug);
      for (var k = 0; k < groups.length; k++) {
        groups[k].classList.toggle('is-selected', groups[k].getAttribute('data-slug') === slug);
      }
      if (opts.onChange) {
        opts.onChange(slug ? all.filter(function (l) { return l.slug === slug; })[0] : null);
      }
    }

    function select(slug) { apply(slug); }
    function reset() { if (selected !== null) apply(null); }

    for (var m = 0; m < groups.length; m++) {
      (function (g) {
        var slug = g.getAttribute('data-slug');
        g.addEventListener('click', function (ev) {
          // Keep the click from reaching the svg-level reset handler below.
          ev.stopPropagation();
          select(slug);
        });
        g.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(slug); }
        });
      })(groups[m]);
    }

    // Clicking any other part of the map — ocean, land, graticule — clears the selection.
    svg.addEventListener('click', reset);
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') reset(); });

    return { select: select, reset: reset, selected: function () { return selected; } };
  };
})();
