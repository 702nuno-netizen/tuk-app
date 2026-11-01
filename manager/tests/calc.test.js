const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../js/calc.js');

const TODAY = '2026-10-31';

function driver(partial) {
  return calc.normalize({
    drivers: [{
      id: partial.id,
      name: partial.name || partial.id,
      isOwner: !!partial.isOwner,
      pctHistory: partial.pctHistory || [{ from: '1970-01-01', pct: partial.pct == null ? 50 : partial.pct }],
      active: partial.active !== false,
      deleted: !!partial.deleted,
      order: partial.order || 0
    }]
  }).drivers[0];
}

function base(extra) {
  const data = calc.emptyModel();
  Object.assign(data, extra || {});
  data.config = Object.assign(data.config, (extra && extra.config) || {});
  return calc.normalize(data);
}

test('owner share is billing × percent, rounded to the cent; owner owes nothing', () => {
  assert.equal(calc.shareCents(30000, 50), 15000);
  assert.equal(calc.shareCents(1000, 33.33), 333);
  assert.equal(calc.shareCents(1000, 0), 0);
  assert.equal(calc.shareCents(1000, 100), 1000);
  const owner = driver({ id: 'n', isOwner: true, pct: 50 });
  assert.equal(calc.driverPct(owner, '2026-10-31'), 50);
  const data = base({
    drivers: [owner, driver({ id: 'j', pct: 50 })],
    services: [
      { id: 'a', date: '2026-10-31', driverId: 'n', amount: 200 },
      { id: 'b', date: '2026-10-31', driverId: 'j', amount: 300 }
    ]
  });
  const day = calc.summarizeDay(data, '2026-10-31');
  const n = day.per.find(p => p.driverId === 'n');
  const j = day.per.find(p => p.driverId === 'j');
  assert.equal(n.shareCents, 0);
  assert.equal(n.companyCents, 20000);
  assert.equal(j.shareCents, 15000);
  assert.equal(j.companyCents, 15000);
});

test('percent changes apply only from that day forward', () => {
  let d = driver({ id: 'j', pct: 50 });
  d = calc.setPctFrom(d, '2026-10-31', 40);
  assert.equal(calc.driverPct(d, '2026-10-30'), 50);
  assert.equal(calc.driverPct(d, '2026-10-31'), 40);
  assert.equal(calc.driverPct(d, '2026-11-02'), 40);
  d = calc.setPctFrom(d, '2026-10-31', 35);
  assert.equal(d.pctHistory.filter(h => h.from === '2026-10-31').length, 1);
  assert.equal(calc.driverPct(d, '2026-10-31'), 35);
});

test('Miguel ledger: oldest-first, partial day, 7-day red, until-yesterday', () => {
  const services = [];
  const add = (date, amount) => services.push({ id: 's' + date, date, driverId: 'm', amount });
  add('2026-10-20', 200);
  add('2026-10-21', 200);
  add('2026-10-22', 200);
  add('2026-10-24', 200);
  add('2026-10-26', 180);
  add('2026-10-27', 220);
  add('2026-10-29', 180);
  add('2026-10-30', 240);
  add('2026-10-31', 150);
  const data = base({
    drivers: [driver({ id: 'm', name: 'Miguel', pct: 50 })],
    services,
    handovers: [
      { id: 'p23', date: '2026-10-23', driverId: 'm', amount: 300 },
      { id: 'p28', date: '2026-10-28', driverId: 'm', amount: 60 }
    ]
  });
  const led = calc.buildLedger(data, 'm', TODAY);
  assert.equal(led.totalDueCents, 52500);
  assert.equal(led.untilYesterdayCents, 45000);
  assert.equal(led.overdueCents, 4000);
  assert.equal(led.recentCents, 48500);
  assert.equal(led.status, 'red');
  assert.equal(led.oldestUnpaidDate, '2026-10-24');
  assert.equal(led.oldestAgeDays, 7);
  const p23 = led.allocations.filter(a => a.paymentId === 'p23');
  assert.deepEqual(p23.map(a => a.chargeDate), ['2026-10-20', '2026-10-21', '2026-10-22']);
  assert.equal(p23.reduce((s, a) => s + a.cents, 0), 30000);
  const p28 = led.allocations.filter(a => a.paymentId === 'p28');
  assert.equal(p28.length, 1);
  assert.equal(p28[0].chargeDate, '2026-10-24');
  assert.equal(p28[0].cents, 6000);
  const day24 = led.entries.find(e => e.kind === 'day' && e.date === '2026-10-24');
  assert.equal(day24.remainingCents, 4000);
  assert.equal(day24.runningCents, 10000);
  const last = led.entries[led.entries.length - 1];
  assert.equal(last.runningCents, 52500);
  const sug = calc.handoverSuggestions(led);
  assert.equal(sug.allCents, 52500);
  assert.equal(sug.untilYesterdayCents, 45000);
});

