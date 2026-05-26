/* ================================================================
   Progetto Luce · presentation.js
   Navigazione, scaling, barra avanzamento, KaTeX, stelle/particelle
   ================================================================ */
(function () {
  "use strict";

  const CANVAS_W = 1280;
  const CANVAS_H = 720;

  /* ── SCALING stile PPT ── */
  function resize() {
    const vw = window.visualViewport ? window.visualViewport.width  : window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const scale = Math.min(vw / CANVAS_W, vh / CANVAS_H);
    document.documentElement.style.setProperty("--scale", scale);
  }
  window.addEventListener("resize", resize);

  /* ── NAVIGAZIONE ── */
  let current = 0;
  let slides  = [];
  let total   = 0;

  function showSlide(n) {
    n = Math.max(0, Math.min(total - 1, n));
    slides.forEach(function(s) { s.classList.remove("active"); });
    current = n;
    slides[current].classList.add("active");
    // HUD
    var ctr  = document.getElementById("slide-counter");
    var fill = document.getElementById("progress-fill");
    if (ctr)  ctr.textContent  = (current + 1) + " / " + total;
    if (fill) fill.style.width = ((current + 1) / total * 100) + "%";
  }

  function changeSlide(dir) {
    showSlide(current + dir);
  }

  /* ── KaTeX: renderizza TUTTE le slide all'avvio ── */
  function renderAllKatex() {
    if (!window.renderMathInElement) return;
    slides.forEach(function(slide) {
      renderMathInElement(slide, {
        delimiters: [
          { left: "$$", right: "$$", display: true  },
          { left: "\\[", right: "\\]", display: true  },
          { left: "$",  right: "$",  display: false },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    });
  }

  /* ── INPUT ── */
  function initInput() {
    // Click metà sinistra/destra
    document.addEventListener("click", function(e) {
      if (e.target.closest("#fullscreen-btn")) return;
      // Ignora click sulle grafiche e link
      if (e.target.closest(".grafica-wrap")) return;
      if (e.target.closest(".link-box")) return;
      changeSlide(e.clientX < window.innerWidth / 2 ? -1 : 1);
    });

    // Tastiera
    document.addEventListener("keydown", function(e) {
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")                      changeSlide(-1);
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ")   changeSlide(1);
      if (e.key === "Home") showSlide(0);
      if (e.key === "End")  showSlide(total - 1);
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    });

    // Touch swipe
    var touchX = null;
    document.addEventListener("touchstart", function(e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener("touchend", function(e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) changeSlide(dx < 0 ? 1 : -1);
      touchX = null;
    });

    // Scroll wheel con debounce
    var wheelLock = false;
    document.addEventListener("wheel", function(e) {
      if (wheelLock) return;
      changeSlide(e.deltaY > 0 ? 1 : -1);
      wheelLock = true;
      setTimeout(function() { wheelLock = false; }, 700);
    }, { passive: true });
  }

  /* ── FULLSCREEN ── */
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  document.addEventListener("fullscreenchange", function() {
    var btn = document.getElementById("fullscreen-btn");
    if (btn) btn.textContent = document.fullscreenElement ? "⊹" : "⛶";
    resize();
  });

  /* ─────────────────────────────────────────────────────────
     PARTICELLE DI LUCE (tema luminoso su sfondo chiaro)
     Sostituisce le stelle scure: particelle viola/ambra
     traslucide su sfondo bianco-crema.
  ───────────────────────────────────────────────────────── */
  function initStars() {
    var canvas = document.getElementById("stars-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    var COUNT = 90;

    // Palette particelle: viola, lavanda, ambra, azzurro — tutte translucide
    var palettes = [
      "rgba(124,58,237,",   // viola
      "rgba(192,38,211,",   // viola-rosa
      "rgba(192,120,32,",   // ambra
      "rgba(37,99,235,",    // azzurro
      "rgba(167,139,250,",  // lavanda
    ];

    var particles = [];
    for (var i = 0; i < COUNT; i++) {
      particles.push({
        x:     Math.random() * CANVAS_W,
        y:     Math.random() * CANVAS_H,
        r:     Math.random() * 1.6 + 0.3,
        alpha: Math.random() * 0.22 + 0.04,
        dx:    (Math.random() - 0.5) * 0.18,
        dy:    (Math.random() - 0.5) * 0.12,
        color: palettes[Math.floor(Math.random() * palettes.length)],
        // per il pulse
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.012 + 0.005,
      });
    }

    // Raggi di luce radiali (sottili linee diagonali)
    var RAYS = 5;
    var rays = [];
    for (var j = 0; j < RAYS; j++) {
      rays.push({
        x:     Math.random() * CANVAS_W,
        y:     -50,
        angle: Math.PI / 2 + (Math.random() - 0.5) * 0.4,
        len:   Math.random() * 300 + 200,
        alpha: Math.random() * 0.04 + 0.015,
        color: palettes[Math.floor(Math.random() * 2)],
        speed: Math.random() * 0.3 + 0.1,
      });
    }

    var frame = 0;

    function draw() {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      frame++;

      // Disegna raggi di luce
      rays.forEach(function(ray) {
        var grd = ctx.createLinearGradient(
          ray.x, ray.y,
          ray.x + Math.cos(ray.angle) * ray.len,
          ray.y + Math.sin(ray.angle) * ray.len
        );
        grd.addColorStop(0, ray.color + ray.alpha + ")");
        grd.addColorStop(1, ray.color + "0)");
        ctx.beginPath();
        ctx.moveTo(ray.x, ray.y);
        ctx.lineTo(
          ray.x + Math.cos(ray.angle) * ray.len,
          ray.y + Math.sin(ray.angle) * ray.len
        );
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ray.y += ray.speed;
        if (ray.y > CANVAS_H + 100) {
          ray.y = -100;
          ray.x = Math.random() * CANVAS_W;
        }
      });

      // Disegna particelle
      particles.forEach(function(p) {
        p.phase += p.speed;
        var pulse = Math.sin(p.phase) * 0.5 + 0.5;
        var a = p.alpha * (0.5 + pulse * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + a + ")";
        ctx.fill();

        // piccolo glow sulle particelle più grandi
        if (p.r > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (a * 0.2) + ")";
          ctx.fill();
        }

        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -10)        p.x = CANVAS_W + 10;
        if (p.x > CANVAS_W + 10) p.x = -10;
        if (p.y < -10)        p.y = CANVAS_H + 10;
        if (p.y > CANVAS_H + 10) p.y = -10;
      });

      requestAnimationFrame(draw);
    }

    draw();
  }

  /* ── BOOT ── */
  window.addEventListener("load", function() {
    slides = Array.from(document.querySelectorAll(".slide"));
    total  = slides.length;
    resize();
    initStars();
    initInput();
    renderAllKatex();
    showSlide(0);
    var fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) fsBtn.addEventListener("click", toggleFullscreen);
  });

})();