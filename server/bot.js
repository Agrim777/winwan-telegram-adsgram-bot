/**
 * Telegram Bot implementation for Winwan (@Winwanbot)
 * Built with Grammy framework with safe HTML parsing and error handling.
 */

const { Bot, InlineKeyboard } = require('grammy');
require('dotenv').config();

const token = process.env.BOT_TOKEN || '8787752776:AAFgCorUmaixzJn4Pt4RkQANkqXTsuKK8KI';
const miniappUrl = process.env.MINIAPP_URL || 'https://winwan-telegram-adsgram-bot.vercel.app';

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
    const name = escapeHtml(user?.first_name || 'Player');

    const welcomeHtml = 
`👋 <b>Welcome to Winwan, ${name}!</b> 🚀

Winwan is a next-generation <b>Watch-to-Earn Telegram Mini App</b> powered by <b>Adsgram</b>.

💰 <b>How to earn:</b>
1️⃣ Tap <b>🚀 Open Mini App &amp; Earn</b> below.
2️⃣ Watch short sponsored Adsgram video ads.
3️⃣ Collect coins, upgrade multipliers &amp; complete daily quests!
4️⃣ Invite friends to receive 20% bonus coins!

⚡ <i>Ready to start earning rewards?</i>`;

    const keyboard = new InlineKeyboard()
      .webApp('🚀 Open Mini App & Earn', miniappUrl)
      .row()
      .url('📢 Adsgram Network', 'https://adsgram.ai')
      .url('💬 Community', 'https://t.me/telegram');

    await ctx.reply(welcomeHtml, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error('Error handling /start command:', err);
    await ctx.reply('👋 Welcome to Winwan! Tap the button below to start earning.', {
      reply_markup: new InlineKeyboard().webApp('🚀 Open Mini App', miniappUrl)
    });
  }
});

// /earn Command
bot.command('earn', async (ctx) => {
  try {
    const keyboard = new InlineKeyboard()
      .webApp('🪙 Watch Adsgram Ads', miniappUrl);

    await ctx.reply(
      `🎬 <b>Watch Adsgram Ads &amp; Earn Coins!</b>\n\nTap below to launch the Mini App and claim your ad rewards immediately:`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error('Error handling /earn command:', err);
  }
});

// /help Command
bot.command('help', async (ctx) => {
  try {
    const helpHtml = 
`ℹ️ <b>Winwan Bot Commands:</b>

/start - Open the main menu & launch the Mini App
/earn - Direct shortcut to watch Adsgram ads
/help - View this guide and support information

🌐 <b>Adsgram Monetization:</b>
Adsgram is the leading Telegram ad network for Mini Apps. Earn coins for every full video ad watched!`;

    await ctx.reply(helpHtml, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error handling /help command:', err);
  }
});

// Any other message fallback
bot.on('message:text', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open Winwan Mini App', miniappUrl);

  await ctx.reply(`👋 Hi there! Tap below to open the Winwan Mini App and start earning:`, {
    reply_markup: keyboard
  });
});

// Global error handler
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx?.update?.update_id}:`, err.error);
});

module.exports = { bot };
