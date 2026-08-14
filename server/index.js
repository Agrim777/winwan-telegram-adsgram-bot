/**
 * Express Server & Bot Runner for Winwan Telegram Adsgram Mini App
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { bot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static TMA frontend
app.use(express.static(path.join(__dirname, '../public')));

// Optional Adsgram Server-to-Server (S2S) Callback Endpoint for verified reward postbacks
app.post('/api/adsgram-reward-callback', (req, res) => {
  const { userId, blockId, rewardStatus, signature } = req.body;
  console.log(`[Adsgram S2S Callback] User: ${userId}, Block: ${blockId}, Status: ${rewardStatus}`);
  
  // Respond with HTTP 200 OK to Adsgram
  res.status(200).json({ success: true, message: 'Reward acknowledged' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'Winwanbot', service: 'Telegram Mini App' });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Winwan Mini App server running at http://localhost:${PORT}`);
});

// Start Grammy Bot (long polling)
if (process.env.BOT_TOKEN) {
  bot.start({
    onStart: async (botInfo) => {
      console.log(`🤖 Telegram Bot @${botInfo.username} started successfully!`);
      try {
        const miniappUrl = process.env.MINIAPP_URL || 'https://agrim777.github.io/winwan-telegram-adsgram-bot/';
        await bot.api.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: 'Play WINWAN',
            web_app: { url: miniappUrl }
          }
        });
        console.log(`✅ Persistent WebApp Menu Button configured programmatically to: ${miniappUrl}`);
      } catch (err) {
        console.error('Failed to set Chat Menu Button:', err);
      }
    }
  }).catch((err) => {
    console.error('Error starting Telegram Bot:', err);
  });
} else {
  console.warn('⚠️ BOT_TOKEN is not defined. Bot was not started.');
}
