const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../js/store.js');

test('sheet tables round-trip the business, including formula-like names', () => {
  const calc = require('../js/calc.js');
  const data = calc.normalize({
    config: {
      businessName: '=Lisbon Tuk Tours',
      lang: 'pt',
      currency: 'EUR',
      defaultOwnerPct: 40,
      tipsEnabled: true,
      bonusMode: 'monthly',
      bonusAmount: 100,
      onboarded: true,
      lastBackup: '2026-10-31'
    },
    tuks: [{ id: 't1', name: 'Lisboeta', number: '2', plate: '58-TL-22', fuel: 'electric', garageMonthly: 200, active: true, order: 1 }],
    drivers: [{
      id: 'm', name: 'Miguel Santos', number: '2', phone: '936222410', isOwner: false, active: true, order: 1,
      pctHistory: [{ from: '1970-01-01', pct: 50 }, { from: '2026-10-31', pct: 40 }]
    }],
    assignments: [{ date: '2026-10-31', driverId: 'm', tukId: 't1', workedZero: false, tukExplicit: true }],
    services: [{ id: 's1', date: '2026-10-31', driverId: 'm', amount: 150, note: '' }],
    expenses: [{ id: 'e1', scope: 'daily', date: '2026-10-31', year: 2026, month: 10, tukId: 't1', typeId: 'type-other', amount: 6, note: 'Lavagem' }],
    handovers: [{ id: 'h1', date: '2026-10-28', driverId: 'm', amount: 60, note: 'other' }],
    tips: [],
    goals: [{ year: 2026, month: 10, amount: 4800 }]
  });
  const tables = store.toTables(data);
  assert.equal(tables.Config[0][0], 'Chave');
  assert.ok(tables.Tuks[1][4] === 'Elétrico');
  const back = store.fromTables(tables);
  assert.equal(back.config.businessName, '=Lisbon Tuk Tours');
  assert.equal(back.config.bonusMode, 'monthly');
  assert.equal(back.config.bonusAmount, 100);
  assert.equal(back.config.defaultOwnerPct, 40);
  assert.equal(back.config.onboarded, true);
  assert.equal(back.config.lastBackup, '2026-10-31');
  assert.equal(back.tuks[0].fuel, 'electric');
  assert.equal(back.tuks[0].plate, '58-TL-22');
  assert.equal(back.drivers[0].pctHistory.length, 2);
  assert.equal(calc.driverPct(back.drivers[0], '2026-10-30'), 50);
  assert.equal(calc.driverPct(back.drivers[0], '2026-10-31'), 40);
  assert.equal(back.services[0].amount, 150);
  assert.equal(back.expenses[0].note, 'Lavagem');
  assert.equal(back.handovers[0].amount, 60);
  assert.equal(back.goals[0].amount, 4800);
  assert.equal(store.fileTitle('Lisbon Tuk Tours', false), 'Lisbon Tuk Tours – Tuk Manager');
  assert.equal(store.fileTitle('Lisbon Tuk Tours', true), 'Lisbon Tuk Tours – Tuk Manager (cópia de segurança)');
  assert.equal(store.SHEETS.length, 11);
});

function clone(v) { return JSON.parse(JSON.stringify(v)); }

function sample() {
  const calc = require('../js/calc.js');
  return calc.normalize({
    config: { businessName: 'Lisbon Tuk Tours', lang: 'pt', currency: 'EUR', defaultOwnerPct: 50, tipsEnabled: true, bonusMode: 'off', bonusAmount: 0, onboarded: true, lastBackup: '2026-10-31' },
    tuks: [{ id: 't1', name: 'Lisboeta', number: '2', plate: '58-TL-22', fuel: 'electric', garageMonthly: 150, active: true, order: 1 }],
    drivers: [{ id: 'm', name: 'Miguel', number: '1', phone: '910', isOwner: false, active: true, order: 1, pctHistory: [{ from: '1970-01-01', pct: 50 }] }],
    assignments: [{ date: '2026-10-20', driverId: 'm', tukId: 't1', workedZero: false, tukExplicit: true }],
    services: [{ id: 's1', date: '2026-10-20', driverId: 'm', amount: 80, note: '' }],
    expenses: [{ id: 'g1', scope: 'daily', date: '2026-10-20', year: 2026, month: 10, tukId: 't1', typeId: 'type-other', amount: 6, note: 'Lavagem' }],
    tips: [{ id: 'tip1', date: '2026-10-20', driverId: 'm', amount: 5 }],
    goals: [{ year: 2026, month: 10, amount: 4000 }]
  });
}

