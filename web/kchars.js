/* =====================================================================
 * kchars.js — procedural Canvas-2D character art for the Kimetsu fan games
 * (귀멸의 칼날 팬게임 공용 캐릭터 라이브러리). No images, no deps, classic script.
 *
 * Exposes ONE global:  window.KChars
 *
 *   KChars.list
 *     Array of { id, name, style, color, title }
 *       { id:'tanjiro', name:'카마도 탄지로',   style:'water',   color:'#4fb3ff', title:'물의 호흡' }
 *       { id:'zenitsu', name:'아가츠마 젠이츠', style:'thunder', color:'#ffe14d', title:'번개의 호흡' }
 *       { id:'rengoku', name:'렌고쿠 쿄쥬로',   style:'flame',   color:'#ff7a2f', title:'화염의 호흡' }
 *       { id:'inosuke', name:'하시비라 이노스케', style:'beast',  color:'#9fb4c8', title:'짐승의 호흡' }
 *       { id:'nezuko',  name:'카마도 네즈코',   style:'blood',   color:'#ff7fb0', title:'혈귀술' }
 *       { id:'shinobu', name:'코쵸우 시노부',   style:'insect',  color:'#b58cff', title:'벌레의 호흡' }
 *       + the other hashira (주): giyu (water2), tengen (sound), mitsuri (love), muichiro (mist),
 *         gyomei (stone), obanai (serpent), sanemi (wind)
 *       + kanao (flower)
 *     Iterate this list to offer every character (new entries are only ever appended).
 *
 *   KChars.byStyle(style)          -> entry for 'water'|'flame'|'thunder'|'beast'|'blood'|'insect' (or null)
 *   KChars.byId(id)                -> entry for an id (or null)            [extra helper]
 *
 *   KChars.drawBust(ctx, id, cx, cy, h, opts)
 *     Head-and-shoulders portrait centred at (cx,cy), total height h px.
 *     opts: { expr:'normal'|'fierce'|'hurt'|'smile', flip:false, bg:false, unmasked:false }
 *     bg:true draws a soft circular accent backdrop and clips the bust to that circle
 *     (avatar / medallion look, diameter == h).
 *
 *   KChars.drawFigure(ctx, id, x, y, h, opts)
 *     Full-body chibi (~2.6 heads) with feet at (x,y), total height h px (hair tip to feet).
 *     opts: { facing: 1|-1, t: seconds, walk: 0..1|null, swing: null|0..1,
 *             hurt: 0..1, kneel: 0..1, alpha: 0..1, sword: true,
 *             expr: (optional override), trail: true (slash arc while swinging),
 *             unmasked: false (inosuke only) }
 *     swing: 0 = raised back, 0.5 = mid slash (horizontal), 1 = follow-through (down-forward).
 *     nezuko fights barehanded: she never draws a sword (opts.sword is ignored) and `swing`
 *     animates a front kick instead (0 = knee chambered, 0.5 = leg extended forward,
 *     1 = follow-through down-forward) with a pink crescent trail unless trail === false.
 *     Default pose (swing null): ready stance, blade forward-down.
 *     The blade can reach ~0.7h in front of x; raised blade can reach ~1.2h above y.
 *
 *   KChars.drawChibiTop(ctx, id, x, y, h, opts)
 *     Tiny 3/4 top-down sprite (reads at 28–48 px). (x,y) = feet/ground centre, h = total height.
 *     opts: { ang: radians (0 = right, PI/2 = down), t: seconds, moving: bool, alpha: 0..1,
 *             sword: true, hurt: 0..1, unmasked: false }
 *     Blade points along `ang` (reaches ~0.7h from the body centre; nezuko has no blade and
 *     reaches both clawed hands forward along `ang` instead). When ang points "up"
 *     (away from camera) the back of the head is shown and the blade is drawn behind.
 *
 *   KChars.bustDataURL(id, px, opts)
 *     Renders drawBust into a px×px offscreen canvas (bg:true unless opts.bg === false)
 *     and returns a PNG data URL. Results are cached by (id, px, expr, flip, bg, unmasked).
 *
 *   Every draw* call also accepts opts.cache (default true), see "Performance".
 *
 *   KChars.clearCache()            drop all cached bitmaps (e.g. on level change / DPR change)
 *   KChars.setCacheLimit(pixels)   LRU budget in device pixels (default 6e6 ≈ 24 MB)
 *   KChars.cacheStats()            { entries, pixels, limit }
 *
 * Performance
 *   Live vector drawing costs ~0.13–0.3 ms per figure/bust (hundreds of path ops), so by
 *   default every call renders into an offscreen bitmap keyed by
 *   (id, device-pixel size, quantised pose) and later calls are a single drawImage
 *   (~3–5 µs measured, desktop Edge). Quantisation: walk 8 frames, swing 21 steps,
 *   idle breathing 8 frames, kneel/hurt 5 levels, chibi angle 32 directions ×
 *   6 step frames (moving) / 4 breathing frames (idle). facing:-1 and bust flip reuse the
 *   same bitmap mirrored. The device scale is read from ctx.getTransform(), so scaled /
 *   high-DPR contexts stay crisp (quantised to 0.25, capped at 3x).
 *   Pass { cache:false } for exact live drawing (e.g. continuously varying sizes).
 *   Vary `h` continuously (zoom tweens) → prefer cache:false or round h, otherwise many
 *   bitmaps get created (the LRU keeps memory bounded either way).
 *
 * Notes
 *   - All draw calls save/restore the context; transforms, alpha, composite, dash,
 *     line styles etc. never leak.
 *   - globalAlpha already set on ctx is respected (multiplied).
 *   - alpha < 1 fades the figure as one image (no overlapping-part seams).
 *   - hurt > 0 tints the figure red (and flinches it back, 'hurt' face when > 0.3).
 *   - Default expression in drawFigure: 'fierce' while swinging, 'hurt' when hurt > 0.3.
 *   - nezuko's mouth is hidden by her bamboo muzzle, so her expressions read through the eyes
 *     (smile = closed happy eyes, hurt = > <, fierce = narrowed eyes + faint temple veins).
 *     shinobu's 'normal' face is her soft closed-mouth smile.
 *   - No shadowBlur, no filters; gradients are created once and shared.
 *   - Bounding boxes (for culling): figure x ± 0.82h, y - 1.12h .. y + 0.12h;
 *     chibi x ± 0.85h, y - 1.3h .. y + 0.42h; bust cx ± 0.55h, cy - 0.68h .. cy + 0.58h.
 * ===================================================================== */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var OUT = '#120a10';
  var SKIN = '#ffe3c8', SKIN_SH = '#f1bf9c';
  var UNI = '#1c1c2a', UNI_HI = '#2e2e44';
  var LW = 0.05;        // current outline width in local units
  var SWAY = 0;         // current hair sway
  var LOD = 0;          // 0 full detail, 1 simplified (tiny sprites)

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function setLW(s) { LW = Math.max(0.045, 1.0 / s); }

  // ---------- cached gradients (created once, reused on any context) ----------
  var _gctx = null, GC = {};
  function gctx() {
    if (!_gctx) _gctx = document.createElement('canvas').getContext('2d');
    return _gctx;
  }
  function addStops(g, st) { for (var i = 0; i < st.length; i++) g.addColorStop(st[i][0], st[i][1]); return g; }
  function lg(x0, y0, x1, y1, st) { return addStops(gctx().createLinearGradient(x0, y0, x1, y1), st); }
  function rg(x0, y0, r0, x1, y1, r1, st) { return addStops(gctx().createRadialGradient(x0, y0, r0, x1, y1, r1), st); }
  function grad(key, fn) { var g = GC[key]; if (!g) g = GC[key] = fn(); return g; }

  // ---------- path helpers ----------
  function stroke(ctx, w) { ctx.lineWidth = (w == null ? 1 : w) * LW; ctx.strokeStyle = OUT; ctx.stroke(); }
  function fs(ctx, fill, w) { ctx.fillStyle = fill; ctx.fill(); if (w !== 0) stroke(ctx, w); }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function poly(ctx, p) {
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
  }
  // Closed path through points with each edge bowed by `b` (fraction of edge length).
  // Points far from the head centre (tips) are displaced by the current hair sway.
  function curvy(ctx, p, b, open) {
    var n = p.length, i, ax, ay, bx, by, mx, my, dx, dy;
    function X(k) { var x = p[k], y = p[k + 1]; return (x * x + y * y > 1.7) ? x + SWAY * (y < 0 ? -y : 0.4) : x; }
    ctx.beginPath(); ctx.moveTo(X(0), p[1]);
    var end = open ? n - 2 : n;
    for (i = 0; i < end; i += 2) {
      var j = (i + 2) % n;
      ax = X(i); ay = p[i + 1]; bx = X(j); by = p[j + 1];
      mx = (ax + bx) / 2; my = (ay + by) / 2; dx = bx - ax; dy = by - ay;
      var bb = typeof b === 'number' ? b : b[(i >> 1) % b.length];
      ctx.quadraticCurveTo(mx - dy * bb, my + dx * bb, bx, by);
    }
    if (!open) ctx.closePath();
  }
  // Tapered limb with round ends (for sleeves / arms)
  function limb(ctx, x1, y1, x2, y2, w1, w2) {
    var a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
    ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
    ctx.arc(x2, y2, w2, a + Math.PI / 2, a - Math.PI / 2, true);
    ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
    ctx.arc(x1, y1, w1, a - Math.PI / 2, a + Math.PI / 2, true);
    ctx.closePath();
  }
  // stroke-with-outline (for legs)
  function oline(ctx, w, col) {
    ctx.lineWidth = w + LW * 2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
  }

  // ---------- haori patterns (fill a rect; caller clips) ----------
  function patChecker(ctx, x0, y0, x1, y1, cell) {
    ctx.fillStyle = '#1f7a4a'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    var i0 = Math.floor(x0 / cell), i1 = Math.ceil(x1 / cell), j0 = Math.floor(y0 / cell), j1 = Math.ceil(y1 / cell);
    ctx.beginPath();
    for (var j = j0; j < j1; j++) for (var i = i0; i < i1; i++) if (((i + j) & 1) === 0) ctx.rect(i * cell, j * cell, cell, cell);
    ctx.fillStyle = '#121214'; ctx.fill();
  }
  function patTriangles(ctx, x0, y0, x1, y1, cell) {
    ctx.fillStyle = grad('zenHaori', function () { return lg(0, -3.2, 0, -0.6, [[0, '#ffc23e'], [1, '#f39a1c']]); });
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    var ch = cell * 0.9;
    var i0 = Math.floor(x0 / cell) - 1, i1 = Math.ceil(x1 / cell) + 1, j0 = Math.floor(y0 / ch), j1 = Math.ceil(y1 / ch);
    ctx.beginPath();
    for (var j = j0; j < j1; j++) {
      var off = (j & 1) ? cell / 2 : 0, yb = (j + 1) * ch, yt = j * ch;
      for (var i = i0; i < i1; i++) {
        var xl = i * cell + off;
        ctx.moveTo(xl, yb); ctx.lineTo(xl + cell / 2, yt); ctx.lineTo(xl + cell, yb); ctx.closePath();
      }
    }
    ctx.fillStyle = '#fffbee'; ctx.fill();
  }
  function patFlame(ctx, x0, y0, x1, y1, hemY, fh) {
    ctx.fillStyle = '#f7f3ea'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    fh = fh || 0.7;
    var step = fh * 0.55, k = 0, x;
    ctx.beginPath(); ctx.moveTo(x0, hemY + 1);
    for (x = x0; x < x1 + step; x += step, k++) {
      var hh = fh * (0.65 + 0.35 * ((k * 7) % 3) / 2);
      ctx.lineTo(x, hemY - fh * 0.2);
      ctx.quadraticCurveTo(x + step * 0.1, hemY - hh * 0.6, x + step * 0.55, hemY - hh);
      ctx.quadraticCurveTo(x + step * 0.35, hemY - hh * 0.45, x + step, hemY - fh * 0.2);
    }
    ctx.lineTo(x1 + step, hemY + 1); ctx.closePath();
    ctx.fillStyle = '#d8262a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0, hemY + 1); k = 0;
    for (x = x0; x < x1 + step; x += step, k++) {
      var h2 = fh * (0.35 + 0.2 * ((k * 5) % 3) / 2);
      ctx.lineTo(x + step * 0.1, hemY);
      ctx.quadraticCurveTo(x + step * 0.25, hemY - h2 * 0.6, x + step * 0.55, hemY - h2);
      ctx.quadraticCurveTo(x + step * 0.45, hemY - h2 * 0.4, x + step * 0.95, hemY);
    }
    ctx.lineTo(x1 + step, hemY + 1); ctx.closePath();
    ctx.fillStyle = '#ff9a2a'; ctx.fill();
  }

  // ---------- face ----------
  function facePath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-1, -0.15);
    ctx.bezierCurveTo(-1, -1.25, 1, -1.25, 1, -0.15);
    ctx.bezierCurveTo(1, 0.45, 0.55, 0.97, 0, 1.03);
    ctx.bezierCurveTo(-0.55, 0.97, -1, 0.45, -1, -0.15);
    ctx.closePath();
  }
  var EW = 0.27, EH = 0.31;
  function eyeLid(ctx, sl) {
    ctx.beginPath(); ctx.moveTo(EW, -EH * 0.05);
    ctx.bezierCurveTo(EW * 0.8, -EH * 1.25, -EW * 0.75, -EH * 1.2 + sl, -EW, -EH * 0.1 + sl * 0.55);
  }
  function eyeShape(ctx, sl) {
    eyeLid(ctx, sl);
    ctx.bezierCurveTo(-EW * 0.95, EH * 1.2, EW * 0.85, EH * 1.25, EW, -EH * 0.05);
    ctx.closePath();
  }
  function drawEye(ctx, c, side, expr, fx) {
    ctx.save();
    ctx.translate(side * 0.43 + fx, 0.2); ctx.scale(side, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (expr === 'smile') {
      ctx.beginPath(); ctx.moveTo(-EW * 0.9, EH * 0.25); ctx.quadraticCurveTo(0, -EH * 0.9, EW * 0.95, EH * 0.25);
      stroke(ctx, 2.2);
    } else if (expr === 'hurt') {
      ctx.beginPath(); ctx.moveTo(EW * 0.8, -EH * 0.6); ctx.lineTo(-EW * 0.6, 0); ctx.lineTo(EW * 0.8, EH * 0.55);
      stroke(ctx, 2.2);
    } else {
      var sl = expr === 'fierce' ? EH * 0.75 : (c.eyeSlant || 0);
      var lx = fx * 0.5 * side;
      eyeShape(ctx, sl); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.save(); ctx.clip();
      var rIris = side > 0 && c.irisGradR;
      ell(ctx, lx, EH * 0.12, EW * 0.74, EH * 0.95); ctx.fillStyle = grad(c.id + (rIris ? 'irisR' : 'iris'), rIris ? c.irisGradR : c.irisGrad); ctx.fill();
      if (!LOD) { ctx.lineWidth = LW * 0.8; ctx.strokeStyle = c.irisLine; ctx.stroke(); }
      ell(ctx, lx, EH * 0.2, EW * c.pupil, EH * c.pupil * 1.3); ctx.fillStyle = c.pupilCol; ctx.fill();
      ell(ctx, lx - side * EW * 0.28, -EH * 0.25, EW * 0.25, EH * 0.23); ctx.fillStyle = c.eyeHi || '#fff'; ctx.fill();
      if (!LOD) { ell(ctx, lx + side * EW * 0.3, EH * 0.52, EW * 0.11, EH * 0.1); ctx.fill(); }
      var sleepy = c.sleepy && expr === 'normal';
      if (sleepy) {
        // droopy half-closed upper lid that sags in the middle (soft, sleepy — not a glare)
        ctx.fillStyle = c.skin || SKIN;
        ctx.beginPath(); ctx.moveTo(-EW * 1.6, -EH * 1.8); ctx.lineTo(EW * 1.6, -EH * 1.8); ctx.lineTo(EW * 1.6, -EH * 0.05);
        ctx.lineTo(EW * 1.1, EH * 0.05); ctx.quadraticCurveTo(0, -EH * 0.35, -EW * 1.1, EH * 0.05);
        ctx.lineTo(-EW * 1.6, EH * 0.05); ctx.closePath(); ctx.fill();
        ell(ctx, lx - side * EW * 0.25, EH * 0.3, EW * 0.18, EH * 0.16); ctx.fillStyle = '#fff'; ctx.fill();   // sparkle below the lid
      }
      ctx.restore();
      if (sleepy) {
        ctx.save(); ctx.beginPath(); ctx.rect(-EW * 2, 0, EW * 4, EH * 3); ctx.clip();
        eyeShape(ctx, sl); stroke(ctx, 0.8); ctx.restore();
        ctx.beginPath(); ctx.moveTo(-EW * 1.08, EH * 0.05); ctx.quadraticCurveTo(0, -EH * 0.35, EW * 1.08, EH * 0.05);
        stroke(ctx, LOD ? 1.5 : 1.7);
        ctx.restore();
        return;
      }
      eyeShape(ctx, sl); stroke(ctx, 0.8);
      eyeLid(ctx, sl); stroke(ctx, LOD ? 1.6 : 2.2);
      if (!LOD) {
        ctx.beginPath(); ctx.moveTo(EW * 0.62, -EH * 0.8); ctx.lineTo(EW * 1.3, -EH * 0.62); ctx.lineTo(EW * 0.98, -EH * 0.08);
        ctx.closePath(); ctx.fillStyle = OUT; ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawBrows(ctx, c, expr, fx) {
    var inner = 0, outer = 0;
    if (expr === 'fierce') { inner = 0.13; outer = -0.07; }
    else if (expr === 'hurt') { inner = -0.1; outer = 0.06; }
    else if (expr === 'smile') { inner = -0.05; outer = -0.03; }
    else if (c.sleepy) { inner = -0.09; outer = 0.03; }   // relaxed, slightly raised (sleepy, not cross)
    for (var side = -1; side <= 1; side += 2) {
      ctx.save(); ctx.translate(side * 0.43 + fx, 0.2); ctx.scale(side, 1);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      c.brow(ctx, -EH - 0.2 + (c.browY || 0), inner, outer);
      ctx.restore();
    }
  }
  function browThin(col) {
    return function (ctx, by, inr, out) {
      ctx.beginPath(); ctx.moveTo(-EW * 0.85, by + inr);
      ctx.quadraticCurveTo(0.02, by - 0.08 + (inr + out) / 2, EW * 1.0, by + out + 0.03);
      ctx.lineWidth = LW * 2.4 + 0.02; ctx.strokeStyle = col; ctx.stroke();
    };
  }
  function drawMouth(ctx, c, expr, fx) {
    var m = expr === 'normal' ? (c.sleepy ? 'sleepy' : (c.mouth || 'line')) : expr;
    var x = fx * 0.8;
    ctx.save(); ctx.translate(x, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (m === 'line') {
      ctx.beginPath(); ctx.moveTo(-0.11, 0.67); ctx.quadraticCurveTo(0, 0.73, 0.11, 0.67); stroke(ctx, 1.2);
    } else if (m === 'sleepy') {
      ell(ctx, 0.02, 0.7, 0.07, 0.06); ctx.fillStyle = '#7a2230'; ctx.fill(); stroke(ctx, 0.9);
    } else if (m === 'soft') {
      // gentle closed-mouth smile (shinobu)
      ctx.beginPath(); ctx.moveTo(-0.15, 0.64); ctx.quadraticCurveTo(0, 0.76, 0.15, 0.64); stroke(ctx, 1.2);
    } else if (m === 'worry') {
      ctx.beginPath(); ctx.moveTo(-0.12, 0.7); ctx.quadraticCurveTo(-0.06, 0.64, 0, 0.69); ctx.quadraticCurveTo(0.06, 0.74, 0.12, 0.68); stroke(ctx, 1.2);
    } else if (m === 'smile' || m === 'grin') {
      var w = m === 'grin' ? 0.3 : 0.2, d = m === 'grin' ? 0.9 : 0.86;
      ctx.beginPath(); ctx.moveTo(-w, 0.6); ctx.quadraticCurveTo(0, 0.66, w, 0.6);
      ctx.quadraticCurveTo(w * 0.8, d, 0, d); ctx.quadraticCurveTo(-w * 0.8, d, -w, 0.6); ctx.closePath();
      ctx.fillStyle = '#6e1420'; ctx.fill();
      ctx.save(); ctx.clip();
      if (m === 'grin') { ctx.fillStyle = '#fff'; ctx.fillRect(-w, 0.55, w * 2, 0.1); }
      ell(ctx, 0, d, w * 0.6, 0.12); ctx.fillStyle = '#e8707a'; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-w, 0.6); ctx.quadraticCurveTo(0, 0.66, w, 0.6);
      ctx.quadraticCurveTo(w * 0.8, d, 0, d); ctx.quadraticCurveTo(-w * 0.8, d, -w, 0.6); ctx.closePath();
      stroke(ctx, 1);
    } else if (m === 'fierce') {
      ctx.beginPath(); ctx.moveTo(-0.2, 0.6); ctx.lineTo(0.2, 0.6); ctx.quadraticCurveTo(0.17, 0.86, 0, 0.86);
      ctx.quadraticCurveTo(-0.17, 0.86, -0.2, 0.6); ctx.closePath();
      ctx.fillStyle = '#5a0f18'; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-0.2, 0.58, 0.4, 0.08); ctx.restore();
      stroke(ctx, 1);
    } else if (m === 'hurt') {
      ctx.beginPath(); ctx.moveTo(-0.17, 0.63); ctx.lineTo(0.17, 0.63); ctx.lineTo(0.15, 0.76); ctx.lineTo(-0.15, 0.76); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); stroke(ctx, 1);
      ctx.beginPath(); ctx.moveTo(-0.16, 0.695); ctx.lineTo(0.16, 0.695); stroke(ctx, 0.7);
    }
    ctx.restore();
  }
  function sweat(ctx) {
    ctx.beginPath(); ctx.moveTo(0.86, -0.55);
    ctx.quadraticCurveTo(0.98, -0.28, 0.9, -0.2); ctx.quadraticCurveTo(0.78, -0.18, 0.78, -0.3);
    ctx.quadraticCurveTo(0.78, -0.4, 0.86, -0.55); ctx.closePath();
    fs(ctx, '#bfe8ff', 0.8);
  }

  function drawHead(ctx, c, expr, t, fx, opt) {
    SWAY = Math.sin((t || 0) * 2.4) * 0.035;
    opt = opt || {};
    if (c.head && !opt.unmasked) { c.head(ctx, expr, fx, opt); return; }
    var gb = grad(c.id + 'hb', c.gradBack), gf = grad(c.id + 'hf', c.gradFront);
    if (opt.back) {
      c.pathBack(ctx); fs(ctx, gb, 1);
      ctx.save(); ctx.scale(1.02, 1.0); facePath(ctx); ctx.restore(); ctx.fillStyle = gf; ctx.fill();
      c.pathBack(ctx); ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.moveTo(0, -1.1); ctx.quadraticCurveTo(-0.2, -0.2, -0.1, 0.8); ctx.moveTo(0.4, -1.0); ctx.quadraticCurveTo(0.5, -0.2, 0.4, 0.7);
      ctx.lineWidth = LW; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke(); ctx.restore();
      if (c.overBack) c.overBack(ctx);
      return;
    }
    if (c.behindHead) c.behindHead(ctx, expr);
    c.pathBack(ctx); fs(ctx, gb, 1);
    // ears
    ell(ctx, -0.97, 0.22, 0.15, 0.21); fs(ctx, SKIN, 1);
    ell(ctx, 0.97, 0.22, 0.15, 0.21); fs(ctx, SKIN, 1);
    facePath(ctx); ctx.fillStyle = c.skin || SKIN; ctx.fill();
    // shading: hair shadow + cheek/jaw shade
    ctx.save(); ctx.clip();
    ctx.translate(0.02, 0.1); c.pathFront(ctx); ctx.fillStyle = c.skinSh || SKIN_SH; ctx.fill();
    ctx.restore();
    facePath(ctx); stroke(ctx, 1);
    if (expr === 'smile' || c.blush || (c.sleepy && expr === 'normal')) {
      ctx.fillStyle = 'rgba(255,110,120,0.32)';
      ell(ctx, -0.6 + fx, 0.52, 0.17, 0.08); ctx.fill();
      ell(ctx, 0.6 + fx, 0.52, 0.17, 0.08); ctx.fill();
    }
    if (c.underBangs) c.underBangs(ctx, expr);
    drawEye(ctx, c, -1, expr, fx);
    drawEye(ctx, c, 1, expr, fx);
    if (!LOD) { ctx.beginPath(); ctx.moveTo(0.02 + fx, 0.42); ctx.lineTo(-0.02 + fx, 0.47); ctx.lineCap = 'round'; ctx.lineWidth = LW * 0.9; ctx.strokeStyle = '#c98a70'; ctx.stroke(); }
    if (!c.noMouth) drawMouth(ctx, c, expr, fx);
    if (c.sleepy && expr === 'normal' && !LOD) {
      var bx = 0.15 + fx, by = 0.55;   // snot bubble hanging from the nostril
      circ(ctx, bx, by, 0.12); ctx.fillStyle = 'rgba(190,230,255,0.55)'; ctx.fill();
      ctx.lineWidth = LW * 0.9; ctx.strokeStyle = 'rgba(120,180,230,0.9)'; ctx.stroke();
      circ(ctx, bx - 0.035, by - 0.04, 0.035); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
    }
    c.pathFront(ctx); ctx.fillStyle = gf; ctx.fill();
    c.pathFront(ctx, true); stroke(ctx, 1);
    if (c.hairDetail && !LOD) c.hairDetail(ctx);
    drawBrows(ctx, c, expr, fx);
    if (c.overHead) c.overHead(ctx, expr, fx);
    if (expr === 'hurt' && !LOD) sweat(ctx);
  }

  // =====================================================================
  //  CHARACTERS
  // =====================================================================
  var C = {};

  // ---------------- TANJIRO ----------------
  C.tanjiro = {
    id: 'tanjiro', name: '카마도 탄지로', style: 'water', color: '#4fb3ff', title: '물의 호흡',
    gradBack: function () { return rg(0, -0.2, 0.4, 0, -0.2, 1.65, [[0, '#1a090c'], [0.62, '#2a0f12'], [1, '#8e2429']]); },
    gradFront: function () { return lg(0, -1.2, 0, 0.3, [[0, '#1a090c'], [0.55, '#2d1014'], [1, '#86232a']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-1.02, 0.45, -1.3, 0.2, -1.12, -0.12, -1.46, -0.4, -1.16, -0.62, -1.38, -1.02, -0.9, -1.0,
        -0.88, -1.48, -0.44, -1.2, -0.14, -1.6, 0.12, -1.24, 0.56, -1.52, 0.64, -1.12, 1.12, -1.24, 1.04, -0.82,
        1.44, -0.66, 1.16, -0.4, 1.42, -0.04, 1.12, 0.12, 1.28, 0.42, 1.02, 0.45, 0, 0.3], 0.1);
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.08, -0.1, 1.02, 0.36, 0.84, -0.3, 0.64, -0.02, 0.48, -0.45, 0.28, -0.1, 0.12, -0.52, -0.04, -0.2,
        -0.2, -0.78, -0.5, -0.86, -0.74, -0.22, -0.84, -0.45, -1.02, 0.36, -1.08, -0.1], 0.05, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.18, -1.5, 1.18, -1.5, 1.08, -0.1);
      ctx.closePath();
    },
    hairDetail: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(0.35, -1.12); ctx.quadraticCurveTo(0.45, -0.7, 0.35, -0.32);
      ctx.moveTo(-0.1, -1.18); ctx.quadraticCurveTo(0.05, -0.7, 0.02, -0.35);
      ctx.moveTo(0.75, -0.9); ctx.quadraticCurveTo(0.85, -0.5, 0.78, -0.2);
      ctx.lineWidth = LW * 0.8; ctx.strokeStyle = 'rgba(255,120,120,0.28)'; ctx.stroke();
    },
    underBangs: function (ctx) {
      // burgundy flame-like birthmark, upper-left forehead
      ctx.beginPath();
      ctx.moveTo(-0.64, -0.36); ctx.quadraticCurveTo(-0.62, -0.58, -0.5, -0.66); ctx.quadraticCurveTo(-0.46, -0.54, -0.42, -0.5);
      ctx.quadraticCurveTo(-0.38, -0.66, -0.3, -0.74); ctx.quadraticCurveTo(-0.24, -0.56, -0.28, -0.42);
      ctx.quadraticCurveTo(-0.36, -0.34, -0.46, -0.36); ctx.quadraticCurveTo(-0.56, -0.3, -0.64, -0.36); ctx.closePath();
      ctx.fillStyle = '#9a2430'; ctx.fill();
    },
    overHead: function (ctx) {
      for (var s = -1; s <= 1; s += 2) {
        var x = s * 1.0;
        ctx.beginPath(); ctx.moveTo(x, 0.36); ctx.lineTo(x, 0.5); stroke(ctx, 0.8);
        ctx.beginPath(); ctx.rect(x - 0.1, 0.48, 0.2, 0.36); fs(ctx, '#fbf7ec', 0.9);
        circ(ctx, x, 0.61, 0.07); ctx.fillStyle = '#d8262a'; ctx.fill();
        if (!LOD) {
          ctx.beginPath(); ctx.moveTo(x - 0.07, 0.72); ctx.lineTo(x - 0.07, 0.8); ctx.moveTo(x, 0.72); ctx.lineTo(x, 0.81); ctx.moveTo(x + 0.07, 0.72); ctx.lineTo(x + 0.07, 0.8);
          ctx.lineWidth = LW * 0.7; ctx.strokeStyle = '#d8262a'; ctx.stroke();
        }
      }
    },
    irisGrad: function () { return lg(0, -EH, 0, EH * 1.1, [[0, '#2e070d'], [0.55, '#7e1c28'], [1, '#d0525c']]); },
    irisLine: '#3a0a10', pupilCol: '#1a0508', pupil: 0.34,
    brow: browThin('#4a1218'),
    mouth: 'line',
    haori: function (ctx, x0, y0, x1, y1, hem, sc) { patChecker(ctx, x0, y0, x1, y1, 0.3 * (sc || 1)); },
    sleeve: '#1f7a4a',
    blade: 'black', guard: '#1a1a1a', hilt: '#2a2a36', trailMix: 0.45
  };

  // ---------------- ZENITSU ----------------
  C.zenitsu = {
    id: 'zenitsu', name: '아가츠마 젠이츠', style: 'thunder', color: '#ffe14d', title: '번개의 호흡',
    gradBack: function () { return lg(0, -1.5, 0, 0.8, [[0, '#ffe46a'], [0.5, '#ffd23e'], [1, '#ff8f22']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.55, [[0, '#ffe870'], [0.55, '#ffd84a'], [1, '#ff9a2a']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-0.86, 0.8, -1.0, 0.45, -1.36, 0.72, -1.12, 0.18, -1.52, 0.04, -1.16, -0.3, -1.46, -0.62, -1.05, -0.8,
        -1.16, -1.26, -0.62, -1.22, -0.46, -1.62, -0.1, -1.32, 0.2, -1.68, 0.42, -1.3, 0.86, -1.52, 0.95, -1.05,
        1.42, -0.76, 1.16, -0.35, 1.52, -0.04, 1.12, 0.18, 1.36, 0.7, 0.98, 0.45, 0.86, 0.8, 0, 0.4], 0.03);
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.1, -0.05, 1.06, 0.64, 0.84, -0.12, 0.7, 0.1, 0.52, -0.4, 0.34, -0.04, 0.16, -0.48, -0.02, -0.06,
        -0.2, -0.5, -0.38, -0.08, -0.54, -0.42, -0.7, 0.1, -0.85, -0.12, -1.06, 0.64, -1.1, -0.05], 0.03, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.2, -1.45, 1.2, -1.45, 1.1, -0.05);
      ctx.closePath();
    },
    hairDetail: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-0.7, -0.78); ctx.quadraticCurveTo(-0.3, -1.12, 0.35, -1.06); ctx.lineTo(0.2, -0.96); ctx.lineTo(0.05, -0.99);
      ctx.lineTo(-0.1, -0.9); ctx.lineTo(-0.3, -0.94); ctx.lineTo(-0.45, -0.82); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,225,0.6)'; ctx.fill();
    },
    irisGrad: function () { return lg(0, -EH, 0, EH * 1.1, [[0, '#6a3a00'], [0.5, '#c07a10'], [1, '#ffcf50']]); },
    irisLine: '#5a3000', pupilCol: '#2a1600', pupil: 0.26,
    brow: function (ctx, by, inr, out) {
      ctx.beginPath(); ctx.moveTo(-EW * 0.7, by + inr + 0.02); ctx.lineTo(EW * 0.3, by + (inr + out) / 2 - 0.02);
      ctx.lineWidth = 0.13 + LW * 2; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = 0.13; ctx.strokeStyle = '#ffb52a'; ctx.stroke();
    },
    browY: 0.02,
    sleepy: true,   // 'normal' face uses half-closed sleepy eyes
    mouth: 'worry',
    haori: function (ctx, x0, y0, x1, y1, hem, sc, fsc) { patTriangles(ctx, x0, y0, x1, y1, (fsc ? 0.34 : 0.42) * (sc || 1)); },
    sleeve: '#ffb12e',
    blade: 'thunder', guard: '#e6b422', hilt: '#3a2a10', trailMix: 0.3
  };

  // ---------------- RENGOKU ----------------
  C.rengoku = {
    id: 'rengoku', name: '렌고쿠 쿄쥬로', style: 'flame', color: '#ff7a2f', title: '화염의 호흡',
    gradBack: function () { return rg(0, -0.35, 0.6, 0, -0.35, 2.05, [[0, '#ffe066'], [0.4, '#ffc93a'], [0.72, '#ff8a2a'], [1, '#d8262a']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.5, [[0, '#ffe066'], [0.5, '#ffc93a'], [1, '#e0402a']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-0.95, 0.6, -1.6, 0.4, -1.18, -0.05, -1.95, -0.5, -1.25, -0.62, -1.7, -1.35, -0.9, -1.1,
        -0.85, -1.95, -0.3, -1.38, 0.05, -2.1, 0.3, -1.38, 0.92, -1.92, 0.88, -1.1, 1.68, -1.3, 1.25, -0.62,
        1.95, -0.45, 1.18, -0.05, 1.6, 0.42, 0.95, 0.6, 0, 0.3], [-0.14, 0.14]);
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.08, -0.05, 1.0, 0.62, 0.8, -0.2, 0.58, -0.1, 0.4, -0.55, 0.18, -0.3, 0.02, -0.64, -0.18, -0.3,
        -0.34, -0.6, -0.56, -0.12, -0.8, -0.2, -1.0, 0.62, -1.08, -0.05], 0.08, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.2, -1.5, 1.2, -1.5, 1.08, -0.05);
      ctx.closePath();
    },
    hairDetail: function (ctx) {
      // crimson streaks in the flame hair (clipped to the hair mass)
      ctx.save(); this.pathBack(ctx); ctx.clip();
      ctx.beginPath();
      ctx.moveTo(-0.3, -1.2); ctx.quadraticCurveTo(-0.45, -1.5, -0.4, -1.8);
      ctx.moveTo(0.35, -1.2); ctx.quadraticCurveTo(0.6, -1.5, 0.78, -1.72);
      ctx.moveTo(-0.95, -0.85); ctx.quadraticCurveTo(-1.3, -0.95, -1.55, -1.0);
      ctx.moveTo(1.0, -0.6); ctx.quadraticCurveTo(1.3, -0.62, 1.6, -0.6);
      ctx.lineWidth = LW * 1.8; ctx.strokeStyle = 'rgba(216,38,42,0.7)'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    },
    irisGrad: function () { return rg(0, EH * 0.12, 0, 0, EH * 0.12, EH * 0.95, [[0, '#fff6b0'], [0.45, '#ffd23a'], [0.78, '#ff8a2a'], [1, '#c41818']]); },
    irisLine: '#8a1010', pupilCol: '#3a0a00', pupil: 0.16,
    brow: function (ctx, by, inr, out) {
      // forked brow: base + two branches
      ctx.beginPath();
      ctx.moveTo(-EW * 0.85, by + inr); ctx.quadraticCurveTo(EW * 0.2, by - 0.1 + inr * 0.5, EW * 1.2, by + out - 0.14);
      ctx.moveTo(-EW * 0.4, by + inr * 0.8 + 0.02); ctx.quadraticCurveTo(EW * 0.4, by + 0.02 + inr * 0.3, EW * 1.05, by + out + 0.06);
      ctx.lineWidth = 0.09 + LW * 2; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = 0.09; ctx.strokeStyle = '#e8342a'; ctx.stroke();
    },
    browY: -0.02,
    mouth: 'grin',
    haori: function (ctx, x0, y0, x1, y1, hem, sc, fsc) { patFlame(ctx, x0, y0, x1, y1, hem, 0.75 * (sc || 1) * (fsc || 1)); },
    sleeve: '#f7f3ea',
    blade: 'flame', guard: '#e04020', hilt: '#3a1a10', trailMix: 0.12
  };

  // ---------------- INOSUKE ----------------
  C.inosuke = {
    id: 'inosuke', name: '하시비라 이노스케', style: 'beast', color: '#9fb4c8', title: '짐승의 호흡',
    skin: '#f3d3b0', skinSh: '#e0b48e',
    // unmasked face data
    gradBack: function () { return lg(0, -1.4, 0, 1.6, [[0, '#1a2233'], [0.6, '#22304a'], [1, '#2f5590']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.4, [[0, '#1a2233'], [1, '#2f5590']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-1.0, 0.2, -1.3, 1.5, -1.0, 1.1, -0.9, 1.6, -0.7, 0.9, 0.7, 0.9, 0.9, 1.6, 1.0, 1.1, 1.3, 1.5, 1.0, 0.2,
        1.2, -0.6, 1.0, -1.1, 0.4, -1.42, -0.4, -1.42, -1.0, -1.1, -1.2, -0.6], 0.06);
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.08, -0.1, 1.02, 0.5, 0.82, -0.3, 0.55, -0.1, 0.35, -0.62, 0.05, -0.2, -0.1, -0.62, -0.4, -0.14,
        -0.6, -0.55, -0.82, -0.25, -1.02, 0.5, -1.08, -0.1], 0.05, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.18, -1.45, 1.18, -1.45, 1.08, -0.1);
      ctx.closePath();
    },
    irisGrad: function () { return lg(0, -EH, 0, EH * 1.1, [[0, '#08361e'], [0.55, '#1f8a4a'], [1, '#7fe0a0']]); },
    irisLine: '#05301a', pupilCol: '#04200f', pupil: 0.3,
    brow: browThin('#1a2233'),
    mouth: 'line',
    haori: null, sleeve: '#f3d3b0',
    blade: 'jagged', guard: '#5a6878', hilt: '#3a3f4a', trailMix: 0.4,
    head: function (ctx, expr, fx, opt) { drawBoar(ctx, expr, fx, opt); }
  };

  function drawBoar(ctx, expr, fx, opt) {
    var fur = grad('boarFur', function () { return rg(0, -0.5, 0.2, 0, -0.1, 1.5, [[0, '#ab9b8d'], [0.6, '#877769'], [1, '#54473e']]); });
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // ears
    for (var s = -1; s <= 1; s += 2) {
      poly(ctx, [s * 0.55, -1.05, s * 1.25, -1.62, s * 1.08, -0.72]); fs(ctx, '#6a5a4e', 1);
      poly(ctx, [s * 0.72, -1.02, s * 1.12, -1.4, s * 1.02, -0.86]); ctx.fillStyle = '#3a2d27'; ctx.fill();
    }
    // head (fur) with jagged lower fringe
    curvy(ctx, [-1.12, 0.6, -0.9, 0.78, -0.95, 1.05, -0.62, 0.88, -0.5, 1.12, -0.25, 0.9, 0, 1.12, 0.25, 0.9, 0.5, 1.12,
      0.62, 0.88, 0.95, 1.05, 0.9, 0.78, 1.12, 0.6, 1.22, -0.1, 1.08, -0.85, 0.6, -1.3, 0, -1.4, -0.6, -1.3, -1.08, -0.85, -1.22, -0.1], 0.08);
    fs(ctx, fur, 1);
    if (opt.back) {
      ctx.beginPath(); ctx.moveTo(-0.4, -1.1); ctx.lineTo(-0.3, 0.6); ctx.moveTo(0, -1.3); ctx.lineTo(0, 0.8); ctx.moveTo(0.4, -1.1); ctx.lineTo(0.3, 0.6);
      ctx.lineWidth = LW * 1.4; ctx.strokeStyle = '#4a3d35'; ctx.stroke();
      return;
    }
    // dark mane stripe down the forehead
    ctx.beginPath(); ctx.moveTo(-0.32, -1.3); ctx.lineTo(-0.18, -0.9); ctx.lineTo(-0.28, -0.7); ctx.lineTo(0, -0.3); ctx.lineTo(0.28, -0.7);
    ctx.lineTo(0.18, -0.9); ctx.lineTo(0.32, -1.3); ctx.closePath(); ctx.fillStyle = '#4a3d35'; ctx.fill();
    if (!LOD) {
      ctx.beginPath();
      ctx.moveTo(-0.8, -0.6); ctx.lineTo(-0.62, -0.5); ctx.moveTo(-0.95, -0.25); ctx.lineTo(-0.78, -0.2);
      ctx.moveTo(0.8, -0.6); ctx.lineTo(0.62, -0.5); ctx.moveTo(0.95, -0.25); ctx.lineTo(0.78, -0.2);
      ctx.lineWidth = LW; ctx.strokeStyle = '#4a3d35'; ctx.stroke();
    }
    // eyes (sockets with pale-blue glint)
    var sl = expr === 'fierce' ? 0.1 : 0;
    for (s = -1; s <= 1; s += 2) {
      var ex = s * 0.46 + fx * 0.6, ey = -0.08;
      ctx.beginPath(); ctx.moveTo(ex - s * 0.26, ey - 0.04 + sl); ctx.quadraticCurveTo(ex, ey - 0.2, ex + s * 0.24, ey - 0.08);
      ctx.quadraticCurveTo(ex + s * 0.05, ey + 0.16, ex - s * 0.26, ey - 0.04 + sl); ctx.closePath();
      fs(ctx, '#1a1210', 0.8);
      if (expr === 'hurt') {
        ctx.beginPath(); ctx.moveTo(ex - 0.08, ey - 0.08); ctx.lineTo(ex + 0.08, ey + 0.04); ctx.moveTo(ex + 0.08, ey - 0.08); ctx.lineTo(ex - 0.08, ey + 0.04);
        ctx.lineWidth = LW * 1.2; ctx.strokeStyle = '#9fd8ff'; ctx.stroke();
      } else {
        circ(ctx, ex + fx * 0.3, ey - 0.03, 0.075); ctx.fillStyle = '#9fd8ff'; ctx.fill();
        circ(ctx, ex + fx * 0.3 - 0.025, ey - 0.055, 0.028); ctx.fillStyle = '#fff'; ctx.fill();
      }
    }
    // snout bridge
    ctx.beginPath(); ctx.moveTo(-0.2, 0.0); ctx.quadraticCurveTo(0, -0.2, 0.2, 0.0); ctx.lineTo(0.3, 0.3); ctx.lineTo(-0.3, 0.3); ctx.closePath();
    ctx.fillStyle = '#968474'; ctx.fill();
    // snout
    var sx = fx * 0.5;
    ell(ctx, sx, 0.46, 0.46, 0.3); fs(ctx, '#dcc6b2', 1);
    ell(ctx, sx, 0.52, 0.3, 0.16); ctx.fillStyle = '#e9d6c4'; ctx.fill();
    ell(ctx, sx - 0.15, 0.46, 0.065, 0.1); ctx.fillStyle = '#3a2a24'; ctx.fill();
    ell(ctx, sx + 0.15, 0.46, 0.065, 0.1); ctx.fill();
    // tusks
    for (s = -1; s <= 1; s += 2) {
      ctx.beginPath(); ctx.moveTo(sx + s * 0.36, 0.72); ctx.quadraticCurveTo(sx + s * 0.62, 0.7, sx + s * 0.7, 0.28);
      ctx.quadraticCurveTo(sx + s * 0.54, 0.54, sx + s * 0.3, 0.6); ctx.closePath();
      fs(ctx, '#fffaf0', 0.9);
    }
    // mouth line under snout
    ctx.beginPath(); ctx.moveTo(sx - 0.3, 0.84); ctx.quadraticCurveTo(sx, expr === 'smile' ? 0.95 : 0.88, sx + 0.3, 0.84);
    stroke(ctx, 1);
    if (expr === 'hurt' && !LOD) sweat(ctx);
  }

  // ---------- extra patterns for nezuko / shinobu ----------
  // Asanoha (hemp-leaf star): triangular lattice + spokes from each triangle's centroid.
  function patAsanoha(ctx, x0, y0, x1, y1, a) {
    ctx.fillStyle = '#f6a7c1'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    var hg = a * 0.866, j0 = Math.floor(y0 / hg) - 1, j1 = Math.ceil(y1 / hg) + 1, i, j;
    var i0 = Math.floor(x0 / a) - 2, i1 = Math.ceil(x1 / a) + 1;
    ctx.beginPath();
    for (j = j0; j < j1; j++) {
      var off = (j & 1) ? a / 2 : 0, ya = j * hg, yb = ya + hg;
      for (i = i0; i < i1; i++) {
        var xa = i * a + off;
        ctx.moveTo(xa, ya); ctx.lineTo(xa + a, ya);
        ctx.moveTo(xa, ya); ctx.lineTo(xa + a / 2, yb);
        ctx.moveTo(xa, ya); ctx.lineTo(xa - a / 2, yb);
        if (!LOD) {
          // spokes: down triangle (A, A+a, A+a/2 below) and up triangle (A+a/2 below, A+a, A+3a/2 below)
          var cx1 = xa + a / 2, cy1 = ya + hg / 3, cx2 = xa + a, cy2 = ya + hg * 2 / 3;
          ctx.moveTo(cx1, cy1); ctx.lineTo(xa, ya); ctx.moveTo(cx1, cy1); ctx.lineTo(xa + a, ya); ctx.moveTo(cx1, cy1); ctx.lineTo(xa + a / 2, yb);
          ctx.moveTo(cx2, cy2); ctx.lineTo(xa + a, ya); ctx.moveTo(cx2, cy2); ctx.lineTo(xa + a / 2, yb); ctx.moveTo(cx2, cy2); ctx.lineTo(xa + a * 1.5, yb);
        }
      }
    }
    ctx.lineWidth = LW * (LOD ? 0.7 : 0.6); ctx.strokeStyle = '#d4608c'; ctx.stroke();
  }
  // Nezuko's haori: dark brown with a thin orange checked band at the hem.
  function patNezHaori(ctx, x0, y0, x1, y1, hem, sc) {
    ctx.fillStyle = '#2e1d18'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (hem > 50) return;
    sc = sc || 1;
    var cs = 0.11 * sc, yb = hem - cs * 3.2;
    ctx.fillStyle = '#b8582e'; ctx.fillRect(x0, yb, x1 - x0, cs * 2);
    ctx.beginPath();
    for (var jj = 0; jj < 2; jj++) for (var ii = Math.floor(x0 / cs); ii < x1 / cs; ii++) if (((ii + jj) & 1) === 0) ctx.rect(ii * cs, yb + jj * cs, cs, cs);
    ctx.fillStyle = '#f0a060'; ctx.fill();
  }
  // Shinobu's butterfly-wing haori: white at the top fading to teal, black veins, black hem with white spots.
  function patWing(ctx, x0, y0, x1, y1, hem, sc, fsc) {
    if (hem > 50) hem = y1;              // sleeves: fade over the sleeve's own box
    var span = Math.max(0.2, hem - y0);
    ctx.save(); ctx.translate(0, y0); ctx.scale(1, span);
    ctx.fillStyle = grad('shinWing', function () { return lg(0, 0, 0, 1, [[0, '#ffffff'], [0.3, '#f4fbf9'], [0.62, '#9ae6d8'], [0.82, '#6ad7c6'], [1, '#2a8f7a']]); });
    ctx.fillRect(x0, 0, x1 - x0, (y1 - y0) / span);
    ctx.restore();
    var k = (sc || 1) * (fsc || 1), sp = 0.34 * k, yv = y0 + span * 0.42, i;
    ctx.beginPath();
    for (i = Math.floor(x0 / sp) - 1; i * sp < x1 + sp; i++) {
      var x = i * sp;
      ctx.moveTo(x, yv + ((i & 1) ? span * 0.12 : 0));
      ctx.quadraticCurveTo(x + sp * 0.35, lerp(yv, hem, 0.55), x + sp * 0.12, hem);
      if (!LOD && (i & 1)) { ctx.moveTo(x + sp * 0.16, lerp(yv, hem, 0.62)); ctx.lineTo(x + sp * 0.62, hem); }
    }
    ctx.lineWidth = LW * (LOD ? 1 : 0.7); ctx.strokeStyle = 'rgba(15,31,28,0.85)'; ctx.stroke();
    var bh = 0.17 * k;
    ctx.fillStyle = '#10201d'; ctx.fillRect(x0, hem - bh, x1 - x0, y1 - hem + bh + 0.5);
    ctx.beginPath();
    for (i = Math.floor(x0 / sp); i * sp < x1 + sp; i++) { ctx.moveTo(i * sp + sp * 0.5 + bh * 0.28, hem - bh * 0.5); ctx.arc(i * sp + sp * 0.5, hem - bh * 0.5, bh * 0.28, 0, TAU); }
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }

  // ---------------- NEZUKO ----------------
  function nezBow(ctx, x, y, rot, sc) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(sc || 1, sc || 1);
    ctx.lineJoin = 'round';
    for (var s = -1; s <= 1; s += 2) {
      // tail
      poly(ctx, [s * 0.06, 0.04, s * 0.2, 0.52, s * 0.34, 0.44, s * 0.12, 0.02]); fs(ctx, '#f06a9e', 1);
      // loop
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.2, -0.38, s * 0.62, -0.34, s * 0.58, -0.02);
      ctx.bezierCurveTo(s * 0.55, 0.22, s * 0.2, 0.2, 0, 0); ctx.closePath();
      fs(ctx, '#ff8fbd', 1);
      if (!LOD) { ell(ctx, s * 0.28, -0.06, 0.1, 0.06, s * -0.3); ctx.fillStyle = '#e0578f'; ctx.fill(); }
    }
    ell(ctx, 0, 0, 0.1, 0.12); fs(ctx, '#f06a9e', 1);
    ctx.restore();
  }
  function nezLocks(ctx) {
    var g = grad('nezukoLock', function () { return lg(0, -0.6, 0, 1.62, [[0, '#1a0d10'], [0.5, '#2a1216'], [0.78, '#b04a2c'], [1, '#ee7a3e']]); });
    for (var s = -1; s <= 1; s += 2) {
      curvy(ctx, [s * 0.86, -0.95, s * 0.76, -0.3, s * 0.82, 0.4, s * 0.88, 1.05, s * 0.98, 1.62, s * 1.16, 1.1, s * 1.22, 0.3, s * 1.14, -0.5], 0.07);
      fs(ctx, g, 1);
      if (!LOD) {
        ctx.beginPath(); ctx.moveTo(s * 0.96, -0.3); ctx.quadraticCurveTo(s * 1.0, 0.6, s * 1.0, 1.3);
        ctx.lineWidth = LW * 0.8; ctx.strokeStyle = 'rgba(255,150,110,0.3)'; ctx.stroke();
      }
    }
  }
  function nezBamboo(ctx, fx) {
    var d = fx * 0.8, x0 = -0.8 + d, x1 = 0.8 + d, y = 0.69, r = 0.105;
    // cord running back behind the head
    ctx.beginPath(); ctx.moveTo(x0 + 0.06, y - 0.03); ctx.quadraticCurveTo(x0 - 0.1, y - 0.3, -1.02 + d * 0.3, 0.22);
    ctx.moveTo(x1 - 0.06, y - 0.03); ctx.quadraticCurveTo(x1 + 0.1, y - 0.3, 1.02 + d * 0.3, 0.22);
    ctx.lineWidth = LW * (LOD ? 1 : 1.3); ctx.strokeStyle = '#3a2418'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y - r); ctx.lineTo(x1, y - r); ctx.arc(x1, y, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x0, y + r); ctx.arc(x0, y, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
    fs(ctx, '#a8c96a', 1);
    ctx.beginPath(); ctx.moveTo(x0 + 0.06, y - r * 0.42); ctx.lineTo(x1 - 0.1, y - r * 0.42);
    ctx.lineWidth = r * 0.45; ctx.strokeStyle = '#d6ec9e'; ctx.stroke();
    // nodes
    ctx.beginPath(); ctx.moveTo(d - 0.34, y - r); ctx.lineTo(d - 0.34, y + r); ctx.moveTo(d + 0.36, y - r); ctx.lineTo(d + 0.36, y + r);
    ctx.lineWidth = LW * 1.5; ctx.strokeStyle = '#5f8030'; ctx.stroke();
    if (!LOD) { ell(ctx, x1 - 0.02, y, r * 0.42, r * 0.9); fs(ctx, '#cfe39a', 0.7); }
  }
  C.nezuko = {
    id: 'nezuko', name: '카마도 네즈코', style: 'blood', color: '#ff7fb0', title: '혈귀술',
    gradBack: function () { return lg(0, -1.5, 0, 0.6, [[0, '#1a0d10'], [0.7, '#241014'], [1, '#3a1a18']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.2, [[0, '#1a0d10'], [0.7, '#261216'], [1, '#4a1e1c']]); },
    pathBack: function (ctx) {
      ctx.beginPath(); ctx.moveTo(-1.14, 0.55);
      ctx.bezierCurveTo(-1.42, -0.5, -1.18, -1.52, 0, -1.52);
      ctx.bezierCurveTo(1.18, -1.52, 1.42, -0.5, 1.14, 0.55);
      ctx.lineTo(0, 0.35); ctx.closePath();
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.08, -0.1, 0.98, 0.3, 0.82, -0.22, 0.64, -0.04, 0.46, -0.34, 0.27, -0.1, 0.09, -0.38, -0.1, -0.1,
        -0.28, -0.36, -0.47, -0.06, -0.64, -0.3, -0.82, -0.1, -0.98, 0.3, -1.08, -0.1], 0.05, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.18, -1.52, 1.18, -1.52, 1.08, -0.1);
      ctx.closePath();
    },
    hairDetail: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-0.55, -1.02); ctx.quadraticCurveTo(-0.2, -1.22, 0.3, -1.16);
      ctx.lineWidth = LW * 2.2; ctx.strokeStyle = 'rgba(255,170,150,0.22)'; ctx.stroke();
    },
    // long hair falling behind the body (drawn behind torso; head space)
    hairBack: function (ctx, t) {
      SWAY = Math.sin((t || 0) * 2.4) * 0.035;
      var g = grad('nezukoLong', function () { return lg(0, -1.2, 0, 2.62, [[0, '#1a0d10'], [0.55, '#261115'], [0.78, '#9a3e28'], [1, '#ee7a3e']]); });
      curvy(ctx, [-1.12, -0.7, -1.3, 0.4, -1.4, 1.4, -1.46, 2.3, -1.2, 2.56, -0.95, 2.34, -0.7, 2.62, -0.4, 2.4, -0.1, 2.62,
        0.2, 2.42, 0.5, 2.62, 0.8, 2.36, 1.1, 2.58, 1.44, 2.3, 1.4, 1.4, 1.3, 0.4, 1.12, -0.7, 0, -1.3], 0.05);
      fs(ctx, g, 1);
      if (!LOD) {
        ctx.beginPath();
        ctx.moveTo(-0.9, 0.9); ctx.quadraticCurveTo(-0.95, 1.7, -0.85, 2.3);
        ctx.moveTo(0.9, 0.9); ctx.quadraticCurveTo(0.95, 1.7, 0.85, 2.3);
        ctx.moveTo(0.05, 1.2); ctx.lineTo(0.0, 2.3);
        ctx.lineWidth = LW * 0.9; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
      }
    },

    overBack: function (ctx) { nezBow(ctx, 0.3, -0.72, 0.15, 1.05); },
    overHead: function (ctx, expr, fx) {
      nezBow(ctx, 0.9, -0.98, 0.3, 0.95);
      nezLocks(ctx);
      nezBamboo(ctx, fx || 0);
      if (expr === 'fierce' && !LOD) {
        // faint demon veins at the temples
        ctx.beginPath();
        for (var s = -1; s <= 1; s += 2) {
          ctx.moveTo(s * 0.7, -0.26); ctx.lineTo(s * 0.64, -0.12); ctx.lineTo(s * 0.7, 0.0);
          ctx.moveTo(s * 0.64, -0.12); ctx.lineTo(s * 0.54, -0.1);
        }
        ctx.lineWidth = LW * 1.1; ctx.strokeStyle = 'rgba(220,60,120,0.75)'; ctx.stroke();
      }
    },
    irisGrad: function () { return lg(0, -EH, 0, EH * 1.1, [[0, '#6e0c34'], [0.5, '#c2185b'], [1, '#ff8fbd']]); },
    irisLine: '#5a0a2a', pupilCol: '#3a0618', pupil: 0.24,
    brow: browThin('#2a1216'),
    noMouth: true,
    haori: function (ctx, x0, y0, x1, y1, hem, sc) { patNezHaori(ctx, x0, y0, x1, y1, hem, sc); },
    kimono: function (ctx, x0, y0, x1, y1, sc) { patAsanoha(ctx, x0, y0, x1, y1, 0.3 * (sc || 1)); },
    cuff: '#f6a7c1',
    sleeve: '#2e1d18',
    legCol: SKIN, wrapCol: SKIN, wrapLines: false,
    noSword: true, kick: true,
    blade: 'black', guard: '#1a1a1a', hilt: '#2a2a36', trailMix: 0.22
  };

  // ---------------- SHINOBU ----------------
  function butterfly(ctx, x, y, rot, sc, pink) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(sc || 1, sc || 1);
    var gw = pink ? grad('kanFly', function () { return rg(0, 0, 0.05, 0, 0, 0.66, [[0, '#fff0f6'], [0.35, '#ffc2dc'], [0.7, '#ff7fb0'], [1, '#c8407a']]); })
      : grad('shinFly', function () { return rg(0, 0, 0.05, 0, 0, 0.66, [[0, '#ffe0f4'], [0.35, '#f0a8ea'], [0.7, '#b07cff'], [1, '#6a34c0']]); });
    for (var s = -1; s <= 1; s += 2) {
      // forewing: broad, pointed outer corner
      ctx.beginPath(); ctx.moveTo(s * 0.03, -0.02);
      ctx.bezierCurveTo(s * 0.12, -0.42, s * 0.5, -0.62, s * 0.68, -0.5);
      ctx.bezierCurveTo(s * 0.66, -0.2, s * 0.46, 0.0, s * 0.03, 0.03); ctx.closePath();
      fs(ctx, gw, 1);
      // hindwing: rounded lobe
      ctx.beginPath(); ctx.moveTo(s * 0.03, 0.02);
      ctx.bezierCurveTo(s * 0.4, 0.0, s * 0.52, 0.2, s * 0.4, 0.38);
      ctx.bezierCurveTo(s * 0.28, 0.5, s * 0.08, 0.34, s * 0.03, 0.06); ctx.closePath();
      fs(ctx, gw, 1);
      if (!LOD) {
        ctx.beginPath(); ctx.moveTo(s * 0.05, -0.02); ctx.lineTo(s * 0.52, -0.46); ctx.moveTo(s * 0.05, 0.0); ctx.lineTo(s * 0.56, -0.22);
        ctx.moveTo(s * 0.05, 0.04); ctx.lineTo(s * 0.36, 0.3);
        ctx.lineWidth = LW * 0.7; ctx.strokeStyle = 'rgba(40,10,60,0.6)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.66, -0.5); ctx.bezierCurveTo(s * 0.65, -0.24, s * 0.5, -0.08, s * 0.36, -0.03);
        ctx.lineWidth = LW * 1.6; ctx.strokeStyle = '#2a1040'; ctx.stroke();
        ctx.fillStyle = '#fff'; circ(ctx, s * 0.58, -0.4, 0.035); ctx.fill(); circ(ctx, s * 0.55, -0.28, 0.03); ctx.fill();
      }
    }
    ell(ctx, 0, 0.04, 0.045, 0.2); fs(ctx, '#2a1838', 0.7);
    ctx.restore();
  }
  C.shinobu = {
    id: 'shinobu', name: '코쵸우 시노부', style: 'insect', color: '#b58cff', title: '벌레의 호흡',
    gradBack: function () { return lg(0, -1.45, 0, 0.72, [[0, '#1a1020'], [0.55, '#2a1838'], [0.82, '#5a2e96'], [1, '#8a4fd8']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.74, [[0, '#1a1020'], [0.5, '#24142e'], [0.78, '#5a2e96'], [1, '#9a62e8']]); },
    pathBack: function (ctx) {
      ctx.beginPath(); ctx.moveTo(-1.06, 0.9);
      ctx.bezierCurveTo(-1.44, -0.2, -1.22, -1.46, 0, -1.46);
      ctx.bezierCurveTo(1.22, -1.46, 1.44, -0.2, 1.06, 0.9);
      ctx.quadraticCurveTo(0.95, 0.66, 0.84, 0.66); ctx.lineTo(0, 0.3); ctx.lineTo(-0.84, 0.66);
      ctx.quadraticCurveTo(-0.95, 0.66, -1.06, 0.9); ctx.closePath();
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.12, -0.05, 1.02, 0.92, 0.9, 0.3, 0.8, -0.04, 0.62, -0.2, 0.5, -0.5, 0.3, -0.12, 0.16, -0.56, -0.02, -0.18,
        -0.12, -0.62, -0.3, -0.16, -0.5, -0.5, -0.66, -0.12, -0.8, -0.04, -0.9, 0.3, -1.02, 0.92, -1.12, -0.05], 0.05, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.2, -1.48, 1.2, -1.48, 1.1, -0.05);
      ctx.closePath();
    },
    hairDetail: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-0.6, -1.0); ctx.quadraticCurveTo(-0.2, -1.2, 0.35, -1.12);
      ctx.lineWidth = LW * 2.2; ctx.strokeStyle = 'rgba(200,160,255,0.25)'; ctx.stroke();
    },
    overBack: function (ctx) {
      circ(ctx, 0, -0.62, 0.42); fs(ctx, '#1f1328', 1);
      ctx.beginPath(); ctx.moveTo(-0.2, -0.8); ctx.quadraticCurveTo(0, -0.5, 0.2, -0.8); ctx.lineWidth = LW; ctx.strokeStyle = 'rgba(180,140,255,0.35)'; ctx.stroke();
      butterfly(ctx, -0.5, -0.78, -0.35, 0.95);
    },
    overHead: function (ctx) { butterfly(ctx, -1.0, -1.0, -0.5, 1.0); },
    irisGrad: function () { return lg(0, -EH, 0, EH * 1.1, [[0, '#3a1a5a'], [0.5, '#8a5ad0'], [1, '#e2ccff']]); },
    irisLine: '#2e1450', pupilCol: '#4a2a7a', pupil: 0.22, eyeHi: 'rgba(255,255,255,0.5)', eyeSlant: -0.03,
    brow: browThin('#2a1838'),
    mouth: 'soft',
    haori: function (ctx, x0, y0, x1, y1, hem, sc, fsc) { patWing(ctx, x0, y0, x1, y1, hem, sc, fsc); },
    sleeve: '#e8f8f4',
    blade: 'needle', bladeLen: 2.25, guard: '#8a4fd8', hilt: '#2a2238', trailMix: 0.3
  };

  // =====================================================================
  //  HASHIRA (주) — the remaining pillars
  // =====================================================================
  function patPlain(col) { return function (ctx, x0, y0, x1, y1) { ctx.fillStyle = col; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }; }
  // Tortoiseshell hexagons (kikkō) in yellow / green / orange.
  function patKikko(ctx, x0, y0, x1, y1, r) {
    ctx.fillStyle = '#2b2a1c'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    var w = r * 1.732, dy = r * 1.5, cols = ['#e2c44c', '#3f8f5e', '#d9762e'];
    var j0 = Math.floor(y0 / dy) - 1, j1 = Math.ceil(y1 / dy) + 1;
    for (var j = j0; j < j1; j++) {
      var off = (j & 1) ? w / 2 : 0;
      for (var i = Math.floor(x0 / w) - 1; i * w < x1 + w; i++) {
        var cx = i * w + off, cy = j * dy, rr = r * 0.86;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fillStyle = cols[(((i + (j & 1) * 2) % 3) + 3) % 3]; ctx.fill();
      }
    }
  }
  // Giyu's half-and-half haori: plain wine red on one side, kikkō on the other.
  function patGiyu(ctx, x0, y0, x1, y1, hem, sc) {
    if (x0 < 0) { ctx.fillStyle = '#7a1f2b'; ctx.fillRect(x0, y0, Math.min(x1, 0) - x0, y1 - y0); }
    if (x1 > 0) {
      var xa = Math.max(x0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(xa, y0, x1 - xa, y1 - y0); ctx.clip();
      patKikko(ctx, xa, y0, x1, y1, 0.17 * (sc || 1)); ctx.restore();
    }
  }
  function patStripes(ctx, x0, y0, x1, y1, w) {
    ctx.fillStyle = '#f2f2ee'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = '#1a1a24';
    for (var x = Math.floor(x0 / (2 * w)) * 2 * w; x < x1; x += 2 * w) ctx.fillRect(x, y0, w, y1 - y0);
  }
  function roundBack(ctx) {
    ctx.beginPath(); ctx.moveTo(-1.16, 0.6);
    ctx.bezierCurveTo(-1.44, -0.5, -1.2, -1.5, 0, -1.5);
    ctx.bezierCurveTo(1.2, -1.5, 1.44, -0.5, 1.16, 0.6);
    ctx.lineTo(0, 0.35); ctx.closePath();
  }
  function bangs(pts, b) {
    return function (ctx, edgeOnly) {
      curvy(ctx, pts, b, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.2, -1.5, 1.2, -1.5, pts[0], pts[1]);
      ctx.closePath();
    };
  }
  function irisLG(a, b, c2) { return function () { return lg(0, -EH, 0, EH * 1.1, [[0, a], [0.5, b], [1, c2]]); }; }

  // ---------------- GIYU (물) ----------------
  C.giyu = {
    id: 'giyu', name: '토미오카 기유', style: 'water2', color: '#3d7fe0', title: '물의 호흡 · 수주',
    gradBack: function () { return rg(0, -0.2, 0.4, 0, -0.2, 1.65, [[0, '#0b0d14'], [0.65, '#151a28'], [1, '#2c3a58']]); },
    gradFront: function () { return lg(0, -1.2, 0, 0.4, [[0, '#0b0d14'], [0.6, '#151b2a'], [1, '#2e3d5c']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-1.0, 0.5, -1.28, 0.3, -1.12, 0.0, -1.4, -0.3, -1.14, -0.55, -1.32, -0.95, -0.86, -0.98, -0.8, -1.42, -0.4, -1.18,
        -0.1, -1.52, 0.18, -1.2, 0.56, -1.46, 0.66, -1.08, 1.1, -1.18, 1.04, -0.78, 1.4, -0.6, 1.14, -0.36, 1.36, 0.0, 1.1, 0.14,
        1.26, 0.46, 1.0, 0.5, 0, 0.3], 0.1);
    },
    pathFront: bangs([1.08, -0.1, 1.0, 0.4, 0.86, -0.25, 0.7, 0.12, 0.52, -0.42, 0.32, -0.02, 0.16, -0.5, 0.0, -0.08,
      -0.18, -0.55, -0.36, -0.05, -0.56, -0.45, -0.74, 0.1, -0.86, -0.25, -1.0, 0.4, -1.08, -0.1], 0.05),
    hairBack: function (ctx, t) {
      SWAY = Math.sin((t || 0) * 2.4) * 0.035;
      // low spiky ponytail peeking out behind the right shoulder
      curvy(ctx, [0.3, 0.2, 0.75, 0.45, 1.05, 0.95, 1.3, 1.5, 1.0, 1.32, 0.98, 1.75, 0.74, 1.3, 0.5, 1.5, 0.48, 0.9], 0.08);
      fs(ctx, grad('giyuTail', function () { return lg(0, 0.2, 0, 1.7, [[0, '#0b0d14'], [1, '#2c3a58']]); }), 1);
    },
    irisGrad: irisLG('#0a1a3a', '#2a5aa8', '#7ab4ff'),
    irisLine: '#0a1a3a', pupilCol: '#060c1a', pupil: 0.26, eyeHi: 'rgba(255,255,255,0.8)',
    brow: browThin('#141a28'),
    mouth: 'line',
    haori: function (ctx, x0, y0, x1, y1, hem, sc) { patGiyu(ctx, x0, y0, x1, y1, hem, sc); },
    sleeve: '#7a1f2b',
    blade: 'plain', bladeCol: '#2f66c8', guard: '#1a1a1a', hilt: '#2a2a46', trailMix: 0.4
  };

  // ---------------- TENGEN (소리) ----------------
  C.tengen = {
    id: 'tengen', name: '우즈이 텐겐', style: 'sound', color: '#ff5aa8', title: '소리의 호흡 · 음주',
    gradBack: function () { return rg(0, -0.3, 0.3, 0, -0.3, 1.8, [[0, '#ffffff'], [0.6, '#e4e9f2'], [1, '#a8b4c8']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.4, [[0, '#ffffff'], [0.7, '#e6ebf3'], [1, '#b8c2d4']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-0.98, 0.55, -1.3, 0.25, -1.18, -0.1, -1.42, -0.45, -1.12, -0.7, -1.2, -1.1, -0.7, -1.12, -0.5, -1.5, -0.1, -1.25,
        0.3, -1.55, 0.5, -1.15, 1.0, -1.25, 1.06, -0.8, 1.42, -0.5, 1.16, -0.18, 1.32, 0.25, 1.0, 0.55, 0, 0.3], 0.08);
    },
    pathFront: bangs([1.08, -0.1, 1.0, 0.25, 0.82, -0.5, 0.55, -0.6, 0.25, -0.66, -0.05, -0.62, -0.22, 0.12, -0.34, -0.6,
      -0.72, -0.56, -1.0, 0.25, -1.08, -0.1], 0.05),
    underBangs: function (ctx) {
      // red flower make-up around his left eye
      ctx.save(); ctx.translate(0.43, 0.2);
      ctx.beginPath();
      for (var k = 0; k < 5; k++) {
        var a = -2.4 + k * 0.42;
        ctx.moveTo(Math.cos(a) * 0.36, Math.sin(a) * 0.4); ctx.lineTo(Math.cos(a) * 0.5, Math.sin(a) * 0.54);
      }
      ctx.lineWidth = LW * 1.8; ctx.strokeStyle = '#d8264a'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    },
    overHead: function (ctx) {
      // jewelled headband
      ctx.beginPath(); ctx.moveTo(-1.1, -0.56); ctx.quadraticCurveTo(0, -0.86, 1.1, -0.56);
      ctx.lineTo(1.1, -0.38); ctx.quadraticCurveTo(0, -0.66, -1.1, -0.38); ctx.closePath();
      fs(ctx, '#d9d4c6', 1);
      var gems = [[-0.55, '#3a7ae8'], [0, '#e8304a'], [0.55, '#30c070']];
      for (var i = 0; i < 3; i++) {
        var gx = gems[i][0], gy = -0.6 + Math.abs(gx) * 0.12, r = i === 1 ? 0.14 : 0.1;
        ctx.beginPath(); ctx.moveTo(gx, gy - r); ctx.lineTo(gx + r, gy); ctx.lineTo(gx, gy + r); ctx.lineTo(gx - r, gy); ctx.closePath();
        fs(ctx, gems[i][1], 0.8);
        if (!LOD) { circ(ctx, gx - r * 0.3, gy - r * 0.3, r * 0.22); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); }
      }
    },
    irisGrad: irisLG('#4a0a2a', '#b02a6a', '#ff8fc0'),
    irisLine: '#3a0820', pupilCol: '#2a0414', pupil: 0.24,
    brow: browThin('#8a94a8'),
    mouth: 'grin',
    haori: patPlain('#262640'),
    sleeve: SKIN,
    blade: 'plain', bladeCol: '#cfd4de', bladeLen: 2.1, guard: '#e6b422', hilt: '#3a2a10', trailMix: 0.3
  };

  // ---------------- MITSURI (사랑) ----------------
  function braid(ctx, s) {
    for (var k = 0; k < 7; k++) {
      var f = k / 6, x = s * (1.02 + 0.06 * k), y = 0.25 + k * 0.32;
      ell(ctx, x, y, 0.22 - f * 0.05, 0.2, s * 0.3);
      fs(ctx, f < 0.45 ? '#ff92c8' : f < 0.75 ? '#e8b49a' : '#9ad86e', 1);
    }
  }
  C.mitsuri = {
    id: 'mitsuri', name: '칸로지 미츠리', style: 'love', color: '#ff8fc8', title: '사랑의 호흡 · 연주',
    gradBack: function () { return lg(0, -1.5, 0, 0.7, [[0, '#ff6fb0'], [0.6, '#ff94c8'], [1, '#ffb0d6']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.6, [[0, '#ff6fb0'], [0.7, '#ff9acc'], [1, '#ffbadc']]); },
    pathBack: roundBack,
    pathFront: bangs([1.08, -0.1, 1.04, 0.55, 0.86, -0.2, 0.66, -0.12, 0.5, -0.36, 0.3, -0.16, 0.12, -0.4, -0.06, -0.14,
      -0.24, -0.4, -0.44, -0.14, -0.64, -0.32, -0.86, -0.2, -1.04, 0.55, -1.08, -0.1], 0.05),
    hairBack: function (ctx, t) {
      SWAY = Math.sin((t || 0) * 2.4) * 0.035;
      braid(ctx, -1); braid(ctx, 1);
    },
    hairDetail: function (ctx) {
      ctx.beginPath(); ctx.moveTo(-0.55, -1.02); ctx.quadraticCurveTo(-0.2, -1.22, 0.3, -1.16);
      ctx.lineWidth = LW * 2.2; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
    },
    underBangs: function (ctx) {
      // two little beauty marks under the eyes
      ctx.fillStyle = '#5a2a2a';
      circ(ctx, -0.6, 0.6, 0.028); ctx.fill(); circ(ctx, 0.6, 0.6, 0.028); ctx.fill();
    },
    blush: true,
    irisGrad: irisLG('#0a3a1a', '#2aa860', '#a8f0c0'),
    irisLine: '#08301a', pupilCol: '#062010', pupil: 0.26,
    brow: browThin('#e0609a'),
    mouth: 'soft',
    haori: patPlain('#f8f8f2'),
    sleeve: '#f8f8f2',
    blade: 'plain', bladeCol: '#ff9ccf', bladeLen: 2.5, guard: '#ff6fb0', hilt: '#3a2a3a', trailMix: 0.2
  };

  // ---------------- MUICHIRO (안개) ----------------
  C.muichiro = {
    id: 'muichiro', name: '토키토 무이치로', style: 'mist', color: '#7fd8cc', title: '안개의 호흡 · 하주',
    gradBack: function () { return lg(0, -1.5, 0, 0.9, [[0, '#121418'], [0.6, '#1a2228'], [1, '#3a8a84']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.95, [[0, '#121418'], [0.55, '#1c242a'], [1, '#5ac0b4']]); },
    pathBack: roundBack,
    pathFront: bangs([1.1, -0.05, 1.04, 0.95, 0.88, 0.2, 0.74, -0.1, 0.58, -0.3, 0.42, -0.08, 0.26, -0.36, 0.1, -0.1,
      -0.06, -0.4, -0.24, -0.12, -0.4, -0.36, -0.58, -0.06, -0.74, -0.2, -0.88, 0.2, -1.04, 0.95, -1.1, -0.05], 0.05),
    hairBack: function (ctx, t) {
      SWAY = Math.sin((t || 0) * 2.4) * 0.035;
      var g = grad('muiLong', function () { return lg(0, -1.2, 0, 2.45, [[0, '#121418'], [0.55, '#1c242a'], [0.8, '#3a9a92'], [1, '#8ae8dc']]); });
      curvy(ctx, [-1.12, -0.7, -1.28, 0.4, -1.3, 1.4, -1.26, 2.2, -0.9, 2.4, -0.5, 2.26, -0.1, 2.45, 0.3, 2.28, 0.7, 2.42,
        1.1, 2.24, 1.3, 1.4, 1.28, 0.4, 1.12, -0.7, 0, -1.3], 0.05);
      fs(ctx, g, 1);
    },
    irisGrad: irisLG('#0e3a3a', '#3aa8a0', '#c8f6f0'),
    irisLine: '#0a3030', pupilCol: '#0a2a2a', pupil: 0.18, eyeHi: 'rgba(255,255,255,0.5)',
    brow: browThin('#1a2026'),
    mouth: 'line',
    haori: patPlain('#262c42'),
    sleeve: '#1c1c2a',
    blade: 'plain', bladeCol: '#dff6f2', guard: '#5ac0b4', hilt: '#2a2a36', trailMix: 0.5
  };

  // ---------------- GYOMEI (바위) ----------------
  C.gyomei = {
    id: 'gyomei', name: '히메지마 교메이', style: 'stone', color: '#b8a888', title: '바위의 호흡 · 암주',
    gradBack: function () { return lg(0, -1.4, 0, 0.4, [[0, '#26221c'], [1, '#3a3428']]); },
    gradFront: function () { return lg(0, -1.3, 0, -0.6, [[0, '#26221c'], [1, '#3e372a']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-1.06, 0.3, -1.12, -0.4, -0.95, -0.95, -0.5, -1.3, 0, -1.38, 0.5, -1.3, 0.95, -0.95, 1.12, -0.4, 1.06, 0.3, 0, 0.2], 0.08);
    },
    pathFront: function (ctx, edgeOnly) {
      curvy(ctx, [1.04, -0.25, 0.92, -0.62, 0.5, -0.84, 0, -0.88, -0.5, -0.84, -0.92, -0.62, -1.04, -0.25], 0.04, true);
      if (edgeOnly) return;
      ctx.bezierCurveTo(-1.15, -1.45, 1.15, -1.45, 1.04, -0.25);
      ctx.closePath();
    },
    overHead: function (ctx, expr) {
      // forehead scar
      ctx.beginPath(); ctx.moveTo(0.06, -0.8); ctx.lineTo(-0.04, -0.4);
      ctx.moveTo(-0.06, -0.68); ctx.lineTo(0.1, -0.64); ctx.moveTo(-0.08, -0.54); ctx.lineTo(0.08, -0.5);
      ctx.lineWidth = LW * 1.4; ctx.strokeStyle = '#a8604e'; ctx.lineCap = 'round'; ctx.stroke();
      // ever-flowing tears
      if (expr !== 'smile' && !LOD) {
        ctx.beginPath(); ctx.moveTo(-0.45, 0.5); ctx.quadraticCurveTo(-0.5, 0.65, -0.46, 0.85);
        ctx.moveTo(0.45, 0.5); ctx.quadraticCurveTo(0.5, 0.65, 0.46, 0.85);
        ctx.lineWidth = LW * 1.6; ctx.strokeStyle = 'rgba(140,200,255,0.8)'; ctx.stroke();
      }
      // prayer beads
      for (var i = 0; i <= 8; i++) {
        var u = i / 8, x = lerp(-0.8, 0.8, u), y = 1.0 + Math.sin(u * Math.PI) * 0.4;
        circ(ctx, x, y, 0.085); fs(ctx, '#7a5432', 0.8);
      }
    },
    irisGrad: irisLG('#f6f4fa', '#e8e6f0', '#d4d0e0'),
    irisLine: '#b8b4c8', pupilCol: 'rgba(0,0,0,0)', pupil: 0.01, eyeHi: 'rgba(255,255,255,0.6)',
    brow: browThin('#26221c'), browY: -0.02,
    mouth: 'line',
    haori: patPlain('#5a4a30'),
    sleeve: '#5a4a30',
    blade: 'plain', bladeCol: '#8a8a94', bladeLen: 2.0, guard: '#4a4a52', hilt: '#3a3428', trailMix: 0.3
  };

  // ---------------- OBANAI (뱀) ----------------
  C.obanai = {
    id: 'obanai', name: '이구로 오바나이', style: 'serpent', color: '#9a7cf0', title: '뱀의 호흡 · 사주',
    gradBack: function () { return lg(0, -1.5, 0, 0.8, [[0, '#101016'], [0.7, '#1a1a26'], [1, '#30304a']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.6, [[0, '#101016'], [0.7, '#1c1c2a'], [1, '#34344e']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-1.0, 0.7, -1.26, 0.3, -1.14, -0.2, -1.34, -0.55, -1.0, -0.95, -0.7, -1.4, -0.1, -1.45, 0.5, -1.42, 0.9, -1.1,
        1.3, -0.6, 1.16, -0.2, 1.26, 0.3, 1.0, 0.7, 0, 0.35], 0.08);
    },
    pathFront: bangs([1.08, -0.1, 1.0, 0.5, 0.82, -0.2, 0.6, 0.05, 0.42, -0.45, 0.2, -0.2, 0.02, -0.55, -0.2, -0.15,
      -0.4, -0.5, -0.62, 0.05, -0.84, -0.3, -1.0, 0.5, -1.08, -0.1], 0.05),
    noMouth: true,
    overHead: function (ctx) {
      // bandage over the mouth
      ctx.save(); facePath(ctx); ctx.clip();
      ctx.beginPath(); ctx.moveTo(-1.1, 0.5); ctx.quadraticCurveTo(0, 0.42, 1.1, 0.5); ctx.lineTo(1.1, 1.2); ctx.lineTo(-1.1, 1.2); ctx.closePath();
      ctx.fillStyle = '#f4f4f0'; ctx.fill();
      if (!LOD) {
        ctx.beginPath(); ctx.moveTo(-1, 0.68); ctx.quadraticCurveTo(0, 0.62, 1, 0.68); ctx.moveTo(-0.9, 0.86); ctx.quadraticCurveTo(0, 0.8, 0.9, 0.86);
        ctx.lineWidth = LW * 0.7; ctx.strokeStyle = '#c8c8c0'; ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-0.98, 0.5); ctx.quadraticCurveTo(0, 0.42, 0.98, 0.5); stroke(ctx, 0.9);
      // Kaburamaru, the white snake, curled at his neck
      ctx.beginPath(); ctx.moveTo(0.2, 1.08); ctx.quadraticCurveTo(0.9, 1.25, 1.12, 0.85); ctx.quadraticCurveTo(1.25, 0.6, 1.08, 0.5);
      ctx.lineCap = 'round'; oline(ctx, 0.16, '#fafaf6');
      ell(ctx, 1.06, 0.46, 0.14, 0.1, -0.5); fs(ctx, '#fafaf6', 1);
      circ(ctx, 1.08, 0.42, 0.03); ctx.fillStyle = '#d8264a'; ctx.fill();
    },
    irisGrad: irisLG('#5a4a00', '#c8a820', '#ffe878'),
    irisGradR: irisLG('#0a3a40', '#2a98a8', '#9ae8f0'),
    irisLine: '#2a2a10', pupilCol: '#141408', pupil: 0.18, eyeSlant: 0.05,
    brow: browThin('#101016'),
    haori: function (ctx, x0, y0, x1, y1, hem, sc) { patStripes(ctx, x0, y0, x1, y1, 0.16 * (sc || 1)); },
    sleeve: '#f2f2ee',
    blade: 'plain', bladeCol: '#8a6ad8', guard: '#2a2a36', hilt: '#3a2a50', trailMix: 0.3
  };

  // ---------------- SANEMI (바람) ----------------
  C.sanemi = {
    id: 'sanemi', name: '시나즈가와 사네미', style: 'wind', color: '#5ed27a', title: '바람의 호흡 · 풍주',
    gradBack: function () { return rg(0, -0.3, 0.3, 0, -0.3, 1.9, [[0, '#ffffff'], [0.6, '#eceef2'], [1, '#a8b0c0']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.4, [[0, '#ffffff'], [1, '#c4cad6']]); },
    pathBack: function (ctx) {
      curvy(ctx, [-1.0, 0.5, -1.45, 0.35, -1.15, 0.0, -1.6, -0.4, -1.18, -0.62, -1.5, -1.1, -0.85, -1.05, -0.9, -1.7, -0.38, -1.25,
        -0.05, -1.85, 0.25, -1.28, 0.75, -1.72, 0.8, -1.08, 1.45, -1.15, 1.18, -0.62, 1.62, -0.38, 1.16, 0.0, 1.45, 0.36, 1.0, 0.5, 0, 0.3], 0.04);
    },
    pathFront: bangs([1.08, -0.1, 1.04, 0.3, 0.84, -0.3, 0.66, 0.0, 0.5, -0.5, 0.3, -0.12, 0.14, -0.6, -0.04, -0.14,
      -0.22, -0.62, -0.42, -0.1, -0.6, -0.5, -0.8, -0.05, -0.9, -0.3, -1.04, 0.3, -1.08, -0.1], 0.02),
    underBangs: function (ctx) {
      // battle scars
      ctx.beginPath();
      ctx.moveTo(-0.42, 0.3); ctx.lineTo(0.28, 0.52);
      ctx.moveTo(0.58, 0.5); ctx.lineTo(0.78, 0.76);
      ctx.moveTo(-0.72, -0.2); ctx.lineTo(-0.82, 0.05);
      ctx.lineWidth = LW * 1.6; ctx.strokeStyle = '#c46a6a'; ctx.lineCap = 'round'; ctx.stroke();
    },
    irisGrad: irisLG('#3a0a3a', '#9a3a8a', '#f0a0e0'),
    irisLine: '#2a0a2a', pupilCol: '#1a041a', pupil: 0.14, eyeSlant: 0.1,
    brow: browThin('#9aa2b2'),
    mouth: 'grin',
    haori: patPlain('#f4f4ee'),
    sleeve: '#f4f4ee',
    blade: 'plain', bladeCol: '#4ec870', guard: '#2a2a36', hilt: '#2a3a2a', trailMix: 0.35
  };


  // ---------------- KANAO (꽃) ----------------
  C.kanao = {
    id: 'kanao', name: '츠유리 카나오', style: 'flower', color: '#ff9ec4', title: '꽃의 호흡',
    gradBack: function () { return lg(0, -1.5, 0, 0.8, [[0, '#120d16'], [0.65, '#1e1424'], [1, '#3a2240']]); },
    gradFront: function () { return lg(0, -1.3, 0, 0.6, [[0, '#120d16'], [0.7, '#20162a'], [1, '#402648']]); },
    pathBack: roundBack,
    pathFront: bangs([1.08, -0.1, 1.02, 0.6, 0.86, -0.18, 0.68, -0.06, 0.5, -0.3, 0.3, -0.1, 0.12, -0.34, -0.06, -0.1,
      -0.24, -0.34, -0.44, -0.1, -0.64, -0.28, -0.86, -0.16, -1.02, 0.6, -1.08, -0.1], 0.05),
    hairBack: function (ctx, t) {
      SWAY = Math.sin((t || 0) * 2.4) * 0.035;
      // side ponytail falling over her left shoulder
      curvy(ctx, [0.7, -0.75, 1.15, -0.55, 1.35, 0.1, 1.42, 0.8, 1.3, 1.45, 1.1, 1.1, 1.08, 1.55, 0.92, 0.9, 0.95, 0.2, 0.8, -0.3], 0.07);
      fs(ctx, grad('kanTail', function () { return lg(0, -0.8, 0, 1.5, [[0, '#120d16'], [1, '#3a2240']]); }), 1);
    },
    hairDetail: function (ctx) {
      ctx.beginPath(); ctx.moveTo(-0.55, -1.02); ctx.quadraticCurveTo(-0.2, -1.22, 0.3, -1.16);
      ctx.lineWidth = LW * 2.2; ctx.strokeStyle = 'rgba(220,170,255,0.22)'; ctx.stroke();
    },
    overBack: function (ctx) { butterfly(ctx, 0.75, -0.75, 0.4, 0.9, true); },
    overHead: function (ctx) { butterfly(ctx, 0.95, -0.82, 0.45, 0.95, true); },
    irisGrad: irisLG('#5a2a6a', '#c48ae0', '#f6e4ff'),
    irisLine: '#4a2058', pupilCol: '#7a4a8a', pupil: 0.18, eyeHi: 'rgba(255,255,255,0.55)',
    brow: browThin('#1e1424'),
    mouth: 'soft', blush: true,
    haori: patPlain('#f7f5f2'),
    sleeve: '#f7f5f2',
    blade: 'plain', bladeCol: '#f0b8d8', guard: '#e06aa8', hilt: '#3a2240', trailMix: 0.25
  };

  var LIST = [C.tanjiro, C.zenitsu, C.rengoku, C.inosuke, C.nezuko, C.shinobu,
    C.giyu, C.tengen, C.mitsuri, C.muichiro, C.gyomei, C.obanai, C.sanemi, C.kanao].map(function (c) {
    return { id: c.id, name: c.name, style: c.style, color: c.color, title: c.title };
  });

  // =====================================================================
  //  SWORDS  (drawn in sword-local space: grip at origin, blade along +x)
  // =====================================================================
  function drawSword(ctx, c, px, py, a, len, noHilt) {
    ctx.save(); ctx.translate(px, py); ctx.rotate(a);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var b0 = 0.22, tip = b0 + len;
    // blade
    ctx.beginPath();
    if (c.blade === 'jagged') {
      ctx.moveTo(b0, -0.09);
      ctx.quadraticCurveTo(b0 + len * 0.5, -0.14, tip, -0.02);
      var n = 7, i;
      for (i = n; i >= 0; i--) {
        var xx = b0 + len * (i / n) * 0.96;
        ctx.lineTo(xx + len * 0.05, 0.15); ctx.lineTo(xx, 0.06);
      }
      ctx.closePath();
      fs(ctx, '#9fb4c8', 1);
      ctx.beginPath(); ctx.moveTo(b0, -0.03); ctx.lineTo(tip - 0.1, -0.03);
      ctx.lineWidth = LW * 0.9; ctx.strokeStyle = '#e6f0f8'; ctx.stroke();
    } else if (c.blade === 'needle') {
      // shinobu: stinger sword — short broad base, then a very thin needle to a sharp point
      var nw = LOD ? 0.06 : 0.042, bl = Math.min(0.42, len * 0.2);
      ctx.moveTo(b0, -0.09); ctx.lineTo(b0 + bl, -0.07); ctx.lineTo(b0 + bl + 0.12, -nw);
      ctx.lineTo(tip - 0.3, -nw * 0.8); ctx.lineTo(tip, 0); ctx.lineTo(tip - 0.3, nw * 0.8);
      ctx.lineTo(b0 + bl + 0.12, nw); ctx.lineTo(b0 + bl, 0.07); ctx.lineTo(b0, 0.09); ctx.closePath();
      fs(ctx, grad('needleBlade', function () { return lg(0, 0, 2.4, 0, [[0, '#b9a2e8'], [0.25, '#e6ecf4'], [1, '#bff0e4']]); }), LOD ? 0.8 : 0.7);
      if (!LOD) {
        ctx.beginPath(); ctx.moveTo(b0 + bl + 0.14, 0); ctx.lineTo(tip - 0.2, 0);
        ctx.lineWidth = LW * 0.6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
    } else {
      var bw = LOD ? 0.1 : 0.085;
      ctx.moveTo(b0, -bw);
      ctx.quadraticCurveTo(b0 + len * 0.55, -bw * 1.4, tip, -bw * 0.7);
      ctx.quadraticCurveTo(tip - 0.12, bw * 0.3, tip - 0.32, bw * 0.75);
      ctx.quadraticCurveTo(b0 + len * 0.45, bw * 0.95, b0, bw * 0.9);
      ctx.closePath();
      var fill = c.bladeCol ? c.bladeCol : c.blade === 'black' ? '#23232e' : c.blade === 'thunder' ? '#f6ea9c' :
        grad('flameBlade', function () { return lg(0, 0, 2.4, 0, [[0, '#e8321e'], [0.6, '#ff6a24'], [1, '#ffae3a']]); });
      fs(ctx, fill, 1);
      // edge highlight
      ctx.beginPath(); ctx.moveTo(b0 + 0.05, bw * 0.5); ctx.quadraticCurveTo(b0 + len * 0.45, bw * 0.55, tip - 0.34, bw * 0.4);
      ctx.lineWidth = LW * (c.blade === 'black' ? 1.5 : 0.9); ctx.strokeStyle = c.blade === 'black' ? '#dfe7f2' : (c.blade === 'thunder' || c.bladeCol) ? '#ffffff' : '#ffe0a0'; ctx.stroke();
      if (c.blade === 'thunder') {
        ctx.beginPath(); ctx.moveTo(b0 + 0.1, -0.02);
        var segs = 6;
        for (var k = 1; k <= segs; k++) ctx.lineTo(b0 + 0.1 + (len - 0.45) * k / segs, (k & 1) ? -bw * 0.85 : bw * 0.3);
        ctx.lineWidth = LW * 1.2 + 0.015; ctx.strokeStyle = '#e09a10'; ctx.stroke();
      }
    }
    if (!noHilt) {
      // guard
      if (c.blade === 'flame') {
        ctx.beginPath(); ctx.moveTo(0.16, -0.22); ctx.lineTo(0.26, -0.12); ctx.lineTo(0.22, 0); ctx.lineTo(0.26, 0.12); ctx.lineTo(0.16, 0.22); ctx.lineTo(0.1, 0);
        ctx.closePath(); fs(ctx, c.guard, 1);
      } else if (c.blade === 'needle') {
        // hexagonal butterfly guard: purple wings, green centre
        poly(ctx, [0.16, -0.24, 0.24, -0.12, 0.24, 0.12, 0.16, 0.24, 0.08, 0.12, 0.08, -0.12]); fs(ctx, c.guard, 1);
        poly(ctx, [0.16, -0.1, 0.2, -0.05, 0.2, 0.05, 0.16, 0.1, 0.12, 0.05, 0.12, -0.05]); ctx.fillStyle = '#3fc4a4'; ctx.fill();
      } else {
        ell(ctx, 0.16, 0, 0.06, 0.18); fs(ctx, c.guard, 1);
      }
      // hilt
      ctx.beginPath(); ctx.moveTo(-0.5, 0); ctx.lineTo(0.1, 0);
      oline(ctx, 0.13, c.hilt);
      if (!LOD) {
        ctx.beginPath();
        for (var q = -0.42; q < 0.05; q += 0.13) { ctx.moveTo(q, -0.045); ctx.lineTo(q + 0.06, 0.045); ctx.moveTo(q, 0.045); ctx.lineTo(q + 0.06, -0.045); }
        ctx.lineWidth = LW * 0.6; ctx.strokeStyle = '#d8d8e0'; ctx.stroke();
      }
    }
    ctx.restore();
  }

  function hand(ctx, x, y, r, col) { circ(ctx, x, y, r); fs(ctx, col || SKIN, 1); }

  // =====================================================================
  //  scratch canvas for alpha / hurt tint
  // =====================================================================
  var _scr = null, _sctx = null;
  function devScale(ctx) {
    if (!ctx.getTransform) return 1;
    var m = ctx.getTransform(); var k = Math.sqrt(m.a * m.a + m.b * m.b);
    return k > 0 ? k : 1;
  }
  function viaScratch(ctx, left, top, w, h, hurt, alpha, drawFn) {
    var k = Math.min(devScale(ctx), 4);
    var pw = Math.ceil(w * k) + 2, ph = Math.ceil(h * k) + 2;
    if (!_scr) { _scr = document.createElement('canvas'); _sctx = _scr.getContext('2d'); }
    if (_scr.width < pw || _scr.height < ph) { _scr.width = Math.max(_scr.width, pw); _scr.height = Math.max(_scr.height, ph); }
    var s = _sctx;
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalAlpha = 1; s.globalCompositeOperation = 'source-over';
    s.clearRect(0, 0, pw, ph);
    s.setTransform(k, 0, 0, k, -left * k, -top * k);
    drawFn(s);
    if (hurt > 0) {
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.globalCompositeOperation = 'source-atop';
      s.fillStyle = 'rgba(255,40,50,' + (0.42 * clamp01(hurt)).toFixed(3) + ')';
      s.fillRect(0, 0, pw, ph);
      s.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(_scr, 0, 0, pw, ph, left, top, pw / k, ph / k);
    ctx.restore();
  }

  // =====================================================================
  //  bitmap cache (LRU by pixel budget)
  // =====================================================================
  var CACHE = new Map(), CACHE_PX = 0, CACHE_MAX = 6e6;
  function qScale(ctx) { var k = devScale(ctx); k = Math.round(k * 4) / 4; return k < 1 ? 1 : k > 3 ? 3 : k; }
  // Returns a canvas of (w*k)x(h*k) device px holding render(ctx2) drawn in CSS units with origin at (ox,oy).
  function cached(key, w, h, ox, oy, k, render) {
    var e = CACHE.get(key);
    if (e) { CACHE.delete(key); CACHE.set(key, e); return e; }
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w * k)); cv.height = Math.max(1, Math.ceil(h * k));
    var x = cv.getContext('2d');
    x.setTransform(k, 0, 0, k, ox * k, oy * k);
    render(x);
    var px = cv.width * cv.height;
    CACHE.set(key, cv); CACHE_PX += px;
    if (CACHE_PX > CACHE_MAX) {
      var it = CACHE.keys();
      while (CACHE_PX > CACHE_MAX * 0.8 && CACHE.size > 1) {
        var k0 = it.next().value, c0 = CACHE.get(k0);
        CACHE_PX -= c0.width * c0.height; CACHE.delete(k0);
      }
    }
    return cv;
  }
  function blit(ctx, cv, x, y, left, top, w, h, flip, alpha) {
    ctx.save();
    if (alpha < 1) ctx.globalAlpha *= alpha;
    ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(cv, left, top, w, h);
    ctx.restore();
  }

  // =====================================================================
  //  BUST
  // =====================================================================
  function drawBust(ctx, id, cx, cy, h, o) {
    var c = C[id]; if (!c || !(h > 0)) return;
    o = o || {};
    if (o.cache !== false) {
      var k = qScale(ctx), hp = Math.max(8, Math.round(h * k)), hc = hp / k;
      var key = 'B|' + id + '|' + hp + '|' + k + '|' + (o.expr || 'normal') + '|' + (o.bg ? 1 : 0) + '|' + (o.unmasked ? 1 : 0);
      var W = hc * 1.1, H = hc * 1.26, T = hc * 0.68;   // flame hair can rise above the h box
      var cv = cached(key, W, H, W / 2, T, k, function (x) {
        bustCore(x, c, 0, 0, hc, { expr: o.expr, bg: o.bg, unmasked: o.unmasked });
      });
      var r = h / hc;
      blit(ctx, cv, cx, cy, -W / 2 * r, -T * r, W * r, H * r, !!o.flip, 1);
      return;
    }
    bustCore(ctx, c, cx, cy, h, o);
  }
  function bustCore(ctx, c, cx, cy, h, o) {
    var id = c.id;
    var s = h / 4, expr = o.expr || 'normal';
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(o.flip && o.cache === false ? -s : s, s);
    setLW(s); LOD = 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.bg) {
      circ(ctx, 0, 0, 1.97);
      ctx.fillStyle = grad(id + 'bg', function () {
        return rg(0, -0.3, 0.1, 0, 0, 2.0, [[0, hexA(c.color, 0.55)], [0.7, hexA(c.color, 0.25)], [1, hexA(c.color, 0.1)]]);
      });
      ctx.fill();
      ctx.lineWidth = 0.05; ctx.strokeStyle = hexA(c.color, 0.9); ctx.stroke();
      circ(ctx, 0, 0, 1.94); ctx.clip();
    }
    var inos = id === 'inosuke';
    if (c.hairBack) { ctx.save(); ctx.translate(0, -0.45); c.hairBack(ctx, o.t || 0); ctx.restore(); }
    // neck
    ctx.beginPath(); ctx.rect(-0.28, 0.3, 0.56, 0.7); ctx.fillStyle = inos ? c.skin : SKIN; ctx.fill();
    ctx.fillStyle = inos ? c.skinSh : SKIN_SH; ctx.fillRect(-0.28, 0.3, 0.56, 0.22);
    ctx.beginPath(); ctx.moveTo(-0.28, 0.3); ctx.lineTo(-0.28, 1.0); ctx.moveTo(0.28, 0.3); ctx.lineTo(0.28, 1.0); stroke(ctx, 1);
    // torso
    function bodyPath() {
      ctx.beginPath(); ctx.moveTo(-0.4, 0.82);
      ctx.bezierCurveTo(-0.9, 0.95, -1.5, 1.02, -1.66, 1.45); ctx.lineTo(-1.86, 2.2); ctx.lineTo(1.86, 2.2); ctx.lineTo(1.66, 1.45);
      ctx.bezierCurveTo(1.5, 1.02, 0.9, 0.95, 0.4, 0.82); ctx.closePath();
    }
    if (inos) {
      bodyPath(); fs(ctx, c.skin, 1);
      ctx.beginPath();
      ctx.moveTo(-0.95, 1.12); ctx.quadraticCurveTo(-0.5, 1.2, -0.12, 1.08);
      ctx.moveTo(0.95, 1.12); ctx.quadraticCurveTo(0.5, 1.2, 0.12, 1.08);
      ctx.moveTo(-0.9, 1.75); ctx.quadraticCurveTo(-0.45, 1.95, -0.05, 1.7);
      ctx.moveTo(0.9, 1.75); ctx.quadraticCurveTo(0.45, 1.95, 0.05, 1.7);
      ctx.moveTo(0, 1.3); ctx.lineTo(0, 2.1);
      ctx.moveTo(-1.35, 1.35); ctx.quadraticCurveTo(-1.25, 1.7, -1.3, 2.1);
      ctx.moveTo(1.35, 1.35); ctx.quadraticCurveTo(1.25, 1.7, 1.3, 2.1);
      ctx.lineWidth = LW; ctx.strokeStyle = '#b8845e'; ctx.stroke();
    } else if (c.kimono) {
      // pink asanoha kimono, crossed collar, dark obi (nezuko)
      bodyPath(); ctx.save(); ctx.clip();
      c.kimono(ctx, -2, 0.7, 2, 2.3, 1);
      ctx.fillStyle = '#2e1a22'; ctx.fillRect(-2, 1.86, 4, 0.4);
      ctx.fillStyle = '#f2e2c4'; ctx.fillRect(-2, 1.98, 4, 0.07);
      ctx.restore();
      bodyPath(); stroke(ctx, 1);
      ctx.beginPath(); ctx.moveTo(-0.3, 0.84); ctx.lineTo(0.2, 1.62); ctx.lineTo(0.36, 1.5); ctx.lineTo(-0.1, 0.8); ctx.closePath();
      fs(ctx, '#ffe4ee', 0.9);
      ctx.beginPath(); ctx.moveTo(0.3, 0.84); ctx.lineTo(0.06, 1.28); ctx.lineTo(0.14, 1.36); ctx.lineTo(0.42, 0.9); ctx.closePath();
      fs(ctx, '#ffe4ee', 0.9);
      ctx.beginPath(); ctx.moveTo(-1.9, 1.86); ctx.lineTo(1.9, 1.86); stroke(ctx, 0.9);
      var kPanel = function (sd) {
        ctx.save(); ctx.scale(sd, 1);
        ctx.beginPath(); ctx.moveTo(0.62, 0.95);
        ctx.bezierCurveTo(1.05, 1.0, 1.5, 1.06, 1.68, 1.45); ctx.lineTo(1.9, 2.25); ctx.lineTo(0.8, 2.25);
        ctx.quadraticCurveTo(0.62, 1.6, 0.62, 0.95); ctx.closePath();
        ctx.restore();
      };
      for (var kd = -1; kd <= 1; kd += 2) {
        kPanel(kd); ctx.save(); ctx.clip(); c.haori(ctx, -2, 0.8, 2, 2.3, 2.2, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(kd > 0 ? 0.62 : -0.82, 0.8, 0.2, 1.5);
        ctx.restore(); kPanel(kd); stroke(ctx, 1);
      }
    } else {
      bodyPath(); fs(ctx, UNI, 1);
      ctx.beginPath(); ctx.moveTo(0, 1.05); ctx.lineTo(0, 2.2); ctx.lineWidth = LW; ctx.strokeStyle = UNI_HI; ctx.stroke();
      circ(ctx, 0.12, 1.5, 0.05); ctx.fillStyle = '#d9c68a'; ctx.fill();
      circ(ctx, 0.12, 1.9, 0.05); ctx.fill();
      // standing collar
      ctx.beginPath(); ctx.moveTo(-0.36, 0.7); ctx.lineTo(0.36, 0.7); ctx.lineTo(0.44, 1.02); ctx.quadraticCurveTo(0, 1.12, -0.44, 1.02); ctx.closePath();
      fs(ctx, UNI, 1);
      // haori panels
      var panelPath = function (sd) {
        ctx.save(); ctx.scale(sd, 1);
        ctx.beginPath(); ctx.moveTo(0.5, 0.92);
        ctx.bezierCurveTo(1.0, 0.98, 1.5, 1.04, 1.68, 1.45); ctx.lineTo(1.9, 2.25); ctx.lineTo(0.62, 2.25);
        ctx.quadraticCurveTo(0.48, 1.6, 0.5, 0.92); ctx.closePath();
        ctx.restore();
      };
      for (var sd = -1; sd <= 1; sd += 2) {
        panelPath(sd);
        ctx.save(); ctx.clip();
        c.haori(ctx, -2, 0.8, 2, 2.3, 2.2, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(sd > 0 ? 0.5 : -0.75, 0.8, 0.25, 1.5);
        ctx.restore();
        panelPath(sd); stroke(ctx, 1);
      }
    }
    // head
    ctx.save(); ctx.translate(0, -0.45);
    drawHead(ctx, c, expr, o.t || 0, 0, { unmasked: !!o.unmasked });
    ctx.restore();
    ctx.restore();
  }

  var MIXC = {};
  function mixW(hex, f) {
    var key = hex + f; if (MIXC[key]) return MIXC[key];
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (MIXC[key] = 'rgb(' + Math.round(r + (255 - r) * f) + ',' + Math.round(g + (255 - g) * f) + ',' + Math.round(b + (255 - b) * f) + ')');
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // =====================================================================
  //  FULL FIGURE
  // =====================================================================
  var FIG_H = 5.6;
  function bladeAngle(sw) { return sw < 0.5 ? lerp(-2.5, -0.05, ease(sw / 0.5)) : lerp(-0.05, 1.25, ease((sw - 0.5) / 0.5)); }
  function handAng(a) { return a < 0 ? a * 0.9 - 0.08 : a * 0.72; }

  function drawFigure(ctx, id, x, y, h, o) {
    var c = C[id]; if (!c) return;
    o = o || {};
    var alpha = o.alpha == null ? 1 : o.alpha, hurt = clamp01(o.hurt || 0);
    if (alpha <= 0 || h <= 0) return;
    if (o.cache !== false) {
      var k = qScale(ctx), hp = Math.max(8, Math.round(h * k)), hc = hp / k;
      var walk = (typeof o.walk === 'number') ? Math.round((((o.walk % 1) + 1) % 1) * 8) % 8 : -1;
      var sw = (typeof o.swing === 'number') ? Math.round(clamp01(o.swing) * 20) : -1;
      var bf = (walk < 0 && sw < 0) ? Math.round(((((o.t || 0) * 2.4 / TAU) % 1 + 1) % 1) * 8) % 8 : 0;
      var kn = Math.round(clamp01(o.kneel || 0) * 4), hf = Math.round(hurt * 4);
      var key = 'F|' + c.id + '|' + hp + '|' + k + '|' + walk + '|' + sw + '|' + bf + '|' + kn + '|' + hf + '|' +
        (o.sword === false ? 0 : 1) + '|' + (o.expr || '') + '|' + (o.unmasked ? 1 : 0) + '|' + (o.trail === false ? 0 : 1);
      var W = hc * 1.64, H = hc * 1.24, L = hc * 0.82, T = hc * 1.12;
      var cv = cached(key, W, H, L, T, k, function (x) {
        var q = { facing: 1, t: bf * TAU / 8 / 2.4, walk: walk < 0 ? null : walk / 8, swing: sw < 0 ? null : sw / 20,
          kneel: kn / 4, sword: o.sword, expr: o.expr, unmasked: o.unmasked, trail: o.trail };
        figureCore(x, c, 0, 0, hc, q, hf / 4);
        if (hf > 0) tint(x, hf / 4, -L, -T, W, H);
      });
      var r = h / hc;
      blit(ctx, cv, x, y, -L * r, -T * r, W * r, H * r, o.facing === -1, alpha);
      return;
    }
    if (alpha < 1 || hurt > 0.01) {
      viaScratch(ctx, x - h * 0.82, y - h * 1.12, h * 1.64, h * 1.24, hurt, alpha, function (s) { figureCore(s, c, x, y, h, o, hurt); });
      return;
    }
    figureCore(ctx, c, x, y, h, o, 0);
  }
  function tint(x, amt, l, t, w, h) {
    x.save(); x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(255,40,50,' + (0.42 * amt).toFixed(3) + ')';
    x.fillRect(l, t, w, h); x.restore();
  }

  function figureCore(ctx, c, x, y, h, o, hurt) {
    var s = h / FIG_H, facing = o.facing === -1 ? -1 : 1;
    var t = o.t || 0;
    var walk = (typeof o.walk === 'number') ? o.walk : null;
    var sw = (typeof o.swing === 'number') ? clamp01(o.swing) : null;
    var kn = clamp01(o.kneel || 0);
    var hasSword = o.sword !== false && !c.noSword;
    var inos = c.id === 'inosuke';
    var kick = !!c.kick && sw !== null;     // barehanded fighters (nezuko): swing = kick
    var expr = o.expr || (hurt > 0.3 ? 'hurt' : (sw !== null ? 'fierce' : 'normal'));

    ctx.save();
    ctx.translate(x, y); ctx.scale(s * facing, s);
    setLW(s); LOD = h < 70 ? 1 : 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.translate(-0.3 * hurt, 0);

    var breath = (walk === null && sw === null) ? Math.sin(t * 2.4) * 0.035 : 0;
    var p = walk !== null ? walk * TAU : 0;
    var bob = walk !== null ? Math.abs(Math.sin(p)) * 0.1 : 0;
    var hipY = -1.5 + kn * 0.62 - bob + (walk === null ? breath * 0.3 : 0);
    var lean = -0.22 * hurt + (kick ? -0.1 : sw !== null ? (sw > 0.4 ? 0.12 : -0.05) : 0.03) + kn * 0.08;
    var shY = hipY - 1.55 + breath;
    var legW = 0.5;

    // ---- legs (computed) ----
    function kickAng(v) { return v < 0.5 ? lerp(1.35, -0.12, ease(v / 0.5)) : lerp(-0.12, 0.72, ease((v - 0.5) / 0.5)); }
    function kickLen(v) { return v < 0.5 ? lerp(1.0, 1.55, ease(v / 0.5)) : lerp(1.55, 1.4, (v - 0.5) / 0.5); }
    function legPts(side) {
      var hx = side * 0.27, hy = hipY + 0.12;
      if (kick && side > 0) {
        var ka = kickAng(sw), kl = kickLen(sw), bend = sw < 0.5 ? lerp(0.5, 0.05, ease(sw / 0.5)) : lerp(0.05, 0.22, (sw - 0.5) / 0.5);
        var kfx = hx + kl * Math.cos(ka), kfy = hy + kl * Math.sin(ka);
        return [hx, hy, (hx + kfx) / 2 + Math.sin(ka) * bend, (hy + kfy) / 2 - Math.cos(ka) * bend, kfx, kfy];
      }
      var fx = side * 0.36, fy = 0, kx, ky;
      if (walk !== null) {
        var ph = p + (side > 0 ? 0 : Math.PI);
        fx += 0.42 * Math.sin(ph); fy = -Math.max(0, Math.cos(ph)) * 0.22;
      }
      kx = (hx + fx) / 2 + 0.08 + (walk !== null ? Math.max(0, Math.cos(p + (side > 0 ? 0 : Math.PI))) * 0.1 : 0); ky = (hy + fy) / 2;
      if (kn > 0) {
        var kkx, kky, kfx, kfy;
        if (side > 0) { kkx = 0.72; kky = hipY + 0.05; kfx = 0.7; kfy = 0; }
        else { kkx = -0.25; kky = -0.05; kfx = -0.95; kfy = -0.05; }
        kx = lerp(kx, kkx, kn); ky = lerp(ky, kky, kn); fx = lerp(fx, kfx, kn); fy = lerp(fy, kfy, kn);
      }
      return [hx, hy, kx, ky, fx, fy];
    }
    function drawLeg(L) {
      ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(L[2], L[3]); ctx.lineTo(lerp(L[2], L[4], 0.5), lerp(L[3], L[5], 0.5));
      oline(ctx, legW + 0.05, inos ? '#3a4a5c' : (c.legCol || UNI));
      // wraps
      var wx = lerp(L[2], L[4], 0.35), wy = lerp(L[3], L[5], 0.35);
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(L[4], L[5] - 0.12);
      oline(ctx, 0.33, inos ? '#6b5a4c' : (c.wrapCol || '#f1f1ec'));
      if (!LOD && c.wrapLines !== false) {
        ctx.beginPath();
        for (var i = 1; i < 4; i++) { var q = i / 4; var xx = lerp(wx, L[4], q), yy = lerp(wy, L[5] - 0.12, q); ctx.moveTo(xx - 0.16, yy - 0.05); ctx.lineTo(xx + 0.16, yy + 0.03); }
        ctx.lineWidth = LW * 0.8; ctx.strokeStyle = inos ? '#3d322a' : '#9a9a9a'; ctx.stroke();
      }
      // foot
      ell(ctx, L[4] + 0.12, L[5] - 0.07, 0.24, 0.1); fs(ctx, inos ? '#e0c09a' : '#f4f4f4', 1);
      ctx.beginPath(); ctx.moveTo(L[4] - 0.1, L[5] - 0.01); ctx.lineTo(L[4] + 0.34, L[5] - 0.01); ctx.lineWidth = LW * 1.4; ctx.strokeStyle = '#5a3a2a'; ctx.stroke();
    }

    // ---- arms / sword geometry ----
    var SF = [0.6, shY + 0.2], SB = [-0.6, shY + 0.2];
    var a = 0.45, P, Pb, ab = 0;
    if (hasSword) {
      a = sw === null ? 0.45 + Math.sin(t * 2.4) * 0.03 : bladeAngle(sw);
      var ah = handAng(a), pv = [0.25, shY + 0.35];
      P = [pv[0] + 0.95 * Math.cos(ah), pv[1] + 0.95 * Math.sin(ah)];
      if (inos) {
        if (sw === null) { Pb = [-0.95, shY + 1.05]; ab = Math.PI - 0.55; }
        else {
          ab = bladeAngle(Math.max(0, sw - 0.18)) + 0.25;
          var ah2 = handAng(ab);
          Pb = [pv[0] - 0.4 + 0.85 * Math.cos(ah2), pv[1] + 0.12 + 0.85 * Math.sin(ah2)];
        }
      } else {
        Pb = [P[0] - Math.cos(a) * 0.3, P[1] - Math.sin(a) * 0.3];
      }
    } else if (kick) {
      // claw guard: front hand up and forward, back hand out for balance
      var kq = Math.sin(Math.PI * sw);
      P = [0.72 + 0.2 * kq, shY + 0.8 - 0.3 * kq]; Pb = [-0.9 - 0.1 * kq, shY + 0.95 - 0.2 * kq];
    } else {
      P = [0.78, shY + 1.25]; Pb = [-0.78, shY + 1.25];
    }
    var len = inos ? 2.0 : (c.bladeLen || 2.35);
    var bladeBehind = hasSword && a < -1.2;

    function leanOn() { ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY); }
    function sleeve(S, H, front) {
      if (inos) {
        limb(ctx, S[0], S[1], H[0], H[1], 0.22, 0.16); fs(ctx, c.skin, 1);
      } else {
        limb(ctx, S[0], S[1], H[0], H[1], 0.3, 0.24);
        ctx.save(); ctx.clip();
        c.haori(ctx, Math.min(S[0], H[0]) - 0.5, Math.min(S[1], H[1]) - 0.5, Math.max(S[0], H[0]) + 0.5, Math.max(S[1], H[1]) + 0.5, 99, 0.8);
        if (c.cuff) {
          // under-kimono cuff showing at the wrist
          ctx.beginPath(); ctx.moveTo(lerp(S[0], H[0], 0.8), lerp(S[1], H[1], 0.8)); ctx.lineTo(H[0], H[1]);
          ctx.lineWidth = 0.7; ctx.strokeStyle = c.cuff; ctx.stroke();
        }
        if (c.id === 'rengoku') {
          // flame cuff near hand
          ctx.beginPath(); ctx.moveTo(lerp(S[0], H[0], 0.72), lerp(S[1], H[1], 0.72)); ctx.lineTo(H[0], H[1]);
          ctx.lineWidth = 0.7; ctx.strokeStyle = '#e8401f'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(lerp(S[0], H[0], 0.85), lerp(S[1], H[1], 0.85)); ctx.lineTo(H[0], H[1]);
          ctx.lineWidth = 0.7; ctx.strokeStyle = '#ff9a2a'; ctx.stroke();
        }
        if (!front) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-3, -8, 6, 9); }
        ctx.restore();
        limb(ctx, S[0], S[1], H[0], H[1], 0.3, 0.24); stroke(ctx, 1);
      }
    }

    // ===== 1. behind-body layer =====
    leanOn();
    if (c.id === 'tanjiro' && !LOD) {
      // wooden box on the back
      var bx = -1.25, by = shY - 0.45;
      ctx.beginPath(); ctx.rect(bx, by, 1.0, 1.5); fs(ctx, '#c9975a', 1);
      ctx.beginPath(); ctx.rect(bx + 0.12, by + 0.12, 0.76, 1.26); ctx.lineWidth = LW * 1.2; ctx.strokeStyle = '#6b4424'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 0.12, by + 0.7); ctx.lineTo(bx + 0.88, by + 0.7); ctx.moveTo(bx + 0.5, by + 0.12); ctx.lineTo(bx + 0.5, by + 1.38); ctx.stroke();
      ctx.beginPath(); ctx.rect(bx - 0.04, by - 0.08, 1.08, 0.14); fs(ctx, '#7a4a26', 1);
    }
    if (c.hairBack) {
      ctx.save(); ctx.translate(0.06, shY - 1.2); if (sw !== null) ctx.rotate(0.05);
      c.hairBack(ctx, t);
      ctx.restore();
    }
    if (hasSword && inos) { drawSword(ctx, c, Pb[0], Pb[1], ab, len); }
    sleeve(SB, Pb, false);
    if (inos) hand(ctx, Pb[0], Pb[1], 0.15, c.skin);
    else if (c.noSword) hand(ctx, Pb[0], Pb[1], 0.15);
    if (!inos) {
      var bot = hipY + 0.68;
      var haoriPath = function () {
        ctx.beginPath(); ctx.moveTo(-0.32, shY - 0.08);
        ctx.quadraticCurveTo(-0.8, shY - 0.02, -0.95, shY + 0.3);
        ctx.lineTo(-1.2 - (walk !== null ? 0.05 * Math.sin(p) : 0), bot);
        ctx.quadraticCurveTo(-0.6, bot + 0.12, 0, bot + 0.04); ctx.quadraticCurveTo(0.6, bot + 0.12, 1.18, bot);
        ctx.lineTo(0.95, shY + 0.3); ctx.quadraticCurveTo(0.8, shY - 0.02, 0.32, shY - 0.08); ctx.closePath();
      };
      haoriPath();
      ctx.save(); ctx.clip();
      c.haori(ctx, -1.4, shY - 0.3, 1.4, bot + 0.3, bot + 0.08, 1, 1.45);
      ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(-1.4, shY - 0.3, 0.55, 5);
      ctx.restore();
      haoriPath(); stroke(ctx, 1);
    }
    ctx.restore();

    // ===== 2. legs =====
    // kick trail: crescent following the kicking foot
    if (kick && o.trail !== false && sw > 0.12) {
      var KN = 12, ks0 = Math.max(0, sw - 0.42), ko = [], ki = [], kj;
      for (kj = 0; kj <= KN; kj++) {
        var kv = lerp(ks0, sw, kj / KN), kA = kickAng(kv), kR = kickLen(kv) + 0.3;
        var kr = lerp(kR, kR * 0.3, kj / KN);
        ko.push(0.27 + Math.cos(kA) * kR, hipY + 0.12 + Math.sin(kA) * kR);
        ki.push(0.27 + Math.cos(kA) * kr, hipY + 0.12 + Math.sin(kA) * kr);
      }
      ctx.beginPath(); ctx.moveTo(ko[0], ko[1]);
      for (kj = 2; kj < ko.length; kj += 2) ctx.lineTo(ko[kj], ko[kj + 1]);
      for (kj = ki.length - 2; kj >= 0; kj -= 2) ctx.lineTo(ki[kj], ki[kj + 1]);
      ctx.closePath();
      ctx.save();
      var kfade = sw > 0.85 ? (1 - sw) / 0.15 : 1;
      ctx.globalAlpha *= 0.82 * kfade; ctx.fillStyle = mixW(c.color, c.trailMix); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ko[0], ko[1]);
      for (kj = 2; kj < ko.length; kj += 2) ctx.lineTo(ko[kj], ko[kj + 1]);
      ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 1.8); ctx.lineWidth = 0.1; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    }
    var Lb = legPts(-1), Lf = legPts(1);
    drawLeg(Lb); drawLeg(Lf);

    // ===== 3. torso, head, front arm =====
    leanOn();
    // pelvis / pants top
    ctx.beginPath(); ctx.moveTo(-0.52, hipY - 0.15); ctx.lineTo(0.52, hipY - 0.15); ctx.lineTo(0.56, hipY + 0.3); ctx.quadraticCurveTo(0, hipY + 0.42, -0.56, hipY + 0.3); ctx.closePath();
    fs(ctx, inos ? '#3a4a5c' : UNI, 1);
    // neck
    ctx.beginPath(); ctx.rect(-0.19, shY - 0.35, 0.38, 0.4); ctx.fillStyle = inos ? c.skin : SKIN; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.19, shY - 0.35); ctx.lineTo(-0.19, shY + 0.02); ctx.moveTo(0.19, shY - 0.35); ctx.lineTo(0.19, shY + 0.02); stroke(ctx, 1);
    if (inos) {
      ctx.beginPath(); ctx.moveTo(-0.3, shY - 0.05); ctx.quadraticCurveTo(-0.8, shY - 0.02, -0.82, shY + 0.35);
      ctx.lineTo(-0.66, hipY - 0.1); ctx.lineTo(0.66, hipY - 0.1); ctx.lineTo(0.82, shY + 0.35); ctx.quadraticCurveTo(0.8, shY - 0.02, 0.3, shY - 0.05); ctx.closePath();
      fs(ctx, c.skin, 1);
      ctx.beginPath();
      ctx.moveTo(-0.62, shY + 0.5); ctx.quadraticCurveTo(-0.3, shY + 0.62, -0.04, shY + 0.45);
      ctx.moveTo(0.62, shY + 0.5); ctx.quadraticCurveTo(0.3, shY + 0.62, 0.04, shY + 0.45);
      ctx.moveTo(0, shY + 0.55); ctx.lineTo(0, hipY - 0.3);
      if (!LOD) { ctx.moveTo(-0.3, shY + 0.95); ctx.lineTo(-0.08, shY + 0.97); ctx.moveTo(0.3, shY + 0.95); ctx.lineTo(0.08, shY + 0.97); ctx.moveTo(-0.28, shY + 1.2); ctx.lineTo(-0.08, shY + 1.21); ctx.moveTo(0.28, shY + 1.2); ctx.lineTo(0.08, shY + 1.21); }
      ctx.lineWidth = LW; ctx.strokeStyle = '#b8845e'; ctx.stroke();
      // fur pelt
      curvy(ctx, [-0.72, hipY - 0.32, 0.72, hipY - 0.32, 0.78, hipY + 0.1, 0.62, hipY + 0.5, 0.45, hipY + 0.25, 0.28, hipY + 0.58, 0.1, hipY + 0.3,
        -0.1, hipY + 0.6, -0.28, hipY + 0.3, -0.45, hipY + 0.58, -0.62, hipY + 0.25, -0.78, hipY + 0.45, -0.8, hipY + 0.05], 0.04);
      fs(ctx, '#7a6a5e', 1);
      if (!LOD) { ctx.beginPath(); ctx.moveTo(-0.5, hipY - 0.2); ctx.lineTo(-0.42, hipY + 0.1); ctx.moveTo(0.1, hipY - 0.2); ctx.lineTo(0.16, hipY + 0.12); ctx.moveTo(0.5, hipY - 0.22); ctx.lineTo(0.44, hipY + 0.1); ctx.lineWidth = LW; ctx.strokeStyle = '#4a3d35'; ctx.stroke(); }
    } else if (c.kimono) {
      // pink kimono front with skirt to the knee, crossed collar and obi
      var skH = hipY + 0.86;
      var kimPath = function () {
        ctx.beginPath(); ctx.moveTo(-0.4, shY - 0.08); ctx.lineTo(0.4, shY - 0.08); ctx.lineTo(0.5, hipY - 0.1);
        ctx.lineTo(0.7, skH); ctx.quadraticCurveTo(0, skH + 0.08, -0.7, skH); ctx.lineTo(-0.5, hipY - 0.1); ctx.closePath();
      };
      kimPath(); ctx.save(); ctx.clip();
      c.kimono(ctx, -0.8, shY - 0.2, 0.8, skH + 0.2, 0.9);
      ctx.fillStyle = 'rgba(120,20,60,0.12)'; ctx.fillRect(-0.8, hipY - 0.1, 0.5, 1.2);
      ctx.restore(); kimPath(); stroke(ctx, 1);
      ctx.beginPath(); ctx.moveTo(-0.26, shY - 0.08); ctx.lineTo(0.18, shY + 0.62); ctx.moveTo(0.26, shY - 0.08); ctx.lineTo(0.04, shY + 0.34);
      ctx.lineWidth = 0.1; ctx.strokeStyle = '#ffe4ee'; ctx.stroke();
      ctx.beginPath(); ctx.rect(-0.5, hipY - 0.46, 1.0, 0.34); fs(ctx, '#2e1a22', 1);
      ctx.fillStyle = '#f2e2c4'; ctx.fillRect(-0.5, hipY - 0.33, 1.0, 0.07);
    } else {
      // uniform strip between haori panels
      ctx.beginPath(); ctx.moveTo(-0.34, shY - 0.08); ctx.lineTo(0.34, shY - 0.08); ctx.lineTo(0.44, hipY + 0.05); ctx.lineTo(-0.44, hipY + 0.05); ctx.closePath();
      fs(ctx, UNI, 1);
      ctx.beginPath(); ctx.rect(-0.44, hipY - 0.32, 0.88, 0.16); fs(ctx, '#efefe8', 0.9);
      ctx.beginPath(); ctx.moveTo(-0.3, shY - 0.2); ctx.lineTo(0.3, shY - 0.2); ctx.lineTo(0.34, shY + 0.06); ctx.lineTo(-0.34, shY + 0.06); ctx.closePath();
      fs(ctx, UNI, 1);
    }
    function frontArm() {
      if (hasSword && !inos) hand(ctx, Pb[0], Pb[1], 0.15);
      sleeve(SF, P, true);
      hand(ctx, P[0], P[1], 0.16, inos ? c.skin : SKIN);
    }
    // blade raised behind the head: sword + arms go behind the head
    if (bladeBehind) { drawSword(ctx, c, P[0], P[1], a, len); frontArm(); }
    // head
    ctx.save(); ctx.translate(0.06, shY - 1.2); if (sw !== null) ctx.rotate(0.05);
    drawHead(ctx, c, expr, t, 0.1, { unmasked: !!o.unmasked });
    ctx.restore();
    // slash trail: crescent following the real blade-tip path
    if (hasSword && sw !== null && o.trail !== false && sw > 0.12) {
      var N = 10, s0 = Math.max(0, sw - 0.3), outer = [], inner = [], i2;
      for (i2 = 0; i2 <= N; i2++) {
        var ss = lerp(s0, sw, i2 / N), aa = bladeAngle(ss), hh = handAng(aa);
        var hx0 = 0.25 + 0.95 * Math.cos(hh), hy0 = shY + 0.35 + 0.95 * Math.sin(hh);
        var ca2 = Math.cos(aa), sa2 = Math.sin(aa), q = i2 / N;
        outer.push(hx0 + ca2 * (0.22 + len), hy0 + sa2 * (0.22 + len));
        var rin = lerp(0.22 + len, len * 0.4, q);
        inner.push(hx0 + ca2 * rin, hy0 + sa2 * rin);
      }
      ctx.beginPath(); ctx.moveTo(outer[0], outer[1]);
      for (i2 = 2; i2 < outer.length; i2 += 2) ctx.lineTo(outer[i2], outer[i2 + 1]);
      for (i2 = inner.length - 2; i2 >= 0; i2 -= 2) ctx.lineTo(inner[i2], inner[i2 + 1]);
      ctx.closePath();
      ctx.save();
      var fade = sw > 0.85 ? (1 - sw) / 0.15 : 1;
      ctx.globalAlpha *= 0.82 * fade; ctx.fillStyle = mixW(c.color, c.trailMix); ctx.fill();
      ctx.beginPath(); ctx.moveTo(outer[0], outer[1]);
      for (i2 = 2; i2 < outer.length; i2 += 2) ctx.lineTo(outer[i2], outer[i2 + 1]);
      ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 1.8); ctx.lineWidth = 0.1; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    }
    if (!bladeBehind) {
      if (hasSword) drawSword(ctx, c, P[0], P[1], a, len);
      frontArm();
    }
    ctx.restore();

    ctx.restore();
  }

  // =====================================================================
  //  CHIBI TOP (top-down sprite)
  // =====================================================================
  function drawChibiTop(ctx, id, x, y, h, o) {
    var c = C[id]; if (!c) return;
    o = o || {};
    var alpha = o.alpha == null ? 1 : o.alpha, hurt = clamp01(o.hurt || 0);
    if (alpha <= 0 || h <= 0) return;
    if (o.cache !== false) {
      var k = qScale(ctx), hp = Math.max(8, Math.round(h * k)), hc = hp / k;
      var DIRS = 32, ab = Math.round(((((o.ang || 0) / TAU) % 1 + 1) % 1) * DIRS) % DIRS;
      var t = o.t || 0, fr, tq;
      if (o.moving) { fr = Math.floor(((t * 14 / TAU) % 1 + 1) % 1 * 6); tq = (fr + 0.5) / 6 * TAU / 14; }
      else { fr = Math.floor(((t * 2.4 / TAU) % 1 + 1) % 1 * 4); tq = (fr + 0.5) / 4 * TAU / 2.4; }
      var hf = Math.round(hurt * 4);
      var key = 'C|' + c.id + '|' + hp + '|' + k + '|' + ab + '|' + (o.moving ? 'm' : 'i') + fr + '|' + hf + '|' + (o.sword === false ? 0 : 1) + (o.unmasked ? 'u' : '');
      var W = hc * 1.7, H = hc * 1.72, L = hc * 0.85, T = hc * 1.3;
      var cv = cached(key, W, H, L, T, k, function (x) {
        chibiCore(x, c, 0, 0, hc, { ang: ab / DIRS * TAU, t: tq, moving: o.moving, sword: o.sword, unmasked: o.unmasked });
        if (hf > 0) tint(x, hf / 4, -L, -T, W, H);
      });
      var r = h / hc;
      blit(ctx, cv, x, y, -L * r, -T * r, W * r, H * r, false, alpha);
      return;
    }
    if (alpha < 1 || hurt > 0.01) {
      viaScratch(ctx, x - h * 0.85, y - h * 1.3, h * 1.7, h * 1.72, hurt, alpha, function (s) { chibiCore(s, c, x, y, h, o); });
      return;
    }
    chibiCore(ctx, c, x, y, h, o);
  }

  function chibiCore(ctx, c, x, y, h, o) {
    var s = h / 3.0, ang = o.ang || 0, t = o.t || 0;
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var inos = c.id === 'inosuke';
    var hasSword = o.sword !== false && !c.noSword;
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    setLW(s); LOD = 1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var mv = o.moving ? Math.sin(t * 14) : 0;
    var bob = o.moving ? Math.abs(mv) * 0.08 : Math.sin(t * 2.4) * 0.02;
    var back = sa < -0.45;         // facing away from camera
    var fx = ca * 0.22;
    // shadow
    ell(ctx, 0, 0, 0.62, 0.18); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
    ctx.translate(0, -bob);
    // blade geometry (screen space, foreshortened vertically)
    var hx = ca * 0.55, hy = -0.72 + sa * 0.3;
    var bAng = Math.atan2(sa * 0.8, ca);
    var blen = 1.35;
    function blades(front) {
      if (c.noSword) {
        // barehanded: both hands reach forward along ang, with little pink claws
        var px = -sa, py = ca * 0.5;
        for (var hs = -1; hs <= 1; hs += 2) {
          var cx0 = ca * 0.5 + px * 0.3 * hs, cy0 = -0.78 + sa * 0.3 + py * 0.3 * hs;
          ctx.beginPath(); ctx.moveTo(cx0 + ca * 0.1, cy0 + sa * 0.08);
          ctx.lineTo(cx0 + ca * 0.3 + px * 0.06, cy0 + sa * 0.24 + py * 0.06);
          ctx.moveTo(cx0 + ca * 0.1, cy0 + sa * 0.08);
          ctx.lineTo(cx0 + ca * 0.3 - px * 0.06, cy0 + sa * 0.24 - py * 0.06);
          ctx.lineWidth = LW * 1.6; ctx.strokeStyle = '#e0407e'; ctx.stroke();
          hand(ctx, cx0, cy0, 0.16);
        }
        return;
      }
      if (!hasSword) return;
      if (inos) {
        var hx2 = -ca * 0.35 + (-sa) * 0.35, hy2 = -0.72 + ca * 0.2;
        drawSword(ctx, c, hx2, hy2, bAng + (ca >= 0 ? -0.6 : 0.6), blen * 0.85, true);
      }
      drawSword(ctx, c, hx, hy, bAng, blen, false);
      hand(ctx, hx, hy, 0.17, inos ? c.skin : SKIN);
    }
    var swordFirst = sa < 0.1;
    function longHair() {
      if (!c.hairBack) return;
      ctx.save(); ctx.translate(0, -1.95); ctx.scale(0.95, 0.95); c.hairBack(ctx, t); ctx.restore();
    }
    if (!back) longHair();
    if (swordFirst) blades();
    // feet
    var fo = mv * 0.14;
    ell(ctx, -0.26, -0.06 - Math.max(0, fo), 0.17, 0.12); fs(ctx, inos ? '#6b5a4c' : '#f1f1ec', 1);
    ell(ctx, 0.26, -0.06 - Math.max(0, -fo), 0.17, 0.12); fs(ctx, inos ? '#6b5a4c' : '#f1f1ec', 1);
    // body
    if (inos) {
      ctx.beginPath(); ctx.moveTo(-0.55, -0.12); ctx.lineTo(0.55, -0.12); ctx.lineTo(0.5, -0.5); ctx.lineTo(-0.5, -0.5); ctx.closePath(); fs(ctx, '#3a4a5c', 1);
      ctx.beginPath(); ctx.moveTo(-0.5, -0.5); ctx.lineTo(-0.58, -1.15); ctx.lineTo(0.58, -1.15); ctx.lineTo(0.5, -0.5); ctx.closePath(); fs(ctx, c.skin, 1);
      curvy(ctx, [-0.6, -0.62, 0.6, -0.62, 0.62, -0.38, 0.4, -0.25, 0.2, -0.4, 0, -0.22, -0.2, -0.4, -0.4, -0.25, -0.62, -0.38], 0.03);
      fs(ctx, '#7a6a5e', 1);
    } else {
      var bp = function () { ctx.beginPath(); ctx.moveTo(-0.5, -1.18); ctx.lineTo(0.5, -1.18); ctx.lineTo(0.72, -0.14); ctx.quadraticCurveTo(0, -0.04, -0.72, -0.14); ctx.closePath(); };
      bp(); ctx.save(); ctx.clip();
      c.haori(ctx, -0.8, -1.3, 0.8, 0, -0.1, 0.8);
      ctx.restore(); bp(); stroke(ctx, 1);
      if (!back && c.kimono) {
        var kp = function () { ctx.beginPath(); ctx.moveTo(-0.28 + fx * 0.3, -1.18); ctx.lineTo(0.28 + fx * 0.3, -1.18); ctx.lineTo(0.46 + fx * 0.3, -0.12); ctx.quadraticCurveTo(fx * 0.3, -0.06, -0.46 + fx * 0.3, -0.12); ctx.closePath(); };
        kp(); ctx.save(); ctx.clip(); c.kimono(ctx, -0.8, -1.3, 0.8, 0, 0.8); ctx.restore(); kp(); stroke(ctx, 0.8);
        ctx.beginPath(); ctx.rect(-0.4 + fx * 0.3, -0.74, 0.8, 0.22); fs(ctx, '#2e1a22', 0.8);
        ctx.fillStyle = '#f2e2c4'; ctx.fillRect(-0.4 + fx * 0.3, -0.66, 0.8, 0.06);
      } else if (!back) {
        ctx.beginPath(); ctx.moveTo(-0.2 + fx * 0.3, -1.18); ctx.lineTo(0.2 + fx * 0.3, -1.18); ctx.lineTo(0.26 + fx * 0.3, -0.3); ctx.lineTo(-0.26 + fx * 0.3, -0.3); ctx.closePath();
        fs(ctx, UNI, 0.8);
        ctx.fillStyle = '#efefe8'; ctx.fillRect(-0.26 + fx * 0.3, -0.62, 0.52, 0.1);
      }
    }
    if (back) longHair();
    // head
    ctx.save(); ctx.translate(0, -1.95); ctx.scale(0.95, 0.95);
    drawHead(ctx, c, 'normal', t, back ? 0 : fx, { back: back, unmasked: !!o.unmasked });
    ctx.restore();
    if (!swordFirst) blades();
    ctx.restore();
  }

  // =====================================================================
  //  data URL
  // =====================================================================
  var URLC = {};
  function bustDataURL(id, px, o) {
    o = o || {};
    var bg = o.bg !== false, expr = o.expr || 'normal';
    var key = id + '|' + px + '|' + expr + '|' + (o.flip ? 1 : 0) + '|' + (bg ? 1 : 0) + '|' + (o.unmasked ? 1 : 0);
    if (URLC[key]) return URLC[key];
    var cv = document.createElement('canvas'); cv.width = cv.height = px;
    var x = cv.getContext('2d');
    drawBust(x, id, px / 2, px / 2, px, { expr: expr, flip: !!o.flip, bg: bg, unmasked: !!o.unmasked, cache: false });
    return (URLC[key] = cv.toDataURL('image/png'));
  }

  global.KChars = {
    version: 1,
    list: LIST,
    byStyle: function (st) { for (var i = 0; i < LIST.length; i++) if (LIST[i].style === st) return LIST[i]; return null; },
    byId: function (id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; },
    drawBust: drawBust,
    drawFigure: drawFigure,
    drawChibiTop: drawChibiTop,
    bustDataURL: bustDataURL,
    clearCache: function () { CACHE.clear(); CACHE_PX = 0; },
    setCacheLimit: function (px) { CACHE_MAX = Math.max(1e5, px | 0); },
    cacheStats: function () { return { entries: CACHE.size, pixels: CACHE_PX, limit: CACHE_MAX }; }
  };
})(typeof window !== 'undefined' ? window : this);
