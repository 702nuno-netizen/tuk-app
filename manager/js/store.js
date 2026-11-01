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
      pct.push([cell(p.id + ':' + h.from), cell(p.id), cell(p.name), cell(h.from), h.pct]);
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

  const DERIVED_HEADERS = { 'Nome': 1, 'Tuk nome': 1 };
  const NUM_KIND = { num: 1 };

  function configOut(data, field) {
    const v = data.config[field];
    if (field === 'tipsEnabled' || field === 'onboarded') return v ? 'SIM' : 'NÃO';
    if (field === 'bonusMode') return bonusToSheet(v);
    if (field === 'defaultOwnerPct' || field === 'bonusAmount') return num(v);
    if (field === 'lastBackup') return text(v).slice(0, 10);
    return text(v);
  }
  function canonConfigValor(chave, raw) {
    const field = CONFIG_LABEL[text(chave)];
    if (!field) return text(raw);
    if (field === 'tipsEnabled' || field === 'onboarded') return (raw === '' || raw == null) ? '' : (flag(raw) ? 'SIM' : 'NÃO');
    if (field === 'bonusMode') return bonusToSheet(bonusFromSheet(raw));
    if (field === 'defaultOwnerPct' || field === 'bonusAmount') return raw === '' || raw == null ? '' : num(raw);
    if (field === 'lastBackup') return text(raw).slice(0, 10);
    return text(raw);
  }
  function canonByKind(kind, raw, chave) {
    if (kind === 'config') return canonConfigValor(chave, raw);
    if (kind === 'num') return raw === '' || raw == null ? '' : num(raw);
    if (kind === 'date') return text(raw).slice(0, 10);
    if (kind === 'flag') return flag(raw) ? 'SIM' : 'NÃO';
    if (kind === 'ativo') return (raw === '' || raw == null || flag(raw)) ? 'SIM' : 'NÃO';
    if (kind === 'apagado') return (raw === '' || raw == null) ? 'NÃO' : (flag(raw) ? 'SIM' : 'NÃO');
    if (kind === 'fuel') return fuelToSheet(fuelFromSheet(raw));
    if (kind === 'kind') return kindToSheet(kindFromSheet(raw));
    return text(raw);
  }
  function outCell(kind, value) {
    if (NUM_KIND[kind] || kind === 'num') return value === '' || value == null ? '' : num(value);
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) return "'" + value;
    return value == null ? '' : value;
  }
  function canonValues(raw, spec) {
    const chave = text(raw.Chave);
    const out = {};
    spec.headers.forEach(h => {
      out[h] = canonByKind(spec.kinds[h] || 'text', raw[h], chave);
    });
    return out;
  }
  function sameCanon(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const keys = new Set(Object.keys(a).concat(Object.keys(b)));
    for (const k of keys) {
      if (DERIVED_HEADERS[k]) continue;
      if (a[k] !== b[k]) return false;
    }
    return true;
  }
  function indexGrid(grid, spec) {
    const source = grid && grid.length ? grid : [];
    const headers = source.length ? source[0].map(h => text(h).trim()) : spec.headers.slice();
    const byKey = new Map();
    for (let i = 1; i < source.length; i++) {
      const cells = source[i] || [];
      if (!cells.some(c => text(c).trim() !== '')) continue;
      const raw = {};
      headers.forEach((h, idx) => { raw[h] = cells[idx] == null ? '' : cells[idx]; });
      const key = spec.keyOfRow(raw);
      if (!key || byKey.has(key)) continue;
      byKey.set(key, { rowNumber: i + 1, key, raw });
    }
    return { headers: headers.length ? headers : spec.headers.slice(), byKey };
  }
  function planTab(spec, baseRecs, localRecs, indexed) {
    const b = new Map(baseRecs.map(r => [r.key, r]));
    const l = new Map(localRecs.map(r => [r.key, r]));
    const keys = new Set([...b.keys(), ...l.keys(), ...indexed.byKey.keys()]);
    const ops = [];
    keys.forEach(key => {
      const br = b.get(key);
      const lr = l.get(key);
      const rr = indexed.byKey.get(key);
      const bCanon = br ? canonValues(br.values, spec) : null;
      const lCanon = lr ? canonValues(lr.values, spec) : null;
      const rCanon = rr ? canonValues(rr.raw, spec) : null;
      const localChanged = !sameCanon(bCanon, lCanon);
      const remoteChanged = !sameCanon(bCanon, rCanon);
      if (lCanon && !rCanon) {
        if (!bCanon) ops.push({ type: 'append', key, values: lCanon });
        return;
      }
      if (!lCanon && rCanon) {
        if (bCanon && !remoteChanged) ops.push({ type: 'delete', key, rowNumber: rr.rowNumber });
        return;
      }
      if (lCanon && rCanon && localChanged && !remoteChanged && !sameCanon(lCanon, rCanon)) {
        ops.push({ type: 'update', key, rowNumber: rr.rowNumber, values: lCanon });
      }
    });
    return ops;
  }
  function applyTabOps(grid, spec, ops) {
    const headers = spec.headers;
    let rows = (grid || []).map(r => (r || []).slice());
    const needsHeader = !rows.length || !text((rows[0] || [])[0]);
    if (needsHeader) rows = [headers.slice()];
    ops.filter(op => op.type === 'update' && op.rowNumber > 1).forEach(op => {
      const existing = rows[op.rowNumber - 1] || [];
      const next = headers.map(h => outCell(spec.kinds[h] || 'text', op.values[h]));
      for (let i = headers.length; i < existing.length; i++) next[i] = existing[i];
      rows[op.rowNumber - 1] = next;
    });
    ops.filter(op => op.type === 'delete' && op.rowNumber > 1)
      .map(op => op.rowNumber)
      .sort((a, b) => b - a)
      .forEach(n => { if (rows[n - 1]) rows.splice(n - 1, 1); });
    ops.filter(op => op.type === 'append').forEach(op => {
      rows.push(headers.map(h => outCell(spec.kinds[h] || 'text', op.values[h])));
    });
    return rows;
  }

  function nameOf(data, kind, id) {
    const list = kind === 'tuk' ? data.tuks : data.drivers;
    const found = (list || []).find(x => x.id === id);
    return found ? found.name : '';
  }
  const SPECS = {
    Config: {
      headers: ['Chave', 'Valor'],
      kinds: { 'Chave': 'text', 'Valor': 'config' },
      keyOfRow: obj => text(obj.Chave),
      records(data) {
        return CONFIG_FIELDS.map(([field, label]) => ({ key: label, values: { 'Chave': label, 'Valor': configOut(data, field) } }));
      }
    },
    Tuks: {
      headers: ['Id', 'Nome', 'Número', 'Matrícula', 'Tipo', 'Garagem mensal', 'Ativo', 'Apagado', 'Ordem'],
      kinds: { 'Id': 'text', 'Nome': 'text', 'Número': 'text', 'Matrícula': 'text', 'Tipo': 'fuel', 'Garagem mensal': 'num', 'Ativo': 'ativo', 'Apagado': 'apagado', 'Ordem': 'num' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.tuks.map(t => ({
          key: t.id,
          values: { 'Id': t.id, 'Nome': t.name, 'Número': text(t.number), 'Matrícula': t.plate, 'Tipo': fuelToSheet(t.fuel), 'Garagem mensal': num(t.garageMonthly), 'Ativo': t.active ? 'SIM' : 'NÃO', 'Apagado': t.deleted ? 'SIM' : 'NÃO', 'Ordem': num(t.order) }
        }));
      }
    },
    Motoristas: {
      headers: ['Id', 'Nome', 'Número', 'Telefone', 'É o dono', 'Ativo', 'Apagado', 'Ordem'],
      kinds: { 'Id': 'text', 'Nome': 'text', 'Número': 'text', 'Telefone': 'text', 'É o dono': 'flag', 'Ativo': 'ativo', 'Apagado': 'apagado', 'Ordem': 'num' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.drivers.map(p => ({
          key: p.id,
          values: { 'Id': p.id, 'Nome': p.name, 'Número': text(p.number), 'Telefone': text(p.phone), 'É o dono': p.isOwner ? 'SIM' : 'NÃO', 'Ativo': p.active ? 'SIM' : 'NÃO', 'Apagado': p.deleted ? 'SIM' : 'NÃO', 'Ordem': num(p.order) }
        }));
      }
    },
    Percentagens: {
      headers: ['Id', 'Motorista', 'Nome', 'Desde', 'Percentagem'],
      kinds: { 'Id': 'text', 'Motorista': 'text', 'Nome': 'text', 'Desde': 'date', 'Percentagem': 'num' },
      keyOfRow(obj) {
        const driver = text(obj.Motorista);
        const from = text(obj.Desde).slice(0, 10);
        if (driver && /^\d{4}-\d{2}-\d{2}$/.test(from)) return driver + '|' + from;
        return text(obj.Id);
      },
      records(data) {
        const recs = [];
        data.drivers.forEach(p => (p.pctHistory || []).forEach(h => {
          recs.push({ key: p.id + '|' + h.from, values: { 'Id': p.id + ':' + h.from, 'Motorista': p.id, 'Nome': p.name, 'Desde': h.from, 'Percentagem': num(h.pct) } });
        }));
        return recs;
      }
    },
    TiposGasto: {
      headers: ['Id', 'Chave', 'Nome', 'Nome personalizado', 'Diário ou mensal', 'Repetir', 'Valor mensal', 'De fábrica', 'Apagado', 'Ordem'],
      kinds: { 'Id': 'text', 'Chave': 'text', 'Nome': 'text', 'Nome personalizado': 'flag', 'Diário ou mensal': 'kind', 'Repetir': 'flag', 'Valor mensal': 'num', 'De fábrica': 'flag', 'Apagado': 'apagado', 'Ordem': 'num' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.expenseTypes.map(t => ({
          key: t.id,
          values: { 'Id': t.id, 'Chave': t.systemKey || '', 'Nome': t.name, 'Nome personalizado': t.nameCustom ? 'SIM' : 'NÃO', 'Diário ou mensal': kindToSheet(t.kind), 'Repetir': t.repeatMonthly ? 'SIM' : 'NÃO', 'Valor mensal': num(t.defaultAmount), 'De fábrica': t.factory ? 'SIM' : 'NÃO', 'Apagado': t.deleted ? 'SIM' : 'NÃO', 'Ordem': num(t.order) }
        }));
      }
    },
    Dias: {
      headers: ['Data', 'Motorista', 'Nome', 'Tuk', 'Tuk nome', 'Dia a zero', 'Tuk escolhido'],
      kinds: { 'Data': 'date', 'Motorista': 'text', 'Nome': 'text', 'Tuk': 'text', 'Tuk nome': 'text', 'Dia a zero': 'flag', 'Tuk escolhido': 'flag' },
      keyOfRow: obj => text(obj.Data).slice(0, 10) + '|' + text(obj.Motorista),
      records(data) {
        return data.assignments.map(a => ({
          key: a.date + '|' + a.driverId,
          values: { 'Data': a.date, 'Motorista': a.driverId, 'Nome': nameOf(data, 'driver', a.driverId), 'Tuk': a.tukId || '', 'Tuk nome': nameOf(data, 'tuk', a.tukId), 'Dia a zero': a.workedZero ? 'SIM' : 'NÃO', 'Tuk escolhido': a.tukExplicit ? 'SIM' : 'NÃO' }
        }));
      }
    },
    Servicos: {
      headers: ['Id', 'Data', 'Motorista', 'Nome', 'Valor', 'Nota'],
      kinds: { 'Id': 'text', 'Data': 'date', 'Motorista': 'text', 'Nome': 'text', 'Valor': 'num', 'Nota': 'text' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.services.map(s => ({
          key: s.id,
          values: { 'Id': s.id, 'Data': s.date, 'Motorista': s.driverId, 'Nome': nameOf(data, 'driver', s.driverId), 'Valor': num(s.amount), 'Nota': s.note || '' }
        }));
      }
    },
    Gastos: {
      headers: ['Id', 'Âmbito', 'Data', 'Ano', 'Mês', 'Tuk', 'Tipo', 'Valor', 'Nota'],
      kinds: { 'Id': 'text', 'Âmbito': 'kind', 'Data': 'date', 'Ano': 'num', 'Mês': 'num', 'Tuk': 'text', 'Tipo': 'text', 'Valor': 'num', 'Nota': 'text' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.expenses.map(e => ({
          key: e.id,
          values: { 'Id': e.id, 'Âmbito': kindToSheet(e.scope), 'Data': e.date || '', 'Ano': e.year || '', 'Mês': e.month || '', 'Tuk': e.tukId || '', 'Tipo': e.typeId, 'Valor': num(e.amount), 'Nota': e.note || '' }
        }));
      }
    },
    Entregas: {
      headers: ['Id', 'Data', 'Motorista', 'Nome', 'Valor', 'Nota'],
      kinds: { 'Id': 'text', 'Data': 'date', 'Motorista': 'text', 'Nome': 'text', 'Valor': 'num', 'Nota': 'text' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.handovers.map(h => ({
          key: h.id,
          values: { 'Id': h.id, 'Data': h.date, 'Motorista': h.driverId, 'Nome': nameOf(data, 'driver', h.driverId), 'Valor': num(h.amount), 'Nota': h.note || '' }
        }));
      }
    },
    Gratificacoes: {
      headers: ['Id', 'Data', 'Motorista', 'Nome', 'Valor'],
      kinds: { 'Id': 'text', 'Data': 'date', 'Motorista': 'text', 'Nome': 'text', 'Valor': 'num' },
      keyOfRow: obj => text(obj.Id),
      records(data) {
        return data.tips.map(t => ({
          key: t.id,
          values: { 'Id': t.id, 'Data': t.date, 'Motorista': t.driverId, 'Nome': nameOf(data, 'driver', t.driverId), 'Valor': num(t.amount) }
        }));
      }
    },
    Objetivos: {
      headers: ['Ano', 'Mês', 'Valor'],
      kinds: { 'Ano': 'num', 'Mês': 'num', 'Valor': 'num' },
      keyOfRow: obj => {
        const y = num(obj.Ano), m = num(obj['Mês']);
        return y && m ? y + '|' + m : '';
      },
      records(data) {
        return data.goals.map(g => ({ key: g.year + '|' + g.month, values: { 'Ano': g.year, 'Mês': g.month, 'Valor': num(g.amount) } }));
      }
    }
  };

  function syncGrids(baseline, local, grids) {
    const base = Calc.normalize(baseline || Calc.emptyModel());
    const loc = Calc.normalize(local || Calc.emptyModel());
    const next = {};
    const ops = [];
    SHEETS.forEach(name => {
      const spec = SPECS[name];
      const grid = grids && grids[name] ? grids[name] : [];
      const indexed = indexGrid(grid, spec);
      let tabOps = planTab(spec, spec.records(base), spec.records(loc), indexed);
      const needsHeader = !grid.length || !text((grid[0] || [])[0]);
      if (needsHeader && tabOps.some(op => op.type === 'append' || op.type === 'update')) {
        tabOps = [{ type: 'header', key: '', values: {} }].concat(tabOps);
      }
      tabOps.forEach(op => ops.push(Object.assign({ tab: name }, op)));
      next[name] = applyTabOps(grid, spec, tabOps.filter(op => op.type !== 'header'));
    });
    return { ops: ops.filter(op => op.type !== 'header'), grids: next, merged: fromTables(next), headerTabs: ops.filter(op => op.type === 'header').map(op => op.tab) };
  }
  function gridsFromModel(data) {
    const model = Calc.normalize(data || Calc.emptyModel());
    const grids = {};
    SHEETS.forEach(name => {
      const spec = SPECS[name];
      const rows = [spec.headers.slice()];
      spec.records(model).forEach(rec => {
        rows.push(spec.headers.map(h => outCell(spec.kinds[h] || 'text', rec.values[h])));
      });
      grids[name] = rows;
    });
    return grids;
  }
  function hasLocalChanges(base, local) {
    return syncGrids(base, local, gridsFromModel(base)).ops.length > 0;
  }
  function reconcile(current, base, remote) {
    const remoteModel = Calc.normalize(remote || Calc.emptyModel());
    return syncGrids(base || Calc.emptyModel(), current || remoteModel, toTables(remoteModel)).merged;
  }
  function sameModel(a, b) {
    return !hasLocalChanges(a, b) && !hasLocalChanges(b, a);
  }
  function colLetter(n) {
    let s = '';
    let x = n;
    while (x > 0) {
      const m = (x - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      x = Math.floor((x - 1) / 26);
    }
    return s;
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

  async function readGrids(token, id) {
    await ensureTabs(token, id);
    const url = new URL('https://sheets.googleapis.com/v4/spreadsheets/' + id + '/values:batchGet');
    SHEETS.forEach(name => url.searchParams.append('ranges', "'" + name + "'!A:Z"));
    const res = await gjson(token, url.toString());
    const grids = {};
    SHEETS.forEach(name => { grids[name] = []; });
    (res.valueRanges || []).forEach(vr => {
      const name = String(vr.range || '').split('!')[0].replace(/'/g, '');
      grids[name] = vr.values || [];
    });
    return grids;
  }
  async function readAll(token, id) {
    return fromTables(await readGrids(token, id));
  }
  async function sheetIdMap(token, id) {
    const meta = await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + id + '?fields=' + encodeURIComponent('sheets.properties'));
    const map = {};
    (meta.sheets || []).forEach(s => { map[s.properties.title] = s.properties.sheetId; });
    return map;
  }
  async function pushOps(token, spreadsheetId, ops) {
    if (!ops.length) return;
    const tabs = {};
    ops.forEach(op => { (tabs[op.tab] = tabs[op.tab] || []).push(op); });
    const idMap = ops.some(op => op.type === 'delete') ? await sheetIdMap(token, spreadsheetId) : null;
    const names = Object.keys(tabs);
    for (let i = 0; i < names.length; i++) {
      const tab = names[i];
      const spec = SPECS[tab];
      const list = tabs[tab];
      const headers = spec.headers;
      const endCol = colLetter(headers.length);
      const quote = "'" + tab + "'";
      const headerOps = list.filter(op => op.type === 'header');
      if (headerOps.length) {
        await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + encodeURIComponent(quote + '!A1') + '?valueInputOption=RAW', {
          method: 'PUT',
          body: JSON.stringify({ values: [headers], majorDimension: 'ROWS' })
        });
      }
      const updates = list.filter(op => op.type === 'update' && op.rowNumber > 1).map(op => ({
        range: quote + '!A' + op.rowNumber + ':' + endCol + op.rowNumber,
        values: [headers.map(h => outCell(spec.kinds[h] || 'text', op.values[h]))]
      }));
      if (updates.length) {
        await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values:batchUpdate', {
          method: 'POST',
          body: JSON.stringify({ valueInputOption: 'RAW', data: updates })
        });
      }
      const deletes = list.filter(op => op.type === 'delete' && op.rowNumber > 1)
        .sort((a, b) => b.rowNumber - a.rowNumber);
      if (deletes.length) {
        await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + ':batchUpdate', {
          method: 'POST',
          body: JSON.stringify({
            requests: deletes.map(op => ({
              deleteDimension: {
                range: { sheetId: idMap[tab], dimension: 'ROWS', startIndex: op.rowNumber - 1, endIndex: op.rowNumber }
              }
            }))
          })
        });
      }
      const appends = list.filter(op => op.type === 'append').map(op => headers.map(h => outCell(spec.kinds[h] || 'text', op.values[h])));
      if (appends.length) {
        const range = encodeURIComponent(quote + '!A1');
        await gjson(token, 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + range + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', {
          method: 'POST',
          body: JSON.stringify({ values: appends, majorDimension: 'ROWS' })
        });
      }
    }
  }

  // Cópia integral. Só para a folha de segurança — a folha principal nunca é limpa por aqui.
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
    let baseline = null;
    return {
      mode: 'sheets',
      get spreadsheetId() { return ids.main; },
      get backupId() { return ids.backup; },
      url() { return ids.main ? 'https://docs.google.com/spreadsheets/d/' + ids.main + '/edit' : ''; },
      baseline() { return baseline ? JSON.parse(JSON.stringify(baseline)) : null; },
      async load() {
        const model = await withToken(getToken, token => readAll(token, ids.main));
        baseline = model;
        return JSON.parse(JSON.stringify(model));
      },
      async save(data) {
        const local = Calc.normalize(data);
        if (baseline && !hasLocalChanges(baseline, local)) return JSON.parse(JSON.stringify(local));
        const merged = await withToken(getToken, async token => {
          const grids = await readGrids(token, ids.main);
          const base = baseline || Calc.emptyModel();
          const result = syncGrids(base, local, grids);
          const write = result.ops.concat(result.headerTabs.map(tab => ({ tab: tab, type: 'header' })));
          if (write.length) await pushOps(token, ids.main, write);
          return result.merged;
        });
        baseline = merged;
        return JSON.parse(JSON.stringify(merged));
      },
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
    findExisting, ensureFiles, fetchProfile, DEMO_KEY,
    syncGrids, reconcile, sameModel, hasLocalChanges
  };
});
