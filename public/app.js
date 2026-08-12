/**
 * Winwan - Cyber Miner & Lucky Wheel Game Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp Initialization
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

  // --- GAME STATE ---
  const defaultState = {
    coins: 500,
    tapPower: 1,
    energy: 1000,
    maxEnergy: 1000,
    turboActiveUntil: 0,
    totalTaps: 0,
    spinsAvailable: 3,
    lastSpinDate: null,
    level: 1,
    invitedFriends: 0,
    referralEarnings: 0,
    upgrades: [
      { id: 'u_multitap', name: 'Multi-Core Tap', desc: '+1 Coin mined per tap', cost: 200, level: 1, icon: 'fa-hand-pointer' },
      { id: 'u_energy', name: 'Energy Cell Max', desc: '+500 Max Energy capacity', cost: 400, level: 1, icon: 'fa-bolt' },
      { id: 'u_autobot', name: 'Auto-Mining Bot', desc: 'Mines +5 Coins/sec automatically', cost: 1500, level: 0, icon: 'fa-robot' }
    ],
    quests: [
      { id: 'q_taps_100', title: 'Tap 100 Times', desc: 'Mine coins 100 times in the arena', reward: 500, target: 100, progress: 0, claimed: false, icon: 'fa-cube' },
      { id: 'q_upgrade_1', title: 'Upgrade Miner', desc: 'Purchase any rig upgrade', reward: 400, target: 1, progress: 0, claimed: false, icon: 'fa-bolt' },
      { id: 'q_spin_wheel', title: 'Spin Master', desc: 'Spin the Lucky Wheel 1 time', reward: 300, target: 1, progress: 0, claimed: false, icon: 'fa-dharmachakra' },
      { id: 'q_taps_500', title: 'Cyber Tycoon', desc: 'Reach 500 total taps', reward: 2500, target: 500, progress: 0, claimed: false, icon: 'fa-trophy' }
    ]
  };

  let state = JSON.parse(localStorage.getItem('winwan_cyber_state')) || defaultState;

  function saveState() {
    localStorage.setItem('winwan_cyber_state', JSON.stringify(state));
  }

  // Telegram Haptics Helper
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
    } catch (e) {}
  }

  // --- UI ELEMENTS ---
  const elUserName = document.getElementById('userName');
  const elUserAvatar = document.getElementById('userAvatar');
  const elUserLevelBadge = document.getElementById('userLevelBadge');
  const elUserRankTitle = document.getElementById('userRankTitle');
  const elCoinBalance = document.getElementById('coinBalance');
  const elLeagueCurrent = document.getElementById('leagueCurrent');
  const elLeagueNext = document.getElementById('leagueNext');
  const elLeagueBarFill = document.getElementById('leagueBarFill');
  const elTapCore = document.getElementById('tapCore');
  const elEnergyText = document.getElementById('energyText');
  const elEnergyBarFill = document.getElementById('energyBarFill');
  const elTapPowerDisplay = document.getElementById('tapPowerDisplay');
  const elBtnBoosterEnergy = document.getElementById('btnBoosterEnergy');
  const elBtnBoosterTurbo = document.getElementById('btnBoosterTurbo');
  const elSpinsAvailable = document.getElementById('spinsAvailable');
  const elBtnSpinWheel = document.getElementById('btnSpinWheel');
  const elBtnExtraSpinAd = document.getElementById('btnExtraSpinAd');
  const elWheelContainer = document.getElementById('wheelContainer');
  const elWheelCanvas = document.getElementById('wheelCanvas');
  const elQuestsContainer = document.getElementById('questsContainer');
  const elUpgradesContainer = document.getElementById('upgradesContainer');
  const elRefLinkInput = document.getElementById('refLinkInput');
  const elBtnCopyRef = document.getElementById('btnCopyRef');
  const elBtnShareTelegram = document.getElementById('btnShareTelegram');
  const elStatFriendsCount = document.getElementById('statFriendsCount');
  const elStatReferralBonus = document.getElementById('statReferralBonus');

  // Info Modal
  const elInfoModal = document.getElementById('infoModal');
  const elBtnInfo = document.getElementById('btnInfo');
  const elBtnCloseInfo = document.getElementById('btnCloseInfo');
  const elBtnJoinCommunity = document.getElementById('btnJoinCommunity');
  const elRewardModal = document.getElementById('rewardModal');
  const elRewardPopupTitle = document.getElementById('rewardPopupTitle');
  const elRewardPopupCoins = document.getElementById('rewardPopupCoins');
  const elRewardPopupDesc = document.getElementById('rewardPopupDesc');
  const elBtnCollectReward = document.getElementById('btnCollectReward');

  // --- TELEGRAM USER PROFILE ---
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id || 'miner_' + Math.floor(Math.random() * 10000);
  
  if (user) {
    elUserName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    if (user.photo_url) {
      elUserAvatar.src = user.photo_url;
    } else {
      elUserAvatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.first_name}`;
    }
  }

  elRefLinkInput.value = `https://t.me/Winwanbot/Winwan?startapp=ref_${userId}`;

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
  window.adsgramService.init('42502');

  elInputBlockId.value = window.adsgramService.blockId;
  elSelectAdMode.value = window.adsgramService.mode;

  // --- LEAGUE RANKS ---
  const leagues = [
    { name: 'Bronze', threshold: 0, icon: 'fa-shield-halved' },
    { name: 'Silver', threshold: 5000, icon: 'fa-medal' },
    { name: 'Gold', threshold: 25000, icon: 'fa-crown' },
    { name: 'Platinum', threshold: 100000, icon: 'fa-gem' },
    { name: 'Cyber Lord', threshold: 500000, icon: 'fa-dragon' }
  ];

  function getLeague(coins) {
    for (let i = leagues.length - 1; i >= 0; i--) {
      if (coins >= leagues[i].threshold) return { ...leagues[i], index: i };
    }
    return { ...leagues[0], index: 0 };
  }

  // --- UPDATE UI ---
  function updateUI() {
    elCoinBalance.textContent = state.coins.toLocaleString();

    // League progress
    const curLeague = getLeague(state.coins);
    const nextLeague = leagues[curLeague.index + 1] || null;
    elUserRankTitle.innerHTML = `<i class="fa-solid ${curLeague.icon}"></i> ${curLeague.name} League`;
    elLeagueCurrent.textContent = curLeague.name;

    if (nextLeague) {
      elLeagueNext.textContent = `${nextLeague.name} (${nextLeague.threshold.toLocaleString()})`;
      const progress = ((state.coins - curLeague.threshold) / (nextLeague.threshold - curLeague.threshold)) * 100;
      elLeagueBarFill.style.width = `${Math.max(4, Math.min(100, progress))}%`;
    } else {
      elLeagueNext.textContent = 'MAX RANK';
      elLeagueBarFill.style.width = '100%';
    }

    // Tap Power with Turbo Multiplier
    const isTurbo = Date.now() < state.turboActiveUntil;
    const currentPower = isTurbo ? state.tapPower * 2 : state.tapPower;
    elTapPowerDisplay.textContent = isTurbo ? `${currentPower} (🔥 2X TURBO)` : `${currentPower}`;

    // Energy Bar
    elEnergyText.textContent = `${state.energy}/${state.maxEnergy}`;
    const energyPct = (state.energy / state.maxEnergy) * 100;
    elEnergyBarFill.style.width = `${energyPct}%`;

    // Spins
    elSpinsAvailable.textContent = state.spinsAvailable;
    elBtnSpinWheel.disabled = state.spinsAvailable <= 0;

    // Friends
    elStatFriendsCount.textContent = state.invitedFriends;
    elStatReferralBonus.textContent = state.referralEarnings.toLocaleString();

    renderUpgrades();
    renderQuests();
    saveState();
  }

  // --- TAP MINING ENGINE ---
  function handleTap(event) {
    if (state.energy <= 0) {
      triggerHaptic('warning');
      return;
    }

    const isTurbo = Date.now() < state.turboActiveUntil;
    const power = isTurbo ? state.tapPower * 2 : state.tapPower;
    const energyCost = Math.min(state.energy, power);

    state.coins += power;
    state.energy -= energyCost;
    state.totalTaps += 1;

    triggerHaptic('light');

    // Create floating particle
    const rect = elTapCore.getBoundingClientRect();
    const touch = event.touches ? event.touches[0] : event;
    const x = touch.clientX || (rect.left + rect.width / 2);
    const y = touch.clientY || (rect.top + rect.height / 2);

    createFloatingParticle(x, y, `+${power}`);

    // Update quest progress
    const q1 = state.quests.find(q => q.id === 'q_taps_100');
    if (q1) q1.progress = Math.min(q1.target, state.totalTaps);

    const q4 = state.quests.find(q => q.id === 'q_taps_500');
    if (q4) q4.progress = Math.min(q4.target, state.totalTaps);

    updateUI();
  }

  function createFloatingParticle(clientX, clientY, text) {
    const particle = document.createElement('div');
    particle.className = 'tap-particle';
    particle.textContent = text;
    particle.style.left = `${clientX - 15 + (Math.random() * 20 - 10)}px`;
    particle.style.top = `${clientY - 20}px`;
    document.body.appendChild(particle);

    setTimeout(() => {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 800);
  }

  elTapCore.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
      handleTap(e.touches[i]);
    }
  }, { passive: false });

  elTapCore.addEventListener('mousedown', (e) => {
    handleTap(e);
  });

  // --- LUCKY WHEEL CANVAS ENGINE ---
  const wheelSlices = [
    { label: '+250 Coins', value: 250, type: 'coins', color: '#1e293b' },
    { label: '+1000 Coins', value: 1000, type: 'coins', color: '#06b6d4' },
    { label: '+500 Coins', value: 500, type: 'coins', color: '#1e293b' },
    { label: '🔥 2X Turbo', value: 'turbo', type: 'turbo', color: '#8b5cf6' },
    { label: '+100 Coins', value: 100, type: 'coins', color: '#1e293b' },
    { label: '💎 5000 JACKPOT', value: 5000, type: 'coins', color: '#f59e0b' }
  ];

  let currentWheelAngle = 0;
  let isSpinning = false;

  function drawWheel() {
    const ctx = elWheelCanvas.getContext('2d');
    const numSlices = wheelSlices.length;
    const arc = (2 * Math.PI) / numSlices;
    const radius = elWheelCanvas.width / 2;

    ctx.clearRect(0, 0, elWheelCanvas.width, elWheelCanvas.height);

    wheelSlices.forEach((slice, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = slice.color;
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, angle, angle + arc);
      ctx.lineTo(radius, radius);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText(slice.label, radius - 15, 4);
      ctx.restore();
    });
  }

  drawWheel();

  elBtnSpinWheel.onclick = () => {
    if (isSpinning || state.spinsAvailable <= 0) return;

    isSpinning = true;
    state.spinsAvailable -= 1;
    triggerHaptic('medium');

    const winningIndex = Math.floor(Math.random() * wheelSlices.length);
    const sliceAngle = 360 / wheelSlices.length;
    const targetRotation = (360 * 5) + (360 - (winningIndex * sliceAngle + sliceAngle / 2)) - 90;

    currentWheelAngle += targetRotation;
    elWheelContainer.style.transform = `rotate(${currentWheelAngle}deg)`;

    setTimeout(() => {
      isSpinning = false;
      const prize = wheelSlices[winningIndex];

      if (prize.type === 'coins') {
        state.coins += prize.value;
        showRewardModal(prize.value, `Lucky Wheel Prize: ${prize.label}!`);
      } else if (prize.type === 'turbo') {
        state.turboActiveUntil = Date.now() + (10 * 60 * 1000);
        showRewardModal(0, '🔥 2X Turbo Mining Boost Activated for 10 Minutes!');
      }

      // Quest progress
      const q3 = state.quests.find(q => q.id === 'q_spin_wheel');
      if (q3) q3.progress = 1;

      triggerHaptic('success');
      updateUI();
    }, 4100);

    updateUI();
  };

  // Extra Spins via Adsgram Video Ad
  elBtnExtraSpinAd.onclick = async () => {
    triggerHaptic('medium');
    const success = await window.adsgramService.showRewardedVideo();
    if (success) {
      state.spinsAvailable += 2;
      triggerHaptic('success');
      showRewardModal(0, 'Received +2 Extra Lucky Wheel Spins from sponsor!');
      updateUI();
    }
  };

  // --- BOOSTERS (ADSGRAM REWARDED ADS) ---
  elBtnBoosterEnergy.onclick = async () => {
    triggerHaptic('medium');
    const success = await window.adsgramService.showRewardedVideo();
    if (success) {
      state.energy = state.maxEnergy;
      state.coins += 250;
      triggerHaptic('success');
      showRewardModal(250, '⚡ Instant Full Energy Refill + 250 Bonus Coins Claimed!');
      updateUI();
    }
  };

  elBtnBoosterTurbo.onclick = async () => {
    triggerHaptic('medium');
    const success = await window.adsgramService.showRewardedVideo();
    if (success) {
      state.turboActiveUntil = Date.now() + (10 * 60 * 1000);
      triggerHaptic('success');
      showRewardModal(0, '🔥 2X Turbo Mining Boost Activated for 10 Minutes!');
      updateUI();
    }
  };

  // --- UPGRADES ---
  function renderUpgrades() {
    elUpgradesContainer.innerHTML = '';
    state.upgrades.forEach(u => {
      const card = document.createElement('div');
      card.className = 'list-item-card';
      const cost = Math.round(u.cost * Math.pow(1.5, u.level));
      const canAfford = state.coins >= cost;

      card.innerHTML = `
        <div class="item-left">
          <div class="item-icon-box"><i class="fa-solid ${u.icon}"></i></div>
          <div class="item-info">
            <h4>${u.name} <small class="text-cyan">(Lv.${u.level})</small></h4>
            <p>${u.desc}</p>
          </div>
        </div>
        <button class="btn-buy" ${canAfford ? '' : 'disabled'} data-upgrade-id="${u.id}">
          ${cost.toLocaleString()} Coins
        </button>
      `;

      const btnBuy = card.querySelector('.btn-buy');
      if (canAfford) {
        btnBuy.onclick = () => buyUpgrade(u.id, cost);
      }
      elUpgradesContainer.appendChild(card);
    });
  }

  function buyUpgrade(id, cost) {
    const upg = state.upgrades.find(u => u.id === id);
    if (!upg || state.coins < cost) return;

    state.coins -= cost;
    upg.level += 1;

    if (id === 'u_multitap') {
      state.tapPower += 1;
    } else if (id === 'u_energy') {
      state.maxEnergy += 500;
      state.energy = state.maxEnergy;
    }

    const q2 = state.quests.find(q => q.id === 'q_upgrade_1');
    if (q2) q2.progress = 1;

    triggerHaptic('success');
    showRewardModal(0, `Upgrade Unlocked: ${upg.name} (Lv.${upg.level})!`);
    updateUI();
  }

  // --- QUESTS ---
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
        <button class="btn-claim" ${q.claimed ? 'disabled' : (isComplete ? '' : 'disabled')}>
          ${q.claimed ? 'Claimed' : (isComplete ? 'Claim' : `${q.progress}/${q.target}`)}
        </button>
      `;

      const btnClaim = card.querySelector('.btn-claim');
      if (isComplete && !q.claimed) {
        btnClaim.onclick = () => {
          q.claimed = true;
          state.coins += q.reward;
          triggerHaptic('success');
          showRewardModal(q.reward, `Quest Completed: ${q.title}!`);
          updateUI();
        };
      }
      elQuestsContainer.appendChild(card);
    });
  }

  // --- REWARD CELEBRATION MODAL ---
  function showRewardModal(coins, desc) {
    elRewardPopupCoins.textContent = coins > 0 ? `+${coins.toLocaleString()} Coins` : 'Unlocked!';
    elRewardPopupDesc.textContent = desc;
    elRewardModal.classList.remove('hidden');
  }

  elBtnCollectReward.onclick = () => {
    triggerHaptic('light');
    elRewardModal.classList.add('hidden');
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

  // --- REFERRALS ---
  elBtnCopyRef.onclick = () => {
    navigator.clipboard.writeText(elRefLinkInput.value);
    triggerHaptic('light');
    alert('Invite link copied to clipboard!');
  };

  elBtnShareTelegram.onclick = () => {
    triggerHaptic('light');
    const shareText = encodeURIComponent("🎮 Join Winwan Cyber Miner! Tap to mine coins, spin the lucky wheel and win rewards!");
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(elRefLinkInput.value)}&text=${shareText}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  // --- GAME GUIDE MODAL ---
  elBtnInfo.onclick = () => {
    triggerHaptic('light');
    elInfoModal.classList.remove('hidden');
  };

  elBtnCloseInfo.onclick = () => {
    triggerHaptic('light');
    elInfoModal.classList.add('hidden');
  };

  elBtnJoinCommunity.onclick = () => {
    triggerHaptic('light');
    const commUrl = 'https://t.me/Winwanbot';
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(commUrl);
    } else {
      window.open(commUrl, '_blank');
    }
  };

  // --- PASSIVE TIMERS ---
  // Energy regeneration (10 energy / sec)
  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy = Math.min(state.maxEnergy, state.energy + 5);
      const energyPct = (state.energy / state.maxEnergy) * 100;
      elEnergyBarFill.style.width = `${energyPct}%`;
      elEnergyText.textContent = `${state.energy}/${state.maxEnergy}`;
    }
  }, 1000);

  // Auto-Miner Bot (Every 3 sec)
  setInterval(() => {
    const autobot = state.upgrades.find(u => u.id === 'u_autobot');
    if (autobot && autobot.level > 0) {
      const passiveIncome = autobot.level * 15;
      state.coins += passiveIncome;
      updateUI();
    }
  }, 3000);

  updateUI();
});
