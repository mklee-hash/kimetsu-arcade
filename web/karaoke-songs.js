/* =====================================================================
 * karaoke-songs.js — songs for 귀살대 노래방
 *
 * Every melody is a public-domain folk tune; every lyric is original
 * (written for this fan game), so nothing here is copyrighted material.
 *
 * window.KSONGS = [ { id, title (kana), ko, char, tune, bpm,
 *                     lines: [ { kana, pk?, ko, notes: 'G4 E4 E4:2 …' } ] } ]
 *   kana  : the sung words, one mora per note (spaces are only for reading)
 *   pk    : same words written for pronunciation (ー for long vowels)
 *   notes : space separated; 'E4:2' = 2 beats (default 1 beat)
 * ===================================================================== */
(function (global) {
  'use strict';
  var S = [
    { id: 'zenshu', title: 'ぜんしゅうちゅうの うた', ko: '전집중의 노래', char: 'tanjiro', bpm: 92,
      tune: '「반짝반짝 작은별」 멜로디 (프랑스 민요)',
      lines: [
        { kana: 'いきを すいこむ', ko: '숨을 크게 들이마셔', notes: 'C4 C4 G4 G4 A4 A4 G4:2' },
        { kana: 'ぜんしゅうちゅうだ', pk: 'ぜんしゅーちゅーだ', ko: '전집중이다!', notes: 'F4 F4 E4 E4 D4 D4 C4:2' },
        { kana: 'みずの こきゅうで', pk: 'みずの こきゅーで', ko: '물의 호흡으로', notes: 'G4 G4 F4 F4 E4 E4 D4:2' },
        { kana: 'おにを たおそう', pk: 'おにを たおそー', ko: '혈귀를 쓰러뜨리자', notes: 'G4 G4 F4 F4 E4 E4 D4:2' },
        { kana: 'いきを はきだす', ko: '숨을 후~ 내쉬어', notes: 'C4 C4 G4 G4 A4 A4 G4:2' },
        { kana: 'みんな なかまだ', ko: '우리는 모두 동료야', notes: 'F4 F4 E4 E4 D4 D4 C4:2' }
      ] },
    { id: 'umai', title: 'うまい！の うた', ko: '맛있다! 노래', char: 'rengoku', bpm: 100,
      tune: '「떴다 떴다 비행기」 멜로디 (미국 민요)',
      lines: [
        { kana: 'うまい うまいぞ', ko: '맛있다 맛있어!', notes: 'E4 D4 C4 D4 E4 E4 E4:2' },
        { kana: 'さつま いもだ', ko: '고구마다!', notes: 'D4 D4 D4:2 E4 G4 G4:2' },
        { kana: 'こころを もやせよ', ko: '마음을 불태워라', notes: 'E4 D4 C4 D4 E4 E4 E4 E4' },
        { kana: 'げんき だせ', ko: '기운 내자!', notes: 'D4 D4 E4 D4 C4:4' },
        { kana: 'うまい うまいぞ', ko: '맛있다 맛있어!', notes: 'E4 D4 C4 D4 E4 E4 E4:2' },
        { kana: 'おにぎり だよ', ko: '주먹밥이야!', notes: 'D4 D4 D4:2 E4 G4 G4:2' },
        { kana: 'みんなで たべよう', pk: 'みんなで たべよー', ko: '다 같이 먹자', notes: 'E4 D4 C4 D4 E4 E4 E4 E4' },
        { kana: 'げんき だせ', ko: '기운 내자!', notes: 'D4 D4 E4 D4 C4:4' }
      ] },
    { id: 'ohayo', title: 'おはよう ねずこ', ko: '좋은 아침 네즈코', char: 'nezuko', bpm: 100,
      tune: '「프레르 자크」 멜로디 (프랑스 민요)',
      lines: [
        { kana: 'おはよう おはよう', pk: 'おはよー おはよー', ko: '좋은 아침, 좋은 아침', notes: 'C4 D4 E4 C4 C4 D4 E4 C4' },
        { kana: 'ねずこ ねずこ', ko: '네즈코, 네즈코', notes: 'E4 F4 G4:2 E4 F4 G4:2' },
        { kana: 'もう あさだよ おきて ごらん', pk: 'もー あさだよ おきて ごらん', ko: '벌써 아침이야, 일어나 봐', notes: 'G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4' },
        { kana: 'むむむ むむむ', ko: '음음음 (네즈코의 대답!)', notes: 'C4 G3 C4:2 C4 G3 C4:2' },
        { kana: 'ごはんよ ごはんよ', ko: '밥이야, 밥이야', notes: 'C4 D4 E4 C4 C4 D4 E4 C4' },
        { kana: 'たべよ たべよ', ko: '먹자, 먹자', notes: 'E4 F4 G4:2 E4 F4 G4:2' },
        { kana: 'おにぎり だよ ほかほか だよ', ko: '주먹밥이야, 따끈따끈해', notes: 'G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4' },
        { kana: 'むむむ むむむ', ko: '음음음 (맛있대요!)', notes: 'C4 G3 C4:2 C4 G3 C4:2' }
      ] },
    { id: 'chocho', title: 'ちょうちょうの まい', ko: '나비의 춤', char: 'shinobu', bpm: 100,
      tune: '「나비야」 멜로디 (독일 민요)',
      lines: [
        { kana: 'しのぶさんの ちょうちょが とんだ', pk: 'しのぶさんの ちょーちょが とんだ', ko: '시노부 님의 나비가 날았어', notes: 'G4 E4 E4:2 F4 D4 D4:2 C4 D4 E4 F4 G4 G4 G4:2' },
        { kana: 'かぜに ふかれ ふわふわ と', ko: '바람을 타고 둥실둥실', notes: 'G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 C4:4' },
        { kana: 'まいあがる ちょう おにも おどろく', pk: 'まいあがる ちょー おにも おどろく', ko: '날아오르는 나비, 혈귀도 깜짝', notes: 'D4 D4 D4 D4 D4 E4 F4:2 E4 E4 E4 E4 E4 F4 G4:2' },
        { kana: 'ちょうの まいで おにたいじ', pk: 'ちょーの まいで おにたいじ', ko: '나비의 춤으로 혈귀 퇴치!', notes: 'G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 C4:4' }
      ] },
    { id: 'inosuke', title: 'いのすけさまの うた', ko: '이노스케 님의 노래', char: 'inosuke', bpm: 108,
      tune: '「런던 다리」 멜로디 (영국 민요)',
      lines: [
        { kana: 'いのすけ さまだ', ko: '이노스케 님이다!', notes: 'G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2' },
        { kana: 'ちょとつ まえへ', pk: 'ちょとつ まええ', ko: '돌진! 앞으로!', notes: 'D4 E4 F4:2 E4 F4 G4:2' },
        { kana: 'いのすけ さまだ', ko: '이노스케 님이다!', notes: 'G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2' },
        { kana: 'もうしん', pk: 'もーしん', ko: '맹진! (힘차게 돌진!)', notes: 'D4:2 G4:2 E4 C4:3' },
        { kana: 'おれさま つよい', ko: '이 몸이 제일 세다!', notes: 'G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2' },
        { kana: 'ちょとつ まえへ', pk: 'ちょとつ まええ', ko: '돌진! 앞으로!', notes: 'D4 E4 F4:2 E4 F4 G4:2' },
        { kana: 'おれさま つよい', ko: '이 몸이 제일 세다!', notes: 'G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2' },
        { kana: 'もうしん', pk: 'もーしん', ko: '맹진! (힘차게 돌진!)', notes: 'D4:2 G4:2 E4 C4:3' }
      ] }
  ];

  var SMALL = 'ゃゅょぁぃぅぇぉャュョァィゥェォ';
  function morae(kana) {
    var out = [], s = String(kana).replace(/\s+/g, '');
    for (var i = 0; i < s.length; i++) {
      if (SMALL.indexOf(s[i]) >= 0 && out.length) out[out.length - 1] += s[i]; else out.push(s[i]);
    }
    return out;
  }
  var NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) { var m = /^([A-G])(#?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] ? 1 : 0); }
  // Expand to a flat timeline: notes[] = { beat, dur, midi, syl, line, idx }
  S.forEach(function (song) {
    var beat = 0, flat = [];
    song.lines.forEach(function (ln, li) {
      var syl = morae(ln.kana), ns = ln.notes.split(/\s+/);
      if (syl.length !== ns.length) throw new Error(song.id + ' line ' + li + ': ' + syl.length + ' morae vs ' + ns.length + ' notes');
      ln.syl = syl; ln.start = beat; ln.first = flat.length;
      ns.forEach(function (tok, k) {
        var p = tok.split(':'), d = p[1] ? parseFloat(p[1]) : 1;
        flat.push({ beat: beat, dur: d, midi: midi(p[0]), syl: syl[k], line: li, idx: k });
        beat += d;
      });
      ln.end = beat;
    });
    song.notes = flat; song.beats = beat;
    song.seconds = beat * 60 / song.bpm;
  });
  global.KSONGS = S;
  global.KSONGS_morae = morae;
})(typeof window !== 'undefined' ? window : globalThis);
