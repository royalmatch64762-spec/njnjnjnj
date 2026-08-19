# PK96 Gaming Platform & Lobby

A complete, mobile-optimized casino lobby and provably fair crash/arcade gaming suite with real-time balance synchronization, Firebase Firestore persistence, and multi-game iframe support.

## Deploying to Vercel via GitHub

This project is configured to work out-of-the-box when pushed to GitHub and deployed to Vercel.

### Option 1: Automatic GitHub -> Vercel Deployment (Recommended)
1. Push this repository to your **GitHub** account.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your GitHub repository.
4. Keep the default settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: Leave empty
5. Click **Deploy**.

Vercel will automatically read `vercel.json` and serve all static games, assets, rewrite rules, and iframe communication headers.

### Option 2: Running Locally or with Node.js
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build / synchronize game aliases:
   ```bash
   npm run build
   ```
3. Start the dev server:
   ```bash
   npm start
   # or
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.
