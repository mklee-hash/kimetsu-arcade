/* =====================================================================
 * karaoke-songs.js — songs for 귀살대 노래방
 *
 * Every melody is a public-domain folk tune; every lyric is original
 * (written for this fan game), so nothing here is copyrighted material.
 *
 * window.KSONGS = [ { id, genre ('kids' default | 'pop'), title (kana), ko, char, tune, bpm,
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
    ,
    /* ---------- original J-pop style songs (melody + lyrics written for this game) ---------- */
    { id: 'yoake', genre: 'pop', title: 'よあけの けん', ko: '새벽의 검', char: 'tanjiro', bpm: 140,
      tune: '창작곡 · 열혈 애니 오프닝 스타일',
      lines: [
        { kana: 'やみを きりさけ', ko: '어둠을 베어 가르라', notes: 'A3:0.5 A3:0.5 C4 B3:0.5 A3:0.5 G3 A3:4' },
        { kana: 'ぼくらの つるぎ', ko: '우리의 칼이여', notes: 'G3:0.5 G3:0.5 A3 G3:0.5 E3:0.5 D3 E3:4' },
        { kana: 'なみだを こえて', ko: '눈물을 넘어서', notes: 'A3:0.5 A3:0.5 C4 D4:0.5 C4:0.5 B3 C4:4' },
        { kana: 'あしたへ はしれ', pk: 'あしたえ はしれ', ko: '내일로 달려라', notes: 'D4:0.5 C4:0.5 B3 A3:0.5 G3:0.5 B3 A3:4' },
        { kana: 'もえろ もえろ こころの ほのお', ko: '타올라라 타올라라 마음의 불꽃', notes: 'E4:0.5 E4:0.5 D4 E4:0.5 E4:0.5 D4 C4:0.5 C4:0.5 D4:0.5 E4:0.5 D4:0.5 C4:0.5 A3:5' },
        { kana: 'よあけは もうすぐ そこに ある', pk: 'よあけわ もーすぐ そこに ある', ko: '새벽은 바로 저기에 있어', notes: 'C4:0.5 C4:0.5 D4 E4:0.5 D4:0.5 C4 A3:0.5 C4:0.5 D4:0.5 D4:0.5 E4:0.5 C4:0.5 A3:5' },
        { kana: 'ほしを みあげて', ko: '별을 올려다보며', notes: 'A3:0.5 A3:0.5 C4 B3:0.5 A3:0.5 G3 A3:4' },
        { kana: 'ちかいを たてる', ko: '맹세를 세운다', notes: 'G3:0.5 G3:0.5 A3 G3:0.5 E3:0.5 D3 E3:4' },
        { kana: 'まもりたい ひと', ko: '지키고 싶은 사람', notes: 'A3:0.5 A3:0.5 C4 D4:0.5 C4:0.5 B3 C4:4' },
        { kana: 'わすれは しない', pk: 'わすれわ しない', ko: '절대 잊지 않아', notes: 'D4:0.5 C4:0.5 B3 A3:0.5 G3:0.5 B3 A3:4' },
        { kana: 'もえろ もえろ こころの ほのお', ko: '타올라라 타올라라 마음의 불꽃', notes: 'E4:0.5 E4:0.5 D4 E4:0.5 E4:0.5 D4 C4:0.5 C4:0.5 D4:0.5 E4:0.5 D4:0.5 C4:0.5 A3:5' },
        { kana: 'よあけは もうすぐ そこに ある', pk: 'よあけわ もーすぐ そこに ある', ko: '새벽은 바로 저기에 있어', notes: 'C4:0.5 C4:0.5 D4 E4:0.5 D4:0.5 C4 A3:0.5 C4:0.5 D4:0.5 D4:0.5 E4:0.5 C4:0.5 A3:5' }
      ] },
    { id: 'sakura', genre: 'pop', title: 'さくらの てがみ', ko: '벚꽃 편지', char: 'shinobu', bpm: 76,
      tune: '창작곡 · 잔잔한 엔딩 발라드 스타일',
      lines: [
        { kana: 'さくら ひらひら まいおちて', ko: '벚꽃이 하늘하늘 흩날려', notes: 'E4:0.5 E4:0.5 G4 A4:0.5 G4:0.5 E4:0.5 D4:0.5 C4:0.5 D4:0.5 E4 D4:0.5 C4:1.5' },
        { kana: 'きみに あいたい よるが くる', ko: '네가 보고 싶은 밤이 와', notes: 'E4:0.5 E4:0.5 G4 A4:0.5 C5:0.5 B4:0.5 A4:0.5 G4:0.5 A4:0.5 G4 E4:0.5 D4:1.5' },
        { kana: 'とどかない てがみ', ko: '닿지 않는 편지', notes: 'A4 A4 G4 E4 G4:0.5 A4:0.5 C5 B4:2' },
        { kana: 'かぜに のせて おくるよ', ko: '바람에 실어 보낼게', notes: 'A4:0.5 G4:0.5 E4 D4 E4:0.5 G4:0.5 E4:0.5 D4:0.5 D4 C4:2' },
        { kana: 'なつの あおい そらへ とどけ', pk: 'なつの あおい そらえ とどけ', ko: '여름의 파란 하늘로 닿아라', notes: 'E4:0.5 E4:0.5 G4 A4:0.5 G4:0.5 E4:0.5 D4:0.5 C4:0.5 D4:0.5 E4 D4:0.5 C4:1.5' },
        { kana: 'こころは いつも そばに いる', pk: 'こころわ いつも そばに いる', ko: '마음은 언제나 곁에 있어', notes: 'E4:0.5 E4:0.5 G4 A4:0.5 C5:0.5 B4:0.5 A4:0.5 G4:0.5 A4:0.5 G4 E4:0.5 D4:1.5' },
        { kana: 'わすれない えがお', ko: '잊지 않을 미소', notes: 'A4 A4 G4 E4 G4:0.5 A4:0.5 C5 B4:2' },
        { kana: 'ほしに ねがい かけるよ', ko: '별에 소원을 빌게', notes: 'A4:0.5 G4:0.5 E4 D4 E4:0.5 G4:0.5 E4:0.5 D4:0.5 D4 C4:2' }
      ] },
    { id: 'happy', genre: 'pop', title: 'ドキドキ・ハッピーデイ', ko: '두근두근 해피 데이', char: 'mitsuri', bpm: 128,
      tune: '창작곡 · 밝은 J-pop 스타일',
      lines: [
        { kana: 'きょうは なにを しようかな', pk: 'きょーわ なにを しよーかな', ko: '오늘은 뭘 해 볼까', notes: 'C4:0.5 D4:0.5 E4 G4:0.5 G4:0.5 A4 G4:0.5 E4:0.5 D4:0.5 E4:0.5 C4:2' },
        { kana: 'そらは あおくて きもちいい', pk: 'そらわ あおくて きもちいい', ko: '하늘은 파랗고 기분 좋아', notes: 'C4:0.5 D4:0.5 E4 G4:0.5 A4:0.5 C5 A4:0.5 G4:0.5 E4:0.5 G4:0.5 A4:0.5 G4:1.5' },
        { kana: 'ドキドキ ワクワク', ko: '두근두근 설렘설렘', notes: 'A4:0.5 A4:0.5 G4:0.5 E4:0.5 A4:0.5 A4:0.5 G4:0.5 E4:4.5' },
        { kana: 'みんなで わらおう', pk: 'みんなで わらおー', ko: '다 같이 웃자', notes: 'D4:0.5 E4:0.5 G4 E4:0.5 D4:0.5 C4 D4 C4:3' },
        { kana: 'たのしい たのしい いちにちだ', ko: '즐거운 즐거운 하루야', notes: 'E4:0.5 G4:0.5 A4 E4:0.5 G4:0.5 A4 C5:0.5 C5:0.5 D5:0.5 C5:0.5 A4:0.5 G4:0.5 C5:5' },
        { kana: 'あしたも また あおうよね', pk: 'あしたも また あおーよね', ko: '내일도 또 만나자', notes: 'C4:0.5 D4:0.5 E4 G4:0.5 G4:0.5 A4 G4:0.5 E4:0.5 D4:0.5 E4:0.5 C4:2' },
        { kana: 'ゆめは おおきく ふくらんで', pk: 'ゆめわ おーきく ふくらんで', ko: '꿈은 크게 부풀어 올라', notes: 'C4:0.5 D4:0.5 E4 G4:0.5 A4:0.5 C5 A4:0.5 G4:0.5 E4:0.5 G4:0.5 A4:0.5 G4:1.5' },
        { kana: 'キラキラ ルンルン', ko: '반짝반짝 룰루랄라', notes: 'A4:0.5 A4:0.5 G4:0.5 E4:0.5 A4:0.5 A4:0.5 G4:0.5 E4:4.5' },
        { kana: 'みんなで うたおう', pk: 'みんなで うたおー', ko: '다 같이 노래하자', notes: 'D4:0.5 E4:0.5 G4 E4:0.5 D4:0.5 C4 D4 C4:3' },
        { kana: 'たのしい たのしい いちにちだ', ko: '즐거운 즐거운 하루야', notes: 'E4:0.5 G4:0.5 A4 E4:0.5 G4:0.5 A4 C5:0.5 C5:0.5 D5:0.5 C5:0.5 A4:0.5 G4:0.5 C5:5' }
      ] },
    { id: 'kiri', genre: 'pop', title: 'きりの むこう', ko: '안개 너머', char: 'muichiro', bpm: 96,
      tune: '창작곡 · 감성 미디엄 템포 스타일',
      lines: [
        { kana: 'わすれた ことも', ko: '잊어버린 것도', notes: 'E4 E4 D4 C4 D4 E4 A3:2' },
        { kana: 'いつか おもいだす', ko: '언젠가 떠올릴 거야', notes: 'C4 D4 E4 G4 A4:0.5 G4:0.5 E4 D4:2' },
        { kana: 'きりの むこうに', pk: 'きりの むこーに', ko: '안개 너머에', notes: 'E4 E4 G4 A4 G4 E4 A4:2' },
        { kana: 'ひかる そらが ある', ko: '빛나는 하늘이 있어', notes: 'C5 B4 A4 G4 A4:0.5 G4:0.5 E4 E4:2' },
        { kana: 'なまえを よんで', ko: '내 이름을 불러 줘', notes: 'A4 A4 G4 E4 G4 A4 C5:2' },
        { kana: 'ぼくは ここに いる', pk: 'ぼくわ ここに いる', ko: '나는 여기 있어', notes: 'B4 A4 G4 E4 D4:0.5 E4:0.5 C4 A3:2' },
        { kana: 'さみしい よるも', ko: '외로운 밤에도', notes: 'E4 E4 D4 C4 D4 E4 A3:2' },
        { kana: 'きみが そばに いる', ko: '네가 곁에 있어', notes: 'C4 D4 E4 G4 A4:0.5 G4:0.5 E4 D4:2' }
      ] },
    { id: 'nemui', genre: 'pop', title: 'ねむい ぜんいつ', ko: '졸린 젠이츠', char: 'zenitsu', bpm: 120,
      tune: '창작곡 · 신나는 코믹송 스타일',
      lines: [
        { kana: 'ねむい ねむい', ko: '졸려 졸려', notes: 'G4:0.5 E4:0.5 G4 G4:0.5 E4:0.5 G4' },
        { kana: 'おきたく ない', ko: '일어나기 싫어', notes: 'A4:0.5 G4:0.5 E4 D4:0.5 E4:0.5 C4' },
        { kana: 'でも おにが きたら', ko: '그래도 혈귀가 오면', notes: 'C4:0.5 C4:0.5 D4:0.5 E4:0.5 G4 A4:0.5 G4:0.5 E4:4' },
        { kana: 'いなずま ひかる', ko: '번개가 번쩍!', notes: 'C5 A4:0.5 G4:0.5 A4 C5 D5 C5:3' },
        { kana: 'ねたまま つよい', ko: '자면서도 세다', notes: 'G4:0.5 G4:0.5 E4 G4:0.5 G4:0.5 E4 D4:4' },
        { kana: 'それが ぼくだよ', ko: '그게 바로 나야', notes: 'E4 G4 A4:0.5 G4:0.5 E4 D4 C4:3' },
        { kana: 'ごはん たべて', ko: '밥 먹고 나면', notes: 'G4:0.5 E4:0.5 G4 G4:0.5 E4:0.5 G4' },
        { kana: 'ねむく なるよ', ko: '또 졸려져', notes: 'A4:0.5 G4:0.5 E4 D4:0.5 E4:0.5 C4' },
        { kana: 'でも ねずこちゃんが', ko: '그래도 네즈코가', notes: 'C4:0.5 C4:0.5 D4:0.5 E4:0.5 G4 A4:0.5 G4:0.5 E4:4' },
        { kana: 'ほほえむ だけで', ko: '웃어 주기만 하면', notes: 'C5 A4:0.5 G4:0.5 A4 C5 D5 C5:3' },
        { kana: 'げんき ひゃくばい', ko: '기운이 백 배!', notes: 'G4:0.5 G4:0.5 E4 G4:0.5 G4:0.5 E4 D4:4' },
        { kana: 'それが ぼくだよ', ko: '그게 바로 나야', notes: 'E4 G4 A4:0.5 G4:0.5 E4 D4 C4:3' }
      ] }
    ,
    { id: 'matsuri', genre: 'pop', title: 'おまつり ドンドン', ko: '축제 둥둥', char: 'tengen', bpm: 136,
      tune: '창작곡 · 신나는 축제 스타일',
      lines: [
        { kana: 'ドンドン ドンドン', ko: '둥둥 둥둥!', notes: 'C4:0.5 C4:0.5 E4:0.5 C4:0.5 G4:0.5 G4:0.5 E4 C4:4' },
        { kana: 'はでに いこうぜ', pk: 'はでに いこーぜ', ko: '화려하게 가자!', notes: 'E4:0.5 G4:0.5 A4 G4:0.5 E4:0.5 G4 C5:4' },
        { kana: 'ちょうちん ゆれて', pk: 'ちょーちん ゆれて', ko: '초롱이 흔들흔들', notes: 'A4:0.5 A4:0.5 G4 E4:0.5 D4:0.5 E4 G4:4' },
        { kana: 'みんなで おどろう', pk: 'みんなで おどろー', ko: '다 같이 춤추자', notes: 'G4:0.5 A4:0.5 G4:0.5 E4:0.5 D4 E4 D4 C4:3' },
        { kana: 'それそれ それそれ', ko: '영차영차 영차영차!', notes: 'C5:0.5 C5:0.5 A4:0.5 C5:0.5 D5:0.5 D5:0.5 C5 A4:4' },
        { kana: 'まつりは さいこう', pk: 'まつりわ さいこー', ko: '축제는 최고야!', notes: 'A4:0.5 G4:0.5 E4:0.5 G4:0.5 A4 G4 E4 C4:3' },
        { kana: 'ピカピカ ピカピカ', ko: '반짝반짝 반짝반짝', notes: 'C4:0.5 C4:0.5 E4:0.5 C4:0.5 G4:0.5 G4:0.5 E4 C4:4' },
        { kana: 'はなびが あがる', ko: '불꽃놀이가 올라가', notes: 'E4:0.5 G4:0.5 A4 G4:0.5 E4:0.5 G4 C5:4' },
        { kana: 'よぞらに さいた', ko: '밤하늘에 피었어', notes: 'A4:0.5 A4:0.5 G4 E4:0.5 D4:0.5 E4 G4:4' },
        { kana: 'みんなで わらおう', pk: 'みんなで わらおー', ko: '다 같이 웃자', notes: 'G4:0.5 A4:0.5 G4:0.5 E4:0.5 D4 E4 D4 C4:3' },
        { kana: 'それそれ それそれ', ko: '영차영차 영차영차!', notes: 'C5:0.5 C5:0.5 A4:0.5 C5:0.5 D5:0.5 D5:0.5 C5 A4:4' },
        { kana: 'まつりは さいこう', pk: 'まつりわ さいこー', ko: '축제는 최고야!', notes: 'A4:0.5 G4:0.5 E4:0.5 G4:0.5 A4 G4 E4 C4:3' }
      ] },
    { id: 'dash', genre: 'pop', title: 'いのしし ダッシュ', ko: '멧돼지 대시', char: 'inosuke', bpm: 150,
      tune: '창작곡 · 신나는 록 스타일',
      lines: [
        { kana: 'はしれ はしれ', ko: '달려 달려!', notes: 'E4:0.5 E4:0.5 G4 E4:0.5 E4:0.5 G4' },
        { kana: 'まえだけ みろ', ko: '앞만 봐!', notes: 'A4:0.5 A4:0.5 G4 E4:0.5 D4:0.5 E4' },
        { kana: 'やまも かわも とびこえろ', ko: '산도 강도 뛰어넘어라', notes: 'C4:0.5 D4:0.5 E4 C4:0.5 D4:0.5 E4 G4:0.5 G4:0.5 A4:0.5 G4:0.5 E4:2' },
        { kana: 'ちょとつ もうしん', pk: 'ちょとつ もーしん', ko: '저돌맹진!', notes: 'G4:0.5 G4:0.5 A4 C5 A4 G4 C5:3' },
        { kana: 'ほえろ ほえろ', ko: '외쳐라 외쳐라!', notes: 'E4:0.5 E4:0.5 G4 E4:0.5 E4:0.5 G4' },
        { kana: 'おれは つよい', pk: 'おれわ つよい', ko: '이 몸은 세다!', notes: 'A4:0.5 A4:0.5 G4 E4:0.5 D4:0.5 E4' },
        { kana: 'かぜも くもも おいこして', ko: '바람도 구름도 앞질러', notes: 'C4:0.5 D4:0.5 E4 C4:0.5 D4:0.5 E4 G4:0.5 G4:0.5 A4:0.5 G4:0.5 E4:2' },
        { kana: 'ちょとつ もうしん', pk: 'ちょとつ もーしん', ko: '저돌맹진!', notes: 'G4:0.5 G4:0.5 A4 C5 A4 G4 C5:3' },
        { kana: 'はしれ はしれ', ko: '달려 달려!', notes: 'E4:0.5 E4:0.5 G4 E4:0.5 E4:0.5 G4' },
        { kana: 'まえだけ みろ', ko: '앞만 봐!', notes: 'A4:0.5 A4:0.5 G4 E4:0.5 D4:0.5 E4' },
        { kana: 'やまも かわも とびこえろ', ko: '산도 강도 뛰어넘어라', notes: 'C4:0.5 D4:0.5 E4 C4:0.5 D4:0.5 E4 G4:0.5 G4:0.5 A4:0.5 G4:0.5 E4:2' },
        { kana: 'ちょとつ もうしん', pk: 'ちょとつ もーしん', ko: '저돌맹진!', notes: 'G4:0.5 G4:0.5 A4 C5 A4 G4 C5:3' }
      ] },
    { id: 'odekake', genre: 'pop', title: 'おでかけ だいすき', ko: '나들이 좋아', char: 'nezuko', bpm: 116,
      tune: '창작곡 · 즐거운 소풍송 스타일',
      lines: [
        { kana: 'おにぎり つつんで', ko: '주먹밥을 싸서', notes: 'C4:0.5 E4:0.5 G4 G4:0.5 A4:0.5 G4 E4 C4:3' },
        { kana: 'はれた そらの した', ko: '맑은 하늘 아래', notes: 'D4:0.5 E4:0.5 F4 E4:0.5 D4:0.5 C4 D4 G4:3' },
        { kana: 'ねずこと おにいちゃん', ko: '네즈코랑 오빠랑', notes: 'C4:0.5 E4:0.5 G4:0.5 G4:0.5 A4 C5:0.5 A4:0.5 G4 E4:3' },
        { kana: 'ならんで あるこう', pk: 'ならんで あるこー', ko: '나란히 걸어가자', notes: 'D4:0.5 D4:0.5 E4 G4:0.5 E4:0.5 D4 D4 C4:3' },
        { kana: 'ラララ ランラン', ko: '랄랄라 랄랄라', notes: 'G4:0.5 G4:0.5 G4 A4:0.5 G4:0.5 E4 C5:4' },
        { kana: 'たのしい おでかけ', ko: '즐거운 나들이', notes: 'A4:0.5 G4:0.5 E4:0.5 G4:0.5 A4 G4 D4 C4:3' },
        { kana: 'さくらの きのした', ko: '벚나무 아래에서', notes: 'C4:0.5 E4:0.5 G4 G4:0.5 A4:0.5 G4 E4 C4:3' },
        { kana: 'みんなで たべよう', pk: 'みんなで たべよー', ko: '다 같이 먹자', notes: 'D4:0.5 E4:0.5 F4 E4:0.5 D4:0.5 C4 D4 G4:3' },
        { kana: 'ぜんいつ いのすけも', ko: '젠이츠 이노스케도', notes: 'C4:0.5 E4:0.5 G4:0.5 G4:0.5 A4 C5:0.5 A4:0.5 G4 E4:3' },
        { kana: 'にこにこ えがおだ', ko: '싱글벙글 웃는 얼굴', notes: 'D4:0.5 D4:0.5 E4 G4:0.5 E4:0.5 D4 D4 C4:3' },
        { kana: 'ラララ ランラン', ko: '랄랄라 랄랄라', notes: 'G4:0.5 G4:0.5 G4 A4:0.5 G4:0.5 E4 C5:4' },
        { kana: 'たのしい おでかけ', ko: '즐거운 나들이', notes: 'A4:0.5 G4:0.5 E4:0.5 G4:0.5 A4 G4 D4 C4:3' }
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
