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
