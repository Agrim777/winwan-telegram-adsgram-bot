/**
 * Telegram Bot implementation for Winwan (@Winwanbot)
 * Built with Grammy framework.
 */

const { Bot, InlineKeyboard } = require('grammy');
require('dotenv').config();

const token = process.env.BOT_TOKEN || '8787752776:AAFgCorUmaixzJn4Pt4RkQANkqXTsuKK8KI';
const miniappUrl = process.env.MINIAPP_URL || 'https://example.com'; // Replace with deployed TMA URL or ngrok tunnel

const bot = new Bot(token);

// /start Command
bot.command('start', async (ctx) => {
  const user = ctx.from;
  const username = user?.first_name || 'Gamer';
  
  const welcomeText = 
`👋 *Welcome to Winwan, ${username}!* 🚀

Winwan is a next\\-generation **Watch\\-to\\-Earn Telegram Mini App** powered by **Adsgram**\\.

💰 *How to earn:*
1️⃣ Tap *Play & Earn* below to open the Mini App\\.
2️⃣ Watch sponsored Adsgram video ads\\.
3️⃣ Collect coins, level up multipliers, and complete daily quests\\!
4️⃣ Invite your friends to receive 20% lifetime bonus earnings\\!

⚡ *Ready to start racking up rewards?*`;

  // Inline keyboard with WebApp button
  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open Mini App & Earn', miniappUrl)
    .row()
    .url('📢 Official Channel', 'https://t.me/telegram')
    .url('💬 Community Chat', 'https://t.me/telegram');

  await ctx.reply(welcomeText, {
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard,
  });
});

// /earn Command
bot.command('earn', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('🪙 Watch Adsgram Ads', miniappUrl);

  await ctx.reply(
    `🎬 *Watch Adsgram Ads & Earn Coins!*\n\nTap below to launch the Mini App and claim your ad rewards immediately:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  );
});

// /help Command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `ℹ️ *Winwan Bot Commands:*\n\n` +
    `/start - Launch the main menu & open the Mini App\n` +
    `/earn - Direct shortcut to watch Adsgram ads\n` +
    `/help - View this guide and support information\n\n` +
    `🌐 *Adsgram Monetization:*\n` +
    `Adsgram is the leading Telegram ad network for Mini Apps. Earn coins for every full video ad watched!`,
    { parse_mode: 'Markdown' }
  );
});

// Handle Mini App Data Sent back to bot
bot.on('message:web_app_data', async (ctx) => {
  const data = ctx.message.web_app_data.data;
  console.log('Received data from WebApp:', data);
  await ctx.reply(`🎉 Received reward confirmation from Mini App!`);
});

module.exports = { bot };
