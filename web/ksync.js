/* =====================================================================
 * ksync.js — family-code cloud sync for the Kimetsu arcade (기록 동기화)
 * Classic script, no deps. Load after kprofile.js on every page.
 *
 * Every localStorage key starting with 'kimetsu-arcade:' (profiles, records,
 * settings, 말의 호흡 progress …) is mirrored into ONE Firestore document
 *   families/<FAMILY-CODE>  { data: JSON string, updated: ms }
 * through the Firestore REST API (no Firebase SDK, no login). Whoever knows the
 * family code can read/write that document, so the code is random (32^8).
 * 'kimetsu-arcade:profile' (who is playing on THIS device) is never synced.
 *
 * Conflict rule: per key, the newest change wins (each key carries the time it
 * last changed, stamped on this device). When a browser JOINS a family, the
 * family's copy wins for keys both sides have.
 *
 * Exposes window.KSync:
 *   KSync.configured()          -> bool (a Firebase project id is set)
 *   KSync.code()                -> current family code or ''
 *   KSync.create()              -> Promise<code>   new family from this device's records
 *   KSync.join(code)            -> Promise<bool>   false if no such family
 *   KSync.leave()               -> stop syncing on this device (records stay)
 *   KSync.syncNow()             -> Promise<{changed}>
 *   KSync.status()              -> { state:'off'|'idle'|'busy'|'error', last: ms, error }
 *   KSync.onStatus(fn)          -> fn(status) on every change
 *   KSync.base()                -> Firestore REST documents URL (used by battle.html)
 * After remote data is applied the page receives a 'storage' event (the hub
 * re-renders), and a game page that was opened moments ago reloads once so it
 * never keeps playing on stale data.
 * ===================================================================== */
