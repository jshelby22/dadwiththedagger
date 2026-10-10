'use strict';
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (menu && navigation) {
  const setMenuOpen = open => {
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    menu.querySelector('span').textContent = open ? '−' : '+';
  };
  menu.hidden = false;
  document.documentElement.classList.add('js-ready');
  menu.addEventListener('click', () => setMenuOpen(menu.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menu.focus();
    }
  });
}

for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const status = button.closest('.affiliate-card').querySelector('[role="status"]');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.copy);
      status.textContent = `Code copied: ${button.dataset.copy}`;
    } catch {
      status.textContent = `Select and copy ${button.dataset.copy} above.`;
    }
  });
}

for (const button of document.querySelectorAll('[data-print]')) {
  button.hidden = false;
  button.addEventListener('click', () => window.print());
}

const comparison = document.querySelector('[data-comparison]');
if (comparison) {
  const control = comparison.querySelector('[data-comparison-control]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let value = 50;
  let animationId = 0;
  let played = false;
  let interacted = false;
  let dragging = false;
  const setValue = next => {
    value = Math.max(0, Math.min(100, Math.round(next * 10) / 10));
    comparison.style.setProperty('--reveal', `${value}%`);
    control.setAttribute('aria-valuenow', String(Math.round(value)));
    control.setAttribute('aria-valuetext', `${Math.round(value)}% before photo shown`);
  };
  const interrupt = () => {
    interacted = true;
    played = true;
    if (animationId) cancelAnimationFrame(animationId);
    animationId = 0;
    comparison.classList.add('is-interacted');
  };
  const positionFromPointer = event => {
    const rect = comparison.getBoundingClientRect();
    setValue((event.clientX - rect.left) / rect.width * 100);
  };
  control.hidden = false;
  comparison.classList.add('is-ready');
  setValue(motion.matches ? 50 : 80);
  control.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    interrupt();
    dragging = true;
    control.setPointerCapture(event.pointerId);
    positionFromPointer(event);
    event.preventDefault();
  });
  control.addEventListener('pointermove', event => {
    if (dragging) positionFromPointer(event);
  });
  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
  };
  control.addEventListener('pointerup', endDrag);
  control.addEventListener('pointercancel', endDrag);
  control.addEventListener('keydown', event => {
    const changes = {ArrowLeft: value - 5, ArrowDown: value - 5, ArrowRight: value + 5, ArrowUp: value + 5, Home: 0, End: 100};
    if (!(event.key in changes)) return;
    event.preventDefault();
    interrupt();
    setValue(changes[event.key]);
  });
  const animateOnce = () => {
    if (played || interacted) return;
    played = true;
    if (motion.matches) { setValue(50); return; }
    let started;
    const tick = time => {
      if (interacted) return;
      if (started === undefined) started = time;
      const progress = Math.min(1, (time - started) / 1500);
      setValue(80 - 30 * (1 - (1 - progress) ** 3));
      if (progress < 1) animationId = requestAnimationFrame(tick);
      else animationId = 0;
    };
    animationId = requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        animateOnce();
      }
    }, {threshold:0.1});
    observer.observe(comparison);
  } else animateOnce();
  motion.addEventListener('change', event => {
    if (event.matches && !interacted) {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = 0;
      played = true;
      setValue(50);
    }
  });
}
