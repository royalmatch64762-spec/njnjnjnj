const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global CORS & Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Content-Security-Policy', "frame-ancestors *;");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mapping of legacy game filenames/aliases to normalized files
const gameAliasMap = {
  "desert_axe": "desert_axe.html",
  "desert_axe.html": "desert_axe.html",
  "desert-axe": "desert_axe.html",
  "Desert Axe - Premium Crash Betting Game.html": "desert_axe.html",
  "Desert Axe - Premium Crash Betting Game": "desert_axe.html",

  "glass_roulette": "glass_roulette.html",
  "glass_roulette.html": "glass_roulette.html",
  "glass-roulette": "glass_roulette.html",
  "Glass Roulette.html": "glass_roulette.html",
  "Glass Roulette": "glass_roulette.html",

  "neon_spins": "neon_spins.html",
  "neon_spins.html": "neon_spins.html",
  "neon-spins": "neon_spins.html",
  "Neon Spins.html": "neon_spins.html",
  "Neon Spins": "neon_spins.html",

  "rocket_mines": "rocket_mines.html",
  "rocket_mines.html": "rocket_mines.html",
  "rocket-mines": "rocket_mines.html",
  "Rocet mines .html": "rocket_mines.html",
  "Rocet mines.html": "rocket_mines.html",
  "Rocet mines": "rocket_mines.html",

  "avator": "aviator.html",
  "avator.html": "aviator.html",
  "aviator": "aviator.html",
  "aviator.html": "aviator.html",

  "chicken_road": "chicken_road.html",
  "chicken_road.html": "chicken_road.html",
  "chicken-road": "chicken_road.html",
  "chicken road russhia.html": "chicken_road.html",
  "chicken road russhia": "chicken_road.html",

  "desert_fortune": "desert_fortune.html",
  "desert_fortune.html": "desert_fortune.html",
  "desert-fortune": "desert_fortune.html",
  "desert frortune.html": "desert_fortune.html",
  "desert frortune": "desert_fortune.html",

  "flappy_checkpoint": "flappy_checkpoint.html",
  "flappy_checkpoint.html": "flappy_checkpoint.html",
  "flappy-checkpoint": "flappy_checkpoint.html",
  "flappy": "flappy_checkpoint.html",
  "flappycheakpoint .html": "flappy_checkpoint.html",
  "flappycheakpoint.html": "flappy_checkpoint.html",
  "flappycheakpoint": "flappy_checkpoint.html",

  "ladder_and_snakes": "ladder_and_snakes.html",
  "ladder_and_snakes.html": "ladder_and_snakes.html",
  "ladder-and-snakes": "ladder_and_snakes.html",
  "snakes": "ladder_and_snakes.html",
  "lader and snacks.html": "ladder_and_snakes.html",
  "lader and snacks": "ladder_and_snakes.html",

  "snakes_and_ladders_2": "snakes_and_ladders_2.html",
  "snakes_and_ladders_2.html": "snakes_and_ladders_2.html",
  "snakes-and-ladders-2": "snakes_and_ladders_2.html",
  "ladders_2": "snakes_and_ladders_2.html",
  "ladders_2.html": "snakes_and_ladders_2.html",
  "snack and landers 2 .html": "snakes_and_ladders_2.html",
  "snack and landers 2.html": "snakes_and_ladders_2.html",
  "snack and landers 2": "snakes_and_ladders_2.html",

  "tik_tak_win": "tik_tak_win.html",
  "tik_tak_win.html": "tik_tak_win.html",
  "tik-tak-win": "tik_tak_win.html",
  "tik tak win.html": "tik_tak_win.html",
  "tik tak win": "tik_tak_win.html"
};

// ---------------- BACKEND API ENDPOINTS ---------------- //

// Environment Detection Helper
function getEnvironmentInfo() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;

  return {
    environment: isProduction ? 'production' : 'development',
    platform: isLocal ? 'localhost' : 'cloud_run',
    isLocal,
    isProduction,
    useEmulator,
    emulators: {
      firestore: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
      auth: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099'
    }
  };
}

// Healthcheck
app.get('/api/health', (req, res) => {
  const envInfo = getEnvironmentInfo();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    gamesCount: 11,
    ...envInfo
  });
});

// App / Firebase Configuration (supports environment variables and backend config)
app.get('/api/config', (req, res) => {
  let fileConfig = {};
  try {
    const configPath = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.warn("Notice reading firebase-applet-config.json:", err.message);
  }

  const envInfo = getEnvironmentInfo();

  // Prefer environment variables over static file defaults
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || fileConfig.apiKey || "AIzaSyDUSi0mM3bYMEozFD3Ahh0vUZ5gBG1dNTU",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || fileConfig.authDomain || "flappy77777.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || fileConfig.projectId || "flappy77777",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket || "flappy77777.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId || "393994889085",
    appId: process.env.FIREBASE_APP_ID || fileConfig.appId || "1:393994889085:web:61132fe75fe3df840e4e14",
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || fileConfig.firestoreDatabaseId || "(default)"
  };

  res.json({
    firebaseConfig,
    ...envInfo
  });
});

