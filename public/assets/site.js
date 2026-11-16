// Shared helpers for every page (exposed as window.tenx) plus header/footer behaviour.
(() => {
  async function api(url, { method = 'GET', body } = {}) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Something went wrong. Please try again.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // el('button', { class: 'btn', onclick }, 'Label') – tiny DOM builder, text is never parsed as HTML.
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (key in node && typeof value !== 'string') node[key] = value;
      else node.setAttribute(key, value === true ? '' : value);
    }
    node.append(...children.flat().filter((c) => c != null && c !== false));
    return node;
  }

  function fmtDate(iso, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
  }

  function addDays(iso, days) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  }

  const waLink = (phone, message = '') => `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  function prettyPhone(phone) {
    const local = String(phone).replace(/^961/, '');
    return `+961 ${local.length === 7 ? `0${local[0]} ${local.slice(1, 4)} ${local.slice(4)}` : `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`}`;
  }

  let configPromise;
  const config = () => (configPromise ||= api('/api/config'));

  window.tenx = { api, el, fmtDate, addDays, waLink, prettyPhone, config };

  // Header: mobile menu + current page.
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  const here = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.site-nav a').forEach((a) => {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });

  document.querySelectorAll('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });

  // Contact details and service areas come from Admin → Settings.
  const needsConfig = document.querySelector('[data-wa], [data-email], [data-areas]');
  if (needsConfig) {
    config().then((cfg) => {
      document.querySelectorAll('[data-wa]').forEach((a) => {
        if (!cfg.business_whatsapp) return;
        a.href = waLink(cfg.business_whatsapp, a.dataset.wa || 'Hi 10x MoM!');
        a.target = '_blank';
        a.rel = 'noopener';
        a.hidden = false;
      });
      document.querySelectorAll('[data-email]').forEach((n) => {
        if (!cfg.business_email) return;
        n.replaceChildren(el('a', { href: `mailto:${cfg.business_email}`, class: 'inherit-link' }, cfg.business_email));
        n.hidden = false;
      });
      document.querySelectorAll('[data-areas]').forEach((list) => {
        list.replaceChildren(...cfg.areas.map((area) => el('li', {}, area)));
      });
    }).catch(() => {});
  }
})();