test('six-day debt stays amber; a paid old day does not turn the account red', () => {
  const amber = base({
    drivers: [driver({ id: 'm', pct: 50 })],
    services: [{ id: 's', date: '2026-10-25', driverId: 'm', amount: 100 }]
  });
  const a = calc.buildLedger(amber, 'm', TODAY);
  assert.equal(a.status, 'amber');
  assert.equal(a.oldestAgeDays, 6);
  assert.equal(a.overdueCents, 0);
  assert.equal(a.totalDueCents, 5000);

  const paid = base({
    drivers: [driver({ id: 'm', pct: 50 })],
    services: [
      { id: 'old', date: '2026-10-01', driverId: 'm', amount: 100 },
      { id: 'new', date: '2026-10-30', driverId: 'm', amount: 80 }
    ],
    handovers: [{ id: 'h', date: '2026-10-02', driverId: 'm', amount: 50 }]
  });
  const p = calc.buildLedger(paid, 'm', TODAY);
  assert.equal(p.status, 'amber');
  assert.equal(p.totalDueCents, 4000);
  assert.equal(p.oldestUnpaidDate, '2026-10-30');
});

test('bonus credits the account, excess becomes credit that offsets the next day; owners never get a bonus', () => {
  const data = base({
    config: { bonusMode: 'monthly', bonusAmount: 80, tipsEnabled: true },
    drivers: [
      driver({ id: 'j', pct: 50 }),
      driver({ id: 'n', isOwner: true, pct: 50 })
    ],
    goals: [{ year: 2026, month: 10, amount: 100 }],
    services: [
      { id: 'j1', date: '2026-10-10', driverId: 'j', amount: 100 },
      { id: 'j2', date: '2026-10-28', driverId: 'j', amount: 80 },
      { id: 'n1', date: '2026-10-10', driverId: 'n', amount: 150 }
    ]
  });
  const j = calc.buildLedger(data, 'j', TODAY);
  assert.equal(j.totalDueCents, 1000);
  assert.equal(j.creditCents, 0);
  assert.equal(j.status, 'amber');
  const bonusPay = j.entries.find(e => e.kind === 'bonus');
  assert.equal(bonusPay.cents, 8000);
  assert.equal(bonusPay.date, '2026-10-10');

  const over = base({
    config: { bonusMode: 'monthly', bonusAmount: 80 },
    drivers: [driver({ id: 'j', pct: 50 })],
    goals: [{ year: 2026, month: 10, amount: 100 }],
    services: [
      { id: 'a', date: '2026-10-10', driverId: 'j', amount: 100 },
      { id: 'b', date: '2026-10-20', driverId: 'j', amount: 40 }
    ]
  });
  const led = calc.buildLedger(over, 'j', TODAY);
  assert.equal(led.totalDueCents, 0);
  assert.equal(led.creditCents, 1000);
  assert.equal(led.status, 'credit');

  const next = base({
    config: { bonusMode: 'monthly', bonusAmount: 80 },
    drivers: [driver({ id: 'j', pct: 50 })],
    goals: [{ year: 2026, month: 10, amount: 100 }],
    services: [
      { id: 'a', date: '2026-10-10', driverId: 'j', amount: 100 },
      { id: 'b', date: '2026-11-02', driverId: 'j', amount: 80 }
    ]
  });
  const later = calc.buildLedger(next, 'j', '2026-11-02');
  assert.equal(later.totalDueCents, 1000);
  assert.equal(later.creditCents, 0);

  const ownerBonus = calc.bonusFor(data, data.drivers.find(d => d.id === 'n'), 2026, 10);
  assert.equal(ownerBonus.hit, true);
  assert.equal(ownerBonus.cents, 0);
  const shortData = base({
    config: { bonusMode: 'monthly', bonusAmount: 80 },
    drivers: [driver({ id: 'j' })],
    goals: [{ year: 2026, month: 10, amount: 100 }],
    services: [{ id: 'a', date: '2026-10-10', driverId: 'j', amount: 99.99 }]
  });
  assert.equal(calc.bonusFor(shortData, shortData.drivers[0], 2026, 10).hit, false);

  const off = base({
    config: { bonusMode: 'off', bonusAmount: 80 },
    drivers: [driver({ id: 'j', pct: 50 })],
    goals: [{ year: 2026, month: 10, amount: 100 }],
    services: [{ id: 'a', date: '2026-10-10', driverId: 'j', amount: 100 }]
  });
  assert.equal(calc.bonusFor(off, off.drivers[0], 2026, 10).cents, 0);
  assert.equal(calc.buildLedger(off, 'j', TODAY).totalDueCents, 5000);
});

