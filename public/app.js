/**
 * Winwan - Main Application Logic & Gamification Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp Instance
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#0b0f19');
      tg.setBackgroundColor('#0b0f19');
    } catch (e) {
      console.warn('Telegram color setting failed:', e);
    }
  }

  // --- APPLICATION STATE ---
  const defaultState = {
    coins: 250,
    xp: 0,
    level: 1,
    multiplier: 1.0,
    energy: 10,
    maxEnergy: 10,
    adsWatched: 0,
    streak: 1,
    lastDailyBonusClaim: null,
    lastAdWatchTime: null,
    invitedFriends: 0,
    referralEarnings: 0,
    quests: [
      { id: 'q1', title: 'Watch 3 Ads', desc: 'Watch 3 rewarded video ads', reward: 300, target: 3, progress: 0, claimed: false, icon: 'fa-film' },
      { id: 'q2', title: 'Power-Up Rookie', desc: 'Purchase any 1 multiplier upgrade', reward: 200, target: 1, progress: 0, claimed: false, icon: 'fa-bolt' },
      { id: 'q3', title: 'Daily Devotee', desc: 'Claim your daily check-in bonus', reward: 150, target: 1, progress: 0, claimed: false, icon: 'fa-gift' },
      { id: 'q4', title: 'Watch Marathon', desc: 'Watch 10 rewarded ads in total', reward: 1000, target: 10, progress: 0, claimed: false, icon: 'fa-trophy' }
    ],
    upgrades: [
      { id: 'u1', name: '2x Ad Multiplier', desc: 'Double all coin earnings from ads', cost: 500, multiplierAdd: 1.0, owned: false, icon: 'fa-coins' },
      { id: 'u2', name: 'Speed Recharge', desc: 'Refill energy 2x faster', cost: 1000, multiplierAdd: 0.5, owned: false, icon: 'fa-battery-charging' },
      { id: 'u3', name: 'Golden Sponsor', desc: 'Receive +500 base coins per ad', cost: 2500, multiplierAdd: 2.0, owned: false, icon: 'fa-crown' }
    ]
  };

  let state = JSON.parse(localStorage.getItem('winwan_app_state')) || defaultState;

  // Save State Helper
  function saveState() {
    localStorage.setItem('winwan_app_state', JSON.stringify(state));
  }

  // Trigger Telegram Haptic
  function triggerHaptic(type = 'light') {
    const hapticsEnabled = document.getElementById('toggleHaptics')?.checked ?? true;
    if (!hapticsEnabled || !tg?.HapticFeedback) return;

    try {
      if (type === 'success') {
        tg.HapticFeedback.notificationOccurred('success');
      } else if (type === 'warning') {
        tg.HapticFeedback.notificationOccurred('warning');
      } else if (type === 'medium') {
        tg.HapticFeedback.impactOccurred('medium');
      } else {
        tg.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {
      console.warn('Haptic trigger error:', e);
    }
  }

  // --- UI ELEMENTS ---
  const elUserName = document.getElementById('userName');
  const elUserAvatar = document.getElementById('userAvatar');
  const elUserLevelBadge = document.getElementById('userLevelBadge');
  const elCoinBalance = document.getElementById('coinBalance');
  const elStatAdsWatched = document.getElementById('statAdsWatched');
  const elStatMultiplier = document.getElementById('statMultiplier');
  const elStatStreak = document.getElementById('statStreak');
  const elEnergyText = document.getElementById('energyText');
  const elEnergyBarFill = document.getElementById('energyBarFill');
  const elBtnWatchRewarded = document.getElementById('btnWatchRewarded');
  const elBtnShowInterstitial = document.getElementById('btnShowInterstitial');
  const elBtnDailyBonus = document.getElementById('btnDailyBonus');
  const elDailyBonusStatus = document.getElementById('dailyBonusStatus');
  const elQuestsContainer = document.getElementById('questsContainer');
  const elUpgradesContainer = document.getElementById('upgradesContainer');
  const elRefLinkInput = document.getElementById('refLinkInput');
  const elBtnCopyRef = document.getElementById('btnCopyRef');
  const elBtnShareTelegram = document.getElementById('btnShareTelegram');
  const elStatFriendsCount = document.getElementById('statFriendsCount');
  const elStatReferralBonus = document.getElementById('statReferralBonus');
  
  // Modals & Settings
  const elSettingsModal = document.getElementById('settingsModal');
  const elBtnSettings = document.getElementById('btnSettings');
  const elBtnCloseSettings = document.getElementById('btnCloseSettings');
  const elInputBlockId = document.getElementById('inputBlockId');
  const elSelectAdMode = document.getElementById('selectAdMode');
  const elBtnSaveSettings = document.getElementById('btnSaveSettings');
  const elBtnResetData = document.getElementById('btnResetData');
  const elDebugLog = document.getElementById('debugLog');
  const elRewardModal = document.getElementById('rewardModal');
  const elRewardPopupCoins = document.getElementById('rewardPopupCoins');
  const elRewardPopupDesc = document.getElementById('rewardPopupDesc');
  const elBtnCollectReward = document.getElementById('btnCollectReward');

  // --- INITIALIZE TELEGRAM USER INFO ---
  const user = tg?.initDataUnsafe?.user;
  const botUsername = 'Winwanbot';
  const userId = user?.id || 'demo_user_' + Math.floor(Math.random() * 10000);
  
  if (user) {
    elUserName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    if (user.photo_url) {
      elUserAvatar.src = user.photo_url;
    } else {
      elUserAvatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.first_name}`;
    }
  }

  // Referral & Direct App Link Setup
  const inviteUrl = `https://t.me/Winwanbot/Winwan?startapp=ref_${userId}`;
  elRefLinkInput.value = inviteUrl;

  // --- LOGGING SETUP ---
  function addDebugLog(msg, type = 'system') {
    if (!elDebugLog) return;
    const item = document.createElement('div');
    item.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    item.textContent = `[${time}] ${msg}`;
    elDebugLog.appendChild(item);
    elDebugLog.scrollTop = elDebugLog.scrollHeight;
  }

  window.adsgramService.setLogger((msg, type) => addDebugLog(msg, type));
  window.adsgramService.init();

  // Load Settings into Inputs
  elInputBlockId.value = window.adsgramService.blockId;
  elSelectAdMode.value = window.adsgramService.mode;

  // --- RENDER APP STATE ---
  function updateUI() {
    // Balance & Stats
    elCoinBalance.textContent = state.coins.toLocaleString();
    elStatAdsWatched.textContent = state.adsWatched;
    elStatMultiplier.textContent = state.multiplier.toFixed(1) + 'x';
    elStatStreak.textContent = `${state.streak} ${state.streak === 1 ? 'Day' : 'Days'}`;
    elUserLevelBadge.textContent = `Lv.${state.level}`;

    // Energy
    elEnergyText.textContent = `${state.energy}/${state.maxEnergy} Energy`;
    const energyPct = (state.energy / state.maxEnergy) * 100;
    elEnergyBarFill.style.width = `${energyPct}%`;

    // Watch Ad Button State
    if (state.energy <= 0) {
      elBtnWatchRewarded.disabled = true;
      elBtnWatchRewarded.querySelector('.btn-text').textContent = 'Out of Energy (Refilling...)';
    } else {
      elBtnWatchRewarded.disabled = false;
      elBtnWatchRewarded.querySelector('.btn-text').textContent = 'Watch Rewarded Ad';
    }

    // Daily Bonus State
    const today = new Date().toDateString();
    if (state.lastDailyBonusClaim === today) {
      elDailyBonusStatus.textContent = 'Claimed for today ✓';
      document.getElementById('dailyBonusIcon').className = 'fa-solid fa-check-circle action-arrow ready';
    } else {
      elDailyBonusStatus.textContent = 'Claim +250 free coins now!';
      document.getElementById('dailyBonusIcon').className = 'fa-solid fa-gift action-arrow';
    }

    // Friends Tab
    elStatFriendsCount.textContent = state.invitedFriends;
    elStatReferralBonus.textContent = state.referralEarnings.toLocaleString();

    renderQuests();
    renderUpgrades();
    saveState();
  }

  // --- RENDER QUESTS ---
  function renderQuests() {
    elQuestsContainer.innerHTML = '';
    state.quests.forEach(q => {
      const card = document.createElement('div');
      card.className = 'list-item-card';
      const isComplete = q.progress >= q.target;
      const pct = Math.min(100, Math.round((q.progress / q.target) * 100));

      card.innerHTML = `
        <div class="item-left">
          <div class="item-icon-box"><i class="fa-solid ${q.icon}"></i></div>
          <div class="item-info">
            <h4>${q.title}</h4>
            <p>${q.desc} (+${q.reward} coins)</p>
            <div class="item-progress-bar">
              <div class="item-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
        <button class="btn-claim" ${q.claimed ? 'disabled' : (isComplete ? '' : 'disabled')} data-quest-id="${q.id}">
          ${q.claimed ? 'Claimed' : (isComplete ? 'Claim' : `${q.progress}/${q.target}`)}
        </button>
      `;

      const btnClaim = card.querySelector('.btn-claim');
      if (isComplete && !q.claimed) {
        btnClaim.onclick = () => claimQuest(q.id);
      }
      elQuestsContainer.appendChild(card);
    });
  }

  function claimQuest(questId) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.claimed || quest.progress < quest.target) return;

    quest.claimed = true;
    state.coins += quest.reward;
    triggerHaptic('success');
    showRewardModal(quest.reward, `Quest Completed: ${quest.title}`);
    updateUI();
  }

  // --- RENDER UPGRADES ---
  function renderUpgrades() {
    elUpgradesContainer.innerHTML = '';
    state.upgrades.forEach(u => {
      const card = document.createElement('div');
      card.className = 'list-item-card';
      const canAfford = state.coins >= u.cost;

      card.innerHTML = `
        <div class="item-left">
          <div class="item-icon-box"><i class="fa-solid ${u.icon}"></i></div>
          <div class="item-info">
            <h4>${u.name}</h4>
            <p>${u.desc}</p>
          </div>
        </div>
        <button class="btn-buy" ${u.owned ? 'disabled' : (canAfford ? '' : 'disabled')} data-upgrade-id="${u.id}">
          ${u.owned ? 'Active ✓' : `${u.cost.toLocaleString()} Coins`}
        </button>
      `;

      const btnBuy = card.querySelector('.btn-buy');
      if (!u.owned && canAfford) {
        btnBuy.onclick = () => buyUpgrade(u.id);
      }
      elUpgradesContainer.appendChild(card);
    });
  }

  function buyUpgrade(upgradeId) {
    const upg = state.upgrades.find(u => u.id === upgradeId);
    if (!upg || upg.owned || state.coins < upg.cost) return;

    state.coins -= upg.cost;
    upg.owned = true;
    state.multiplier += upg.multiplierAdd;

    // Advance quest progress
    const q2 = state.quests.find(q => q.id === 'q2');
    if (q2) q2.progress = Math.min(q2.target, q2.progress + 1);

    triggerHaptic('success');
    showRewardModal(0, `Upgrade Unlocked: ${upg.name}! Multiplier is now ${state.multiplier.toFixed(1)}x`);
    updateUI();
  }

  // --- REWARD CELEBRATION MODAL ---
  function showRewardModal(coins, desc) {
    elRewardPopupCoins.textContent = coins > 0 ? `+${coins} Coins` : 'Unlocked!';
    elRewardPopupDesc.textContent = desc;
    elRewardModal.classList.remove('hidden');
  }

  elBtnCollectReward.onclick = () => {
    triggerHaptic('light');
    elRewardModal.classList.add('hidden');
  };

  // --- ADSGRAM REWARDED AD HANDLER ---
  elBtnWatchRewarded.onclick = async () => {
    if (state.energy <= 0) {
      triggerHaptic('warning');
      alert("You're out of energy! Energy refills automatically every minute.");
      return;
    }

    triggerHaptic('medium');
    elBtnWatchRewarded.disabled = true;
    elBtnWatchRewarded.querySelector('.btn-text').textContent = 'Loading Ad...';

    const success = await window.adsgramService.showRewardedVideo();

    if (success) {
      const baseReward = 100;
      const earnedCoins = Math.round(baseReward * state.multiplier);
      const earnedXP = 25;

      state.coins += earnedCoins;
      state.xp += earnedXP;
      state.adsWatched += 1;
      state.energy = Math.max(0, state.energy - 1);
      state.lastAdWatchTime = Date.now();

      // Check level up
      const nextLevelThreshold = state.level * 100;
      if (state.xp >= nextLevelThreshold) {
        state.level += 1;
        state.multiplier += 0.2;
        addDebugLog(`Player leveled up to Lv.${state.level}!`, 'reward');
      }

      // Progress quests
      const q1 = state.quests.find(q => q.id === 'q1');
      if (q1) q1.progress = Math.min(q1.target, q1.progress + 1);

      const q4 = state.quests.find(q => q.id === 'q4');
      if (q4) q4.progress = Math.min(q4.target, state.adsWatched);

      triggerHaptic('success');
      showRewardModal(earnedCoins, `Watched Adsgram Rewarded Ad (+${earnedXP} XP)`);
    } else {
      triggerHaptic('warning');
    }

    updateUI();
  };

  // --- INTERSTITIAL AD HANDLER ---
  elBtnShowInterstitial.onclick = async () => {
    triggerHaptic('light');
    const success = await window.adsgramService.showInterstitial();
    if (success) {
      const reward = 30;
      state.coins += reward;
      triggerHaptic('success');
      showRewardModal(reward, 'Watched Quick Ad Break!');
      updateUI();
    }
  };

  // --- DAILY BONUS HANDLER ---
  elBtnDailyBonus.onclick = () => {
    const today = new Date().toDateString();
    if (state.lastDailyBonusClaim === today) {
      triggerHaptic('warning');
      alert('You have already claimed your daily check-in bonus today!');
      return;
    }

    state.lastDailyBonusClaim = today;
    state.coins += 250;
    state.streak += 1;

    const q3 = state.quests.find(q => q.id === 'q3');
    if (q3) q3.progress = 1;

    triggerHaptic('success');
    showRewardModal(250, `Daily Bonus Claimed! Streak: ${state.streak} Days`);
    updateUI();
  };

  // --- TAB NAVIGATION ---
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      triggerHaptic('light');
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(targetTab)?.classList.add('active');
    });
  });

  // --- INVITE & REFERRALS ---
  elBtnCopyRef.onclick = () => {
    navigator.clipboard.writeText(elRefLinkInput.value);
    triggerHaptic('light');
    alert('Invite link copied to clipboard!');
  };

  elBtnShareTelegram.onclick = () => {
    triggerHaptic('light');
    const shareText = encodeURIComponent("🚀 Join Winwan Telegram Mini App! Watch short Adsgram ads and earn real rewards!");
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(elRefLinkInput.value)}&text=${shareText}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  // --- SETTINGS & CONFIGURATION MODAL ---
  elBtnSettings.onclick = () => {
    triggerHaptic('light');
    elSettingsModal.classList.remove('hidden');
  };

  elBtnCloseSettings.onclick = () => {
    triggerHaptic('light');
    elSettingsModal.classList.add('hidden');
  };

  elBtnSaveSettings.onclick = () => {
    const newBlockId = elInputBlockId.value.trim() || '2924';
    const newMode = elSelectAdMode.value;

    window.adsgramService.mode = newMode;
    localStorage.setItem('winwan_ads_mode', newMode);
    window.adsgramService.init(newBlockId);

    triggerHaptic('success');
    alert('Adsgram settings saved and applied!');
    elSettingsModal.classList.add('hidden');
  };

  elBtnResetData.onclick = () => {
    if (confirm('Reset all coins, upgrades and quests back to defaults?')) {
      localStorage.removeItem('winwan_app_state');
      state = JSON.parse(JSON.stringify(defaultState));
      updateUI();
      triggerHaptic('warning');
      alert('Demo data has been reset.');
      elSettingsModal.classList.add('hidden');
    }
  };

  // --- PASSIVE ENERGY RECHARGE LOOP ---
  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy += 1;
      updateUI();
    }
  }, 45000); // 1 energy every 45s

  // Initial render
  updateUI();
});
