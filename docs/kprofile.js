/* =====================================================================
 * kprofile.js — per-player profiles + rank-based perks for the Kimetsu arcade
 * (귀살 아케이드 대원 프로필 / 계급 능력 공용 라이브러리). Classic script, no deps.
 *
 * Exposes ONE global:  window.KProfile
 *
 * ---------------------------------------------------------------------
 * Storage layout (all localStorage access is wrapped in try/catch)
 *   'kimetsu-arcade:profiles' = JSON array of
 *        { id, name, avatar (KChars id, e.g. 'tanjiro'), legacy: bool, created: ms }
 *   'kimetsu-arcade:profile'  = current profile id
 *
 *   Every profile has a key prefix:
 *     legacy profile  -> 'kimetsu-arcade:'            (records from before profiles existed)
 *     other profiles  -> 'kimetsu-arcade:u:<id>:'
 *   The first profile ever created (more precisely: any profile created while no legacy
 *   profile exists) is legacy:true, so existing records carry over with no migration.
 *   With no profile at all, prefix() is the legacy prefix too.
 *
 *   Games build ALL their keys from prefix():
 *     KProfile.prefix() + 'slash:best'      (instead of 'kimetsu-arcade:slash:best')
 *     KProfile.get('runner:settings', {})   (== JSON under prefix() + 'runner:settings')
 *
 *   Record formats read by gameRank():
 *     slash:best  = number (score) → rank by cutoffs KProfile.SLASH_CUTS
 *     rhythm:best = { 'songId:diff': { score, acc, rank:'丙', combo }, ... } → best rank
 *     runner:best = { score, rank:'丙', stars }
 *     mole:best   = { score, rank:'丙', stars }
 *
 * ---------------------------------------------------------------------
 * API
 *   KProfile.list()                 -> array of profiles (copies)
 *   KProfile.current()              -> current profile object (copy) or null
 *   KProfile.setCurrent(id)         -> selects that profile (ignored if unknown)
 *   KProfile.create(name, avatar)   -> new profile (becomes current). name is trimmed and cut
 *                                      to 8 chars ('대원' if empty); avatar defaults to 'tanjiro'
 *   KProfile.rename(id, name)       -> updated profile or null
 *   KProfile.setAvatar(id, avatar)  -> updated profile or null
 *   KProfile.remove(id)             -> deletes the profile AND its saved data; picks another
 *                                      current profile (first in list) or null. Returns bool.
 *                                      Legacy profile: removes only 'kimetsu-arcade:' +
 *                                      slash:* rhythm:* runner:* mole:* cards:* survivors:*
 *   KProfile.prefix()               -> 'kimetsu-arcade:' or 'kimetsu-arcade:u:<id>:'
 *   KProfile.get(key, def)          -> JSON.parse(localStorage[prefix()+key]) or def
 *                                      (def also when missing/null/broken)
 *   KProfile.set(key, val)          -> localStorage[prefix()+key] = JSON.stringify(val); bool
 *
 *   KProfile.RANKS = ['癸','壬','辛','庚','己','戊','丁','丙','乙','甲','柱']   index 0..10
 *   KProfile.READ  = ['계','임','신','경','기','무','정','병','을','갑','주']
 *   KProfile.GAMES = ['slash','rhythm','runner','mole']
 *   KProfile.GAME_NAMES = { slash:'새벽의 일섬', rhythm:'호흡의 박자', runner:'호흡 달리기',
 *                           mole:'두둥! 혈귀 잡기' }
 *
 *   KProfile.gameRank(game, id?)    -> rank idx of the current profile's record, -1 if none
 *                                      (optional id: read another profile without switching)
 *   KProfile.rank(id?)              -> { idx, char, read, game, skill, plays, needMore } overall =
 *                                      max of the 4 games, capped by experience: rank i also needs
 *                                      KProfile.NEED[i] finished games (counted in rankUp).
 *                                      skill = uncapped rank, needMore = games left to unlock it.
 *                                      idx -1 => no record (char/read are '癸'/'계', game null;
 *                                      treat as 0 for perks)
 *   KProfile.perks(game, idx?)      -> perk values (see PERKS below) at rank idx
 *                                      (default: current overall rank; -1 → 0; clamped 0..10).
 *                                      Unknown game -> {}.
 *        slash : { extraLanterns, gaugeMul, startGauge }
 *        rhythm: { windowMs, missDamageMul, specialDmgMul }
 *        runner: { extraHearts, airMul }
 *        mole  : { upMul, powerMul, startPower }
 *   KProfile.perkText(game, idx?)   -> array of short Korean strings for the non-zero perks,
 *                                      or ['아직 없음 · 계급을 올려 능력을 얻어요']
 *   KProfile.nextPerk(game, idx?)   -> { idx, char, read, text, list } for the next rank
 *                                      (text = what changes, joined with ' · '; list = array),
 *                                      or null at 柱
 *   KProfile.snapshot()             -> current overall rank idx (call BEFORE saving a new best)
 *   KProfile.rankUp(beforeIdx)      -> null, or { from:{idx,char,read}, to:{idx,char,read} }
 *                                      when the overall rank is now higher than beforeIdx
 *                                      (call AFTER saving). -1 counts as 癸 (0), so getting
 *                                      the very first 癸 is not reported as a rank-up.
 *   KProfile.badgeHTML()            -> '<span class="kprofile-badge">대원 이름 · 계급 丙</span>'
 *                                      (name HTML-escaped; '손님' when no profile; no rank → 癸)
 *   KProfile.esc(str)               -> HTML-escaped string                     [extra helper]
 *
 * Typical game integration
 *   const before = KProfile.snapshot();
 *   ... save new best with KProfile.set('mole:best', rec) ...
 *   const up = KProfile.rankUp(before);   // show "계급 상승! 丁 → 丙" if non-null
 *   const pk = KProfile.perks('mole');    // at game start: apply pk.upMul, pk.startPower ...
 * ===================================================================== */
