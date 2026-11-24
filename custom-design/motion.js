(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function revealSections() {
    if (!("IntersectionObserver" in window) || !Element.prototype.animate) return;
    const running = new Set();
    function play(node, frames, duration, delay) {
      const animation = node.animate(frames, {
        duration, delay, easing: "cubic-bezier(.2,.78,.22,1)", fill: "backwards"
      });
      const finish = () => animation.finish();
      running.add(animation);
      node.addEventListener("focusin", finish);
      animation.finished.catch(() => {}).finally(() => {
        running.delete(animation);
        node.removeEventListener("focusin", finish);
      });
    }
    const rise = [{ opacity: 0, translate: "0 22px" }, { opacity: 1, translate: "0 0" }];
    const openFrame = [
      { opacity: .35, clipPath: "inset(0 9% 0 0 round 16px)" },
      { opacity: 1, clipPath: "inset(0 0 0 0 round 0px)" }
    ];
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.forEach(({target}, index) => {
        observer.unobserve(target);
        if (reduced.matches || target.contains(document.activeElement)) return;
        const delay = Math.min(index, 2) * 45;
        if (target.dataset.reveal === "panorama") {
          play(target, openFrame, 850, delay);
        } else if (target.dataset.reveal === "sequence") {
          [...target.children].forEach((child, i) => play(child, rise, 650, delay + i * 75));
        } else {
          play(target, rise, 620, delay);
        }
      });
    }, { threshold: 0 });
    document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
    reduced.addEventListener("change", () => {
      if (reduced.matches) running.forEach(animation => animation.finish());
    });
  }

  // The track's direct children are its snap items. Touch and trackpad use
  // the browser scroller. A critically damped spring handles buttons and mouse.
  function setupGallery(gallery) {
    const track = gallery.querySelector("[data-track]");
    if (!track || !track.children.length) return;
    const prev = gallery.querySelector("[data-prev]");
    const next = gallery.querySelector("[data-next]");
    const count = gallery.querySelector("[data-count]");
    if (!track.hasAttribute("tabindex")) track.tabIndex = 0;
    let stops = [0], target = null, velocity = 0, position = 0, previousTime = 0;
    let frame = 0, uiFrame = 0, drag = null, blockClickUntil = 0;
    let savedStyle = null;
    const nearest = x => stops.reduce((best, stop, i) =>
      Math.abs(stop - x) < Math.abs(stops[best] - x) ? i : best, 0);
    function updateControls() {
      uiFrame = 0;
      const i = nearest(target ?? track.scrollLeft);
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === stops.length - 1;
      if (count) {
        const label = String(i + 1).padStart(2, "0") + " / " + String(stops.length).padStart(2, "0");
        if (count.textContent !== label) count.textContent = label;
      }
    }
    function ownScroll() {
      if (savedStyle) return;
      savedStyle = [track.style.scrollSnapType, track.style.scrollBehavior, track.style.userSelect, track.style.cursor];
      track.style.scrollSnapType = "none";
      track.style.scrollBehavior = "auto";
    }
    function releaseScroll() {
      if (!savedStyle) return;
      [track.style.scrollSnapType, track.style.scrollBehavior, track.style.userSelect, track.style.cursor] = savedStyle;
      savedStyle = null;
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      target = null;
      velocity = 0;
      releaseScroll();
      updateControls();
    }
    function animate(now) {
      const dt = Math.min((now - previousTime) / 1000, .04);
      previousTime = now;
      const distance = position - target;
      const damping = 16;
      const impulse = velocity + damping * distance;
      const decay = Math.exp(-damping * dt);
      position = target + (distance + impulse * dt) * decay;
      velocity = (velocity - damping * impulse * dt) * decay;
      track.scrollLeft = position;
      if (Math.abs(position - target) > .35 || Math.abs(velocity) > 5) {
        frame = requestAnimationFrame(animate);
      } else {
        track.scrollLeft = target;
        stop();
      }
    }
    function go(index, initialVelocity) {
      ownScroll();
      target = stops[clamp(index, 0, stops.length - 1)];
      if (reduced.matches) {
        track.scrollLeft = target;
        stop();
        return;
      }
      if (initialVelocity !== undefined) velocity = initialVelocity;
      if (!frame) {
        position = track.scrollLeft;
        previousTime = performance.now();
        frame = requestAnimationFrame(animate);
      }
      updateControls();
    }
    function measure() {
      if (frame) stop();
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const origin = track.getBoundingClientRect().left + track.clientLeft;
      const padding = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      stops = [0];
      for (const item of track.children) {
        const x = clamp(item.getBoundingClientRect().left - origin + track.scrollLeft - padding, 0, max);
        if (x > stops[stops.length - 1] + 2) stops.push(x);
      }
      if (max > stops[stops.length - 1] + 2) stops.push(max);
      updateControls();
    }
    const step = delta => go(nearest(target ?? track.scrollLeft) + delta);
    prev?.addEventListener("click", () => step(-1));
    next?.addEventListener("click", () => step(1));
    track.addEventListener("keydown", event => {
      if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey) return;
      switch (event.key) {
        case "ArrowLeft": step(-1); break;
        case "ArrowRight": step(1); break;
        case "Home": go(0); break;
        case "End": go(stops.length - 1); break;
        default: return;
      }
      event.preventDefault();
    });
    track.addEventListener("scroll", () => {
      if (!uiFrame) uiFrame = requestAnimationFrame(updateControls);
    }, { passive: true });
    track.addEventListener("wheel", () => { if (frame) stop(); }, { passive: true });
    track.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0) return;
      if (frame) stop();
      if (event.pointerType !== "mouse" || stops.length < 2 ||
          event.target.closest("button, input, textarea, select, [contenteditable=true]")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: track.scrollLeft,
        lastX: event.clientX, lastTime: performance.now(), velocity: 0, active: false };
    });
    track.addEventListener("dragstart", event => { if (drag) event.preventDefault(); });
    window.addEventListener("pointermove", event => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!drag.active) {
        if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
        drag.active = true;
        track.setPointerCapture(event.pointerId);
        ownScroll();
        track.style.userSelect = "none";
        track.style.cursor = "grabbing";
      }
      const now = performance.now();
      const dt = Math.max(now - drag.lastTime, 1);
      const sample = clamp((drag.lastX - event.clientX) * 1000 / dt, -3500, 3500);
      drag.velocity = dt > 85 ? sample : drag.velocity * .45 + sample * .55;
      drag.lastX = event.clientX;
      drag.lastTime = now;
      track.scrollLeft = drag.offset - dx;
      event.preventDefault();
    });
    function finishDrag(event) {
      if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.id)) return;
      const ended = drag;
      drag = null;
      if (!ended.active) return;
      if (track.hasPointerCapture(ended.id)) track.releasePointerCapture(ended.id);
      const speed = event.type === "pointerup" && performance.now() - ended.lastTime < 85 ? ended.velocity : 0;
      blockClickUntil = performance.now() + 180;
      go(nearest(track.scrollLeft + speed * .14), speed);
    }
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    window.addEventListener("blur", finishDrag);
    track.addEventListener("click", event => {
      if (event.detail && performance.now() < blockClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    reduced.addEventListener("change", () => {
      if (reduced.matches && target !== null) go(nearest(target));
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(measure);
      observer.observe(track);
      for (const item of track.children) observer.observe(item);
    } else {
      addEventListener("resize", measure);
    }
    measure();
  }

  function init() {
    revealSections();
    document.querySelectorAll("[data-gallery]").forEach(setupGallery);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
