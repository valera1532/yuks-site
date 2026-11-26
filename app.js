(() => {
  "use strict";

  const mast = document.querySelector(".mast");
  const menu = document.querySelector(".menu-switch");
  const nav = document.querySelector(".primary-nav");
  const narrow = matchMedia("(max-width: 52rem)");
  const links = [...nav.querySelectorAll("a")];
  const sections = links.map(link => document.querySelector(link.hash));

  function setMenu(open) {
    mast.classList.toggle("menu-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }
  menu.addEventListener("click", () => setMenu(!mast.classList.contains("menu-open")));
  mast.addEventListener("click", event => {
    if (event.target.closest("a, [data-contact]")) setMenu(false);
  });
  document.addEventListener("pointerdown", event => {
    if (!mast.contains(event.target)) setMenu(false);
  });
  mast.addEventListener("focusout", event => {
    if (event.relatedTarget && !mast.contains(event.relatedTarget)) setMenu(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && mast.classList.contains("menu-open")) {
      setMenu(false);
      menu.focus();
    }
  });
  narrow.addEventListener("change", () => setMenu(false));

  let pending = false;
  function updateHeader() {
    pending = false;
    mast.classList.toggle("is-solid", window.scrollY > 28);
    const line = mast.offsetHeight + 45;
    let active = -1;
    sections.forEach((section, index) => {
      const bounds = section.getBoundingClientRect();
      if (bounds.top <= line && bounds.bottom > line) active = index;
    });
    if (document.documentElement.scrollHeight - window.innerHeight - window.scrollY < 5) active = sections.length - 1;
    links.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function scheduleHeader() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateHeader);
  }
  window.addEventListener("scroll", scheduleHeader, {passive: true});
  window.addEventListener("resize", scheduleHeader);
  updateHeader();

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const hero = document.querySelector(".hero");
  const slider = hero.querySelector("#bridge-mix");
  const presets = [...hero.querySelectorAll("[data-mix]")];
  let mix = 100;
  let animationFrame = 0;
  let destination = 100;
  let interacted = false;

  function finishIntro() {
    if (hero.hasAttribute("data-intro-ready")) return;
    hero.setAttribute("data-intro-ready", "");
    hero.dispatchEvent(new Event("bridge-intro-ready"));
  }
  function paintMix(value) {
    mix = Math.max(0, Math.min(100, value));
    const rounded = Math.round(mix);
    hero.style.setProperty("--mix", mix.toFixed(2) + "%");
    hero.style.setProperty("--note-opacity", Math.max(0, Math.min(1, (52 - mix) / 10)).toFixed(2));
    hero.classList.toggle("is-comparing", mix > .5 && mix < 99.5);
    slider.value = String(rounded);
    slider.setAttribute("aria-valuetext", rounded === 0 ? "Чертёж" : rounded === 100 ? "Объём" : "Объём — " + rounded + "%");
    presets.forEach(button => button.setAttribute("aria-pressed", String(mix === Number(button.dataset.mix))));
  }
  function stopSweep() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
  function sweepTo(target, duration, onFinish) {
    stopSweep();
    destination = target;
    if (reduced.matches || Math.abs(target - mix) < .3) {
      paintMix(target);
      onFinish?.();
      return;
    }
    const start = performance.now();
    const origin = mix;
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      paintMix(origin + (target - origin) * eased);
      if (t < 1) animationFrame = requestAnimationFrame(tick);
      else { animationFrame = 0; onFinish?.(); }
    }
    animationFrame = requestAnimationFrame(tick);
  }
  function takeControl() { interacted = true; stopSweep(); finishIntro(); }
  slider.addEventListener("pointerdown", takeControl);
  slider.addEventListener("keydown", takeControl);
  slider.addEventListener("input", () => { takeControl(); paintMix(Number(slider.value)); });
  presets.forEach(button => button.addEventListener("click", () => {
    takeControl();
    sweepTo(Number(button.dataset.mix), 730);
  }));
  reduced.addEventListener("change", () => {
    if (reduced.matches && animationFrame) { stopSweep(); paintMix(destination); finishIntro(); }
  });
  paintMix(100);
  Promise.all([...hero.querySelectorAll(".bridge-optics img")].map(img => img.decode())).then(() => {
    if (interacted || reduced.matches || document.hidden || window.scrollY > 50 || performance.now() > 2400) {
      finishIntro();
      return;
    }
    paintMix(7);
    sweepTo(100, 2250, finishIntro);
  }).catch(() => { if (!interacted) paintMix(100); finishIntro(); });

  const stage = hero.querySelector(".bridge-stage");
  const pointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 700px)");
  const compact = matchMedia("(max-width: 43rem)");
  let depthFrame = 0, stageVisible = true;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;

  function paintDepth() {
    depthFrame = 0;
    if (!stageVisible || reduced.matches || document.hidden) return;
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(0, Math.min(-rect.top, rect.height));
    const scrollDepth = compact.matches ? Math.min(travel * .18, 52) : Math.min(travel * .26, 150);
    const copyRise = Math.min(travel * .045, compact.matches ? 12 : 28);
    pointerX += (targetX - pointerX) * .15;
    pointerY += (targetY - pointerY) * .15;
    stage.style.setProperty("--depth-scroll", scrollDepth.toFixed(2) + "px");
    stage.style.setProperty("--depth-copy", (-copyRise).toFixed(2) + "px");
    stage.style.setProperty("--drift-x", pointerX.toFixed(2) + "px");
    stage.style.setProperty("--drift-y", pointerY.toFixed(2) + "px");
    if (Math.abs(targetX - pointerX) + Math.abs(targetY - pointerY) > .08) queueDepth();
  }
  function queueDepth() {
    if (!depthFrame && stageVisible && !reduced.matches && !document.hidden) depthFrame = requestAnimationFrame(paintDepth);
  }
  function clearDepth() {
    cancelAnimationFrame(depthFrame);
    depthFrame = 0;
    pointerX = pointerY = targetX = targetY = 0;
    for (const name of ["--depth-scroll", "--depth-copy", "--drift-x", "--drift-y"]) stage.style.removeProperty(name);
  }
  stage.addEventListener("pointermove", event => {
    if (!pointer.matches || reduced.matches || event.pointerType === "touch" || stage.querySelector(".bridge-callout.is-open")) return;
    if (event.target.closest(".bridge-point")) return;
    const rect = stage.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * 34;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * 18;
    queueDepth();
  }, {passive: true});
  stage.addEventListener("pointerleave", () => { targetX = targetY = 0; queueDepth(); });
  window.addEventListener("scroll", queueDepth, {passive: true});
  window.addEventListener("resize", queueDepth);
  document.addEventListener("visibilitychange", queueDepth);
  reduced.addEventListener("change", () => { clearDepth(); queueDepth(); });
  pointer.addEventListener("change", () => { clearDepth(); queueDepth(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      stageVisible = entry.isIntersecting;
      if (stageVisible) queueDepth();
      else clearDepth();
    }).observe(stage);
  }
  queueDepth();

})();
