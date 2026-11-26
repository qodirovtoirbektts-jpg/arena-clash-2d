// Arena Clash 2D v3.2 — Human Handcrafted Menu & Lobby Manager
import { uz } from '../i18n/uz.js';
import { HEROES_CONFIG } from '../entities/heroes.config.js';
import { audioEngine } from '../core/AudioEngine.js';

export class MenuManager {
  constructor(rootContainer, onStartFight, onSelectHero) {
    this.container = rootContainer;
    this.onStartFight = onStartFight;
    this.onSelectHero = onSelectHero;

    this.selectedHeroP1 = 'blaze_knight';
    this.selectedHeroP2 = 'shadow_ninja';
    this.selectedMode = 'vsBot';

    this.menuElement = null;
    this.mvpElement = null;

    this.init();
  }

  init() {
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'menu-root';
    this.menuElement.className = 'menu-overlay';

    this.menuElement.innerHTML = `
      <div class="menu-top-bar">
        <div class="menu-brand">
          <span class="menu-brand-tag">ARENA CLASH 2D v3.2</span>
          <h1>JANG MAYDONI</h1>
        </div>
        <div class="menu-top-actions">
          <button class="tactical-btn" id="btn-open-settings">
            <span>⚙️ SOZLAMALAR</span>
          </button>
          <button class="tactical-btn" id="btn-open-hall">
            <span>🏆 REYTING</span>
          </button>
          <button class="tactical-btn" id="btn-open-achieve">
            <span>🎖️ YUTUQLAR</span>
          </button>
        </div>
      </div>

      <div class="menu-center-grid">
        <div class="mode-column">
          <div class="mode-tile active" data-mode="vsBot">
            <div class="icon-medallion">⚔️</div>
            <div class="mode-tile-text">
              <h3>YAKKA JANG (BOTGA QARSHI)</h3>
              <p>Tajribali gladiator AI bilan jang qiling</p>
            </div>
          </div>

          <div class="mode-tile" data-mode="localP2">
            <div class="icon-medallion">👥</div>
            <div class="mode-tile-text">
              <h3>2-O'YINCHI (DO'ST BILAN DUEL)</h3>
              <p>Bitta klaviaturada do'stingiz bilan haqiqiy bellashuv</p>
            </div>
          </div>

          <div class="mode-tile" data-mode="chaos">
            <div class="icon-medallion">🔥</div>
            <div class="mode-tile-text">
              <h3>XAOS REJIMI (QOIDASIZ)</h3>
              <p>Zulmat, ko'tariluvchi lava va oy gravitatsiyasi</p>
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
                  <div class="spec-row"><span>ZARBA</span><b>${h.combat.heavyAttack.damage} DMG</b></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="menu-bottom-dock" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="controls-hint" style="color: var(--text-dim); font-family: var(--font-display); font-size: 0.88rem;">
          [Boshqaruv]: <b>W A S D</b> (Harakat/Sakrash) + <b>J</b> (Yengil) <b>K</b> (Og'ir) <b>L</b> (Skill) <b>Shift</b> (Dodge) <b>U</b> (Parry)
        </div>

        <button id="btn-start-fight" class="tactical-btn primary huge">
          <span>⚔️ JANGNI BOSHLASH</span>
        </button>
      </div>

      <div id="modal-container"></div>
    `;

    this.container.appendChild(this.menuElement);
    this.setupEvents();
  }