test('last year average is gross sales divided by drivers who worked, costs ignored', () => {
  const data = base({
    drivers: [driver({ id: 'a' }), driver({ id: 'b' }), driver({ id: 'c' })],
    services: [
      { id: '1', date: '2025-03-02', driverId: 'a', amount: 1000 },
      { id: '2', date: '2025-03-03', driverId: 'a', amount: 500 },
      { id: '3', date: '2025-03-04', driverId: 'b', amount: 500 },
      { id: '4', date: '2025-03-04', driverId: 'b', amount: 10 },
      { id: 'fuel-is-not-sales', date: '2025-04-01', driverId: 'a', amount: 9999 }
    ],
    expenses: [{ id: 'e', scope: 'daily', date: '2025-03-02', year: 2025, month: 3, typeId: 'type-fuel', amount: 400 }],
    assignments: [{ date: '2025-03-18', driverId: 'c', workedZero: true, tukExplicit: true }]
  });
  assert.equal(calc.lastYearAverage(data, 2026, 3), 670);
  assert.equal(calc.lastYearAverage(data, 2026, 4), 9999);
  assert.equal(calc.lastYearAverage(data, 2026, 5), null);
  const filled = calc.goalsFromLastYear(data, 2026);
  const march = filled.data.goals.find(g => g.year === 2026 && g.month === 3);
  const may = filled.data.goals.find(g => g.year === 2026 && g.month === 5);
  assert.equal(march.amount, 670);
  assert.equal(may.amount, 0);
  assert.equal(filled.filled.find(f => f.month === 3).hadData, true);
  assert.equal(filled.filled.find(f => f.month === 5).hadData, false);
  const again = calc.goalsFromLastYear(filled.data, 2026);
  assert.equal(again.data.goals.filter(g => g.year === 2026 && g.month === 3).length, 1);
});