// List of available games
app.get('/api/games', (req, res) => {
  res.json([
    { id: 'chicken_road', name: 'Chicken Road Russia', file: 'chicken_road.html', alias: '/chicken_road' },
    { id: 'aviator', name: 'Aviator', file: 'aviator.html', alias: '/aviator' },
    { id: 'rocket_mines', name: 'Rocket Mines', file: 'rocket_mines.html', alias: '/rocket_mines' },
    { id: 'neon_spins', name: 'Neon Spins', file: 'neon_spins.html', alias: '/neon_spins' },
    { id: 'desert_axe', name: 'Desert Axe', file: 'desert_axe.html', alias: '/desert_axe' },
    { id: 'desert_fortune', name: 'Desert Fortune', file: 'desert_fortune.html', alias: '/desert_fortune' },
    { id: 'flappy_checkpoint', name: 'Flappy Checkpoint', file: 'flappy_checkpoint.html', alias: '/flappy_checkpoint' },
    { id: 'ladder_and_snakes', name: 'Ladder and Snakes', file: 'ladder_and_snakes.html', alias: '/ladder_and_snakes' },
    { id: 'snakes_and_ladders_2', name: 'Snakes and Ladders 2', file: 'snakes_and_ladders_2.html', alias: '/snakes_and_ladders_2' },
    { id: 'tik_tak_win', name: 'Tik Tak Win', file: 'tik_tak_win.html', alias: '/tik_tak_win' },
    { id: 'glass_roulette', name: 'Glass Roulette', file: 'glass_roulette.html', alias: '/glass_roulette' }
  ]);
});

// Balance state sync endpoint (backend fallback)
const userBalances = new Map();
app.post('/api/balance/sync', (req, res) => {
  const { userId, balance, change, action } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  let currentBal = userBalances.get(userId) || 0;
  if (typeof balance === 'number' && !isNaN(balance)) {
    currentBal = Math.max(0, balance);
  } else if (typeof change === 'number' && !isNaN(change)) {
    currentBal = Math.max(0, currentBal + change);
  }

  userBalances.set(userId, currentBal);
  res.json({ success: true, userId, balance: currentBal, action: action || 'sync' });
});

app.get('/api/balance/:userId', (req, res) => {
  const userId = req.params.userId;
  const balance = userBalances.get(userId) ?? 0;
  res.json({ success: true, userId, balance });
});

// Game Log analytics endpoint
const inMemoryLogs = [];
app.post('/api/logs', (req, res) => {
  const logEntry = {
    ...req.body,
    serverTime: new Date().toISOString(),
    ip: req.ip
  };
  inMemoryLogs.push(logEntry);
  if (inMemoryLogs.length > 500) inMemoryLogs.shift();
  res.json({ success: true, logged: true });
});

// ---------------- FRONTEND ROUTING & STATIC SERVING ---------------- //

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/lobby', (req, res) => {
  res.sendFile(path.join(__dirname, 'lobby.html'));
});

// Middleware to resolve game requests smoothly across all devices & URLs
app.use((req, res, next) => {
  try {
    const rawPath = req.path.substring(1);
    const decodedPath = decodeURIComponent(rawPath);

    // Check alias map
    if (gameAliasMap[decodedPath]) {
      const targetFile = path.join(__dirname, gameAliasMap[decodedPath]);
      if (fs.existsSync(targetFile)) {
        return res.sendFile(targetFile);
      }
    }

    if (gameAliasMap[rawPath]) {
      const targetFile = path.join(__dirname, gameAliasMap[rawPath]);
      if (fs.existsSync(targetFile)) {
        return res.sendFile(targetFile);
      }
    }

    // Direct file check
    const directFile = path.join(__dirname, decodedPath);
    if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
      return res.sendFile(directFile);
    }

    // Direct file check with .html
    if (!decodedPath.endsWith('.html')) {
      const htmlFile = path.join(__dirname, decodedPath + '.html');
      if (fs.existsSync(htmlFile) && fs.statSync(htmlFile).isFile()) {
        return res.sendFile(htmlFile);
      }
    }
  } catch (err) {
    console.warn("Server path resolution warning:", err.message);
  }
  next();
});

app.use(express.static(__dirname));

// Fallback for any unknown route to lobby or index
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;


