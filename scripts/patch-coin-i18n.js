const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'js');

const patches = {
  de: {
    'currency.coin': 'Planetare Goldmünze',
    'shop.eyebrow': 'Kosmetik',
    'shop.balance': 'Dein Guthaben',
    'shop.buy': 'Kaufen',
    'shop.desc': 'Passe deinen Spielstein, Würfel und Titel mit planetaren Goldmünzen an.',
    'profile.wallet': 'Schatzkammer',
    'profile.win_detail': '{wins} Siege bei {played} Partien',
    'profile.promo_hint': 'Löse einen Code gegen Münzen oder exklusive Belohnungen ein.',
    'profile.coins': 'Goldmünzen',
    'profile.streak': 'Aktuelle Serie',
    'pass.unlock_premium': 'Premium freischalten · {eur} € ({coins})',
    'lobby.capital': 'Startkapital ({n} {players}): {money}',
  },
  it: {
    'currency.coin': 'Moneta d\'oro planetaria',
    'shop.eyebrow': 'Cosmetici',
    'shop.balance': 'Il tuo saldo',
    'shop.buy': 'Acquista',
    'shop.desc': 'Personalizza pedina, dadi e titoli con le tue monete d\'oro planetarie.',
    'profile.wallet': 'Tesoreria',
    'profile.win_detail': '{wins} vittorie su {played} partite',
    'profile.promo_hint': 'Riscatta un codice per monete o ricompense esclusive.',
    'profile.coins': 'Monete d\'oro',
    'profile.streak': 'Serie attuale',
    'pass.unlock_premium': 'Sblocca Premium · {eur} € ({coins})',
    'lobby.capital': 'Capitale iniziale ({n} {players}): {money}',
  },
  pt: {
    'currency.coin': 'Moeda de ouro planetária',
    'shop.eyebrow': 'Cosméticos',
    'shop.balance': 'O teu saldo',
    'shop.buy': 'Comprar',
    'shop.desc': 'Personaliza o teu peão, dados e títulos com moedas de ouro planetárias.',
    'profile.wallet': 'Tesouraria',
    'profile.win_detail': '{wins} vitórias em {played} partidas',
    'profile.promo_hint': 'Resgata um código por moedas ou recompensas exclusivas.',
    'profile.coins': 'Moedas de ouro',
    'profile.streak': 'Série atual',
    'pass.unlock_premium': 'Desbloquear Premium · {eur} € ({coins})',
    'lobby.capital': 'Capital inicial ({n} {players}): {money}',
  },
  ko: {
    'currency.coin': '행성 금화',
    'shop.eyebrow': '코스메틱',
    'shop.balance': '보유 잔액',
    'shop.buy': '구매',
    'shop.desc': '행성 금화로 말, 주사위, 칭호를 꾸며보세요.',
    'profile.wallet': '금고',
    'profile.win_detail': '{played}게임 중 {wins}승',
    'profile.promo_hint': '코드를 사용해 금화나 특별 보상을 받으세요.',
    'profile.coins': '금화',
    'profile.streak': '현재 연승',
    'pass.unlock_premium': '프리미엄 해제 · {eur} € ({coins})',
    'lobby.capital': '시작 자본 ({n} {players}): {money}',
  },
  zh: {
    'currency.coin': '行星金币',
    'shop.eyebrow': '外观',
    'shop.balance': '当前余额',
    'shop.buy': '购买',
    'shop.desc': '用行星金币定制棋子、骰子和称号。',
    'profile.wallet': '金库',
    'profile.win_detail': '{played} 局中 {wins} 胜',
    'profile.promo_hint': '兑换代码获取金币或专属奖励。',
    'profile.coins': '金币',
    'profile.streak': '当前连胜',
    'pass.unlock_premium': '解锁高级版 · {eur} €（{coins}）',
    'lobby.capital': '初始资金（{n} {players}）：{money}',
  },
  ja: {
    'currency.coin': '惑星ゴールドコイン',
    'shop.eyebrow': 'コスメティック',
    'shop.balance': '所持残高',
    'shop.buy': '購入',
    'shop.desc': '惑星ゴールドコインで駒・ダイス・称号をカスタマイズ。',
    'profile.wallet': '財布',
    'profile.win_detail': '{played}戦中{wins}勝',
    'profile.promo_hint': 'コードを交換してコインや限定報酬を獲得。',
    'profile.coins': 'ゴールドコイン',
    'profile.streak': '現在の連勝',
    'pass.unlock_premium': 'プレミアム解除 · {eur} €（{coins}）',
    'lobby.capital': '初期資金（{n} {players}）：{money}',
  },
};

function lineFor(k, v) {
  const q = v.includes("'") ? '"' : "'";
  return `    '${k}': ${q}${v}${q},`;
}

for (const [lang, keys] of Object.entries(patches)) {
  const file = path.join(dir, `i18n-${lang}.js`);
  let src = fs.readFileSync(file, 'utf8');
  for (const [k, v] of Object.entries(keys)) {
    const re = new RegExp(`    '${k.replace(/\./g, '\\.')}':[^\\n]+`);
    if (re.test(src)) src = src.replace(re, lineFor(k, v));
    else {
      const anchor = k.startsWith('shop.') ? 'shop.title' : k.startsWith('profile.') ? 'profile.stats' : 'lobby.leave';
      const anchorRe = new RegExp(`('${anchor.replace(/\./g, '\\.')}':[^\\n]+)`);
      src = src.replace(anchorRe, `$1\n${lineFor(k, v)}`);
    }
  }
  fs.writeFileSync(file, src);
  console.log('patched', lang);
}
