(() => {
  const catalog = document.getElementById('project-catalog');
  if (!catalog) return;

  const donetsk = 'Донецкая Народная Республика';
  const projects = [
    { id: 'novoazovsk', place: 'Новоазовск', region: donetsk, title: 'Мост через Грузский Еланчик' },
    {
      id: 'kalinovka', place: 'Калиновка', region: donetsk,
      title: 'Мост через Кальмиус', caption: 'Реконструкция моста',
      heading: 'Реконструкция моста через реку Кальмиус в посёлке Калиновка',
      details: [
        'Компания «ЮКС» принимала участие в реконструкции моста через реку Кальмиус в посёлке Калиновка, недалеко от Мариуполя',
        'Проект включал полный демонтаж старого сооружения и строительство нового современного моста',
        'Обновлённый мост обеспечивает безопасное транспортное сообщение между населёнными пунктами, способствует ускорению перевозки грузов и развитию инфраструктуры региона',
        'Благодаря использованию современной строительной техники и контролю качества на каждом этапе работы были выполнены в установленные сроки',
        'Новый мост отличается надёжностью и рассчитан на длительную эксплуатацию'
      ]
    },
    {
      id: 'a289', place: 'Краснодарский край', region: 'Краснодарский край',
      title: 'Трасса А-289', caption: 'Более 10 мостовых сооружений',
      heading: 'Мостовые сооружения на трассе А-289 Краснодар — Керчь',
      details: [
        'Компания «ЮКС» принимала участие в реализации проекта строительства транспортного коридора на трассе А-289 Краснодар — Керчь',
        'В рамках проекта специалисты компании участвовали в возведении более 10 мостовых сооружений различной сложности',
        'Комплекс выполненных работ включал устройство фундаментов, возведение опор и монтаж пролётных строений',
        'Участие в проекте стало частью работы компании по развитию транспортной инфраструктуры'
      ]
    },
    {
      id: 'ivanovka', place: 'Ивановка', region: donetsk,
      title: 'Мост через Грузский Еланчик', caption: 'Обновление мостового сооружения',
      heading: 'Строительство моста через реку Грузский Еланчик в посёлке Ивановка',
      details: [
        'Компания «ЮКС» реализовала проект по обновлению мостового сооружения через реку Грузский Еланчик в посёлке Ивановка',
        'Работы были направлены на улучшение транспортной инфраструктуры населённого пункта и обеспечение надёжного сообщения',
        'В ходе реализации проекта выполнено обновление мостового сооружения с применением современных инженерных решений и технологий',
        'Особое внимание уделялось качеству строительных работ, надёжности конструктивных элементов и долговечности обновлённого объекта',
        'Благодаря слаженной работе команды специалистов и использованию современной строительной техники проект удалось реализовать в установленные сроки',
        'Выполненные работы позволили повысить безопасность движения и обеспечить более надёжное транспортное сообщение'
      ]
    },
    { id: 'sartana', place: 'Сартана', region: donetsk, title: 'Мост через Кальмиус' },
    { id: 'staraya-laspa', place: 'Старая Ласпа', region: donetsk, title: 'Мост через Кальмиус' },
    { id: 'pavlopol', place: 'Павлополь', region: donetsk, title: 'Мост через Кальмиус' },
    { id: 'mariupol', place: 'Мариуполь', region: donetsk, title: 'Трасса Р-280' }
  ];

  const trackId = 'project-track';
  const src = project => 'assets/projects/' + project.id + '.webp';
  const location = project => project.place === project.region ? project.place : project.place + ' · ' + project.region;
  const arrow = direction => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><g transform="${direction < 0 ? 'rotate(180 12 12)' : ''}"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
  const swiper = document.createElement('div');
  swiper.className = 'project-swiper';
  swiper.setAttribute('role', 'region');
  swiper.setAttribute('aria-roledescription', 'карусель');
  swiper.setAttribute('aria-label', 'Проекты ЮКС');
  swiper.innerHTML = `
    <div class="project-track" id="${trackId}" tabindex="0" role="group" aria-label="Фотографии проектов"></div>
    <div class="project-toolbar">
      <div class="project-thumbs" role="group" aria-label="Выбрать проект"></div>
      <div class="project-nav">
        <span class="project-count" role="status" aria-live="polite" aria-atomic="true"></span>
        <button class="project-prev" type="button" aria-label="Предыдущий проект" aria-controls="${trackId}">${arrow(-1)}</button>
        <button class="project-next" type="button" aria-label="Следующий проект" aria-controls="${trackId}">${arrow(1)}</button>
      </div>
    </div>
    <details class="project-info">
      <summary class="project-info-toggle">Подробнее о проекте</summary>
      <div class="project-info-copy"></div>
    </details>`;
  const track = swiper.querySelector('.project-track');
  const thumbs = swiper.querySelector('.project-thumbs');
  const prev = swiper.querySelector('.project-prev');
  const next = swiper.querySelector('.project-next');
  const count = swiper.querySelector('.project-count');
  const info = swiper.querySelector('.project-info');
  const copy = swiper.querySelector('.project-info-copy');
  for (const [index, project] of projects.entries()) {
    const id = 'project-' + project.id;
    const slide = document.createElement('article');
    slide.id = id;
    slide.className = 'project-slide';
    slide.dataset.project = project.id;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'слайд');
    slide.setAttribute('aria-label', `${index + 1} из ${projects.length}: ${location(project)}`);
    slide.innerHTML = `
      <img class="project-photo" src="${src(project)}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" draggable="false" alt="${project.title}, ${project.place}">
      <div class="project-overlay">
        <p class="project-place">${project.place}</p>
        <h3 class="project-name">${project.title}</h3>
        ${project.caption ? `<p class="project-caption">${project.caption}</p>` : ''}
      </div>`;
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'project-thumb';
    thumb.setAttribute('aria-controls', id);
    thumb.setAttribute('aria-label', `Проект ${index + 1} из ${projects.length}: ${project.title}, ${project.place}`);
    thumb.innerHTML = `<img src="${src(project)}" alt="" loading="lazy" decoding="async" draggable="false">`;
    thumb.addEventListener('click', () => select(index));
    thumbs.append(thumb);
    track.append(slide);
  }
  catalog.replaceChildren(swiper);

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const slides = [...track.children];
  const buttons = [...thumbs.children];
  const last = slides.length - 1;
  let active = -1;
  let destination = null;
  let stops = [];
  let measuredWidth, measuredExtent;
  let drag;
  let scrollFrame = 0;

  function keepThumbVisible(thumb) {
    const strip = thumbs.getBoundingClientRect();
    const tile = thumb.getBoundingClientRect();
    const shift = tile.left < strip.left ? tile.left - strip.left : Math.max(0, tile.right - strip.right);
    if (shift) thumbs.scrollBy({ left: shift, behavior: 'instant' });
  }
  function show(index) {
    if (active === index) return;
    if (active >= 0) {
      slides[active].setAttribute('aria-hidden', 'true');
      slides[active].classList.remove('is-current');
      buttons[active].removeAttribute('aria-current');
    }
    active = index;
    const project = projects[index];
    slides[index].removeAttribute('aria-hidden');
    slides[index].classList.add('is-current');
    buttons[index].setAttribute('aria-current', 'true');
    prev.disabled = index === 0;
    next.disabled = index === last;
    const number = String(index + 1).padStart(2, '0');
    count.innerHTML = `<span>${number}</span><span> / </span><span>${String(projects.length).padStart(2, '0')}</span>`;
    count.setAttribute('aria-label', `Проект ${index + 1} из ${projects.length}: ${project.title}, ${project.place}`);
    copy.replaceChildren();
    info.hidden = !project.details;
    if (project.details) {
      const heading = document.createElement('h4');
      heading.textContent = project.heading;
      copy.append(heading);
      for (const text of project.details) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        copy.append(paragraph);
      }
    } else {
      info.open = false;
    }
    keepThumbVisible(buttons[index]);
  }
  function closestIndex(offset) {
    return stops.reduce((best, value, i) => Math.abs(value - offset) < Math.abs(stops[best] - offset) ? i : best, 0);
  }
  function select(index, behavior = reduceMotion.matches ? 'instant' : 'smooth') {
    const target = Math.min(last, Math.max(0, index));
    destination = target;
    show(target);
    track.scrollTo({ left: stops[target], behavior });
    if (Math.abs(track.scrollLeft - stops[target]) <= 1) destination = null;
  }
  function resize() {
    const rect = track.getBoundingClientRect();
    const style = getComputedStyle(track);
    const start = rect.left + track.clientLeft;
    const padLeft = parseFloat(style.scrollPaddingLeft) || 0;
    const padRight = parseFloat(style.scrollPaddingRight) || 0;
    measuredWidth = track.clientWidth;
    measuredExtent = track.scrollWidth;
    const max = Math.max(0, measuredExtent - measuredWidth);
    stops = slides.map(slide => {
      const box = slide.getBoundingClientRect();
      const center = getComputedStyle(slide).scrollSnapAlign.split(' ').pop() === 'center';
      const pad = center ? (track.clientWidth - box.width + padLeft - padRight) / 2 : padLeft;
      return Math.min(max, Math.max(0, track.scrollLeft + box.left - start - pad));
    });
    select(Math.max(0, active), 'instant');
    keepThumbVisible(buttons[active]);
  }
  function syncScroll() {
    scrollFrame = 0;
    // Native snap may re-position before ResizeObserver delivers the new geometry.
    if (track.clientWidth !== measuredWidth || track.scrollWidth !== measuredExtent) {
      resize();
      return;
    }
    if (destination !== null) {
      if (Math.abs(track.scrollLeft - stops[destination]) <= 1) destination = null;
      return;
    }
    show(closestIndex(track.scrollLeft));
  }
  function interruptScroll() {
    if (destination === null) return;
    destination = null;
    track.scrollTo({ left: track.scrollLeft, behavior: 'instant' });
    show(closestIndex(track.scrollLeft));
  }
  track.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScroll);
  }, { passive: true });
  track.addEventListener('wheel', interruptScroll, { passive: true });
  prev.addEventListener('click', () => select(active - 1));
  next.addEventListener('click', () => select(active + 1));
  swiper.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || info.contains(event.target)) return;
    const offsets = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: last };
    if (!Object.hasOwn(offsets, event.key)) return;
    const fromThumb = thumbs.contains(event.target);
    event.preventDefault();
    select(offsets[event.key]);
    if (fromThumb) buttons[active].focus({ preventScroll: true });
  });

  // Touch and wheel keep native inertia. Mouse dragging temporarily releases the snap points.
  track.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    interruptScroll();
    if (event.pointerType !== 'mouse') return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: track.scrollLeft,
      lastX: event.clientX, lastTime: performance.now(), speed: 0, started: false };
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (!drag.started) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
      drag.started = true;
      track.classList.add('is-dragging');
      track.style.scrollSnapType = 'none';
    }
    const now = performance.now();
    const sample = (drag.lastX - event.clientX) / Math.max(1, now - drag.lastTime);
    drag.speed = drag.speed * .45 + Math.max(-4, Math.min(4, sample)) * .55;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    track.scrollTo({ left: drag.offset - dx, behavior: 'instant' });
    event.preventDefault();
  });
  function endDrag(event) {
    if (!drag || (event.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const finished = drag;
    drag = null;
    if (track.hasPointerCapture(finished.id)) track.releasePointerCapture(finished.id);
    if (!finished.started) return;
    const speed = event.type === 'pointerup' && performance.now() - finished.lastTime < 100 ? finished.speed : 0;
    const target = closestIndex(track.scrollLeft + speed * 170);
    track.classList.remove('is-dragging');
    track.style.removeProperty('scroll-snap-type');
    select(target);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('blur', endDrag);

  slides.forEach(slide => slide.setAttribute('aria-hidden', 'true'));
  resize();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resize);
    observer.observe(track);
    slides.forEach(slide => observer.observe(slide));
  } else {
    window.addEventListener('resize', resize);
  }
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches && destination !== null) select(destination, 'instant');
  });
})();
