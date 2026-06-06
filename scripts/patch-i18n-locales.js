const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'js');

const patches = {
  de: {
    auth: {
      'auth.feat_play_title': 'Flüssige Partien',
      'auth.feat_play_desc': '3D-Würfel, Echtzeit-Züge und klare Aktionen in jedem Schritt.',
      'auth.feat_board_title': 'Treues Lansay-Brett',
      'auth.feat_board_desc': 'Doppelte Schleife, 24 Ressourcen und authentische Royalty-Regeln.',
      'auth.feat_multi_title': 'Globales Multiplayer',
      'auth.feat_multi_desc': 'Private Räume, schnelles Matchmaking und bis zu 6 Spieler online.',
    },
    resources: {
      'resources.search_ph': 'Ressource oder Land suchen…',
      'resources.meta_count': '{count} Ressourcen',
      'resources.meta_filtered': '{visible} / {total}',
      'resources.expand_all': 'Alle erweitern',
      'resources.collapse_all': 'Alle einklappen',
      'resources.no_results': 'Keine Ressource entspricht Ihrer Suche.',
    },
    tutorial: {
      'tutorial.progress': 'Schritt {n} von {total}',
      'tutorial.prev': 'Zurück',
      'tutorial.step2_title': 'Das Spielbrett',
      'tutorial.step2_body': 'Äußere und innere Schleife um den Globus. Zoome mit +/− und lies die Legende in der Mitte.',
      'tutorial.step3_title': 'Würfeln und Titel kaufen',
      'tutorial.step3_body': 'Würfle in deinem Zug, bewege dich und kaufe Titel auf Länderfeldern.',
      'tutorial.step4_title': 'Ressourcen-Panel',
      'tutorial.step4_body': '« Alle Ressourcen anzeigen » öffnet die Lansay-Referenz: Preise, Länder und Royalty-Stufen.',
      'tutorial.step5_title': 'Royalties',
      'tutorial.step5_body': 'Auf besetzten Ressourcen zahlst oder erhältst du Royalties. Grün = Gewinn, Rot = Schuld.',
      'tutorial.step6_title': 'Das Spiel gewinnen',
      'tutorial.step6_body': 'Baue ein starkes Imperium, verwalte dein Geld und eliminiere Gegner.',
    },
  },
  it: {
    auth: {
      'auth.feat_play_title': 'Partite fluide',
      'auth.feat_play_desc': 'Dadi 3D, turni in tempo reale e azioni chiare a ogni passo.',
      'auth.feat_board_title': 'Tabellone fedele Lansay',
      'auth.feat_board_desc': 'Doppio anello, 24 risorse e regole di royalty autentiche.',
      'auth.feat_multi_title': 'Multigiocatore globale',
      'auth.feat_multi_desc': 'Sale private, matchmaking rapido e fino a 6 giocatori online.',
    },
    resources: {
      'resources.search_ph': 'Cerca una risorsa o un paese…',
      'resources.meta_count': '{count} risorse',
      'resources.meta_filtered': '{visible} / {total}',
      'resources.expand_all': 'Espandi tutto',
      'resources.collapse_all': 'Comprimi tutto',
      'resources.no_results': 'Nessuna risorsa corrisponde alla ricerca.',
    },
    tutorial: {
      'tutorial.progress': 'Passo {n} di {total}',
      'tutorial.prev': 'Indietro',
      'tutorial.step2_title': 'Il tabellone',
      'tutorial.step2_body': 'Anello esterno e interno intorno al globo. Zoom con +/− e leggi la legenda al centro.',
      'tutorial.step3_title': 'Lancia e acquista titoli',
      'tutorial.step3_body': 'Al tuo turno, lancia i dadi, avanza e acquista titoli sulle caselle paese.',
      'tutorial.step4_title': 'Pannello risorse',
      'tutorial.step4_body': '« Vedi tutte le risorse » apre il riferimento Lansay: prezzi, paesi e royalty.',
      'tutorial.step5_title': 'Royalties',
      'tutorial.step5_body': 'Su una risorsa posseduta paghi o incassi royalties. Verde = guadagni, rosso = devi pagare.',
      'tutorial.step6_title': 'Vincere la partita',
      'tutorial.step6_body': 'Costruisci un impero solido, gestisci il denaro ed elimina gli avversari.',
    },
  },
  pt: {
    auth: {
      'auth.feat_play_title': 'Partidas fluidas',
      'auth.feat_play_desc': 'Dados 3D, turnos em tempo real e ações claras em cada passo.',
      'auth.feat_board_title': 'Tabuleiro fiel Lansay',
      'auth.feat_board_desc': 'Duplo circuito, 24 riquezas e royalties autênticas do jogo de tabuleiro.',
      'auth.feat_multi_title': 'Multijogador global',
      'auth.feat_multi_desc': 'Salas privadas, matchmaking rápido e até 6 jogadores online.',
    },
    resources: {
      'resources.search_ph': 'Pesquisar riqueza ou país…',
      'resources.meta_count': '{count} riquezas',
      'resources.meta_filtered': '{visible} / {total}',
      'resources.expand_all': 'Expandir tudo',
      'resources.collapse_all': 'Recolher tudo',
      'resources.no_results': 'Nenhuma riqueza corresponde à pesquisa.',
    },
    tutorial: {
      'tutorial.progress': 'Passo {n} de {total}',
      'tutorial.prev': 'Voltar',
      'tutorial.step2_title': 'O tabuleiro',
      'tutorial.step2_body': 'Circuito exterior e interior em volta do globo. Zoom com +/− e lê a legenda no centro.',
      'tutorial.step3_title': 'Lançar e comprar títulos',
      'tutorial.step3_body': 'No teu turno, lança os dados, avança e compra títulos nas casas país.',
      'tutorial.step4_title': 'Painel de riquezas',
      'tutorial.step4_body': '« Ver todas as riquezas » abre a referência Lansay: preços, países e royalties.',
      'tutorial.step5_title': 'Royalties',
      'tutorial.step5_body': 'Ao parar numa riqueza possuída, pagas ou recebes royalties. Verde = ganhas, vermelho = deves pagar.',
      'tutorial.step6_title': 'Ganhar a partida',
      'tutorial.step6_body': 'Constrói um império sólido, gere o dinheiro e elimina os adversários.',
    },
  },
  ko: {
    auth: {
      'auth.feat_play_title': '부드러운 플레이',
      'auth.feat_play_desc': '3D 주사위, 실시간 턴, 매 단계마다 명확한 액션.',
      'auth.feat_board_title': '랑세이 보드 충실 재현',
      'auth.feat_board_desc': '이중 루프, 24개 자원, 보드게임의 진짜 로열티 규칙.',
      'auth.feat_multi_title': '글로벌 멀티플레이',
      'auth.feat_multi_desc': '비공개 방, 빠른 매칭, 최대 6인 온라인.',
    },
    resources: {
      'resources.search_ph': '자원 또는 국가 검색…',
      'resources.meta_count': '{count}개 자원',
      'resources.meta_filtered': '{visible} / {total}',
      'resources.expand_all': '모두 펼치기',
      'resources.collapse_all': '모두 접기',
      'resources.no_results': '검색과 일치하는 자원이 없습니다.',
    },
    tutorial: {
      'tutorial.progress': '{total}단계 중 {n}단계',
      'tutorial.prev': '이전',
      'tutorial.step2_title': '보드판',
      'tutorial.step2_body': '지구를 둘러싼 바깥·안쪽 루프. +/−로 확대하고 중앙 범례를 확인하세요.',
      'tutorial.step3_title': '주사위와 타이틀 구매',
      'tutorial.step3_body': '자신의 턴에 주사위를 굴리고 이동해 국가 칸에서 타이틀을 구매합니다.',
      'tutorial.step4_title': '자원 패널',
      'tutorial.step4_body': '« 모든 자원 보기 »에서 랑세이 참고표: 가격, 국가, 로열티 단계.',
      'tutorial.step5_title': '로열티',
      'tutorial.step5_body': '소유 자원에 멈추면 로열티를 지불하거나 받습니다. 초록=수입, 빨강=지불.',
      'tutorial.step6_title': '승리하기',
      'tutorial.step6_body': '제국을 키우고 자금을 관리해 상대를 제거하세요.',
    },
  },
  zh: {
    auth: {
      'auth.feat_play_title': '流畅对局',
      'auth.feat_play_desc': '3D 骰子、实时回合、每步操作清晰明了。',
      'auth.feat_board_title': '忠实 Lansay 棋盘',
      'auth.feat_board_desc': '双环路线、24 种资源、桌游正版版税规则。',
      'auth.feat_multi_title': '全球多人',
      'auth.feat_multi_desc': '私人房间、快速匹配、最多 6 人在线。',
    },
    resources: {
      'resources.search_ph': '搜索资源或国家…',
      'resources.meta_count': '{count} 种资源',
      'resources.meta_filtered': '{visible} / {total}',
      'resources.expand_all': '全部展开',
      'resources.collapse_all': '全部收起',
      'resources.no_results': '没有匹配的资源。',
    },
    tutorial: {
      'tutorial.progress': '第 {n} 步，共 {total} 步',
      'tutorial.prev': '返回',
      'tutorial.step2_title': '棋盘',
      'tutorial.step2_body': '环绕地球的外环与内环。用 +/− 缩放，阅读棋盘中心的图例。',
      'tutorial.step3_title': '掷骰并购买头衔',
      'tutorial.step3_body': '轮到你时掷骰前进，在国家格子上购买头衔。',
      'tutorial.step4_title': '资源面板',
      'tutorial.step4_body': '« 查看所有资源 » 打开 Lansay 参考：价格、国家与版税等级。',
      'tutorial.step5_title': '版税',
      'tutorial.step5_body': '停在已拥有的资源上需支付或收取版税。绿=收入，红=支出。',
      'tutorial.step6_title': '赢得游戏',
      'tutorial.step6_body': '建立强大帝国，管理资金并淘汰对手。',
    },
  },
  ja: {
    auth: {
      'auth.feat_play_title': 'スムーズな対戦',
      'auth.feat_play_desc': '3Dダイス、リアルタイムターン、各ステップで明確な操作。',
      'auth.feat_board_title': 'Lansay忠実ボード',
      'auth.feat_board_desc': '二重ループ、24資源、ボードゲーム本物のロイヤリティルール。',
      'auth.feat_multi_title': 'グローバルマルチ',
      'auth.feat_multi_desc': 'プライベートルーム、クイックマッチ、最大6人オンライン。',
    },
    resources: {
      'resources.search_ph': '資源または国を検索…',
      'resources.meta_count': '{count} 資源',
      'resources.meta_filtered': '{visible} / {total}',
      'resources.expand_all': 'すべて展開',
      'resources.collapse_all': 'すべて折りたたむ',
      'resources.no_results': '検索に一致する資源がありません。',
    },
    tutorial: {
      'tutorial.progress': 'ステップ {n} / {total}',
      'tutorial.prev': '戻る',
      'tutorial.step2_title': 'ボード',
      'tutorial.step2_body': '地球を囲む外周・内周ループ。+/−でズームし、中央の凡例を確認。',
      'tutorial.step3_title': 'サイコロとタイトル購入',
      'tutorial.step3_body': '自分の番にサイコロを振り、移動して国マスでタイトルを購入。',
      'tutorial.step4_title': '資源パネル',
      'tutorial.step4_body': '« すべての資源を見る » で Lansay 参照：価格、国、ロイヤリティ段階。',
      'tutorial.step5_title': 'ロイヤリティ',
      'tutorial.step5_body': '所有資源に止まると支払いまたは受取。緑=受取、赤=支払。',
      'tutorial.step6_title': '勝利する',
      'tutorial.step6_body': '帝国を築き、資金を管理して相手を倒しましょう。',
    },
  },
};

