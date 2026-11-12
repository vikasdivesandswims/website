/* VIKAS — scroll choreography
   Lenis + GSAP ScrollTrigger. Palette: Mint Marine.
   Pinned sections are created FIRST so later triggers
   account for their pin spacers. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width: 900px)").matches;
  var body = document.body;

  if (reduced) { body.classList.add("reduced"); }

  gsap.registerPlugin(ScrollTrigger);

  /* ── smooth scroll ─────────────────────── */
  var lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  /* ── in-page links ──────────────────────
     One delegated handler for every link that points inside the page
     (data-scroll, or an href whose hash names an element here). The
     target's position is read from the live layout, so pin spacers are
     already counted, and the fixed header is subtracted. Links that
     leave the page (WhatsApp, Instagram, mail) are never touched. */
  function inPageTarget(a) {
    var id = a.getAttribute("data-scroll");
    if (!id) {
      var raw = a.getAttribute("href") || "";
      if (raw.charAt(0) === "#") { id = raw.slice(1); }
      else {
        try {
          var u = new URL(a.href, location.href);
          if (!u.hash || u.protocol.indexOf("http") !== 0) { return null; }
          if (u.origin + u.pathname !== location.origin + location.pathname) { return null; }
          id = u.hash.slice(1);
        } catch (err) { return null; }
      }
    }
    if (!id) { return null; }
    if (id === "top") { return "top"; }
    return document.getElementById(decodeURIComponent(id));
  }
  function scrollYFor(target) {
    if (target === "top") { return 0; }
    var headH = (document.querySelector(".site-head") || { offsetHeight: 0 }).offsetHeight;
    var top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
    var cs = getComputedStyle(target);
    var padTop = parseFloat(cs.paddingTop) || 0;
    /* short sections (contact) show whole; tall ones land with their heading just under the header */
    var y = target.offsetHeight <= innerHeight * 1.05 ? top : top + padTop - headH - 20;
    return Math.max(0, Math.round(Math.min(y, top)));
  }
  function goTo(target) {
    var y = scrollYFor(target);
    var from = window.pageYOffset || 0;
    if (lenis) {
      var dur = Math.min(2.4, Math.max(0.9, Math.abs(y - from) / 4200 + 0.7));
      lenis.scrollTo(y, { duration: dur, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, force: true });
    } else {
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }
  }
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a) { return; }
    var target = inPageTarget(a);
    if (!target) { return; }                 // external link: let the browser open it
    e.preventDefault();
    goTo(target);
  }, true);

  /* ════ 1. PINNED SECTIONS FIRST ═════════ */

  /* ── manifesto: the quote holds centre while light turns to dark ── */
  var mani = document.querySelector(".manifesto");
  if (mani && !reduced) {
    var mtl = gsap.timeline({
      scrollTrigger: {
        trigger: mani,
        start: "top top",
        end: "+=110%",
        pin: true,
        scrub: 0.4,
        onUpdate: function (self) { chapter(self.progress > 0.55 ? "marine" : "mist"); },
        onLeaveBack: function () { chapter("mist"); }
      }
    });
    mtl.to({}, { duration: 0.2 })                                     // a beat in the light first
       .to(".manifesto-shade", { opacity: 1, ease: "none", duration: 1 }, 0.2)
       .to(".manifesto-text", { color: "#eef5ef", ease: "power1.inOut", duration: 0.45 }, 0.62)
       .to(".manifesto-text em", { color: "#9ff0be", ease: "power1.inOut", duration: 0.45 }, 0.62)
       .to({}, { duration: 0.35 });                                   // and a beat in the dark
  }

  /* ── roles: pinned sequence ────────────── */
  var stage = document.querySelector(".roles-stage");
  var frames = gsap.utils.toArray(".role-frame");
  var roleWord = document.getElementById("roleWord");

  if (stage && frames.length && !reduced) {
    frames.forEach(function (f, i) {
      gsap.set(f, { opacity: i === 0 ? 1 : 0, visibility: "visible", scale: i === 0 ? 1 : 1.06 });
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".roles",
        start: "top top",
        end: "+=" + frames.length * 80 + "%",
        pin: ".roles-stage",
        scrub: 0.6,
        onUpdate: function (self) {
          var idx = Math.min(frames.length - 1, Math.floor(self.progress * frames.length));
          var f = frames[idx];
          if (roleWord && f) {
            var r = f.getAttribute("data-role");
            if (roleWord.textContent !== r) { roleWord.textContent = r; }
          }
        }
      }
    });

    frames.forEach(function (f, i) {
      if (i === 0) {
        tl.to(f, { scale: 1.0, duration: 0.8, ease: "none" }, 0);
      } else {
        var at = i - 0.35;
        tl.to(frames[i - 1], { opacity: 0, scale: 0.96, duration: 0.55, ease: "power1.inOut" }, at);
        tl.to(f, { opacity: 1, scale: 1, duration: 0.6, ease: "power1.out" }, at + 0.1);
      }
    });
    tl.to({}, { duration: 0.4 });
  } else if (stage) {
    frames.forEach(function (f) {
      f.style.position = "relative";
      f.style.opacity = 1;
      f.style.visibility = "visible";
      f.style.margin = "2rem auto";
    });
    stage.style.height = "auto";
    stage.style.display = "block";
    stage.style.padding = "4rem 0";
  }

  /* ── gallery: a rolling 3D wave ("crest") ───
     The photos ride a smooth ribbon. Along it, each frame is laid out by
     arc length, edge to edge with one even gap, and turned to the
     ribbon's tangent, so neighbours never overlap or open up. The turn
     eases in with tanh and is capped well short of side-on, so no frame
     is ever seen edge-on. The centre frame faces you flat and grows
     ~16%; spacing grows with it (the arc is stretched by the integral
     of the scale), so the bigger frame doesn't crowd its neighbours.
     A slow swell lifts and lowers the ribbon. Endless: the ring wraps,
     fading out far round the back. */
  var track = document.getElementById("galleryTrack");
  if (track && !reduced) {
    var figs = gsap.utils.toArray("#galleryTrack figure");
    track.classList.add("is-wave");
    var cen = [], wid = [], total = 0, GAP = 0;
    function measureWave() {
      var h = figs[0].offsetHeight;
      GAP = Math.round(h * 0.07);
      cen = []; wid = []; var x = 0;
      figs.forEach(function (f) { var w = f.offsetWidth; wid.push(w); cen.push(x + w / 2); x += w + GAP; });
      total = x - GAP;
      track.style.perspective = Math.round(h * 3.6) + "px";
      buildRibbon(h, (total + GAP) * 0.75 + h);
    }
    var GROW = 0.16, TURN = 0.8;                       // centre grows 16%; max turn ≈ 46°, never edge-on
    function scaleAt(d, h) { var q = d / (0.75 * h); return 1 + GROW * Math.exp(-q * q); }
    /* the ribbon, tabulated: x along, z into the screen, by arc length */
    var RX = [], RZ = [], RSTEP = 1, RN = 0;
    function buildRibbon(h, span) {
      var L = 1.7 * h; RSTEP = h / 40; RN = Math.ceil(span / RSTEP) + 2;
      RX = [0]; RZ = [0];
      for (var k = 0; k < RN; k++) {
        var th = TURN * Math.tanh((k + 0.5) * RSTEP / L);
        RX.push(RX[k] + Math.cos(th) * RSTEP); RZ.push(RZ[k] + Math.sin(th) * RSTEP);
      }
    }
    function ribbonAt(u) {                             // x is odd in u, z is even
      var a = Math.min(Math.abs(u) / RSTEP, RN - 0.001), k = Math.floor(a), t = a - k;
      var x = RX[k] + (RX[k + 1] - RX[k]) * t, z = RZ[k] + (RZ[k + 1] - RZ[k]) * t;
      return { x: u < 0 ? -x : x, z: z };
    }
    var drift = 0, lastP = 0, waveOn = false, swell = 0;
    /* Lay the frames edge to edge along the ribbon, outward from the
       focus point. Each frame takes its scaled width and each gap stays
       GAP, so nothing overlaps or opens up as the centre frame grows.
       Frame edges sit on the ribbon (chords of a convex curve), so seen
       from the front no frame ever covers its neighbour. */
    function layoutWave(p) {
      lastP = p;
      var h = figs[0].offsetHeight;
      var loop = total + GAP;                          // one full turn of the carousel
      var focus = cen[0] + loop * p + drift;
      var items = figs.map(function (f, i) {
        var d = cen[i] - focus;
        d = ((d % loop) + loop * 1.5) % loop - loop / 2;   // wrap: endless ring of photos
        return { f: f, w: wid[i], d: d, s: scaleAt(d, h) };
      }).sort(function (A, B) { return A.d - B.d; });
      /* anchor: the frame (or the gap) under the focus point */
      var R = 0, k, left, right;
      while (R < items.length && items[R].d - items[R].w / 2 < 0) { R++; }
      var A = items[R - 1];
      if (A && A.d + A.w / 2 > 0) {                    // focus lies inside frame A
        var fr = (A.w / 2 - A.d) / A.w;
        A.a = -fr * A.w * A.s; A.b = A.a + A.w * A.s;
        right = A.b + GAP; left = A.a - GAP;
        R = R - 1;
        for (k = R + 1; k < items.length; k++) { items[k].a = right; items[k].b = right + items[k].w * items[k].s; right = items[k].b + GAP; }
        for (k = R - 1; k >= 0; k--) { items[k].b = left; items[k].a = left - items[k].w * items[k].s; left = items[k].a - GAP; }
      } else {                                         // focus lies in the gap before items[R]
        var gs = A ? A.d + A.w / 2 : -GAP / 2;
        var g = Math.min(1, Math.max(0, -gs / GAP));
        right = (1 - g) * GAP; left = -g * GAP;
        for (k = R; k < items.length; k++) { items[k].a = right; items[k].b = right + items[k].w * items[k].s; right = items[k].b + GAP; }
        for (k = R - 1; k >= 0; k--) { items[k].b = left; items[k].a = left - items[k].w * items[k].s; left = items[k].a - GAP; }
      }
      items.forEach(function (it) {
        var P = ribbonAt(it.a), Q = ribbonAt(it.b);
        var mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2;
        var yaw = Math.atan2(Q.z - P.z, Q.x - P.x);
        var chord = Math.hypot(Q.x - P.x, Q.z - P.z);
        var um = (it.a + it.b) / 2;
        /* a gentle swell travelling along the ribbon, calm at the centre */
        var calm = 1 - Math.exp(-Math.pow(um / (0.9 * h), 2));
        var y = 0.05 * h * Math.sin(um / (1.25 * h) - swell) * calm;
        var roll = 0.025 * Math.cos(um / (1.25 * h) - swell) * calm;
        var edge = Math.abs(it.d) / (loop / 2);        // fade out where the ring wraps round
        var op = edge < 0.68 ? 1 : Math.max(0, 1 - (edge - 0.68) / 0.24);
        it.f.style.transform = "translate(-50%,-50%) translate3d(" + mx.toFixed(1) + "px," + y.toFixed(1) + "px," + (-mz).toFixed(1) + "px) rotateY(" + yaw.toFixed(4) + "rad) rotateZ(" + roll.toFixed(4) + "rad) scale(" + (chord / it.w).toFixed(4) + "," + it.s.toFixed(4) + ")";
        it.f.style.zIndex = String(1000 - Math.round(mz));
        it.f.style.opacity = op.toFixed(3);
        it.f.style.filter = "brightness(" + Math.max(0.5, 1 - mz / (h * 4.2)).toFixed(3) + ")";
      });
    }
    /* a slow, constant turn while the section is on screen */
    new IntersectionObserver(function (en) { waveOn = en[0].isIntersecting; }).observe(document.querySelector(".gallery"));
    gsap.ticker.add(function (t, dt) {
      if (!waveOn || document.hidden) { return; }
      var step = Math.min(dt, 50);
      drift += step * 0.032;                           // ~32px per second
      swell += step * 0.0006;
      layoutWave(lastP);
    });
    measureWave(); layoutWave(0);
    ScrollTrigger.create({
      trigger: ".gallery",
      start: "top top",
      end: function () { return "+=" + Math.round(figs.length * innerHeight * 0.32); },   /* one full turn, then the page moves on */
      pin: ".gallery-pin",
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: function (self) { layoutWave(self.progress); },
      onRefresh: function (self) { measureWave(); layoutWave(self.progress); }
    });
    window.addEventListener("load", function () { measureWave(); layoutWave(lastP); });
  }

  /* ════ 2. EVERYTHING ELSE ═══════════════ */

  /* ── chapter colour ────────────────────── */
  function chapter(name) { body.setAttribute("data-chapter", name); }

  [
    { sel: ".hero",      name: "mist"     },
    { sel: ".roles",     name: "marine"   },
    { sel: ".story",     name: "midnight" },
    { sel: ".practice",  name: "midnight" },
    { sel: ".gallery",   name: "abyss"    },
    { sel: ".contact",   name: "mist"     }
  ].forEach(function (c) {
    ScrollTrigger.create({
      trigger: c.sel,
      start: "top 55%",
      end: "bottom 55%",
      onEnter: function () { chapter(c.name); },
      onEnterBack: function () { chapter(c.name); }
    });
  });

  /* ── the name: hero title ⇄ header ─────── */
  /* Each letter travels from its spread-out place in the hero to its
     place in a tight word centred in the header, shrinking as it goes.
     Driven straight off scroll position, so scrolling back up reverses it. */
  var word = document.getElementById("heroWord");
  var letters = gsap.utils.toArray("#heroWord .hw");
  var nav = document.querySelector(".site-nav");
  var roles = null;   // the tagline stays in the hero and scrolls normally
  var geo = {};
  var nameP = 0;

  /* As the name shrinks, its weight and width ease off in step with the
     size: black and condensed when big, a lighter, wider cut by the time
     it sits in the header, so the small word stays legible. Each letter's
     box is held at its big width (glyph centred inside), so changing the
     weight never shifts the letters; the tight-word spacing is worked
     out from the glyph widths at the current weight. */
  var BIG_W = 900, BIG_S = 52, SMALL_W = 560, SMALL_S = 84;   // weight, font-stretch %
  var inner = letters.map(function (l) { return l.querySelector(".hw-i"); });
  function setCut(t) {
    var w = BIG_W + (SMALL_W - BIG_W) * t, st = BIG_S + (SMALL_S - BIG_S) * t;
    inner.forEach(function (g) { g.style.fontWeight = w.toFixed(0); g.style.fontStretch = st.toFixed(1) + "%"; });
  }

  /* where the small name sits: centred in the header, or docked to the
     left gutter on phones (the links group on the right there) */
  function dockX(smallG, fs, target) {
    if (innerWidth > 640) { return innerWidth / 2; }
    var pad = parseFloat(getComputedStyle(document.querySelector(".site-head")).paddingLeft) || 20;
    var w = smallG.reduce(function (sum, g) { return sum + g; }, 0) + fs * 0.08 * 0.4 * (smallG.length - 1);
    return pad + w * (target / fs) / 2;
  }

  function measureName() {
    letters.forEach(function (l) { l.style.transform = "none"; l.style.width = ""; });
    if (roles) { roles.style.transform = "none"; }
    setCut(0);
    var fs = parseFloat(getComputedStyle(word).fontSize);
    var target = innerWidth <= 640 ? 20 : 24;               // header size, px
    var big = letters.map(function (l) {
      var r = l.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width };
    });
    var bigG = inner.map(function (g) { return g.getBoundingClientRect().width; });
    setCut(1);
    var smallG = inner.map(function (g) { return g.getBoundingClientRect().width; });
    setCut(0);
    letters.forEach(function (l, i) { l.style.width = big[i].w + "px"; });   // hold each box steady
    var navR = nav.getBoundingClientRect();
    geo = {
      big: big, bigG: bigG, smallG: smallG, track: fs * 0.08, s: target / fs,
      fromX: (big[0].cx - big[0].w / 2 + big[big.length - 1].cx + big[big.length - 1].w / 2) / 2,
      fromY: big[0].cy,
      toX: dockX(smallG, fs, target),
      toY: navR.top + navR.height / 2 - target * 0.04
    };
    if (roles) {
      var rr = roles.getBoundingClientRect();
      var rfs = parseFloat(getComputedStyle(roles).fontSize);
      var rTarget = innerWidth <= 640 ? 9.5 : 11;              // tagline size in the header, px
      geo.roles = {
        cx: rr.left + rr.width / 2, cy: rr.top + rr.height / 2,
        s: rTarget / rfs,
        toY: geo.toY + target * 0.5 + 2 + rTarget * 0.62        // just under the small name
      };
    }
  }

  function applyName(p) {
    nameP = p;
    if (!geo.big) { return; }
    var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // travel + shrink: easeInOutQuad
    var q = Math.min(1, p / 0.5);
    var ex = 1 - Math.pow(1 - q, 3);                               // gathering: done by halfway, easeOutCubic
    var sc = Math.pow(geo.s, e);
    var wx = geo.fromX + (geo.toX - geo.fromX) * e;
    var wy = geo.fromY + (geo.toY - geo.fromY) * e;
    setCut(e);                                                     // lighter and wider as it shrinks
    /* offsets of each letter within a tight word, at the current cut, full size */
    var gw = geo.bigG.map(function (b, i) { return b + (geo.smallG[i] - b) * e; });
    var tr = geo.track * (1 - 0.6 * e);                           // spacing tightens with the lighter cut
    var tot = gw.reduce(function (sum, w) { return sum + w + tr; }, -tr);
    var x0 = -tot / 2;
    var off = gw.map(function (w) { var c = x0 + w / 2; x0 += w + tr; return c; });
    letters.forEach(function (l, i) {
      var b = geo.big[i];
      var x = b.cx + (wx + off[i] * sc - b.cx) * ex;               // close up into one word…
      var y = wy;                                                  // …while the word rises and shrinks
      l.style.transform = "translate3d(" + (x - b.cx).toFixed(2) + "px," + (y - b.cy).toFixed(2) + "px,0) scale(" + sc.toFixed(4) + ")";
    });
    if (roles && geo.roles) {
      var r = geo.roles;
      var rs = Math.pow(r.s, e);
      roles.style.transform = "translate3d(" + ((geo.toX - r.cx) * ex).toFixed(2) + "px," + ((r.toY - r.cy) * e).toFixed(2) + "px,0) scale(" + rs.toFixed(4) + ")";
    }
    word.classList.toggle("is-small", p > 0.98);
    body.classList.toggle("scrolled", p > 0.12);
    body.classList.toggle("named", p > 0.98);   // the name is in the header: show the bar
  }

  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: function () { return "+=" + Math.round(innerHeight * 0.55); },
    onUpdate: function (self) { applyName(reduced ? (self.progress > 0.5 ? 1 : 0) : self.progress); },
    onRefreshInit: function () { letters.forEach(function (l) { l.style.transform = "none"; l.style.width = ""; }); setCut(0); if (roles) { roles.style.transform = "none"; } },
    onRefresh: function (self) { measureName(); applyName(reduced ? (self.progress > 0.5 ? 1 : 0) : self.progress); }
  });

  /* ── hero: load moment + parallax ──────── */
  if (!reduced) {
    gsap.from(".hero-word .hw-i", {
      yPercent: 40, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.055, delay: 0.15
    });
    gsap.from(".hero-photo", { opacity: 0, scale: 1.045, duration: 1.4, ease: "power2.out" });
    gsap.from(".hero-roles", { opacity: 0, duration: 0.9, delay: 0.55, ease: "power2.out" });
    gsap.from(".fg", { opacity: 0, duration: 1.6, delay: 0.3, ease: "power2.out" });

    var heroScrub = function (vars) {
      vars.ease = "none";
      vars.scrollTrigger = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
      return vars;
    };
    /* depth: photo drifts slowest, then trees, then the near leaves rush past */
    gsap.to(".hero-photo",  heroScrub({ yPercent: 9 }));
    gsap.to(".fg-trees",    heroScrub({ yPercent: -16 }));
    gsap.to(".fg-near-l",   heroScrub({ yPercent: -42, xPercent: -10 }));
    gsap.to(".fg-near-r",   heroScrub({ yPercent: -50, xPercent: 12 }));
    /* fade the tagline and scroll cue out on the way down, back in on the way up.
       fromTo with explicit values, so the load-in fade can't leave them stuck at 0 */
    gsap.fromTo(".scroll-cue", { opacity: 1, y: 0 }, {
      opacity: 0, y: -24, ease: "none", immediateRender: false,
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=" + Math.round(innerHeight * 0.4), scrub: true }
    });
  }

  /* the tagline fades as it scrolls up into the header, and returns on the way down */
  var tag = document.getElementById("heroRoles");
  if (tag && !reduced) {
    gsap.fromTo(tag, { opacity: 1 }, {
      opacity: 0, ease: "none", immediateRender: false,
      scrollTrigger: {
        trigger: tag,
        start: function () { return "top " + Math.round(innerHeight * 0.32) + "px"; },
        end: function () { return "top " + Math.round(document.querySelector(".site-head").offsetHeight + 8) + "px"; },
        scrub: true, invalidateOnRefresh: true
      }
    });
  }

  /* ── droplets: spray around Vikas, moved only by scrolling ── */
  /* No idle motion at all: each drop sits still until you scroll, then
     travels at a speed set by its depth (nearer = faster) and drifts a
     little outward from the body, like spray dispersing. Drops cluster
     around the figure, stay out of the sky behind the name, and read
     brightest against the dark trees, where real water catches light. */
  (function drops() {
    var canvas = document.getElementById("drops");
    var hero = document.getElementById("hero");
    var photo = document.querySelector(".hero-photo img");
    if (!canvas || !canvas.getContext || !photo) { return; }
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, parts = [], fig = null;
    var lastY = window.scrollY || 0, vel = 0, queued = false, visible = true;

    /* composite geometry (fractions of the hero image's height) */
    var HEAD = 0.439, FEET = 0.645, TREES = 0.462, BODY_W = 0.085;

    function sprite(size, draw) {
      var c = document.createElement("canvas");
      c.width = c.height = size;
      draw(c.getContext("2d"), size);
      return c;
    }
    /* a speck of sunlit water: warm bright point, thin soft halo */
    var speck = sprite(24, function (g, n) {
      var gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      gr.addColorStop(0, "rgba(255,252,232,1)");
      gr.addColorStop(0.28, "rgba(255,248,222,0.95)");
      gr.addColorStop(0.5, "rgba(245,238,205,0.28)");
      gr.addColorStop(1, "rgba(245,238,205,0)");
      g.fillStyle = gr; g.fillRect(0, 0, n, n);
    });
    /* a slightly larger drop: the same light, with a faint ring like the photo */
    var ring = sprite(32, function (g, n) {
      var gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      gr.addColorStop(0, "rgba(255,250,228,0.7)");
      gr.addColorStop(0.3, "rgba(255,252,234,1)");
      gr.addColorStop(0.42, "rgba(255,248,222,0.9)");
      gr.addColorStop(0.62, "rgba(240,232,200,0.2)");
      gr.addColorStop(1, "rgba(240,232,200,0)");
      g.fillStyle = gr; g.fillRect(0, 0, n, n);
    });

    function rand(a, b) { return a + Math.random() * (b - a); }
    function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
    function smooth(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

    function layout() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var hr = hero.getBoundingClientRect(), pr = photo.getBoundingClientRect();
      var top = pr.top - hr.top, ih = pr.height;
      fig = {
        cx: pr.left - hr.left + pr.width / 2,
        head: top + ih * HEAD,
        feet: top + ih * FEET,
        trees: top + ih * TREES,
        w: Math.max(ih * BODY_W, 70)
      };
      var n = Math.round(Math.max(30, Math.min(60, W / 24)));
      parts = [];
      for (var i = 0; i < n; i++) {
        var z = Math.pow(Math.random(), 1.3);
        /* around the figure, spreading wider with depth; never up by the name */
        var x = fig.cx + gauss() * fig.w * (1.8 + z * 3.2);
        var y = fig.head + (fig.feet - fig.head) * (0.05 + Math.random() * 1.05) + gauss() * 60;
        y = Math.max(y, fig.head - 20);
        parts.push({
          x: x, y: y, z: z,
          r: Math.random() < 0.18 ? rand(1.6, 2.6) : rand(0.8, 1.5),
          dir: x < fig.cx ? -1 : 1,
          a: rand(0.55, 1)
        });
      }
    }

    function draw() {
      queued = false;
      var sy = window.scrollY || 0;
      var dy = sy - lastY; lastY = sy;
      vel = vel * 0.6 + dy * 0.4;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        /* nearer drops outrun the page; far ones sit almost with the photo */
        var speed = 0.9 * Math.pow(p.z, 1.3) - 0.06;
        var x = p.x + p.dir * sy * (0.04 + p.z * 0.12);
        var y = p.y - sy * speed;
        if (y < -60 || y > H + 60) { continue; }
        /* brighter against the dark canopy than against pale sky */
        var light = 0.25 + 0.75 * smooth(fig.trees - 80, fig.trees + 140, y);
        var stretch = 1 + Math.min(1.2, Math.abs(vel) * 0.03 * (0.3 + p.z));
        var big = p.r > 1.55;
        var d = p.r * (big ? 4.2 : 3.6);                       // sprite includes its halo
        ctx.globalAlpha = p.a * light;
        ctx.drawImage(big ? ring : speck, x - d / 2, y - d * stretch / 2, d, d * stretch);
      }
      ctx.globalAlpha = 1;
      if (Math.abs(vel) > 0.2 && !reduced) { request(); }       // let the stretch relax
      else { vel = 0; }
    }
    function request() {
      if (!queued && visible) { queued = true; requestAnimationFrame(draw); }
    }

    function init() { layout(); lastY = window.scrollY || 0; vel = 0; draw(); }
    init();
    window.addEventListener("scroll", request, { passive: true });
    if (lenis) { lenis.on("scroll", request); }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { request(); }
    }).observe(hero);
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(init, 150); });
    if (!photo.complete) { photo.addEventListener("load", init); }
    ScrollTrigger.addEventListener("refresh", init);
  })();

  /* ── generic reveals ───────────────────── */
  if (!reduced) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.95, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.style.opacity = 1; el.style.transform = "none";
    });
  }

  ScrollTrigger.sort();
  /* first paint: the page starts already in its chapter colour, with no
     fade in from white. The colour transition switches on after that. */
  /* a reload always starts at the top: no browser scroll restore */
  if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; }
  window.scrollTo(0, 0);
  function settle() {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.remove("booting"); }); });
  }
  window.addEventListener("load", settle);
  /* a tapped link gives up focus at once, so it never stays highlighted */
  document.addEventListener("click", function (e) {
    var l = e.target.closest && e.target.closest(".site-nav a, .hero-word a, .contact-links a");
    if (l && l.blur) { setTimeout(function () { l.blur(); }, 0); }
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
