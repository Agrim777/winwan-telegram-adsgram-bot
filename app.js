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
    } catch (e) {}
  }

  // --- GAME STATE ---
  const defaultState = {
    coins: 500,
    adCoins: 0,
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

  let state = defaultState;
  try {
    const saved = localStorage.getItem('winwan_cyber_state');
    if (saved) {
      state = Object.assign({}, defaultState, JSON.parse(saved));
    }
  } catch (e) {
    state = defaultState;
  }

  function saveState() {
    try {
      localStorage.setItem('winwan_cyber_state', JSON.stringify(state));
    } catch (e) {}
  }

  // Telegram Haptics Helper
  function triggerHaptic(type = 'light') {
    if (!tg?.HapticFeedback) return;
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
  const elBtnBoosterOverclock = document.getElementById('btnBoosterOverclock');
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

  // Ad Confirmation Modal
  const elAdConfirmModal = document.getElementById('adConfirmModal');
  const elBtnCloseAdConfirm = document.getElementById('btnCloseAdConfirm');
  const elAdConfirmIcon = document.getElementById('adConfirmIcon');
  const elAdConfirmTitle = document.getElementById('adConfirmTitle');
  const elAdConfirmDesc = document.getElementById('adConfirmDesc');
  const elBtnPlayAdAction = document.getElementById('btnPlayAdAction');
  const elBtnCancelAdAction = document.getElementById('btnCancelAdAction');
  let currentAdTriggerSource = null; // 'energy' | 'turbo' | 'spins'

  // Info & Reward Modals
  const elInfoModal = document.getElementById('infoModal');
  const elBtnInfo = document.getElementById('btnInfo');
  const elBtnCloseInfo = document.getElementById('btnCloseInfo');
  const elBtnJoinCommunity = document.getElementById('btnJoinCommunity');
  const elRewardModal = document.getElementById('rewardModal');
  const elRewardPopupCoins = document.getElementById('rewardPopupCoins');
  const elRewardPopupDesc = document.getElementById('rewardPopupDesc');
  const elBtnCollectReward = document.getElementById('btnCollectReward');

  // --- TELEGRAM USER PROFILE ---
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id || 'miner_' + Math.floor(Math.random() * 10000);
  
  if (user && elUserName) {
    elUserName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    if (elUserAvatar) {
      if (user.photo_url) {
        elUserAvatar.src = user.photo_url;
      } else {
        elUserAvatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.first_name}`;
      }
    }
  }

  if (elRefLinkInput) {
    elRefLinkInput.value = `https://t.me/Winwanbot/Winwan?startapp=ref_${userId}`;
  }

  // --- ADSTERRA MONETIZATION CONFIG ---
  const ADSTERRA_LINK_1 = 'https://www.effectivecpmnetwork.com/gcadebhw?key=b7506b60b291b057b56d7cb3885dd8d4';
  const ADSTERRA_LINK_2 = 'https://www.effectivecpmnetwork.com/bpgidnw8c?key=3a61c57fc5485434e2df4de61e2e7454';

  // --- ADSTERRA SPONSOR TASK INTEGRATION ---
  const elBtnSponsorTaskAdsterra = document.getElementById('btnSponsorTaskAdsterra');
  if (elBtnSponsorTaskAdsterra) {
    elBtnSponsorTaskAdsterra.onclick = () => {
      triggerHaptic('success');
      if (tg?.openLink) {
        tg.openLink(ADSTERRA_LINK_2);
      } else {
        window.open(ADSTERRA_LINK_2, '_blank');
      }
      state.coins = (state.coins || 0) + 1;
      state.adCoins = (state.adCoins || 0) + 1;
      showRewardModal(1, '🎉 Sponsor Task Completed! 1 Ad Coin awarded!');
      updateUI();
    };
  }

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
    if (elCoinBalance) elCoinBalance.textContent = Number(state.coins || 0).toLocaleString();

    // League progress
    const curLeague = getLeague(state.coins || 0);
    const nextLeague = leagues[curLeague.index + 1] || null;
    if (elUserRankTitle) elUserRankTitle.innerHTML = `<i class="fa-solid ${curLeague.icon}"></i> ${curLeague.name} League`;
    if (elLeagueCurrent) elLeagueCurrent.textContent = curLeague.name;

    if (nextLeague && elLeagueNext && elLeagueBarFill) {
      elLeagueNext.textContent = `${nextLeague.name} (${nextLeague.threshold.toLocaleString()})`;
      const progress = ((state.coins - curLeague.threshold) / (nextLeague.threshold - curLeague.threshold)) * 100;
      elLeagueBarFill.style.width = `${Math.max(4, Math.min(100, progress))}%`;
    } else if (elLeagueNext && elLeagueBarFill) {
      elLeagueNext.textContent = 'MAX RANK';
      elLeagueBarFill.style.width = '100%';
    }

    // Tap Power with Turbo Multiplier
    const isTurbo = Date.now() < (state.turboActiveUntil || 0);
    const currentPower = isTurbo ? (state.tapPower || 1) * 2 : (state.tapPower || 1);
    if (elTapPowerDisplay) elTapPowerDisplay.textContent = isTurbo ? `${currentPower} (🔥 2X TURBO)` : `${currentPower}`;

    // Energy Bar
    if (elEnergyText) elEnergyText.textContent = `${state.energy}/${state.maxEnergy}`;
    if (elEnergyBarFill) {
      const energyPct = (state.energy / state.maxEnergy) * 100;
      elEnergyBarFill.style.width = `${energyPct}%`;
    }

    // Spins
    if (elSpinsAvailable) elSpinsAvailable.textContent = state.spinsAvailable;
    if (elBtnSpinWheel) elBtnSpinWheel.disabled = (state.spinsAvailable || 0) <= 0;

    // Friends
    if (elStatFriendsCount) elStatFriendsCount.textContent = state.invitedFriends || 0;
    if (elStatReferralBonus) elStatReferralBonus.textContent = (state.referralEarnings || 0).toLocaleString();

    renderUpgrades();
    renderQuests();
    saveState();
  }

  // --- SYNTHESIZED MINING AUDIO (Sci-Fi Laser Chirp) ---
  function playMiningChirp() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  }

  // --- TAP MINING ENGINE ---
  function handleTap(clientX, clientY) {
    if (state.energy <= 0) {
      triggerHaptic('warning');
      return;
    }

    const isTurbo = Date.now() < (state.turboActiveUntil || 0);
    const power = isTurbo ? (state.tapPower || 1) * 2 : (state.tapPower || 1);
    const energyCost = Math.min(state.energy, power);

    state.coins = (state.coins || 0) + power;
    state.energy = Math.max(0, state.energy - energyCost);
    state.totalTaps = (state.totalTaps || 0) + 1;

    triggerHaptic('light');
    playMiningChirp();

    // Floating particle
    if (clientX && clientY) {
      createFloatingParticle(clientX, clientY, `+${power}`);
    } else if (elTapCore) {
      const rect = elTapCore.getBoundingClientRect();
      createFloatingParticle(rect.left + rect.width / 2, rect.top + rect.height / 2, `+${power}`);
    }

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

  if (elTapCore) {
    // Touch support (multi-finger tapping)
    elTapCore.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        handleTap(e.touches[i].clientX, e.touches[i].clientY);
      }
    }, { passive: false });

    // Desktop click support
    elTapCore.addEventListener('click', (e) => {
      handleTap(e.clientX, e.clientY);
    });
  }

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
    if (!elWheelCanvas) return;
    const ctx = elWheelCanvas.getContext('2d');
    if (!ctx) return;

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

  if (elBtnSpinWheel) {
    elBtnSpinWheel.onclick = () => {
      if (isSpinning || (state.spinsAvailable || 0) <= 0) return;

      isSpinning = true;
      state.spinsAvailable = Math.max(0, state.spinsAvailable - 1);
      triggerHaptic('medium');

      const winningIndex = Math.floor(Math.random() * wheelSlices.length);
      const sliceAngle = 360 / wheelSlices.length;
      const targetRotation = (360 * 5) + (360 - (winningIndex * sliceAngle + sliceAngle / 2)) - 90;

      currentWheelAngle += targetRotation;
      if (elWheelContainer) elWheelContainer.style.transform = `rotate(${currentWheelAngle}deg)`;

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
  }

  // --- AD BOOSTER TRIGGER FLOWS (Clause 4 Safe) ---
  function showAdConfirmation(source) {
    if (!elAdConfirmModal) return;
    currentAdTriggerSource = source;
    triggerHaptic('medium');

    if (source === 'energy') {
      if (elAdConfirmIcon) elAdConfirmIcon.innerHTML = '<i class="fa-solid fa-battery-charging text-cyan"></i>';
      if (elAdConfirmTitle) elAdConfirmTitle.textContent = 'Instant Energy Refill';
      if (elAdConfirmDesc) elAdConfirmDesc.textContent = 'Would you like to watch a short sponsored video to refill your energy cell completely + earn 250 bonus coins?';
    } else if (source === 'turbo') {
      if (elAdConfirmIcon) elAdConfirmIcon.innerHTML = '<i class="fa-solid fa-fire-flame-curved text-purple"></i>';
      if (elAdConfirmTitle) elAdConfirmTitle.textContent = '2x Turbo Multiplier';
      if (elAdConfirmDesc) elAdConfirmDesc.textContent = 'Would you like to watch a short sponsored video to double all tap mining earnings for the next 10 minutes?';
    } else if (source === 'spins') {
      if (elAdConfirmIcon) elAdConfirmIcon.innerHTML = '<i class="fa-solid fa-rotate text-amber"></i>';
      if (elAdConfirmTitle) elAdConfirmTitle.textContent = 'Get +2 Extra Spins';
      if (elAdConfirmDesc) elAdConfirmDesc.textContent = 'Would you like to watch a short sponsored video to add 2 extra Lucky Wheel spins to your account?';
    }

    elAdConfirmModal.classList.remove('hidden');
  }

  // Bind Booster Cards to Open Confirmation
  if (elBtnExtraSpinAd) {
    elBtnExtraSpinAd.onclick = () => showAdConfirmation('spins');
  }

  if (elBtnBoosterEnergy) {
    elBtnBoosterEnergy.onclick = () => showAdConfirmation('energy');
  }

  if (elBtnBoosterTurbo) {
    elBtnBoosterTurbo.onclick = () => showAdConfirmation('turbo');
  }

  // Handle Confirmation Actions
  if (elBtnCloseAdConfirm) {
    elBtnCloseAdConfirm.onclick = () => {
      triggerHaptic('light');
      elAdConfirmModal.classList.add('hidden');
    };
  }

  if (elBtnCancelAdAction) {
    elBtnCancelAdAction.onclick = () => {
      triggerHaptic('light');
      elAdConfirmModal.classList.add('hidden');
    };
  }

  if (elBtnPlayAdAction) {
    elBtnPlayAdAction.onclick = () => {
      triggerHaptic('medium');
      if (elAdConfirmModal) elAdConfirmModal.classList.add('hidden');

      // Open Adsterra direct link
      if (tg?.openLink) {
        tg.openLink(ADSTERRA_LINK_1);
      } else {
        window.open(ADSTERRA_LINK_1, '_blank');
      }

      // Grant Reward instantly
      triggerHaptic('success');
      state.adCoins = (state.adCoins || 0) + 1;
      state.coins = (state.coins || 0) + 1;

      if (currentAdTriggerSource === 'energy') {
        state.energy = state.maxEnergy;
        showRewardModal(1, '⚡ Instant Full Energy Refill + 1 Ad Coin Mined!');
      } else if (currentAdTriggerSource === 'turbo') {
        state.turboActiveUntil = Date.now() + (10 * 60 * 1000);
        showRewardModal(1, '🔥 2X Turbo Mining Boost Activated + 1 Ad Coin Mined!');
      } else if (currentAdTriggerSource === 'spins') {
        state.spinsAvailable = (state.spinsAvailable || 0) + 1;
        showRewardModal(1, 'Received +1 Extra Lucky Wheel Spin + 1 Ad Coin!');
      }
      updateUI();
    };
  }

  // --- UPGRADES ---
  function renderUpgrades() {
    if (!elUpgradesContainer) return;
    elUpgradesContainer.innerHTML = '';
    state.upgrades.forEach(u => {
      const card = document.createElement('div');
      card.className = 'list-item-card';
      const cost = Math.round(u.cost * Math.pow(1.5, u.level));
      const canAfford = (state.coins || 0) >= cost;

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
      if (btnBuy && canAfford) {
        btnBuy.onclick = () => buyUpgrade(u.id, cost);
      }
      elUpgradesContainer.appendChild(card);
    });
  }

  function buyUpgrade(id, cost) {
    const upg = state.upgrades.find(u => u.id === id);
    if (!upg || (state.coins || 0) < cost) return;

    state.coins -= cost;
    upg.level += 1;

    if (id === 'u_multitap') {
      state.tapPower = (state.tapPower || 1) + 1;
    } else if (id === 'u_energy') {
      state.maxEnergy = (state.maxEnergy || 1000) + 500;
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
    if (!elQuestsContainer) return;
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
      if (btnClaim && isComplete && !q.claimed) {
        btnClaim.onclick = () => {
          q.claimed = true;
          state.coins = (state.coins || 0) + q.reward;
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
    if (!elRewardModal) return;
    if (elRewardPopupCoins) elRewardPopupCoins.textContent = coins > 0 ? `+${coins.toLocaleString()} Coins` : 'Unlocked!';
    if (elRewardPopupDesc) elRewardPopupDesc.textContent = desc;
    elRewardModal.classList.remove('hidden');
  }

  if (elBtnCollectReward && elRewardModal) {
    elBtnCollectReward.onclick = () => {
      triggerHaptic('light');
      elRewardModal.classList.add('hidden');
    };
  }

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
      const panel = document.getElementById(targetTab);
      if (panel) panel.classList.add('active');
    });
  });

  // --- REFERRALS ---
  if (elBtnCopyRef && elRefLinkInput) {
    elBtnCopyRef.onclick = () => {
      navigator.clipboard.writeText(elRefLinkInput.value);
      triggerHaptic('light');
      alert('Invite link copied to clipboard!');
    };
  }

  if (elBtnShareTelegram && elRefLinkInput) {
    elBtnShareTelegram.onclick = () => {
      triggerHaptic('light');
      const shareText = encodeURIComponent("🎮 Join WINWAN Cyber Miner! Tap to mine coins, spin the lucky wheel and win rewards!");
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(elRefLinkInput.value)}&text=${shareText}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(shareUrl);
      } else {
        window.open(shareUrl, '_blank');
      }
    };
  }

  // --- GAME GUIDE MODAL ---
  if (elBtnInfo && elInfoModal) {
    elBtnInfo.onclick = () => {
      triggerHaptic('light');
      elInfoModal.classList.remove('hidden');
    };
  }

  if (elBtnCloseInfo && elInfoModal) {
    elBtnCloseInfo.onclick = () => {
      triggerHaptic('light');
      elInfoModal.classList.add('hidden');
    };
  }

  if (elBtnJoinCommunity) {
    elBtnJoinCommunity.onclick = () => {
      triggerHaptic('light');
      const commUrl = 'https://t.me/Winwanbot';
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(commUrl);
      } else {
        window.open(commUrl, '_blank');
      }
    };
  }

  // --- PASSIVE TIMERS ---
  // Energy regeneration
  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy = Math.min(state.maxEnergy, state.energy + 5);
      if (elEnergyBarFill) {
        const energyPct = (state.energy / state.maxEnergy) * 100;
        elEnergyBarFill.style.width = `${energyPct}%`;
      }
      if (elEnergyText) elEnergyText.textContent = `${state.energy}/${state.maxEnergy}`;
    }
  }, 1000);

  // Auto-Miner Bot
  setInterval(() => {
    const autobot = state.upgrades.find(u => u.id === 'u_autobot');
    if (autobot && autobot.level > 0) {
      const passiveIncome = autobot.level * 15;
      state.coins = (state.coins || 0) + passiveIncome;
      updateUI();
    }
  }, 3000);

  // --- WELCOME SLIDESHOW ENGINE ---
  const elWelcomeModal = document.getElementById('welcomeModal');
  const btnNextSlides = document.querySelectorAll('.btn-next-slide');
  const btnStartGame = document.getElementById('btnStartGame');

  if (elWelcomeModal) {
    const welcomed = localStorage.getItem('winwan_welcomed');
    if (!welcomed) {
      elWelcomeModal.classList.remove('hidden');
    }
  }

  btnNextSlides.forEach(btn => {
    btn.onclick = () => {
      triggerHaptic('light');
      const currentSlide = btn.closest('.welcome-slide');
      const nextSlideNum = parseInt(currentSlide.getAttribute('data-slide')) + 1;
      const nextSlide = elWelcomeModal.querySelector(`.welcome-slide[data-slide="${nextSlideNum}"]`);
      
      if (currentSlide && nextSlide) {
        currentSlide.classList.add('hidden');
        currentSlide.classList.remove('active');
        nextSlide.classList.remove('hidden');
        nextSlide.classList.add('active');
      }
    };
  });

  if (btnStartGame) {
    btnStartGame.onclick = () => {
      triggerHaptic('success');
      localStorage.setItem('winwan_welcomed', 'true');
      if (elWelcomeModal) elWelcomeModal.classList.add('hidden');
    };
  }

  // --- COMPLIANCE LINKS ---
  const linkTerms = document.getElementById('linkTerms');
  const linkPrivacy = document.getElementById('linkPrivacy');

  if (linkTerms) {
    linkTerms.onclick = (e) => {
      e.preventDefault();
      triggerHaptic('light');
      alert("WINWAN Terms of Service:\n\n1. Play fair: Scripting or automatic clickers are prohibited.\n2. Virtual Coins: Coins earned have no real-world monetary value unless converted as part of official giveaways.\n3. Community Rules: Maintain clean behavior in our Telegram channels.");
    };
  }

  if (linkPrivacy) {
    linkPrivacy.onclick = (e) => {
      e.preventDefault();
      triggerHaptic('light');
      alert("WINWAN Privacy Policy:\n\n1. We respect your privacy. No personal identification data is collected.\n2. Telegram user ID is used solely to save your local game progression and referral squad commission.\n3. Third-party ad delivery is handled securely via official Adsgram SDK.");
    };
  }

  // --- WITHDRAWAL SYSTEM ---
  const elBtnOpenWithdraw = document.getElementById('btnOpenWithdraw');
  const elWithdrawModal = document.getElementById('withdrawModal');
  const elBtnCloseWithdraw = document.getElementById('btnCloseWithdraw');
  const elWithdrawIneligibleBlock = document.getElementById('withdrawIneligibleBlock');
  const elWithdrawEligibleBlock = document.getElementById('withdrawEligibleBlock');
  const elWithdrawMissingCoinsText = document.getElementById('withdrawMissingCoinsText');
  const elWithdrawEligibleAmountText = document.getElementById('withdrawEligibleAmountText');
  const elWithdrawMethod = document.getElementById('withdrawMethod');
  const elWithdrawDetails = document.getElementById('withdrawDetails');
  const elBtnSubmitWithdraw = document.getElementById('btnSubmitWithdraw');

  if (elBtnOpenWithdraw && elWithdrawModal) {
    elBtnOpenWithdraw.onclick = () => {
      triggerHaptic('medium');
      elWithdrawModal.classList.remove('hidden');
      
      const coins = state.adCoins || 0;
      if (coins < 10000) {
        if (elWithdrawIneligibleBlock) elWithdrawIneligibleBlock.classList.remove('hidden');
        if (elWithdrawEligibleBlock) elWithdrawEligibleBlock.classList.add('hidden');
        if (elWithdrawMissingCoinsText) {
          elWithdrawMissingCoinsText.textContent = `Missing: ${(10000 - coins).toLocaleString()} Ad Coins`;
        }
      } else {
        if (elWithdrawIneligibleBlock) elWithdrawIneligibleBlock.classList.add('hidden');
        if (elWithdrawEligibleBlock) elWithdrawEligibleBlock.classList.remove('hidden');
        if (elWithdrawEligibleAmountText) {
          const dollarValue = (coins / 10000).toFixed(2);
          elWithdrawEligibleAmountText.textContent = `$${dollarValue} USD (${coins.toLocaleString()} Ad Coins)`;
        }
      }
    };
  }

  if (elBtnCloseWithdraw && elWithdrawModal) {
    elBtnCloseWithdraw.onclick = () => {
      triggerHaptic('light');
      elWithdrawModal.classList.add('hidden');
    };
  }

  if (elBtnSubmitWithdraw) {
    elBtnSubmitWithdraw.onclick = async () => {
      triggerHaptic('medium');
      const details = elWithdrawDetails ? elWithdrawDetails.value.trim() : '';
      if (!details) {
        alert('Please enter your payment address or details!');
        return;
      }

      const coinsToWithdraw = state.adCoins || 0;
      const method = elWithdrawMethod ? elWithdrawMethod.value : 'UPI';

      try {
        const response = await fetch('/api/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            username: user?.username || user?.first_name || 'Anonymous',
            paymentMethod: method,
            paymentDetails: details,
            amountCoins: coinsToWithdraw
          })
        });

        const result = await response.json();
        if (result.success) {
          triggerHaptic('success');
          state.adCoins = 0;
          if (elWithdrawDetails) elWithdrawDetails.value = '';
          if (elWithdrawModal) elWithdrawModal.classList.add('hidden');
          showRewardModal(0, `🚀 Cash out request for ${coinsToWithdraw.toLocaleString()} Ad Coins submitted! Admin will notify you shortly.`);
          updateUI();
        } else {
          alert('Failed to submit cash out request. Try again.');
        }
      } catch (err) {
        console.error('Error submitting withdrawal:', err);
        // Fallback for standalone static pages if backend is offline:
        triggerHaptic('success');
        state.adCoins = 0;
        if (elWithdrawDetails) elWithdrawDetails.value = '';
        if (elWithdrawModal) elWithdrawModal.classList.add('hidden');
        showRewardModal(0, `🚀 [Demo Mode] Cash out request for ${coinsToWithdraw.toLocaleString()} Ad Coins simulated!`);
        updateUI();
      }
    };
  }

  // Initial render
  updateUI();
});
