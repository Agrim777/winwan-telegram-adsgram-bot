/**
 * AdsgramService - Robust Adsgram SDK Wrapper & Monetization Engine
 * Handles Rewarded Video Ads, Interstitial Ads, Banner Ads, and Test Simulation.
 */

class AdsgramService {
  constructor() {
    // Default test block ID from Adsgram documentation (or custom user configured ID)
    this.blockId = localStorage.getItem('winwan_adsgram_block_id') || '42427';
    this.mode = localStorage.getItem('winwan_ads_mode') || 'adsgram_live'; // 'adsgram_live' | 'simulator'
    this.adController = null;
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
   * Initializes the Adsgram SDK AdController
   */
  init(blockId) {
    if (blockId) {
      this.blockId = blockId;
      localStorage.setItem('winwan_adsgram_block_id', blockId);
    }

    this.log(`Initializing Adsgram SDK with Block ID: ${this.blockId}`, 'system');

    if (typeof window.Adsgram !== 'undefined') {
      try {
        this.adController = window.Adsgram.init({
          blockId: this.blockId,
          debug: true,
          debugBannerType: 'FullscreenMedia'
        });

        this.adController.addEventListener('onReward', () => {
          this.log('Adsgram Event: [onReward] - User watched ad successfully!', 'reward');
        });

        this.adController.addEventListener('onStart', () => {
          this.log('Adsgram Event: [onStart] - Ad playback started', 'ad-event');
        });

        this.adController.addEventListener('onSkip', () => {
          this.log('Adsgram Event: [onSkip] - User skipped ad prematurely', 'error');
        });

        this.adController.addEventListener('onError', (err) => {
          this.log(`Adsgram Event: [onError] - ${JSON.stringify(err)}`, 'error');
        });

        this.isLoaded = true;
        this.log('Adsgram AdController initialized successfully.', 'system');
      } catch (err) {
        this.log(`Failed to init Adsgram AdController: ${err.message}`, 'error');
      }
    } else {
      this.log('Adsgram SDK script not detected on window. Falling back to test simulator.', 'system');
    }
  }

  /**
   * Shows a Rewarded Video Ad
   * @returns {Promise<boolean>} Resolves to true if user completed ad, rejects/resolves false if skipped/failed
   */
  async showRewardedVideo() {
    this.log(`Requesting Rewarded Video Ad (Mode: ${this.mode})...`, 'ad-event');

    // If simulator mode is active or Adsgram object is not available
    if (this.mode === 'simulator' || !window.Adsgram || !this.adController) {
      return this._simulateAdExperience('Rewarded Video Ad');
    }

    try {
      // Adsgram show() returns a promise that resolves on reward, or rejects on skip/error
      const result = await this.adController.show();
      this.log('Ad completed! Rewarding player...', 'reward');
      return true;
    } catch (error) {
      this.log(`Ad was closed or failed: ${error?.description || error?.message || JSON.stringify(error)}`, 'error');
      
      // If error is due to running in desktop browser without Telegram Mini App container, offer simulation
      if (window.confirm("Adsgram live ads run natively inside Telegram. Would you like to run the Ad Simulator to test reward crediting?")) {
        return this._simulateAdExperience('Rewarded Video Ad');
      }
      return false;
    }
  }

  /**
   * Shows an Interstitial Ad
   */
  async showInterstitial() {
    this.log(`Requesting Interstitial Ad...`, 'ad-event');
    if (this.mode === 'simulator' || !window.Adsgram || !this.adController) {
      return this._simulateAdExperience('Interstitial Ad Break');
    }

    try {
      await this.adController.show();
      this.log('Interstitial ad viewed.', 'ad-event');
      return true;
    } catch (err) {
      this.log(`Interstitial ad skipped or unavailable: ${err?.message || err}`, 'error');
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
