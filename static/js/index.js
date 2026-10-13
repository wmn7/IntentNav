(() => {
  const players = new Map();
  const filterButtons = [...document.querySelectorAll('[data-demo-filter]')];
  const demoCards = [...document.querySelectorAll('[data-demo-kind]')];
  let youtubeAPI;

  function loadYouTubeAPI() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeAPI) return youtubeAPI;

    youtubeAPI = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.addEventListener('error', () => {
        script.remove();
        youtubeAPI = null;
        reject(new Error('YouTube player API could not be loaded.'));
      }, { once: true });
      document.head.append(script);
    });
    return youtubeAPI;
  }

  function pauseOtherPlayers(activePlayer) {
    players.forEach((record) => {
      if (record.ready && record.player !== activePlayer) record.player.pauseVideo();
    });
  }

  function ensurePlayer(iframe) {
    if (players.has(iframe)) return players.get(iframe);

    const record = { player: null, ready: false, seekRequest: 0 };
    players.set(iframe, record);
    record.loaded = loadYouTubeAPI().then((YT) => new Promise((resolve) => {
      const url = new URL(iframe.src);
      url.searchParams.set('enablejsapi', '1');
      url.searchParams.set('origin', window.location.origin);
      iframe.src = url.toString();
      record.player = new YT.Player(iframe, {
        events: {
          onReady(event) {
            record.player = event.target;
            record.ready = true;
            if (iframe.closest('[data-demo-kind]')?.hidden) record.player.pauseVideo();
            resolve(record.player);
          },
          onStateChange(event) {
            if (event.data !== YT.PlayerState.PLAYING) return;
            if (iframe.closest('[data-demo-kind]')?.hidden) {
              event.target.pauseVideo();
            } else {
              pauseOtherPlayers(event.target);
            }
          }
        }
      });
    })).catch((error) => {
      players.delete(iframe);
      console.warn(error.message);
      return null;
    });
    return record;
  }

  async function seekVideo(iframe, time) {
    const record = ensurePlayer(iframe);
    const request = ++record.seekRequest;
    const player = await record.loaded;
    if (!player || request !== record.seekRequest) return;
    pauseOtherPlayers(player);
    player.seekTo(time, true);
    player.playVideo();
  }

  function initPlayers() {
    const iframes = document.querySelectorAll('iframe[src^="https://www.youtube.com/embed/"]');
    if (!('IntersectionObserver' in window)) {
      iframes.forEach(ensurePlayer);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        ensurePlayer(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '200px' });
    iframes.forEach((iframe) => observer.observe(iframe));
  }

  function setActiveDemo(filter) {
    filterButtons.forEach((button) => {
      const active = button.dataset.demoFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    demoCards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.demoKind === filter;
      if (!visible) {
        card.querySelectorAll('iframe').forEach((iframe) => {
          const record = players.get(iframe);
          if (record?.ready) record.player.pauseVideo();
        });
      }
      card.hidden = !visible;
    });
  }

  function initNavigation() {
    const burger = document.querySelector('.navbar-burger');
    const menu = document.getElementById(burger?.getAttribute('aria-controls'));
    if (!burger || !menu) return;

    function setExpanded(expanded) {
      burger.classList.toggle('is-active', expanded);
      menu.classList.toggle('is-active', expanded);
      burger.setAttribute('aria-expanded', String(expanded));
    }

    burger.addEventListener('click', () => {
      setExpanded(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a[href^="#"]')) setExpanded(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setExpanded(false);
        burger.focus();
      }
    });
  }

  function initStoryboards() {
    const modal = document.getElementById('storyboard-modal');
    const modalContent = modal?.querySelector('.storyboard-modal-content');
    const modalImage = document.getElementById('storyboard-modal-image');
    const modalClose = modal?.querySelector('.storyboard-modal-close');
    let previousFocus;

    document.querySelectorAll('.storyboard-frame').forEach((frame) => {
      frame.querySelector('.storyboard-seek')?.addEventListener('click', () => {
        const target = document.getElementById(frame.dataset.targetVideo);
        const time = Number(frame.dataset.time);
        if (target && Number.isFinite(time)) seekVideo(target, Math.max(0, time));
      });

      frame.querySelector('.storyboard-zoom')?.addEventListener('click', () => {
        const image = frame.querySelector('.storyboard-image img');
        if (!modal || !modalContent || !modalImage || !image) return;
        modalImage.src = image.src;
        modalImage.alt = image.alt;
        modalContent.classList.add('has-image');
        previousFocus = document.activeElement;
        modal.showModal();
        document.documentElement.classList.add('has-modal');
      });
    });

    modalClose?.addEventListener('click', () => modal.close());
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
    modal?.addEventListener('close', () => {
      document.documentElement.classList.remove('has-modal');
      previousFocus?.focus();
    });
  }

  initNavigation();
  initStoryboards();
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveDemo(button.dataset.demoFilter));
  });
  setActiveDemo('wheel');
  initPlayers();
})();
