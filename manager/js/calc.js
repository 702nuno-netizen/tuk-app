/* Tuk Manager — cálculo puro (sem DOM). Testável com node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TMCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function toCents(n) {
    const x = Number(n);
    if (!isFinite(x)) return 0;
    const neg = x < 0;
    const s = Math.abs(x).toFixed(2);
    const [i, d] = s.split('.');
    const c = Number(i) * 100 + Number(d || 0);
    return neg ? -c : c;
  }
  function fromCents(c) {
    const n = Math.round(Number(c) || 0);
    const neg = n < 0;
    const a = Math.abs(n);
    return (neg ? -1 : 1) * (Math.floor(a / 100) + (a % 100) / 100);
  }
  function money(n) { return fromCents(toCents(n)); }

  function isoParts(iso) {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return { y: y || 0, m: m || 0, d: d || 0 };
  }
  function iso(y, m, d) {
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function addDays(date, n) {
    const { y, m, d } = isoParts(date);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return t.toISOString().slice(0, 10);
  }
  function diffDays(from, to) {
    const a = Date.parse(from + 'T00:00:00Z');
    const b = Date.parse(to + 'T00:00:00Z');
    if (!isFinite(a) || !isFinite(b)) return 0;
    return Math.round((b - a) / 86400000);
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function monthEnd(y, m) { return iso(y, m, daysInMonth(y, m)); }
  function ym(date, y, m) {
    const p = isoParts(date);
    return p.y === y && p.m === m;
  }
  function lisbonToday(now) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(now || new Date());
  }

  function defaultExpenseTypes() {
    return [
      { id: 'type-fuel', systemKey: 'fuel', name: 'Combustível', nameCustom: false, kind: 'daily', repeatMonthly: false, defaultAmount: 0, factory: true, deleted: false, order: 1 },
      { id: 'type-other', systemKey: 'other', name: 'Outros', nameCustom: false, kind: 'daily', repeatMonthly: false, defaultAmount: 0, factory: true, deleted: false, order: 2 },
      { id: 'type-garage', systemKey: 'garage', name: 'Garagem', nameCustom: false, kind: 'monthly', repeatMonthly: true, defaultAmount: 0, factory: true, deleted: false, order: 3 },
      { id: 'type-maint', systemKey: 'maint', name: 'Manutenção', nameCustom: false, kind: 'monthly', repeatMonthly: false, defaultAmount: 0, factory: true, deleted: false, order: 4 },
      { id: 'type-tax', systemKey: 'tax', name: 'Impostos', nameCustom: false, kind: 'monthly', repeatMonthly: false, defaultAmount: 0, factory: true, deleted: false, order: 5 }
    ];
  }

  function emptyModel() {
    return {
      config: {
        businessName: '',
        lang: 'pt',
        currency: 'EUR',
        defaultOwnerPct: 50,
        tipsEnabled: true,
        bonusMode: 'off',
        bonusAmount: 0,
        onboarded: false,
        wizardStep: 1,
        schemaVersion: 1,
        lastBackup: ''
      },
      tuks: [],
      drivers: [],
      expenseTypes: defaultExpenseTypes(),
      assignments: [],
      services: [],
      expenses: [],
      handovers: [],
      tips: [],
      goals: []
    };
  }

  function bool(v, fallback) {
    if (typeof v === 'boolean') return v;
    if (v == null || v === '') return fallback;
    const s = String(v).trim().toLowerCase();
    if (['sim', 'yes', 'true', '1'].includes(s)) return true;
    if (['não', 'nao', 'no', 'false', '0'].includes(s)) return false;
    return fallback;
  }

  function normalize(raw) {
    const base = emptyModel();
    const d = raw && typeof raw === 'object' ? raw : {};
    const c = d.config && typeof d.config === 'object' ? d.config : {};
    base.config = {
      businessName: String(c.businessName || '').slice(0, 80),
      lang: c.lang === 'en' ? 'en' : 'pt',
      currency: ['EUR', 'USD', 'GBP'].includes(c.currency) ? c.currency : 'EUR',
      defaultOwnerPct: clampPct(c.defaultOwnerPct == null ? 50 : c.defaultOwnerPct),
      tipsEnabled: bool(c.tipsEnabled, true),
      bonusMode: c.bonusMode === 'monthly' ? 'monthly' : 'off',
      bonusAmount: Math.max(0, money(c.bonusAmount || 0)),
      onboarded: bool(c.onboarded, false),
      wizardStep: Math.min(7, Math.max(1, Number(c.wizardStep) || 1)),
      schemaVersion: 1,
      lastBackup: String(c.lastBackup || '').slice(0, 10)
    };
    base.tuks = (Array.isArray(d.tuks) ? d.tuks : []).map(normalizeTuk).filter(Boolean);
    base.drivers = (Array.isArray(d.drivers) ? d.drivers : []).map(normalizeDriver).filter(Boolean);
    const types = (Array.isArray(d.expenseTypes) ? d.expenseTypes : []).map(normalizeType).filter(Boolean);
    base.expenseTypes = types.length ? types : defaultExpenseTypes();
    base.assignments = (Array.isArray(d.assignments) ? d.assignments : []).map(normalizeAssignment).filter(Boolean);
    base.services = (Array.isArray(d.services) ? d.services : []).map(normalizeService).filter(Boolean);
    base.expenses = (Array.isArray(d.expenses) ? d.expenses : []).map(normalizeExpense).filter(Boolean);
    base.handovers = (Array.isArray(d.handovers) ? d.handovers : []).map(normalizeHandover).filter(Boolean);
    base.tips = (Array.isArray(d.tips) ? d.tips : []).map(normalizeTip).filter(Boolean);
    base.goals = (Array.isArray(d.goals) ? d.goals : []).map(normalizeGoal).filter(Boolean);
    return base;
  }

  function clampPct(n) {
    const x = Number(n);
    if (!isFinite(x)) return 50;
    return Math.min(100, Math.max(0, Math.round(x * 100) / 100));
  }
  function normalizeTuk(t) {
    if (!t || !t.id) return null;
    const fuel = String(t.fuel || '').toLowerCase();
    return {
      id: String(t.id),
      name: String(t.name || '').slice(0, 60),
      number: String(t.number == null ? '' : t.number).slice(0, 8),
      plate: String(t.plate || '').slice(0, 16),
      fuel: fuel.startsWith('el') || fuel === 'electric' ? 'electric' : 'combustion',
      garageMonthly: Math.max(0, money(t.garageMonthly || 0)),
      active: bool(t.active, true),
      deleted: bool(t.deleted, false),
      order: Number(t.order) || 0
    };
  }
  function normalizeDriver(d) {
    if (!d || !d.id) return null;
    let hist = Array.isArray(d.pctHistory) ? d.pctHistory.map(h => ({
      from: String(h.from || '1970-01-01').slice(0, 10),
      pct: clampPct(h.pct)
    })) : [];
    hist = hist.filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h.from));
    if (!hist.length) hist = [{ from: '1970-01-01', pct: clampPct(d.pct == null ? 50 : d.pct) }];
    hist.sort((a, b) => a.from.localeCompare(b.from));
    return {
      id: String(d.id),
      name: String(d.name || '').slice(0, 60),
      number: String(d.number == null ? '' : d.number).slice(0, 8),
      phone: String(d.phone || '').slice(0, 24),
      isOwner: bool(d.isOwner, false),
      active: bool(d.active, true),
      deleted: bool(d.deleted, false),
      order: Number(d.order) || 0,
      pctHistory: hist
    };
  }
  function normalizeType(t) {
    if (!t || !t.id) return null;
    const kind = t.kind === 'monthly' || t.kind === 'mensal' ? 'monthly' : 'daily';
    return {
      id: String(t.id),
      systemKey: t.systemKey ? String(t.systemKey) : '',
      name: String(t.name || '').slice(0, 40),
      nameCustom: bool(t.nameCustom, false),
      kind,
      repeatMonthly: kind === 'monthly' && bool(t.repeatMonthly, false),
      defaultAmount: Math.max(0, money(t.defaultAmount || 0)),
      factory: bool(t.factory, false),
      deleted: bool(t.deleted, false),
      order: Number(t.order) || 0
    };
  }
  function normalizeAssignment(a) {
    if (!a || !a.date || !a.driverId) return null;
    return {
      date: String(a.date).slice(0, 10),
      driverId: String(a.driverId),
      tukId: a.tukId ? String(a.tukId) : null,
      workedZero: bool(a.workedZero, false),
      tukExplicit: bool(a.tukExplicit, false)
    };
  }
  function normalizeService(s) {
    if (!s || !s.id || !s.date || !s.driverId) return null;
    return { id: String(s.id), date: String(s.date).slice(0, 10), driverId: String(s.driverId), amount: Math.max(0, money(s.amount || 0)), note: String(s.note || '').slice(0, 140) };
  }
  function normalizeExpense(e) {
    if (!e || !e.id || !e.typeId) return null;
    const scope = e.scope === 'monthly' ? 'monthly' : 'daily';
    return {
      id: String(e.id),
      scope,
      date: scope === 'daily' ? String(e.date || '').slice(0, 10) : '',
      year: Number(e.year) || (e.date ? isoParts(e.date).y : 0),
      month: Number(e.month) || (e.date ? isoParts(e.date).m : 0),
      tukId: e.tukId ? String(e.tukId) : null,
      typeId: String(e.typeId),
      amount: Math.max(0, money(e.amount || 0)),
      note: String(e.note || '').slice(0, 140)
    };
  }
  function normalizeHandover(h) {
    if (!h || !h.id || !h.date || !h.driverId) return null;
    return { id: String(h.id), date: String(h.date).slice(0, 10), driverId: String(h.driverId), amount: Math.max(0, money(h.amount || 0)), note: String(h.note || '').slice(0, 140) };
  }
  function normalizeTip(t) {
    if (!t || !t.id || !t.date || !t.driverId) return null;
    return { id: String(t.id), date: String(t.date).slice(0, 10), driverId: String(t.driverId), amount: Math.max(0, money(t.amount || 0)) };
  }
  function normalizeGoal(g) {
    if (!g) return null;
    const year = Number(g.year), month = Number(g.month);
    if (!year || month < 1 || month > 12) return null;
    return { year, month, amount: Math.max(0, money(g.amount || 0)) };
  }

  function restoreFactoryTypes(types) {
    const defs = defaultExpenseTypes();
    const next = (types || []).map(t => ({ ...t }));
    defs.forEach(d => {
      const i = next.findIndex(t => t.systemKey === d.systemKey);
      if (i >= 0) {
        next[i] = {
          ...next[i],
          kind: d.kind,
          repeatMonthly: d.repeatMonthly,
          defaultAmount: 0,
          deleted: false,
          factory: true,
          nameCustom: false,
          name: d.name,
          order: d.order,
          systemKey: d.systemKey
        };
      } else next.push({ ...d });
    });
    return next;
  }

  function byOrder(a, b) { return (a.order || 0) - (b.order || 0) || String(a.name || '').localeCompare(String(b.name || '')); }

  function activeDrivers(data) {
    return data.drivers.filter(d => d.active && !d.deleted).slice().sort(byOrder);
  }
  function activeTuks(data) {
    return data.tuks.filter(t => t.active && !t.deleted).slice().sort(byOrder);
  }
  function driverById(data, id) { return data.drivers.find(d => d.id === id) || null; }
  function tukById(data, id) { return id ? (data.tuks.find(t => t.id === id) || null) : null; }

  function driverPct(driver, date) {
    if (!driver) return 0;
    const hist = (driver.pctHistory || []).slice().sort((a, b) => a.from.localeCompare(b.from));
    let pct = 50;
    let found = false;
    for (const h of hist) {
      if (h.from <= date) { pct = Number(h.pct); found = true; }
    }
    if (!found && hist.length) pct = Number(hist[0].pct);
    return clampPct(pct);
  }

  function setPctFrom(driver, date, pct) {
    const hist = (driver.pctHistory || []).filter(h => h.from !== date);
    hist.push({ from: date, pct: clampPct(pct) });
    hist.sort((a, b) => a.from.localeCompare(b.from));
    return { ...driver, pctHistory: hist };
  }

  function shareCents(grossCents, pct) {
    const g = Math.max(0, Math.round(grossCents || 0));
    const p = clampPct(pct);
    return Math.round(g * p / 100);
  }

  function assignmentOf(list, date, driverId) {
    return list.find(a => a.date === date && a.driverId === driverId) || null;
  }

  function suggestTuk(data, driverId, date, assignments) {
    const list = assignments || data.assignments;
    const prev = list.filter(a => a.driverId === driverId && a.date < date && a.tukId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!prev) return null;
    const tuk = tukById(data, prev.tukId);
    if (!tuk || tuk.deleted || tuk.active === false) return null;
    const taken = list.some(a => a.date === date && a.driverId !== driverId && a.tukId === prev.tukId);
    if (taken) return null;
    return prev.tukId;
  }

  function resolvedTukId(data, driverId, date) {
    const row = assignmentOf(data.assignments, date, driverId);
    if (row && (row.tukExplicit || row.tukId)) return row.tukId || null;
    return suggestTuk(data, driverId, date, data.assignments);
  }

  function withSuggestions(data, date) {
    const assignments = data.assignments.map(a => ({ ...a }));
    let changed = false;
    for (const driver of activeDrivers(data)) {
      const row = assignmentOf(assignments, date, driver.id);
      if (row && (row.tukExplicit || row.tukId)) continue;
      const tukId = suggestTuk(data, driver.id, date, assignments);
      if (!tukId) continue;
      if (row) row.tukId = tukId;
      else assignments.push({ date, driverId: driver.id, tukId, workedZero: false, tukExplicit: false });
      changed = true;
    }
    return changed ? { ...data, assignments } : data;
  }

  function applyTukChoice(data, date, driverId, tukId) {
    const assignments = data.assignments.map(a => ({ ...a }));
    const chosen = tukId || null;
    if (chosen) {
      for (const a of assignments) {
        if (a.date === date && a.driverId !== driverId && a.tukId === chosen) {
          a.tukId = null;
          a.tukExplicit = true;
        }
      }
    }
    let row = assignmentOf(assignments, date, driverId);
    if (!row) {
      row = { date, driverId, tukId: chosen, workedZero: false, tukExplicit: true };
      assignments.push(row);
    } else {
      row.tukId = chosen;
      row.tukExplicit = true;
    }
    return { ...data, assignments };
  }

  function setWorkedZero(data, date, driverId, on) {
    const assignments = data.assignments.map(a => ({ ...a }));
    let row = assignmentOf(assignments, date, driverId);
    if (!row) {
      row = { date, driverId, tukId: null, workedZero: false, tukExplicit: false };
      assignments.push(row);
    }
    row.workedZero = !!on;
    const services = on ? data.services.filter(s => !(s.date === date && s.driverId === driverId)) : data.services;
    return { ...data, assignments, services };
  }

  function sumServicesCents(data, driverId, date) {
    let c = 0;
    for (const s of data.services) {
      if (s.driverId === driverId && s.date === date) c += toCents(s.amount);
    }
    return c;
  }
  function sumTipsCents(data, driverId, date) {
    if (!data.config.tipsEnabled) return 0;
    let c = 0;
    for (const t of data.tips) {
      if (t.driverId === driverId && t.date === date) c += toCents(t.amount);
    }
    return c;
  }
  function workedFlag(data, driverId, date) {
    const row = assignmentOf(data.assignments, date, driverId);
    return !!(row && row.workedZero);
  }

  function goalAmount(data, year, month) {
    const g = data.goals.find(x => x.year === year && x.month === month);
    return g ? g.amount : 0;
  }

  function grossCentsMonth(data, year, month, driverId) {
    let c = 0;
    for (const s of data.services) {
      if (!ym(s.date, year, month)) continue;
      if (driverId && s.driverId !== driverId) continue;
      c += toCents(s.amount);
    }
    return c;
  }

  function driversWhoWorked(data, year, month) {
    const set = new Set();
    for (const s of data.services) {
      if (ym(s.date, year, month) && toCents(s.amount) > 0) set.add(s.driverId);
    }
    for (const a of data.assignments) {
      if (a.workedZero && ym(a.date, year, month)) set.add(a.driverId);
    }
    return set;
  }

  function lastYearAverage(data, year, month) {
    const y = year - 1;
    const set = driversWhoWorked(data, y, month);
    if (!set.size) return null;
    const gross = grossCentsMonth(data, y, month, null);
    return fromCents(Math.round(gross / set.size));
  }

  function goalsFromLastYear(data, year) {
    const goals = data.goals.filter(g => g.year !== year).map(g => ({ year: g.year, month: g.month, amount: g.amount }));
    const filled = [];
    for (let m = 1; m <= 12; m++) {
      const avg = lastYearAverage(data, year, m);
      const amount = avg == null ? 0 : avg;
      goals.push({ year, month: m, amount });
      filled.push({ month: m, amount, hadData: avg != null });
    }
    return { data: { ...data, goals }, filled };
  }

  function bonusFor(data, driver, year, month) {
    const goal = toCents(goalAmount(data, year, month));
    const gross = grossCentsMonth(data, year, month, driver.id);
    const hit = goal > 0 && gross >= goal;
    if (!hit) return { hit: false, cents: 0, date: null, grossCents: gross, goalCents: goal };
    let cum = 0;
    let hitDate = null;
    const dim = daysInMonth(year, month);
    for (let d = 1; d <= dim; d++) {
      const date = iso(year, month, d);
      cum += sumServicesCents(data, driver.id, date);
      if (!hitDate && cum >= goal) hitDate = date;
    }
    const cents = (data.config.bonusMode === 'monthly' && !driver.isOwner) ? toCents(data.config.bonusAmount) : 0;
    return { hit: true, cents: Math.max(0, cents), date: hitDate || monthEnd(year, month), grossCents: gross, goalCents: goal };
  }

  function monthCarriesRepeat(data, year, month, today) {
    const p = isoParts(today || '9999-12-31');
    if (year > p.y || (year === p.y && month > p.m)) return false;
    if (year === p.y && month === p.m) return true;
    if (data.services.some(s => ym(s.date, year, month) && toCents(s.amount) > 0)) return true;
    if (data.assignments.some(a => a.workedZero && ym(a.date, year, month))) return true;
    if (data.expenses.some(e => e.scope === 'daily' && e.date && ym(e.date, year, month) && toCents(e.amount) > 0)) return true;
    return false;
  }

  function monthlyLines(data, year, month, today) {
    const carry = monthCarriesRepeat(data, year, month, today);
    const types = data.expenseTypes.filter(t => !t.deleted && t.kind === 'monthly').slice().sort(byOrder);
    return types.map(t => {
      const explicit = data.expenses.filter(e => e.scope === 'monthly' && Number(e.year) === year && Number(e.month) === month && e.typeId === t.id);
      if (explicit.length) {
        const cents = explicit.reduce((s, e) => s + toCents(e.amount), 0);
        return { type: t, cents, source: 'explicit', entries: explicit, parts: garageParts(data, t) };
      }
      if (t.repeatMonthly && carry && t.systemKey === 'garage') {
        const parts = garageParts(data, t);
        const cents = parts.reduce((s, p) => s + p.cents, 0);
        return { type: t, cents, source: 'garage', entries: [], parts };
      }
      if (t.repeatMonthly && carry) {
        return { type: t, cents: toCents(t.defaultAmount), source: 'repeat', entries: [], parts: [] };
      }
      return { type: t, cents: 0, source: 'empty', entries: [], parts: t.systemKey === 'garage' ? garageParts(data, t) : [] };
    });
  }
  function garageParts(data, type) {
    if (!type || type.systemKey !== 'garage') return [];
    return activeTuks(data).map(tk => ({ tukId: tk.id, name: tk.name, cents: toCents(tk.garageMonthly) }));
  }

  function emptyLedger() {
    return {
      status: 'clear', totalDueCents: 0, creditCents: 0, overdueCents: 0, recentCents: 0,
      untilYesterdayCents: 0, oldestUnpaidDate: null, oldestAgeDays: 0,
      entries: [], allocations: [], open: []
    };
  }

  function buildLedger(data, driverId, today) {
    const driver = driverById(data, driverId);
    if (!driver) return emptyLedger();
    const dates = new Set();
    for (const s of data.services) if (s.driverId === driverId && s.date <= today) dates.add(s.date);
    for (const a of data.assignments) if (a.driverId === driverId && a.workedZero && a.date <= today) dates.add(a.date);
    const charges = [];
    [...dates].sort().forEach(date => {
      const grossCents = sumServicesCents(data, driverId, date);
      const zero = workedFlag(data, driverId, date);
      if (grossCents <= 0 && !zero) return;
      const pct = driverPct(driver, date);
      const share = driver.isOwner ? 0 : shareCents(grossCents, pct);
      charges.push({
        id: 'day:' + date,
        date,
        grossCents,
        pct,
        shareCents: share,
        isOwner: !!driver.isOwner,
        tukId: resolvedTukId(data, driverId, date)
      });
    });
    const payments = [];
    for (const h of data.handovers) {
      if (h.driverId === driverId && h.date <= today && toCents(h.amount) > 0) {
        payments.push({ id: h.id, date: h.date, cents: toCents(h.amount), kind: 'handover', note: h.note || '' });
      }
    }
    const months = new Set(charges.map(c => c.date.slice(0, 7)));
    for (const key of months) {
      const [y, m] = key.split('-').map(Number);
      const b = bonusFor(data, driver, y, m);
      if (b.cents > 0 && b.date && b.date <= today) {
        payments.push({ id: 'bonus:' + key + ':' + driverId, date: b.date, cents: b.cents, kind: 'bonus', note: '' });
      }
    }
    const events = [
      ...charges.map(c => ({ kind: 'charge', date: c.date, rank: 0, charge: c })),
      ...payments.map(p => ({ kind: 'pay', date: p.date, rank: p.kind === 'bonus' ? 2 : 1, pay: p }))
    ].sort((a, b) => a.date.localeCompare(b.date) || a.rank - b.rank || ((a.charge && a.charge.id) || (a.pay && a.pay.id) || '').localeCompare((b.charge && b.charge.id) || (b.pay && b.pay.id) || ''));

    const open = [];
    const allocations = [];
    const entries = [];
    let running = 0;
    for (const ev of events) {
      if (ev.kind === 'charge') {
        let left = ev.charge.shareCents;
        while (left > 0 && open.length && open[0].credit) {
          const pot = open[0];
          const use = Math.min(pot.credit, left);
          pot.credit -= use;
          left -= use;
          if (pot.credit === 0) open.shift();
        }
        const rem = left;
        if (rem > 0) open.push({ charge: ev.charge, remaining: rem });
        running += ev.charge.shareCents;
        entries.push({ kind: 'day', date: ev.charge.date, cents: ev.charge.shareCents, runningCents: running, charge: ev.charge, remainingCents: rem });
      } else {
        let moneyLeft = ev.pay.cents;
        const touched = [];
        while (moneyLeft > 0 && open.length) {
          const slot = open[0];
          if (slot.credit) break;
          const use = Math.min(slot.remaining, moneyLeft);
          slot.remaining -= use;
          moneyLeft -= use;
          const alloc = { paymentId: ev.pay.id, chargeId: slot.charge.id, chargeDate: slot.charge.date, cents: use };
          allocations.push(alloc);
          touched.push(alloc);
          if (slot.remaining === 0) open.shift();
        }
        running -= ev.pay.cents;
        if (moneyLeft > 0) open.unshift({ credit: moneyLeft });
        entries.push({ kind: ev.pay.kind, date: ev.pay.date, cents: ev.pay.cents, runningCents: running, payment: ev.pay, touched });
      }
    }
    // Recompute remaining on day entries after later payments (the push above stored remaining at charge time).
    const remById = {};
    for (const slot of open) if (slot.charge) remById[slot.charge.id] = slot.remaining;
    for (const e of entries) {
      if (e.kind === 'day') e.remainingCents = remById[e.charge.id] || 0;
    }
    let totalDue = 0, overdue = 0, recent = 0, untilY = 0;
    let oldest = null;
    for (const slot of open) {
      if (!slot.charge) continue;
      totalDue += slot.remaining;
      const age = diffDays(slot.charge.date, today);
      if (age >= 7) overdue += slot.remaining;
      else recent += slot.remaining;
      if (slot.charge.date < today) untilY += slot.remaining;
      if (!oldest || slot.charge.date < oldest.date) oldest = { date: slot.charge.date, age, remaining: slot.remaining };
    }
    const credit = open.reduce((s, slot) => s + (slot.credit || 0), 0);
    let status = 'clear';
    if (totalDue > 0 && overdue > 0) status = 'red';
    else if (totalDue > 0) status = 'amber';
    else if (credit > 0) status = 'credit';
    return {
      status,
      totalDueCents: totalDue,
      creditCents: credit,
      overdueCents: overdue,
      recentCents: recent,
      untilYesterdayCents: untilY,
      oldestUnpaidDate: oldest ? oldest.date : null,
      oldestAgeDays: oldest ? oldest.age : 0,
      entries,
      allocations,
      open: open.filter(s => s.charge).map(s => ({ date: s.charge.date, remaining: s.remaining, age: diffDays(s.charge.date, today) }))
    };
  }

  function summarizeDay(data, date) {
    let gross = 0, tips = 0, ownerShare = 0, company = 0, working = 0;
    const per = [];
    for (const d of data.drivers) {
      const grossCents = sumServicesCents(data, d.id, date);
      const tipCents = d.isOwner ? sumTipsCents(data, d.id, date) : sumTipsCents(data, d.id, date);
      const zero = workedFlag(data, d.id, date);
      const worked = grossCents > 0 || zero;
      if (worked) working += 1;
      const pct = driverPct(d, date);
      const share = d.isOwner ? 0 : shareCents(grossCents, pct);
      const companyCents = (d.isOwner ? grossCents : share) + tipCents;
      if (worked || tipCents > 0) {
        gross += grossCents;
        tips += tipCents;
        ownerShare += share;
        company += companyCents;
      }
      per.push({
        driverId: d.id, grossCents, tipCents, shareCents: share, companyCents, pct,
        worked, tukId: resolvedTukId(data, d.id, date), isOwner: !!d.isOwner
      });
    }
    return { grossCents: gross, tipsCents: tips, ownerShareCents: ownerShare, companyCents: company, working, per };
  }

  function dayCount(data, driverId, year, month) {
    const dates = new Set();
    for (const s of data.services) {
      if (s.driverId === driverId && ym(s.date, year, month) && toCents(s.amount) > 0) dates.add(s.date);
    }
    for (const a of data.assignments) {
      if (a.driverId === driverId && a.workedZero && ym(a.date, year, month)) dates.add(a.date);
    }
    return dates.size;
  }

  function computeMonth(data, year, month, today) {
    const grossCents = grossCentsMonth(data, year, month, null);
    let tipsCents = 0;
    if (data.config.tipsEnabled) {
      for (const t of data.tips) if (ym(t.date, year, month)) tipsCents += toCents(t.amount);
    }
    let ownerShareCents = 0;
    let ownerDriverGross = 0;
    const byDriver = [];
    for (const d of data.drivers) {
      const g = grossCentsMonth(data, year, month, d.id);
      const days = dayCount(data, d.id, year, month);
      let share = 0;
      if (!d.isOwner) {
        const dim = daysInMonth(year, month);
        for (let day = 1; day <= dim; day++) {
          const date = iso(year, month, day);
          const gc = sumServicesCents(data, d.id, date);
          if (gc > 0) share += shareCents(gc, driverPct(d, date));
        }
        ownerShareCents += share;
      } else ownerDriverGross += g;
      const bonus = bonusFor(data, d, year, month);
      const led = buildLedger(data, d.id, today);
      byDriver.push({
        id: d.id, name: d.name, isOwner: !!d.isOwner, active: !!d.active, deleted: !!d.deleted,
        days, grossCents: g, ownerShareCents: share,
        hitGoal: bonus.hit, bonusCents: bonus.cents, goalCents: bonus.goalCents,
        dueCents: led.totalDueCents, creditCents: led.creditCents, status: led.status,
        oldestAgeDays: led.oldestAgeDays, oldestUnpaidDate: led.oldestUnpaidDate
      });
    }
    let dailyExpenseCents = 0;
    for (const e of data.expenses) {
      if (e.scope === 'daily' && e.date && ym(e.date, year, month)) dailyExpenseCents += toCents(e.amount);
    }
    const lines = monthlyLines(data, year, month, today);
    const monthlyExpenseCents = lines.reduce((s, l) => s + l.cents, 0);
    const bonusCents = byDriver.reduce((s, d) => s + d.bonusCents, 0);
    const companyIncomeCents = ownerShareCents + ownerDriverGross + tipsCents;
    const profitCents = companyIncomeCents - dailyExpenseCents - monthlyExpenseCents - bonusCents;
    const daySet = new Set();
    for (const s of data.services) if (ym(s.date, year, month) && toCents(s.amount) > 0) daySet.add(s.date);
    for (const a of data.assignments) if (a.workedZero && ym(a.date, year, month)) daySet.add(a.date);
    const tukMap = new Map();
    for (const s of data.services) {
      if (!ym(s.date, year, month)) continue;
      const id = resolvedTukId(data, s.driverId, s.date) || '';
      tukMap.set(id, (tukMap.get(id) || 0) + toCents(s.amount));
    }
    const byTuk = [...tukMap.entries()].map(([id, cents]) => ({ id, cents })).sort((a, b) => b.cents - a.cents);
    const expByType = [];
    const typeDaily = data.expenseTypes.filter(t => !t.deleted && t.kind === 'daily');
    for (const t of typeDaily) {
      let c = 0;
      for (const e of data.expenses) if (e.scope === 'daily' && e.typeId === t.id && e.date && ym(e.date, year, month)) c += toCents(e.amount);
      if (c) expByType.push({ typeId: t.id, cents: c, scope: 'daily' });
    }
    for (const l of lines) if (l.cents) expByType.push({ typeId: l.type.id, cents: l.cents, scope: 'monthly' });
    return {
      year, month, grossCents, tipsCents, ownerShareCents, ownerDriverGrossCents: ownerDriverGross,
      companyIncomeCents, dailyExpenseCents, monthlyExpenseCents, bonusCents, profitCents,
      daysWithService: daySet.size, byDriver, byTuk, lines, expByType,
      goalCents: toCents(goalAmount(data, year, month))
    };
  }

  function computeYear(data, year, today) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const mo = computeMonth(data, year, m, today);
      months.push({
        month: m,
        grossCents: mo.grossCents,
        tipsCents: mo.tipsCents,
        companyIncomeCents: mo.companyIncomeCents,
        expenseCents: mo.dailyExpenseCents + mo.monthlyExpenseCents,
        bonusCents: mo.bonusCents,
        profitCents: mo.profitCents
      });
    }
    const sum = key => months.reduce((s, m) => s + m[key], 0);
    const tukMap = new Map();
    const drvMap = new Map();
    for (let m = 1; m <= 12; m++) {
      const mo = computeMonth(data, year, m, today);
      for (const t of mo.byTuk) tukMap.set(t.id, (tukMap.get(t.id) || 0) + t.cents);
      for (const d of mo.byDriver) {
        const cur = drvMap.get(d.id) || { id: d.id, grossCents: 0, days: 0, bonusCents: 0 };
        cur.grossCents += d.grossCents;
        cur.days += d.days;
        cur.bonusCents += d.bonusCents;
        drvMap.set(d.id, cur);
      }
    }
    return {
      year,
      grossCents: sum('grossCents'),
      tipsCents: sum('tipsCents'),
      companyIncomeCents: sum('companyIncomeCents'),
      expenseCents: sum('expenseCents'),
      bonusCents: sum('bonusCents'),
      profitCents: sum('profitCents'),
      months,
      byTuk: [...tukMap.entries()].map(([id, cents]) => ({ id, cents })).sort((a, b) => b.cents - a.cents),
      byDriver: [...drvMap.values()].sort((a, b) => b.grossCents - a.grossCents)
    };
  }

  function handoverSuggestions(ledger) {
    return {
      allCents: ledger.totalDueCents,
      untilYesterdayCents: ledger.untilYesterdayCents
    };
  }

  return {
    toCents, fromCents, money, clampPct,
    isoParts, iso, addDays, diffDays, daysInMonth, monthEnd, ym, lisbonToday,
    defaultExpenseTypes, emptyModel, normalize, restoreFactoryTypes,
    activeDrivers, activeTuks, driverById, tukById, byOrder,
    driverPct, setPctFrom, shareCents,
    suggestTuk, resolvedTukId, withSuggestions, applyTukChoice, setWorkedZero,
    goalAmount, grossCentsMonth, driversWhoWorked, lastYearAverage, goalsFromLastYear,
    bonusFor, monthlyLines, buildLedger, summarizeDay, computeMonth, computeYear,
    handoverSuggestions, sumServicesCents
  };
});
