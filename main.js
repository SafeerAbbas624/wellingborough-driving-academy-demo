// Wellingborough Driving Academy — concept homepage behaviour.
// Everything here enhances content that already works without script.

const EMAIL = 'info@wellingboroughdrivingacademy.com';
const money = (n) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Reveal once on entry; never leaves content hidden.
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
  // Stagger the menu rows.
  document.querySelectorAll('.menu .item').forEach((el, i) => { el.style.transitionDelay = `${Math.min(i, 9) * 70}ms`; });
})();

// The sign leaves a stub behind once the hero has scrolled away.
(() => {
  const sign = document.querySelector('[data-sign]');
  const stub = document.querySelector('[data-stub]');
  if (!sign || !stub || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => stub.classList.toggle('is-on', !e.isIntersecting), { threshold: 0 }).observe(sign);
  // Tuck it away where the number is already on screen or large text runs along the bottom edge.
  const tuckers = document.querySelectorAll('#steps, #book, .back');
  const near = new Set();
  const tio = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? near.add(e.target) : near.delete(e.target)));
    stub.classList.toggle('is-tucked', near.size > 0);
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  tuckers.forEach((el) => tio.observe(el));
})();

// Live thing: the lesson planner, from the published prices.
(() => {
  const form = document.querySelector('[data-planner]');
  if (!form) return;
  const hours = form.querySelector('[data-hours]');
  const hoursOut = form.querySelector('[data-hours-out]');
  const total = form.querySelector('[data-total]');
  const detail = form.querySelector('[data-detail]');
  const mail = form.querySelector('[data-plan-mail]');
  const RATES = { weekday: 45, evening: 48.95 };

  const update = () => {
    const h = Number(hours.value);
    const when = form.querySelector('input[name=when]:checked').value;
    const car = form.querySelector('input[name=car]:checked').value;
    const free = Math.floor(h / 11);              // buy ten, the eleventh is free
    const paid = h - free;
    const rate = RATES[when];
    const sum = paid * rate;
    hoursOut.textContent = `${h} ${h === 1 ? 'hour' : 'hours'}`;
    total.textContent = money(sum);
    detail.textContent = free
      ? `${h} hours, of which ${free} ${free === 1 ? 'is' : 'are'} free with block booking. ${paid} paid hours at ${money(rate)}.`
      : `${h} ${h === 1 ? 'hour' : 'hours'} at ${money(rate)}. Book eleven and one of them is free.`;
    const whenText = when === 'weekday' ? 'weekdays' : 'evenings and weekends';
    const body = `Hello,\n\nI'd like to book driving lessons.\n\nHours: ${h}\nWhen: ${whenText}\nCar: ${car}\nEstimate from your website: ${money(sum)}\n\nMy name:\nMy phone number:\n\nThank you.`;
    mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Lesson plan: ${h} hours, ${car}`)}&body=${encodeURIComponent(body)}`;
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => { e.preventDefault(); location.href = mail.href; });
  update();
})();

// Pinned story: the car picture follows the caption in the middle of the screen.
(() => {
  const steps = [...document.querySelectorAll('[data-car-step]')];
  const pics = [...document.querySelectorAll('[data-car]')];
  const caption = document.querySelector('[data-cars-caption]');
  if (!steps.length || !('IntersectionObserver' in window)) { steps.forEach((s) => s.classList.add('is-on')); return; }
  const show = (i) => {
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    pics.forEach((p, k) => p.classList.toggle('is-on', k === i));
    caption.textContent = steps[i].querySelector('.car__name').textContent;
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) show(steps.indexOf(e.target)); });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach((s) => io.observe(s));
  show(0);
})();

// The drag row: progress bar, buttons, and mouse dragging.
(() => {
  const row = document.querySelector('[data-steps-row]');
  if (!row) return;
  const bar = document.querySelector('[data-steps-progress]');
  const step = () => (row.querySelector('.step')?.getBoundingClientRect().width || 300) + 32;
  const progress = () => {
    const max = row.scrollWidth - row.clientWidth;
    const visible = row.clientWidth / row.scrollWidth;
    bar.style.width = `${Math.min(100, (visible + (max > 0 ? row.scrollLeft / max : 1) * (1 - visible)) * 100)}%`;
  };
  row.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  progress();
  document.querySelector('[data-steps-prev]')?.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
  document.querySelector('[data-steps-next]')?.addEventListener('click', () => row.scrollBy({ left: step(), behavior: 'smooth' }));

  let down = false, startX = 0, startLeft = 0, moved = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('a')) return;
    down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft;
    row.style.scrollSnapType = 'none'; row.style.cursor = 'grabbing'; row.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true;
    row.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false; row.style.cursor = ''; row.style.scrollSnapType = ''; row.classList.remove('is-dragging');
  });
  row.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  row.querySelectorAll('img').forEach((img) => img.setAttribute('draggable', 'false'));
})();

// Booking coupon: validate, then open an email with the details filled in.
(() => {
  const form = document.querySelector('[data-coupon]');
  if (!form) return;
  const error = form.querySelector('[data-coupon-error]');
  const name = form.elements.name, phone = form.elements.phone;
  form.noValidate = true;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = [name, phone].filter((f) => !f.value.trim());
    [name, phone].forEach((f) => f.setAttribute('aria-invalid', String(missing.includes(f))));
    if (missing.length) { error.hidden = false; missing[0].focus(); return; }
    error.hidden = true;
    const body = `Hello,\n\nI'd like to book my first driving lesson.\n\nName: ${name.value.trim()}\nPhone: ${phone.value.trim()}\nEmail: ${form.elements.email.value.trim() || '-'}\nCar: ${form.elements.car.value}\n\nPlease call me back to arrange a time.`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Booking request: first lesson')}&body=${encodeURIComponent(body)}`;
  });

  // Keep the side notches on the perforation when the coupon stacks on a phone.
  const left = form.querySelector('.coupon__left');
  const place = () => form.style.setProperty('--notch', `${left.offsetHeight}px`);
  window.addEventListener('resize', place); place();
})();
