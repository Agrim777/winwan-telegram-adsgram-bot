/**
 * Telegram Bot implementation for WINWAN (@Winwanbot)
 * Built with Grammy framework with safe HTML parsing and error handling.
 */

const { Bot, InlineKeyboard } = require('grammy');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const token = process.env.BOT_TOKEN || '8787752776:AAFgCorUmaixzJn4Pt4RkQANkqXTsuKK8KI';
const miniappUrl = process.env.MINIAPP_URL || 'https://agrim777.github.io/winwan-telegram-adsgram-bot/';

const bot = new Bot(token);

// Safe HTML Escape Helper
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// /start Command
bot.command('start', async (ctx) => {
  try {
    const user = ctx.from;
    const name = escapeHtml(user?.first_name || 'Miner');

    const welcomeHtml = 
`🎮 <b>Welcome to WINWAN Cyber Miner, ${name}!</b> ⚡

Mine cyber coins, spin the lucky wheel daily, and upgrade your rig to become the top Cyber Lord!

💎 <b>Game Highlights:</b>
• <b>3D Tap-to-Mine</b>: Tap the core to extract coins
• <b>🎰 Lucky Wheel</b>: Daily free spins for jackpots
• <b>⚡ Rig Upgrades</b>: Boost your tap yield & energy pool
• <b>👥 Squads</b>: Earn 20% commission from your friends

👇 <i>Tap below to launch the game:</i>`;

    const keyboard = new InlineKeyboard()
      .url('🎮 Play WINWAN Game', 'https://t.me/Winwanbot/Winwan')
      .row()
      .url('🎰 Daily Lucky Wheel', 'https://t.me/Winwanbot/Winwan');

    await ctx.reply(welcomeHtml, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error('Error handling /start command:', err);
    await ctx.reply('🎮 Welcome to WINWAN! Tap below to play.', {
      reply_markup: new InlineKeyboard().url('🎮 Play Game', 'https://t.me/Winwanbot/Winwan')
    });
  }
});

// /spin Command
bot.command('spin', async (ctx) => {
  try {
    const keyboard = new InlineKeyboard()
      .url('🎰 Spin the Lucky Wheel', 'https://t.me/Winwanbot/Winwan');

    await ctx.reply(
      `🎰 <b>Daily Lucky Wheel is Ready!</b>\n\nSpin the wheel to win instant coin jackpots and 2x Turbo mining boosters:`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error('Error handling /spin command:', err);
  }
});

// /help Command
bot.command('help', async (ctx) => {
  try {
    const helpHtml = 
`ℹ️ <b>WINWAN Game Guide:</b>

/start - Open the main menu & launch the game
/spin - Direct link to the Daily Lucky Wheel
/help - View this guide

🎮 <b>How to Play:</b>
Tap the Cyber Core in the game to mine coins. Upgrade your energy cell and multitap to increase your earnings!`;

    const keyboard = new InlineKeyboard()
      .url('🎮 Launch Game', 'https://t.me/Winwanbot/Winwan');

    await ctx.reply(helpHtml, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch (err) {
    console.error('Error handling /help command:', err);
  }
});

// /setadmin Command
bot.command('setadmin', async (ctx) => {
  try {
    const adminFile = path.join(__dirname, 'admin.json');
    fs.writeFileSync(adminFile, JSON.stringify({ chatId: ctx.from.id }, null, 2));
    await ctx.reply(`✅ <b>Admin Chat ID Registered Successfully!</b>\n\nAll future user withdrawal and payout requests will be forwarded directly to this chat window.`, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error in /setadmin command:', err);
    await ctx.reply('❌ Failed to register Admin Chat ID.');
  }
});

// Admin verification helper
const ADMIN_ID = 8273572245;

function isSenderAdmin(senderId) {
  if (senderId == ADMIN_ID) return true;
  try {
    const adminFile = path.join(__dirname, 'admin.json');
    if (fs.existsSync(adminFile)) {
      const adminData = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
      return adminData.chatId == senderId;
    }
  } catch (e) {}
  return false;
}

// /users command (Lists all users & star balances)
bot.command('users', async (ctx) => {
  const senderId = ctx.from?.id;
  if (!isSenderAdmin(senderId)) {
    return ctx.reply('⚠️ You do not have permissions to access this command.');
  }

  try {
    const dbFile = path.join(__dirname, 'users.json');
    if (!fs.existsSync(dbFile)) {
      return ctx.reply('📂 No registered users found in the database yet.');
    }

    const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    const usersList = Object.values(db.users || {});
    if (usersList.length === 0) {
      return ctx.reply('📂 No registered users found in the database yet.');
    }

    let response = `👤 <b>WINWAN Registered Users (${usersList.length}):</b>\n\n`;
    usersList.forEach((user, index) => {
      const username = user.username ? `@${escapeHtml(user.username)}` : 'N/A';
      const joined = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A';
      response += `${index + 1}. <b>${username}</b> (ID: <code>${user.userId}</code>)\n`;
      response += `   ⭐ Stars: <b>${user.stars || 0}</b> | Joined: ${joined}\n\n`;
    });

    if (response.length > 4000) {
      const chunks = response.match(/[\s\S]{1,4000}/g);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'HTML' });
      }
    } else {
      await ctx.reply(response, { parse_mode: 'HTML' });
    }
  } catch (err) {
    console.error('Error handling /users command:', err);
    await ctx.reply('❌ Failed to fetch user statistics.');
  }
});

// /admin dashboard command
bot.command('admin', async (ctx) => {
  const senderId = ctx.from?.id;
  if (!isSenderAdmin(senderId)) {
    return ctx.reply('⚠️ You do not have permissions to access this command.');
  }

  try {
    const dbFile = path.join(__dirname, 'users.json');
    const referralsFile = path.join(__dirname, 'referrals.json');
    
    let totalUsers = 0;
    let totalStars = 0;
    
    if (fs.existsSync(dbFile)) {
      const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      const list = Object.values(db.users || {});
      totalUsers = list.length;
      totalStars = list.reduce((acc, user) => acc + (user.stars || 0), 0);
    }

    let totalReferrals = 0;
    if (fs.existsSync(referralsFile)) {
      try {
        const refs = JSON.parse(fs.readFileSync(referralsFile, 'utf8'));
        totalReferrals = refs.length;
      } catch (e) {}
    }

    const adminMsg = 
`👑 <b>WINWAN ADMIN DASHBOARD</b> 📊

📈 <b>Total Players:</b> ${totalUsers.toLocaleString()}
⭐ <b>Total Mined Stars:</b> ${totalStars.toLocaleString()}
👥 <b>Total Referral Joins:</b> ${totalReferrals.toLocaleString()}

🛠️ <b>Available Commands:</b>
• /users - List all users & balances
• /setstars &lt;userId&gt; &lt;amount&gt; - Set user star balance
• /stats - Quick summary status`;

    await ctx.reply(adminMsg, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error handling /admin command:', err);
    await ctx.reply('❌ Failed to load admin dashboard.');
  }
});

// /stats command
bot.command('stats', async (ctx) => {
  const senderId = ctx.from?.id;
  if (!isSenderAdmin(senderId)) return;

  try {
    const dbFile = path.join(__dirname, 'users.json');
    let totalUsers = 0;
    let totalStars = 0;
    if (fs.existsSync(dbFile)) {
      const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      const list = Object.values(db.users || {});
      totalUsers = list.length;
      totalStars = list.reduce((acc, u) => acc + (u.stars || 0), 0);
    }
    await ctx.reply(`📊 <b>Stats Quick View:</b>\n\nPlayers: <b>${totalUsers}</b>\nStars: <b>${totalStars}</b>`, { parse_mode: 'HTML' });
  } catch (e) {
    await ctx.reply('❌ Failed to load stats.');
  }
});

// /setstars command
bot.command('setstars', async (ctx) => {
  const senderId = ctx.from?.id;
  if (!isSenderAdmin(senderId)) {
    return ctx.reply('⚠️ You do not have permissions to access this command.');
  }

  const args = ctx.match?.trim().split(/\s+/);
  if (!args || args.length < 2) {
    return ctx.reply('ℹ️ <b>Usage:</b> <code>/setstars &lt;userId&gt; &lt;amount&gt;</code>', { parse_mode: 'HTML' });
  }

  const targetUserId = args[0];
  const starAmount = parseInt(args[1], 10);

  if (isNaN(starAmount) || starAmount < 0) {
    return ctx.reply('❌ Please enter a valid star amount.');
  }

  try {
    const dbFile = path.join(__dirname, 'users.json');
    if (!fs.existsSync(dbFile)) {
      return ctx.reply('❌ Users database not initialized.');
    }

    const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    if (!db.users[targetUserId]) {
      return ctx.reply(`❌ User with ID <code>${targetUserId}</code> not found in database.`, { parse_mode: 'HTML' });
    }

    db.users[targetUserId].stars = starAmount;
    if (starAmount < 500) {
      db.users[targetUserId].notifiedAdmin = false;
    }
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

    await ctx.reply(`✅ Successfully updated balance for user ID <code>${targetUserId}</code> to <b>${starAmount} Stars</b>!`, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error handling /setstars:', err);
    await ctx.reply('❌ Failed to update stars balance.');
  }
});

// Any other message fallback
bot.on('message:text', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url('🎮 Play WINWAN Game', 'https://t.me/Winwanbot/Winwan');

  await ctx.reply(`👋 Hi! Tap below to launch WINWAN Cyber Miner:`, {
    reply_markup: keyboard
  });
});

// Global error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx?.update?.update_id}:`, err.error);
});

module.exports = { bot };
