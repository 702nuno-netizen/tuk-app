/* Tuk Manager — interface. */
(function () {
  'use strict';
  const Calc = window.TMCalc;
  const Fmt = window.TMFormat;
  const Text = window.TMText;
  const Store = window.TMStore;

  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-7 6 7 6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 6l-7 6 7 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l7 6-7 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S14.4 16 15 19"/><circle cx="17" cy="9" r="2.2"/><path d="M16.2 14.6c2 .4 3.4 1.6 4 3.4"/></svg>',
    bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 19V10M10 19V5M15 19v-7M20 19V8"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l5-5 4 4 7-8"/><path d="M14 7h6v6"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="17" r="2" fill="currentColor"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="#e0b03a" stroke="#8a6410" stroke-width="1"><path d="M3 17l2-9 5 5 2-7 2 7 5-5 2 9z"/></svg>',
    tuk: '<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M8 28h36l7-9h7a5 5 0 0 1 5 5v3H10a4 4 0 0 1-2-1z" fill="#fff"/><path d="M16 19h20l5 8H14z" fill="#f0c14b"/><circle cx="20" cy="30" r="5" fill="#0c2344" stroke="#f0c14b" stroke-width="2"/><circle cx="48" cy="30" r="5" fill="#0c2344" stroke="#fff" stroke-width="2"/></svg>',
    g: '<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7A5.4 5.4 0 0 1 3.6 9c0-.6.1-1.2.3-1.7V5H.9A9 9 0 0 0 0 9c0 1.4.3 2.8.9 4l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>'
  };
  const AV = ['#1d4e89', '#0f7a56', '#b58116', '#8c3d5a', '#3c6e8f', '#a24b2d', '#3f5c49', '#5a4d86'];

  const st = {
    ready: false, route: 'onboard', param: '', data: null, mode: 'demo', store: null,
    clientId: '', wantGoogle: false, readOnly: false, offline: !navigator.onLine,
    date: '', monthY: 0, monthM: 0, yearY: 0, driverId: '', form: null, formKey: '',
    modal: null, busy: '', error: '', toast: null, profile: null, pendingIds: null, saveError: '', saving: false, bootError: ''
  };

  let scrollKey = '';
  let toastTimer = 0;
  let saveChain = Promise.resolve();
  let drag = null;
  let suppressClick = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function uid(p) { return p + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
  function lang() { return (st.data && st.data.config && st.data.config.lang) || st.lang || 'pt'; }
  function t(key, vars) { return Text.t(lang(), key, vars); }
  function cur() { return (st.data && st.data.config.currency) || 'EUR'; }
  function money(cents) { return Fmt.formatMoney(Calc.fromCents(cents), lang(), cur()); }
  function moneyE(euros) { return Fmt.formatMoney(Number(euros) || 0, lang(), cur()); }
  function chip(euros) { return Fmt.formatChip(Number(euros) || 0, lang(), cur()); }
  function plainFromCents(cents) { return Fmt.formatPlain(Calc.fromCents(cents), lang()); }
  function today() { return Calc.lisbonToday(); }
  function avColor(id) { let h = 0; const s = String(id || ''); for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 17) % AV.length; return AV[h]; }
  function initial(name) { return (String(name || '?').trim()[0] || '?').toUpperCase(); }
  function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
  function tukLabel(tuk) {
    if (!tuk) return t('noTukBucket');
    return tuk.number ? ('Tuk ' + tuk.number + ' · ' + tuk.name) : tuk.name;
  }
  function typeLabel(type) { return Text.typeName(type, lang()); }
  function knownIds() { return { main: localStorage.getItem('tm.sheetId') || '', backup: localStorage.getItem('tm.backupId') || '' }; }

  function toast(msg, err) {
    st.toast = { msg: msg, err: !!err };
    const el = document.querySelector('.toast');
    if (el) { el.className = 'toast show' + (err ? ' err' : ''); el.textContent = msg; }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { st.toast = null; const n = document.querySelector('.toast'); if (n) n.classList.remove('show'); }, err ? 4600 : 2200);
    try { navigator.vibrate && navigator.vibrate(err ? [20, 40, 20] : 10); } catch (e) { /* ignore */ }
  }
  function toastHtml() {
    if (!st.toast) return '<div class="toast" role="status"></div>';
    return '<div class="toast show' + (st.toast.err ? ' err' : '') + '" role="status">' + esc(st.toast.msg) + '</div>';
  }
  function showSaveState() {
    const el = document.querySelector('[data-sync]');
    if (!el) return;
    el.className = 'sync ' + (st.saveError ? 'bad' : st.saving ? 'wait' : 'ok');
  }

  function persist() {
    if (st.readOnly) { toast(t('readOnly'), true); return Promise.reject(new Error('readonly')); }
    const snap = JSON.parse(JSON.stringify(st.data));
    const run = saveChain.then(async () => {
      if (st.mode === 'sheets' && !navigator.onLine) {
        st.saveError = 'offline'; st.offline = true; showSaveState(); toast(t('offlineBanner'), true); throw new Error('offline');
      }
      st.saving = true; showSaveState();
      try {
        const merged = await st.store.save(snap);
        if (st.mode === 'sheets') {
          if (merged) st.data = Store.reconcile(Calc.normalize(st.data), Calc.normalize(snap), merged);
          localStorage.setItem('tm.cache.v1', JSON.stringify(st.data));
        }
        st.saveError = '';
      } catch (e) {
        st.saveError = e.message || 'error';
        toast(t('saveError'), true);
        throw e;
      } finally { st.saving = false; showSaveState(); }
    });
    saveChain = run.catch(() => {});
    return run;
  }
  function mutate(fn) {
    if (st.readOnly) { toast(t('readOnly'), true); return Promise.resolve(false); }
    st.data = Calc.normalize(fn(st.data));
    return persist().then(() => true, () => false);
  }

  function commitInputs() {
    if (!st.form) st.form = {};
    document.querySelectorAll('[data-bind]').forEach(el => {
      st.form[el.dataset.bind] = el.type === 'checkbox' ? el.checked : el.value;
    });
    document.querySelectorAll('[data-type-name]').forEach(el => {
      const row = st.form.types && st.form.types.find(x => x.id === el.dataset.typeName);
      if (!row) return;
      const shown = Text.typeName(row, lang());
      if (el.value.trim() !== shown) { row.name = el.value.trim(); row.nameCustom = true; }
    });
    document.querySelectorAll('[data-type-amount]').forEach(el => {
      const row = st.form.types && st.form.types.find(x => x.id === el.dataset.typeAmount);
      if (!row) return;
      const n = Fmt.parseAmount(el.value);
      if (!isNaN(n) && n >= 0) row.defaultAmount = Calc.money(n);
    });
  }
  function useForm(factory) {
    const key = st.route + '|' + (st.param || '') + '|' + ((st.data && st.data.config.wizardStep) || '') + '|' + (st.yearY || '');
    if (st.formKey !== key) { st.formKey = key; st.form = factory() || {}; }
    return st.form;
  }
  function readHash() {
    const raw = (location.hash || '#').replace(/^#/, '');
    const cut = raw.indexOf('/');
    if (cut < 0) { st.route = raw || 'day'; st.param = ''; }
    else { st.route = raw.slice(0, cut) || 'day'; try { st.param = decodeURIComponent(raw.slice(cut + 1)); } catch (e) { st.param = raw.slice(cut + 1); } }
  }
  function go(route, id, replace) {
    const hash = '#' + route + (id ? '/' + encodeURIComponent(id) : '');
    if (replace) { history.replaceState(null, '', hash); readHash(); render(); }
    else if (location.hash !== hash) location.hash = hash;
    else { readHash(); render(); }
  }
  function ensureDriver() {
    const list = Calc.activeDrivers(st.data);
    if (!list.some(d => d.id === st.driverId)) st.driverId = list.length ? list[0].id : '';
  }
  function shiftMonth(n) {
    let m = st.monthM + n, y = st.monthY;
    if (m < 1) { m = 12; y -= 1; } if (m > 12) { m = 1; y += 1; }
    st.monthM = m; st.monthY = y;
  }

  function legalLinks() {
    return '<p class="legal"><a href="privacy.html">' + esc(t('privacy')) + '</a> · <a href="terms.html">' + esc(t('terms')) + '</a></p>';
  }
  function bars() {
    return (st.mode === 'demo' ? '<div class="demo-bar" data-testid="demo-banner">' + esc(t('demoBanner')) + '</div>' : '')
      + ((st.offline && st.mode === 'sheets') ? '<div class="offline-bar" data-testid="offline-banner">' + esc(t('offlineBanner')) + '</div>' : '');
  }
  function navbar() {
    const items = [['day', 'navDay', I.cal], ['drivers', 'navDrivers', I.people], ['month', 'navMonth', I.bars], ['year', 'navYear', I.trend], ['settings', 'navSettings', I.sliders]];
    return '<nav class="nav">' + items.map(([id, key, ic]) => {
      const inSettings = ['settings', 'general', 'tuks', 'tuk', 'sdrivers', 'sdriver', 'rules', 'goals', 'types', 'data'].indexOf(st.route) >= 0;
    const on = st.route === id || (id === 'settings' && inSettings) || (id === 'drivers' && st.route === 'account');
      return '<button type="button" data-act="nav" data-tab="' + id + '" class="' + (on ? 'on' : '') + '" aria-label="' + esc(t(key)) + '"><span class="ic">' + ic + '</span>' + esc(t(key)) + '</button>';
    }).join('') + '</nav>';
  }
  function layout(main, opts) {
    const o = opts || {};
    const save = o.save ? '<div class="savebar">' + o.save + '</div>' : '';
    const nav = o.nav === false || o.save ? '' : navbar();
    return bars() + main + save + nav + modalHtml() + toastHtml();
  }
  function heroMain(stepperHtml) {
    const biz = (st.data.config.businessName || 'Tuk Manager');
    return '<header class="hero"><div class="hero-top"><div class="logo">' + I.tuk + '</div><div style="min-width:0;flex:1"><div class="brand">Tuk <em>Manager</em><i class="sync ' + (st.saveError ? 'bad' : st.saving ? 'wait' : 'ok') + '" data-sync data-act="retry-save"></i></div><div class="biz">' + esc(biz) + '</div></div><button type="button" class="icon-btn" data-act="nav" data-tab="settings" aria-label="' + esc(t('settings')) + '">' + I.gear + '</button></div>' + (stepperHtml || '') + '</header>';
  }
  function stepper(kicker, title, inputHtml) {
    return '<div class="stepper"><button type="button" class="step-btn" data-act="step-prev" aria-label="' + esc(t('back')) + '">' + I.left + '</button><div class="step-mid"><div class="kicker">' + esc(kicker) + '</div><div class="date-title">' + esc(title) + '</div>' + (inputHtml || '') + '</div><button type="button" class="step-btn" data-act="step-next" aria-label="' + esc(t('next')) + '">' + I.right + '</button></div>';
  }
  function subHero(kicker, title) {
    const action = /^\d/.test(String(kicker)) ? 'back-step' : 'back';
    return '<header class="hero" style="padding-bottom:22px"><div class="hero-top"><button type="button" class="icon-btn" data-act="' + action + '" aria-label="' + esc(t('back')) + '" style="margin-left:0">' + I.back + '</button><div style="min-width:0"><div class="kicker" style="color:var(--gold-2)">' + esc(kicker) + '</div><div class="date-title" style="font-family:var(--serif);font-size:26px">' + esc(title) + '</div></div></div></header>';
  }

  function renderBoot() {
    document.getElementById('app').innerHTML = '<div class="boot"><div class="spinner"></div><p>Tuk Manager</p></div>';
  }
  function render() {
    const app = document.getElementById('app');
    try {
      if (st.data && !st.data.config.onboarded && st.route !== 'onboard' && st.route !== 'reconnect') st.route = 'onboard';
      if (st.route === 'day' && st.data && st.data.config.onboarded && !st.readOnly) {
        const next = Calc.withSuggestions(st.data, st.date || today());
        if (next !== st.data) { st.data = next; persist(); }
      }
      const key = [st.route, st.param, st.date, st.monthY, st.monthM, st.yearY, st.data && st.data.config.wizardStep, st.busy ? 1 : 0].join('|');
      const y = key === scrollKey ? window.scrollY : 0;
      scrollKey = key;
      app.innerHTML = st.busy ? ('<div class="boot"><div class="spinner"></div><p>' + esc(st.busy) + '</p></div>' + toastHtml()) : pageHtml();
      document.documentElement.lang = lang() === 'en' ? 'en' : 'pt-PT';
      window.scrollTo(0, y);
    } catch (err) {
      console.error(err);
      app.innerHTML = '<div class="page"><div class="card"><h2>Tuk Manager</h2><p data-testid="crash">' + esc(err && err.message) + '</p><button class="btn" type="button" onclick="location.reload()">' + esc(t('retry')) + '</button></div></div>';
    }
  }
  function pageHtml() {
    switch (st.route) {
      case 'onboard': return screenOnboard();
      case 'reconnect': return screenReconnect();
      case 'drivers': return screenDrivers();
      case 'account': return screenAccount();
      case 'month': return screenMonth();
      case 'year': return screenYear();
      case 'settings': return screenSettings();
      case 'general': return screenGeneral();
      case 'tuks': return screenTuks();
      case 'tuk': return screenTuk();
      case 'sdrivers': return screenSDrivers();
      case 'sdriver': return screenSDriver();
      case 'rules': return screenRules();
      case 'goals': return screenGoals();
      case 'types': return screenTypes();
      case 'data': return screenData();
      case 'report': return screenReport();
      default: return screenDay();
    }
  }

  function screenOnboard() {
    const step = st.data.config.wizardStep || 1;
    const dots = '<div class="dots">' + [1, 2, 3, 4, 5, 6, 7].map(n => '<i class="' + (n === step ? 'on' : '') + '"></i>').join('') + '</div>';
    let body = '';
    if (step === 1) body = stepWelcome();
    else if (step === 2) body = stepPerm();
    else if (step === 3) body = stepBiz();
    else if (step === 4) body = stepTuks();
    else if (step === 5) body = stepDrivers();
    else if (step === 6) body = stepRulesW();
    else body = stepDone();
    return layout('<div data-screen="onboard" data-step="' + step + '">' + body + dots + '</div>', { nav: false });
  }
  function stepWelcome() {
    const googleBtn = '<button type="button" class="btn block google" id="start-google" data-act="start-google">' + I.g + ' ' + esc(t('startGoogle')) + '</button>';
    const demoBtn = '<button type="button" class="btn block' + (st.clientId ? ' ghost' : '') + '" id="start-demo" data-act="start-demo">' + esc(t('startWithout')) + '</button>';
    const note = st.clientId ? t('demoHint') : t('noClient');
    return '<header class="hero center"><div class="logo">' + I.tuk + '</div><div class="brand">Tuk <em>Manager</em></div><p style="margin:10px 18px 0;color:rgba(255,255,255,.8)">' + esc(t('welcomeLead')) + '</p><div class="lang"><button type="button" data-act="set-lang" data-lang="pt" class="' + (lang() === 'pt' ? 'on' : '') + '">PT</button><button type="button" data-act="set-lang" data-lang="en" class="' + (lang() === 'en' ? 'on' : '') + '">EN</button></div></header><div class="page"><div class="card">' + (st.clientId ? googleBtn + demoBtn : demoBtn + googleBtn) + '<p class="note">' + esc(note) + '</p></div>' + legalLinks() + '</div>';
  }
  function stepPerm() {
    const name = st.data.config.businessName || (lang() === 'en' ? 'Your business' : 'O teu negócio');
    return subHero('2 / 7', t('stepPermTitle')) + '<div class="page sub"><div class="card"><p>' + esc(t('stepPermBody')) + '</p><div class="line"><span>1</span><b style="font-weight:600;white-space:normal;text-align:right">' + esc(t('stepPerm1', { name: name })) + '</b></div><div class="line"><span>2</span><b style="font-weight:600;white-space:normal;text-align:right">' + esc(t('stepPerm2')) + '</b></div><p class="note">' + esc(t('stepPerm3')) + '</p>' + (st.mode === 'demo' || !st.wantGoogle ? '<p class="note">' + esc(t('stepPermDemo')) + '</p>' : '') + '<button type="button" class="btn block" data-act="next">' + esc(t('next')) + '</button><button type="button" class="btn ghost block" data-act="back-step">' + esc(t('back')) + '</button></div></div>';
  }
  function stepBiz() {
    const f = useForm(() => ({ businessName: st.data.config.businessName || '' }));
    return subHero('3 / 7', t('stepBizTitle')) + '<div class="page sub"><div class="card"><p class="subline">' + esc(t('stepBizLead')) + '</p><label class="field"><span>' + esc(t('bizName')) + '</span><input id="business-name" data-bind="businessName" value="' + esc(f.businessName) + '" placeholder="' + esc(t('stepBizPh')) + '" autocomplete="organization"></label><button type="button" class="btn block" data-act="next">' + esc(t('next')) + '</button><button type="button" class="btn ghost block" data-act="back-step">' + esc(t('back')) + '</button></div></div>';
  }
  function stepTuks() {
    const f = useForm(() => ({ tukName: '', tukNumber: '', tukPlate: '', tukFuel: 'combustion', tukGarage: '' }));
    const list = st.data.tuks.filter(tk => !tk.deleted);
    const rows = list.map(tk => '<div class="list-btn"><div class="tuk-num" style="width:40px;height:40px;font-size:16px">' + esc(tk.number || '·') + '</div><div class="grow"><b>' + esc(tk.name) + '</b><small>' + esc(tk.plate || '') + ' · ' + esc(tk.fuel === 'electric' ? t('electric') : t('combustion')) + '</small></div><button type="button" data-act="del-tuk" data-id="' + esc(tk.id) + '">' + esc(t('remove')) + '</button></div>').join('');
    return subHero('4 / 7', t('stepTuksTitle')) + '<div class="page sub"><div class="card"><p class="subline">' + esc(t('stepTuksLead')) + '</p><p class="note">' + esc(t('of50', { n: list.length })) + '</p>' + rows + '<label class="field"><span>' + esc(t('driverName')) + '</span><input id="tuk-name" data-bind="tukName" value="' + esc(f.tukName) + '"></label><div class="split"><label class="field"><span>' + esc(t('number')) + '</span><input id="tuk-num" data-bind="tukNumber" value="' + esc(f.tukNumber) + '"></label><label class="field"><span>' + esc(t('plate')) + '</span><input id="tuk-plate" data-bind="tukPlate" value="' + esc(f.tukPlate) + '"></label></div><label class="field"><span>' + esc(t('fuel')) + '</span><select id="tuk-fuel" data-bind="tukFuel"><option value="combustion"' + (f.tukFuel !== 'electric' ? ' selected' : '') + '>' + esc(t('combustion')) + '</option><option value="electric"' + (f.tukFuel === 'electric' ? ' selected' : '') + '>' + esc(t('electric')) + '</option></select></label><label class="field"><span>' + esc(t('garageMonth')) + ' · ' + esc(t('optional')) + '</span><input id="tuk-garage" data-bind="tukGarage" inputmode="decimal" value="' + esc(f.tukGarage) + '" placeholder="0"></label><button type="button" class="btn ghost block" data-act="add-tuk">' + I.plus + ' ' + esc(t('addTuk')) + '</button><button type="button" class="btn block" data-act="next">' + esc(t('next')) + '</button><button type="button" class="btn ghost block" data-act="back-step">' + esc(t('back')) + '</button></div></div>';
  }
  function stepDrivers() {
    const f = useForm(() => ({ drvName: '', drvNumber: '', drvPhone: '', drvPct: String(st.data.config.defaultOwnerPct || 50), drvOwner: false }));
    const list = st.data.drivers.filter(d => !d.deleted);
    const rows = list.map(d => '<div class="list-btn"><span class="av" style="background:' + avColor(d.id) + ';margin:0">' + esc(initial(d.name)) + '</span><div class="grow"><b>' + esc(d.name) + (d.isOwner ? ' · ' + esc(t('ownerTag')) : '') + '</b><small>' + (d.isOwner ? esc(t('isOwner')) : (Calc.driverPct(d, '2099-01-01') + '%')) + '</small></div><button type="button" data-act="del-drv" data-id="' + esc(d.id) + '">' + esc(t('remove')) + '</button></div>').join('');
    return subHero('5 / 7', t('stepDrvTitle')) + '<div class="page sub"><div class="card"><p class="subline">' + esc(t('stepDrvLead')) + '</p><p class="note">' + esc(t('of50', { n: list.length })) + '</p>' + rows + '<label class="field"><span>' + esc(t('driverName')) + '</span><input id="drv-name" data-bind="drvName" value="' + esc(f.drvName) + '"></label><div class="split"><label class="field"><span>' + esc(t('number')) + '</span><input id="drv-num" data-bind="drvNumber" value="' + esc(f.drvNumber) + '"></label><label class="field"><span>' + esc(t('phone')) + '</span><input id="drv-phone" data-bind="drvPhone" value="' + esc(f.drvPhone) + '" inputmode="tel"></label></div><label class="field"><span>' + esc(t('ownerPct')) + '</span><input id="drv-pct" data-bind="drvPct" inputmode="decimal" value="' + esc(f.drvPct) + '"></label><label class="field" style="display:flex;align-items:center;justify-content:space-between"><span>' + esc(t('isOwner')) + '</span><input id="drv-owner" data-bind="drvOwner" type="checkbox" style="width:22px;min-height:22px"' + (f.drvOwner ? ' checked' : '') + '></label><button type="button" class="btn ghost block" data-act="add-driver">' + I.plus + ' ' + esc(t('addDriver')) + '</button><button type="button" class="btn block" data-act="next">' + esc(t('next')) + '</button><button type="button" class="btn ghost block" data-act="back-step">' + esc(t('back')) + '</button></div></div>';
  }
  function stepRulesW() {
    const p = Calc.isoParts(today());
    const g = st.data.goals.find(x => x.year === p.y && x.month === p.m);
    const f = useForm(() => ({
      rulePct: String(st.data.config.defaultOwnerPct),
      ruleTips: st.data.config.tipsEnabled !== false,
      ruleGoal: g ? String(g.amount) : '',
      ruleBonus: st.data.config.bonusAmount ? String(st.data.config.bonusAmount) : '',
      bonusMode: st.data.config.bonusMode || 'off',
      ruleCurrency: st.data.config.currency || 'EUR'
    }));
    return subHero('6 / 7', t('stepRulesTitle')) + '<div class="page sub"><div class="card"><p class="subline">' + esc(t('stepRulesLead')) + '</p><label class="field"><span>' + esc(t('defaultPct')) + '</span><input id="rule-pct" data-bind="rulePct" inputmode="decimal" value="' + esc(f.rulePct) + '"></label><label class="field" style="display:flex;align-items:center;justify-content:space-between"><span>' + esc(t('tipsOn')) + '</span><input id="rule-tips" data-bind="ruleTips" type="checkbox" style="width:22px;min-height:22px"' + (f.ruleTips ? ' checked' : '') + '></label><label class="field"><span>' + esc(t('goalThisMonth')) + '</span><input id="rule-goal" data-bind="ruleGoal" inputmode="decimal" value="' + esc(f.ruleGoal) + '" placeholder="4800"></label><p class="note">' + esc(t('goalHelp')) + '</p><div class="section" style="margin-left:0">' + esc(t('bonus')) + '</div><div class="seg"><button type="button" data-act="bonus-mode" data-mode="off" class="' + (f.bonusMode !== 'monthly' ? 'on' : '') + '">' + esc(t('bonusOff')) + '</button><button type="button" data-act="bonus-mode" data-mode="monthly" class="' + (f.bonusMode === 'monthly' ? 'on' : '') + '">' + esc(t('bonusMonthly')) + '</button></div>' + (f.bonusMode === 'monthly' ? '<label class="field"><span>' + esc(t('bonusAmount')) + '</span><input id="rule-bonus" data-bind="ruleBonus" inputmode="decimal" value="' + esc(f.ruleBonus) + '"></label>' : '') + '<p class="note">' + esc(t('bonusHelp')) + '</p><label class="field"><span>' + esc(t('currency')) + '</span><select id="rule-currency" data-bind="ruleCurrency">' + ['EUR', 'USD', 'GBP'].map(c => '<option' + (f.ruleCurrency === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></label><button type="button" class="btn block" data-act="next">' + esc(t('next')) + '</button><button type="button" class="btn ghost block" data-act="skip-rules">' + esc(t('skip')) + '</button><button type="button" class="btn ghost block" data-act="back-step">' + esc(t('back')) + '</button></div></div>';
  }
  function stepDone() {
    const nt = st.data.tuks.filter(tk => !tk.deleted).length;
    const nd = st.data.drivers.filter(d => !d.deleted).length;
    const cloud = st.wantGoogle && !!st.clientId;
    return subHero('7 / 7', t('stepDoneTitle')) + '<div class="page sub"><div class="card"><h2>' + esc(st.data.config.businessName || '') + '</h2><div class="line"><span>' + esc(t('tuksCount')) + '</span><b>' + esc(t('summaryTuks', { n: nt })) + '</b></div><div class="line"><span>' + esc(t('driversCount')) + '</span><b>' + esc(t('summaryDrv', { n: nd })) + '</b></div><p class="note">' + esc(cloud ? t('stepDoneGoogle') : t('stepDoneDemo')) + '</p>' + (st.error ? '<p class="note" style="color:var(--red)" data-testid="setup-error">' + esc(st.error) + '</p>' : '') + '<button type="button" class="btn block" data-act="finish">' + esc(t('finish')) + '</button><button type="button" class="btn ghost block" data-act="back-step">' + esc(t('back')) + '</button></div></div>';
  }

  function screenReconnect() {
    return layout('<header class="hero center"><div class="logo">' + I.tuk + '</div><div class="brand">Tuk <em>Manager</em></div><p style="margin:8px 16px 0;color:rgba(255,255,255,.8)">' + esc(t('reconnectTitle')) + '</p></header><div class="page" data-screen="reconnect"><div class="card"><p>' + esc(t('reconnectBody')) + '</p>' + (st.bootError ? '<p class="note">' + esc(st.bootError) + '</p>' : '') + '<button type="button" class="btn block google" data-act="start-google">' + I.g + ' ' + esc(t('startGoogle')) + '</button><button type="button" class="btn ghost block" data-act="use-demo">' + esc(t('startWithout')) + '</button></div>' + legalLinks() + '</div>', { nav: false });
  }

  function screenDay() {
    ensureDriver();
    const date = st.date || today();
    const drivers = Calc.activeDrivers(st.data);
    const day = Calc.summarizeDay(st.data, date);
    const drv = st.data.drivers.find(d => d.id === st.driverId);
    const info = day.per.find(p => p.driverId === st.driverId) || { grossCents: 0, shareCents: 0, tipCents: 0, pct: 0, tukId: null, isOwner: false };
    const tuk = Calc.tukById(st.data, info.tukId);
    const services = st.data.services.filter(s => s.date === date && s.driverId === st.driverId);
    const kicker = Fmt.weekdayLong(date, lang()).toLocaleUpperCase(lang() === 'en' ? 'en-GB' : 'pt-PT') + (date === today() ? ' · ' + t('today') : '');
    const chipsHtml = services.map((s, i) => '<button type="button" class="chip' + (i === services.length - 1 ? ' on' : '') + '" data-act="edit-service" data-id="' + esc(s.id) + '">' + esc(chip(s.amount)) + '</button>').join('');
    const zero = (st.data.assignments.find(a => a.date === date && a.driverId === st.driverId) || {}).workedZero;
    let shareCard = '';
    if (drv && drv.isOwner) {
      const tips = st.data.config.tipsEnabled ? st.data.tips.filter(tp => tp.date === date && tp.driverId === drv.id) : [];
      shareCard = '<section class="card share"><div class="row-between"><h2>' + esc(t('ownerDay')) + '</h2></div><p class="subline">' + esc(t('ownerDayBody')) + '</p>' + (st.data.config.tipsEnabled ? '<div class="row-between" style="margin-top:12px"><div><b>' + esc(t('tips')) + '</b><div class="subline">' + esc(t('tipsHint')) + '</div></div><div class="money md" data-testid="tips-total">' + esc(money(info.tipCents)) + '</div></div><div class="chips">' + tips.map(tp => '<button type="button" class="chip" data-act="edit-tip" data-id="' + esc(tp.id) + '">' + esc(chip(tp.amount)) + '</button>').join('') + '</div><div class="add-row"><input id="tip-amount" data-bind="tipAmount" inputmode="decimal" placeholder="' + esc(t('value')) + '"><button type="button" class="btn" data-act="add-tip">' + esc(t('add')) + '</button></div>' : '') + '</section>';
    } else if (drv) {
      shareCard = '<section class="card share"><div class="row-between"><div class="kicker" style="color:var(--gold-d)">' + esc(t('ownerShare')) + '</div><span class="tag">' + esc(t('infoOnly')) + '</span></div><div class="money xl" data-testid="owner-share">' + esc(money(info.shareCents)) + '</div><p class="subline">' + esc(t('pctOf', { pct: info.pct, gross: money(info.grossCents) })) + ' · ' + esc(t('keeps', { name: firstName(drv.name), amount: money(info.grossCents - info.shareCents) })) + '</p><button type="button" class="btn gold block" data-act="open-account">' + esc(t('stillToday', { amount: money(info.shareCents) })) + '</button></section>';
    }
    const expCard = expenseCard(date, drv, tuk);
    const who = drivers.map(d => {
      const inf = day.per.find(p => p.driverId === d.id);
      const tk = Calc.tukById(st.data, inf && inf.tukId);
      return '<button type="button" class="driver-chip' + (d.id === st.driverId ? ' on' : '') + '" data-act="pick-driver" data-id="' + esc(d.id) + '"><span class="av" style="background:' + avColor(d.id) + '">' + esc(initial(d.name)) + (d.isOwner ? '<i class="crown">' + I.crown + '</i>' : '') + '</span><span class="dn">' + esc(firstName(d.name)) + '</span><span class="dt">' + esc(tk ? tukLabel(tk) : t('noTuk')) + '</span></button>';
    }).join('');
    const main = heroMain(stepper(kicker, Fmt.longDate(date, lang()), '<input id="pick-date" type="date" value="' + esc(date) + '" aria-label="' + esc(t('navDay')) + '">'))
      + '<div class="page" data-screen="day">' + (drivers.length ? '<section class="card"><div class="kicker" style="color:var(--soft)">' + esc(t('whoDrives')) + '</div><div class="driver-scroller">' + who + '</div></section>' + tukCard(tuk, drv, date) + '<section class="card"><div class="row-between"><div><h2>' + esc(t('servicesOf', { name: drv ? firstName(drv.name) : '' })) + '</h2><div class="subline">' + esc(t('serviceHint')) + '</div></div><div class="money lg" data-testid="service-total">' + esc(money(info.grossCents)) + '</div></div><div class="chips">' + (chipsHtml || '<span class="soft">' + esc(t('emptyDay')) + '</span>') + '</div><div class="add-row"><input id="service-amount" data-bind="serviceAmount" inputmode="decimal" placeholder="' + esc(t('value')) + '" aria-label="' + esc(t('value')) + '"><span class="soft">€</span><button type="button" class="btn" data-act="add-service">' + I.plus + ' ' + esc(t('add')) + '</button></div>' + (services.length ? '' : '<button type="button" class="zero" data-act="toggle-zero">' + esc(zero ? t('undoZero') : t('dayZero')) + '</button>') + '</section>' + shareCard + expCard + '<section class="card day-sum"><div><div class="lbl">' + esc(t('today')) + '</div><b>' + esc(t('working', { n: day.working })) + '</b></div><div><span>' + esc(t('billedTips')) + '</span><b data-testid="day-billed">' + esc(money(day.grossCents + day.tipsCents)) + '</b></div><div><span>' + esc(t('company')) + '</span><b>' + esc(money(day.companyCents)) + '</b></div><div><span>' + esc(t('ownerPart')) + '</span><b>' + esc(money(day.ownerShareCents)) + '</b></div></section>' : '<section class="card empty"><p>' + esc(t('needDriver')) + '</p><button type="button" class="btn" data-act="nav" data-tab="sdrivers">' + esc(t('addDriver')) + '</button></section>') + '</div>';
    return layout(main);
  }
  function tukCard(tuk, drv, date) {
    if (!drv) return '';
    const row = st.data.assignments.find(a => a.date === date && a.driverId === drv.id);
    let hint = t('noTukToday');
    if (tuk && row && row.tukExplicit) hint = t('chosenToday');
    else if (tuk) hint = t('sameAsYesterday');
    return '<section class="card tuk-card"><div class="tuk-num">' + esc(tuk && tuk.number ? tuk.number : '–') + '</div><div class="grow"><b>' + esc(tuk ? tukLabel(tuk) : t('semTuk')) + '</b><div class="pills">' + (tuk && tuk.plate ? '<span class="pill">' + esc(tuk.plate) + '</span>' : '') + (tuk ? '<span class="pill gold">' + esc(tuk.fuel === 'electric' ? t('electric') : t('combustion')) + '</span>' : '') + '</div><div class="subline">' + esc(hint) + '</div></div><button type="button" class="btn ghost" data-act="open-tuk" style="min-height:42px">' + esc(tuk ? t('swap') : t('chooseTuk')) + '</button></section>';
  }
  function expenseCard(date, drv, tuk) {
    if (!drv) return '';
    const types = st.data.expenseTypes.filter(tp => !tp.deleted && tp.kind === 'daily').slice().sort(Calc.byOrder);
    const lines = st.data.expenses.filter(e => e.scope === 'daily' && e.date === date && (e.tukId === (tuk && tuk.id) || !e.tukId));
    const total = lines.reduce((s, e) => s + Calc.toCents(e.amount), 0);
    let fuelNote = '';
    if (tuk && tuk.fuel === 'electric') fuelNote = '<p class="note">' + esc(t('fuelHidden')) + '</p>';
    else if (!tuk) fuelNote = '<p class="note">' + esc(t('noTukExp')) + '</p>';
    const rows = types.map(tp => {
      const mine = lines.filter(e => e.typeId === tp.id);
      if (tp.systemKey === 'fuel' && (!tuk || tuk.fuel !== 'combustion') && !mine.length) return '';
      const sum = mine.reduce((s, e) => s + Calc.toCents(e.amount), 0);
      const detail = mine.map(e => esc(e.note || typeLabel(tp)) + ' ' + esc(chip(e.amount))).join(' · ');
      return '<div class="exp-line"><div class="exp-ic">' + (tp.systemKey === 'fuel' ? '⛽' : '•••') + '</div><div class="grow"><b>' + esc(typeLabel(tp)) + '</b><div class="subline">' + (detail || '—') + '</div></div><div class="money">' + esc(money(sum)) + '</div><button type="button" class="plus" data-act="add-expense" data-type="' + esc(tp.id) + '" aria-label="' + esc(t('add')) + '">' + I.plus + '</button></div>' + mine.map(e => '<button type="button" class="subline" data-act="edit-expense" data-id="' + esc(e.id) + '" style="margin-left:46px">' + esc(t('editExpense')) + '</button>').join('');
    }).join('');
    return '<section class="card"><div class="row-between"><div><h2>' + esc(t('expensesOf')) + (tuk ? ' · ' + esc(tuk.name) : '') + '</h2><div class="subline">' + esc(t('dailyOnly')) + '</div></div><div class="money md">' + esc(money(total)) + '</div></div>' + rows + fuelNote + '<p class="note">' + esc(t('monthlyNote')) + '</p></section>';
  }

  function screenDrivers() {
    const y = st.monthY, m = st.monthM;
    const month = Calc.computeMonth(st.data, y, m, today());
    const list = st.data.drivers.filter(d => !d.deleted && (d.active || month.byDriver.some(x => x.id === d.id && (x.days || x.dueCents))));
    const cards = list.map(d => {
      const row = month.byDriver.find(x => x.id === d.id) || { days: 0, grossCents: 0, dueCents: 0, status: 'clear', hitGoal: false };
      const led = Calc.buildLedger(st.data, d.id, today());
      const cls = led.status === 'red' ? 'red' : led.status === 'amber' ? 'amber' : 'green';
      const label = led.totalDueCents > 0 ? money(led.totalDueCents) : (led.creditCents > 0 ? money(led.creditCents) : t('settled'));
      const goal = month.goalCents;
      const pct = goal > 0 ? Math.round(row.grossCents / goal * 100) : 0;
      return '<button type="button" class="card" data-act="open-driver" data-id="' + esc(d.id) + '" style="width:100%;text-align:left"><div class="row-between"><div class="person"><span class="av" style="background:' + avColor(d.id) + ';margin:0">' + esc(initial(d.name)) + '</span><div class="who"><b>' + esc(d.name) + '</b><small class="muted">' + esc(d.isOwner ? t('ownerTag') : (Calc.driverPct(d, today()) + '%')) + '</small></div></div><span class="badge ' + cls + '">' + esc(label) + '</span></div><div class="stats" style="margin-top:12px"><div><span class="soft">' + esc(t('daysWorked')) + '</span><b>' + row.days + '</b></div><div><span class="soft">' + esc(t('billed')) + '</span><b>' + esc(money(row.grossCents)) + '</b></div><div><span class="soft">' + esc(t('goalLabel')) + '</span><b>' + (goal ? pct + '%' : '—') + '</b></div></div>' + (goal ? '<div class="bar"><i style="width:' + Math.min(100, pct) + '%"></i></div>' : '') + '</button>';
    }).join('');
    const head = heroMain(stepper(t('navDrivers'), Fmt.monthLong(m, lang()) + ' ' + y, '<input id="pick-month" type="month" value="' + y + '-' + String(m).padStart(2, '0') + '">'));
    return layout(head + '<div class="page" data-screen="drivers">' + (cards || '<div class="card empty">' + esc(t('noneYet')) + '</div>') + '</div>');
  }

  function screenAccount() {
    const id = st.param;
    const d = st.data.drivers.find(x => x.id === id);
    if (!d) return layout('<div class="page"><div class="card">' + esc(t('noneYet')) + '</div></div>');
    const led = Calc.buildLedger(st.data, id, today());
    const y = st.monthY, m = st.monthM;
    const month = Calc.computeMonth(st.data, y, m, today());
    const row = month.byDriver.find(x => x.id === id) || { days: 0, grossCents: 0, ownerShareCents: 0, hitGoal: false, goalCents: 0, bonusCents: 0 };
    const f = useForm(() => ({ handoverAmount: '', handoverDate: today(), handoverMode: '' }));
    const sugAll = led.totalDueCents;
    const sugY = led.untilYesterdayCents;
    let dueCard = '';
    if (d.isOwner) dueCard = '<section class="card"><p>' + esc(t('ownerAccount')) + '</p></section>';
    else if (led.status === 'credit') dueCard = '<section class="card due green" data-testid="due-total" data-status="credit"><div class="kicker">' + esc(t('inYourFavour')) + '</div><div class="money xl">' + esc(money(led.creditCents)) + '</div></section>';
    else if (led.totalDueCents <= 0) dueCard = '<section class="card due green" data-testid="due-total" data-status="clear"><div class="kicker">' + esc(t('settled')) + '</div><div class="money xl">' + esc(money(0)) + '</div></section>';
    else dueCard = '<section class="card due ' + (led.status === 'red' ? '' : 'amber') + '" data-testid="due-total" data-status="' + led.status + '"><div class="kicker">' + esc(t('totalDue')) + '</div><div class="money xl">' + esc(money(led.totalDueCents)) + '</div>' + (led.oldestUnpaidDate ? '<p class="subline">' + esc(t('oldest', { date: Fmt.shortDate(led.oldestUnpaidDate, lang()), n: led.oldestAgeDays })) + '</p>' : '') + '<div class="split"><div><b>' + esc(money(led.overdueCents)) + '</b><div class="subline">' + esc(t('bucketOld')) + ' · ' + esc(t('redNote')) + '</div></div><div><b>' + esc(money(led.recentCents)) + '</b><div class="subline">' + esc(t('bucketNew')) + ' · ' + esc(t('amberNote')) + '</div></div></div></section>';
    const prefix = y + '-' + String(m).padStart(2, '0');
    const entries = led.entries.filter(e => e.date && e.date.slice(0, 7) === prefix).slice().reverse();
    const prior = led.entries.filter(e => e.date && e.date.slice(0, 7) < prefix);
    const opening = prior.length ? prior[prior.length - 1].runningCents : 0;
    const openingHtml = opening ? '<div class="mov"><div class="grow"><div class="when">' + esc(t('openingBalance')) + '</div></div><div class="amt">' + esc(money(opening)) + '</div></div>' : '';
    const mov = (entries.map(e => movementHtml(e, led)).join('') + openingHtml) || '<p class="empty">' + esc(t('noneYet')) + '</p>';
    const goalLine = row.goalCents > 0 ? (row.hitGoal ? t('goalDone') : t('missing', { amount: money(Math.max(0, row.goalCents - row.grossCents)) })) : t('goalNone');
    const pct = row.goalCents > 0 ? Math.min(100, Math.round(row.grossCents / row.goalCents * 100)) : 0;
    const pay = d.isOwner ? '' : '<section class="card"><h2>' + esc(t('registerPay')) + '</h2><p class="subline">' + esc(t('registerHelp')) + '</p><div class="quick" style="margin-top:10px"><button type="button" data-act="handover-all" class="' + (f.handoverMode === 'all' ? 'on' : '') + '">' + esc(t('payAll')) + '<small>' + esc(money(sugAll)) + '</small></button><button type="button" data-act="handover-yesterday" class="' + (f.handoverMode === 'until' ? 'on' : '') + '">' + esc(t('payUntil')) + '<small>' + esc(money(sugY)) + '</small></button><button type="button" data-act="handover-other" class="' + (f.handoverMode === 'other' ? 'on' : '') + '">' + esc(t('payOther')) + '<small>—</small></button></div><div class="split"><label class="field"><span>' + esc(t('amount')) + '</span><input id="handover-amount" data-bind="handoverAmount" inputmode="decimal" value="' + esc(f.handoverAmount) + '"></label><label class="field"><span>' + esc(t('payDate')) + '</span><input id="handover-date" data-bind="handoverDate" type="date" max="' + esc(today()) + '" value="' + esc(f.handoverDate) + '"></label></div><button type="button" class="btn block" data-act="confirm-handover">' + esc(t('registerPay')) + '</button><p class="note">' + esc(t('oldestFirst')) + '</p></section>';
    const phone = d.phone ? '<a class="icon-btn" href="tel:' + esc(d.phone) + '" aria-label="' + esc(t('phone')) + '">☎</a>' : '';
    const head = '<header class="hero"><div class="hero-top"><button type="button" class="icon-btn" data-act="back" style="margin-left:0">' + I.back + '</button><div class="grow"><div class="kicker">' + esc(t('accountOf')) + '</div><div class="date-title" style="font-family:var(--serif);font-size:26px">' + esc(d.name) + '</div><div class="biz">Nº ' + esc(d.number || '—') + (d.phone ? ' · ' + esc(d.phone) : '') + (d.isOwner ? '' : ' · ' + Calc.driverPct(d, today()) + '%') + '</div></div>' + phone + '</div>' + stepper(String(y), Fmt.monthLong(m, lang()), '') + '</header>';
    return layout(head + '<div class="page" data-screen="account">' + dueCard + pay + '<section class="card"><h2>' + esc(t('stats')) + '</h2><div class="stats"><div><span class="soft">' + esc(t('daysWorked')) + '</span><b>' + row.days + '</b></div><div><span class="soft">' + esc(t('billed')) + '</span><b>' + esc(money(row.grossCents)) + '</b></div><div><span class="soft">' + esc(t('ownerPart')) + '</span><b>' + esc(d.isOwner ? '—' : money(row.ownerShareCents)) + '</b></div></div><p class="note">' + esc(goalLine) + (row.hitGoal && row.bonusCents ? ' · ' + esc(t('bonusGot', { amount: money(row.bonusCents) })) : '') + (row.hitGoal && d.isOwner ? ' · ' + esc(t('noBonusOwner')) : '') + '</p>' + (row.goalCents ? '<div class="bar"><i style="width:' + pct + '%"></i></div>' : '') + '</section><section class="card"><div class="row-between"><h2>' + esc(t('movements')) + '</h2><span class="soft">' + esc(t('balance')) + '</span></div>' + mov + '<p class="note">' + esc(t('offDays')) + '</p></section></div>');
  }
  function movementHtml(e, led) {
    const age = Calc.diffDays(e.date, today());
    if (e.kind === 'day') {
      const late = e.remainingCents > 0 && age >= 7;
      const tuk = Calc.tukById(st.data, e.charge.tukId);
      const det = [tuk ? tukLabel(tuk) : '', t('billed') + ' ' + money(e.charge.grossCents), e.charge.isOwner ? t('ownerTag') : (e.charge.pct + '%')].filter(Boolean).join(' · ');
      const left = e.remainingCents > 0 ? '<small>' + esc(t('dueLeft', { amount: money(e.remainingCents) })) + (late ? ' · ' + esc(t('daysLate', { n: age })) : '') + '</small>' : '<small>' + esc(t('balance')) + ' ' + esc(money(e.runningCents)) + '</small>';
      return '<div class="mov' + (late ? ' late' : '') + '"><div class="grow"><div class="when">' + esc(Fmt.weekdayShort(e.date, lang()) + ' ' + Fmt.shortDate(e.date, lang()) + (e.date === today() ? ' · ' + t('today') : '')) + '</div><div class="det">' + esc(det) + '</div></div><div class="amt">' + esc(money(e.cents)) + left + '</div></div>';
    }
    const touched = e.touched || [];
    let det = e.kind === 'bonus' ? t('bonusLine') : '';
    if (e.kind !== 'bonus' && touched.length) {
      const first = touched[0], last = touched[touched.length - 1];
      if (touched.length > 1) det = t('paysDays', { n: touched.length, from: Fmt.shortDate(first.chargeDate, lang()), to: Fmt.shortDate(last.chargeDate, lang()) });
      else {
        const day = led.entries.find(x => x.kind === 'day' && x.date === first.chargeDate);
        const partial = day && first.cents < day.charge.shareCents;
        det = partial ? t('paysPartial', { amount: money(first.cents), date: Fmt.shortDate(first.chargeDate, lang()) }) : t('paysOne', { date: Fmt.shortDate(first.chargeDate, lang()) });
      }
    }
    return '<div class="mov pay"><div class="grow"><div class="when">' + esc((e.kind === 'bonus' ? t('bonusLine') : t('registerPay')) + ' · ' + Fmt.shortDate(e.date, lang())) + '</div><div class="det">' + esc(det) + '</div></div><div class="amt">−' + esc(money(e.cents)) + '<small>' + esc(t('balance')) + ' ' + esc(money(e.runningCents)) + '</small></div></div>';
  }

  function screenMonth() {
    const y = st.monthY, m = st.monthM;
    const mo = Calc.computeMonth(st.data, y, m, today());
    const lines = [
      [t('gross'), money(mo.grossCents)],
      [t('ownerShareMonth'), money(mo.ownerShareCents)],
      [t('tips'), money(mo.tipsCents)],
      [t('companyIncome'), money(mo.companyIncomeCents)],
      [t('dailyExp'), mo.dailyExpenseCents ? '−' + money(mo.dailyExpenseCents) : money(0)],
      [t('monthlyExp'), mo.monthlyExpenseCents ? '−' + money(mo.monthlyExpenseCents) : money(0)],
      [t('bonuses'), mo.bonusCents ? '−' + money(mo.bonusCents) : money(0)]
    ];
    const expRows = mo.lines.map(l => {
      const parts = (l.parts || []).filter(p => p.cents).map(p => esc(p.name) + ' ' + esc(money(p.cents))).join(' · ');
      return '<button type="button" class="list-btn" data-act="edit-month-exp" data-type="' + esc(l.type.id) + '"><div class="grow"><b>' + esc(typeLabel(l.type)) + '</b><small>' + esc(l.source === 'garage' || l.source === 'repeat' ? t('always') : '') + (parts ? ' · ' + parts : '') + '</small></div><b>' + esc(money(l.cents)) + '</b></button>';
    }).join('');
    const dues = mo.byDriver.filter(d => !d.isOwner && !d.deleted && d.dueCents > 0).sort((a, b) => (a.status === 'red' ? -1 : 1));
    const dueHtml = dues.length ? dues.map(d => '<button type="button" class="list-btn" data-act="open-driver" data-id="' + esc(d.id) + '"><div class="grow"><b>' + esc(d.name) + '</b><small>' + esc(d.status === 'red' ? t('daysLate', { n: d.oldestAgeDays }) : t('onlyToday')) + '</small></div><span class="badge ' + (d.status === 'red' ? 'red' : 'amber') + '">' + esc(money(d.dueCents)) + '</span></button>').join('') : '<p class="note">' + esc(t('allSettled')) + '</p>';
    const goals = mo.byDriver.filter(d => !d.deleted && d.active).map(d => {
      const pct = d.goalCents ? Math.min(100, Math.round(d.grossCents / d.goalCents * 100)) : 0;
      const extra = d.hitGoal ? (d.isOwner ? t('noBonusOwner') : (d.bonusCents ? t('bonusGot', { amount: money(d.bonusCents) }) : t('hit'))) : (d.goalCents ? t('missing', { amount: money(d.goalCents - d.grossCents) }) : '');
      return '<div style="margin:10px 0"><div class="row-between"><b>' + esc(d.name) + '</b><span class="soft">' + esc(extra) + '</span></div>' + (d.goalCents ? '<div class="bar"><i style="width:' + pct + '%"></i></div>' : '') + '</div>';
    }).join('');
    const maxT = Math.max.apply(null, mo.byTuk.map(tk => tk.cents).concat([1]));
    const tuks = mo.byTuk.map(tk => {
      const name = tk.id ? ((Calc.tukById(st.data, tk.id) || {}).name || tk.id) : t('noTukBucket');
      return '<div class="h-bar"><span>' + esc(name) + '</span><div class="track"><i style="width:' + Math.round(tk.cents / maxT * 100) + '%"></i></div><b>' + esc(money(tk.cents)) + '</b></div>';
    }).join('') || '<p class="note">' + esc(t('noneYet')) + '</p>';
    const head = heroMain(stepper(t('monthSummary'), Fmt.monthLong(m, lang()) + ' ' + y, '<input id="pick-month" type="month" value="' + y + '-' + String(m).padStart(2, '0') + '">'));
    return layout(head + '<div class="page" data-screen="month"><section class="card"><div class="row-between"><div><div class="kicker" style="color:var(--soft)">' + esc(t('profit')) + '</div><div class="money xl" data-testid="month-profit">' + esc(money(mo.profitCents)) + '</div></div><span class="badge">' + esc(t('daysWith', { n: mo.daysWithService })) + '</span></div>' + lines.map(l => '<div class="line"><span>' + esc(l[0]) + '</span><b>' + esc(l[1]) + '</b></div>').join('') + '<div class="line"><span>' + esc(t('profitLine')) + '</span><b>' + esc(money(mo.profitCents)) + '</b></div><p class="note" data-testid="month-note">' + esc(t('incomeNote')) + '</p></section><div class="section">' + esc(t('monthExpenses')) + '</div><section class="card"><div class="row-between"><h2>' + esc(t('expensesTotal')) + '</h2><b>' + esc(money(mo.monthlyExpenseCents)) + '</b></div>' + expRows + '<button type="button" class="btn ghost block" data-act="add-month-exp">' + esc(t('addMonthExp')) + '</button></section><div class="section">' + esc(t('balances')) + '</div><section class="card">' + dueHtml + '<p class="note">' + esc(t('seeAccounts')) + '</p></section><div class="section">' + esc(t('goalOfMonth')) + '</div><section class="card"><h2>' + (mo.goalCents ? esc(t('forEveryone', { amount: money(mo.goalCents) })) : esc(t('noGoal'))) + '</h2>' + goals + '</section><div class="section">' + esc(t('byTuk')) + '</div><section class="card h-bars">' + tuks + '</section><button type="button" class="btn block" data-act="export-pdf">' + esc(t('pdf')) + '</button><button type="button" class="btn ghost block" data-act="export-csv">' + esc(t('excel')) + '</button><p class="note" style="text-align:center">' + esc(t('exportMonth', { month: Fmt.monthLong(m, lang()) })) + '</p></div>');
  }

  function screenYear() {
    const y = st.yearY;
    const yr = Calc.computeYear(st.data, y, today());
    const max = Math.max.apply(null, yr.months.map(mo => mo.grossCents).concat([1]));
    const labels = yr.months.map(mo => Fmt.monthShort(mo.month, lang()).slice(0, 1));
    const w = 320, h = 150, gap = 6, bw = (w - gap * 13) / 12;
    const bars = yr.months.map((mo, i) => {
      const bh = Math.round((mo.grossCents / max) * (h - 28));
      const x = gap + i * (bw + gap);
      return '<rect class="' + (mo.grossCents === max && mo.grossCents ? 'hi' : '') + '" x="' + x + '" y="' + (h - 18 - bh) + '" width="' + bw + '" height="' + Math.max(bh, 0) + '" rx="3"></rect><text x="' + (x + bw / 2) + '" y="' + (h - 4) + '" text-anchor="middle">' + esc(labels[i]) + '</text>';
    }).join('');
    const maxT = Math.max.apply(null, yr.byTuk.map(tk => tk.cents).concat([1]));
    const tuks = yr.byTuk.map(tk => {
      const name = tk.id ? ((Calc.tukById(st.data, tk.id) || {}).name || '—') : t('noTukBucket');
      return '<div class="h-bar"><span>' + esc(name) + '</span><div class="track"><i style="width:' + Math.round(tk.cents / maxT * 100) + '%"></i></div><b>' + esc(money(tk.cents)) + '</b></div>';
    }).join('') || '<p class="note">' + esc(t('noneYet')) + '</p>';
    const maxD = Math.max.apply(null, yr.byDriver.map(d => d.grossCents).concat([1]));
    const drvs = yr.byDriver.filter(d => d.grossCents || d.days).map(d => {
      const person = st.data.drivers.find(x => x.id === d.id);
      return '<div class="h-bar"><span>' + esc(person ? firstName(person.name) : d.id) + '</span><div class="track"><i style="width:' + Math.round(d.grossCents / maxD * 100) + '%"></i></div><b>' + esc(money(d.grossCents)) + '</b></div>';
    }).join('') || '<p class="note">' + esc(t('noneYet')) + '</p>';
    const months = yr.months.map(mo => '<div class="line"><span>' + esc(Fmt.monthLong(mo.month, lang())) + '</span><b>' + esc(money(mo.grossCents)) + '</b></div>').join('');
    const head = heroMain(stepper(t('yearSummary'), String(y), ''));
    return layout(head + '<div class="page" data-screen="year"><section class="card"><div class="kicker" style="color:var(--soft)">' + esc(t('yearGross')) + '</div><div class="money xl" data-testid="year-gross">' + esc(money(yr.grossCents)) + '</div><div class="line"><span>' + esc(t('yearProfit')) + '</span><b data-testid="year-profit">' + esc(money(yr.profitCents)) + '</b></div><svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img">' + bars + '</svg></section><div class="section">' + esc(t('perMonth')) + '</div><section class="card">' + months + '</section><div class="section">' + esc(t('byTuk')) + '</div><section class="card h-bars">' + tuks + '</section><div class="section">' + esc(t('byDriver')) + '</div><section class="card h-bars">' + drvs + '</section></div>');
  }

  function screenSettings() {
    const owner = st.data.drivers.find(d => d.isOwner && !d.deleted);
    const nt = st.data.tuks.filter(tk => !tk.deleted && tk.active).length;
    const nd = st.data.drivers.filter(d => !d.deleted && d.active).length;
    const ntypes = st.data.expenseTypes.filter(tp => !tp.deleted).length;
    const who = owner ? owner.name : (st.data.config.businessName || '');
    const mail = (st.profile && (st.profile.emailAddress || st.profile.displayName)) || (st.mode === 'demo' ? t('onThisPhone') : '');
    const row = (act, icon, cls, title, sub, extra) => '<button type="button" class="list-btn" data-act="nav" data-tab="' + act + '"><span class="ic-blob ' + cls + '">' + icon + '</span><span class="grow"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span><span class="badge">' + esc(extra) + '</span></button>';
    const head = heroMain('');
    return layout(head + '<div class="page" data-screen="settings"><div class="kicker" style="margin:0 6px 6px">' + esc(t('menu')) + '</div><h2 style="margin:0 6px 4px;font-family:var(--serif);font-size:32px">' + esc(t('settings')) + '</h2><p class="subline" style="margin:0 6px 12px">' + esc(t('settingsLead')) + '</p><section class="card person"><span class="av" style="background:' + avColor(who) + ';margin:0">' + esc(initial(who)) + '</span><div class="grow"><b>' + esc(who) + (owner ? ' · ' + esc(t('ownerTag')) : '') + '</b><small class="muted">' + esc(mail) + '</small></div><span class="badge green"><i class="dot"></i>' + esc(st.mode === 'demo' ? t('demoShort') : t('connected')) + '</span></section><div class="section">' + esc(t('theBusiness')) + '</div><section class="card">' + row('general', I.sliders, 'navy', t('general'), t('generalSub'), (lang() === 'en' ? 'EN' : 'PT') + ' · ' + cur()) + row('tuks', I.tuk, 'navy', t('tuks'), t('tuksSub'), t('of50', { n: nt })) + row('sdrivers', I.people, 'navy', t('navDrivers'), t('driversSub'), t('of50', { n: nd })) + '</section><div class="section">' + esc(t('accounts')) + '</div><section class="card">' + row('rules', I.sliders, 'gold', t('rules'), t('rulesSub'), (st.data.config.defaultOwnerPct || 0) + ' %') + row('goals', '★', 'gold', t('goals'), t('goalsSub'), '') + row('types', '▤', 'gold', t('expTypes'), t('expTypesSub'), String(ntypes)) + '</section><div class="section">' + esc(t('data')) + '</div><section class="card">' + row('data', I.g, 'green', t('data'), t('dataSub'), st.data.config.lastBackup ? Fmt.shortDate(st.data.config.lastBackup, lang()) : '') + '</section><div class="section">' + esc(t('later')) + '</div><section class="card soon"><div class="list-btn"><span class="grow"><b>' + esc(t('soonWeek')) + '</b><small>' + esc(t('soonWeekSub')) + '</small></span><span class="badge">' + esc(t('soon')) + '</span></div><div class="list-btn"><span class="grow"><b>' + esc(t('soonFixed')) + '</b><small>' + esc(t('soonFixedSub')) + '</small></span><span class="badge">' + esc(t('soon')) + '</span></div><div class="list-btn"><span class="grow"><b>' + esc(t('soonTheme')) + '</b><small>' + esc(t('soonThemeSub')) + '</small></span><span class="badge">' + esc(t('soon')) + '</span></div></section><p class="note legal">Tuk Manager</p>' + legalLinks() + '</div>');
  }

  function saveButtons(act) {
    return '<button type="button" class="btn ghost" data-act="cancel">' + esc(t('cancel')) + '</button><button type="button" class="btn" data-act="' + act + '">' + esc(t('save')) + '</button>';
  }
  function screenGeneral() {
    const f = useForm(() => ({ businessName: st.data.config.businessName, lang: st.data.config.lang, currency: st.data.config.currency }));
    return layout(subHero(t('settings'), t('general')) + '<div class="page sub has-save" data-screen="general"><section class="card"><label class="field"><span>' + esc(t('language')) + '</span><select data-bind="lang"><option value="pt"' + (f.lang !== 'en' ? ' selected' : '') + '>Português</option><option value="en"' + (f.lang === 'en' ? ' selected' : '') + '>English</option></select></label><label class="field"><span>' + esc(t('currency')) + '</span><select data-bind="currency">' + ['EUR', 'USD', 'GBP'].map(c => '<option' + (f.currency === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></label><label class="field"><span>' + esc(t('bizName')) + '</span><input data-bind="businessName" value="' + esc(f.businessName) + '"></label></section></div>', { save: saveButtons('save-general'), nav: false });
  }
  function entityList(items, route, emptyAct) {
    return items.map(it => '<button type="button" class="list-btn" data-act="nav" data-tab="' + route + '" data-id="' + esc(it.id) + '"><div class="grow"><b>' + esc(it.name) + (it.active ? '' : ' · ' + esc(t('inactive'))) + '</b><small>' + esc(it.meta || '') + '</small></div><span class="chev">›</span></button>').join('') || '<p class="empty">' + esc(t('noneYet')) + '</p>';
  }
  function screenTuks() {
    const items = st.data.tuks.filter(tk => !tk.deleted).slice().sort(Calc.byOrder).map(tk => ({ id: tk.id, name: (tk.number ? tk.number + ' · ' : '') + tk.name, active: tk.active, meta: (tk.plate || '') + ' · ' + (tk.fuel === 'electric' ? t('electric') : t('combustion')) }));
    return layout(subHero(t('settings'), t('tuks')) + '<div class="page sub" data-screen="tuks"><section class="card">' + entityList(items, 'tuk') + '<button type="button" class="btn block" data-act="nav" data-tab="tuk" data-id="new">' + esc(t('addTuk')) + '</button></section></div>');
  }
  function screenTuk() {
    const isNew = st.param === 'new';
    const tuk = st.data.tuks.find(tk => tk.id === st.param);
    if (!isNew && !tuk) return layout('<div class="page"></div>');
    const f = useForm(() => isNew ? { name: '', number: '', plate: '', fuel: 'combustion', garage: '', active: true } : { name: tuk.name, number: tuk.number, plate: tuk.plate, fuel: tuk.fuel, garage: String(tuk.garageMonthly || ''), active: tuk.active !== false });
    return layout(subHero(t('tuks'), isNew ? t('addTuk') : t('editTuk')) + '<div class="page sub has-save" data-screen="tuk"><section class="card"><label class="field"><span>' + esc(t('driverName')) + '</span><input data-bind="name" value="' + esc(f.name) + '"></label><label class="field"><span>' + esc(t('number')) + '</span><input data-bind="number" value="' + esc(f.number) + '"></label><label class="field"><span>' + esc(t('plate')) + '</span><input data-bind="plate" value="' + esc(f.plate) + '"></label><label class="field"><span>' + esc(t('fuel')) + '</span><select data-bind="fuel"><option value="combustion"' + (f.fuel !== 'electric' ? ' selected' : '') + '>' + esc(t('combustion')) + '</option><option value="electric"' + (f.fuel === 'electric' ? ' selected' : '') + '>' + esc(t('electric')) + '</option></select></label><label class="field"><span>' + esc(t('garageMonth')) + '</span><input data-bind="garage" inputmode="decimal" value="' + esc(f.garage) + '"></label><label class="field" style="display:flex;justify-content:space-between;align-items:center"><span>' + esc(t('active')) + '</span><input data-bind="active" type="checkbox" style="width:22px;min-height:22px"' + (f.active ? ' checked' : '') + '></label><p class="note">' + esc(t('deactivateHelp')) + '</p>' + (isNew ? '' : '<button type="button" class="btn danger block" data-act="ask-delete" data-kind="tuk">' + esc(t('delete')) + '</button><p class="note">' + esc(t('deleteHelp')) + '</p>') + '</section></div>', { save: saveButtons('save-tuk'), nav: false });
  }
  function screenSDrivers() {
    const items = st.data.drivers.filter(d => !d.deleted).slice().sort(Calc.byOrder).map(d => ({ id: d.id, name: d.name, active: d.active, meta: d.isOwner ? t('ownerTag') : (Calc.driverPct(d, today()) + '%') }));
    return layout(subHero(t('settings'), t('navDrivers')) + '<div class="page sub" data-screen="sdrivers"><section class="card">' + entityList(items, 'sdriver') + '<button type="button" class="btn block" data-act="nav" data-tab="sdriver" data-id="new">' + esc(t('addDriver')) + '</button></section></div>');
  }
  function screenSDriver() {
    const isNew = st.param === 'new';
    const d = st.data.drivers.find(x => x.id === st.param);
    if (!isNew && !d) return layout('<div class="page"></div>');
    const pct = d ? Calc.driverPct(d, today()) : (st.data.config.defaultOwnerPct || 50);
    const f = useForm(() => isNew ? { name: '', number: '', phone: '', isOwner: false, active: true, newPct: String(st.data.config.defaultOwnerPct || 50) } : { name: d.name, number: d.number, phone: d.phone, isOwner: !!d.isOwner, active: d.active !== false, newPct: '' });
    return layout(subHero(t('navDrivers'), isNew ? t('addDriver') : t('editDriver')) + '<div class="page sub has-save" data-screen="sdriver"><section class="card"><label class="field"><span>' + esc(t('driverName')) + '</span><input data-bind="name" value="' + esc(f.name) + '"></label><label class="field"><span>' + esc(t('number')) + '</span><input data-bind="number" value="' + esc(f.number) + '"></label><label class="field"><span>' + esc(t('phone')) + '</span><input data-bind="phone" value="' + esc(f.phone) + '"></label><label class="field" style="display:flex;justify-content:space-between;align-items:center"><span>' + esc(t('isOwner')) + '</span><input data-bind="isOwner" type="checkbox" style="width:22px;min-height:22px"' + (f.isOwner ? ' checked' : '') + '></label>' + (f.isOwner ? '' : '<p class="note">' + esc(t('currentPct', { pct: pct })) + '</p><label class="field"><span>' + esc(t('newPct')) + '</span><input data-bind="newPct" inputmode="decimal" value="' + esc(f.newPct) + '" placeholder="' + esc(String(pct)) + '"></label><p class="note">' + esc(t('newPctHelp')) + '</p>') + '<label class="field" style="display:flex;justify-content:space-between;align-items:center"><span>' + esc(t('active')) + '</span><input data-bind="active" type="checkbox" style="width:22px;min-height:22px"' + (f.active ? ' checked' : '') + '></label>' + (isNew ? '' : '<button type="button" class="btn danger block" data-act="ask-delete" data-kind="driver">' + esc(t('delete')) + '</button>') + '</section></div>', { save: saveButtons('save-driver'), nav: false });
  }
  function screenRules() {
    const f = useForm(() => ({ defaultOwnerPct: String(st.data.config.defaultOwnerPct), tipsEnabled: st.data.config.tipsEnabled !== false }));
    return layout(subHero(t('settings'), t('rules')) + '<div class="page sub has-save" data-screen="rules"><section class="card"><label class="field"><span>' + esc(t('defaultPct')) + '</span><input data-bind="defaultOwnerPct" inputmode="decimal" value="' + esc(f.defaultOwnerPct) + '"></label><p class="note">' + esc(t('defaultPctHelp')) + '</p><label class="field" style="display:flex;justify-content:space-between;align-items:center"><span>' + esc(t('tipsOn')) + '</span><input data-bind="tipsEnabled" type="checkbox" style="width:22px;min-height:22px"' + (f.tipsEnabled ? ' checked' : '') + '></label><p class="note">' + esc(t('tipsHelp')) + '</p></section></div>', { save: saveButtons('save-rules'), nav: false });
  }
  function screenGoals() {
    const y = st.yearY;
    const f = useForm(() => {
      const o = { bonusMode: st.data.config.bonusMode || 'off', bonusAmount: st.data.config.bonusAmount ? String(st.data.config.bonusAmount) : '' };
      for (let m = 1; m <= 12; m++) {
        const g = st.data.goals.find(x => x.year === y && x.month === m);
        o['m' + m] = g ? String(g.amount) : '';
      }
      return o;
    });
    const rows = [];
    for (let m = 1; m <= 12; m++) rows.push('<label class="field"><span>' + esc(Fmt.monthLong(m, lang())) + '</span><input data-bind="m' + m + '" inputmode="decimal" value="' + esc(f['m' + m] || '') + '"></label>');
    return layout(subHero(t('goals'), String(y)) + '<div class="page sub has-save" data-screen="goals"><section class="card"><div class="row-between"><h2>' + esc(t('twelve', { year: y })) + '</h2><span><button type="button" data-act="shift-year" data-n="-1">‹</button> <button type="button" data-act="shift-year" data-n="1">›</button></span></div>' + rows.join('') + '<button type="button" class="btn ghost block" data-act="use-average">' + esc(t('useAverage')) + '</button><p class="note">' + esc(t('averageHelp')) + '</p></section><section class="card"><h2>' + esc(t('bonus')) + '</h2><div class="seg"><button type="button" data-act="bonus-mode" data-mode="off" class="' + (f.bonusMode !== 'monthly' ? 'on' : '') + '">' + esc(t('bonusOff')) + '</button><button type="button" data-act="bonus-mode" data-mode="monthly" class="' + (f.bonusMode === 'monthly' ? 'on' : '') + '">' + esc(t('bonusMonthly')) + '</button></div>' + (f.bonusMode === 'monthly' ? '<label class="field"><span>' + esc(t('bonusAmount')) + '</span><input data-bind="bonusAmount" inputmode="decimal" value="' + esc(f.bonusAmount) + '"></label>' : '') + '<p class="note">' + esc(t('bonusHelp')) + '</p></section></div>', { save: saveButtons('save-goals'), nav: false });
  }
  function screenTypes() {
    const f = useForm(() => ({ types: st.data.expenseTypes.map(tp => Object.assign({}, tp)), newType: '' }));
    const rows = f.types.filter(tp => !tp.deleted).slice().sort(Calc.byOrder).map(tp => {
      const repeat = tp.kind === 'monthly';
      return '<article class="type-card' + (tp.factory ? '' : ' new') + '" data-row data-id="' + esc(tp.id) + '"><div class="row-between"><span class="handle" data-drag>⋮⋮</span><div class="grow"><input data-type-name="' + esc(tp.id) + '" value="' + esc(Text.typeName(tp, lang())) + '" aria-label="' + esc(t('typeName')) + '"><div class="subline">' + esc(Text.typeHelp(tp, lang())) + '</div></div><button type="button" data-act="del-type" data-id="' + esc(tp.id) + '" aria-label="' + esc(t('delete')) + '">✕</button></div><div class="seg"><button type="button" data-act="set-kind" data-id="' + esc(tp.id) + '" data-kind="daily" class="' + (tp.kind !== 'monthly' ? 'on' : '') + '">' + esc(t('daily')) + '</button><button type="button" data-act="set-kind" data-id="' + esc(tp.id) + '" data-kind="monthly" class="' + (repeat ? 'on' : '') + '">' + esc(t('monthly')) + '</button></div>' + (repeat ? '<div class="row-between" style="margin-top:8px"><span>' + esc(t('repeat')) + '</span><button type="button" class="switch' + (tp.repeatMonthly ? ' on' : '') + '" data-act="toggle-repeat" data-id="' + esc(tp.id) + '" aria-label="' + esc(t('repeat')) + '"><i></i></button></div>' + (tp.repeatMonthly && tp.systemKey !== 'garage' ? '<label class="field"><span>' + esc(t('repeatAmount')) + '</span><input data-type-amount="' + esc(tp.id) + '" inputmode="decimal" value="' + esc(tp.defaultAmount ? String(tp.defaultAmount) : '') + '"></label>' : '') : '<p class="note">' + esc(t('onlyOnDay')) + '</p>') + '</article>';
    }).join('');
    return layout(subHero(t('settings'), t('expTypes')) + '<div class="page sub has-save" data-screen="types"><p class="note" style="margin-top:0">' + esc(t('typesLead')) + '</p><div data-sort="types">' + rows + '</div><section class="card"><label class="field"><span>' + esc(t('typeName')) + '</span><input data-bind="newType" value="' + esc(f.newType || '') + '"></label><button type="button" class="btn block" data-act="add-type">' + esc(t('addType')) + '</button><button type="button" class="btn ghost block" data-act="restore-types">' + esc(t('restore')) + '</button><p class="help">' + esc(t('factoryHelp')) + '</p></section></div>', { save: saveButtons('save-types'), nav: false });
  }
  function screenData() {
    const when = st.data.config.lastBackup ? t('backupToday', { when: st.data.config.lastBackup }) : t('backupNever');
    const link = st.mode === 'sheets' && st.store && st.store.url && st.store.url() ? st.store.url() : '';
    return layout(subHero(t('settings'), t('data')) + '<div class="page sub" data-screen="data"><section class="card"><h2>' + esc(t('backup')) + '</h2><p>' + esc(st.mode === 'demo' ? t('backupDemo') : when) + '</p><p class="note">' + esc(t('backupExplain')) + '</p>' + (link ? '<a class="btn block" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(t('sheet')) + '</a>' : '<p class="note">' + esc(t('noSheet')) + '</p>') + '<button type="button" class="btn ghost block" data-act="export-all">' + esc(t('exportAll')) + '</button><button type="button" class="btn ghost block" data-act="export-json">' + esc(t('exportJson')) + '</button></section><section class="card">' + (st.mode === 'demo' && st.clientId ? '<button type="button" class="btn block" data-act="connect-google">' + esc(t('connect')) + '</button>' : '') + (st.mode === 'sheets' ? '<button type="button" class="btn ghost block" data-act="switch-account">' + esc(t('switch')) + '</button><button type="button" class="btn ghost block" data-act="sign-out">' + esc(t('signOut')) + '</button>' : '<button type="button" class="btn danger block" data-act="ask-clear">' + esc(t('clearDemo')) + '</button>') + '</section><section class="card">' + legalLinks() + '<p class="note"><a href="mailto:702nuno@gmail.com">702nuno@gmail.com</a></p></section></div>');
  }
  function screenReport() {
    const y = st.monthY, m = st.monthM;
    const mo = Calc.computeMonth(st.data, y, m, today());
    const biz = st.data.config.businessName || 'Tuk Manager';
    const rows = mo.byDriver.filter(d => d.days || d.grossCents).map(d => '<tr><td>' + esc(d.name) + '</td><td>' + d.days + '</td><td>' + esc(money(d.grossCents)) + '</td><td>' + esc(d.hitGoal ? t('hit') : '') + '</td></tr>').join('');
    return layout('<div class="page report" data-screen="report"><header class="band"><div class="kicker">' + esc(t('reportTitle')) + '</div><h1 data-testid="report-biz">' + esc(biz) + '</h1><p>' + esc(Fmt.monthLong(m, lang()) + ' ' + y) + '</p></header><section class="card"><div class="money xl">' + esc(money(mo.profitCents)) + '</div><div class="line"><span>' + esc(t('gross')) + '</span><b>' + esc(money(mo.grossCents)) + '</b></div><div class="line"><span>' + esc(t('companyIncome')) + '</span><b>' + esc(money(mo.companyIncomeCents)) + '</b></div><div class="line"><span>' + esc(t('profitLine')) + '</span><b>' + esc(money(mo.profitCents)) + '</b></div><p class="note">' + esc(t('incomeNote')) + '</p></section><table><thead><tr><th>' + esc(t('colDriver')) + '</th><th>' + esc(t('daysWorked')) + '</th><th>' + esc(t('billed')) + '</th><th>' + esc(t('goalLabel')) + '</th></tr></thead><tbody>' + rows + '</tbody></table><p class="note">' + esc(t('generated')) + '</p><button type="button" class="btn block no-print" onclick="window.print()">' + esc(t('print')) + '</button><p class="note no-print">' + esc(t('printHint')) + '</p><button type="button" class="btn ghost block no-print" data-act="back">' + esc(t('back')) + '</button></div>', { nav: false });
  }

  function modalHtml() {
    const m = st.modal;
    if (!m) return '';
    if (m.kind === 'tuk') {
      const curId = (Calc.summarizeDay(st.data, st.date).per.find(p => p.driverId === st.driverId) || {}).tukId;
      const opts = Calc.activeTuks(st.data).map(tk => '<button type="button" class="choice' + (tk.id === curId ? ' on' : '') + '" data-act="pick-tuk" data-tuk="' + esc(tk.id) + '"><span class="tuk-num" style="width:40px;height:40px">' + esc(tk.number || '·') + '</span><span class="grow"><b>' + esc(tukLabel(tk)) + '</b><small class="muted">' + esc(tk.fuel === 'electric' ? t('electric') : t('combustion')) + '</small></span></button>').join('');
      return '<div class="backdrop" data-act="close-modal"><div class="sheet" data-act="noop"><div class="grab"></div><h2>' + esc(t('swapTitle')) + '</h2>' + opts + '<button type="button" class="choice' + (!curId ? ' on' : '') + '" data-act="pick-tuk" data-tuk="none"><b>' + esc(t('semTuk')) + '</b></button><p class="note">' + esc(t('taken')) + '</p></div></div>';
    }
    if (m.kind === 'service' || m.kind === 'tip' || m.kind === 'expense' || m.kind === 'month-exp') {
      const title = m.kind === 'service' ? t('editService') : m.kind === 'tip' ? t('tips') : t('editExpense');
      return '<div class="backdrop" data-act="close-modal"><div class="sheet" data-act="noop"><div class="grab"></div><h2>' + esc(m.adding ? t('add') : title) + '</h2>' + (m.kinds ? '<label class="field"><span>' + esc(t('expTypes')) + '</span><select data-bind="modalType">' + m.kinds.map(tp => '<option value="' + esc(tp.id) + '"' + (tp.id === m.typeId ? ' selected' : '') + '>' + esc(typeLabel(tp)) + '</option>').join('') + '</select></label>' : '') + '<label class="field"><span>' + esc(t('amount')) + '</span><input data-bind="modalAmount" inputmode="decimal" value="' + esc(m.amount || '') + '"></label><label class="field"><span>' + esc(t('note')) + '</span><input data-bind="modalNote" value="' + esc(m.note || '') + '"></label><button type="button" class="btn block" data-act="save-modal">' + esc(t('save')) + '</button>' + (m.kind === 'month-exp' && m.canAuto ? '<button type="button" class="btn ghost block" data-act="auto-month">' + esc(t('useAuto')) + '</button>' : '') + (m.adding ? '' : '<button type="button" class="btn danger block" data-act="delete-modal">' + esc(t('deleteLine')) + '</button>') + '</div></div>';
    }
    if (m.kind === 'confirm') {
      return '<div class="backdrop" data-act="close-modal"><div class="sheet" data-act="noop"><div class="grab"></div><h2>' + esc(m.title) + '</h2><p>' + esc(m.body || '') + '</p><button type="button" class="btn danger block" data-act="' + esc(m.ok) + '">' + esc(m.okLabel || t('delete')) + '</button><button type="button" class="btn ghost block" data-act="close-modal">' + esc(t('cancel')) + '</button></div></div>';
    }
    if (m.kind === 'cloud') {
      return '<div class="backdrop" data-act="noop"><div class="sheet" data-act="noop"><div class="grab"></div><p>' + esc(t('cloudExists')) + '</p><button type="button" class="btn block" data-act="open-cloud">' + esc(t('openCloud')) + '</button><button type="button" class="btn ghost block" data-act="close-modal">' + esc(t('stayDemo')) + '</button></div></div>';
    }
    return '';
  }

  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || !st.ready) return;
    if (suppressClick) { suppressClick = false; return; }
    const act = b.dataset.act;
    if (act !== 'skip-rules' && act !== 'noop') commitInputs();
    if (act === 'noop') { e.stopPropagation(); return; }
    if (act === 'close-modal') { if (e.target.closest('.sheet')) return; st.modal = null; render(); return; }
    handle(act, b);
  }
  function onChange(e) {
    if (e.target && e.target.id === 'pick-date' && e.target.value) { st.date = e.target.value; render(); }
    if (e.target && e.target.id === 'pick-month' && e.target.value) {
      const parts = e.target.value.split('-');
      st.monthY = Number(parts[0]); st.monthM = Number(parts[1]); render();
    }
  }
  function onKey(e) {
    if (e.key === 'Enter' && e.target && (e.target.dataset.bind === 'serviceAmount' || e.target.dataset.bind === 'tipAmount')) {
      e.preventDefault(); commitInputs();
      if (e.target.dataset.bind === 'serviceAmount') addService(); else addTip();
    }
  }
  function onDown(e) {
    const h = e.target.closest('[data-drag]');
    if (!h) return;
    const item = h.closest('[data-row]');
    const list = item && item.parentElement;
    if (!item || !list) return;
    drag = { item: item, list: list, pointer: e.pointerId };
    item.classList.add('dragging');
    try { item.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
  function onMove(e) {
    if (!drag) return;
    const items = Array.prototype.slice.call(drag.list.querySelectorAll('[data-row]'));
    items.forEach(it => {
      if (it === drag.item) return;
      const r = it.getBoundingClientRect();
      if (e.clientY > r.top && e.clientY < r.bottom) {
        if (e.clientY < r.top + r.height / 2) drag.list.insertBefore(drag.item, it);
        else drag.list.insertBefore(drag.item, it.nextSibling);
      }
    });
  }
  function onUp() {
    if (!drag) return;
    const ids = Array.prototype.slice.call(drag.list.querySelectorAll('[data-row]')).map(n => n.dataset.id);
    drag.item.classList.remove('dragging');
    drag = null;
    suppressClick = true;
    if (st.form && st.form.types) {
      ids.forEach((id, i) => { const row = st.form.types.find(tp => tp.id === id); if (row) row.order = i + 1; });
      render();
    }
  }

  function handle(act, b) {
    if (act === 'set-lang') return setLang(b.dataset.lang);
    if (act === 'start-demo') return startDemo();
    if (act === 'start-google') return startGoogle();
    if (act === 'use-demo') return useDemo();
    if (act === 'next') return nextStep();
    if (act === 'back-step') return backStep();
    if (act === 'skip-rules') return skipRules();
    if (act === 'finish') return finishOnboarding();
    if (act === 'add-tuk') return addTuk();
    if (act === 'del-tuk') return delWizard('tuks', b.dataset.id);
    if (act === 'add-driver') return addDriver();
    if (act === 'del-drv') return delWizard('drivers', b.dataset.id);
    if (act === 'bonus-mode') { if (st.form) st.form.bonusMode = b.dataset.mode; render(); return; }
    if (act === 'nav') return go(b.dataset.tab, b.dataset.id || '', false);
    if (act === 'back' || act === 'cancel') { if (history.length > 1) history.back(); else go('settings', '', true); return; }
    if (act === 'step-prev' || act === 'step-next') return stepMain(act === 'step-next' ? 1 : -1);
    if (act === 'pick-driver') { st.driverId = b.dataset.id; render(); return; }
    if (act === 'open-tuk') { st.modal = { kind: 'tuk' }; render(); return; }
    if (act === 'pick-tuk') return pickTuk(b.dataset.tuk);
    if (act === 'add-service') return addService();
    if (act === 'edit-service') return openAmountModal('service', b.dataset.id);
    if (act === 'add-tip') return addTip();
    if (act === 'edit-tip') return openAmountModal('tip', b.dataset.id);
    if (act === 'toggle-zero') return toggleZero();
    if (act === 'add-expense') return openExpenseModal(b.dataset.type, null);
    if (act === 'edit-expense') return openExpenseModal(null, b.dataset.id);
    if (act === 'open-account') return go('account', st.driverId);
    if (act === 'open-driver') return go('account', b.dataset.id);
    if (act === 'handover-all' || act === 'handover-yesterday' || act === 'handover-other') return presetHandover(act);
    if (act === 'confirm-handover') return confirmHandover();
    if (act === 'shift-month') return;
    if (act === 'shift-year') { st.yearY += Number(b.dataset.n) || 0; st.formKey = ''; render(); return; }
    if (act === 'export-pdf') return go('report');
    if (act === 'export-csv') return exportMonthCsv();
    if (act === 'export-all') return exportAllCsv();
    if (act === 'export-json') return downloadFile(fileBase() + '.json', JSON.stringify(st.data, null, 2), 'application/json');
    if (act === 'edit-month-exp') return openMonthExp(b.dataset.type, false);
    if (act === 'add-month-exp') return openMonthExp('', true);
    if (act === 'save-modal') return saveModal();
    if (act === 'delete-modal') return deleteModal();
    if (act === 'auto-month') return autoMonth();
    if (act === 'save-general') return saveGeneral();
    if (act === 'save-tuk') return saveTuk();
    if (act === 'save-driver') return saveDriver();
    if (act === 'save-rules') return saveRules();
    if (act === 'save-goals') return saveGoals();
    if (act === 'save-types') return saveTypes();
    if (act === 'ask-delete') return askDelete(b.dataset.kind);
    if (act === 'do-delete') return doDelete();
    if (act === 'add-type') return addType();
    if (act === 'del-type') return delType(b.dataset.id);
    if (act === 'set-kind') return setKind(b.dataset.id, b.dataset.kind);
    if (act === 'toggle-repeat') return toggleRepeat(b.dataset.id);
    if (act === 'restore-types') { if (st.form) st.form.types = Calc.restoreFactoryTypes(st.form.types); toast(t('restored')); render(); return; }
    if (act === 'use-average') return useAverage();
    if (act === 'connect-google') return connectGoogle();
    if (act === 'open-cloud') return openCloud();
    if (act === 'switch-account') return switchAccount();
    if (act === 'sign-out') { window.TMGoogle.signOut(); st.modal = null; go('reconnect', '', true); return; }
    if (act === 'ask-clear') { st.modal = { kind: 'confirm', title: t('clearDemo'), body: t('confirmClear'), ok: 'do-clear', okLabel: t('delete') }; render(); return; }
    if (act === 'do-clear') return clearDemo();
    if (act === 'retry-save') { persist(); return; }
  }

  function setLang(code) {
    st.lang = code === 'en' ? 'en' : 'pt';
    localStorage.setItem('tm.lang', st.lang);
    if (st.data) st.data.config.lang = st.lang;
    if (st.data && st.data.config.onboarded) persist();
    else if (st.store) persist();
    render();
  }
  function startDemo() {
    st.wantGoogle = false;
    localStorage.removeItem('tm.wantGoogle');
    st.mode = 'demo';
    st.store = Store.createLocalStore();
    localStorage.setItem('tm.mode', 'demo');
    st.data.config.lang = st.lang;
    if ((st.data.config.wizardStep || 1) < 2) st.data.config.wizardStep = 2;
    persist().then(() => render());
  }
  async function startGoogle() {
    if (!st.clientId) { toast(t('noClient'), true); return; }
    try {
      st.busy = t('startGoogle'); render();
      await window.TMGoogle.signIn(true);
      st.profile = await Store.fetchProfile(window.TMGoogle.token());
      const ids = await Store.findExisting(force => window.TMGoogle.getToken(!!force), knownIds());
      st.busy = '';
      if (ids.main) { toast(t('foundSheet')); await openSheets(ids, false); return; }
      st.wantGoogle = true;
      localStorage.setItem('tm.wantGoogle', '1');
      if (!st.data) st.data = Calc.emptyModel();
      st.data.config.lang = st.lang;
      if ((st.data.config.wizardStep || 1) < 2) st.data.config.wizardStep = 2;
      st.mode = 'pick';
      st.store = Store.createLocalStore();
      await st.store.save(st.data);
      st.ready = true;
      go('onboard', '', true);
    } catch (e) {
      st.busy = '';
      toast(t('authError'), true);
      render();
    }
  }
  function useDemo() {
    st.mode = 'demo';
    st.readOnly = false;
    st.store = Store.createLocalStore();
    localStorage.setItem('tm.mode', 'demo');
    st.store.load().then(data => { st.data = data; st.data.config.lang = st.data.config.lang || st.lang; st.ready = true; afterData(true); });
  }
  function backStep() {
    const step = st.data.config.wizardStep || 1;
    if (step > 1) st.data.config.wizardStep = step - 1;
    persist().then(() => render());
  }
  function applyRules(skip) {
    if (skip) {
      st.data.config.tipsEnabled = true;
      st.data.config.bonusMode = 'off';
      st.data.config.bonusAmount = 0;
      st.data.config.currency = st.data.config.currency || 'EUR';
      st.data.config.defaultOwnerPct = st.data.config.defaultOwnerPct || 50;
      return;
    }
    const pct = Fmt.parseAmount(st.form.rulePct);
    if (!isNaN(pct)) st.data.config.defaultOwnerPct = Calc.clampPct(pct);
    st.data.config.tipsEnabled = !!st.form.ruleTips;
    st.data.config.bonusMode = st.form.bonusMode === 'monthly' ? 'monthly' : 'off';
    const bonus = Fmt.parseAmount(st.form.ruleBonus);
    st.data.config.bonusAmount = !isNaN(bonus) && bonus > 0 ? Calc.money(bonus) : 0;
    if (st.form.ruleCurrency) st.data.config.currency = st.form.ruleCurrency;
    const goal = Fmt.parseAmount(st.form.ruleGoal);
    const p = Calc.isoParts(today());
    st.data.goals = st.data.goals.filter(g => !(g.year === p.y && g.month === p.m));
    if (!isNaN(goal) && goal > 0) st.data.goals.push({ year: p.y, month: p.m, amount: Calc.money(goal) });
  }
  function nextStep() {
    const step = st.data.config.wizardStep || 1;
    if (step === 3) {
      const name = String(st.form.businessName || '').trim();
      if (!name) { toast(t('needBiz'), true); return; }
      st.data.config.businessName = name;
    }
    if (step === 5 && !st.data.drivers.filter(d => !d.deleted).length) { toast(t('needDriver'), true); return; }
    if (step === 6) applyRules(false);
    if (step >= 7) return finishOnboarding();
    st.data.config.wizardStep = step + 1;
    st.formKey = '';
    persist().then(() => render());
  }
  function skipRules() {
    applyRules(true);
    st.data.config.wizardStep = 7;
    st.formKey = '';
    persist().then(() => render());
  }
  async function finishOnboarding() {
    st.error = '';
    st.data.config.onboarded = true;
    st.data.config.wizardStep = 7;
    st.data.config.lang = lang();
    if (st.wantGoogle && st.clientId) {
      st.busy = t('creating'); render();
      try {
        const ids = await Store.ensureFiles(force => window.TMGoogle.getToken(!!force), st.data.config.businessName, knownIds());
        localStorage.setItem('tm.sheetId', ids.main);
        localStorage.setItem('tm.backupId', ids.backup);
        localStorage.setItem('tm.mode', 'sheets');
        localStorage.removeItem('tm.wantGoogle');
        st.wantGoogle = false;
        st.mode = 'sheets';
        st.store = Store.createSheetsStore({ getToken: force => window.TMGoogle.getToken(!!force), spreadsheetId: ids.main, backupId: ids.backup });
        await st.store.save(st.data);
        st.busy = '';
        toast(t('filesReady'));
        await maybeBackup();
        afterData(true);
      } catch (e) {
        st.data.config.onboarded = false;
        st.busy = '';
        st.error = e.message || String(e);
        render();
      }
      return;
    }
    st.mode = 'demo';
    st.wantGoogle = false;
    localStorage.setItem('tm.mode', 'demo');
    localStorage.removeItem('tm.wantGoogle');
    st.store = Store.createLocalStore();
    await persist();
    afterData(true);
  }
  function addTuk() {
    const name = String(st.form.tukName || '').trim();
    if (!name) { toast(t('needName'), true); return; }
    if (st.data.tuks.filter(tk => !tk.deleted).length >= 50) { toast(t('maxReached'), true); return; }
    const garage = Fmt.parseAmount(st.form.tukGarage);
    st.data.tuks.push({
      id: uid('tuk'), name: name, number: String(st.form.tukNumber || '').trim(), plate: String(st.form.tukPlate || '').trim(),
      fuel: st.form.tukFuel === 'electric' ? 'electric' : 'combustion',
      garageMonthly: !isNaN(garage) && garage > 0 ? Calc.money(garage) : 0,
      active: true, deleted: false, order: st.data.tuks.length + 1
    });
    st.form.tukName = st.form.tukNumber = st.form.tukPlate = st.form.tukGarage = '';
    st.form.tukFuel = 'combustion';
    st.data = Calc.normalize(st.data);
    persist().then(() => render());
  }
  function addDriver() {
    const name = String(st.form.drvName || '').trim();
    if (!name) { toast(t('needName'), true); return; }
    if (st.data.drivers.filter(d => !d.deleted).length >= 50) { toast(t('maxReached'), true); return; }
    const pct = Fmt.parseAmount(st.form.drvPct);
    const isOwner = !!st.form.drvOwner;
    st.data.drivers.push({
      id: uid('drv'), name: name, number: String(st.form.drvNumber || '').trim(), phone: String(st.form.drvPhone || '').trim(),
      isOwner: isOwner, active: true, deleted: false, order: st.data.drivers.length + 1,
      pctHistory: [{ from: '1970-01-01', pct: isNaN(pct) ? (st.data.config.defaultOwnerPct || 50) : Calc.clampPct(pct) }]
    });
    st.form.drvName = st.form.drvNumber = st.form.drvPhone = '';
    st.form.drvOwner = false;
    st.data = Calc.normalize(st.data);
    persist().then(() => render());
  }
  function delWizard(list, id) {
    if (!st.data.config.onboarded) st.data[list] = st.data[list].filter(x => x.id !== id);
    else st.data[list] = st.data[list].map(x => x.id === id ? Object.assign({}, x, { deleted: true, active: false }) : x);
    persist().then(() => render());
  }
  function stepMain(dir) {
    if (st.route === 'day') { st.date = Calc.addDays(st.date, dir); render(); return; }
    if (st.route === 'drivers' || st.route === 'month' || st.route === 'account') { shiftMonth(dir); render(); return; }
    if (st.route === 'year') { st.yearY += dir; render(); }
  }
  function pickTuk(tuk) {
    const id = !tuk || tuk === 'none' ? null : tuk;
    st.data = Calc.applyTukChoice(st.data, st.date, st.driverId, id);
    st.modal = null;
    persist().then(() => render());
  }
  function addService() {
    const amount = Fmt.parseAmount(st.form.serviceAmount);
    if (!(amount > 0)) { toast(t('invalidAmount'), true); return; }
    if (!st.driverId) return;
    const date = st.date;
    const id = st.driverId;
    st.form.serviceAmount = '';
    mutate(data => {
      const assignments = data.assignments.map(a => Object.assign({}, a));
      const row = assignments.find(a => a.date === date && a.driverId === id);
      if (row) row.workedZero = false;
      return Object.assign({}, data, {
        services: data.services.concat([{ id: uid('srv'), date: date, driverId: id, amount: Calc.money(amount), note: '' }]),
        assignments: assignments
      });
    }).then(() => render());
  }
  function addTip() {
    const amount = Fmt.parseAmount(st.form.tipAmount);
    if (!(amount > 0)) { toast(t('invalidAmount'), true); return; }
    const date = st.date, id = st.driverId;
    st.form.tipAmount = '';
    mutate(data => Object.assign({}, data, { tips: data.tips.concat([{ id: uid('tip'), date: date, driverId: id, amount: Calc.money(amount) }]) })).then(() => render());
  }
  function toggleZero() {
    const date = st.date, id = st.driverId;
    const row = st.data.assignments.find(a => a.date === date && a.driverId === id);
    st.data = Calc.setWorkedZero(st.data, date, id, !(row && row.workedZero));
    persist().then(() => render());
  }
  function openAmountModal(kind, id) {
    const list = kind === 'tip' ? st.data.tips : st.data.services;
    const row = list.find(x => x.id === id);
    if (!row) return;
    st.modal = { kind: kind, id: id, amount: String(row.amount), note: row.note || '' };
    render();
  }
  function openExpenseModal(typeId, id) {
    if (id) {
      const row = st.data.expenses.find(e => e.id === id);
      if (!row) return;
      st.modal = { kind: 'expense', id: id, typeId: row.typeId, amount: String(row.amount), note: row.note || '' };
    } else st.modal = { kind: 'expense', adding: true, typeId: typeId, amount: '', note: '' };
    render();
  }
  function openMonthExp(typeId, adding) {
    const types = st.data.expenseTypes.filter(tp => !tp.deleted && tp.kind === 'monthly');
    const type = types.find(tp => tp.id === typeId) || types[0];
    if (!type) return;
    const lines = Calc.monthlyLines(st.data, st.monthY, st.monthM, today());
    const line = lines.find(l => l.type.id === (typeId || type.id));
    st.modal = {
      kind: 'month-exp', adding: !!adding, typeId: typeId || type.id, kinds: adding ? types : null,
      amount: line && line.cents ? String(Calc.fromCents(line.cents)) : '', note: '',
      canAuto: !!(line && (line.source === 'explicit') && (line.type.repeatMonthly || line.type.systemKey === 'garage'))
    };
    render();
  }
  function saveModal() {
    const m = st.modal;
    if (!m) return;
    const amount = Fmt.parseAmount(st.form.modalAmount);
    const note = String(st.form.modalNote || '').trim();
    if (m.kind === 'month-exp') {
      const typeId = st.form.modalType || m.typeId;
      if (isNaN(amount) || amount < 0) { toast(t('invalidAmount'), true); return; }
      const y = st.monthY, month = st.monthM;
      mutate(data => {
        let expenses = data.expenses.filter(e => !(e.scope === 'monthly' && e.year === y && e.month === month && e.typeId === typeId));
        expenses = expenses.concat([{ id: uid('ex'), scope: 'monthly', date: '', year: y, month: month, tukId: null, typeId: typeId, amount: Calc.money(amount), note: note }]);
        return Object.assign({}, data, { expenses: expenses });
      }).then(() => { st.modal = null; render(); });
      return;
    }
    if (!(amount > 0)) { toast(t('invalidAmount'), true); return; }
    if (m.kind === 'service') {
      mutate(data => Object.assign({}, data, { services: data.services.map(s => s.id === m.id ? Object.assign({}, s, { amount: Calc.money(amount), note: note }) : s) })).then(() => { st.modal = null; render(); });
    } else if (m.kind === 'tip') {
      mutate(data => Object.assign({}, data, { tips: data.tips.map(s => s.id === m.id ? Object.assign({}, s, { amount: Calc.money(amount) }) : s) })).then(() => { st.modal = null; render(); });
    } else if (m.adding) {
      const info = Calc.summarizeDay(st.data, st.date).per.find(p => p.driverId === st.driverId);
      mutate(data => Object.assign({}, data, { expenses: data.expenses.concat([{ id: uid('ex'), scope: 'daily', date: st.date, year: Calc.isoParts(st.date).y, month: Calc.isoParts(st.date).m, tukId: info ? info.tukId : null, typeId: m.typeId, amount: Calc.money(amount), note: note }]) })).then(() => { st.modal = null; render(); });
    } else {
      mutate(data => Object.assign({}, data, { expenses: data.expenses.map(s => s.id === m.id ? Object.assign({}, s, { amount: Calc.money(amount), note: note }) : s) })).then(() => { st.modal = null; render(); });
    }
  }
  function deleteModal() {
    const m = st.modal;
    if (!m) return;
    const key = m.kind === 'tip' ? 'tips' : m.kind === 'service' ? 'services' : 'expenses';
    mutate(data => Object.assign({}, data, { [key]: data[key].filter(x => x.id !== m.id) })).then(() => { st.modal = null; render(); });
  }
  function autoMonth() {
    const m = st.modal;
    const y = st.monthY, month = st.monthM;
    mutate(data => Object.assign({}, data, { expenses: data.expenses.filter(e => !(e.scope === 'monthly' && e.year === y && e.month === month && e.typeId === m.typeId)) })).then(() => { st.modal = null; render(); });
  }
  function presetHandover(act) {
    const led = Calc.buildLedger(st.data, st.param, today());
    if (act === 'handover-other') { st.form.handoverMode = 'other'; st.form.handoverAmount = ''; render(); return; }
    const cents = act === 'handover-all' ? led.totalDueCents : led.untilYesterdayCents;
    if (!(cents > 0)) { toast(t('nothingDue'), true); return; }
    st.form.handoverMode = act === 'handover-all' ? 'all' : 'until';
    st.form.handoverAmount = plainFromCents(cents);
    render();
  }
  function confirmHandover() {
    const amount = Fmt.parseAmount(st.form.handoverAmount);
    if (!(amount > 0)) { toast(t('invalidAmount'), true); return; }
    const date = st.form.handoverDate || today();
    if (date > today()) { toast(t('futurePay'), true); return; }
    const driverId = st.param;
    const note = st.form.handoverMode || 'other';
    st.form.handoverAmount = '';
    st.form.handoverMode = '';
    mutate(data => Object.assign({}, data, { handovers: data.handovers.concat([{ id: uid('pay'), date: date, driverId: driverId, amount: Calc.money(amount), note: note }]) })).then(ok => { if (ok) toast(t('saved')); render(); });
  }
  function saveGeneral() {
    const name = String(st.form.businessName || '').trim();
    if (!name) { toast(t('needBiz'), true); return; }
    const prev = st.data.config.businessName;
    st.data.config.businessName = name;
    st.data.config.lang = st.form.lang === 'en' ? 'en' : 'pt';
    st.data.config.currency = st.form.currency || 'EUR';
    st.lang = st.data.config.lang;
    localStorage.setItem('tm.lang', st.lang);
    const done = () => { toast(t('saved')); go('settings', '', true); };
    persist().then(() => {
      if (st.mode === 'sheets' && name !== prev && st.store.rename) st.store.rename(name).catch(() => {});
      done();
    });
  }
  function saveTuk() {
    const name = String(st.form.name || '').trim();
    if (!name) { toast(t('needName'), true); return; }
    const garage = Fmt.parseAmount(st.form.garage);
    const fields = {
      name: name, number: String(st.form.number || '').trim(), plate: String(st.form.plate || '').trim(),
      fuel: st.form.fuel === 'electric' ? 'electric' : 'combustion',
      garageMonthly: !isNaN(garage) && garage > 0 ? Calc.money(garage) : 0,
      active: !!st.form.active
    };
    if (st.param === 'new') {
      if (st.data.tuks.filter(tk => !tk.deleted).length >= 50) { toast(t('maxReached'), true); return; }
      mutate(data => Object.assign({}, data, { tuks: data.tuks.concat([Object.assign({ id: uid('tuk'), deleted: false, order: data.tuks.length + 1 }, fields)]) })).then(() => go('tuks', '', true));
    } else {
      mutate(data => Object.assign({}, data, { tuks: data.tuks.map(tk => tk.id === st.param ? Object.assign({}, tk, fields) : tk) })).then(() => go('tuks', '', true));
    }
  }
  function saveDriver() {
    const name = String(st.form.name || '').trim();
    if (!name) { toast(t('needName'), true); return; }
    const isOwner = !!st.form.isOwner;
    const active = !!st.form.active;
    if (st.param === 'new') {
      if (st.data.drivers.filter(d => !d.deleted).length >= 50) { toast(t('maxReached'), true); return; }
      const pct = Fmt.parseAmount(st.form.newPct);
      mutate(data => Object.assign({}, data, { drivers: data.drivers.concat([{ id: uid('drv'), name: name, number: String(st.form.number || '').trim(), phone: String(st.form.phone || '').trim(), isOwner: isOwner, active: active, deleted: false, order: data.drivers.length + 1, pctHistory: [{ from: '1970-01-01', pct: isNaN(pct) ? data.config.defaultOwnerPct : Calc.clampPct(pct) }] }]) })).then(() => go('sdrivers', '', true));
      return;
    }
    mutate(data => Object.assign({}, data, { drivers: data.drivers.map(d => {
      if (d.id !== st.param) return d;
      let next = Object.assign({}, d, { name: name, number: String(st.form.number || '').trim(), phone: String(st.form.phone || '').trim(), isOwner: isOwner, active: active });
      const pct = Fmt.parseAmount(st.form.newPct);
      if (!isOwner && !isNaN(pct) && Calc.clampPct(pct) !== Calc.driverPct(d, today())) next = Calc.setPctFrom(next, today(), pct);
      return next;
    }) })).then(() => go('sdrivers', '', true));
  }
  function saveRules() {
    const pct = Fmt.parseAmount(st.form.defaultOwnerPct);
    if (!isNaN(pct)) st.data.config.defaultOwnerPct = Calc.clampPct(pct);
    st.data.config.tipsEnabled = !!st.form.tipsEnabled;
    persist().then(() => { toast(t('saved')); go('settings', '', true); });
  }
  function saveGoals() {
    const y = st.yearY;
    const goals = st.data.goals.filter(g => g.year !== y);
    for (let m = 1; m <= 12; m++) {
      const n = Fmt.parseAmount(st.form['m' + m]);
      goals.push({ year: y, month: m, amount: !isNaN(n) && n > 0 ? Calc.money(n) : 0 });
    }
    st.data.goals = goals;
    st.data.config.bonusMode = st.form.bonusMode === 'monthly' ? 'monthly' : 'off';
    const bonus = Fmt.parseAmount(st.form.bonusAmount);
    st.data.config.bonusAmount = !isNaN(bonus) && bonus > 0 ? Calc.money(bonus) : 0;
    persist().then(() => { toast(t('saved')); go('settings', '', true); });
  }
  function saveTypes() {
    mutate(data => Object.assign({}, data, { expenseTypes: st.form.types })).then(() => { toast(t('saved')); go('settings', '', true); });
  }
  function addType() {
    const name = String(st.form.newType || '').trim();
    if (!name) { toast(t('needName'), true); return; }
    st.form.types.push({ id: uid('type'), systemKey: '', name: name, nameCustom: true, kind: 'daily', repeatMonthly: false, defaultAmount: 0, factory: false, deleted: false, order: st.form.types.length + 1 });
    st.form.newType = '';
    render();
  }
  function delType(id) {
    const row = st.form.types.find(tp => tp.id === id);
    if (row) row.deleted = true;
    render();
  }
  function setKind(id, kind) {
    const row = st.form.types.find(tp => tp.id === id);
    if (!row) return;
    row.kind = kind === 'monthly' ? 'monthly' : 'daily';
    if (row.kind !== 'monthly') row.repeatMonthly = false;
    render();
  }
  function toggleRepeat(id) {
    const row = st.form.types.find(tp => tp.id === id);
    if (!row) return;
    row.repeatMonthly = !row.repeatMonthly;
    render();
  }
  function useAverage() {
    const res = Calc.goalsFromLastYear(st.data, st.yearY);
    st.data = res.data;
    st.formKey = '';
    const any = res.filled.some(f => f.hadData);
    persist().then(() => { toast(any ? t('averageDone') : t('averageEmpty'), !any); render(); });
  }
  function askDelete(kind) {
    const list = kind === 'tuk' ? st.data.tuks : st.data.drivers;
    const row = list.find(x => x.id === st.param);
    st.modal = { kind: 'confirm', title: t('confirmDelete', { name: row ? row.name : '' }), ok: 'do-delete', okLabel: t('delete'), which: kind };
    render();
  }
  function doDelete() {
    const which = st.modal && st.modal.which;
    const list = which === 'tuk' ? 'tuks' : 'drivers';
    const back = which === 'tuk' ? 'tuks' : 'sdrivers';
    st.modal = null;
    mutate(data => Object.assign({}, data, { [list]: data[list].map(x => x.id === st.param ? Object.assign({}, x, { deleted: true, active: false }) : x) })).then(() => go(back, '', true));
  }
  async function connectGoogle() {
    if (!st.clientId) { toast(t('noClient'), true); return; }
    try {
      await window.TMGoogle.signIn(true);
      st.profile = await Store.fetchProfile(window.TMGoogle.token());
      const ids = await Store.findExisting(force => window.TMGoogle.getToken(!!force), knownIds());
      if (ids.main) { st.pendingIds = ids; st.modal = { kind: 'cloud' }; render(); return; }
      await uploadCurrent();
    } catch (e) { toast(t('authError'), true); }
  }
  async function uploadCurrent() {
    st.busy = t('creating'); render();
    try {
      const ids = await Store.ensureFiles(force => window.TMGoogle.getToken(!!force), st.data.config.businessName, knownIds());
      localStorage.setItem('tm.sheetId', ids.main);
      localStorage.setItem('tm.backupId', ids.backup);
      localStorage.setItem('tm.mode', 'sheets');
      st.mode = 'sheets';
      st.store = Store.createSheetsStore({ getToken: force => window.TMGoogle.getToken(!!force), spreadsheetId: ids.main, backupId: ids.backup });
      await st.store.save(st.data);
      st.busy = '';
      toast(t('filesReady'));
      await maybeBackup();
      render();
    } catch (e) { st.busy = ''; toast(e.message || t('saveError'), true); render(); }
  }
  function openCloud() {
    const ids = st.pendingIds;
    st.modal = null;
    if (ids) openSheets(ids, true);
  }
  async function switchAccount() {
    try {
      window.TMGoogle.signOut();
      await window.TMGoogle.signIn(true);
      st.profile = await Store.fetchProfile(window.TMGoogle.token());
      const ids = await Store.findExisting(force => window.TMGoogle.getToken(!!force), { main: '', backup: '' });
      if (ids.main) { localStorage.setItem('tm.sheetId', ids.main); if (ids.backup) localStorage.setItem('tm.backupId', ids.backup); await openSheets(ids, true); return; }
      st.wantGoogle = true;
      localStorage.setItem('tm.wantGoogle', '1');
      st.data = Calc.emptyModel();
      st.data.config.lang = st.lang;
      st.data.config.wizardStep = 2;
      st.mode = 'pick';
      st.store = Store.createLocalStore();
      await st.store.save(st.data);
      go('onboard', '', true);
    } catch (e) { toast(t('authError'), true); }
  }
  async function clearDemo() {
    st.modal = null;
    if (st.store && st.store.clear) await st.store.clear();
    localStorage.removeItem('tm.mode');
    st.data = Calc.emptyModel();
    st.data.config.lang = st.lang;
    st.mode = st.clientId ? 'pick' : 'demo';
    st.store = Store.createLocalStore();
    go('onboard', '', true);
  }
  function fileBase() {
    const name = (st.data.config.businessName || 'tuk-manager').replace(/[^\w\-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    return name || 'tuk-manager';
  }
  function downloadFile(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  function csvEscape(value, sep) {
    const s = value == null ? '' : String(value);
    if (s.indexOf('"') >= 0 || s.indexOf('\n') >= 0 || s.indexOf(sep) >= 0) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toCsv(rows) {
    const sep = lang() === 'en' ? ',' : ';';
    return '\uFEFF' + rows.map(r => r.map(c => csvEscape(c, sep)).join(sep)).join('\r\n');
  }
  function exportMonthCsv() {
    const y = st.monthY, m = st.monthM;
    const mo = Calc.computeMonth(st.data, y, m, today());
    const rows = [[st.data.config.businessName], [Fmt.monthLong(m, lang()) + ' ' + y], [], [t('gross'), Calc.fromCents(mo.grossCents)], [t('companyIncome'), Calc.fromCents(mo.companyIncomeCents)], [t('profitLine'), Calc.fromCents(mo.profitCents)], [], [t('colDriver'), t('daysWorked'), t('billed'), t('ownerPart'), t('goalLabel')]];
    mo.byDriver.forEach(d => { if (d.days || d.grossCents) rows.push([d.name, d.days, Calc.fromCents(d.grossCents), Calc.fromCents(d.ownerShareCents), d.hitGoal ? t('hit') : '']); });
    rows.push([], [t('byTuk')]);
    mo.byTuk.forEach(tk => rows.push([tk.id ? ((Calc.tukById(st.data, tk.id) || {}).name || tk.id) : t('noTukBucket'), Calc.fromCents(tk.cents)]));
    downloadFile(fileBase() + '-' + y + '-' + String(m).padStart(2, '0') + '.csv', toCsv(rows), 'text/csv;charset=utf-8');
  }
  function exportAllCsv() {
    const rows = [[t('bizName'), st.data.config.businessName], []];
    rows.push([t('tuks')]);
    st.data.tuks.forEach(tk => rows.push([tk.name, tk.number, tk.plate, tk.fuel, tk.garageMonthly]));
    rows.push([], [t('navDrivers')]);
    st.data.drivers.forEach(d => rows.push([d.name, d.number, d.phone, d.isOwner ? t('ownerTag') : Calc.driverPct(d, today())]));
    rows.push([], [t('navDay')]);
    st.data.services.forEach(s => rows.push([s.date, (st.data.drivers.find(d => d.id === s.driverId) || {}).name || s.driverId, s.amount]));
    downloadFile(fileBase() + '-all.csv', toCsv(rows), 'text/csv;charset=utf-8');
  }

  async function openSheets(ids) {
    localStorage.setItem('tm.mode', 'sheets');
    localStorage.setItem('tm.sheetId', ids.main);
    if (ids.backup) localStorage.setItem('tm.backupId', ids.backup);
    localStorage.removeItem('tm.wantGoogle');
    st.wantGoogle = false;
    st.mode = 'sheets';
    st.readOnly = false;
    st.store = Store.createSheetsStore({ getToken: force => window.TMGoogle.getToken(!!force), spreadsheetId: ids.main, backupId: ids.backup });
    st.data = Calc.normalize(await st.store.load());
    localStorage.setItem('tm.cache.v1', JSON.stringify(st.data));
    st.ready = true;
    afterData(true);
    maybeBackup();
  }
  async function maybeBackup() {
    if (st.mode !== 'sheets' || st.readOnly || !st.store || !st.store.backup) return;
    const day = today();
    if (st.data.config.lastBackup === day) return;
    try {
      const stamped = Object.assign({}, st.data, { config: Object.assign({}, st.data.config, { lastBackup: day }) });
      await st.store.backup(stamped);
      st.data = stamped;
      await st.store.save(stamped);
      localStorage.setItem('tm.cache.v1', JSON.stringify(stamped));
      showSaveState();
    } catch (e) { toast(t('backupError'), true); }
  }
  function afterData(replace) {
    st.lang = (st.data.config && st.data.config.lang) || st.lang;
    if (!st.date) st.date = today();
    const p = Calc.isoParts(st.date);
    if (!st.monthY) { st.monthY = p.y; st.monthM = p.m; st.yearY = p.y; }
    ensureDriver();
    if (!st.data.config.onboarded) go('onboard', '', true);
    else go('day', '', replace !== false);
  }
  async function boot() {
    st.lang = localStorage.getItem('tm.lang') || 'pt';
    st.clientId = String((window.TM_CONFIG && window.TM_CONFIG.clientId) || '').trim();
    window.TMGoogle.setClientId(st.clientId);
    st.wantGoogle = localStorage.getItem('tm.wantGoogle') === '1';
    const savedMode = localStorage.getItem('tm.mode');
    const local = Store.createLocalStore();
    renderBoot();
    if (st.clientId && savedMode === 'sheets') {
      const token = await window.TMGoogle.silent();
      if (token) {
        try {
          st.profile = await Store.fetchProfile(token);
          const ids = await Store.findExisting(force => window.TMGoogle.getToken(!!force), knownIds());
          if (ids.main) { await openSheets(ids); return; }
        } catch (e) { st.bootError = e.message || String(e); }
      }
      if (!navigator.onLine) {
        try {
          const cache = localStorage.getItem('tm.cache.v1');
          if (cache) {
            st.data = Calc.normalize(JSON.parse(cache));
            st.mode = 'sheets'; st.readOnly = true; st.offline = true; st.store = local; st.ready = true;
            afterData(true); return;
          }
        } catch (e) { /* ignore */ }
      }
      st.data = Calc.emptyModel();
      st.ready = true;
      st.route = 'reconnect';
      render();
      return;
    }
    st.store = local;
    st.data = await local.load();
    st.data.config.lang = st.data.config.lang || st.lang;
    st.lang = st.data.config.lang;
    if (!st.clientId) st.mode = 'demo';
    else if (savedMode === 'demo') st.mode = 'demo';
    else if (st.data.config.onboarded) { st.mode = 'demo'; localStorage.setItem('tm.mode', 'demo'); }
    else st.mode = 'pick';
    st.ready = true;
    afterData(true);
  }

  function wire() {
    const app = document.getElementById('app');
    app.addEventListener('click', onClick);
    app.addEventListener('change', onChange);
    app.addEventListener('keydown', onKey);
    app.addEventListener('pointerdown', onDown);
    app.addEventListener('pointermove', onMove);
    app.addEventListener('pointerup', onUp);
    app.addEventListener('pointercancel', onUp);
    window.addEventListener('hashchange', () => { if (!st.ready) return; readHash(); render(); });
    window.addEventListener('online', () => { st.offline = false; if (st.readOnly) location.reload(); else { render(); scheduleSheetRefresh(); } });
    window.addEventListener('offline', () => { st.offline = true; if (st.mode === 'sheets') render(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSheetRefresh(); });
    window.addEventListener('focus', () => scheduleSheetRefresh());
  }
  let refreshTimer = 0;
  function scheduleSheetRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshFromSheet, 400);
  }
  function refreshFromSheet() {
    if (!st.ready || st.mode !== 'sheets' || st.readOnly || !st.store || !st.store.load) return;
    if (!st.data || !st.data.config.onboarded) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    saveChain = saveChain.then(async () => {
      if (!navigator.onLine) return;
      const previous = st.store.baseline ? st.store.baseline() : null;
      const fresh = await st.store.load();
      const next = previous ? Store.reconcile(st.data, previous, fresh) : fresh;
      if (Store.sameModel(st.data, next)) return;
      st.data = next;
      try { localStorage.setItem('tm.cache.v1', JSON.stringify(next)); } catch (e) { /* ignore */ }
      const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (!typing) { st.formKey = ''; render(); }
      toast(t('sheetUpdated'));
    }).catch(() => {});
  }
  wire();
  boot().catch(err => {
    console.error(err);
    const app = document.getElementById('app');
    if (app) app.innerHTML = '<div class="page"><div class="card"><h2>Tuk Manager</h2><p data-testid="crash">' + esc(err && err.message) + '</p></div></div>';
  });
})();
