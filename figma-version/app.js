(() => {
  const navigation = document.getElementById("main-nav");
  const menuButton = document.querySelector("[data-menu-toggle]");

  function setMenu(open) {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  menuButton.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });

  const firstPhoto = document.getElementById("about-photo");
  const gallery = firstPhoto.closest(".about-slider");
  const slides = [
    [firstPhoto.getAttribute("src"), firstPhoto.alt],
    ["assets/gallery/slide-2.webp", "Строительные леса и гусеничный кран у пролёта моста"],
    ["assets/gallery/slide-3.webp", "Автокран поднимает конструкцию над опорами моста"],
    ["assets/gallery/slide-4.webp", "Краны устанавливают длинную балку мостового пролёта"],
    ["assets/gallery/slide-5.webp", "Монтажник в страховочной привязи работает у края пролёта"],
    ["assets/gallery/slide-6.webp", "Подъёмник и строительная вышка под мостом"],
    ["assets/gallery/slide-7.webp", "Кран поднимает арматурный каркас над опалубкой опоры"],
    ["assets/gallery/slide-8.webp", "Рабочие вяжут арматуру мостового полотна"],
  ];
  const galleryStatus = document.createElement("span");
  galleryStatus.className = "sr-only";
  galleryStatus.setAttribute("role", "status");
  gallery.append(galleryStatus);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const frame = document.createElement("div");
  frame.className = "gallery-frame";
  firstPhoto.before(frame);
  const photos = slides.map(([src, description], index) => {
    const image = index === 0 ? firstPhoto : new Image();
    if (index !== 0) {
      image.loading = "lazy";
      image.decoding = "async";
      image.alt = description;
      image.setAttribute("aria-hidden", "true");
      image.src = src;
    }
    image.draggable = false;
    frame.append(image);
    return image;
  });
  let target = 0;
  let position = 0;
  let velocity = 0;
  let activePhoto = 0;
  let animation = 0;
  let lastTime = 0;

  function wrap(value) {
    return ((value % photos.length) + photos.length) % photos.length;
  }

  function paintGallery() {
    const half = photos.length / 2;
    photos.forEach((photo, index) => {
      const offset = wrap(index - position + half) - half;
      photo.style.transform = `translateX(${offset * 100}%)`;
    });
  }

  function settle(time) {
    const dt = Math.max(0, Math.min((time - lastTime) / 1000, 0.05));
    lastTime = time;
    const distance = position - target;
    // Exact critically damped spring solution, measured in slide widths.
    const rate = 22;
    const impulse = velocity + rate * distance;
    const decay = Math.exp(-rate * dt);
    position = target + (distance + impulse * dt) * decay;
    velocity = (velocity - rate * impulse * dt) * decay;
    if (Math.abs(position - target) < 0.0005 && Math.abs(velocity) < 0.01) {
      position = target;
      velocity = 0;
      animation = 0;
    } else {
      animation = requestAnimationFrame(settle);
    }
    paintGallery();
  }

  function goToSlide(next) {
    target = next;
    const index = wrap(target);
    if (index !== activePhoto) {
      photos[activePhoto].removeAttribute("id");
      photos[activePhoto].setAttribute("aria-hidden", "true");
      photos[index].id = "about-photo";
      photos[index].removeAttribute("aria-hidden");
      photos[index].loading = "eager";
      galleryStatus.textContent = `Фото ${index + 1} из ${slides.length}. ${slides[index][1]}.`;
      activePhoto = index;
    }
    if (reducedMotion.matches) {
      cancelAnimationFrame(animation);
      animation = 0;
      velocity = 0;
      position = target;
      paintGallery();
    } else if (!animation && position !== target) {
      lastTime = performance.now();
      animation = requestAnimationFrame(settle);
    }
  }

  paintGallery();
  reducedMotion.addEventListener("change", () => goToSlide(target));
  for (const button of gallery.querySelectorAll("[data-slide]")) {
    button.addEventListener("click", () => goToSlide(target + Number(button.dataset.slide)));
  }
  gallery.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    goToSlide(target + (event.key === "ArrowRight" ? 1 : -1));
  });
  let drag = null;
  frame.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) {
      drag = null;
      goToSlide(target);
      return;
    }
    const touch = event.touches[0];
    drag = { x: touch.clientX, y: touch.clientY, start: position, last: performance.now(), horizontal: false };
  }, { passive: true });
  frame.addEventListener("touchmove", (event) => {
    if (!drag) return;
    const touch = event.touches[0];
    const dx = touch.clientX - drag.x;
    const dy = touch.clientY - drag.y;
    if (!drag.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
      if (Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }
      cancelAnimationFrame(animation);
      animation = 0;
      drag.horizontal = true;
      drag.start = position;
    }
    if (reducedMotion.matches) return;
    const now = performance.now();
    const next = drag.start - dx / frame.clientWidth;
    velocity = Math.max(-4, Math.min(4, (next - position) * 1000 / Math.max(8, now - drag.last)));
    drag.last = now;
    position = next;
    paintGallery();
  }, { passive: true });
  frame.addEventListener("touchend", (event) => {
    if (!drag) return;
    const dx = event.changedTouches[0].clientX - drag.x;
    const dy = event.changedTouches[0].clientY - drag.y;
    const threshold = Math.min(55, frame.clientWidth * 0.12);
    let destination = target;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
      destination = Math.round(drag.start) - Math.sign(dx);
    }
    if (performance.now() - drag.last > 80) velocity = 0;
    drag = null;
    goToSlide(destination);
  }, { passive: true });
  frame.addEventListener("touchcancel", () => {
    drag = null;
    goToSlide(target);
  }, { passive: true });

  const companyDialog = document.getElementById("company-dialog");
  const jobsDialog = document.getElementById("jobs-dialog");
  document.querySelector("[data-open-about]").addEventListener("click", () => companyDialog.showModal());
  document.querySelector("[data-open-jobs]").addEventListener("click", () => jobsDialog.showModal());
  for (const dialog of [companyDialog, jobsDialog]) {
    dialog.querySelector("[data-dismiss]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }

  const form = document.getElementById("contact-form");
  const fields = form.elements;
  const status = document.getElementById("form-status");
  jobsDialog.querySelector("[data-job-contact]").addEventListener("click", () => {
    jobsDialog.close();
    if (!fields.subject.value.trim()) fields.subject.value = "Вопрос о вакансиях";
    form.scrollIntoView({ block: "center" });
    fields.name.focus({ preventScroll: true });
  });

  form.addEventListener("input", (event) => {
    event.target.setCustomValidity("");
    status.textContent = "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = fields.name.value.trim();
    const subject = fields.subject.value.trim();
    const contact = fields.contact.value.trim();
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(contact);
    const phone = /^\+?[\d\s().-]+$/u.test(contact) && /^\d{7,15}$/.test(contact.replace(/\D/g, ""));
    fields.name.setCustomValidity(name ? "" : "Введите ваше имя.");
    fields.subject.setCustomValidity(subject ? "" : "Укажите тему обращения.");
    fields.contact.setCustomValidity(email || phone ? "" : "Введите телефон с кодом города или адрес электронной почты.");
    if (!form.reportValidity()) return;

    const body = `Здравствуйте!\r\n\r\n${subject}\r\n\r\nИмя: ${name}\r\nКонтакт для ответа: ${contact}`;
    const mailto = `${form.action}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const draftLink = document.createElement("a");
    draftLink.href = mailto;
    draftLink.textContent = "Открыть черновик ещё раз";
    status.replaceChildren("Отправьте письмо из почтовой программы. ", draftLink);
    window.location.href = mailto;
  });

  if ("IntersectionObserver" in window) {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sections = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const block = entry.target;
        sections.unobserve(block);
        if (motion.matches && !block.matches(":focus-within") && !block.closest(":target") && !block.querySelector(":target")) {
          block.classList.add("entering-view");
        }
      }
    });

    const revealBlocks = [
      ".about-copy", ".about-slider", ".services-grid > div", ".service-list > li",
      ".projects-intro", "#featured-projects", ".values-grid > div", ".value-list",
      ".career-photo", ".career-intro", ".career-benefits", ".partners .container",
      ".footer-grid > *"
    ];
    document.querySelectorAll(revealBlocks.join(",")).forEach((block) => sections.observe(block));

    function finishArrival(event) {
      if (event.animationName === "content-arrival") event.target.classList.remove("entering-view");
    }
    document.addEventListener("animationend", finishArrival);
    document.addEventListener("animationcancel", finishArrival);
  }
})();
