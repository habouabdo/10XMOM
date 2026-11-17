(() => {
  const { api, el, fmtDate } = window.tenx;
  const form = document.getElementById('track-form');
  const errorBox = document.getElementById('track-error');
  const result = document.getElementById('track-result');
  const FLOW = [
    ['booked', 'Booked'],
    ['picked_up', 'Picked up by your Mom'],
    ['priced', 'Priced & Whish link sent'],
    ['paid', 'Paid'],
    ['out_for_delivery', 'Out for delivery'],
    ['delivered', 'Delivered'],
  ];

  const when = (sqlDate) => new Date(`${sqlDate.replace(' ', 'T')}Z`).toLocaleString('en-GB', {
    timeZone: 'Asia/Beirut', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  function render(order) {
    const current = FLOW.findIndex(([key]) => key === order.status);
    const reached = Object.fromEntries(order.events.map((e) => [e.status, e.created_at]));
    const timeline = el('ul', { class: 'timeline' }, FLOW.map(([key, label], i) => el('li', {
      class: i < current ? 'done' : i === current ? 'current' : '',
    }, label, reached[key] ? el('small', {}, when(reached[key])) : null)));

    const payBox = order.status === 'priced' && order.payment_link
      ? el('div', { class: 'pay-box' },
          el('div', { class: 'muted' }, 'Amount to pay'),
          el('div', { class: 'amount' }, `$${Number(order.price_usd).toFixed(2)}`),
          el('a', { class: 'btn btn-primary', href: order.payment_link, target: '_blank', rel: 'noopener' }, 'Pay with Whish'),
          el('p', { class: 'muted mb-0' }, 'We deliver your clothes as soon as the payment comes through.'))
      : null;

    result.replaceChildren(el('div', { class: 'track-grid' },
      el('div', { class: 'card' },
        el('h2', { class: 'h3' }, `Hi ${order.first_name}!`),
        el('p', {}, el('span', { class: 'pill', dataset: { status: order.status } }, order.status_label)),
        order.status === 'cancelled'
          ? el('p', { class: 'muted' }, 'This order was cancelled. Message us on WhatsApp if this is a mistake.')
          : timeline,
        payBox),
      el('div', { class: 'card' },
        el('h2', { class: 'h3' }, `Order ${order.code}`),
        el('ul', { class: 'summary' },
          el('li', {}, el('span', {}, 'Pickup'), el('span', {}, `${fmtDate(order.pickup_date)}, ${order.pickup_slot.replace('-', ' – ')}`)),
          el('li', {}, el('span', {}, 'Area'), el('span', {}, order.area)),
          el('li', {}, el('span', {}, 'Your Mom'), el('span', {}, order.mom_name || 'Being assigned')),
          el('li', {}, el('span', {}, 'Price'), el('span', {}, order.price_usd != null ? `$${Number(order.price_usd).toFixed(2)}` : 'After pickup'))),
        order.items.length
          ? el('p', { class: 'muted mb-0' }, order.items.map((i) => `${i.qty} × ${i.type}`).join(' · '))
          : null)));
  }

  async function track() {
    errorBox.hidden = true;
    const params = new URLSearchParams({ code: form.elements.code.value.trim(), phone: form.elements.phone.value });
    try {
      render(await api(`/api/track?${params}`));
    } catch (err) {
      result.replaceChildren();
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.elements.code.value.trim() || !form.elements.phone.value.trim()) {
      errorBox.textContent = 'Please enter your order code and WhatsApp number.';
      errorBox.hidden = false;
      return;
    }
    track();
  });

  const code = new URLSearchParams(location.search).get('code');
  if (code) {
    form.elements.code.value = code;
    form.elements.phone.focus();
  }
})();
