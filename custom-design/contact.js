(() => {
  'use strict';

  const dialog = document.getElementById('contact-dialog');
  if (!dialog) return;

  const recipient = 'yuks61@mail.ru';
  const mobile = window.matchMedia('(max-width: 48rem)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const contactLinks = `<a href="mailto:${recipient}">${recipient}</a>
    <a href="tel:+79185208753">+7 918 520-87-53</a>`;
  dialog.innerHTML = `
    <div class="contact-card">
      <div class="contact-handle" aria-hidden="true"><span></span></div>
      <aside class="contact-info" aria-label="Контакты ЮКС">
        <div class="contact-wordmark"><img src="assets/logo-mark-white.svg" alt="">ЮКС</div>
        <div class="contact-drawing" aria-hidden="true"></div>
        <address class="contact-address"><span>Мариуполь</span>${contactLinks}</address>
      </aside>
      <div class="contact-scroll">
        <div class="contact-heading">
          <h2 id="contact-dialog-title" tabindex="-1">Написать в ЮКС</h2>
          <button type="button" class="contact-close" aria-label="Закрыть форму"></button>
        </div>
        <form class="contact-fields">
          <fieldset class="contact-topics">
            <legend>Тема письма</legend>
            <label><input type="radio" name="subject" value="Проект" checked><span>Проект</span></label>
            <label><input type="radio" name="subject" value="Вакансии"><span>Вакансии</span></label>
            <label><input type="radio" name="subject" value="Другое"><span>Другое</span></label>
            <span class="contact-tab-marker" aria-hidden="true"></span>
          </fieldset>
          <div class="contact-draft">
            <label class="contact-field contact-message">Сообщение
              <textarea name="message" rows="4" maxlength="1400" required></textarea>
            </label>
            <div class="contact-row">
              <label class="contact-field">Как вам ответить?
                <input name="contact" placeholder="Телефон или почта" spellcheck="false" autocapitalize="none" maxlength="160" required>
              </label>
              <label class="contact-field"><span>Имя <small>по желанию</small></span>
                <input name="name" placeholder="Ваше имя" autocomplete="name" maxlength="100">
              </label>
            </div>
          </div>
          <div class="contact-actions">
            <button class="contact-submit" type="submit">Открыть черновик</button>
            <button class="contact-copy" type="button">Скопировать письмо</button>
          </div>
          <p class="contact-note">Проверьте письмо и отправьте его из своей почты</p>
          <p class="contact-status" role="status" aria-live="polite"></p>
          <label class="contact-field contact-fallback" hidden>Текст письма для копирования<textarea rows="4" readonly></textarea></label>
        </form>
        <details class="contact-direct"><summary>Контакты ЮКС</summary><address>${contactLinks}</address></details>
      </div>
    </div>`;

  const card = dialog.querySelector('.contact-card');
  const title = dialog.querySelector('h2');
  const form = dialog.querySelector('form');
  const subject = form.elements.subject;
  const message = form.elements.message;
  const contact = form.elements.contact;
  const sender = form.elements.namedItem('name');
  const status = dialog.querySelector('.contact-status');
  const fallback = dialog.querySelector('.contact-fallback');
  const fallbackText = fallback.querySelector('textarea');
  const handle = dialog.querySelector('.contact-handle');
  const tabs = dialog.querySelector('.contact-topics');
  const marker = tabs.querySelector('.contact-tab-marker');
  const tabLabels = [...tabs.querySelectorAll('label')];
  const fields = dialog.querySelector('.contact-draft');
  const topics = {
    'Проект': { subject: 'Обсуждение проекта', prompt: 'Расскажите об объекте и работах, которые планируете' },
    'Вакансии': { subject: 'Вакансии в ЮКС', prompt: 'Расскажите о вашем опыте и о работе, которая вас интересует' },
    'Другое': { subject: 'Обращение в ЮКС', prompt: 'Что вы хотели бы обсудить с нашей командой?' }
  };
  const drafts = new Map();
  let context = 'Проект';
  let opener;
  let gesture;
  let frame;
  let position = 0;
  let velocity = 0;
  let desktopAnimation;
  let draftAnimation;
  let markerFrame;
  const edges = [{ x: 0, v: 0 }, { x: 0, v: 0 }];

  function alignMarker(animate = false) {
    if (!dialog.open) return;
    const tab = tabs.querySelector('input:checked').parentElement;
    const ends = [tab.offsetLeft, tab.offsetLeft + tab.offsetWidth];
    const forward = ends[0] >= edges[0].x;
    cancelAnimationFrame(markerFrame);
    function paint() {
      const width = Math.max(1, edges[1].x - edges[0].x);
      marker.style.transform = 'translateX(' + edges[0].x + 'px) scaleX(' + width / 100 + ')';
    }
    function snap() {
      edges.forEach((edge, i) => { edge.x = ends[i]; edge.v = 0; });
      paint();
    }
    if (!animate || reduceMotion.matches) { snap(); return; }

    // The leading edge reaches for the next tab; the trailing edge catches up.
    let last = performance.now();
    function tick(time) {
      const dt = Math.min(Math.max((time - last) / 1000, 0), .05);
      last = time;
      edges.forEach((edge, i) => {
        const leadingEdge = forward ? 1 : 0;
        const omega = i === leadingEdge ? 25 : 19;
        const damping = omega * .78;
        const frequency = Math.sqrt(omega * omega - damping * damping);
        const distance = edge.x - ends[i];
        const decay = Math.exp(-damping * dt);
        const cosine = Math.cos(frequency * dt);
        const sine = Math.sin(frequency * dt) / frequency;
        edge.x = ends[i] + decay * (distance * cosine + (edge.v + damping * distance) * sine);
        edge.v = decay * (edge.v * cosine - (damping * edge.v + omega * omega * distance) * sine);
      });
      paint();
      if (edges.every((edge, i) => Math.abs(edge.x - ends[i]) < .2 && Math.abs(edge.v) < 4)) snap();
      else markerFrame = requestAnimationFrame(tick);
    }
    markerFrame = requestAnimationFrame(tick);
  }

  function revealDraft(direction) {
    if (reduceMotion.matches || !fields.animate) return;
    // Reverse an in-flight change from its visible frame without hiding the inputs.
    const current = getComputedStyle(fields);
    const x = current.transform === 'none' ? 0 : new DOMMatrixReadOnly(current.transform).m41;
    const startX = Math.max(-22, Math.min(22, x + direction * 15));
    const alpha = Math.max(.48, Math.min(.75, Number(current.opacity)));
    draftAnimation?.cancel();
    draftAnimation = fields.animate([
      { opacity: alpha, transform: 'translateX(' + startX + 'px)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 320, easing: 'cubic-bezier(.18,.76,.25,1)' });
  }

  function saveDraft() {
    drafts.set(context, { message: message.value, contact: contact.value, name: sender.value });
  }

  function showDraft(topic) {
    context = topic;
    const draft = drafts.get(topic);
    form.reset();
    subject.value = topic;
    message.placeholder = topics[topic].prompt;
    message.value = draft?.message ?? '';
    contact.value = draft?.contact ?? '';
    sender.value = draft?.name ?? '';
    validate(message);
    validate(contact);
    status.textContent = '';
    fallback.hidden = true;
  }

  form.addEventListener('change', (event) => {
    if (event.target.name !== 'subject') return;
    const previousIndex = tabLabels.findIndex(label => label.querySelector('input').value === context);
    const nextIndex = tabLabels.indexOf(event.target.parentElement);
    saveDraft();
    showDraft(event.target.value);
    alignMarker(true);
    revealDraft(Math.sign(nextIndex - previousIndex));
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => alignMarker()).observe(tabs);

  function moveSheet() {
    card.style.transform = 'translate3d(0,' + position + 'px,0)';
  }

  function stopMotion() {
    cancelAnimationFrame(frame);
    desktopAnimation?.cancel();
    desktopAnimation = null;
  }

  function settle(close) {
    const liveStyle = !mobile.matches && desktopAnimation ? getComputedStyle(card) : null;
    const liveFrame = liveStyle ? { opacity: liveStyle.opacity, transform: liveStyle.transform } : null;
    stopMotion();
    dialog.classList.toggle('is-retiring', close);
    const target = close ? card.offsetHeight + 12 : 0;
    const finished = () => {
      if (close) dialog.close();
      else card.style.removeProperty('transform');
      position = velocity = 0;
    };
    if (reduceMotion.matches) {
      finished();
      return;
    }
    if (!mobile.matches) {
      const outside = { opacity: 0, transform: 'translateY(10px) scale(.975)' };
      const inside = { opacity: 1, transform: 'none' };
      desktopAnimation = card.animate(close ? [liveFrame ?? inside, outside] : [liveFrame ?? outside, inside], {
        duration: close ? 145 : 235, easing: 'cubic-bezier(.2,.8,.2,1)'
      });
      desktopAnimation.onfinish = finished;
      return;
    }
    // Exact solution of a critically damped spring, preserving release velocity.
    let lastTime = performance.now();
    const frequency = 21;
    function tick(time) {
      const dt = Math.min((time - lastTime) / 1000, .064);
      lastTime = time;
      const distance = position - target;
      const drift = velocity + frequency * distance;
      const decay = Math.exp(-frequency * dt);
      position = target + (distance + drift * dt) * decay;
      velocity = (velocity - frequency * drift * dt) * decay;
      moveSheet();
      if (Math.abs(target - position) < .65 && Math.abs(velocity) < 12) finished();
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-contact]');
    if (!trigger) return;
    event.preventDefault();
    if (dialog.open) return;
    opener = trigger;
    const topic = trigger.dataset.contact.trim() || 'Проект';
    showDraft(Object.hasOwn(topics, topic) ? topic : 'Другое');
    dialog.querySelector('.contact-direct').open = false;
    dialog.showModal();
    alignMarker();
    dialog.querySelector('.contact-scroll').scrollTop = 0;
    title.focus({ preventScroll: true });
    if (mobile.matches && !reduceMotion.matches) {
      position = card.offsetHeight + 12;
      moveSheet();
    }
    settle(false);
  });

  dialog.querySelector('.contact-close').addEventListener('click', () => settle(true));
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    settle(true);
  });
  let outsideDown = false;
  dialog.addEventListener('pointerdown', (event) => { outsideDown = event.target === dialog; });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && outsideDown) settle(true);
    outsideDown = false;
  });
  dialog.addEventListener('close', () => {
    stopMotion();
    cancelAnimationFrame(markerFrame);
    draftAnimation?.cancel();
    dialog.classList.remove('is-retiring');
    gesture = null;
    position = velocity = 0;
    card.style.removeProperty('transform');
    saveDraft();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });

  handle.addEventListener('pointerdown', (event) => {
    if (!mobile.matches || !event.isPrimary || event.button !== 0 || gesture) return;
    stopMotion();
    dialog.classList.remove('is-retiring');
    handle.setPointerCapture(event.pointerId);
    gesture = { id: event.pointerId, y: event.clientY, base: position, moved: false,
      history: [{ time: event.timeStamp, y: event.clientY }] };
    velocity = 0;
  });
  handle.addEventListener('pointermove', (event) => {
    if (gesture?.id !== event.pointerId) return;
    const delta = event.clientY - gesture.y;
    if (!gesture.moved && Math.abs(delta) < 6) return;
    gesture.moved = true;
    const proposed = gesture.base + delta;
    position = proposed < 0 ? proposed / (4 + Math.abs(proposed) / 24) : proposed;
    moveSheet();
    gesture.history = gesture.history.filter((sample) => event.timeStamp - sample.time < 100);
    gesture.history.push({ time: event.timeStamp, y: event.clientY });
  });
  function endGesture(event) {
    if (gesture?.id !== event.pointerId) return;
    const first = gesture.history.find((sample) => event.timeStamp - sample.time < 120);
    const finished = event.type === 'pointerup' && gesture.moved;
    velocity = finished && first ? (event.clientY - first.y) * 1000 / Math.max(12, event.timeStamp - first.time) : 0;
    gesture = null;
    settle(finished && position + velocity * .16 > card.offsetHeight * .35);
  }
  handle.addEventListener('pointerup', endGesture);
  handle.addEventListener('pointercancel', endGesture);
  handle.addEventListener('lostpointercapture', endGesture);
  mobile.addEventListener('change', () => {
    if (!dialog.open) return;
    const closing = dialog.classList.contains('is-retiring');
    stopMotion();
    gesture = null;
    position = velocity = 0;
    card.style.removeProperty('transform');
    if (closing) settle(true);
  });
  reduceMotion.addEventListener('change', () => {
    if (!reduceMotion.matches || !dialog.open) return;
    draftAnimation?.cancel();
    alignMarker();
    settle(dialog.classList.contains('is-retiring'));
  });

  function validate(field) {
    if (!field.required) return;
    const value = field.value.trim();
    let error = '';
    if (field.value && !value) error = 'Заполните поле';
    if (value && field.name === 'contact') {
      const digits = value.replace(/\D/g, '');
      const phone = /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!phone && !email) error = 'Введите номер телефона или адрес электронной почты';
    }
    field.setCustomValidity(error);
  }
  form.addEventListener('input', (event) => {
    validate(event.target);
    status.textContent = '';
    fallback.hidden = true;
  });
  function letter() {
    for (const field of form.elements) validate(field);
    if (!form.reportValidity()) return;
    const signature = [sender.value.trim(), contact.value.trim()].filter(Boolean);
    const body = [message.value.trim(), '', ...signature].join('\r\n');
    return { subject: topics[context].subject, body };
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const draft = letter();
    if (!draft) return;
    status.textContent = 'Если почта не открылась, скопируйте письмо';
    window.location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(draft.subject) + '&body=' + encodeURIComponent(draft.body);
  });
  dialog.querySelector('.contact-copy').addEventListener('click', async () => {
    const draft = letter();
    if (!draft) return;
    const text = ['Кому: ' + recipient, 'Тема: ' + draft.subject, '', draft.body].join('\r\n');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Письмо скопировано';
    } catch {
      fallback.hidden = false;
      fallbackText.value = text;
      fallbackText.focus();
      fallbackText.select();
      status.textContent = 'Выберите «Скопировать» для выделенного текста';
    }
  });
})();
