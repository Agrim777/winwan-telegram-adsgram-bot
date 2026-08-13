/**
 * AdsgramService - Robust Adsgram SDK Wrapper & Monetization Engine
 * Handles Rewarded Video Ads, Interstitial Ads, Banner Ads, and Test Simulation.
 */

class AdsgramService {
  constructor() {
    this.rewardBlockId = '42716';
    this.interstitialBlockId = '42718';
    this.mode = localStorage.getItem('winwan_ads_mode') || 'adsgram_live'; // 'adsgram_live' | 'simulator'
    this.rewardAdController = null;
    this.interstitialAdController = null;
    this.isLoaded = false;
    this.onLogCallback = null;
  }

  setLogger(callback) {
    this.onLogCallback = callback;
  }

  log(message, type = 'system') {
    console.log(`[AdsgramService] ${message}`);
    if (this.onLogCallback) {
      this.onLogCallback(message, type);
    }
  }

  /**
   * Initializes the Adsgram SDK AdControllers
   */
  init(rewardBlockId, interstitialBlockId) {
    if (rewardBlockId) this.rewardBlockId = rewardBlockId;
    if (interstitialBlockId) this.interstitialBlockId = interstitialBlockId;

    this.log(`Initializing Adsgram SDK. Rewarded: ${this.rewardBlockId}, Interstitial: ${this.interstitialBlockId}`, 'system');

    if (typeof window.Adsgram !== 'undefined') {
      try {
        // Initialize Rewarded Ad Controller
        this.rewardAdController = window.Adsgram.init({
          blockId: this.rewardBlockId,
          debug: false
        });

        // Initialize Interstitial Ad Controller
        this.interstitialAdController = window.Adsgram.init({
          blockId: this.interstitialBlockId,
          debug: false
        });

        this.isLoaded = true;
        this.log('Adsgram AdControllers initialized successfully.', 'system');
      } catch (err) {
        this.log(`Failed to init Adsgram AdControllers: ${err.message}`, 'error');
      }
    } else {
      this.log('Adsgram SDK script not detected on window. Falling back to test simulator.', 'system');
    }
  }

  /**
   * Shows a Rewarded Video Ad according to Adsgram official documentation
   * @returns {Promise<boolean>}
   */
  async showRewardedVideo() {
    this.log(`Requesting Rewarded Video Ad with Block ID: ${this.rewardBlockId}...`, 'ad-event');

    if (this.mode === 'simulator' || !window.Adsgram || !this.rewardAdController) {
      return this._simulateAdExperience('Rewarded Video Ad');
    }

    return new Promise((resolve) => {
      this.rewardAdController
        .show()
        .then((result) => {
          // User watched ad till the end -> grant reward
          this.log(`Adsgram Success: ${JSON.stringify(result || {})}`, 'reward');
          resolve(true);
        })
        .catch((result) => {
          // User closed banner or error occurred
          this.log(`Adsgram Closed/Error: ${JSON.stringify(result || {})}`, 'error');
          // If in desktop browser without Telegram Mini App container, offer fallback
          if (!window.Telegram?.WebApp?.initData) {
            resolve(this._simulateAdExperience('Rewarded Video Ad (Web Simulator)'));
          } else {
            resolve(false);
          }
        });
    });
  }

  /**
   * Shows an Interstitial Ad
   */
  async showInterstitial() {
    this.log(`Requesting Interstitial Ad with Block ID: ${this.interstitialBlockId}...`, 'ad-event');
    if (this.mode === 'simulator' || !window.Adsgram || !this.interstitialAdController) {
      return this._simulateAdExperience('Interstitial Ad Break');
    }

    try {
      await this.interstitialAdController.show();
      this.log('Interstitial ad viewed.', 'ad-event');
      return true;
    } catch (err) {
      this.log(`Interstitial ad skipped or unavailable: ${err?.message || err}`, 'error');
      // If in desktop browser without Telegram Mini App container, offer fallback
      if (!window.Telegram?.WebApp?.initData) {
        return this._simulateAdExperience('Interstitial Ad Break (Web Simulator)');
      }
      return false;
    }
  }

  /**
   * Interactive In-App Ad Simulator for testing outside Telegram or without live ad campaigns
   */
  _simulateAdExperience(adTitle) {
    return new Promise((resolve) => {
      // Create overlay simulator modal
      const simModal = document.createElement('div');
      simModal.className = 'modal-overlay';
      simModal.style.zIndex = '9999';
      simModal.innerHTML = `
        <div class="modal-card" style="text-align: center; max-width: 340px; border: 2px solid #fbbf24;">
          <div style="font-size: 36px; margin-bottom: 10px; animation: bounce 1s infinite;">🎬</div>
          <h3 style="color: #fbbf24; margin-bottom: 6px;">[Adsgram Demo Simulation]</h3>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">
            Simulating <strong>${adTitle}</strong> sponsored by <em>Adsgram.ai</em>
          </p>
          <div style="background: rgba(0,0,0,0.5); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
            <div style="font-size: 24px; font-weight: 800; color: #38bdf8;" id="simTimer">5s</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Watching sponsor message...</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btnSimSkip" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 10px; cursor: pointer;">Skip Ad</button>
            <button id="btnSimComplete" style="flex: 2; padding: 10px; background: #fbbf24; border: none; color: #000; font-weight: 700; border-radius: 10px; cursor: pointer;" disabled>Watching (5s)...</button>
          </div>
        </div>
      `;
      document.body.appendChild(simModal);

      let timeLeft = 5;
      const timerEl = simModal.querySelector('#simTimer');
      const completeBtn = simModal.querySelector('#btnSimComplete');
      const skipBtn = simModal.querySelector('#btnSimSkip');

      const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
          timerEl.textContent = `${timeLeft}s`;
          completeBtn.textContent = `Watching (${timeLeft}s)...`;
        } else {
          clearInterval(interval);
          timerEl.textContent = 'Ad Finished!';
          timerEl.style.color = '#34d399';
          completeBtn.disabled = false;
          completeBtn.textContent = 'Claim Reward ✓';
          completeBtn.style.background = '#10b981';
          completeBtn.style.color = '#fff';
        }
      }, 1000);

      completeBtn.onclick = () => {
        clearInterval(interval);
        document.body.removeChild(simModal);
        this.log('Simulator: Ad completed successfully!', 'reward');
        resolve(true);
      };

      skipBtn.onclick = () => {
        clearInterval(interval);
        document.body.removeChild(simModal);
        this.log('Simulator: User skipped ad. No reward granted.', 'error');
        resolve(false);
      };
    });
  }
}

// Global instance
window.adsgramService = new AdsgramService();
