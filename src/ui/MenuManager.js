// Arena Clash 2D v3.2 — Bosh Menyu va Oqim Boshqaruvchisi (MenuManager.js)
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
    this.selectedMode = 'vsBot'; // 'vsBot' | 'localP2'

    this.menuElement = null;
    this.mvpElement = null;
    this.init();
  }

  init() {
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'menu-root';
    this.menuElement.className = 'menu-overlay';

    this.menuElement.innerHTML = `
      <div class="menu-content">
        <div class="game-logo">
          <h1>${uz.appName}</h1>
          <p class="tagline">${uz.tagline}</p>
        </div>

        <div class="mode-selector">
          <button class="mode-card active" data-mode="vsBot">
            <span class="icon">🤖</span>
            <h3>${uz.menu.vsBot}</h3>
            <p>Aqlli AI gladiatoriga qarshi duel</p>
          </button>
          <button class="mode-card" data-mode="localP2">
            <span class="icon">👥</span>
            <h3>${uz.menu.localP2}</h3>
            <p>Bitta klaviaturada do'st bilan jang</p>
          </button>
        </div>

        <div class="hero-selection">
          <h2>${uz.menu.selectHero}</h2>
          <div class="hero-cards">
            ${Object.values(HEROES_CONFIG).map(h => `
              <div class="hero-card ${h.id === this.selectedHeroP1 ? 'selected' : ''}" data-hero="${h.id}">
                <div class="hero-badge" style="background: ${h.palette.accent}"></div>
                <h3>${h.name}</h3>
                <span class="hero-role">${h.role.toUpperCase()}</span>
                <div class="hero-stats">
                  <span>HP: ${h.maxHp}</span>
                  <span>Tezlik: ${h.speed}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="action-bar">
          <button id="btn-start-fight" class="skew-btn primary huge">
            <span>⚔️ ${uz.menu.startFight}</span>
          </button>
        </div>

        <div class="controls-hint">
          <span>🎮 1-O'yinchi: <b>WASD</b> + <b>J</b> (Yengil), <b>K</b> (Og'ir), <b>L</b> (Skill), <b>Shift</b> (Dodge), <b>U</b> (Parry)</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.menuElement);
    this.setupEvents();
  }

  setupEvents() {
    // Rejim tanlash
    const modeCards = this.menuElement.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedMode = card.dataset.mode;
        audioEngine.playClick();
      });
    });

    // Qahramon tanlash
    const heroCards = this.menuElement.querySelectorAll('.hero-card');
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
      audioEngine.playClick();
      this.hide();
      if (this.onStartFight) {
        this.onStartFight(this.selectedMode, this.selectedHeroP1, this.selectedHeroP2);
      }
    });
  }

  show() {
    this.menuElement.style.display = 'flex';
  }

  hide() {
    this.menuElement.style.display = 'none';
  }

  // MVP Ekrani (Jang yakunlanganda)
  showMvp(winner, stats, onRematch) {
    if (this.mvpElement) this.mvpElement.remove();

    const isP1Win = winner.id === 'p1';
    this.mvpElement = document.createElement('div');
    this.mvpElement.className = 'mvp-overlay';
    this.mvpElement.innerHTML = `
      <div class="mvp-card">
        <h1 class="${isP1Win ? 'win' : 'lose'}">${isP1Win ? uz.mvp.victoryTitle : uz.mvp.defeatTitle}</h1>
        <h2>${winner.name} G'alaba Qozondi!</h2>

        <div class="stats-grid">
          <div class="stat-item">
            <span>${uz.mvp.maxCombo}</span>
            <b>${stats.maxCombo} ZARBA</b>
          </div>
          <div class="stat-item">
            <span>${uz.mvp.parryCount}</span>
            <b>${stats.parryCount}</b>
          </div>
          <div class="stat-item">
            <span>${uz.mvp.totalDamage}</span>
            <b>${Math.round(stats.totalDamage)} HP</b>
          </div>
          <div class="stat-item">
            <span>${uz.mvp.accuracy}</span>
            <b>${stats.accuracy}%</b>
          </div>
        </div>

        <div class="mvp-actions">
          <button id="mvp-rematch" class="skew-btn primary">
            <span>🔄 ${uz.mvp.rematchBtn}</span>
          </button>
          <button id="mvp-menu" class="skew-btn">
            <span>🏠 ${uz.mvp.menuBtn}</span>
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