  setupEvents() {
    // Rejim tanlash
    const modeTiles = this.menuElement.querySelectorAll('.mode-tile');
    modeTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        modeTiles.forEach(t => t.classList.remove('active'));
        tile.classList.add('active');
        this.selectedMode = tile.dataset.mode;
        audioEngine.playClick();
      });
    });

    // Qahramon tanlash
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

    // Boshlash tugmasi
    const startBtn = this.menuElement.querySelector('#btn-start-fight');
    startBtn.addEventListener('click', () => {
      audioEngine.playTacticalVoice('engage');
      this.hide();
      if (this.onStartFight) {
        this.onStartFight(this.selectedMode, this.selectedHeroP1, this.selectedHeroP2);
      }
    });

    // Modallarni ochish
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

  openSettingsModal() {
    audioEngine.playModal(true);
    const container = this.menuElement.querySelector('#modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-layer active';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>O'YIN SOZLAMALARI</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="settings-grid">
          <div class="setting-row">
            <span>RETRO CRT EKRAN EFFEKTI</span>
            <div class="setting-options">
              <button class="opt-pill ${document.getElementById('game-container').classList.contains('crt-enabled') ? 'active' : ''}" data-crt="on">YOQIQ</button>
              <button class="opt-pill ${!document.getElementById('game-container').classList.contains('crt-enabled') ? 'active' : ''}" data-crt="off">O'CHIQ</button>
            </div>
          </div>
          <div class="setting-row">
            <span>FON MUSIQASI (SYNTH BGM)</span>
            <div class="setting-options">
              <button class="opt-pill active" data-bgm="on">YOQIQ</button>
              <button class="opt-pill" data-bgm="off">O'CHIQ</button>
            </div>
          </div>
          <div class="setting-row">
            <span>EKRAN TEBRANISHI (SCREEN SHAKE)</span>
            <div class="setting-options">
              <button class="opt-pill active">100%</button>
              <button class="opt-pill">50%</button>
              <button class="opt-pill">0%</button>
            </div>
          </div>
        </div>
        <button class="tactical-btn emerald" id="settings-close-apply">
          <span>SAQLASH VA YOPISH</span>
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

    modal.querySelectorAll('[data-crt]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('[data-crt]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const gameCont = document.getElementById('game-container');
        if (btn.dataset.crt === 'on') gameCont.classList.add('crt-enabled');
        else gameCont.classList.remove('crt-enabled');
        audioEngine.playClick();
      });
    });

    modal.querySelectorAll('[data-bgm]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('[data-bgm]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        audioEngine.bgmEnabled = btn.dataset.bgm === 'on';
        audioEngine.playClick();
      });
    });
  }

  openHallModal() {
    audioEngine.playModal(true);
    const container = this.menuElement.querySelector('#modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-layer active';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>REYTING JADVALI (HALL OF FAME)</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="hall-grid">
          <div class="hall-row gold">
            <span>#1 TEMUR_PRO (OLOVLI RITSAR)</span>
            <b>1420 MMR</b>
          </div>
          <div class="hall-row silver">
            <span>#2 SARDOR_SHINOBI (SOYA QOTILI)</span>
            <b>1385 MMR</b>
          </div>
          <div class="hall-row bronze">
            <span>#3 SARVAR_CRYO (MUZ SEHRGARI)</span>
            <b>1310 MMR</b>
          </div>
          <div class="hall-row">
            <span>#4 BEKZOD_TANK</span>
            <b>1240 MMR</b>
          </div>
          <div class="hall-row">
            <span>#5 QODIR_FURY</span>
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

  openAchievementsModal() {
    audioEngine.playModal(true);
    const container = this.menuElement.querySelector('#modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-layer active';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>JANGCHI YUTUQLARI</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="settings-grid">
          <div class="setting-row">
            <div><b>ILK G'ALABA (FIRST BLOOD)</b><br><small style="color:var(--text-muted)">Birinchi raundda dushmanni mag'lub eting</small></div>
            <span style="color: var(--emerald);">✓ ERISHILDI</span>
          </div>
          <div class="setting-row">
            <div><b>PARRY USTASI</b><br><small style="color:var(--text-muted)">10 marta Mukammal Parry qaytarish</small></div>
            <span style="color: var(--gold);">6 / 10</span>
          </div>
          <div class="setting-row">
            <div><b>TO'XTATIB BO'LMAS</b><br><small style="color:var(--text-muted)">5x Ultra Kombo zarba bering</small></div>
            <span style="color: var(--gold);">ERISHISH MUMKIN</span>
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

  showMvp(winner, stats, onRematch) {
    if (this.mvpElement) this.mvpElement.remove();

    const isP1Win = winner.id === 'p1';
    this.mvpElement = document.createElement('div');
    this.mvpElement.className = 'mvp-overlay';
    this.mvpElement.innerHTML = `
      <div class="mvp-card">
        <h1 class="${isP1Win ? 'win' : 'lose'}">${isP1Win ? 'G\'ALABA QOZONDINGIZ!' : 'MAG\'LUBIYAT!'}</h1>
        <h2 style="font-family: var(--font-display); margin-top: 8px; color: #ffffff;">${winner.name.toUpperCase()} JANG G'OLIBI!</h2>

        <div class="stats-grid">
          <div class="stat-item">
            <span>ENG UZUN KOMBO</span>
            <b>${stats.maxCombo}x ZARBA</b>
          </div>
          <div class="stat-item">
            <span>MUKAMMAL PARRY</span>
            <b>${stats.parryCount} MARTA</b>
          </div>
          <div class="stat-item">
            <span>JAMI YETKAZILGAN ZARAR</span>
            <b>${Math.round(stats.totalDamage)} HP</b>
          </div>
          <div class="stat-item">
            <span>ZARBA ANIQLIGI</span>
            <b>${stats.accuracy}%</b>
          </div>
        </div>

        <div class="mvp-actions">
          <button id="mvp-rematch" class="tactical-btn primary huge">
            <span>🔄 TEZKOR REVANSH BER!</span>
          </button>
          <button id="mvp-menu" class="tactical-btn">
            <span>🏠 BOSH MENYU</span>
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
