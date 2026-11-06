/* ===== Settings you can edit ===== */
// Paste your Fiverr profile link here once it is live, e.g. "https://www.fiverr.com/asharzafar"
var FIVERR_URL = "";
/* ================================= */

(function () {
  "use strict";
  var root = document.documentElement;
  var data = window.PORTFOLIO || { headshot: "", works: [] };
  var works = data.works || [];
  var CATS = { products: "Products", scenes: "Scenes", interiors: "Interiors", vehicles: "Vehicles", characters: "Characters", game: "Games", design: "Design", photo: "Photography" };

  document.getElementById("year").textContent = new Date().getFullYear();

  /* --- Fiverr button --- */
  if (FIVERR_URL) {
    var fb = document.getElementById("fiverr-btn");
    fb.href = FIVERR_URL; fb.hidden = false;
  }

  /* --- headshot --- */
  if (data.headshot) {
    var av = document.getElementById("avatar");
    av.src = data.headshot; av.hidden = false;
  }

  /* --- theme toggle --- */
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* --- copy buttons --- */
  document.querySelectorAll(".copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      function done() { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectText(b); });
      } else { selectText(b); }
    });
  });
  function selectText(b) {
    var v = b.parentNode.querySelector(".v");
    var r = document.createRange(); r.selectNodeContents(v);
    var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* --- gallery --- */
  var gallery = document.getElementById("gallery");
  var filters = document.getElementById("filters");
  var current = "all";
  var visible = [];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function buildFilters() {
    var counts = {};
    works.forEach(function (w) { counts[w.cat] = (counts[w.cat] || 0) + 1; });
    var keys = ["all"].concat(Object.keys(CATS).filter(function (k) { return counts[k]; }));
    if (keys.length <= 2) { filters.hidden = true; return; }
    keys.forEach(function (k) {
      var b = el("button", "filter", k === "all" ? "All" : CATS[k]);
      b.type = "button";
      b.setAttribute("aria-pressed", k === current ? "true" : "false");
      var n = el("span", "n", String(k === "all" ? works.length : counts[k])); b.appendChild(n);
      b.addEventListener("click", function () { current = k; filters.querySelectorAll(".filter").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); render(); });
      filters.appendChild(b);
    });
  }

  function render() {
    gallery.innerHTML = "";
    visible = works.filter(function (w) { return current === "all" || w.cat === current; });
    document.getElementById("gallery-empty").hidden = visible.length > 0;
    visible.forEach(function (w, i) {
      var t = el("button", "tile"); t.type = "button";
      t.setAttribute("aria-label", "Open " + w.title);
      var img = el("img"); img.src = w.thumb; img.alt = w.title; img.loading = "lazy"; img.decoding = "async";
      if (w.tw && w.th) { img.width = w.tw; img.height = w.th; }
      t.appendChild(img);
      if (w.video) t.appendChild(el("span", "play", "▶ VIDEO"));
      t.appendChild(el("span", "tile-cap", w.title));
      t.addEventListener("click", function () { openLb(i); });
      gallery.appendChild(t);
    });
  }

  /* --- lightbox --- */
  var lb = document.getElementById("lightbox"), media = document.getElementById("lb-media");
  var idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + visible.length) % visible.length;
    var w = visible[idx];
    media.innerHTML = "";
    var m;
    if (w.video) { m = el("video"); m.src = w.video; m.poster = w.full; m.controls = true; m.autoplay = true; m.muted = true; m.loop = true; m.playsInline = true; }
    else { m = el("img"); m.src = w.full; m.alt = w.title; }
    media.appendChild(m);
    document.getElementById("lb-cap").textContent = w.title + (CATS[w.cat] ? " · " + CATS[w.cat] : "");
    document.getElementById("lb-count").textContent = (idx + 1) + " / " + visible.length;
  }
  function openLb(i) { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = "hidden"; show(i); document.getElementById("lb-close").focus(); }
  function closeLb() { lb.hidden = true; media.innerHTML = ""; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  document.getElementById("lb-close").addEventListener("click", closeLb);
  document.getElementById("lb-prev").addEventListener("click", function () { show(idx - 1); });
  document.getElementById("lb-next").addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target === media) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
  var sx = null;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });

  buildFilters();
  render();

  /* --- hero viewport: rotating wireframe icosphere --- */
  var cv = document.getElementById("vp");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var t0 = (1 + Math.sqrt(5)) / 2;
  var V = [[-1,t0,0],[1,t0,0],[-1,-t0,0],[1,-t0,0],[0,-1,t0],[0,1,t0],[0,-1,-t0],[0,1,-t0],[t0,0,-1],[t0,0,1],[-t0,0,-1],[-t0,0,1]];
  var F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  // subdivide once -> 42 verts, 80 faces (matches the stats overlay)
  var cache = {};
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0]/l, v[1]/l, v[2]/l]; }
  V = V.map(norm);
  function mid(a, b) {
    var k = a < b ? a + "_" + b : b + "_" + a;
    if (cache[k] === undefined) { var p = V[a], q = V[b]; V.push(norm([(p[0]+q[0])/2, (p[1]+q[1])/2, (p[2]+q[2])/2])); cache[k] = V.length - 1; }
    return cache[k];
  }
  var F2 = [];
  F.forEach(function (f) { var a = mid(f[0], f[1]), b = mid(f[1], f[2]), c = mid(f[2], f[0]); F2.push([f[0],a,c],[f[1],b,a],[f[2],c,b],[a,b,c]); });
  var E = {}; F2.forEach(function (f) { for (var i = 0; i < 3; i++) { var a = f[i], b = f[(i+1)%3]; E[a < b ? a+"_"+b : b+"_"+a] = [a, b]; } });
  E = Object.keys(E).map(function (k) { return E[k]; });

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1;
  function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }
  size(); window.addEventListener("resize", size);
  function css(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }

  var pitch = -0.42;
  function project(p, yaw, sc, cx, cy) {
    var x = p[0], y = p[1], z = p[2];
    var cyw = Math.cos(yaw), syw = Math.sin(yaw);
    var x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    var f = 4 / (4 + z2);
    return [cx + x1 * sc * f, cy - y2 * sc * f, z2];
  }
  function frame(ts) {
    var yaw = reduce ? 0.6 : ts / 4200;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2 + 10, sc = Math.min(W, H) * 0.27;
    // floor grid
    ctx.lineWidth = 1; ctx.strokeStyle = css("--vp-grid");
    for (var g = -6; g <= 6; g++) {
      var a = project([g * 0.5, -1.25, -3], yaw, sc, cx, cy), b = project([g * 0.5, -1.25, 3], yaw, sc, cx, cy);
      var c = project([-3, -1.25, g * 0.5], yaw, sc, cx, cy), d = project([3, -1.25, g * 0.5], yaw, sc, cx, cy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
    }
    // axis lines on floor
    var ax = [["--x", [-3, -1.25, 0], [3, -1.25, 0]], ["--y", [0, -1.25, -3], [0, -1.25, 3]]];
    ax.forEach(function (l) { var p = project(l[1], yaw, sc, cx, cy), q = project(l[2], yaw, sc, cx, cy); ctx.strokeStyle = css(l[0]); ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.globalAlpha = 1; });
    // mesh
    var P = V.map(function (v) { return project(v, yaw, sc, cx, cy); });
    var wire = css("--vp-wire"), acc = css("--accent");
    E.forEach(function (e) {
      var p = P[e[0]], q = P[e[1]], back = (p[2] + q[2]) / 2 > 0;
      ctx.strokeStyle = acc; ctx.globalAlpha = back ? 0.22 : 0.95; ctx.lineWidth = back ? 1 : 1.4;
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.fillStyle = wire;
    P.forEach(function (p) { if (p[2] <= 0) { ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); } });
    // origin + gizmo
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(cx, cy + 0, 3, 0, 7); ctx.fill();
    var gx = W - 46, gy = H - 46, gs = 26;
    [["--x", [1, 0, 0], "X"], ["--y", [0, 0, -1], "Y"], ["--z", [0, 1, 0], "Z"]].forEach(function (a) {
      var p = project(a[1], yaw, gs, gx, gy);
      ctx.strokeStyle = css(a[0]); ctx.fillStyle = css(a[0]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(p[0], p[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.fill();
      ctx.fillStyle = "#111"; ctx.font = "600 9px " + css("--mono"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(a[2], p[0], p[1] + 0.5);
    });
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