test('a save only updates the edited row and keeps externally appended rows', () => {
  const calc = require('../js/calc.js');
  const base = sample();
  const grids = store.toTables(base);
  const importedService = ['imp-srv', '2026-10-01', 'm', 'Miguel', 40, 'importado'];
  const importedDay = ['2026-09-15', 'm', 'Miguel', 't1', 'Lisboeta', 'NÃO', 'SIM'];
  const importedTip = ['imp-tip', '2026-09-15', 'm', 'Miguel', 8];
  const importedGoal = [2026, 11, 4200];
  const importedExpense = ['imp-gas', 'Diário', '2026-09-15', 2026, 9, 't1', 'type-other', 3, ''];
  grids.Servicos.push(importedService);
  grids.Dias.push(importedDay);
  grids.Gratificacoes.push(importedTip);
  grids.Objetivos.push(importedGoal);
  grids.Gastos.push(importedExpense);
  const loaded = store.fromTables(grids);
  assert.equal(loaded.services.length, 2);
  const local = clone(loaded);
  const edited = local.services.find(s => s.id === 's1');
  edited.amount = 90;
  local.services.push({ id: 's-new', date: '2026-10-21', driverId: 'm', amount: 15, note: '' });
  local.assignments.push({ date: '2026-10-21', driverId: 'm', tukId: 't1', workedZero: false, tukExplicit: true });
  const result = store.syncGrids(loaded, calc.normalize(local), grids);
  assert.ok(result.ops.every(op => op.type === 'append' || op.type === 'update' || op.type === 'delete'));
  assert.equal(result.ops.filter(op => op.tab === 'Servicos' && op.type === 'update').length, 1);
  assert.equal(result.ops.find(op => op.tab === 'Servicos' && op.type === 'update').rowNumber > 1, true);
  assert.equal(result.ops.filter(op => op.type === 'delete').length, 0);
  const ids = result.merged.services.map(s => s.id).sort();
  assert.deepEqual(ids, ['imp-srv', 's-new', 's1']);
  assert.equal(result.merged.services.find(s => s.id === 's1').amount, 90);
  assert.equal(result.merged.services.find(s => s.id === 'imp-srv').amount, 40);
  const kept = result.grids.Servicos.find(r => r[0] === 'imp-srv');
  assert.deepEqual(kept, importedService);
  assert.deepEqual(result.grids.Dias.find(r => r[0] === '2026-09-15'), importedDay);
  assert.deepEqual(result.grids.Gratificacoes.find(r => r[0] === 'imp-tip'), importedTip);
  assert.deepEqual(result.grids.Objetivos.find(r => r[0] === 2026 && r[1] === 11), importedGoal);
  assert.deepEqual(result.grids.Gastos.find(r => r[0] === 'imp-gas'), importedExpense);
  const added = result.ops.find(op => op.tab === 'Servicos' && op.type === 'append');
  assert.equal(typeof added.values.Data, 'string');
  assert.equal(added.values.Data, '2026-10-21');
  assert.equal(typeof added.values.Valor, 'number');
  assert.equal(store.hasLocalChanges(loaded, loaded), false);
});

test('stale client does not delete rows it never loaded, and a same-row conflict keeps the sheet', () => {
  const calc = require('../js/calc.js');
  const base = sample();
  const stale = store.fromTables(store.toTables(base));
  const grids = store.toTables(base);
  grids.Servicos.push(['imp-srv', '2026-10-01', 'm', 'Miguel', 40, '']);
  const untouched = store.syncGrids(stale, clone(stale), grids);
  assert.equal(untouched.ops.length, 0);
  assert.ok(untouched.grids.Servicos.some(r => r[0] === 'imp-srv'));

  const adding = clone(stale);
  adding.services.push({ id: 'from-stale', date: '2026-10-22', driverId: 'm', amount: 7, note: '' });
  const added = store.syncGrids(stale, calc.normalize(adding), grids);
  assert.deepEqual(added.ops.map(op => op.type), ['append']);
  assert.ok(added.merged.services.some(s => s.id === 'imp-srv'));
  assert.ok(added.merged.services.some(s => s.id === 'from-stale'));

  const conflictGrid = store.toTables(base);
  conflictGrid.Servicos[1][4] = 20;
  const local = clone(stale);
  local.services[0].amount = 30;
  const conflict = store.syncGrids(stale, calc.normalize(local), conflictGrid);
  assert.equal(conflict.ops.filter(op => op.tab === 'Servicos').length, 0);
  assert.equal(conflict.merged.services.find(s => s.id === 's1').amount, 20);
});

