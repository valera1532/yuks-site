(() => {
  const layer = document.querySelector('.bridge-points');
  const media = layer?.closest('.bridge-media');
  const stage = media?.closest('.bridge-stage');
  if (!stage) return;

  const image = media.querySelector('.bridge-render');
  const hero = stage.closest('.hero');
  const mast = document.querySelector('.mast');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Alternate anchors lie on the same structural elements when a narrow crop hides the first.
  const parts = [
    {
      title: 'Несущая арка',
      text: 'Арка принимает нагрузку от подвесок и передаёт её к опорам моста',
      anchors: [[1380, 178], [1310, 154], [1260, 148], [1190, 130], [1490, 282], [1570, 370]]
    },
    {
      title: 'Подвески',
      text: 'Стальные подвески работают на растяжение и связывают пролётное строение с аркой',
      anchors: [[1285, 392], [1210, 420], [1166, 416]]
    },
    {
      title: 'Пролётное строение',
      text: 'Пролётное строение несёт проезжую часть и перекрывает расстояние между опорами',
      anchors: [[1100, 585], [1040, 590], [970, 600]]
    }
  ];

  // An independent layer keeps controls legible above the image's mobile fade.
  stage.append(layer);
  layer.setAttribute('role', 'group');
  layer.inert = true;
  const panel = document.createElement('aside');
  panel.className = 'bridge-callout';
  panel.id = 'bridge-callout';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'bridge-callout-title');
  panel.setAttribute('aria-describedby', 'bridge-callout-copy');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;
  panel.innerHTML = `
    <div class="bridge-callout-head">
      <h2 id="bridge-callout-title"></h2>
      <button type="button" class="bridge-callout-close" aria-label="Закрыть пояснение"></button>
    </div>
    <p id="bridge-callout-copy"></p>`;
  stage.append(panel);

  const heading = panel.querySelector('h2');
  const copy = panel.querySelector('p');
  const dismiss = panel.querySelector('button');
  const buttons = parts.map((part, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bridge-point';
    button.style.setProperty('--point-order', index);
    button.setAttribute('aria-label', part.title);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span class="bridge-point-plus" aria-hidden="true"></span>';
    layer.append(button);
    button.addEventListener('click', () => {
      if (active === button) { close(true); return; }
      active?.setAttribute('aria-expanded', 'false');
      active = button;
      button.setAttribute('aria-expanded', 'true');
      heading.textContent = part.title;
      copy.textContent = part.text;
      panel.inert = false;
      panel.removeAttribute('aria-hidden');
      placePanel();
      if (!active) return;
      panel.classList.add('is-open');
      dismiss.focus({ preventScroll: true });
    });
    return button;
  });

  let active;
  function close(restoreFocus) {
    if (!active) return;
    const trigger = active;
    active = null;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
    panel.classList.remove('is-open');
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
  }
  dismiss.addEventListener('click', () => close(true));
  document.addEventListener('keydown', event => {
    if (active && event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  });
  function leave(event) {
    if (active && !panel.contains(event.target) && !layer.contains(event.target)) close(false);
  }
  document.addEventListener('pointerdown', leave);
  document.addEventListener('focusin', leave);

  function clamp(value, low, high) {
    return Math.max(low, Math.min(value, high));
  }
  function placePanel() {
    if (!active) return;
    const frame = stage.getBoundingClientRect();
    const pin = active.getBoundingClientRect();
    const x = pin.left + pin.width / 2 - frame.left;
    const y = pin.top + pin.height / 2 - frame.top;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const gutter = 12;
    const left = Math.max(gutter, -frame.left + gutter);
    const right = Math.min(frame.width, document.documentElement.clientWidth - frame.left) - width - gutter;
    const top = Math.max(gutter, (mast?.getBoundingClientRect().bottom || 0) - frame.top + gutter);
    const bottom = Math.min(frame.height, innerHeight - frame.top) - height - gutter;
    if (bottom < top || pin.bottom < Math.max(0, mast?.offsetHeight || 0) || pin.top > innerHeight) {
      close(false);
      return;
    }
    const obstacles = [...stage.querySelectorAll('.hero-copy h1, .hero-category, .hero-lede, .hero-cta'), ...buttons];
    const boxes = obstacles.map(element => element.getBoundingClientRect());
    const gap = pin.width / 2 + 5;
    // Try either side, then below/above. Prefer a position that leaves text and the other pins readable.
    const candidates = [
      [x + gap, y - height / 2], [x - gap - width, y - height / 2],
      [x - width / 2, y + gap], [x - width / 2, y - gap - height]
    ].map(([idealX, idealY]) => {
      const px = clamp(idealX, left, right);
      const py = clamp(idealY, top, bottom);
      const vx = frame.left + px, vy = frame.top + py;
      let cost = Math.abs(px - idealX) + Math.abs(py - idealY);
      for (const box of boxes) {
        const overlapX = Math.max(0, Math.min(vx + width, box.right) - Math.max(vx, box.left));
        const overlapY = Math.max(0, Math.min(vy + height, box.bottom) - Math.max(vy, box.top));
        cost += overlapX * overlapY;
      }
      return { px, py, cost };
    });
    const best = candidates.reduce((a, b) => a.cost <= b.cost ? a : b);
    panel.style.left = best.px + 'px';
    panel.style.top = best.py + 'px';
    panel.style.transformOrigin = clamp(x - best.px, 0, width) + 'px ' + clamp(y - best.py, 0, height) + 'px';
  }

  function placePoints() {
    const width = media.clientWidth, height = media.clientHeight;
    if (!width || !height) return;
    const sourceWidth = image.naturalWidth || 1672, sourceHeight = image.naturalHeight || 941;
    const cover = Math.max(width / sourceWidth, height / sourceHeight);
    const offsetX = (width - sourceWidth * cover) / 2;
    const offsetY = (height - sourceHeight * cover) / 2;
    const offsetTop = media.offsetTop;
    const topLimit = Math.max(25, (mast?.offsetHeight || 0) - offsetTop + 25);
    Object.assign(layer.style, {
      left: media.offsetLeft + 'px', top: offsetTop + 'px',
      width: width + 'px', height: height + 'px'
    });
    parts.forEach((part, index) => {
      const points = part.anchors.map(([x, y]) => [offsetX + x * cover, offsetY + y * cover]);
      const [x, y] = points.find(([px, py]) => px >= 26 && px <= width - 26 && py >= topLimit && py <= height - 25) || points[0];
      buttons[index].style.left = clamp(x, 24, width - 24) + 'px';
      buttons[index].style.top = clamp(y, topLimit, height - 24) + 'px';
    });
    placePanel();
  }

  let frame = 0;
  function queueLayout() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; placePoints(); });
  }
  const observer = new ResizeObserver(queueLayout);
  observer.observe(media);
  observer.observe(stage);
  observer.observe(panel);
  window.addEventListener('resize', queueLayout);
  window.addEventListener('scroll', () => { if (active) queueLayout(); }, { passive: true });
  image.addEventListener('load', queueLayout);
  function reveal() {
    layer.inert = false;
    layer.classList.add('is-ready');
  }
  motion.addEventListener('change', () => { if (motion.matches) reveal(); queueLayout(); });
  placePoints();
  if (motion.matches || hero.hasAttribute('data-intro-ready')) reveal();
  else hero.addEventListener('bridge-intro-ready', reveal, { once: true });
})();