(function () {
  'use strict';

  var ROOT = 'kimetsu-arcade:';
  var K_LIST = ROOT + 'profiles';
  var K_CUR = ROOT + 'profile';
  var RANKS = ['癸', '壬', '辛', '庚', '己', '戊', '丁', '丙', '乙', '甲', '柱'];
  var READ = ['계', '임', '신', '경', '기', '무', '정', '병', '을', '갑', '주'];
  var GAMES = ['slash', 'rhythm', 'runner', 'mole'];
  var GAME_NAMES = { slash: '새벽의 일섬', rhythm: '호흡의 박자', runner: '호흡 달리기', mole: '두둥! 혈귀 잡기' };
  var SLASH_CUTS = [0, 800, 2000, 3500, 5500, 8000, 11000, 14500, 18500, 23000, 32000];
  var LEGACY_GAME_KEYS = ['slash:', 'rhythm:', 'runner:', 'mole:', 'cards:', 'survivors:'];
  var NONE = '아직 없음 · 계급을 올려 능력을 얻어요';

  /* ---------------- perk balance: the ONE place to tune ----------------
   * r = rank index 0..10. `text` turns the values into kid-friendly Korean lines
   * (zero / no-op perks are omitted). */
  var PERKS = {
    slash: {
      values: function (r) {
        return {
          extraLanterns: (r >= 3 ? 1 : 0) + (r >= 8 ? 1 : 0),   // lanterns added to the start count
          gaugeMul: 1 + 0.05 * r,                               // 오의 gauge gain multiplier
          startGauge: r >= 10 ? 100 : (r >= 6 ? 30 : 0)         // 오의 gauge (0..100) at start
        };
      },
      text: function (p) {
        var o = [];
        if (p.extraLanterns) o.push('등불 +' + p.extraLanterns);
        if (p.gaugeMul > 1) o.push('오의 게이지 +' + pct(p.gaugeMul - 1) + '% 빨리');
        if (p.startGauge >= 100) o.push('오의 게이지 가득 찬 채로 시작');
        else if (p.startGauge) o.push('오의 게이지 ' + p.startGauge + '%로 시작');
        return o;
      }
    },
    rhythm: {
      values: function (r) {
        return {
          windowMs: 3 * r,                  // ms added to EACH timing window
          missDamageMul: 1 - 0.05 * r,      // multiplier on focus (집중력) lost per miss
          specialDmgMul: 1 + 0.05 * r       // multiplier on 형 (special) damage
        };
      },
      text: function (p) {
        var o = [];
        if (p.windowMs) o.push('판정 +' + p.windowMs + 'ms 너그럽게');
        if (p.missDamageMul < 1) o.push('실수해도 집중력 ' + pct(1 - p.missDamageMul) + '% 덜 깎임');
        if (p.specialDmgMul > 1) o.push('형의 힘 +' + pct(p.specialDmgMul - 1) + '%');
        return o;
      }
    },
    runner: {
      values: function (r) {
        return {
          extraHearts: (r >= 2 ? 1 : 0) + (r >= 5 ? 1 : 0) + (r >= 8 ? 1 : 0),  // on top of 5
          airMul: 1 + 0.02 * r                                                // jump airtime
        };
      },
      text: function (p) {
        var o = [];
        if (p.extraHearts) o.push('하트 +' + p.extraHearts + ' (' + (5 + p.extraHearts) + '개)');
        if (p.airMul > 1) o.push('점프 시간 +' + pct(p.airMul - 1) + '%');
        return o;
      }
    },
    mole: {
      values: function (r) {
        return {
          upMul: 1 + 0.04 * r,            // how long demons stay up
          powerMul: 1 + 0.06 * r,         // power (오의) gain multiplier
          startPower: r >= 7 ? 30 : 0     // power (0..100) at start
        };
      },
      text: function (p) {
        var o = [];
        if (p.upMul > 1) o.push('혈귀가 ' + pct(p.upMul - 1) + '% 더 오래 머물러요');
        if (p.powerMul > 1) o.push('파워가 ' + pct(p.powerMul - 1) + '% 빨리 모여요');
        if (p.startPower) o.push('파워 +' + p.startPower + '으로 시작');
        return o;
      }
    }
  };

  function pct(x) { return Math.round(x * 100); }
  function clampIdx(i) { i = Math.floor(+i); if (!(i >= 0)) return 0; return i > 10 ? 10 : i; }

  /* ---------------- raw storage ---------------- */
  function rawGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function rawSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function rawDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  function rawJSON(k, d) {
    var v = rawGet(k);
    if (v == null) return d;
    try { var o = JSON.parse(v); return o == null ? d : o; } catch (e) { return d; }
  }
  function allKeys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k != null) out.push(k); } } catch (e) { /* ignore */ }
    return out;
  }

  /* ---------------- profiles ---------------- */
  function load() {
    var a = rawJSON(K_LIST, []);
    if (!Array.isArray(a)) return [];
    return a.filter(function (p) { return p && typeof p.id === 'string' && /^[a-z0-9]+$/.test(p.id); });
  }
  function store(a) { rawSet(K_LIST, JSON.stringify(a)); }
  function copy(p) { return p ? { id: p.id, name: p.name, avatar: p.avatar, legacy: !!p.legacy, created: p.created } : null; }
  function cleanName(n) {
    n = String(n == null ? '' : n).replace(/\s+/g, ' ').trim();
    n = Array.from(n).slice(0, 8).join('');
    return n || '대원';
  }
  function cleanAvatar(a) { a = String(a || ''); return /^[a-z0-9_-]{1,24}$/.test(a) ? a : 'tanjiro'; }
  function newId(list) {
    var id;
    do { id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).replace(/[^a-z0-9]/g, ''); }
    while (list.some(function (p) { return p.id === id; }));
    return id;
  }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function curRaw() {
    var list = load();
    if (!list.length) return null;
    var p = find(list, rawGet(K_CUR));
    return p || list[0];
  }
  function prefixOf(p) { return !p || p.legacy ? ROOT : ROOT + 'u:' + p.id + ':'; }

  function list() { return load().map(copy); }
  function current() { return copy(curRaw()); }
  function setCurrent(id) { if (find(load(), id)) rawSet(K_CUR, id); }
  function create(name, avatar) {
    var a = load();
    var p = {
      id: newId(a), name: cleanName(name), avatar: cleanAvatar(avatar),
      legacy: !a.some(function (q) { return q.legacy; }), created: Date.now()
    };
    a.push(p); store(a); rawSet(K_CUR, p.id);
    return copy(p);
  }
  function patch(id, fn) {
    var a = load(), p = find(a, id);
    if (!p) return null;
    fn(p); store(a);
    return copy(p);
  }
  function rename(id, name) { return patch(id, function (p) { p.name = cleanName(name); }); }
  function setAvatar(id, av) { return patch(id, function (p) { p.avatar = cleanAvatar(av); }); }
  function remove(id) {
    var a = load(), p = find(a, id);
    if (!p) return false;
    var keys = allKeys();
    if (p.legacy) {
      keys.forEach(function (k) {
        if (k.indexOf(ROOT) !== 0) return;
        var rest = k.slice(ROOT.length);
        for (var i = 0; i < LEGACY_GAME_KEYS.length; i++) if (rest.indexOf(LEGACY_GAME_KEYS[i]) === 0) { rawDel(k); return; }
      });
    } else {
      var pf = prefixOf(p);
      keys.forEach(function (k) { if (k.indexOf(pf) === 0) rawDel(k); });
    }
    var wasCur = rawGet(K_CUR) === id;
    a = a.filter(function (q) { return q.id !== id; });
    store(a);
    if (wasCur || !find(a, rawGet(K_CUR))) {
      if (a.length) rawSet(K_CUR, a[0].id); else rawDel(K_CUR);
    }
    return true;
  }

  function prefix() { return prefixOf(curRaw()); }
  function get(key, def) { return rawJSON(prefix() + key, def); }
  function set(key, val) {
    var s;
    try { s = JSON.stringify(val); } catch (e) { return false; }
    return rawSet(prefix() + key, s);
  }

  /* ---------------- ranks ---------------- */
  function rankOfChar(c) { return typeof c === 'string' ? RANKS.indexOf(c) : -1; }
  function profileById(id) { return id == null ? curRaw() : find(load(), id); }
  // Experience: a rank also needs enough finished games (all games together), so one lucky
  // run can't jump straight to 乙. plays are counted in rankUp(), which every game calls once
  // per finished game. NEED[i] = finished games needed for rank i.
  var NEED = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 60];
  function plays(id) { var p = profileById(id); return Math.max(0, +rawJSON(prefixOf(p) + 'plays', 0) || 0); }
  function capOf(n) { var c = 0; for (var i = 0; i < NEED.length; i++) if (n >= NEED[i]) c = i; return c; }
  function gameRank(game, id) {
    var r = skillGameRank(game, id);
    return r < 0 ? -1 : Math.min(r, capOf(plays(id)));
  }
  function skillGameRank(game, id) {
    var p = profileById(id);
    if (id != null && !p) return -1;
    var r = -1, b = rawJSON(prefixOf(p) + game + ':best', null);
    if (game === 'slash') {
      var s = +b;
      if (s > 0) for (var i = 0; i < SLASH_CUTS.length; i++) if (s >= SLASH_CUTS[i]) r = i;
    } else if (game === 'rhythm') {
      if (b && typeof b === 'object') for (var k in b) if (b[k] && typeof b[k] === 'object') r = Math.max(r, rankOfChar(b[k].rank));
    } else if (game === 'runner' || game === 'mole') {
      if (b && typeof b === 'object') r = rankOfChar(b.rank);
    }
    return r;
  }
  function rank(id) {
    var top = -1, g = null;
    GAMES.forEach(function (x) { var i = skillGameRank(x, id); if (i > top) { top = i; g = x; } });
    var n = plays(id), cap = capOf(n), idx = top < 0 ? -1 : Math.min(top, cap), c = idx < 0 ? 0 : idx;
    var nextNeed = idx + 1 < NEED.length ? Math.max(0, NEED[Math.max(0, idx) + 1] - n) : 0;
    return { idx: idx, char: RANKS[c], read: READ[c], game: g, skill: top, plays: n,
      skillChar: RANKS[Math.max(0, top)], skillRead: READ[Math.max(0, top)], needMore: top > idx ? nextNeed : 0 };
  }
  function resolve(idx) { return clampIdx(idx == null ? rank().idx : idx); }

  function perks(game, idx) {
    var d = PERKS[game];
    return d ? d.values(resolve(idx)) : {};
  }
  function perkText(game, idx) {
    var d = PERKS[game];
    if (!d) return [NONE];
    var t = d.text(d.values(resolve(idx)));
    return t.length ? t : [NONE];
  }
  function nextPerk(game, idx) {
    var d = PERKS[game];
    if (!d) return null;
    var cur = resolve(idx);
    if (cur >= 10) return null;
    var now = d.text(d.values(cur)), nx = d.text(d.values(cur + 1));
    var diff = nx.filter(function (s) { return now.indexOf(s) < 0; });
    if (!diff.length) diff = nx;
    return { idx: cur + 1, char: RANKS[cur + 1], read: READ[cur + 1], text: diff.join(' · '), list: diff };
  }

  function snapshot() { return rank().idx; }
  function rankUp(before) {
    // one finished game = one more play for the current player
    var cp = curRaw(); rawSet(prefixOf(cp) + 'plays', String(plays() + 1));
    var b = clampIdx(before == null ? -1 : before);
    var now = rank().idx;
    if (now <= b) return null;
    return { from: { idx: b, char: RANKS[b], read: READ[b] }, to: { idx: now, char: RANKS[now], read: READ[now] } };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function badgeHTML() {
    var p = curRaw(), r = rank();
    return '<span class="kprofile-badge">' + (p ? '대원 ' + esc(p.name) : '손님') + ' · 계급 ' + r.char + '</span>';
  }

  var api = {
    list: list, current: current, setCurrent: setCurrent, create: create,
    rename: rename, setAvatar: setAvatar, remove: remove,
    prefix: prefix, get: get, set: set,
    RANKS: RANKS.slice(), READ: READ.slice(), GAMES: GAMES.slice(), GAME_NAMES: GAME_NAMES,
    SLASH_CUTS: SLASH_CUTS.slice(), PERKS: PERKS,
    gameRank: gameRank, rank: rank, perks: perks, perkText: perkText, nextPerk: nextPerk,
    snapshot: snapshot, rankUp: rankUp, badgeHTML: badgeHTML, esc: esc,
    plays: plays, NEED: NEED.slice()
  };
  if (typeof window !== 'undefined') window.KProfile = api;
  else if (typeof globalThis !== 'undefined') globalThis.KProfile = api;
})();
