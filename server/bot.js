/**
 * Telegram Bot implementation for WINWAN (@Winwanbot)
 * Built with Grammy framework with safe HTML parsing and error handling.
 */

const { Bot, InlineKeyboard } = require('grammy');
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
      .webApp('🎮 Play WINWAN Game', miniappUrl)
      .row()
      .webApp('🎰 Daily Lucky Wheel', miniappUrl);

    await ctx.reply(welcomeHtml, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error('Error handling /start command:', err);
    await ctx.reply('🎮 Welcome to WINWAN! Tap below to play.', {
      reply_markup: new InlineKeyboard().webApp('🎮 Play Game', miniappUrl)
    });
  }
});

// /spin Command
bot.command('spin', async (ctx) => {
  try {
    const keyboard = new InlineKeyboard()
      .webApp('🎰 Spin the Lucky Wheel', miniappUrl);

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
      .webApp('🎮 Launch Game', miniappUrl);

    await ctx.reply(helpHtml, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch (err) {
    console.error('Error handling /help command:', err);
  }
});

// Any other message fallback
bot.on('message:text', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('🎮 Play WINWAN Game', miniappUrl);

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