function lineFor(k, v) {
  const q = v.includes("'") ? '"' : "'";
  return `    '${k}': ${q}${v}${q},`;
}

function upsertAfter(src, anchorKey, newLines) {
  for (const [k, v] of newLines) {
    const re = new RegExp(`    '${k.replace(/\./g, '\\.')}':[^\\n]+`);
    if (re.test(src)) {
      src = src.replace(re, lineFor(k, v));
    } else {
      const anchorRe = new RegExp(`('${anchorKey.replace(/\./g, '\\.')}':[^\\n]+)`);
      src = src.replace(anchorRe, `$1\n${lineFor(k, v)}`);
    }
  }
  return src;
}

for (const [lang, groups] of Object.entries(patches)) {
  const file = path.join(dir, `i18n-${lang}.js`);
  let src = fs.readFileSync(file, 'utf8');

  src = upsertAfter(src, 'auth.subtitle', Object.entries(groups.auth));
  src = upsertAfter(src, 'resources.collapse', Object.entries(groups.resources));

  const t = groups.tutorial;
  src = src.replace(
    /    'tutorial\.step2_title':[^\n]+\n    'tutorial\.step2_body':[^\n]+/,
    `${lineFor('tutorial.step2_title', t['tutorial.step2_title'])}\n${lineFor('tutorial.step2_body', t['tutorial.step2_body'])}`
  );
  src = src.replace(
    /    'tutorial\.step3_title':[^\n]+\n    'tutorial\.step3_body':[^\n]+/,
    `${lineFor('tutorial.step3_title', t['tutorial.step3_title'])}\n${lineFor('tutorial.step3_body', t['tutorial.step3_body'])}`
  );
  src = src.replace(
    /    'tutorial\.step4_title':[^\n]+\n    'tutorial\.step4_body':[^\n]+/,
    [
      lineFor('tutorial.step4_title', t['tutorial.step4_title']),
      lineFor('tutorial.step4_body', t['tutorial.step4_body']),
      lineFor('tutorial.step5_title', t['tutorial.step5_title']),
      lineFor('tutorial.step5_body', t['tutorial.step5_body']),
      lineFor('tutorial.step6_title', t['tutorial.step6_title']),
      lineFor('tutorial.step6_body', t['tutorial.step6_body']),
    ].join('\n')
  );
  src = upsertAfter(src, 'tutorial.title', [
    ['tutorial.progress', t['tutorial.progress']],
    ['tutorial.prev', t['tutorial.prev']],
  ]);

  fs.writeFileSync(file, src);
  console.log('patched', lang);
}
