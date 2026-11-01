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
