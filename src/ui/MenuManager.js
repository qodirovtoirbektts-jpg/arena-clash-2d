// Arena Clash 2D v3.2 — Advanced Menu & Modal Manager (Inspired by Last Grid TD)
import { uz } from '../i18n/uz.js';
import { HEROES_CONFIG } from '../entities/heroes.config.js';
import { audioEngine } from '../core/AudioEngine.js';
import { settingsManager } from '../core/SettingsManager.js';

export class MenuManager {
  constructor(rootContainer, onStartFight, onSelectHero, onSelectArena) {
    this.container = rootContainer;
    this.onStartFight = onStartFight;
    this.onSelectHero = onSelectHero;
    this.onSelectArena = onSelectArena;

    this.selectedHeroP1 = 'blaze_knight';
    this.selectedHeroP2 = 'shadow_ninja';
    this.selectedMode = 'vsBot';
    this.selectedArena = 'cyber_grid';

    this.menuElement = null;
    this.mvpElement = null;
    this.activeModal = null;

    this.init();
  }

  init() {
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'menu-root';
    this.menuElement.className = 'menu-overlay';

    this.menuElement.innerHTML = `
      <div class="menu-top-bar">
        <div class="menu-brand">
          <span class="menu-brand-tag">TACTICAL BRAWLER v3.2</span>
          <h1>ARENA CLASH 2D</h1>
        </div>
        <div class="menu-top-actions">
          <button class="tactical-btn" id="btn-open-settings">
            <span>⚙️ SOZLAMALAR</span>
          </button>
          <button class="tactical-btn" id="btn-open-hall">
            <span>🏆 SHON-SHARAF</span>
          </button>
          <button class="tactical-btn" id="btn-open-achieve">
            <span>🎖️ YUTUQLAR</span>
          </button>
        </div>
      </div>

      <div class="menu-center-grid">
        <div class="mode-column">
          <div class="mode-tile active" data-mode="vsBot">
            <div class="icon-medallion">🤖</div>
            <div class="mode-tile-text">
              <h3>${uz.menu.vsBot.toUpperCase()}</h3>
              <p>Aqlli gladiator AI ga qarshi jang</p>
            </div>
          </div>

          <div class="mode-tile" data-mode="localP2">
            <div class="icon-medallion">👥</div>
            <div class="mode-tile-text">
              <h3>${uz.menu.localP2.toUpperCase()}</h3>
              <p>Bitta ekranda do'st bilan duel</p>
            </div>
          </div>

          <div class="mode-tile" data-mode="chaos">
            <div class="icon-medallion">⚡</div>
            <div class="mode-tile-text">
              <h3>XAOS REJIMI</h3>
              <p>Zulmat, lava va oy gravitatsiyasi</p>
            </div>
          </div>
        </div>

        <div class="hero-stage">
          <div class="hero-deck">
            ${Object.values(HEROES_CONFIG).map(h => `
              <div class="hero-pedestal-card ${h.id === this.selectedHeroP1 ? 'selected' : ''} ${h.id === 'shadow_ninja' ? 'ninja' : h.id === 'frost_mage' ? 'mage' : 'knight'}" data-hero="${h.id}">
                <div class="hero-avatar-zone">
                  ${h.id === 'blaze_knight' ? '⚔️' : h.id === 'shadow_ninja' ? '🗡️' : '❄️'}
                </div>
                <h3>${h.name.toUpperCase()}</h3>
                <span class="hero-role-pill">${h.role.toUpperCase()}</span>
                <div class="hero-specs-list">
                  <div class="spec-row"><span>HP</span><b>${h.maxHp}</b></div>
                  <div class="spec-row"><span>TEZLIK</span><b>${h.speed}</b></div>
                  <div class="spec-row"><span>ELEMENT</span><b>${h.element.toUpperCase()}</b></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="menu-bottom-dock" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="controls-hint" style="color: var(--text-dim); font-family: var(--font-display); font-size: 0.85rem;">
          [1-O'yinchi]: <b>W A S D</b> + <b>J</b> (Yengil) <b>K</b> (Og'ir) <b>L</b> (Skill) <b>Shift</b> (Dodge) <b>U</b> (Parry)
        </div>

        <button id="btn-start-fight" class="tactical-btn primary huge">
          <span>ENGAGE // JANGNI BOSHLASH</span>
        </button>
      </div>

      <!-- Modallar qatlami -->
      <div id="modal-container"></div>
    `;

    this.container.appendChild(this.menuElement);
    this.setupEvents();
  }

  setupEvents() {
    // 1. Rejim tanlash
    const modeTiles = this.menuElement.querySelectorAll('.mode-tile');
    modeTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        modeTiles.forEach(t => t.classList.remove('active'));
        tile.classList.add('active');
        this.selectedMode = tile.dataset.mode;
        audioEngine.playClick();
      });
    });

    // 2. Qahramon tanlash
    const heroCards = this.menuElement.querySelectorAll('.hero-pedestal-card');
    heroCards.forEach(card => {
      card.addEventListener('click', () => {
        heroCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedHeroP1 = card.dataset.hero;
        audioEngine.playClick();
        if (this.onSelectHero) this.onSelectHero(this.selectedHeroP1);
      });
    });

    // 3. Boshlash tugmasi
    const startBtn = this.menuElement.querySelector('#btn-start-fight');
    startBtn.addEventListener('click', () => {
      audioEngine.playTacticalVoice('engage');
      this.hide();
      if (this.onStartFight) {
        this.onStartFight(this.selectedMode, this.selectedHeroP1, this.selectedHeroP2);
      }
    });

    // 4. Modallarni ochish
    this.menuElement.querySelector('#btn-open-settings').addEventListener('click', () => this.openSettingsModal());
    this.menuElement.querySelector('#btn-open-hall').addEventListener('click', () => this.openHallModal());
    this.menuElement.querySelector('#btn-open-achieve').addEventListener('click', () => this.openAchievementsModal());
  }

  show() {
    this.menuElement.style.display = 'flex';
  }

  hide() {
    this.menuElement.style.display = 'none';
  }

  // 1. Sozlamalar Modali (Last Grid TD kabi to'liq konfiguratsiya)
  openSettingsModal() {
    audioEngine.playModal(true);
    const container = this.menuElement.querySelector('#modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-layer active';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>TACTICAL SETTINGS // SOZLAMALAR</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="settings-grid">
          <div class="setting-row">
            <span>CRT SCANLINES (RETRO EKRAN)</span>
            <div class="setting-options">
              <button class="opt-pill ${document.getElementById('game-container').classList.contains('crt-enabled') ? 'active' : ''}" data-crt="on">YOQIQ</button>
              <button class="opt-pill ${!document.getElementById('game-container').classList.contains('crt-enabled') ? 'active' : ''}" data-crt="off">O'CHIQ</button>
            </div>
          </div>
          <div class="setting-row">
            <span>SCREEN SHAKE (EKRAN TEBRANISHI)</span>
            <div class="setting-options">
              <button class="opt-pill active" data-shake="100">100%</button>
              <button class="opt-pill" data-shake="50">50%</button>
              <button class="opt-pill" data-shake="0">0%</button>
            </div>
          </div>
          <div class="setting-row">
            <span>PARTICLE TIER (ZARRALAR SIFATI)</span>
            <div class="setting-options">
              <button class="opt-pill active" data-particles="ultra">ULTRA</button>
              <button class="opt-pill" data-particles="med">MED</button>
              <button class="opt-pill" data-particles="low">LOW</button>
            </div>
          </div>
          <div class="setting-row">
            <span>BGM AUDIO (CYBERPUNK FON MUSIQA)</span>
            <div class="setting-options">
              <button class="opt-pill active" data-bgm="on">ON</button>
              <button class="opt-pill" data-bgm="off">OFF</button>
            </div>
          </div>
        </div>
        <button class="tactical-btn emerald" id="settings-close-apply">
          <span>APPLY & CLOSE // SAQLASH</span>
        </button>
      </div>
    `;

    container.appendChild(modal);

    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
      audioEngine.playModal(false);
      modal.remove();
    });

    modal.querySelector('#settings-close-apply').addEventListener('click', () => {
      audioEngine.playClick();
      modal.remove();
    });

    // CRT Toggle
    modal.querySelectorAll('[data-crt]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('[data-crt]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const gameCont = document.getElementById('game-container');
        if (btn.dataset.crt === 'on') {
          gameCont.classList.add('crt-enabled');
        } else {
          gameCont.classList.remove('crt-enabled');
        }
        audioEngine.playClick();
      });
    });

    // BGM Toggle
    modal.querySelectorAll('[data-bgm]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('[data-bgm]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        audioEngine.bgmEnabled = btn.dataset.bgm === 'on';
        audioEngine.playClick();
      });
    });
  }

  // 2. Hall of Fame (Shon-Sharaf zali)
  openHallModal() {
    audioEngine.playModal(true);
    const container = this.menuElement.querySelector('#modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-layer active';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>HALL OF FAME // REYTING JADVALI</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="hall-grid">
          <div class="hall-row gold">
            <span>#1 TEMUR_PRO (BLAZE KNIGHT)</span>
            <b>1420 MMR</b>
          </div>
          <div class="hall-row silver">
            <span>#2 SOYA_SHINOBI (SHADOW NINJA)</span>
            <b>1385 MMR</b>
          </div>
          <div class="hall-row bronze">
            <span>#3 MUZ_QORI (FROST MAGE)</span>
            <b>1310 MMR</b>
          </div>
          <div class="hall-row">
            <span>#4 GLADIATOR_UZ (BLAZE KNIGHT)</span>
            <b>1240 MMR</b>
          </div>
          <div class="hall-row">
            <span>#5 CYBER_NINJA (SHADOW NINJA)</span>
            <b>1190 MMR</b>
          </div>
        </div>
      </div>
    `;

    container.appendChild(modal);
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
      audioEngine.playModal(false);
      modal.remove();
    });
  }

  // 3. Yutuqlar (Achievements)
  openAchievementsModal() {
    audioEngine.playModal(true);
    const container = this.menuElement.querySelector('#modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-layer active';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>ACHIEVEMENTS // HARBIY YUTUQLAR</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="settings-grid">
          <div class="setting-row">
            <div><b>FIRST BLOOD</b><br><small style="color:var(--text-muted)">Ilk g'alabani qo'lga kiritish</small></div>
            <span style="color: var(--emerald);">✓ ERISHILDI</span>
          </div>
          <div class="setting-row">
            <div><b>PARRY MASTER</b><br><small style="color:var(--text-muted)">10 marta Mukammal Parry qaytarish</small></div>
            <span style="color: var(--gold);">6 / 10</span>
          </div>
          <div class="setting-row">
            <div><b>INFERNO RAMPAGE</b><br><small style="color:var(--text-muted)">5x Ultra kombo zarba berish</small></div>
            <span style="color: var(--gold);">ERISHISH MUMKIN</span>
          </div>
          <div class="setting-row">
            <div><b>SHADOW ASSASSIN</b><br><small style="color:var(--text-muted)">Raqib ortidan 3 marta teleport hujumi</small></div>
            <span style="color: var(--emerald);">✓ ERISHILDI</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(modal);
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
      audioEngine.playModal(false);
      modal.remove();
    });
  }

  // 4. MVP Ekrani
  showMvp(winner, stats, onRematch) {
    if (this.mvpElement) this.mvpElement.remove();

    const isP1Win = winner.id === 'p1';
    this.mvpElement = document.createElement('div');
    this.mvpElement.className = 'mvp-overlay';
    this.mvpElement.innerHTML = `
      <div class="mvp-card">
        <h1 class="${isP1Win ? 'win' : 'lose'}">${isP1Win ? 'MISSION ACCOMPLISHED // G\'ALABA' : 'MISSION FAILED // MAG\'LUBIYAT'}</h1>
        <h2 style="font-family: var(--font-display); margin-top: 8px; color: #ffffff;">${winner.name.toUpperCase()} CHEMPION!</h2>

        <div class="stats-grid">
          <div class="stat-item">
            <span>ENG UZUN KOMBO</span>
            <b>${stats.maxCombo}x COMBO</b>
          </div>
          <div class="stat-item">
            <span>MUKAMMAL PARRY</span>
            <b>${stats.parryCount}</b>
          </div>
          <div class="stat-item">
            <span>JAMI ZARAR</span>
            <b>${Math.round(stats.totalDamage)} HP</b>
          </div>
          <div class="stat-item">
            <span>ANIQLIK</span>
            <b>${stats.accuracy}%</b>
          </div>
        </div>

        <div class="mvp-actions">
          <button id="mvp-rematch" class="tactical-btn primary huge">
            <span>🔄 TEZKOR REVANSH</span>
          </button>
          <button id="mvp-menu" class="tactical-btn">
            <span>🏠 LOBBY</span>
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(this.mvpElement);

    this.mvpElement.querySelector('#mvp-rematch').addEventListener('click', () => {
      audioEngine.playClick();
      this.mvpElement.remove();
      this.mvpElement = null;
      if (onRematch) onRematch();
    });

    this.mvpElement.querySelector('#mvp-menu').addEventListener('click', () => {
      audioEngine.playClick();
      this.mvpElement.remove();
      this.mvpElement = null;
      this.show();
    });
  }
}
