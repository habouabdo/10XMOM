(() => {
  const { api, el, fmtDate, addDays, waLink, config } = window.tenx;
  const form = document.getElementById('book-form');
  const steps = [...form.querySelectorAll('.step')];
  const stepperItems = [...document.querySelectorAll('.stepper li')];
  const errorBox = document.getElementById('book-error');
  const backBtn = document.getElementById('back-btn');
  const nextBtn = document.getElementById('next-btn');
  const LAST = steps.length - 1;

  const state = { step: 0, momsArea: '', moms: [], momId: 'any', date: '', slot: '', slots: [], items: {} };
  let cfg;

  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  };

  function dayLabel(date) {
    if (date === cfg.today) return 'Today';
    if (date === addDays(cfg.today, 1)) return 'Tomorrow';
    return fmtDate(date, { weekday: 'short' });
  }

  // ---------- step 1: moms ----------
  async function loadMoms() {
    const area = form.elements.area.value;
    document.querySelector('[data-area-name]').textContent = area;
    if (state.momsArea === area) return;
    const list = document.getElementById('mom-list');
    list.replaceChildren(el('p', { class: 'muted' }, 'Loading Moms…'));
    const { moms } = await api(`/api/moms?area=${encodeURIComponent(area)}`);
    state.momsArea = area;
    state.moms = moms;
    if (!moms.some((m) => String(m.id) === state.momId)) state.momId = 'any';
    state.slot = '';
    renderMoms();
  }

  function renderMoms() {
    const list = document.getElementById('mom-list');
    if (!state.moms.length) {
      list.replaceChildren(el('div', { class: 'empty' }, 'No Moms cover this area yet. Message us on WhatsApp and we will try to help.'));
      return;
    }
    const option = (id, title, text, avatar) => el('label', { class: 'choice' },
      el('input', {
        type: 'radio', name: 'mom', value: id, checked: state.momId === id,
        onchange: () => { state.momId = id; state.slot = ''; },
      }),
      avatar,
      el('div', {}, el('strong', {}, title), el('span', {}, text)));
    list.replaceChildren(
      option('any', 'Any available Mom', 'Fastest option: whoever is free at your time.',
        el('span', { class: 'avatar', dataset: { tone: '3' }, 'aria-hidden': 'true' }, '★')),
      ...state.moms.map((mom, i) => option(String(mom.id), mom.name, mom.bio || 'Covers your area.',
        el('span', { class: 'avatar', dataset: { tone: String(i % 3) }, 'aria-hidden': 'true' },
          mom.name.replace(/^Mom\s+/i, '').charAt(0).toUpperCase())))
    );
  }

  // ---------- step 2: date & slot ----------
  function renderDates() {
    const days = Array.from({ length: cfg.booking_days + 1 }, (_, i) => addDays(cfg.today, i));
    document.getElementById('date-list').replaceChildren(...days.map((date) => el('button', {
      type: 'button', class: 'chip', 'aria-pressed': String(state.date === date),
      onclick: () => { state.date = date; state.slot = ''; renderDates(); loadSlots(); },
    }, dayLabel(date), el('small', {}, fmtDate(date, { day: 'numeric', month: 'short' })))));
  }

  async function loadSlots() {
    const list = document.getElementById('slot-list');
    if (!state.date) {
      list.replaceChildren(el('p', { class: 'muted' }, 'Choose a day to see the free times.'));
      return;
    }
    list.replaceChildren(el('p', { class: 'muted' }, 'Checking availability…'));
    const params = new URLSearchParams({ area: form.elements.area.value, date: state.date, mom_id: state.momId });
    try {
      const { slots } = await api(`/api/availability?${params}`);
      state.slots = slots;
      if (!slots.some((s) => s.slot === state.slot && s.available)) state.slot = '';
      renderSlots();
    } catch (err) {
      list.replaceChildren(el('p', { class: 'form-error' }, err.message));
    }
  }

  function renderSlots() {
    const list = document.getElementById('slot-list');
    if (!state.slots.some((s) => s.available)) {
      list.replaceChildren(el('div', { class: 'empty' }, 'No free times on this day. Please try another day or choose "Any available Mom".'));
      return;
    }
    list.replaceChildren(...state.slots.map(({ slot, available }) => el('button', {
      type: 'button', class: 'chip', disabled: !available, 'aria-pressed': String(state.slot === slot),
      onclick: () => { state.slot = slot; renderSlots(); },
    }, slot.replace('-', ' – '))));
  }

  // ---------- step 3: items ----------
  function renderItems() {
    document.getElementById('item-list').replaceChildren(...cfg.item_types.map((type) => {
      const qty = state.items[type] || 0;
      const change = (delta) => {
        state.items[type] = Math.max(0, Math.min(99, (state.items[type] || 0) + delta));
        renderItems();
      };
      return el('div', { class: `item-row${qty ? ' has-qty' : ''}` },
        el('span', {}, type),
        el('div', { class: 'qty' },
          el('button', { type: 'button', 'aria-label': `Fewer ${type}`, onclick: () => change(-1) }, '−'),
          el('output', { 'aria-live': 'polite' }, String(qty)),
          el('button', { type: 'button', 'aria-label': `More ${type}`, onclick: () => change(1) }, '+')));
    }));
  }

  const chosenItems = () => Object.entries(state.items).filter(([, qty]) => qty > 0).map(([type, qty]) => ({ type, qty }));

  // ---------- step 4: summary ----------
  function renderSummary() {
    const mom = state.moms.find((m) => String(m.id) === state.momId);
    const items = chosenItems();
    const row = (label, value) => el('li', {}, el('span', {}, label), el('span', {}, value));
    document.getElementById('summary').replaceChildren(
      row('Pickup', `${fmtDate(state.date)}, ${state.slot.replace('-', ' – ')}`),
      row('Address', `${form.elements.address.value.trim()}, ${form.elements.area.value}`),
      row('Your Mom', mom ? mom.name : 'Any available Mom'),
      row('Clothes', items.length ? items.map((i) => `${i.qty} × ${i.type}`).join(', ') : 'See notes'),
      row('Payment', 'After pricing, via Whish'),
    );
  }

  // ---------- navigation ----------
  function validate(step) {
    const f = form.elements;
    if (step === 0) {
      if (!f.area.value) return 'Please choose your area.';
      if (!f.address.value.trim()) return 'Please enter your pickup address.';
    }
    if (step === 1 && !state.moms.length) return 'No Moms cover this area yet. Please message us on WhatsApp.';
    if (step === 2 && (!state.date || !state.slot)) return 'Please choose a pickup day and time.';
    if (step === 3 && !chosenItems().length && !f.notes.value.trim()) return 'Add at least one item, or describe what we are picking up in the notes.';
    if (step === 4) {
      if (!f.name.value.trim()) return 'Please enter your name.';
      if (f.phone.value.replace(/\D/g, '').length < 7) return 'Please enter your WhatsApp number, e.g. 03 123 456.';
    }
    return '';
  }

  async function showStep(step, { focus = true } = {}) {
    state.step = step;
    steps.forEach((section, i) => { section.hidden = i !== step; });
    stepperItems.forEach((li, i) => {
      li.classList.toggle('done', i < step);
      li.classList.toggle('current', i === step);
    });
    backBtn.hidden = step === 0;
    nextBtn.textContent = step === LAST ? 'Confirm booking' : 'Continue';
    showError('');
    try {
      if (step === 1) await loadMoms();
      if (step === 2) { renderDates(); await loadSlots(); }
      if (step === 4) renderSummary();
    } catch (err) {
      showError(err.message);
    }
    if (!focus) return;
    steps[step].querySelector('h2').focus({ preventScroll: true });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submit() {
    const f = form.elements;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Booking…';
    try {
      const order = await api('/api/orders', {
        method: 'POST',
        body: {
          name: f.name.value, phone: f.phone.value, area: f.area.value,
          address: f.address.value, address_notes: f.address_notes.value,
          mom_id: state.momId, pickup_date: state.date, pickup_slot: state.slot,
          items: chosenItems(), notes: f.notes.value,
        },
      });
      showDone(order);
    } catch (err) {
      if (err.status === 409) {
        state.slot = '';
        await showStep(2);
      }
      showError(err.message);
    } finally {
      nextBtn.disabled = false;
      nextBtn.textContent = state.step === LAST ? 'Confirm booking' : 'Continue';
    }
  }

  function showDone(order) {
    form.hidden = true;
    document.querySelector('.stepper').hidden = true;
    const done = document.getElementById('book-done');
    document.getElementById('done-code').textContent = order.code;
    document.getElementById('done-text').textContent =
      `${order.mom_name} will pick up on ${fmtDate(order.pickup_date)} between ${order.pickup_slot.replace('-', ' and ')}. We'll confirm on WhatsApp.`;
    document.getElementById('done-track').href = `/track?code=${encodeURIComponent(order.code)}`;
    if (cfg.business_whatsapp) {
      const wa = document.getElementById('done-wa');
      wa.href = waLink(cfg.business_whatsapp, `Hi 10x MoM! I just booked order ${order.code}.`);
      wa.hidden = false;
    }
    done.hidden = false;
    document.getElementById('done-title').focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const error = validate(state.step);
    if (error) return showError(error);
    if (state.step === LAST) submit();
    else showStep(state.step + 1);
  });
  backBtn.addEventListener('click', () => showStep(state.step - 1));
  form.elements.area.addEventListener('change', () => { state.slot = ''; });

  config().then((c) => {
    cfg = c;
    form.elements.area.append(...cfg.areas.map((area) => el('option', { value: area }, area)));
    renderItems();
    showStep(0, { focus: false });
  }).catch((err) => showError(err.message));
})();
