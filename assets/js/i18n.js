/* =====================================================================
   i18n.js — küçük çeviri çekirdeği / tiny translation core

   Sözlükler I18N.register(code, meta, dict) ile kaydedilir.
   Anahtar bulunamazsa önce yedek dile (tr), sonra anahtarın kendisine düşer.
   Yer tutucular: "DR {v} mm"  ->  t('key', {v: 0.25})
   ===================================================================== */
(function (global) {
  'use strict';

  var DICTS = {};
  var META = {};
  var FALLBACK = 'tr';
  var LANG = FALLBACK;
  var listeners = [];
  var STORAGE_KEY = 'hrl.lang';

  function register(code, meta, dict) {
    DICTS[code] = dict;
    META[code] = meta || { code: code, label: code.toUpperCase() };
  }

  function langs() {
    return Object.keys(DICTS).map(function (c) { return META[c]; });
  }

  function has(code) { return Object.prototype.hasOwnProperty.call(DICTS, code); }

  function fill(str, params) {
    if (!params) return str;
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return params[k] === undefined || params[k] === null ? m : String(params[k]);
    });
  }

  function raw(key) {
    var d = DICTS[LANG];
    if (d && d[key] !== undefined) return d[key];
    var f = DICTS[FALLBACK];
    if (f && f[key] !== undefined) return f[key];
    return null;
  }

  function t(key, params) {
    var s = raw(key);
    return s === null ? key : fill(s, params);
  }

  /* Sözlükte olmayan anahtar için boş dizge — isteğe bağlı parçalarda kullanışlı */
  function opt(key, params) {
    var s = raw(key);
    return s === null ? '' : fill(s, params);
  }

  /* Sayıya göre "<key>.one" / "<key>.other" varyantı; yoksa "<key>"e düşer.
     Türkçede sayıdan sonra çoğul eki gelmediği için tek anahtar yeter,
     İngilizce sözlük varyantları tanımlar.

     Picks the "<key>.one" / "<key>.other" variant by count, falling back to
     "<key>". Turkish needs no plural after a numeral, so one key is enough
     there; the English dictionary defines the variants. */
  function plural(key, n, params) {
    var v = key + (n === 1 ? '.one' : '.other');
    var p = {};
    if (params) for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k];
    p.n = n;
    return t(raw(v) === null ? key : v, p);
  }

  function detect() {
    var saved = null;
    try { saved = global.localStorage && global.localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (saved && has(saved)) return saved;
    var nav = (global.navigator && (global.navigator.language || global.navigator.userLanguage)) || '';
    var short = String(nav).toLowerCase().split('-')[0];
    if (has(short)) return short;
    return has(FALLBACK) ? FALLBACK : Object.keys(DICTS)[0];
  }

  function apply(root) {
    var doc = global.document;
    if (!doc) return;
    root = root || doc;
    var i, els;

    els = root.querySelectorAll('[data-i18n]');
    for (i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-i18n'));

    els = root.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < els.length; i++) els[i].innerHTML = t(els[i].getAttribute('data-i18n-html'));

    els = root.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('placeholder', t(els[i].getAttribute('data-i18n-ph')));

    els = root.querySelectorAll('[data-i18n-title]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('title', t(els[i].getAttribute('data-i18n-title')));

    els = root.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('aria-label', t(els[i].getAttribute('data-i18n-aria')));

    if (root === doc) {
      doc.documentElement.setAttribute('lang', LANG);
      doc.title = t('app.title');
    }
  }

  function setLang(code, silent) {
    if (!has(code) || code === LANG) return false;
    LANG = code;
    try { global.localStorage && global.localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* private mode */ }
    apply();
    if (!silent) listeners.forEach(function (fn) { try { fn(code); } catch (e) { /* dinleyici patlamasın */ } });
    return true;
  }

  function init() {
    LANG = detect();
    apply();
    return LANG;
  }

  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }

  global.I18N = {
    register: register, langs: langs, has: has, apply: apply,
    setLang: setLang, init: init, onChange: onChange, t: t, opt: opt, plural: plural,
    get lang() { return LANG; }
  };
  global.t = t;
})(typeof window !== 'undefined' ? window : this);
