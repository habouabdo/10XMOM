(() => {
  const { api, el, config } = window.tenx;
  const form = document.getElementById('join-form');
  const errorBox = document.getElementById('join-error');
  const okBox = document.getElementById('join-ok');

  config().then((cfg) => {
    form.elements.area.append(...cfg.areas.map((area) => el('option', { value: area }, area)));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const f = form.elements;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await api('/api/applications', {
        method: 'POST',
        body: { name: f.name.value, phone: f.phone.value, area: f.area.value, experience: f.experience.value, has_car: f.has_car.checked },
      });
      form.reset();
      okBox.hidden = false;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
})();
