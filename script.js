(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    /* ------------------------------------------------------------------
       Тема: system → light → dark → system
       ------------------------------------------------------------------ */
    const themeBtn = document.querySelector('.theme-toggle');
    const THEMES = ['system', 'light', 'dark'];

    function currentTheme() {
        return root.dataset.theme || 'system';
    }

    function updateThemeLabel() {
        themeBtn.setAttribute('aria-label', `Theme: ${currentTheme()} (click to change)`);
    }

    themeBtn.addEventListener('click', () => {
        const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
        root.classList.add('theme-anim');
        if (next === 'system') delete root.dataset.theme;
        else root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) {}
        updateThemeLabel();
        setTimeout(() => root.classList.remove('theme-anim'), 500);
    });
    updateThemeLabel();

    /* ------------------------------------------------------------------
       Мобільне меню
       ------------------------------------------------------------------ */
    const burger = document.querySelector('.burger');
    const menu = document.getElementById('nav-menu');

    function setMenu(open) {
        menu.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', (e) => {
        if (menu.classList.contains('is-open') && !e.target.closest('.nav')) setMenu(false);
    });

    /* ------------------------------------------------------------------
       Hero: поява імені по літерах
       ------------------------------------------------------------------ */
    document.querySelectorAll('.split').forEach((el) => {
        let i = 0;
        const words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        words.forEach((word, w) => {
            const wordEl = document.createElement('span');
            wordEl.className = 'word';
            wordEl.setAttribute('aria-hidden', 'true');
            for (const ch of word) {
                const c = document.createElement('span');
                c.className = 'char';
                c.style.setProperty('--i', i++);
                c.textContent = ch;
                wordEl.appendChild(c);
            }
            el.appendChild(wordEl);
            if (w < words.length - 1) el.appendChild(document.createTextNode(' '));
        });
    });

    /* ------------------------------------------------------------------
       Hero: parallax фото за курсором
       ------------------------------------------------------------------ */
    const hero = document.querySelector('.hero');
    const photo = document.querySelector('.hero__photo');

    hero.addEventListener('pointermove', (e) => {
        if (reducedMotion.matches || !finePointer.matches) return;
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        photo.style.setProperty('--tx', `${x * 18}px`);
        photo.style.setProperty('--ty', `${y * 18}px`);
        photo.style.setProperty('--ry', `${x * 12}deg`);
        photo.style.setProperty('--rx', `${-y * 12}deg`);
    });
    hero.addEventListener('pointerleave', () => {
        ['--tx', '--ty', '--rx', '--ry'].forEach((p) => photo.style.removeProperty(p));
    });

    /* ------------------------------------------------------------------
       Reveal-on-scroll зі stagger
       ------------------------------------------------------------------ */
    const revealObserver = new IntersectionObserver((entries) => {
        let n = 0;
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.style.setProperty('--delay', `${Math.min(n++, 6) * 80}ms`);
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
            // Прибираємо затримку після появи, щоб hover-переходи не гальмували
            setTimeout(() => entry.target.style.removeProperty('--delay'), 1500);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    /* ------------------------------------------------------------------
       Скрол: прогрес, glass-навігація, scrollspy, таймлайн
       ------------------------------------------------------------------ */
    const progress = document.querySelector('.scroll-progress');
    const nav = document.querySelector('.nav');
    const navLinks = Array.from(document.querySelectorAll('.nav__link'));
    const indicator = document.querySelector('.nav__indicator');
    const sections = navLinks.map((l) => document.getElementById(l.dataset.section));
    const timeline = document.querySelector('.timeline');
    const tlItems = Array.from(document.querySelectorAll('.tl-item'));
    let activeId = null;

    function moveIndicator(link) {
        if (!link) { indicator.style.opacity = '0'; return; }
        indicator.style.width = `${link.offsetWidth - 28}px`;
        indicator.style.transform = `translateX(${link.offsetLeft + 14}px)`;
        indicator.style.opacity = '1';
    }

    function onScroll() {
        const vh = window.innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
        nav.classList.toggle('is-scrolled', window.scrollY > 8);

        // Активна секція — остання, верх якої вище 40% вьюпорту
        let current = null;
        sections.forEach((s) => { if (s.getBoundingClientRect().top <= vh * 0.4) current = s.id; });
        if (window.scrollY >= max - 2) current = sections[sections.length - 1].id;
        if (current !== activeId) {
            activeId = current;
            navLinks.forEach((l) => {
                const on = l.dataset.section === current;
                l.classList.toggle('is-active', on);
                if (on) l.setAttribute('aria-current', 'true');
                else l.removeAttribute('aria-current');
            });
            moveIndicator(navLinks.find((l) => l.dataset.section === current));
        }

        // Лінія таймлайну домальовується до 60% вьюпорту
        const line = vh * 0.6;
        const tr = timeline.getBoundingClientRect();
        timeline.style.setProperty('--p', clamp((line - tr.top) / tr.height, 0, 1).toFixed(4));
        tlItems.forEach((item) => {
            item.classList.toggle('is-active', item.getBoundingClientRect().top + 16 <= line);
        });
    }

    let scrollQueued = false;
    const queueScroll = () => {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
    };
    window.addEventListener('scroll', queueScroll, { passive: true });
    window.addEventListener('resize', () => {
        moveIndicator(navLinks.find((l) => l.dataset.section === activeId));
        queueScroll();
    });
    // Шрифти змінюють ширину посилань — перераховуємо індикатор
    document.fonts && document.fonts.ready.then(() => moveIndicator(navLinks.find((l) => l.dataset.section === activeId)));
    onScroll();

    /* ------------------------------------------------------------------
       Відео-прев'ю: грають лише у вьюпорті
       ------------------------------------------------------------------ */
    const saveData = navigator.connection && navigator.connection.saveData;
    const cardVideos = Array.from(document.querySelectorAll('.project__media video'));
    const visibleVideos = new Set();
    let modalOpen = false;

    function tryPlay(video) {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
    }

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const v = entry.target;
            if (entry.isIntersecting) {
                visibleVideos.add(v);
                if (!modalOpen && !reducedMotion.matches && !saveData) tryPlay(v);
            } else {
                visibleVideos.delete(v);
                v.pause();
            }
        });
    }, { threshold: 0.35 });

    cardVideos.forEach((v) => videoObserver.observe(v));

    reducedMotion.addEventListener('change', () => {
        cardVideos.forEach((v) => {
            if (reducedMotion.matches) v.pause();
            else if (visibleVideos.has(v) && !modalOpen) tryPlay(v);
        });
    });

    /* ------------------------------------------------------------------
       Картки: 3D-tilt + spotlight
       ------------------------------------------------------------------ */
    document.querySelectorAll('.project').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', `${x * 100}%`);
            card.style.setProperty('--my', `${y * 100}%`);
            if (reducedMotion.matches || !finePointer.matches) return;
            card.classList.add('is-tilting');
            card.style.setProperty('--ry', `${(x - 0.5) * 6}deg`);
            card.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
        });
        card.addEventListener('pointerleave', () => {
            card.classList.remove('is-tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });

    /* ------------------------------------------------------------------
       Модалка проєкту
       ------------------------------------------------------------------ */
    const modal = document.getElementById('project-modal');
    const mMedia = modal.querySelector('.modal__media');
    const mMeta = modal.querySelector('.modal__meta');
    const mTitle = modal.querySelector('.modal__title');
    const mChips = modal.querySelector('.modal__chips');
    const mContent = modal.querySelector('.modal__content');
    const mLinks = modal.querySelector('.modal__links');
    let lastFocus = null;

    function openModal(card) {
        lastFocus = document.activeElement;

        mMedia.replaceChildren();
        const srcVideo = card.querySelector('.project__media video');
        const srcImg = card.querySelector('.project__media img');
        const pattern = card.querySelector('.project__pattern');

        if (srcVideo) {
            const v = document.createElement('video');
            v.src = srcVideo.getAttribute('src');
            v.poster = srcVideo.getAttribute('poster');
            v.controls = true;
            v.playsInline = true;
            v.loop = true;
            v.preload = 'metadata';
            mMedia.appendChild(v);
        } else if (srcImg) {
            mMedia.appendChild(srcImg.cloneNode());
        } else if (pattern) {
            mMedia.appendChild(pattern.cloneNode(true));
        }

        modal.classList.toggle('modal--portrait', card.classList.contains('project--tall'));
        mMeta.innerHTML = card.querySelector('.project__meta').innerHTML;
        mTitle.textContent = card.querySelector('.project__title').textContent;
        mChips.innerHTML = card.querySelector('.chips').innerHTML;
        mContent.replaceChildren(card.querySelector('.project__details').content.cloneNode(true));

        mLinks.replaceChildren();
        const store = card.querySelector('.project__store');
        if (store) {
            const a = store.cloneNode(true);
            a.className = 'btn btn--primary';
            mLinks.appendChild(a);
        }

        modalOpen = true;
        cardVideos.forEach((v) => v.pause());
        document.body.classList.add('modal-open');
        modal.showModal();
        modal.querySelector('.modal__panel').scrollTop = 0;

        const v = mMedia.querySelector('video');
        if (v && !reducedMotion.matches) tryPlay(v);
    }

    function closeModal() {
        if (!modal.open || modal.classList.contains('is-closing')) return;
        modal.classList.add('is-closing');
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            modal.classList.remove('is-closing');
            modal.close();
        };
        modal.addEventListener('animationend', finish, { once: true });
        setTimeout(finish, 320);
    }

    modal.addEventListener('close', () => {
        const v = mMedia.querySelector('video');
        if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
        mMedia.replaceChildren();
        document.body.classList.remove('modal-open');
        modalOpen = false;
        if (!reducedMotion.matches && !saveData) visibleVideos.forEach(tryPlay);
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    });

    // Esc — анімоване закриття
    modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });
    // Клік поза панеллю
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modal.querySelector('.modal__close').addEventListener('click', closeModal);

    document.querySelectorAll('.project__open').forEach((btn) => {
        btn.addEventListener('click', () => openModal(btn.closest('.project')));
    });
})();
