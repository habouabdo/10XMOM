(() => {
  const { api, el, fmtDate, waLink, prettyPhone } = window.tenx;
  const app = document.getElementById('admin-app');
  const HEART = 'M12 21s-7.6-4.7-9.7-9.4C.8 8.2 3 4.5 6.7 4.5c2.1 0 3.9 1.2 5.3 3 1.4-1.8 3.2-3 5.3-3 3.7 0 5.9 3.7 4.4 7.1C19.6 16.3 12 21 12 21z';
  const TABS = [['orders', 'Orders'], ['moms', 'Moms'], ['applications', 'Applications'], ['settings', 'Settings']];
  const STATUS = {
    booked: 'Booked',
    picked_up: 'Picked up',
    priced: 'Priced – awaiting payment',
    paid: 'Paid',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const ui = { tab: 'orders', filter: 'active', search: '' };
  let settings = null;
  let moms = [];

  // ---------- helpers ----------
  function heart() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'logo-heart');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', HEART);
    svg.append(path);
    return svg;
  }

  function toast(message) {
    const node = el('div', { class: 'toast', role: 'status' }, message);
    document.body.append(node);
    setTimeout(() => node.remove(), 2600);
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  // Shows an error inside `box`, or sends the user back to the login screen when the session expired.
  function showError(box, err) {
    if (err.status === 401) return renderLogin('Your session expired. Please log in again.');
    box.textContent = err.message;
    box.hidden = false;
  }

  const errorBox = () => el('p', { class: 'form-error', role: 'alert', hidden: true });
  const field = (label, input, hint) => el('div', { class: 'field' }, el('label', {}, label, hint ? el('span', { class: 'hint' }, ` ${hint}`) : null), input);
  const money = (n) => `$${Number(n).toFixed(2)}`;
  const firstName = (name) => name.split(/\s+/)[0];
  const siteUrl = () => settings.site_url || location.origin;

  // ---------- login & shell ----------
  function renderLogin(message = '') {
    const error = el('p', { class: 'form-error', role: 'alert', hidden: !message }, message);
    const form = el('form', {
      class: 'card',
      onsubmit: async (event) => {
        event.preventDefault();
        try {
          await api('/api/admin/login', { method: 'POST', body: { password: form.elements.password.value } });
          await boot();
        } catch (err) {
          error.textContent = err.message;
          error.hidden = false;
        }
      },
    },
      el('a', { class: 'logo', href: '/' }, '10x M', heart(), 'M'),
      el('h1', { class: 'h3' }, 'Admin login'),
      field('Password', el('input', { name: 'password', type: 'password', autocomplete: 'current-password', required: true })),
      error,
      el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Log in'));
    app.replaceChildren(el('div', { class: 'login-wrap' }, form));
    form.elements.password.focus();
  }

  async function boot() {
    try {
      [settings, { moms }] = await Promise.all([api('/api/admin/settings'), api('/api/admin/moms')]);
      renderShell();
    } catch (err) {
      if (err.status === 401) renderLogin();
      else app.replaceChildren(el('p', { class: 'form-error' }, err.message));
    }
  }

  function renderShell() {
    const main = el('main', { class: 'admin-main wrap' });
    app.replaceChildren(
      el('header', { class: 'admin-bar' }, el('div', { class: 'wrap' },
        el('a', { class: 'logo', href: '/' }, '10x M', heart(), 'M'),
        el('nav', { class: 'admin-tabs', 'aria-label': 'Admin sections' }, TABS.map(([key, label]) => el('button', {
          type: 'button', 'aria-current': ui.tab === key ? 'page' : null,
          onclick: () => { ui.tab = key; renderShell(); },
        }, label))),
        el('button', {
          class: 'logout', type: 'button',
          onclick: async () => { await api('/api/admin/logout', { method: 'POST', body: {} }).catch(() => {}); renderLogin(); },
        }, 'Log out'))),
      main);
    ({ orders: renderOrders, moms: renderMoms, applications: renderApplications, settings: renderSettings })[ui.tab](main);
  }

  // ---------- orders ----------
  function renderOrders(main) {
    const list = el('div', {}, el('p', { class: 'muted' }, 'Loading orders…'));
    const chips = el('div', { class: 'filter-chips' });
    const search = el('input', {
      type: 'search', placeholder: 'Search name, phone or code', value: ui.search, 'aria-label': 'Search orders',
      oninput: debounce(() => { ui.search = search.value.trim(); load(); }, 300),
    });
    main.replaceChildren(el('div', { class: 'admin-toolbar' }, chips, search), list);

    async function load() {
      try {
        const data = await api(`/api/admin/orders?${new URLSearchParams({ status: ui.filter, q: ui.search })}`);
        const activeCount = Object.entries(data.counts)
          .filter(([status]) => !['delivered', 'cancelled'].includes(status))
          .reduce((sum, [, n]) => sum + n, 0);
        const filters = [
          ['active', `Active (${activeCount})`],
          ...Object.entries(STATUS).map(([key, label]) => [key, `${label} (${data.counts[key] || 0})`]),
          ['all', 'All'],
        ];
        chips.replaceChildren(...filters.map(([key, label]) => el('button', {
          type: 'button', 'aria-pressed': String(ui.filter === key),
          onclick: () => { ui.filter = key; load(); },
        }, label)));
        list.replaceChildren(...(data.orders.length
          ? data.orders.map((order) => orderCard(order))
          : [el('div', { class: 'empty' }, 'No orders here yet.')]));
      } catch (err) {
        showError(list.appendChild(errorBox()), err);
      }
    }
    load();
  }

  function whatsappMessages(o) {
    const name = firstName(o.customer_name);
    const track = `${siteUrl()}/track?code=${o.code}`;
    return {
      confirm: `Hi ${name}! Your 10x MoM pickup is booked ✅\nOrder: ${o.code}\nPickup: ${fmtDate(o.pickup_date)}, ${o.pickup_slot}\nYour Mom: ${o.mom_name || 'to be confirmed'}\nTrack your order: ${track}`,
      price: `Hi ${name}, we've got your clothes 🧺\nOrder ${o.code} total: ${o.price_usd != null ? money(o.price_usd) : ''}\nPay securely with Whish: ${o.payment_link}\nWe deliver as soon as the payment comes through.\nTrack: ${track}`,
      delivery: `Hi ${name}, your fresh clothes are on the way! 🚗\nOrder ${o.code}`,
      thanks: `Thank you ${name}! Order ${o.code} has been delivered 💗\nBook your next pickup anytime: ${siteUrl()}/book`,
    };
  }

  function orderCard(o, open = false) {
    const msgs = whatsappMessages(o);
    const waButton = (label, message, enabled = true) => enabled
      ? el('a', { class: 'btn btn-wa', href: waLink(o.phone, message), target: '_blank', rel: 'noopener' }, label)
      : el('button', { class: 'btn btn-wa', type: 'button', disabled: true, title: 'Save the price and Whish link first' }, label);

    const statusSelect = el('select', { name: 'status' }, Object.entries(STATUS).map(([key, label]) => el('option', { value: key }, label)));
    statusSelect.value = o.status;
    const momSelect = el('select', { name: 'mom_id' },
      el('option', { value: '' }, 'Unassigned'),
      moms.map((m) => el('option', { value: String(m.id) }, m.active ? m.name : `${m.name} (inactive)`)));
    momSelect.value = o.mom_id ? String(o.mom_id) : '';
    const error = errorBox();

    const form = el('form', {
      onsubmit: async (event) => {
        event.preventDefault();
        const f = form.elements;
        try {
          const { order } = await api(`/api/admin/orders/${o.id}`, {
            method: 'PATCH',
            body: {
              status: f.status.value, mom_id: f.mom_id.value, price_usd: f.price_usd.value,
              payment_link: f.payment_link.value, note: f.note.value,
            },
          });
          details.replaceWith(orderCard(order, true));
          toast(`Order ${order.code} saved`);
        } catch (err) {
          showError(error, err);
        }
      },
    },
      el('div', { class: 'row-2' },
        field('Status', statusSelect),
        field('Mom', momSelect)),
      el('div', { class: 'row-2' },
        field('Price (USD)', el('input', { name: 'price_usd', type: 'number', min: '0', step: '0.5', value: o.price_usd ?? '' })),
        field('Whish payment link', el('input', { name: 'payment_link', type: 'url', placeholder: 'https://…', value: o.payment_link || '' }))),
      field('Internal note', el('input', { name: 'note', type: 'text', maxlength: '300', placeholder: 'Optional, saved in the history' })),
      el('p', { class: 'muted' }, 'Tip: saving a price and a Whish link on a picked-up order marks it "Priced – awaiting payment".'),
      error,
      el('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Save changes'));

    const details = el('details', { class: 'order', open },
      el('summary', {},
        el('div', { class: 'when' }, fmtDate(o.pickup_date), el('small', {}, o.pickup_slot)),
        el('div', { class: 'who' },
          el('strong', {}, o.customer_name), ` · ${o.code}`,
          el('small', {}, [o.area, o.mom_name || 'No Mom assigned', o.price_usd != null ? money(o.price_usd) : null].filter(Boolean).join(' · '))),
        el('span', { class: 'pill', dataset: { status: o.status } }, STATUS[o.status])),
      el('div', { class: 'order-body' },
        el('div', {},
          el('h3', {}, 'Customer & pickup'),
          el('dl', {},
            el('dt', {}, 'WhatsApp'), el('dd', {}, el('a', { href: waLink(o.phone), target: '_blank', rel: 'noopener' }, prettyPhone(o.phone))),
            el('dt', {}, 'Address'), el('dd', {}, `${o.address}, ${o.area}`),
            o.address_notes ? [el('dt', {}, 'Directions'), el('dd', {}, o.address_notes)] : null,
            el('dt', {}, 'Clothes'), el('dd', {}, o.items.length ? o.items.map((i) => `${i.qty} × ${i.type}`).join(', ') : '—'),
            o.notes ? [el('dt', {}, 'Notes'), el('dd', {}, o.notes)] : null,
            el('dt', {}, 'Booked'), el('dd', {}, `${o.created_at} UTC`)),
          el('div', { class: 'wa-actions' },
            waButton('Confirm booking', msgs.confirm),
            waButton('Send price + Whish link', msgs.price, o.price_usd != null && Boolean(o.payment_link)),
            waButton('On the way', msgs.delivery),
            waButton('Delivered, thanks', msgs.thanks)),
          el('ul', { class: 'events' }, o.events.map((e) => el('li', {}, `${e.created_at} – ${STATUS[e.status] || e.status}${e.note ? `: ${e.note}` : ''}`)))),
        el('div', {}, el('h3', {}, 'Update order'), form)));
    return details;
  }

  // ---------- moms ----------
  function renderMoms(main) {
    main.replaceChildren(
      el('h2', {}, 'Moms'),
      el('p', { class: 'muted' }, 'Customers only see active Moms who cover their area. Each Mom can take a limited number of pickups per time slot (see Settings).'),
      momForm(main, null),
      ...moms.map((mom) => momForm(main, mom)));
  }

  function momForm(main, mom) {
    const isNew = !mom;
    const m = mom || { name: '', phone: '', areas: [], bio: '', active: true };
    const error = errorBox();
    const form = el('form', {
      class: 'admin-card',
      onsubmit: async (event) => {
        event.preventDefault();
        const f = form.elements;
        const body = {
          name: f.name.value, phone: f.phone.value, bio: f.bio.value, active: f.active.checked,
          areas: [...form.querySelectorAll('input[name="area"]:checked')].map((i) => i.value),
        };
        try {
          ({ moms } = await api(isNew ? '/api/admin/moms' : `/api/admin/moms/${m.id}`, { method: isNew ? 'POST' : 'PATCH', body }));
          toast(isNew ? 'Mom added' : 'Mom saved');
          renderMoms(main);
        } catch (err) {
          showError(error, err);
        }
      },
    },
      el('h3', {}, isNew ? 'Add a Mom' : `${m.name}${m.open_orders ? ` · ${m.open_orders} open order${m.open_orders > 1 ? 's' : ''}` : ''}`),
      el('div', { class: 'row-2' },
        field('Name (shown to customers)', el('input', { name: 'name', type: 'text', maxlength: '60', required: true, value: m.name })),
        field('WhatsApp number', el('input', { name: 'phone', type: 'tel', value: m.phone ? prettyPhone(m.phone) : '' }), '(private)')),
      field('Short bio', el('textarea', { name: 'bio', maxlength: '300' }, m.bio)),
      el('div', { class: 'field' },
        el('span', { class: 'label' }, 'Areas she covers'),
        el('div', { class: 'area-checks' }, settings.areas.map((area) => el('label', {},
          el('input', { type: 'checkbox', name: 'area', value: area, checked: m.areas.includes(area) }), area)))),
      el('div', { class: 'field' }, el('label', { class: 'check' }, el('input', { type: 'checkbox', name: 'active', checked: m.active }), 'Active (visible for booking)')),
      error,
      el('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, isNew ? 'Add Mom' : 'Save'));
    return form;
  }

  // ---------- applications ----------
  async function renderApplications(main) {
    main.replaceChildren(el('h2', {}, 'Mom applications'), el('p', { class: 'muted' }, 'Loading…'));
    try {
      const { applications } = await api('/api/admin/applications');
      main.replaceChildren(el('h2', {}, 'Mom applications'), ...(applications.length ? applications.map((a) => {
        const error = errorBox();
        const select = el('select', {
          'aria-label': 'Application status',
          onchange: async () => {
            try {
              await api(`/api/admin/applications/${a.id}`, { method: 'PATCH', body: { status: select.value } });
              toast('Status saved');
            } catch (err) {
              showError(error, err);
            }
          },
        }, ['new', 'contacted', 'hired', 'rejected'].map((s) => el('option', { value: s }, s[0].toUpperCase() + s.slice(1))));
        select.value = a.status;
        return el('div', { class: 'admin-card' },
          el('h3', {}, a.name),
          el('p', {},
            el('a', { href: waLink(a.phone, `Hi ${firstName(a.name)}, thanks for applying to 10x MoM!`), target: '_blank', rel: 'noopener' }, prettyPhone(a.phone)),
            ` · ${a.area} · ${a.has_car ? 'Has a car' : 'No car'} · applied ${a.created_at} UTC`),
          a.experience ? el('p', { class: 'muted' }, a.experience) : null,
          field('Status', select),
          error);
      }) : [el('div', { class: 'empty' }, 'No applications yet.')]));
    } catch (err) {
      showError(main.appendChild(errorBox()), err);
    }
  }

  // ---------- settings ----------
  function renderSettings(main) {
    const error = errorBox();
    const listInput = (name, values, rows = 8) => el('textarea', { name, rows: String(rows) }, values.join('\n'));
    const lines = (value) => value.split('\n').map((v) => v.trim()).filter(Boolean);
    const form = el('form', {
      class: 'admin-card',
      onsubmit: async (event) => {
        event.preventDefault();
        error.hidden = true;
        const f = form.elements;
        try {
          settings = await api('/api/admin/settings', {
            method: 'PUT',
            body: {
              areas: lines(f.areas.value), slots: lines(f.slots.value), item_types: lines(f.item_types.value),
              slot_capacity: Number(f.slot_capacity.value), business_whatsapp: f.business_whatsapp.value,
              business_email: f.business_email.value, site_url: f.site_url.value,
            },
          });
          toast('Settings saved');
        } catch (err) {
          showError(error, err);
        }
      },
    },
      el('h3', {}, 'Business settings'),
      el('div', { class: 'row-2' },
        field('Business WhatsApp number', el('input', { name: 'business_whatsapp', type: 'tel', value: settings.business_whatsapp ? prettyPhone(settings.business_whatsapp) : '' }), '(shown on the site)'),
        field('Contact email', el('input', { name: 'business_email', type: 'email', value: settings.business_email }), '(optional)')),
      el('div', { class: 'row-2' },
        field('Website address', el('input', { name: 'site_url', type: 'url', placeholder: 'https://10xmom.com', value: settings.site_url }), '(used in WhatsApp links)'),
        field('Pickups per Mom per time slot', el('input', { name: 'slot_capacity', type: 'number', min: '1', max: '50', value: String(settings.slot_capacity) }))),
      el('div', { class: 'row-2' },
        field('Service areas', listInput('areas', settings.areas, 12), '(one per line)'),
        field('Pickup time slots', listInput('slots', settings.slots, 12), '(one per line, e.g. 09:00-11:00)')),
      field('Clothes types customers can choose', listInput('item_types', settings.item_types), '(one per line)'),
      error,
      el('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Save settings'));

    const pwError = errorBox();
    const pwForm = el('form', {
      class: 'admin-card',
      onsubmit: async (event) => {
        event.preventDefault();
        pwError.hidden = true;
        try {
          await api('/api/admin/password', { method: 'POST', body: { current: pwForm.elements.current.value, next: pwForm.elements.next.value } });
          pwForm.reset();
          toast('Password changed');
        } catch (err) {
          showError(pwError, err);
        }
      },
    },
      el('h3', {}, 'Change admin password'),
      el('div', { class: 'row-2' },
        field('Current password', el('input', { name: 'current', type: 'password', autocomplete: 'current-password', required: true })),
        field('New password', el('input', { name: 'next', type: 'password', autocomplete: 'new-password', minlength: '10', required: true }), '(min 10 characters)')),
      pwError,
      el('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Change password'));

    main.replaceChildren(form, pwForm);
  }

  boot();
})();
