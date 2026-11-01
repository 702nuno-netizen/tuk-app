/* Folha Google (Sheets v4 + Drive v3) e cópia local. A lógica de células é pura. */
(function (root, factory) {
  const Calc = (root && root.TMCalc) || (typeof require === 'function' ? require('./calc.js') : null);
  const api = factory(Calc);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TMStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Calc) {
  'use strict';

  const SHEETS = ['Config', 'Tuks', 'Motoristas', 'Percentagens', 'TiposGasto', 'Dias', 'Servicos', 'Gastos', 'Entregas', 'Gratificacoes', 'Objetivos'];
  const CONFIG_FIELDS = [
    ['businessName', 'Nome do negócio'],
    ['lang', 'Língua'],
    ['currency', 'Moeda'],
    ['defaultOwnerPct', 'Percentagem do patrão'],
    ['tipsEnabled', 'Gratificações'],
    ['bonusMode', 'Prémio'],
    ['bonusAmount', 'Valor do prémio'],
    ['onboarded', 'Configuração concluída'],
    ['lastBackup', 'Última cópia de segurança']
  ];
  const CONFIG_LABEL = {};
  CONFIG_FIELDS.forEach(([field, label]) => { CONFIG_LABEL[label] = field; CONFIG_LABEL[field] = field; });

  function cell(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : '';
    if (typeof v === 'boolean') return v ? 'SIM' : 'NÃO';
    const s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
    return s;
  }
  function text(v) {
    if (v == null) return '';
    if (typeof v === 'number') return String(v);
    const s = String(v);
    if (s.length > 1 && s[0] === "'" && /^[=+\-@\t\r]/.test(s.slice(1))) return s.slice(1);
    return s;
  }
  function num(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null || v === '') return 0;
    const n = Number(String(v).trim().replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function flag(v) {
    if (v === true) return true;
    const s = String(v == null ? '' : v).trim().toLowerCase();
    return s === 'sim' || s === 'yes' || s === 'true' || s === '1';
  }
  function bonusToSheet(m) { return m === 'monthly' ? 'mensal' : 'desligado'; }
  function bonusFromSheet(s) {
    const x = String(s || '').toLowerCase();
    return x === 'mensal' || x === 'monthly' ? 'monthly' : 'off';
  }
  function kindToSheet(k) { return k === 'monthly' ? 'Mensal' : 'Diário'; }
  function kindFromSheet(s) { return String(s || '').toLowerCase().startsWith('m') ? 'monthly' : 'daily'; }
  function fuelToSheet(f) { return f === 'electric' ? 'Elétrico' : 'Combustão'; }
  function fuelFromSheet(s) {
    const x = String(s || '').toLowerCase();
    if (x.startsWith('el') || x.includes('electr')) return 'electric';
    return 'combustion';
  }
  function driverName(data, id) {
    const d = (data.drivers || []).find(x => x.id === id);
    return d ? d.name : '';
  }
  function tukName(data, id) {
    const t = (data.tuks || []).find(x => x.id === id);
    return t ? t.name : '';
  }

  function blank(headers) { return [headers]; }

  function toTables(data) {
    const d = Calc.normalize(data);
    const configRows = [['Chave', 'Valor']];
    CONFIG_FIELDS.forEach(([field, label]) => {
      let v = d.config[field];
      if (field === 'tipsEnabled' || field === 'onboarded') v = v ? 'SIM' : 'NÃO';
      else if (field === 'bonusMode') v = bonusToSheet(v);
      configRows.push([label, cell(v)]);
    });
    const tuks = blank(['Id', 'Nome', 'Número', 'Matrícula', 'Tipo', 'Garagem mensal', 'Ativo', 'Apagado', 'Ordem']);
    d.tuks.forEach(t => tuks.push([cell(t.id), cell(t.name), cell(t.number), cell(t.plate), fuelToSheet(t.fuel), t.garageMonthly, t.active ? 'SIM' : 'NÃO', t.deleted ? 'SIM' : 'NÃO', t.order || 0]));
    const drivers = blank(['Id', 'Nome', 'Número', 'Telefone', 'É o dono', 'Ativo', 'Apagado', 'Ordem']);
    d.drivers.forEach(p => drivers.push([cell(p.id), cell(p.name), cell(p.number), cell(p.phone), p.isOwner ? 'SIM' : 'NÃO', p.active ? 'SIM' : 'NÃO', p.deleted ? 'SIM' : 'NÃO', p.order || 0]));
    const pct = blank(['Id', 'Motorista', 'Nome', 'Desde', 'Percentagem']);
    d.drivers.forEach(p => (p.pctHistory || []).forEach((h, i) => {
      pct.push([cell(p.id + ':' + h.from + ':' + i), cell(p.id), cell(p.name), cell(h.from), h.pct]);
    }));
    const types = blank(['Id', 'Chave', 'Nome', 'Nome personalizado', 'Diário ou mensal', 'Repetir', 'Valor mensal', 'De fábrica', 'Apagado', 'Ordem']);
    d.expenseTypes.forEach(t => types.push([
      cell(t.id), cell(t.systemKey || ''), cell(t.name), t.nameCustom ? 'SIM' : 'NÃO', kindToSheet(t.kind),
      t.repeatMonthly ? 'SIM' : 'NÃO', t.defaultAmount, t.factory ? 'SIM' : 'NÃO', t.deleted ? 'SIM' : 'NÃO', t.order || 0
    ]));
    const days = blank(['Data', 'Motorista', 'Nome', 'Tuk', 'Tuk nome', 'Dia a zero', 'Tuk escolhido']);
    d.assignments.forEach(a => days.push([
      cell(a.date), cell(a.driverId), cell(driverName(d, a.driverId)), cell(a.tukId || ''), cell(tukName(d, a.tukId)),
      a.workedZero ? 'SIM' : 'NÃO', a.tukExplicit ? 'SIM' : 'NÃO'
    ]));
    const services = blank(['Id', 'Data', 'Motorista', 'Nome', 'Valor', 'Nota']);
    d.services.forEach(s => services.push([cell(s.id), cell(s.date), cell(s.driverId), cell(driverName(d, s.driverId)), s.amount, cell(s.note || '')]));
    const expenses = blank(['Id', 'Âmbito', 'Data', 'Ano', 'Mês', 'Tuk', 'Tipo', 'Valor', 'Nota']);
    d.expenses.forEach(e => expenses.push([
      cell(e.id), kindToSheet(e.scope), cell(e.date || ''), e.year || '', e.month || '', cell(e.tukId || ''), cell(e.typeId), e.amount, cell(e.note || '')
    ]));
    const handovers = blank(['Id', 'Data', 'Motorista', 'Nome', 'Valor', 'Nota']);
    d.handovers.forEach(h => handovers.push([cell(h.id), cell(h.date), cell(h.driverId), cell(driverName(d, h.driverId)), h.amount, cell(h.note || '')]));
    const tips = blank(['Id', 'Data', 'Motorista', 'Nome', 'Valor']);
    d.tips.forEach(t => tips.push([cell(t.id), cell(t.date), cell(t.driverId), cell(driverName(d, t.driverId)), t.amount]));
    const goals = blank(['Ano', 'Mês', 'Valor']);
    d.goals.forEach(g => goals.push([g.year, g.month, g.amount]));
    return {
      Config: configRows, Tuks: tuks, Motoristas: drivers, Percentagens: pct, TiposGasto: types,
      Dias: days, Servicos: services, Gastos: expenses, Entregas: handovers, Gratificacoes: tips, Objetivos: goals
    };
  }

  function rows(values) {
    if (!values || values.length < 2) return [];
    const head = values[0].map(h => text(h).trim());
    const out = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i] || [];
      if (!r.some(c => text(c).trim() !== '')) continue;
      const o = {};
      head.forEach((h, idx) => { o[h] = r[idx] == null ? '' : r[idx]; });
      out.push(o);
    }
    return out;
  }

  function fromTables(tables) {
    const raw = Calc.emptyModel();
    raw.expenseTypes = [];
    const cfg = {};
    rows(tables.Config).forEach(r => {
      const field = CONFIG_LABEL[text(r.Chave).trim()];
      if (field) cfg[field] = r.Valor;
    });
    if (Object.keys(cfg).length) {
      raw.config.businessName = text(cfg.businessName);
      raw.config.lang = text(cfg.lang) === 'en' ? 'en' : 'pt';
      raw.config.currency = text(cfg.currency) || 'EUR';
      raw.config.defaultOwnerPct = num(cfg.defaultOwnerPct || 50);
      raw.config.tipsEnabled = cfg.tipsEnabled == null || cfg.tipsEnabled === '' ? true : flag(cfg.tipsEnabled);
      raw.config.bonusMode = bonusFromSheet(cfg.bonusMode);
      raw.config.bonusAmount = num(cfg.bonusAmount);
      raw.config.onboarded = flag(cfg.onboarded);
      raw.config.lastBackup = text(cfg.lastBackup).slice(0, 10);
    }
    raw.tuks = rows(tables.Tuks).map(r => ({
      id: text(r.Id), name: text(r.Nome), number: text(r['Número']), plate: text(r['Matrícula']),
      fuel: fuelFromSheet(r.Tipo), garageMonthly: num(r['Garagem mensal']),
      active: r.Ativo === '' ? true : flag(r.Ativo), deleted: flag(r.Apagado), order: num(r.Ordem)
    })).filter(t => t.id);
    const hist = {};
    rows(tables.Percentagens).forEach(r => {
      const id = text(r.Motorista);
      if (!id) return;
      (hist[id] = hist[id] || []).push({ from: text(r.Desde).slice(0, 10), pct: num(r.Percentagem) });
    });
    raw.drivers = rows(tables.Motoristas).map(r => ({
      id: text(r.Id), name: text(r.Nome), number: text(r['Número']), phone: text(r.Telefone),
      isOwner: flag(r['É o dono']), active: r.Ativo === '' ? true : flag(r.Ativo), deleted: flag(r.Apagado),
      order: num(r.Ordem), pctHistory: hist[text(r.Id)] || [{ from: '1970-01-01', pct: 50 }]
    })).filter(p => p.id);
    const typeRows = rows(tables.TiposGasto).map(r => ({
      id: text(r.Id), systemKey: text(r.Chave), name: text(r.Nome), nameCustom: flag(r['Nome personalizado']),
      kind: kindFromSheet(r['Diário ou mensal']), repeatMonthly: flag(r.Repetir), defaultAmount: num(r['Valor mensal']),
      factory: flag(r['De fábrica']), deleted: flag(r.Apagado), order: num(r.Ordem)
    })).filter(t => t.id);
    raw.expenseTypes = typeRows;
    raw.assignments = rows(tables.Dias).map(r => ({
      date: text(r.Data).slice(0, 10), driverId: text(r.Motorista), tukId: text(r.Tuk) || null,
      workedZero: flag(r['Dia a zero']), tukExplicit: flag(r['Tuk escolhido'])
    })).filter(a => a.date && a.driverId);
    raw.services = rows(tables.Servicos).map(r => ({
      id: text(r.Id), date: text(r.Data).slice(0, 10), driverId: text(r.Motorista), amount: num(r.Valor), note: text(r.Nota)
    })).filter(s => s.id);
    raw.expenses = rows(tables.Gastos).map(r => ({
      id: text(r.Id), scope: kindFromSheet(r['Âmbito']), date: text(r.Data).slice(0, 10),
      year: num(r.Ano), month: num(r['Mês']), tukId: text(r.Tuk) || null, typeId: text(r.Tipo),
      amount: num(r.Valor), note: text(r.Nota)
    })).filter(e => e.id);
    raw.handovers = rows(tables.Entregas).map(r => ({
      id: text(r.Id), date: text(r.Data).slice(0, 10), driverId: text(r.Motorista), amount: num(r.Valor), note: text(r.Nota)
    })).filter(h => h.id);
    raw.tips = rows(tables.Gratificacoes).map(r => ({
      id: text(r.Id), date: text(r.Data).slice(0, 10), driverId: text(r.Motorista), amount: num(r.Valor)
    })).filter(t => t.id);
    raw.goals = rows(tables.Objetivos).map(r => ({ year: num(r.Ano), month: num(r['Mês']), amount: num(r.Valor) }));
    return Calc.normalize(raw);
  }

  function fileTitle(name, backup) {
    const clean = String(name || 'Tuk').replace(/[\r\n]/g, ' ').trim().slice(0, 80) || 'Tuk';
    return backup ? clean + ' – Tuk Manager (cópia de segurança)' : clean + ' – Tuk Manager';
  }

  const DEMO_KEY = 'tm.demo.v1';

  function createLocalStore() {
    return {
      mode: 'demo',
      spreadsheetId: null,
      backupId: null,
      url() { return ''; },
      async load() {
        try {
          const raw = localStorage.getItem(DEMO_KEY);
          if (!raw) return Calc.emptyModel();
          return Calc.normalize(JSON.parse(raw));
        } catch (e) {
          return Calc.emptyModel();
        }
      },
      async save(data) { localStorage.setItem(DEMO_KEY, JSON.stringify(Calc.normalize(data))); },
      async backup() {},
      async rename() {},
      async clear() { localStorage.removeItem(DEMO_KEY); }
    };
  }

  async function gjson(token, url, options) {
    const opts = options || {};
    const headers = Object.assign({ Authorization: 'Bearer ' + token }, opts.headers || {});
    if (opts.body) headers['Content-Type'] = 'application/json';
    const res = await fetch(url, { method: opts.method || 'GET', headers, body: opts.body || undefined });
    if (res.status === 204) return null;
    const textBody = await res.text();
    let json = null;
    try { json = textBody ? JSON.parse(textBody) : null; } catch (e) { json = null; }
    if (!res.ok) {
      const msg = (json && json.error && (json.error.message || json.error.status)) || textBody || ('HTTP ' + res.status);
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return json;
  }

  async function withToken(getToken, fn) {
    let token = await getToken(false);
    try {
      return await fn(token);
    } catch (e) {
      if (e && e.status === 401) return fn(await getToken(true));
      throw e;
    }
  }

  async function findAppFiles(token) {
    const q = "appProperties has { key='tmApp' and value='tuk-manager' } and trashed=false";
    const url = 'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=' + encodeURIComponent('files(id,name,appProperties,modifiedTime,trashed)') + '&q=' + encodeURIComponent(q);
    const data = await gjson(token, url);
    const files = (data && data.files) || [];
    const main = files.find(f => f.appProperties && f.appProperties.tmRole === 'main');
    const backup = files.find(f => f.appProperties && f.appProperties.tmRole === 'backup');
    return { main: main ? main.id : null, backup: backup ? backup.id : null, files };
  }

  async function peekFile(token, id) {
    if (!id) return null;
    try {
      const f = await gjson(token, 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?fields=' + encodeURIComponent('id,name,trashed,appProperties'));
      if (!f || f.trashed) return null;
      return f;
    } catch (e) {
      return null;
    }
  }

  async function ensureTabs(token, id) {
    const meta = await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + id + '?fields=' + encodeURIComponent('sheets.properties'));
    const existing = (meta.sheets || []).map(s => s.properties);
    const have = new Set(existing.map(s => s.title));
    const requests = [];
    if (!SHEETS.some(t => have.has(t)) && existing[0]) {
      requests.push({ updateSheetProperties: { properties: { sheetId: existing[0].sheetId, title: SHEETS[0] }, fields: 'title' } });
      have.delete(existing[0].title);
      have.add(SHEETS[0]);
    }
    SHEETS.forEach(title => {
      if (!have.has(title)) requests.push({ addSheet: { properties: { title } } });
    });
    if (requests.length) {
      await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + id + ':batchUpdate', {
        method: 'POST', body: JSON.stringify({ requests })
      });
    }
  }

  async function writeAll(token, id, data) {
    await ensureTabs(token, id);
    const tables = toTables(data);
    await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + id + '/values:batchClear', {
      method: 'POST',
      body: JSON.stringify({ ranges: SHEETS.map(name => "'" + name + "'!A:Z") })
    });
    await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + id + '/values:batchUpdate', {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: SHEETS.map(name => ({ range: "'" + name + "'!A1", values: tables[name] }))
      })
    });
  }

  async function readAll(token, id) {
    await ensureTabs(token, id);
    const url = new URL('https://sheets.googleapis.com/v4/spreadsheets/' + id + '/values:batchGet');
    SHEETS.forEach(name => url.searchParams.append('ranges', "'" + name + "'!A:Z"));
    const res = await gjson(token, url.toString());
    const tables = {};
    (res.valueRanges || []).forEach(vr => {
      const name = String(vr.range || '').split('!')[0].replace(/'/g, '');
      tables[name] = vr.values || [];
    });
    return fromTables(tables);
  }

  async function createSpreadsheet(token, title, role) {
    const file = await gjson(token, 'https://www.googleapis.com/drive/v3/files?fields=id,name', {
      method: 'POST',
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        appProperties: { tmApp: 'tuk-manager', tmRole: role }
      })
    });
    await ensureTabs(token, file.id);
    return file.id;
  }

  async function resolveIds(token, known) {
    const found = await findAppFiles(token);
    if (!found.main && known && known.main) {
      const f = await peekFile(token, known.main);
      if (f) found.main = f.id;
    }
    if (!found.backup && known && known.backup) {
      const f = await peekFile(token, known.backup);
      if (f) found.backup = f.id;
    }
    return found;
  }

  async function findExisting(getToken, known) {
    return withToken(getToken, token => resolveIds(token, known));
  }

  async function ensureFiles(getToken, businessName, known) {
    return withToken(getToken, async token => {
      const found = await resolveIds(token, known);
      if (!found.main) found.main = await createSpreadsheet(token, fileTitle(businessName, false), 'main');
      if (!found.backup) found.backup = await createSpreadsheet(token, fileTitle(businessName, true), 'backup');
      return { main: found.main, backup: found.backup };
    });
  }

  function createSheetsStore({ getToken, spreadsheetId, backupId }) {
    const ids = { main: spreadsheetId, backup: backupId || null };
    return {
      mode: 'sheets',
      get spreadsheetId() { return ids.main; },
      get backupId() { return ids.backup; },
      url() { return ids.main ? 'https://docs.google.com/spreadsheets/d/' + ids.main + '/edit' : ''; },
      async load() { return withToken(getToken, token => readAll(token, ids.main)); },
      async save(data) { await withToken(getToken, token => writeAll(token, ids.main, data)); },
      async backup(data) {
        if (!ids.backup) return;
        await withToken(getToken, token => writeAll(token, ids.backup, data));
      },
      async rename(businessName) {
        await withToken(getToken, async token => {
          if (ids.main) await gjson(token, 'https://www.googleapis.com/drive/v3/files/' + ids.main, { method: 'PATCH', body: JSON.stringify({ name: fileTitle(businessName, false) }) });
          if (ids.backup) await gjson(token, 'https://www.googleapis.com/drive/v3/files/' + ids.backup, { method: 'PATCH', body: JSON.stringify({ name: fileTitle(businessName, true) }) });
        });
      }
    };
  }

  async function fetchProfile(token) {
    try {
      const data = await gjson(token, 'https://www.googleapis.com/drive/v3/about?fields=' + encodeURIComponent('user(emailAddress,displayName)'));
      return data && data.user ? data.user : null;
    } catch (e) {
      return null;
    }
  }

  return {
    SHEETS, toTables, fromTables, fileTitle, createLocalStore, createSheetsStore,
    findExisting, ensureFiles, fetchProfile, DEMO_KEY
  };
});