test('month profit counts unpaid owner share, tips, expenses and bonuses', () => {
  const data = base({
    config: { bonusMode: 'monthly', bonusAmount: 100, tipsEnabled: true },
    drivers: [driver({ id: 'j', pct: 50 }), driver({ id: 'n', isOwner: true })],
    tuks: [
      { id: 't1', name: 'Dourado', fuel: 'combustion', garageMonthly: 250, active: true },
      { id: 't2', name: 'Lisboeta', fuel: 'electric', garageMonthly: 200, active: true }
    ],
    goals: [{ year: 2026, month: 10, amount: 300 }],
    services: [
      { id: 'j1', date: '2026-10-31', driverId: 'j', amount: 300 },
      { id: 'n1', date: '2026-10-31', driverId: 'n', amount: 200 }
    ],
    tips: [{ id: 'tip', date: '2026-10-31', driverId: 'n', amount: 20 }],
    expenses: [{ id: 'wash', scope: 'daily', date: '2026-10-31', year: 2026, month: 10, tukId: 't2', typeId: 'type-other', amount: 6 }]
  });
  const month = calc.computeMonth(data, 2026, 10, TODAY);
  assert.equal(month.grossCents, 50000);
  assert.equal(month.tipsCents, 2000);
  assert.equal(month.ownerShareCents, 15000);
  assert.equal(month.ownerDriverGrossCents, 20000);
  assert.equal(month.companyIncomeCents, 37000);
  assert.equal(month.dailyExpenseCents, 600);
  const garage = month.lines.find(l => l.type.systemKey === 'garage');
  assert.equal(garage.cents, 45000);
  assert.equal(garage.source, 'garage');
  assert.equal(month.bonusCents, 10000);
  assert.equal(month.profitCents, 37000 - 600 - 45000 - 10000);
  const joao = month.byDriver.find(d => d.id === 'j');
  assert.equal(joao.hitGoal, true);
  assert.equal(joao.bonusCents, 10000);
  assert.equal(joao.dueCents, 5000);
  const nuno = month.byDriver.find(d => d.id === 'n');
  assert.equal(nuno.hitGoal, false);
  assert.equal(nuno.bonusCents, 0);
});

test('explicit monthly amount overrides the repeating garage; tips toggle drops tips from income', () => {
  const data = base({
    config: { tipsEnabled: false },
    tuks: [{ id: 't1', name: 'Dourado', fuel: 'combustion', garageMonthly: 250, active: true }],
    expenses: [{ id: 'g', scope: 'monthly', year: 2026, month: 10, typeId: 'type-garage', amount: 10 }],
    tips: [{ id: 'tip', date: '2026-10-02', driverId: 'x', amount: 50 }],
    drivers: [driver({ id: 'x', isOwner: true })],
    services: [{ id: 's', date: '2026-10-02', driverId: 'x', amount: 40 }]
  });
  const month = calc.computeMonth(data, 2026, 10, TODAY);
  assert.equal(month.lines.find(l => l.type.systemKey === 'garage').cents, 1000);
  assert.equal(month.lines.find(l => l.type.systemKey === 'garage').source, 'explicit');
  assert.equal(month.tipsCents, 0);
  assert.equal(month.companyIncomeCents, 4000);
});

test('choosing a tuk frees it from the other driver, who stays without one until they choose', () => {
  let data = base({
    drivers: [driver({ id: 'a', order: 1 }), driver({ id: 'b', order: 2 })],
    tuks: [{ id: 't1', name: 'Lisboeta', fuel: 'electric', active: true }, { id: 't2', name: 'Dourado', fuel: 'combustion', active: true }],
    assignments: [
      { date: '2026-10-30', driverId: 'a', tukId: 't1', tukExplicit: true },
      { date: '2026-10-30', driverId: 'b', tukId: 't2', tukExplicit: true },
      { date: '2026-10-31', driverId: 'a', tukId: 't1', tukExplicit: true }
    ]
  });
  data = calc.withSuggestions(data, '2026-10-31');
  assert.equal(calc.resolvedTukId(data, 'b', '2026-10-31'), 't2');
  const taken = calc.withSuggestions(base({
    drivers: [driver({ id: 'a' }), driver({ id: 'b' })],
    tuks: [{ id: 't1', name: 'Lisboeta', fuel: 'electric', active: true }],
    assignments: [
      { date: '2026-10-30', driverId: 'a', tukId: 't1', tukExplicit: true },
      { date: '2026-10-30', driverId: 'b', tukId: 't1', tukExplicit: true },
      { date: '2026-10-31', driverId: 'a', tukId: 't1', tukExplicit: true }
    ]
  }), '2026-10-31');
  assert.equal(calc.resolvedTukId(taken, 'b', '2026-10-31'), null);
  let swapped = calc.applyTukChoice(data, '2026-10-31', 'b', 't1');
  assert.equal(calc.resolvedTukId(swapped, 'b', '2026-10-31'), 't1');
  assert.equal(calc.resolvedTukId(swapped, 'a', '2026-10-31'), null);
  const aRow = swapped.assignments.find(x => x.date === '2026-10-31' && x.driverId === 'a');
  assert.equal(aRow.tukExplicit, true);
  swapped = calc.withSuggestions(swapped, '2026-10-31');
  assert.equal(calc.resolvedTukId(swapped, 'a', '2026-10-31'), null);
});

