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

const dbFile = path.join(__dirname, 'users.json');

function readDb() {
  if (!fs.existsSync(dbFile)) {
    return { users: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (e) {
    return { users: {} };
  }
}

function writeDb(db) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to write users.json:', err);
  }
}

function saveUser(userId, data) {
  const db = readDb();
  if (!db.users[userId]) {
    db.users[userId] = {
      userId: userId,
      username: data.username || '',
      stars: 0,
      joinedAt: new Date().toISOString(),
      notifiedAdmin: false
    };
  }
  if (data.stars !== undefined) {
    db.users[userId].stars = data.stars;
    if (data.stars < 500) {
      db.users[userId].notifiedAdmin = false;
    }
  }
  if (data.username !== undefined) {
    db.users[userId].username = data.username;
  }
  writeDb(db);
  return db.users[userId];
}

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
    const dollarValue = (amountCoins / 500).toFixed(2);
    console.log(`[Withdrawal Request] User: ${userId}, Stars: ${amountCoins}, Method: ${paymentMethod}`);

    // Update in local DB (Reset stars upon payout request)
    saveUser(userId, { username: username, stars: 0 });

    // Load registered admin chat ID
    let adminChatId = 8273572245; // Default fallback ID
    const adminFile = path.join(__dirname, 'admin.json');
    if (fs.existsSync(adminFile)) {
      try {
        const adminData = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
        adminChatId = adminData.chatId || 8273572245;
      } catch (err) {
        console.error('Failed to parse admin.json:', err);
      }
    }

    if (adminChatId) {
      const message = 
`🚨 <b>NEW WITHDRAWAL REQUEST!</b> 💰

👤 <b>User:</b> @${username || 'N/A'} (ID: <code>${userId}</code>)
💵 <b>Stars:</b> ${amountCoins.toLocaleString()} (~$${dollarValue} USD)
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

// Referral Registration Endpoint
app.post('/api/referral', (req, res) => {
  try {
    const { userId, referrerId } = req.body;
    if (!userId || !referrerId || userId == referrerId) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const referralsFile = path.join(__dirname, 'referrals.json');
    let referrals = [];
    if (fs.existsSync(referralsFile)) {
      try {
        referrals = JSON.parse(fs.readFileSync(referralsFile, 'utf8'));
      } catch (e) {
        referrals = [];
      }
    }

    // Check if the referred user has already joined
    const exists = referrals.find(r => r.userId == userId);
    if (!exists) {
      referrals.push({
        userId: userId,
        referrerId: referrerId,
        claimed: false,
        timestamp: Date.now()
      });
      fs.writeFileSync(referralsFile, JSON.stringify(referrals, null, 2));
      console.log(`[Referral Verified] User ${userId} joined via Inviter ${referrerId}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error handling /api/referral:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// User Status Endpoint (Check for unclaimed invite boosts)
app.get('/api/user-status', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId parameter' });
    }

    const referralsFile = path.join(__dirname, 'referrals.json');
    let referrals = [];
    if (fs.existsSync(referralsFile)) {
      try {
        referrals = JSON.parse(fs.readFileSync(referralsFile, 'utf8'));
      } catch (e) {
        referrals = [];
      }
    }

    // Find verified, unclaimed referrals from this inviter
    const unclaimed = referrals.filter(r => r.referrerId == userId && r.claimed === false);
    let pendingBoostMs = 0;
    if (unclaimed.length > 0) {
      pendingBoostMs = unclaimed.length * 60 * 60 * 1000; // 1 hour boost per verified join!
      unclaimed.forEach(r => {
        r.claimed = true;
      });
      fs.writeFileSync(referralsFile, JSON.stringify(referrals, null, 2));
      console.log(`[Referral Boost Claimed] Inviter ${userId} received ${unclaimed.length}-hour turbo boost.`);
    }

    res.json({ success: true, pendingBoostMs: pendingBoostMs });
  } catch (err) {
    console.error('Error handling /api/user-status:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Sync User State & Autopost Admin Notification when target reached
app.post('/api/sync-user', async (req, res) => {
  try {
    const { userId, username, stars } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId parameter' });
    }

    // Save/update user profile in DB
    const userProfile = saveUser(userId, { username, stars });

    // Check if stars threshold completed and notify admin automatically
    if (stars >= 500 && !userProfile.notifiedAdmin) {
      // Mark as notified to avoid duplicate alerts
      const db = readDb();
      if (db.users[userId]) {
        db.users[userId].notifiedAdmin = true;
        writeDb(db);
      }

      // Load registered admin chat ID
      let adminChatId = 8273572245; // Default fallback ID
      const adminFile = path.join(__dirname, 'admin.json');
      if (fs.existsSync(adminFile)) {
        try {
          const adminData = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
          adminChatId = adminData.chatId || 8273572245;
        } catch (err) {}
      }

      if (adminChatId) {
        const message = 
`🚨 <b>THRESHOLD REACHED!</b> 💰

👤 <b>User:</b> @${username || 'N/A'} (ID: <code>${userId}</code>)
⭐ <b>Stars:</b> ${stars.toLocaleString()} / 500 (~$1.00 USD)

This user has reached the cash out threshold!`;
        
        await bot.api.sendMessage(adminChatId, message, { parse_mode: 'HTML' });
        console.log(`[Auto-Notification] Sent threshold notification to Admin ${adminChatId} for user ${userId}`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error handling /api/sync-user:', err);
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
        await bot.api.setChatMenuButton({
          menu_button: {
            type: 'default'
          }
        });
        console.log('✅ Persistent WebApp Menu Button configured to default (defined by BotFather)');

        // Daily Payout Retention Notifications (10s delay on startup, then every 24 hours)
        setTimeout(sendDailyNotifications, 10000);
        setInterval(sendDailyNotifications, 24 * 60 * 60 * 1000);

        async function sendDailyNotifications() {
          console.log('[Daily Notification] Starting daily stars progress loop...');
          try {
            const db = readDb();
            const usersList = Object.values(db.users || {});
            for (const user of usersList) {
              if (!user.userId) continue;
              const starsNeeded = Math.max(0, 500 - (user.stars || 0));
              if (starsNeeded > 0) {
                try {
                  const msg = `⭐ <b>Keep Mining!</b>\n\nYou are just <b>${starsNeeded} Stars</b> away from cashing out your <b>$1.00 USD</b> payout!\n\n👇 Tap below to mine stars now:`;
                  await bot.api.sendMessage(user.userId, msg, {
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: '🎮 Play WINWAN Game', url: 'https://t.me/Winwanbot/Winwan' }]
                      ]
                    }
                  });
                  console.log(`[Daily Notification] Sent progress reminder to user ${user.userId}`);
                } catch (err) {
                  console.warn(`[Daily Notification] Failed to send to user ${user.userId}:`, err.message);
                }
              }
            }
          } catch (e) {
            console.error('[Daily Notification] Error in daily stars loop:', e);
          }
        }
      } catch (err) {
        console.error('Failed to set Chat Menu Button / daily loop setup:', err);
      }
    }
  }).catch((err) => {
    console.error('Error starting Telegram Bot:', err);
  });
} else {
  console.warn('⚠️ BOT_TOKEN is not defined. Bot was not started.');
}