(function (global) {
  'use strict';

  // ▼ Firebase 프로젝트 ID (Firebase 콘솔 › 프로젝트 설정 › 일반 › 프로젝트 ID)
  var CONFIG = { projectId: 'kimetsu-arcade' };

  var PFX = 'kimetsu-arcade:', META = 'kimetsu-sync:meta', CODEK = 'kimetsu-sync:code', LASTK = 'kimetsu-sync:last';
  var LOCAL_ONLY = { 'kimetsu-arcade:profile': 1 };
  var CODE_RE = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var BOOT = Date.now();

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  function parse(s, d) { try { var v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } }
  function hash(s) { s = String(s); var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + '.' + s.length; }
  function syncKeys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PFX) === 0 && !LOCAL_ONLY[k]) out.push(k); } } catch (e) { /* ignore */ }
    return out;
  }
  function wanted(k) { return typeof k === 'string' && k.indexOf(PFX) === 0 && !LOCAL_ONLY[k]; }

  // ---- change stamps: meta[key] = { h: hash of value, t: when it changed, d: deleted } ----
  function loadMeta() { var m = parse(get(META), {}); return (m && typeof m === 'object') ? m : {}; }
  function saveMeta(m) { set(META, JSON.stringify(m)); }
  function stamp() {
    var m = loadMeta(), seen = {}, ks = syncKeys();
    // Lamport-style clock: a local change always counts as newer than anything this device has
    // already seen, even if another device's clock runs ahead of ours.
    var now = Date.now();
    Object.keys(m).forEach(function (k) { if (m[k] && m[k].t >= now) now = m[k].t + 1; });
    ks.forEach(function (k) {
      var h = hash(get(k)); seen[k] = 1;
      if (!m[k] || m[k].d || m[k].h !== h) m[k] = { h: h, t: now };
    });
    Object.keys(m).forEach(function (k) { if (!seen[k] && !m[k].d) m[k] = { h: '', t: now, d: 1 }; });
    saveMeta(m);
    return m;
  }
  function snapshot(m) {
    var out = {};
    Object.keys(m).forEach(function (k) { out[k] = m[k].d ? { t: m[k].t, d: 1 } : { t: m[k].t, v: get(k) }; });
    return out;
  }
  // Apply remote entries that are newer (or all conflicting ones when preferRemote).
  function merge(remote, preferRemote) {
    var m = stamp(), changed = false;
    Object.keys(remote || {}).forEach(function (k) {
      var r = remote[k]; if (!wanted(k) || !r || typeof r.t !== 'number') return;
      var l = m[k];
      if (l && !preferRemote && r.t <= l.t) return;
      if (l && preferRemote && r.t < l.t && l.d && r.d) return;
      if (r.d) {
        if (get(k) != null) { del(k); changed = true; }
        m[k] = { h: '', t: r.t, d: 1 };
      } else if (typeof r.v === 'string') {
        if (get(k) !== r.v) { set(k, r.v); changed = true; }
        m[k] = { h: hash(r.v), t: Math.max(r.t, l && preferRemote ? l.t : 0) };
      }
    });
    saveMeta(m);
    return changed;
  }
  function needsPush(local, remote) {
    var ks = Object.keys(local);
    for (var i = 0; i < ks.length; i++) { var a = local[ks[i]], b = remote[ks[i]]; if (!b || b.t !== a.t || !!b.d !== !!a.d || (!a.d && b.v !== a.v)) return true; }
    return false;
  }

  // ---- Firestore REST ----
  function docUrl(code) {
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CONFIG.projectId) +
      '/databases/(default)/documents/families/' + encodeURIComponent(code);
  }
  function pull(code) {
    return fetch(docUrl(code), { cache: 'no-store' }).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('불러오기 실패 (' + r.status + ')');
      return r.json().then(function (j) {
        var s = j && j.fields && j.fields.data && j.fields.data.stringValue;
        return parse(s, {}) || {};
      });
    });
  }
  function push(code, data, keepalive) {
    var body = JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) }, updated: { integerValue: String(Date.now()) } } });
    return fetch(docUrl(code), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: !!keepalive && body.length < 60000 })
      .then(function (r) { if (!r.ok) throw new Error('저장 실패 (' + r.status + ')'); return true; });
  }

  // ---- state ----
  var st = { state: 'off', last: +(get(LASTK) || 0), error: '' }, listeners = [], busy = null;
  function code() { var c = get(CODEK) || ''; return CODE_RE.test(c) ? c : ''; }
  function emit(patch) {
    for (var k in patch) st[k] = patch[k];
    listeners.forEach(function (fn) { try { fn(status()); } catch (e) { /* ignore */ } });
  }
  function status() { return { state: st.state, last: st.last, error: st.error, code: code() }; }
  function configured() { return !!CONFIG.projectId; }
  function announce() {
    try { global.dispatchEvent(new Event('storage')); } catch (e) { /* old browsers */ }
    try { global.dispatchEvent(new Event('ksync:applied')); } catch (e) { /* old browsers */ }
  }
  function afterApply() {
    announce();
    var hub = !!document.getElementById('profiles');   // the hub re-renders on 'storage'; games reload
    if (hub || Date.now() - BOOT > 20000) return;
    var flag = 'kimetsu-sync:reloaded:' + location.pathname, once = false;
    try { once = sessionStorage.getItem(flag) === '1'; sessionStorage.setItem(flag, '1'); } catch (e) { once = true; }
    if (!once) { try { location.reload(); } catch (e) { /* ignore */ } }
  }

  function syncNow(opts) {
    opts = opts || {};
    var c = code();
    if (!configured() || !c) { emit({ state: 'off' }); return Promise.resolve({ changed: false }); }
    if (busy) return busy;
    emit({ state: 'busy', error: '' });
    busy = pull(c).then(function (remote) {
      remote = remote || {};
      var changed = merge(remote, !!opts.preferRemote);
      var local = snapshot(loadMeta());
      var p = needsPush(local, remote) ? push(c, local, opts.keepalive) : Promise.resolve();
      return p.then(function () {
        st.last = Date.now(); set(LASTK, String(st.last));
        emit({ state: 'idle' });
        if (changed && !opts.silent) afterApply();
        return { changed: changed };
      });
    }).catch(function (e) {
      emit({ state: 'error', error: (e && e.message) || '연결 실패' });
      return { changed: false, error: e };
    }).then(function (r) { busy = null; return r; });
    return busy;
  }
  function genCode() {
    var s = '', a = new Uint32Array(8);
    try { crypto.getRandomValues(a); } catch (e) { for (var j = 0; j < 8; j++) a[j] = Math.floor(Math.random() * 4294967296); }
    for (var i = 0; i < 8; i++) { s += ALPHA[a[i] % ALPHA.length]; if (i === 3) s += '-'; }
    return s;
  }
  function create() {
    if (!configured()) return Promise.reject(new Error('아직 설정이 안 됐어요'));
    var c = genCode();
    return pull(c).then(function (r) {
      if (r) return create();                       // astronomically unlikely clash
      var local = snapshot(stamp());
      return push(c, local).then(function () {
        set(CODEK, c); st.last = Date.now(); set(LASTK, String(st.last)); emit({ state: 'idle', error: '' });
        return c;
      });
    });
  }
  function normCode(s) {
    s = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return s.length === 8 ? s.slice(0, 4) + '-' + s.slice(4) : s;
  }
  function join(input) {
    if (!configured()) return Promise.reject(new Error('아직 설정이 안 됐어요'));
    var c = normCode(input);
    if (!CODE_RE.test(c)) return Promise.resolve(false);
    return pull(c).then(function (remote) {
      if (!remote) return false;
      set(CODEK, c);
      return syncNow({ preferRemote: true, silent: true }).then(function (r) {
        if (r && r.changed) announce();
        return true;
      });
    });
  }
  function leave() { del(CODEK); emit({ state: 'off', error: '' }); }

  // ---- automatic triggers ----
  function auto() {
    if (!configured() || !code()) { emit({ state: 'off' }); return; }
    syncNow();
    setInterval(function () { if (document.visibilityState !== 'hidden') syncNow(); }, 30000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') syncNow({ keepalive: true, silent: true }); else syncNow(); });
    global.addEventListener('pagehide', function () { syncNow({ keepalive: true, silent: true }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(auto, 200); });
  else setTimeout(auto, 200);

  global.KSync = {
    base: function () { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CONFIG.projectId) + '/databases/(default)/documents/'; },
    configured: configured, code: code, create: create, join: join, leave: leave, syncNow: syncNow,
    status: status, onStatus: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
    _test: { merge: merge, stamp: stamp, snapshot: snapshot, normCode: normCode, CONFIG: CONFIG }
  };
})(window);