test('same-day handover pays that day; overpay offsets the next day', () => {
  const same = base({
    drivers: [driver({ id: 'j', pct: 50 })],
    services: [{ id: 's', date: '2026-10-31', driverId: 'j', amount: 150 }],
    handovers: [{ id: 'h', date: '2026-10-31', driverId: 'j', amount: 75 }]
  });
  assert.equal(calc.buildLedger(same, 'j', TODAY).totalDueCents, 0);

  const over = base({
    drivers: [driver({ id: 'j', pct: 50 })],
    services: [
      { id: 'a', date: '2026-10-30', driverId: 'j', amount: 100 },
      { id: 'b', date: '2026-10-31', driverId: 'j', amount: 80 }
    ],
    handovers: [{ id: 'h', date: '2026-10-30', driverId: 'j', amount: 80 }]
  });
  const led = calc.buildLedger(over, 'j', TODAY);
  assert.equal(led.totalDueCents, 1000);
  assert.equal(led.creditCents, 0);
  assert.equal(led.entries.find(e => e.date === '2026-10-31' && e.kind === 'day').remainingCents, 1000);
});

test('factory expense types can be restored without deleting custom types', () => {
  const custom = calc.defaultExpenseTypes().concat([{
    id: 'type-acc', systemKey: '', name: 'Contabilista', nameCustom: true, kind: 'monthly',
    repeatMonthly: true, defaultAmount: 90, factory: false, deleted: false, order: 6
  }]);
  custom[0] = { ...custom[0], kind: 'monthly', deleted: true, name: 'Gasolina', nameCustom: true };
  const next = calc.restoreFactoryTypes(custom);
  const fuel = next.find(t => t.systemKey === 'fuel');
  assert.equal(fuel.kind, 'daily');
  assert.equal(fuel.deleted, false);
  assert.equal(fuel.nameCustom, false);
  assert.equal(fuel.name, 'Combustível');
  assert.ok(next.find(t => t.id === 'type-acc'));
  const garage = next.find(t => t.systemKey === 'garage');
  assert.equal(garage.repeatMonthly, true);
  assert.equal(garage.kind, 'monthly');
});

test('repeating garage fills the current month and worked months, not empty or future ones', () => {
  const data = base({
    tuks: [{ id: 't1', name: 'Lisboeta', fuel: 'electric', garageMonthly: 150, active: true }],
    drivers: [driver({ id: 'j', pct: 50, isOwner: false })],
    services: [{ id: 's', date: '2026-11-01', driverId: 'j', amount: 100 }]
  });
  const nov = calc.computeMonth(data, 2026, 11, '2026-11-01');
  const oct = calc.computeMonth(data, 2026, 10, '2026-11-01');
  const dec = calc.computeMonth(data, 2026, 12, '2026-11-01');
  assert.equal(nov.monthlyExpenseCents, 15000);
  assert.equal(oct.monthlyExpenseCents, 0);
  assert.equal(dec.monthlyExpenseCents, 0);
  const year = calc.computeYear(data, 2026, '2026-11-01');
  assert.equal(year.expenseCents, 15000);
});

test('zero goal never pays a bonus and a worked-zero day is not a day off', () => {
  const data = base({
    config: { bonusMode: 'monthly', bonusAmount: 50 },
    drivers: [driver({ id: 'j', pct: 50 })],
    goals: [{ year: 2026, month: 10, amount: 0 }],
    assignments: [{ date: '2026-10-28', driverId: 'j', workedZero: true, tukExplicit: true }],
    services: [{ id: 's', date: '2026-10-29', driverId: 'j', amount: 40 }]
  });
  assert.equal(calc.bonusFor(data, data.drivers[0], 2026, 10).hit, false);
  const led = calc.buildLedger(data, 'j', TODAY);
  assert.ok(led.entries.some(e => e.date === '2026-10-28' && e.kind === 'day' && e.cents === 0));
  assert.equal(led.totalDueCents, 2000);
});
