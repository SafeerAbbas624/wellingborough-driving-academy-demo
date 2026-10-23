// Wellingborough Driving Academy — concept homepage v2 behaviour.
// Everything enhances content that already works without script.

const EMAIL = 'info@wellingboroughdrivingacademy.com';
const money = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

// Nav shadow once the page moves; phone action bar after the hero, away while the booking form is on screen.
(() => {
  const nav = document.querySelector('[data-nav]');
  const bar = document.querySelector('[data-actionbar]');
  const hero = document.querySelector('.hero');
  const book = document.querySelector('#book');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (bar && hero && book && 'IntersectionObserver' in window) {
    let inHero = true, inBook = false;
    const sync = () => bar.classList.toggle('is-on', !inHero && !inBook);
    new IntersectionObserver(([e]) => { inHero = e.isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(([e]) => { inBook = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -30% 0px' }).observe(book);
  }
})();

// Full-screen menu on smaller screens.
(() => {
  const btn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');
  if (!btn || !menu) return;
  const set = (open, viaKeyboard = false) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open && viaKeyboard) menu.querySelector('a')?.focus();
  };
  btn.addEventListener('click', (ev) => set(menu.hidden, ev.detail === 0));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
  matchMedia('(min-width: 1081px)').addEventListener('change', (m) => { if (m.matches) set(false); });
})();

// Swipe rows: dots that follow the scroll and jump on tap.
(() => {
  document.querySelectorAll('[data-swipe]').forEach((row) => {
    const dots = document.querySelector(`[data-dots-for="${row.dataset.swipe}"]`);
    if (!dots) return;
    const items = [...row.children];
    // On phones the featured plan is shown first (CSS order), so list items in visual order.
    const ordered = () => [...items].sort((a, b) => a.offsetLeft - b.offsetLeft);
    items.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button'; d.tabIndex = -1;
      d.addEventListener('click', () => {
        const target = ordered()[i];
        row.scrollTo({ left: target.offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
      });
      dots.appendChild(d);
    });
    const update = () => {
      const list = ordered();
      const center = row.scrollLeft + row.clientWidth / 2;
      let best = 0, dist = Infinity;
      list.forEach((el, i) => { const c = el.offsetLeft - row.offsetLeft + el.offsetWidth / 2; const d = Math.abs(c - center); if (d < dist) { dist = d; best = i; } });
      [...dots.children].forEach((d, i) => d.classList.toggle('is-on', i === best));
    };
    row.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
    update();
  });
})();

// Reveal once on entry, staggered within each group.
(() => {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!('IntersectionObserver' in window) || reduce) { targets.forEach((el) => el.classList.add('is-in')); return; }
  targets.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 80}ms`;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// 3D tilt on cards (mouse only).
(() => {
  if (!finePointer || reduce) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      if (!card.classList.contains('is-in')) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transitionDelay = '0ms';
        card.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
      });
    });
    card.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); card.style.transform = ''; });
  });
})();

// The lesson planner, from the published prices.
(() => {
  const form = document.querySelector('[data-planner]');
  if (!form) return;
  const $ = (s) => form.querySelector(s);
  const hours = $('[data-hours]');
  const RATES = { weekday: 45, evening: 48.95 };

  const update = () => {
    const h = Number(hours.value);
    const when = form.querySelector('input[name=when]:checked').value;
    const car = form.querySelector('input[name=car]:checked').value;
    const free = Math.floor(h / 11);            // buy ten, the eleventh is free
    const paid = h - free;
    const rate = RATES[when];
    const total = paid * rate;
    hours.style.setProperty('--fill', `${((h - hours.min) / (hours.max - hours.min)) * 100}%`);
    $('[data-hours-out]').textContent = `${h} ${h === 1 ? 'hour' : 'hours'}`;
    $('[data-total]').textContent = money(total);
    $('[data-paid]').textContent = `${paid} × ${money(rate)}`;
    $('[data-free]').textContent = free ? `${free}` : 'Book 11 for 1 free';
    $('[data-save]').textContent = money(free * rate);
    $('[data-meter-paid]').style.flexBasis = `${(paid / h) * 100}%`;
    $('[data-meter-free]').style.flexBasis = `${(free / h) * 100}%`;
    $('[data-live-hours]').textContent = `${h} ${h === 1 ? 'hour' : 'hours'} · ${when === 'weekday' ? 'weekdays' : 'eves & weekends'}`;
    $('[data-live-total]').textContent = money(total);
    const whenText = when === 'weekday' ? 'weekdays' : 'evenings and weekends';
    const body = `Hello,\n\nI'd like to book driving lessons.\n\nHours: ${h}\nWhen: ${whenText}\nCar: ${car}\nEstimate from your website: ${money(total)}\n\nMy name:\nMy phone number:\n\nThank you.`;
    $('[data-plan-mail]').href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Lesson plan: ${h} hours, ${car}`)}&body=${encodeURIComponent(body)}`;
  };
  form.addEventListener('input', update);
  form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    hours.value = Math.min(+hours.max, Math.max(+hours.min, +hours.value + +b.dataset.step));
    update();
  }));
  form.addEventListener('submit', (e) => { e.preventDefault(); location.href = $('[data-plan-mail]').href; });
  update();
})();

// 3D drop gallery: photos fall from above and land in a stack as you scroll.
(() => {
  const section = document.querySelector('[data-drop]');
  if (!section) return;
  const cards = [...section.querySelectorAll('.dcard')];
  const desktop = matchMedia('(min-width: 861px)');
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let ticking = false;

  const render = () => {
    ticking = false;
    const r = section.getBoundingClientRect();
    const progress = desktop.matches
      ? clamp(-r.top / (r.height - innerHeight))
      : clamp((innerHeight - r.top) / (r.height + innerHeight * 0.2));
    cards.forEach((card, i) => {
      const start = i * 0.13, span = desktop.matches ? 0.32 : 0.4;
      const t = reduce ? 1 : ease(clamp((progress - start) / span));
      const y = (1 - t) * -115;                 // vh above
      const rx = (1 - t) * 68;                  // tipped back
      const rz = (1 - t) * (i % 2 ? 22 : -22);
      const s = 1 + (1 - t) * 0.25;
      card.style.transform = `translate(-50%, -50%) translate(calc(var(--x) * var(--spread, 1)), var(--y)) translateY(${y}vh) rotateX(${rx}deg) rotate(calc(var(--r) + ${rz}deg)) scale(${s})`;
      card.style.opacity = String(Math.min(1, t * 2.2));
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  render();
})();

// Booking form: validate, then open an email with the details filled in.
(() => {
  const form = document.querySelector('[data-coupon]');
  if (!form) return;
  const error = form.querySelector('[data-coupon-error]');
  const name = form.elements.name, phone = form.elements.phone;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = [name, phone].filter((f) => !f.value.trim());
    [name, phone].forEach((f) => f.setAttribute('aria-invalid', String(missing.includes(f))));
    if (missing.length) { error.hidden = false; missing[0].focus(); return; }
    error.hidden = true;
    const body = `Hello,\n\nI'd like to book my first driving lesson.\n\nName: ${name.value.trim()}\nPhone: ${phone.value.trim()}\nEmail: ${form.elements.email.value.trim() || '-'}\nCar: ${form.elements.car.value}\n\nPlease call me back to arrange a time.`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Booking request: first lesson')}&body=${encodeURIComponent(body)}`;
  });
})();
