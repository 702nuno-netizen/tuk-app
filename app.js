/* The Lisbon Voyager — Gestão Diária (frontend)
 * Funciona em 3 modos com a mesma interface:
 *  - PWA (GitHub Pages) → API JSON do Apps Script (doPost) com token
 *  - Apps Script (HtmlService) → google.script.run
 *  - Pré-visualização local → window.TUK_MOCK
 * Nunca guarda dados localmente: todas as ações vão diretamente à folha. */
(function () {
  'use strict';

  /* ---------------- Utilitários ---------------- */
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const DIAS_C = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const NBSP = '\u00a0';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  /** 1947 -> "1.947,00 €" */
  function eur(n, dec = 2) {
    n = Number(n) || 0;
    const neg = n < 0; const [i, d] = Math.abs(n).toFixed(dec).split('.');
    return (neg ? '−' : '') + group(i) + (dec ? ',' + d : '') + NBSP + '€';
  }
  const eur0 = n => eur(n, 0);
  /** Valor de um termo: 25 -> "25", 2.5 -> "2,50" */
  function term(n) { return Number.isInteger(n) ? group(String(n)) : eur(n).replace(NBSP + '€', ''); }
  function pct(x) { return isFinite(x) ? Math.round(x * 100) + '%' : '–'; }
  function parseNum(s) {
    s = String(s || '').replace(/[€\s\u00a0]/g, '');
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return /^\d+(\.\d+)?$|^\.\d+$/.test(s) ? Number(s) : NaN;
  }
  function lisbonToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function isoParts(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
  function isoAdd(iso, n) { const { y, m, d } = isoParts(iso); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
  function iso(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
  function dim(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function wd(isoStr) { const { y, m, d } = isoParts(isoStr); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
  function niceDate(isoStr) { const { m, d } = isoParts(isoStr); return `${d} de ${MESES[m - 1].toLowerCase()}`; }
  function vibrate(ms = 12) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }

  /* ---------------- Ícones ---------------- */
  const I = {
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
    // secções
    servicos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5V7a2 2 0 0 1 2-2h11.5a2 2 0 0 1 1.9 1.4L20 11"/><path d="M5 5v8.5M16.5 5.5 18 11"/><path d="M2.5 13.5h11.2l1.6-2.5H20a1.6 1.6 0 0 1 1.6 1.6v2.1c0 .8-.6 1.3-1.3 1.3h-.6"/><path d="M2.5 13.5v1.8c0 .6.4.9.9.9h.8M9 16.2h7"/><circle cx="6.6" cy="16.6" r="2.1"/><circle cx="18.2" cy="16.8" r="1.9"/></svg>',
    gorjetas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/></svg>',
    combustivel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3 20h12M4 10h10"/><path d="M14 8l3 3v6a1.5 1.5 0 0 0 3 0V9l-3-3"/></svg>',
    outros: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
    notas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    // navegação
    nHoje: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3.5 9.5h17"/><rect x="8" y="13" width="4" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
    nMes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    nAno: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    nObj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'
  };
  const TUK = '<svg viewBox="2 7 60 44" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d77a"/><stop offset="1" stop-color="#c9952a"/></linearGradient></defs>' +
    '<path d="M7 14 Q7 9 12 9 H43 Q49 9 51.5 14 L55.5 27 H52 L48.6 15.2 Q48 14 46.5 14 Z" fill="url(#tg)"/>' +
    '<rect x="8.6" y="13" width="3" height="19" rx="1.2" fill="#fff"/><path d="M46.6 15.5 L50 27 H44.5 L43.8 15.5 Z" fill="#fff" opacity=".42"/>' +
    '<rect x="15" y="20.5" width="13" height="11.5" rx="3" fill="#fff" opacity=".55"/>' +
    '<path d="M6.5 31 H37 Q40 31 41.5 28.6 L42.4 27 H53.5 Q58.6 27 59 32.5 L59.4 38 Q59.6 42 55.6 42 H8.5 Q4 42 4 37.8 V33.5 Q4 31 6.5 31 Z" fill="#fff"/>' +
    '<rect x="8" y="35" width="29" height="1.8" rx=".9" fill="url(#tg)"/>' +
    '<circle cx="16" cy="43" r="6.4" fill="#0d2547" stroke="#fff" stroke-width="2.4"/><circle cx="16" cy="43" r="2.3" fill="url(#tg)"/>' +
    '<circle cx="50" cy="43.4" r="5.6" fill="#0d2547" stroke="#fff" stroke-width="2.4"/><circle cx="50" cy="43.4" r="2" fill="url(#tg)"/></svg>';

  /* ---------------- API ---------------- */
  const LS = { url: 'tuk.apiUrl', token: 'tuk.token' }; // só a ligação é guardada, nunca dados
  const MODE = window.TUK_MOCK ? 'mock' : (window.google && google.script && google.script.run) ? 'gas' : 'pwa';

  function api(action, args = {}) {
    showProgress(true);
    let p;
    if (MODE === 'mock') {
      p = window.TUK_MOCK.call(action, args);
    } else if (MODE === 'gas') {
      p = new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(e => rej(new Error(e && e.message || 'Erro no servidor'))).api(action, args));
    } else {
      const url = localStorage.getItem(LS.url); const token = localStorage.getItem(LS.token);
      if (!url || !token) return Promise.reject(Object.assign(new Error('A app ainda não está ligada à folha.'), { auth: true }));
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 30000);
      p = fetch(url, { method: 'POST', body: JSON.stringify({ token, action, args }), redirect: 'follow', signal: ctrl.signal })
        .then(r => { if (!r.ok) throw new Error('O servidor respondeu ' + r.status + '.'); return r.json(); })
        .catch(e => { throw new Error(e.name === 'AbortError' ? 'Sem resposta da folha. Verifica a internet — nada foi guardado.' : (e.message && e.message.startsWith('O servidor') ? e.message : 'Sem ligação à folha. Verifica a internet — nada foi guardado.')); })
        .finally(() => clearTimeout(t));
    }
    return p.then(r => {
      if (!r || !r.ok) { const e = new Error((r && r.error) || 'Erro desconhecido.'); e.data = r && r.data; e.auth = r && r.auth === false; throw e; }
      return r.data;
    }).finally(() => showProgress(false));
  }

  /* ---------------- Estado ---------------- */
  const today = lisbonToday();
  const st = {
    tab: 'hoje', date: today, day: null, dayErr: null, newChip: null,
    mY: isoParts(today).y, mM: isoParts(today).m, month: null,
    year: isoParts(today).y, yearData: null, goals: null, config: null, settings: false
  };
  const charts = [];
  function killCharts() { while (charts.length) { try { charts.pop().destroy(); } catch (e) { } } }

  /* ---------------- Feedback ---------------- */
  let progressN = 0;
  function showProgress(on) { progressN += on ? 1 : -1; const el = $('#progress'); if (el) el.classList.toggle('on', progressN > 0); }
  let toastT;
  function toast(msg, err = false) {
    const el = $('#toast'); if (!el) return;
    el.className = 'toast' + (err ? ' err' : '');
    el.innerHTML = `<span class="t-ic">${err ? I.alert : I.check}</span><span>${esc(msg)}</span>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), err ? 4800 : 2200);
    vibrate(err ? [30, 60, 30] : 12);
  }

  /* ---------------- Estrutura base ---------------- */
  function shell() {
    $('#app').innerHTML = `
      <div class="progress" id="progress"></div>
      <div id="view"></div>
      <nav class="nav" id="nav">
        ${[['hoje', 'Hoje', I.nHoje], ['mes', 'Mês', I.nMes], ['ano', 'Ano', I.nAno], ['obj', 'Objetivos', I.nObj]].map(([k, l, ic]) =>
          `<button data-tab="${k}" aria-label="${l}"><span class="pill"></span>${ic}<span>${l}</span></button>`).join('')}
      </nav>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>
      <div id="sheet-root"></div>`;
    $('#nav').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) go(b.dataset.tab); });
  }

  function brand(sub) {
    return `<div class="brand">
      <div class="brand-logo">${TUK}</div>
      <div class="brand-txt"><div class="brand-name">The Lisbon <em>Voyager</em></div><div class="brand-sub">${esc(sub)}</div></div>
      <button class="icon-btn" data-act="settings" aria-label="Definições">${I.gear}</button>
    </div>`;
  }

  function go(tab) {
    st.settings = false; st.tab = tab;
    $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    window.scrollTo({ top: 0 });
    render(); load();
  }

  function render() {
    killCharts();
    const v = $('#view');
    if (st.settings) v.innerHTML = viewSettings();
    else if (st.tab === 'hoje') v.innerHTML = viewHoje();
    else if (st.tab === 'mes') v.innerHTML = viewMes();
    else if (st.tab === 'ano') v.innerHTML = viewAno();
    else v.innerHTML = viewObj();
    $('#nav').classList.toggle('hidden', st.settings);
    after();
  }

  function load() {
    if (st.settings) return loadConfig();
    if (st.tab === 'hoje') return loadDay();
    if (st.tab === 'mes') return loadMonth();
    if (st.tab === 'ano') return loadYear();
    return loadGoals();
  }

  function handleErr(e, where) {
    if (e.auth && MODE === 'pwa') { setup(e.message); return; }
    st[where + 'Err'] = e.message; render(); toast(e.message, true);
  }

  /* ================= HOJE ================= */
  const FIELDS = [
    { key: 'servicos', label: 'Serviços', sub: 'Um valor por serviço', quick: [20, 25, 30, 50, 80, 100] },
    { key: 'gorjetas', label: 'Gorjetas', sub: 'Gorjetas recebidas', quick: [5, 10, 15, 20] },
    { key: 'combustivel', label: 'Combustível', sub: 'Abastecimentos do dia', quick: [10, 15, 20, 30], cost: true },
    { key: 'outros', label: 'Outros gastos', sub: 'Manutenção, multas, burocracias…', quick: [], cost: true, cat: true }
  ];

  function loadDay() {
    st.dayErr = null;
    const want = st.date;
    return api('getDay', { date: want }).then(d => { if (st.date !== want) return; st.day = d; if (st.tab === 'hoje' && !st.settings) render(); })
      .catch(e => { if (st.date === want) { st.day = null; handleErr(e, 'day'); } });
  }

  function viewHoje() {
    const d = st.day && st.day.date === st.date ? st.day : null;
    const isToday = st.date === today;
    const p = isoParts(st.date);
    const head = `<header class="hero">${brand('Gestão diária · ' + p.y)}
      <div class="stepper">
        <button class="step-btn" data-act="prev" aria-label="Dia anterior">${I.left}</button>
        <label class="step-mid">
          <div class="step-k">${DIAS[wd(st.date)]}</div>
          <div class="step-v">${niceDate(st.date)}</div>
          ${isToday ? '<span class="today-pill">● Hoje</span>' : '<span class="today-pill ghost" data-act="today">↺ Voltar a hoje</span>'}
          <input type="date" id="pick" value="${st.date}" aria-label="Escolher data">
        </label>
        <button class="step-btn" data-act="next" aria-label="Dia seguinte">${I.right}</button>
      </div></header>`;
    if (!d) {
      return head + `<main class="page">${st.dayErr ? errCard(st.dayErr) : skeletonDay()}</main>`;
    }
    const status = d.servicos.zero ? ['zero', 'Dia a zero'] : d.worked ? ['work', 'Dia trabalhado'] : ['off', 'Sem serviços'];
    const ms = d.monthStrip;
    const mp = ms && ms.objetivo ? Math.min(1, ms.faturado / ms.objetivo) : 0;
    return head + `<main class="page">
      <section class="card summary">
        <div class="sum-top"><span class="sum-label">Lucro do dia</span><span class="badge ${status[0]}">${status[1]}</span></div>
        <div class="sum-big num ${d.lucro < 0 ? 'neg' : ''}" data-count="${d.lucro}">${eur(d.lucro)}</div>
        <div class="sum-row">
          <div class="mini"><div class="mini-k">Faturado</div><div class="mini-v num">${eur(d.faturado)}</div></div>
          <div class="mini gold"><div class="mini-k">Despesa</div><div class="mini-v num">${eur(d.despesa)}</div></div>
        </div>
        ${ms ? `<div class="strip">
          <div class="strip-row"><span>${esc(ms.month)} · <b class="num">${eur(ms.faturado)}</b> de ${eur0(ms.objetivo)}</span><b class="num">${pct(ms.objetivo ? ms.faturado / ms.objetivo : NaN)}</b></div>
          <div class="bar"><i style="--w:${(mp * 100).toFixed(1)}%"></i></div>
        </div>` : ''}
      </section>
      ${FIELDS.map(f => fieldCard(f, d)).join('')}
      <section class="card">
        <div class="card-h"><div class="card-ic">${I.notas}</div><div class="card-t"><div class="card-title">Notas</div><div class="card-sub">Descritivo do dia (coluna Notas)</div></div></div>
        <textarea id="notes" placeholder="Ex.: TRF aeroporto, casamento, obras…" maxlength="500">${esc(d.notas)}</textarea>
        <div class="notes-foot"><span class="saved-hint" id="notes-hint">${d.notas ? 'Guardado na folha' : ''}</span>
          <button class="btn btn-primary hidden" id="notes-save" data-act="notes">Guardar nota</button></div>
      </section>
      <p class="muted" style="text-align:center;font-size:12.5px;margin:6px 0 0">${esc(d.tab)} · linha ${d.row} · grava diretamente na folha</p>
    </main>`;
  }

  function fieldCard(f, d) {
    const c = d[f.key];
    const chips = c.terms.map((t, i) => {
      const isNew = st.newChip && st.newChip.f === f.key && st.newChip.i === i;
      return (i ? '<span class="plus">+</span>' : '') + (t.v === null
        ? `<button class="chip custom" data-act="term" data-f="${f.key}" data-i="${i}">fórmula ${eur(t.value || 0)}</button>`
        : `<button class="chip num${isNew ? ' new' : ''}" data-act="term" data-f="${f.key}" data-i="${i}" style="animation-delay:${Math.min(i, 8) * 25}ms">${term(t.v)}${I.pen}</button>`);
    }).join('');
    const isZero = f.key === 'servicos' && c.zero;
    let body = '';
    if (isZero) {
      body += `<div class="zero-box"><div class="z-ic">0€</div><div class="z-t"><b>Dia a zero</b>Foste trabalhar, mas sem faturar. Conta como dia trabalhado.</div><button class="link-btn" data-act="unzero">Anular</button></div>`;
    } else if (c.terms.length) {
      body += `<div class="chips">${chips}</div>`;
    } else {
      body += `<p class="empty-line">${f.cost ? 'Sem gastos registados.' : 'Ainda sem valores neste dia.'}</p>`;
    }
    body += `<div class="add-row">
        <div class="money"><input id="in-${f.key}" inputmode="decimal" enterkeyhint="done" autocomplete="off" placeholder="Valor" aria-label="Valor de ${f.label}"><span>€</span></div>
        <button class="btn ${f.cost ? 'btn-gold' : 'btn-primary'}" data-act="add" data-f="${f.key}">${I.plus}Adicionar</button>
      </div>`;
    if (f.quick.length) body += `<div class="quick">${f.quick.map(q => `<button class="q" data-act="quick" data-f="${f.key}" data-v="${q}">${q} €</button>`).join('')}</div>`;
    if (f.key === 'servicos' && c.empty) body += `<button class="zero-btn" data-act="zero"><span>Dia a zero</span><small>· fui trabalhar, 0 €</small></button>`;
    if (f.cat) {
      const cats = d.categories || [];
      body += `<div class="cats"><span class="cats-l">Categoria da despesa</span>${cats.map(cn => `<button class="cat${d.categoria === cn ? ' on' : ''}" data-act="cat" data-c="${esc(cn)}">${esc(cn)}</button>`).join('')}</div>`;
    }
    return `<section class="card" id="card-${f.key}">
      <div class="card-h"><div class="card-ic${f.cost ? ' gold' : ''}">${I[f.key]}</div>
        <div class="card-t"><div class="card-title">${f.label}</div><div class="card-sub">${f.sub}</div></div>
        <div class="card-total num">${eur(c.total)}</div></div>
      ${body}</section>`;
  }

  function skeletonDay() {
    return `<section class="card summary"><div class="sk" style="height:18px;width:40%"></div><div class="sk" style="height:42px;width:65%;margin-top:12px"></div>
      <div class="sum-row"><div class="sk" style="height:62px"></div><div class="sk" style="height:62px"></div></div></section>
      ${[1, 2, 3].map(() => `<section class="card"><div class="sk" style="height:42px;width:55%"></div><div class="sk" style="height:56px;margin-top:14px"></div></section>`).join('')}`;
  }
  function errCard(msg) {
    return `<section class="card err-card"><b>Não foi possível ler a folha</b><p class="muted">${esc(msg)}</p><button class="btn btn-primary" data-act="retry">Tentar outra vez</button></section>`;
  }

  /** Executa uma escrita e atualiza o dia com o que a folha devolveu. */
  function write(action, args, btn, okMsg) {
    if (btn) btn.classList.add('busy');
    return api(action, Object.assign({ date: st.date }, args)).then(d => {
      st.day = d; render(); toast(okMsg); return d;
    }).catch(e => {
      if (e.data && e.data.date) { st.day = Object.assign({}, st.day, e.data); render(); }
      if (btn) btn.classList.remove('busy');
      toast(e.message, true); throw e;
    });
  }

  function addTerm(f, btn) {
    const inp = $('#in-' + f); const raw = inp.value.trim();
    const n = parseNum(raw);
    if (!raw || !(n > 0)) { toast('Escreve um valor maior que zero (ex.: 25 ou 2,5).', true); inp.focus(); return; }
    const c = st.day[f];
    const label = FIELDS.find(x => x.key === f).label;
    write('addTerm', { field: f, value: raw, expect: c.formula }, btn, `${eur(n)} adicionado a ${label}`)
      .then(d => { st.newChip = { f, i: d[f].terms.length - 1 }; render(); setTimeout(() => { st.newChip = null; }, 50); })
      .catch(() => { });
  }

  /* Folha inferior para editar/remover termo */
  function openTermSheet(f, i) {
    const c = st.day[f]; const t = c.terms[i]; if (!t) return;
    const label = FIELDS.find(x => x.key === f).label;
    const lastService = f === 'servicos' && c.terms.length === 1;
    const root = $('#sheet-root');
    root.innerHTML = `<div class="sheet-bg" data-act="close"></div>
      <div class="sheet" role="dialog" aria-label="Editar valor"><div class="grab"></div>
        <h3>${label} · ${t.v === null ? 'fórmula da folha' : term(t.v) + ' €'}</h3>
        <p>${t.v === null ? 'Esta célula tem uma fórmula feita à mão (' + esc(t.raw) + '). Podes substituí-la por um valor ou removê-la.' : 'Corrige o valor ou remove-o da soma.'}${lastService ? ' Se removeres o único serviço, o dia deixa de contar como trabalhado.' : ''}</p>
        <div class="money"><input id="edit-val" inputmode="decimal" value="${t.v === null ? '' : String(t.v).replace('.', ',')}" placeholder="Novo valor"><span>€</span></div>
        <div class="btns"><button class="btn btn-danger" data-act="del" data-f="${f}" data-i="${i}">Remover</button>
          <button class="btn btn-primary" data-act="save-term" data-f="${f}" data-i="${i}">Guardar</button></div>
      </div>`;
    requestAnimationFrame(() => { $('.sheet-bg', root).classList.add('show'); $('.sheet', root).classList.add('show'); });
  }
  function closeSheet() {
    const root = $('#sheet-root'); const s = $('.sheet', root); if (!s) return;
    s.classList.remove('show'); $('.sheet-bg', root).classList.remove('show');
    setTimeout(() => { root.innerHTML = ''; }, 300);
  }

  /* ================= MÊS ================= */
  function loadMonth() {
    st.monthErr = null; const y = st.mY, m = st.mM;
    return api('getMonth', { year: y, month: m }).then(d => { if (st.mY !== y || st.mM !== m) return; st.month = d; if (st.tab === 'mes' && !st.settings) render(); })
      .catch(e => handleErr(e, 'month'));
  }
  function monthStats(md) {
    const days = md.days;
    const sum = k => days.reduce((a, d) => a + (d[k] || 0), 0);
    const fat = sum('faturado'), desp = sum('despesa'), lucro = sum('lucro'), gorj = sum('gorjetas');
    const dias = days.filter(d => d.worked).length;
    const media = dias ? fat / dias : 0;
    const obj = md.objetivo || 0;
    const t = isoParts(today);
    let remaining;
    const isCur = md.year === t.y && md.month === t.m;
    const isPast = md.year < t.y || (md.year === t.y && md.month < t.m);
    if (isCur) { const td = days[t.d - 1]; remaining = dim(md.year, md.month) - t.d + (td && td.worked ? 0 : 1); }
    else remaining = isPast ? 0 : dim(md.year, md.month);
    const falta = Math.max(0, obj - fat);
    return { fat, desp, lucro, gorj, dias, media, obj, pct: obj ? fat / obj : NaN, falta, remaining, perDay: remaining ? falta / remaining : 0, isCur, isPast };
  }
  function viewMes() {
    const head = `<header class="hero">${brand('Resumo do mês')}
      <div class="stepper">
        <button class="step-btn" data-act="mprev" aria-label="Mês anterior">${I.left}</button>
        <label class="step-mid"><div class="step-k">${st.mY}</div><div class="step-v">${MESES[st.mM - 1]}</div>
          <input type="month" id="mpick" value="${st.mY}-${String(st.mM).padStart(2, '0')}" aria-label="Escolher mês"></label>
        <button class="step-btn" data-act="mnext" aria-label="Mês seguinte">${I.right}</button>
      </div></header>`;
    const md = st.month && st.month.year === st.mY && st.month.month === st.mM ? st.month : null;
    if (!md) return head + `<main class="page">${st.monthErr ? errCard(st.monthErr) : skeletonDay()}</main>`;
    const s = monthStats(md);
    const C = 2 * Math.PI * 50; const off = C * (1 - Math.min(1, s.pct || 0));
    let need;
    if (s.fat >= s.obj && s.obj) need = `<div class="need"><div class="need-k">Objetivo atingido 🎉</div><div class="need-v num">+${eur(s.fat - s.obj)}</div><div class="need-s">acima do objetivo de ${eur0(s.obj)}</div></div>`;
    else if (s.isPast) need = `<div class="need"><div class="need-k">Ficou a faltar</div><div class="need-v num">${eur(s.falta)}</div><div class="need-s">para o objetivo de ${eur0(s.obj)}</div></div>`;
    else need = `<div class="need"><div class="need-k">Para chegar ao objetivo</div><div class="need-v num">${eur(s.perDay)} / dia</div><div class="need-s">Faltam ${eur(s.falta)} em ${s.remaining} ${s.remaining === 1 ? 'dia' : 'dias'}${s.isCur ? ' (incluindo hoje)' : ''}</div></div>`;
    const t = isoParts(today);
    return head + `<main class="page">
      <section class="card summary">
        <div class="goal-card">
          <div class="ring"><svg viewBox="0 0 120 120"><defs><linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0cf6e"/><stop offset="1" stop-color="#c9952a"/></linearGradient></defs>
            <circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${off}"/></svg>
            <div class="ring-c"><div><b class="num">${pct(s.pct)}</b><small>do objetivo</small></div></div></div>
          <div class="goal-info">
            <div class="goal-line"><span>Faturado</span><b class="num">${eur(s.fat)}</b></div>
            <div class="goal-line"><span>Objetivo</span><b class="num">${eur(s.obj)}</b></div>
            <div class="goal-line"><span>Falta</span><b class="num">${eur(s.falta)}</b></div>
          </div>
        </div>
        ${need}
      </section>
      <div class="kpis">
        <div class="kpi"><div class="kpi-k"><i></i>Lucro</div><div class="kpi-v num">${eur(s.lucro)}</div></div>
        <div class="kpi"><div class="kpi-k"><i style="background:var(--g500)"></i>Despesas</div><div class="kpi-v num">${eur(s.desp)}</div></div>
        <div class="kpi"><div class="kpi-k"><i style="background:var(--b300)"></i>Dias trabalhados</div><div class="kpi-v num">${s.dias}</div></div>
        <div class="kpi"><div class="kpi-k"><i style="background:var(--b800)"></i>Média diária</div><div class="kpi-v num">${eur(s.media)}</div></div>
      </div>
      <div class="sec-title">Faturado por dia</div>
      <section class="card">
        <div class="chart-box tall"><canvas id="ch-month"></canvas></div>
        <div class="legend"><span><i style="background:#2a63ad"></i>Faturado do dia</span><span><i style="background:#d4a537"></i>Acumulado</span><span><i style="background:#8b97aa"></i>Objetivo</span></div>
      </section>
      <div class="sec-title">Dias</div>
      <section class="card" style="padding:6px 14px">
        <div class="days">${md.days.map(dd => {
          const isT = md.year === t.y && md.month === t.m && dd.day === t.d;
          const w = DIAS_C[wd(iso(md.year, md.month, dd.day))];
          const zero = dd.worked && dd.faturado === 0;
          const sub = [dd.worked ? (zero ? 'Dia a zero' : 'Lucro ' + eur(dd.lucro)) : 'Sem serviços', dd.notas].filter(Boolean).join(' · ');
          return `<button class="dayrow${dd.worked ? '' : ' off'}${isT ? ' today' : ''}" data-act="openday" data-d="${dd.day}">
            <div class="dnum"><div><b>${dd.day}</b><small>${w}</small></div></div>
            <div class="dmid"><b>${dd.worked ? (zero ? '0 € faturado' : eur(dd.faturado) + ' faturado') : (dd.notas ? 'Folga' : '—')}</b><span>${esc(sub)}</span></div>
            <div class="dright num${dd.worked ? '' : ' off'}">${dd.despesa ? '−' + eur(dd.despesa) : ''}</div>
          </button>`;
        }).join('')}</div>
      </section>
    </main>`;
  }

  /* ================= ANO ================= */
  function loadYear() {
    st.anoErr = null; const y = st.year;
    return api('getYear', { year: y }).then(d => { if (st.year !== y) return; st.yearData = d; if (st.tab === 'ano' && !st.settings) render(); })
      .catch(e => handleErr(e, 'ano'));
  }
  function viewAno() {
    const head = `<header class="hero">${brand('Resumo anual')}
      <div class="stepper">
        <button class="step-btn" data-act="yprev" aria-label="Ano anterior">${I.left}</button>
        <div class="step-mid"><div class="step-k">Ano</div><div class="step-v">${st.year}</div></div>
        <button class="step-btn" data-act="ynext" aria-label="Ano seguinte">${I.right}</button>
      </div></header>`;
    const yd = st.yearData && st.yearData.year === st.year ? st.yearData : null;
    if (!yd) return head + `<main class="page">${st.anoErr ? errCard(st.anoErr) : skeletonDay()}</main>`;
    const S = k => yd.months.reduce((a, m) => a + m[k], 0);
    const fat = S('faturado'), obj = S('objetivo'), lucro = S('lucro'), desp = S('despesas'), dias = S('dias'), gorj = S('gorjetas');
    const p = obj ? fat / obj : NaN;
    return head + `<main class="page">
      <section class="card summary">
        <div class="sum-top"><span class="sum-label">Faturado em ${st.year}</span><span class="badge zero">${pct(p)} do objetivo</span></div>
        <div class="sum-big num">${eur(fat)}</div>
        <div class="strip" style="border:0;padding-top:4px;margin-top:8px">
          <div class="strip-row"><span>Objetivo anual <b class="num">${eur(obj)}</b></span><span>Falta <b class="num">${eur(Math.max(0, obj - fat))}</b></span></div>
          <div class="bar"><i style="--w:${Math.min(100, (p || 0) * 100).toFixed(1)}%"></i></div>
        </div>
      </section>
      <div class="kpis">
        <div class="kpi"><div class="kpi-k"><i></i>Lucro</div><div class="kpi-v num">${eur(lucro)}</div></div>
        <div class="kpi"><div class="kpi-k"><i style="background:var(--g500)"></i>Despesas</div><div class="kpi-v num">${eur(desp)}</div></div>
        <div class="kpi"><div class="kpi-k"><i style="background:var(--b300)"></i>Dias trabalhados</div><div class="kpi-v num">${dias}</div></div>
        <div class="kpi"><div class="kpi-k"><i style="background:var(--b800)"></i>Média por dia</div><div class="kpi-v num">${eur(dias ? fat / dias : 0)}</div></div>
        <div class="kpi wide"><div class="kpi-k"><i style="background:var(--g400)"></i>Gorjetas no ano</div><div class="kpi-v num">${eur(gorj)}</div></div>
      </div>
      <div class="sec-title">Faturado vs objetivo</div>
      <section class="card"><div class="chart-box"><canvas id="ch-fo"></canvas></div>
        <div class="legend"><span><i style="background:#2a63ad"></i>Faturado</span><span><i style="background:#d4a537"></i>Objetivo</span></div></section>
      <div class="sec-title">Lucro por mês</div>
      <section class="card"><div class="chart-box"><canvas id="ch-lucro"></canvas></div></section>
      <div class="sec-title">Despesas por categoria</div>
      <section class="card"><div class="chart-box" style="height:230px"><canvas id="ch-cat"></canvas></div><div class="legend" id="cat-legend"></div></section>
      <div class="sec-title">Média diária por mês</div>
      <section class="card"><div class="chart-box"><canvas id="ch-media"></canvas></div></section>
    </main>`;
  }

  /* ================= OBJETIVOS ================= */
  function loadGoals() {
    st.objErr = null; const y = st.year;
    return api('getGoals', { year: y }).then(d => { if (st.year !== y) return; st.goals = d; if (st.tab === 'obj' && !st.settings) render(); })
      .catch(e => handleErr(e, 'obj'));
  }
  function viewObj() {
    const head = `<header class="hero">${brand('Objetivos mensais')}
      <div class="stepper">
        <button class="step-btn" data-act="yprev" aria-label="Ano anterior">${I.left}</button>
        <div class="step-mid"><div class="step-k">Objetivos de</div><div class="step-v">${st.year}</div></div>
        <button class="step-btn" data-act="ynext" aria-label="Ano seguinte">${I.right}</button>
      </div></header>`;
    const g = st.goals && st.goals.year === st.year ? st.goals : null;
    if (!g) return head + `<main class="page">${st.objErr ? errCard(st.objErr) : skeletonDay()}</main>`;
    const t = isoParts(today);
    const total = g.goals.reduce((a, x) => a + x.objetivo, 0);
    const fat = g.goals.reduce((a, x) => a + x.faturado, 0);
    return head + `<main class="page">
      <section class="card summary">
        <div class="sum-top"><span class="sum-label">Objetivo anual</span><span class="badge zero">${pct(total ? fat / total : NaN)} atingido</span></div>
        <div class="sum-big num" id="goal-total">${eur(total)}</div>
        <div class="strip-row" style="margin-top:8px"><span>Faturado <b class="num">${eur(fat)}</b></span><span>Falta <b class="num">${eur(Math.max(0, total - fat))}</b></span></div>
        <div class="bar"><i style="--w:${Math.min(100, total ? fat / total * 100 : 0).toFixed(1)}%"></i></div>
      </section>
      <section class="card" style="padding:4px 16px">
        ${g.goals.map((x, i) => {
          const p = x.objetivo ? Math.min(1, x.faturado / x.objetivo) : 0;
          return `<div class="goal-row${g.year === t.y && i + 1 === t.m ? ' cur' : ''}">
            <div class="gm"><b>${MESES[i]}</b><span class="num">${eur(x.faturado)} · ${pct(x.objetivo ? x.faturado / x.objetivo : NaN)}</span><div class="bar${p >= 1 ? '' : ' blue'}"><i style="--w:${(p * 100).toFixed(1)}%"></i></div></div>
            <div class="money"><input class="goal-in num" data-i="${i}" inputmode="decimal" value="${String(x.objetivo).replace('.', ',')}" aria-label="Objetivo de ${MESES[i]}"><span>€</span></div>
          </div>`;
        }).join('')}
      </section>
      <div class="sticky-save" id="save-wrap"><button class="btn btn-gold btn-block" data-act="save-goals" id="save-goals">Guardar objetivos</button></div>
      <p class="muted" style="text-align:center;font-size:12.5px;padding-bottom:64px">Só altera a coluna Objetivo (K8:K19) do Painel.</p>
    </main>`;
  }

  /* ================= DEFINIÇÕES ================= */
  function loadConfig() {
    return api('getConfig').then(c => { st.config = c; if (st.settings) render(); }).catch(e => { st.cfgErr = e.message; if (st.settings) render(); });
  }
  function viewSettings() {
    const c = st.config;
    const det = c && c.details ? c.details : [];
    const ins = st.inspect;
    return `<header class="hero" style="padding-bottom:58px">
      <div class="brand"><button class="icon-btn" data-act="back" aria-label="Voltar">${I.back}</button>
        <div class="brand-txt"><div class="brand-name">Definições</div><div class="brand-sub">The Lisbon Voyager</div></div><div class="brand-logo">${TUK}</div></div>
    </header>
    <main class="page">
      <section class="card summary">
        <div class="card-h"><div class="card-ic gold">${I.notas}</div><div class="card-t"><div class="card-title">Folha em uso</div><div class="card-sub">A app escreve só nesta folha, uma por ano</div></div></div>
        ${!c ? (st.cfgErr ? `<p class="muted">${esc(st.cfgErr)}</p>` : '<div class="sk" style="height:64px"></div>') :
          det.map(d => `<div class="sheet-row">
            <div class="year-tag">${d.year}</div>
            <div class="sr-mid"><b>${d.error ? 'Folha indisponível' : esc(d.title)}</b><span>${d.error ? esc(d.error) : 'ID ' + esc(d.id.slice(0, 10)) + '…'}</span></div>
            <a class="open-link" href="${esc(d.url)}" target="_blank" rel="noopener">Abrir folha ↗</a>
          </div>`).join('') + `<button class="btn btn-ghost btn-block" style="margin-top:6px" data-act="test">Testar ligação</button><div id="test-out"></div>`}
      </section>
      <section class="card">
        <div class="card-h"><div class="card-ic">${I.pen}</div><div class="card-t"><div class="card-title">Trocar ou adicionar folha</div><div class="card-sub">Cola o link do Google Sheets ou do Drive, ou só o ID</div></div></div>
        <div class="field" style="margin-bottom:10px"><input id="link-in" placeholder="https://docs.google.com/spreadsheets/d/…" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(st.linkDraft || '')}"></div>
        <button class="btn btn-primary btn-block" data-act="inspect">Verificar folha</button>
        ${ins ? `<div class="confirm">
          <div class="cf-top"><div class="cf-ic">${I.check}</div><div><b>«${esc(ins.title)}»</b><span>Ano ${ins.year} · ${ins.tabs} separadores · estrutura confirmada</span></div></div>
          ${c && c.sheets[ins.year] && c.sheets[ins.year] !== ins.id ? `<p class="cf-warn">Vai substituir a folha atual de ${ins.year} (${esc((det.find(d => d.year === ins.year) || {}).title || '')}). A folha antiga não é alterada.</p>` : ''}
          ${c && c.sheets[ins.year] === ins.id ? `<p class="cf-warn" style="background:var(--b50);color:var(--b700)">Esta já é a folha em uso para ${ins.year}.</p>` : ''}
          <div class="btns"><button class="btn btn-ghost" data-act="inspect-cancel">Cancelar</button>
            <button class="btn btn-gold" data-act="use-sheet" ${c && c.sheets[ins.year] === ins.id ? 'disabled' : ''}>Usar para ${ins.year}</button></div>
        </div>` : ''}
      </section>
      ${MODE === 'pwa' ? `<section class="card">
        <div class="card-h"><div class="card-ic">${I.gear}</div><div class="card-t"><div class="card-title">Ligação ao Apps Script</div><div class="card-sub">Guardada só neste telemóvel</div></div></div>
        <div class="field"><label>URL da app web (/exec)</label><input id="set-url" value="${esc(localStorage.getItem(LS.url) || '')}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off"></div>
        <div class="field"><label>Token secreto</label><input id="set-token" type="password" value="${esc(localStorage.getItem(LS.token) || '')}" autocomplete="off"></div>
        <button class="btn btn-ghost btn-block" data-act="save-conn">Guardar ligação</button>
      </section>` : ''}
      <section class="card"><p class="muted" style="margin:0">A app nunca guarda dados no telemóvel: cada valor é escrito de imediato na folha do Google. Só escreve nas colunas Serviços, Gorjetas, Combustível, Outros gastos, Categoria e Notas, e nos objetivos do Painel.</p></section>
    </main>`;
  }

  /* ================= Ecrã de ligação (PWA) ================= */
  function setup(msg) {
    $('#app').innerHTML = `<div class="setup">
      <img class="logo-xl" src="icons/icon-192.png" alt="">
      <h1>The Lisbon <em>Voyager</em></h1><p>Liga a app à tua folha do Google</p>
      <section class="card">
        ${msg ? `<div class="test-out err" style="margin:0 0 14px">${esc(msg)}</div>` : ''}
        <div class="field"><label>URL da app web (/exec)</label><input id="s-url" value="${esc(localStorage.getItem(LS.url) || '')}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off"></div>
        <div class="field"><label>Token secreto</label><input id="s-token" type="password" value="" autocomplete="off"></div>
        <button class="btn btn-gold btn-block" id="s-go">Ligar</button>
      </section></div>`;
    $('#s-go').onclick = () => {
      const u = $('#s-url').value.trim(), t = $('#s-token').value.trim();
      if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(u)) { setup('O URL deve terminar em /exec (copiado da implementação do Apps Script).'); return; }
      localStorage.setItem(LS.url, u); localStorage.setItem(LS.token, t);
      $('#s-go').classList.add('busy');
      api('ping').then(() => { start(); toast('Ligado à folha'); }).catch(e => setup(e.message));
    };
  }

  /* ================= Pós-render: charts, animações, eventos de input ================= */
  function after() {
    requestAnimationFrame(() => {
      $$('.bar>i').forEach(i => { i.style.width = i.style.getPropertyValue('--w'); });
      const ring = $('.ring .fg'); if (ring) ring.style.strokeDashoffset = ring.dataset.off;
    });
    $$('.money input[id^="in-"]').forEach(inp => inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); const f = inp.id.slice(3); addTerm(f, $(`[data-act=add][data-f=${f}]`)); }
    }));
    const pick = $('#pick'); if (pick) pick.addEventListener('change', () => { if (pick.value) setDate(pick.value); });
    const mpick = $('#mpick'); if (mpick) mpick.addEventListener('change', () => { if (mpick.value) { const [y, m] = mpick.value.split('-').map(Number); st.mY = y; st.mM = m; render(); loadMonth(); } });
    const notes = $('#notes');
    if (notes) {
      const orig = st.day ? st.day.notas : '';
      notes.addEventListener('input', () => { $('#notes-save').classList.toggle('hidden', notes.value.trim() === orig.trim()); $('#notes-hint').textContent = notes.value.trim() === orig.trim() ? (orig ? 'Guardado na folha' : '') : 'Por guardar'; });
      notes.addEventListener('blur', () => { if (notes.value.trim() !== orig.trim()) setTimeout(() => { if (document.activeElement !== $('#notes-save')) saveNotes(); }, 150); });
    }
    $$('.goal-in').forEach(inp => inp.addEventListener('input', () => {
      let tot = 0, ok = true, changed = false;
      $$('.goal-in').forEach((x, i) => { const n = parseNum(x.value); if (isNaN(n)) ok = false; else tot += n; if (n !== st.goals.goals[i].objetivo) changed = true; });
      $('#goal-total').textContent = ok ? eur(tot) : '—';
      $('#save-wrap').classList.toggle('show', ok && changed);
    }));
    if (window.Chart) drawCharts();
    const big = $('.sum-big[data-count]'); if (big) countUp(big, Number(big.dataset.count));
  }
  let lastCount = {};
  function countUp(el, to) {
    const key = st.date; const from = lastCount[key] != null ? lastCount[key] : 0; lastCount[key] = to;
    if (from === to) return; const t0 = performance.now(), dur = 600;
    const step = now => { const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = eur(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  let saving = false;
  function saveNotes() {
    const notes = $('#notes'); if (!notes || saving) return; saving = true;
    write('setNotes', { notes: notes.value }, $('#notes-save'), notes.value.trim() ? 'Nota guardada' : 'Nota apagada').catch(() => { }).finally(() => { saving = false; });
  }

  function setDate(d) { st.date = d; st.dayErr = null; render(); loadDay(); }

  /* Charts */
  function baseOpts() {
    Chart.defaults.font.family = "Inter, system-ui, sans-serif"; Chart.defaults.font.size = 11.5; Chart.defaults.color = '#5d6a80';
    return {
      responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0b2142', padding: 10, cornerRadius: 10, titleFont: { weight: '700' }, callbacks: { label: c => ' ' + (c.dataset.label ? c.dataset.label + ': ' : '') + eur(c.parsed.y != null ? c.parsed.y : c.parsed) } } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: false, font: { size: 10.5 } } },
        y: { grid: { color: '#edf1f7' }, border: { display: false }, ticks: { callback: v => eur0(v), maxTicksLimit: 5 } }
      }
    };
  }
  function grad(ctx, a, b) { const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function drawCharts() {
    if (st.tab === 'mes' && $('#ch-month') && st.month) {
      const md = st.month; const ctx = $('#ch-month').getContext('2d');
      let acc = 0; const t = isoParts(today);
      const isCur = md.year === t.y && md.month === t.m;
      const cum = md.days.map(d => { acc += d.faturado; return (isCur && d.day > t.d) ? null : acc; });
      const o = baseOpts();
      o.scales.y.position = 'left';
      o.scales.y2 = { position: 'right', grid: { display: false }, border: { display: false }, ticks: { callback: v => eur0(v), maxTicksLimit: 5, color: '#b8861f' }, min: 0, suggestedMax: Math.max(md.objetivo || 0, acc) * 1.05 };
      o.scales.x.ticks = { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 };
      charts.push(new Chart(ctx, {
        data: {
          labels: md.days.map(d => d.day),
          datasets: [
            { type: 'line', label: 'Objetivo', data: md.days.map(() => md.objetivo), yAxisID: 'y2', borderColor: '#8b97aa', borderDash: [6, 5], borderWidth: 1.6, pointRadius: 0, order: 0 },
            { type: 'line', label: 'Acumulado', data: cum, yAxisID: 'y2', borderColor: '#d4a537', backgroundColor: 'rgba(212,165,55,.10)', fill: true, tension: .32, borderWidth: 3, pointRadius: 0, pointHoverRadius: 5, order: 1 },
            { type: 'bar', label: 'Faturado', data: md.days.map(d => d.faturado || null), yAxisID: 'y', backgroundColor: grad(ctx, '#3a76c4', '#1f4e8c'), borderRadius: 6, maxBarThickness: 12, order: 2 }
          ]
        }, options: o
      }));
    }
    if (st.tab === 'ano' && st.yearData && $('#ch-fo')) {
      const yd = st.yearData; const lab = MES_C.map(m => m.charAt(0).toUpperCase() + m.slice(1));
      const ctx1 = $('#ch-fo').getContext('2d');
      const o1 = baseOpts(); o1.plugins.tooltip.mode = 'index'; o1.plugins.tooltip.intersect = false;
      charts.push(new Chart(ctx1, {
        type: 'bar', data: {
          labels: lab, datasets: [
            { label: 'Faturado', data: yd.months.map(m => m.faturado), backgroundColor: grad(ctx1, '#3a76c4', '#1f4e8c'), borderRadius: 6, maxBarThickness: 16 },
            { label: 'Objetivo', data: yd.months.map(m => m.objetivo), backgroundColor: 'rgba(212,165,55,.35)', borderColor: '#d4a537', borderWidth: { top: 2.5, left: 0, right: 0, bottom: 0 }, borderSkipped: false, borderRadius: 6, maxBarThickness: 16 }
          ]
        }, options: o1
      }));
      const ctx2 = $('#ch-lucro').getContext('2d');
      charts.push(new Chart(ctx2, {
        type: 'bar', data: { labels: lab, datasets: [{ label: 'Lucro', data: yd.months.map(m => m.lucro), backgroundColor: yd.months.map(m => m.lucro >= Math.max(...yd.months.map(x => x.lucro)) ? '#d4a537' : '#2a63ad'), borderRadius: 7, maxBarThickness: 20 }] }, options: baseOpts()
      }));
      const cats = yd.categories.filter(c => c.value > 0);
      const cols = ['#1f4e8c', '#d4a537', '#8fb0dc', '#0b2142', '#e8c25a', '#5d6a80'];
      const o3 = baseOpts(); delete o3.scales; o3.cutout = '68%'; o3.plugins.tooltip.callbacks = { label: c => ' ' + c.label + ': ' + eur(c.parsed) };
      charts.push(new Chart($('#ch-cat'), { type: 'doughnut', data: { labels: cats.map(c => c.name), datasets: [{ data: cats.map(c => c.value), backgroundColor: cols, borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }] }, options: o3 }));
      const tot = cats.reduce((a, c) => a + c.value, 0);
      $('#cat-legend').innerHTML = cats.map((c, i) => `<span><i style="background:${cols[i]}"></i>${esc(c.name)} · ${eur0(c.value)} (${pct(c.value / tot)})</span>`).join('') || '<span>Sem despesas.</span>';
      const ctx4 = $('#ch-media').getContext('2d');
      charts.push(new Chart(ctx4, {
        type: 'line', data: { labels: lab, datasets: [{ label: 'Média diária', data: yd.months.map(m => m.dias ? m.media : null), borderColor: '#1f4e8c', backgroundColor: grad(ctx4, 'rgba(42,99,173,.28)', 'rgba(42,99,173,0)'), fill: true, tension: .35, borderWidth: 3, pointBackgroundColor: '#fff', pointBorderColor: '#d4a537', pointBorderWidth: 2.5, pointRadius: 4.5 }] }, options: baseOpts()
      }));
    }
  }

  /* ================= Eventos (delegação) ================= */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act; const f = b.dataset.f;
    switch (a) {
      case 'prev': vibrate(6); setDate(isoAdd(st.date, -1)); break;
      case 'next': vibrate(6); setDate(isoAdd(st.date, 1)); break;
      case 'today': e.preventDefault(); setDate(today); break;
      case 'retry': render(); load(); break;
      case 'add': addTerm(f, b); break;
      case 'quick': { const inp = $('#in-' + f); inp.value = b.dataset.v; inp.focus(); vibrate(6); break; }
      case 'term': openTermSheet(f, Number(b.dataset.i)); break;
      case 'close': closeSheet(); break;
      case 'del': {
        const i = Number(b.dataset.i); const t = st.day[f].terms[i];
        closeSheet(); write('removeTerm', { field: f, index: i, expect: st.day[f].formula }, null, `${t.v === null ? 'Fórmula' : eur(t.v)} removido`).catch(() => { });
        break;
      }
      case 'save-term': {
        const i = Number(b.dataset.i); const v = $('#edit-val').value.trim(); const n = parseNum(v);
        if (!(n > 0)) { toast('Valor inválido.', true); return; }
        closeSheet(); write('editTerm', { field: f, index: i, value: v, expect: st.day[f].formula }, null, `Alterado para ${eur(n)}`).catch(() => { });
        break;
      }
      case 'zero': write('setZero', { on: true }, b, 'Dia a zero registado').catch(() => { }); break;
      case 'unzero': write('setZero', { on: false }, b, 'Dia a zero anulado').catch(() => { }); break;
      case 'cat': {
        const c = b.dataset.c; const off = st.day.categoria === c;
        $$('.cat').forEach(x => x.classList.toggle('on', !off && x === b));
        write('setCategory', { category: off ? '' : c }, null, off ? 'Categoria removida' : 'Categoria: ' + c).catch(() => { });
        break;
      }
      case 'notes': saveNotes(); break;
      case 'openday': st.tab = 'hoje'; $$('#nav button').forEach(x => x.classList.toggle('on', x.dataset.tab === 'hoje')); window.scrollTo({ top: 0 }); setDate(iso(st.month.year, st.month.month, Number(b.dataset.d))); break;
      case 'mprev': st.mM--; if (st.mM < 1) { st.mM = 12; st.mY--; } render(); loadMonth(); break;
      case 'mnext': st.mM++; if (st.mM > 12) { st.mM = 1; st.mY++; } render(); loadMonth(); break;
      case 'yprev': st.year--; render(); load(); break;
      case 'ynext': st.year++; render(); load(); break;
      case 'save-goals': {
        const vals = $$('.goal-in').map(x => parseNum(x.value));
        b.classList.add('busy');
        api('setGoals', { year: st.year, goals: vals }).then(g => { st.goals = g; st.yearData = null; render(); toast('Objetivos guardados'); })
          .catch(err => { b.classList.remove('busy'); toast(err.message, true); });
        break;
      }
      case 'settings': st.settings = true; window.scrollTo({ top: 0 }); render(); loadConfig(); break;
      case 'back': st.settings = false; render(); load(); break;
      case 'save-conn': {
        const u = $('#set-url').value.trim(), t = $('#set-token').value.trim();
        localStorage.setItem(LS.url, u); localStorage.setItem(LS.token, t);
        b.classList.add('busy'); api('ping').then(() => { b.classList.remove('busy'); toast('Ligação OK'); loadConfig(); }).catch(err => { b.classList.remove('busy'); toast(err.message, true); });
        break;
      }
      case 'test': {
        const det = (st.config && st.config.details) || [];
        b.classList.add('busy'); const out = $('#test-out'); out.innerHTML = '';
        Promise.all(det.map(d => api('testConnection', { id: d.id, year: d.year }).then(r => `✓ ${d.year}: «${esc(r.title)}» (${r.tabs} separadores)`).catch(err => `✗ ${d.year}: ${esc(err.message)}`)))
          .then(lines => { b.classList.remove('busy'); const bad = lines.some(l => l.startsWith('✗')); out.innerHTML = `<div class="test-out ${bad ? 'err' : 'ok'}">${lines.join('<br>')}</div>`; toast(bad ? 'Há um problema na ligação' : 'Ligação OK', bad); });
        break;
      }
      case 'inspect': {
        const link = $('#link-in').value.trim(); st.linkDraft = link;
        if (!link) { toast('Cola primeiro o link ou o ID da folha.', true); $('#link-in').focus(); return; }
        b.classList.add('busy'); st.inspect = null;
        api('inspectSheet', { link }).then(r => { st.inspect = r; render(); }).catch(err => { b.classList.remove('busy'); toast(err.message, true); });
        break;
      }
      case 'inspect-cancel': st.inspect = null; st.linkDraft = ''; render(); break;
      case 'use-sheet': {
        const ins = st.inspect; b.classList.add('busy');
        api('setSheet', { year: ins.year, link: ins.id }).then(c => {
          st.config = c; st.inspect = null; st.linkDraft = ''; st.day = null; st.month = null; st.yearData = null; st.goals = null;
          render(); toast(`«${ins.title}» em uso para ${ins.year}`);
        }).catch(err => { b.classList.remove('busy'); toast(err.message, true); });
        break;
      }
    }
  });

  // Gesto: deslizar para mudar de dia no ecrã Hoje
  let tx = null, ty = null;
  document.addEventListener('touchstart', e => { if (st.tab !== 'hoje' || st.settings || !e.target.closest('.hero')) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) setDate(isoAdd(st.date, dx < 0 ? 1 : -1));
  }, { passive: true });

  // Ao voltar à app (ex.: no dia seguinte), atualiza "hoje" e os dados
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && st.tab === 'hoje' && !st.settings && $('#view')) {
      const nt = lisbonToday(); if (nt !== today) { location.reload(); return; } loadDay();
    }
  });

  function start() {
    shell();
    const q = new URLSearchParams(location.search);
    if (q.get('date') && /^\d{4}-\d{2}-\d{2}$/.test(q.get('date'))) st.date = q.get('date');
    const tab = q.get('tab'); if (tab === 'settings') { st.settings = true; go('hoje'); st.settings = true; render(); loadConfig(); return; }
    go(['hoje', 'mes', 'ano', 'obj'].includes(tab) ? tab : 'hoje');
  }

  // Link de configuração: …/#setup=<base64url de {"u":URL_EXEC,"t":TOKEN}>. Lido uma vez, guardado e apagado do URL.
  function consumeSetupLink() {
    const m = /(?:^#|&)setup=([A-Za-z0-9_\-+/=]+)/.exec(location.hash || '');
    if (!m) return false;
    history.replaceState(null, '', location.pathname + location.search); // tira o segredo do URL e do histórico
    try {
      const b = m[1].replace(/-/g, '+').replace(/_/g, '/');
      const cfg = JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))));
      const u = String(cfg.u || '').trim(), t = String(cfg.t || '').trim();
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u) || !/^[\w-]{32,}$/.test(t)) throw new Error('bad');
      localStorage.setItem(LS.url, u); localStorage.setItem(LS.token, t);
      return true;
    } catch (e) { setTimeout(() => toast('Link de configuração inválido.', true), 300); return false; }
  }
  const fromLink = MODE === 'pwa' && consumeSetupLink();
  if (fromLink) setTimeout(() => toast('Ligação configurada ✓'), 600);
  if (MODE === 'pwa' && (!localStorage.getItem(LS.url) || !localStorage.getItem(LS.token))) setup();
  else start();
})();
