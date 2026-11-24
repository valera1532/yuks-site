(() => {
  const assets = 'assets/projects/';
  const donetsk = 'Донецкая Народная Республика';
  const projects = [
    {
      id: 'kalinovka', region: donetsk,
      name: 'Мост через р. Кальмиус, п. Калиновка',
      heading: 'Реконструкция моста через реку Кальмиус в посёлке Калиновка',
      cover: 'assets/project-kalmius.webp',
      text: [
        'Компания «ЮКС» принимала участие в реконструкции моста через реку Кальмиус в посёлке Калиновка, недалеко от Мариуполя. Проект включал полный демонтаж старого сооружения и строительство нового современного моста.',
        'Обновлённый мост обеспечивает безопасное транспортное сообщение между населёнными пунктами, способствует ускорению перевозки грузов и развитию инфраструктуры региона.',
        'Благодаря использованию современной строительной техники и контролю качества на каждом этапе работы были выполнены в установленные сроки. Новый мост отличается надёжностью и рассчитан на длительную эксплуатацию.'
      ]
    },
    {
      id: 'a289', region: 'Краснодарский край',
      name: 'Проект на трассе А-289 Краснодар - Керчь',
      heading: 'Строительство мостовых сооружений на трассе А-289 Краснодар — Керчь',
      cover: 'assets/project-a289.webp',
      text: [
        'Компания «ЮКС» принимала участие в реализации проекта строительства транспортного коридора на трассе А-289 Краснодар — Керчь.',
        'В рамках проекта специалисты компании участвовали в возведении более 10 мостовых сооружений различной сложности. Комплекс выполненных работ включал устройство фундаментов, возведение опор и монтаж пролётных строений.',
        'Участие в проекте стало частью работы компании по развитию транспортной инфраструктуры.'
      ]
    },
    {
      id: 'ivanovka', region: donetsk,
      name: 'Мост через реку Грузский Еланчик, п. Ивановка',
      heading: 'Строительство моста через реку Грузский Еланчик в посёлке Ивановка',
      cover: 'assets/project-elanchik.webp',
      text: [
        'Компания «ЮКС» реализовала проект по обновлению мостового сооружения через реку Грузский Еланчик в посёлке Ивановка. Работы были направлены на улучшение транспортной инфраструктуры населённого пункта и обеспечение надёжного сообщения.',
        'В ходе реализации проекта выполнено обновление мостового сооружения с применением современных инженерных решений и технологий. Особое внимание уделялось качеству строительных работ, надёжности конструктивных элементов и долговечности обновлённого объекта.',
        'Благодаря слаженной работе команды специалистов и использованию современной строительной техники проект удалось реализовать в установленные сроки. Выполненные работы позволили повысить безопасность движения и обеспечить более надёжное транспортное сообщение.'
      ]
    },
    { id: 'novoazovsk', region: donetsk, name: 'Мост через реку Грузский Еланчик, г. Новоазовск' },
    { id: 'sartana', region: donetsk, name: 'Мост через р. Кальмиус, п. Сартана' },
    { id: 'staraya-laspa', region: donetsk, name: 'Мост через р. Кальмиус, п. Старая Ласпа' },
    { id: 'pavlopol', region: donetsk, name: 'Мост через р. Кальмиус, п. Павлополь' },
    { id: 'mariupol', region: donetsk, name: 'Трасса Р-280, г. Мариуполь' }
  ];

  const featured = document.querySelector('#featured-projects');
  const openCatalog = document.querySelector('[data-open-projects]');
  if (!featured || !openCatalog) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'project-dialog';
  dialog.setAttribute('aria-labelledby', 'project-dialog-heading');
  dialog.innerHTML = `
    <div class="project-dialog-controls">
      <button type="button" class="project-dialog-close" aria-label="Закрыть"></button>
    </div>
    <div class="project-dialog-body"></div>`;
  document.body.append(dialog);

  const content = dialog.querySelector('.project-dialog-body');
  const close = dialog.querySelector('.project-dialog-close');
  let returnProject = null;
  let catalogScroll = 0;
  let opener;

  function projectCard(project) {
    const cover = project.cover || assets + project.id + '-cover.webp';
    return `<button type="button" class="project-card" data-project="${project.id}" aria-haspopup="dialog">
      <img class="project-card-photo" src="${cover}" alt="" loading="lazy" decoding="async">
      <span class="project-card-region">${project.region}</span>
      <span class="project-card-name">${project.name}</span>
    </button>`;
  }

  function showDialog(trigger) {
    dialog.toggleAttribute('data-switching', dialog.open);
    if (!dialog.open) {
      opener = trigger;
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    close.focus({ preventScroll: true });
  }

  function showCatalog(trigger, focusProject) {
    returnProject = null;
    dialog.dataset.view = 'catalog';
    content.innerHTML = `
      <h2 id="project-dialog-heading">Все проекты</h2>
      <p class="project-catalog-intro">Объекты строительства, реконструкции и ремонта мостовых сооружений, в которых принимает участие компания „ЮКС“</p>
      <div class="project-catalog-grid">${projects.map(projectCard).join('')}</div>`;
    showDialog(trigger);
    if (focusProject) {
      dialog.scrollTop = catalogScroll;
      content.querySelector(`[data-project="${focusProject}"]`).focus({ preventScroll: true });
    }
  }

  function showProject(project, trigger) {
    const fromCatalog = dialog.open && dialog.dataset.view === 'catalog';
    if (fromCatalog) catalogScroll = dialog.scrollTop;
    returnProject = fromCatalog ? project.id : null;
    dialog.dataset.view = 'detail';
    const paragraphs = project.text || [project.region];
    content.innerHTML = `
      ${fromCatalog ? '<button class="project-back" type="button">Все проекты</button>' : ''}
      <article class="project-detail project-detail--${project.id}">
        <div class="project-detail-heading">
          <img class="project-detail-photo" src="${assets + project.id}.webp" alt="${project.name}">
          <h2 id="project-dialog-heading">${project.heading || project.name}</h2>
        </div>
        <div class="project-detail-copy">${paragraphs.map(text => `<p>${text}</p>`).join('')}</div>
      </article>`;
    showDialog(trigger);
  }

  function handleCard(event) {
    const card = event.target.closest('[data-project]');
    if (!card) return;
    const project = projects.find(item => item.id === card.dataset.project);
    if (project) showProject(project, card);
  }

  featured.innerHTML = projects.slice(0, 3).map(projectCard).join('');
  featured.addEventListener('click', handleCard);
  openCatalog.setAttribute('aria-haspopup', 'dialog');
  openCatalog.addEventListener('click', () => showCatalog(openCatalog));
  content.addEventListener('click', event => {
    if (event.target.closest('.project-back')) showCatalog(null, returnProject);
    else handleCard(event);
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && returnProject) {
      event.preventDefault();
      showCatalog(null, returnProject);
    }
  });
  dialog.addEventListener('cancel', event => {
    if (event.cancelable && returnProject) {
      event.preventDefault();
      showCatalog(null, returnProject);
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    returnProject = null;
    opener?.focus({ preventScroll: true });
  });
})();
