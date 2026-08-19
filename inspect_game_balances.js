const fs = require('fs');

const games = [
  'Desert Axe - Premium Crash Betting Game.html',
  'Glass Roulette.html',
  'Neon Spins.html',
  'Rocet mines .html',
  'avator.html',
  'chicken road russhia.html',
  'desert frortune.html',
  'flappycheakpoint .html',
  'lader and snacks.html',
  'snack and landers 2 .html',
  'tik tak win.html'
];

games.forEach(g => {
  console.log('====================================================');
  console.log('GAME:', g);
  if (!fs.existsSync(g)) return;
  const content = fs.readFileSync(g, 'utf8');

  // Check script tag position
  const scriptIdx = content.indexOf('pk96-balance.js');
  console.log('pk96-balance.js index:', scriptIdx);

  // Check how balance is initialized or synced
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('localStorage.getItem') && (l.includes('balance') || l.includes('Balance'))) {
      console.log(`  Line ${idx+1} [getItem]: ${l.trim().slice(0, 150)}`);
    }
    if (l.includes('localStorage.setItem') && (l.includes('balance') || l.includes('Balance'))) {
      console.log(`  Line ${idx+1} [setItem]: ${l.trim().slice(0, 150)}`);
    }
    if (l.includes('window.PK96')) {
      console.log(`  Line ${idx+1} [PK96]: ${l.trim().slice(0, 150)}`);
    }
    if (l.includes('pk96_balance_changed')) {
      console.log(`  Line ${idx+1} [event]: ${l.trim().slice(0, 150)}`);
    }
  });
});