test('two clients editing different records concurrently keep both changes', () => {
  const calc = require('../js/calc.js');
  const base = sample();
  const grids = store.toTables(base);
  grids.Servicos.push(['imp-srv', '2026-10-01', 'm', 'Miguel', 40, 'folha']);
  grids.Dias.push(['2026-09-02', 'm', 'Miguel', '', '', 'SIM', 'NÃO']);
  const loaded = store.fromTables(grids);
  const baselineA = clone(loaded);
  const baselineB = clone(loaded);

  const localA = clone(loaded);
  localA.services.find(s => s.id === 's1').amount = 99;
  localA.services.push({ id: 'only-a', date: '2026-10-05', driverId: 'm', amount: 11, note: 'a' });

  const localB = clone(loaded);
  localB.tips.push({ id: 'only-b', date: '2026-10-06', driverId: 'm', amount: 4 });
  localB.goals.push({ year: 2026, month: 11, amount: 4100 });
  const existingGoal = localB.goals.find(g => g.year === 2026 && g.month === 10);
  existingGoal.amount = 4500;

  const first = store.syncGrids(baselineA, calc.normalize(localA), grids);
  const second = store.syncGrids(baselineB, calc.normalize(localB), first.grids);
  const finalModel = second.merged;
  const byId = Object.fromEntries(finalModel.services.map(s => [s.id, s.amount]));
  assert.equal(byId['s1'], 99);
  assert.equal(byId['only-a'], 11);
  assert.equal(byId['imp-srv'], 40);
  assert.ok(finalModel.tips.some(t => t.id === 'only-b' && t.amount === 4));
  assert.equal(finalModel.goals.find(g => g.month === 10).amount, 4500);
  assert.equal(finalModel.goals.find(g => g.month === 11).amount, 4100);
  assert.ok(finalModel.assignments.some(a => a.date === '2026-09-02' && a.workedZero));
  assert.deepEqual(second.grids.Servicos.find(r => r[0] === 'imp-srv'), ['imp-srv', '2026-10-01', 'm', 'Miguel', 40, 'folha']);
  assert.ok(second.ops.every(op => op.type !== 'clear'));
  const removed = clone(finalModel);
  const beforeDelete = second.grids;
  const baselineC = clone(finalModel);
  removed.services = removed.services.filter(s => s.id !== 'only-a');
  const afterDelete = store.syncGrids(baselineC, calc.normalize(removed), beforeDelete);
  assert.equal(afterDelete.ops.filter(op => op.type === 'delete' && op.key === 'only-a').length, 1);
  assert.ok(!afterDelete.merged.services.some(s => s.id === 'only-a'));
  assert.ok(afterDelete.merged.services.some(s => s.id === 'imp-srv'));
});

test('an old percent row id still matches the driver and date, and dates stay text', () => {
  const calc = require('../js/calc.js');
  const base = sample();
  const grids = store.toTables(base);
  grids.Percentagens.push(['m:1970-01-01:0', 'm', 'Miguel', '1970-01-01', 50]);
  // replace the generated row with the legacy id shape by dropping the generated one
  grids.Percentagens = [grids.Percentagens[0], ['m:1970-01-01:0', 'm', 'Miguel', '1970-01-01', 50]];
  const loaded = store.fromTables(grids);
  assert.equal(calc.driverPct(loaded.drivers[0], '2026-10-20'), 50);
  const local = clone(loaded);
  local.drivers[0] = calc.setPctFrom(local.drivers[0], '2026-10-31', 40);
  const result = store.syncGrids(loaded, local, grids);
  const updates = result.ops.filter(op => op.tab === 'Percentagens' && op.type === 'update');
  const appends = result.ops.filter(op => op.tab === 'Percentagens' && op.type === 'append');
  assert.equal(updates.length, 0);
  assert.equal(appends.length, 1);
  assert.equal(appends[0].values.Desde, '2026-10-31');
  assert.equal(typeof appends[0].values.Desde, 'string');
  assert.equal(result.merged.drivers[0].pctHistory.length, 2);
  assert.equal(result.grids.Percentagens[1][0], 'm:1970-01-01:0');
});

test('root service worker ignores /manager/ and keeps the Voyager cache name', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const sw = fs.readFileSync(path.join(__dirname, '../../sw.js'), 'utf8');
  assert.match(sw, /voyager-shell-v3/);
  assert.match(sw, /\\\/manager\(\\\/\|\$\)\//);
  assert.match(sw, /tuk-manager-/);
  assert.match(sw, /index\.html/);
  assert.doesNotMatch(sw, /voyager-shell-v4/);
});
