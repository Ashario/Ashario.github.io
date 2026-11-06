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

  /* --- hero terminal: replay the example run line by line --- */
  var term = document.getElementById("term");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (term && !reduce) {
    var lines = term.innerHTML.split("\n");
    var n = 0;
    function step() {
      n++;
      term.innerHTML = lines.slice(0, n).join("\n") + (n < lines.length ? '\n<span class="cur"></span>' : "");
      if (n < lines.length) setTimeout(step, n === 1 ? 900 : 380);
      else setTimeout(function () { n = 0; step(); }, 7000);
    }
    step();
  }
})();
