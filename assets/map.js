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

    // Every other site, dimmed for context.
    if (all) {
      for (var j = 0; j < all.length; j++) {
        if (all[j].slug === focus.slug) continue;
        s += '<circle class="other-dot" cx="' + px(all[j].lon).toFixed(2) + '" cy="' + py(all[j].lat).toFixed(2) + '" r="2.1"><title>' +
          esc(all[j].customer + ' — ' + all[j].city) + '</title></circle>';
      }
    }

    // Focus marker.
    s += '<circle class="halo pulse" cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r="9"/>';
    s += '<circle class="halo" cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r="9"/>';
    s += '<circle class="pin" cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r="3.6"/>';

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
})();
