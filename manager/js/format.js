/* Formatação de dinheiro e datas (pt-PT / en). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TMFormat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function locale(lang) { return lang === 'en' ? 'en-GB' : 'pt-PT'; }

  function parseAmount(s) {
    if (typeof s === 'number') return isFinite(s) ? s : NaN;
    if (s == null) return NaN;
    let t = String(s).trim().replace(/\s|\u00a0|€/g, '');
    if (!t) return NaN;
    const lastComma = t.lastIndexOf(',');
    const lastDot = t.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) t = t.replace(/\./g, '').replace(',', '.');
      else t = t.replace(/,/g, '');
    } else if (lastComma >= 0) t = t.replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }

  function formatMoney(amount, lang, currency) {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat(locale(lang), {
      style: 'currency', currency: currency || 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(n);
  }

  function formatPlain(amount, lang) {
    const n = Number(amount) || 0;
    return new Intl.NumberFormat(locale(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  function formatChip(amount, lang, currency) {
    const n = Number(amount) || 0;
    const whole = Math.abs(n - Math.round(n)) < 0.001;
    if (!whole) return formatMoney(n, lang, currency);
    const num = new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 0 }).format(Math.round(n));
    if ((currency || 'EUR') === 'EUR') return lang === 'en' ? '€' + num : num + ' €';
    return formatMoney(n, lang, currency);
  }

  const WD_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WDS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WDS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MO_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MO_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MOS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MOS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parts(iso) {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    const wd = new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay();
    return { y, m, d, wd };
  }
  function weekdayLong(iso, lang) { const p = parts(iso); return (lang === 'en' ? WD_EN : WD_PT)[p.wd]; }
  function weekdayShort(iso, lang) { const p = parts(iso); return (lang === 'en' ? WDS_EN : WDS_PT)[p.wd]; }
  function monthLong(m, lang) { return (lang === 'en' ? MO_EN : MO_PT)[(m || 1) - 1] || ''; }
  function monthShort(m, lang) { return (lang === 'en' ? MOS_EN : MOS_PT)[(m || 1) - 1] || ''; }
  function longDate(iso, lang) {
    const p = parts(iso);
    if (lang === 'en') return p.d + ' ' + monthLong(p.m, lang);
    return p.d + ' de ' + monthLong(p.m, lang).toLowerCase();
  }
  function shortDate(iso, lang) {
    const p = parts(iso);
    return p.d + ' ' + monthShort(p.m, lang);
  }

  return { parseAmount, formatMoney, formatPlain, formatChip, weekdayLong, weekdayShort, monthLong, monthShort, longDate, shortDate };
});
