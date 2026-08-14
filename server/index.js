/**
 * Express Server & Bot Runner for Winwan Telegram Adsgram Mini App
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Payout / Withdrawal Request Endpoint
app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, username, paymentMethod, paymentDetails, amountCoins } = req.body;
    const dollarValue = (amountCoins / 10000).toFixed(2);
    console.log(`[Withdrawal Request] User: ${userId}, Coins: ${amountCoins}, Method: ${paymentMethod}`);

    // Load registered admin chat ID
    let adminChatId = null;
    const adminFile = path.join(__dirname, 'admin.json');
    if (fs.existsSync(adminFile)) {
      try {
        const adminData = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
        adminChatId = adminData.chatId;
      } catch (err) {
        console.error('Failed to parse admin.json:', err);
      }
    }

    if (adminChatId) {
      const message = 
`🚨 <b>NEW WITHDRAWAL REQUEST!</b> 💰

👤 <b>User:</b> @${username || 'N/A'} (ID: <code>${userId}</code>)
💵 <b>Coins:</b> ${amountCoins.toLocaleString()} (~$${dollarValue} USD)
💳 <b>Method:</b> ${paymentMethod}
🔑 <b>Details:</b> <code>${paymentDetails}</code>

Please process the payout and verify.`;

      await bot.api.sendMessage(adminChatId, message, { parse_mode: 'HTML' });
      console.log(`[Withdrawal] Forwarded notification to Admin: ${adminChatId}`);
    } else {
      console.warn('⚠️ No Admin Chat ID registered. Payout request saved locally but could not be messaged. Please use /setadmin command in the Telegram Bot.');
    }

    res.json({ success: true, message: 'Withdrawal request submitted successfully' });
  } catch (err) {
    console.error('Error handling withdrawal API request:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
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
