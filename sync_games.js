const fs = require('fs');
const path = require('path');

const gameSyncPairs = [
  { primary: 'chicken_road.html', secondary: 'chicken road russhia.html' },
  { primary: 'desert_axe.html', secondary: 'Desert Axe - Premium Crash Betting Game.html' },
  { primary: 'glass_roulette.html', secondary: 'Glass Roulette.html' },
  { primary: 'neon_spins.html', secondary: 'Neon Spins.html' },
  { primary: 'rocket_mines.html', secondary: 'Rocet mines .html' },
  { primary: 'desert_fortune.html', secondary: 'desert frortune.html' },
  { primary: 'aviator.html', secondary: 'avator.html' },
  { primary: 'snakes_and_ladders_2.html', secondary: 'snack and landers 2 .html' },
  { primary: 'tik_tak_win.html', secondary: 'tik tak win.html' },
  { primary: 'index.html', secondary: 'lobby.html' }
];

console.log('--- Synchronizing Game Files & Aliases ---');

let syncCount = 0;
gameSyncPairs.forEach(({ primary, secondary }) => {
  const pPath = path.join(__dirname, primary);
  const sPath = path.join(__dirname, secondary);

  if (fs.existsSync(pPath)) {
    const pContent = fs.readFileSync(pPath, 'utf8');
    if (fs.existsSync(sPath)) {
      const sContent = fs.readFileSync(sPath, 'utf8');
      if (pContent !== sContent) {
        fs.writeFileSync(sPath, pContent, 'utf8');
        console.log(`[SYNCED] ${primary} -> ${secondary}`);
        syncCount++;
      } else {
        console.log(`[UP-TO-DATE] ${primary} & ${secondary}`);
      }
    } else {
      fs.writeFileSync(sPath, pContent, 'utf8');
      console.log(`[CREATED] ${secondary} from ${primary}`);
      syncCount++;
    }
  } else if (fs.existsSync(sPath)) {
    const sContent = fs.readFileSync(sPath, 'utf8');
    fs.writeFileSync(pPath, sContent, 'utf8');
    console.log(`[RESTORED] ${primary} from ${secondary}`);
    syncCount++;
  }
});

console.log(`Synchronized ${syncCount} game files successfully.`);
