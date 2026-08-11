# 🚀 Winwan — Telegram Mini App & Bot with Adsgram Monetization

[![Telegram Bot](https://img.shields.io/badge/Telegram-@Winwanbot-blue?style=for-the-badge&logo=telegram)](https://t.me/Winwanbot)
[![Adsgram Powered](https://img.shields.io/badge/Monetization-Adsgram.ai-yellow?style=for-the-badge)](https://adsgram.ai)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)

**Winwan** is a complete, production-ready **Telegram Mini App (TMA)** and **Telegram Bot** featuring seamless **Adsgram** ad network monetization, rewarded video and interstitial ads, and a gamified **Watch-to-Earn** reward ecosystem.

---

## ✨ Features

- 🎮 **Telegram Mini App (TMA)**:
  - Cyber-dark modern UI with Telegram theme sync and glassmorphism.
  - Native Telegram WebApp SDK support (`telegram-web-app.js`) with haptic feedback, theme color matching, and viewport expansion.
  - User authentication and profile display via `Telegram.WebApp.initDataUnsafe`.
- 📺 **Adsgram Ad Integration**:
  - **Rewarded Video Ads**: Users watch short sponsored video clips to earn coins and XP.
  - **Interstitial Ads**: Quick transition ad breaks for supplemental revenue.
  - **Banner Ads**: Header/footer banner slots.
  - **Interactive Ad Simulator**: Built-in simulator for local desktop browser testing without needing mobile Telegram containers.
  - **Live Configuration Console**: Switch Adsgram Block IDs and view raw event streams in real time.
- 🪙 **Gamified Watch-to-Earn Ecosystem**:
  - **Energy System**: Natural rate limiting with passive energy refills.
  - **Daily Streaks & Check-in Bonuses**: Boosts user retention.
  - **Daily Quests**: Milestone goals (e.g. Watch 3 Ads, Unlock Multipliers).
  - **Upgrades & Multipliers**: Spend coins to increase earnings per ad.
  - **Telegram Referral Engine**: Instant viral invite links (`t.me/Winwanbot?start=ref_USERID`) with 20% bonus sharing.
- 🤖 **Telegram Bot**:
  - Built with `grammy` framework.
  - `/start`, `/earn`, and `/help` commands.
  - One-tap WebApp Launch Button.

---

## 🏗️ Architecture

```
telegram-adsgram-miniapp/
├── public/
│   ├── index.html          # Main Mini App UI
│   ├── style.css           # Modern Cyber Glass styling & animations
│   ├── adsgram-service.js  # Adsgram SDK wrapper & fallback simulator
│   └── app.js              # Gamification engine, state management & Telegram SDK
├── server/
│   ├── bot.js              # Grammy Telegram bot handlers
│   └── index.js            # Express static server & optional S2S callback
├── .env.example            # Environment template
├── package.json            # Node.js dependencies
└── README.md               # Documentation
```

---

## 🛠️ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
BOT_TOKEN=8787752776:AAFgCorUmaixzJn4Pt4RkQANkqXTsuKK8KI
ADSGRAM_BLOCK_ID=2924
MINIAPP_URL=https://your-public-url.com
PORT=3000
```

### 3. Run Locally
```bash
npm start
```
Open your browser at `http://localhost:3000` to test the Mini App and the interactive Adsgram simulator!

---

## 📲 How to Connect with BotFather

1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newapp` or `/myapps` -> Select your bot `@Winwanbot`.
3. Set your **Mini App Name** and upload an icon/image.
4. Set the **Web App URL** to your hosted Mini App domain (e.g. `https://your-app.vercel.app` or your Cloudflare/Ngrok URL).
5. Send `/setmenubutton` -> Choose your bot -> Enter the Mini App URL to place a permanent "Play / Earn" button in the bottom-left chat menu.

---

## 💰 Setting up Adsgram Monetization

1. Create an account on [Adsgram.ai](https://adsgram.ai).
2. Go to **Publishers** -> **Add Placement** / **Create Block**.
3. Select format: **Rewarded Video** (or Interstitial).
4. Copy your **Block ID** (e.g., `int-XXXX` or numeric ID).
5. Add it to your `.env` or open the in-app **Settings (⚙️)** modal and paste your new Block ID!

---

## 🚀 Free Deployment Options

### Deploy Frontend / Mini App on Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Use the generated `https://*.vercel.app` URL as your `MINIAPP_URL`.

### Deploy Bot & Server on Render / Railway
1. Push this repository to your GitHub account.
2. Connect the repository to [Render.com](https://render.com) or [Railway.app](https://railway.app).
3. Set the start command to `node server/index.js`.
4. Add `BOT_TOKEN` in the environment variables dashboard.

---

## 📄 License
MIT License © 2026 Agrim777.
