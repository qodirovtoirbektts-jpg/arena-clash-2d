// Arena Clash 2D v3.2 — Advanced Cyber Tactical HUD (Inspired by Last Grid TD)
import { uz } from '../i18n/uz.js';

export class HUD {
  constructor(uiContainer) {
    this.container = uiContainer;
    this.bannerText = '';
    this.bannerTimer = 0;
    this.bannerType = 'normal'; // 'normal' | 'hazard' | 'boss'
    this.round = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;

    // Toast xabarlar steki (Pastki-chap)
    this.toasts = [];

    // Live Comms xabari
    this.currentCommsText = "ARENA TIZIMI TAYYOR // BARCHA SENSORLAR ONLAYN";
    this.commsElement = null;
    this.radarCanvas = null;
    this.radarCtx = null;
    this.toastContainer = null;
    this.radarAngle = 0;

    if (this.container) {
      this.initDomOverlays();
    }
  }

  initDomOverlays() {
    // 1. Live Comms Feed
    this.commsElement = document.createElement('div');
    this.commsElement.className = 'hud-live-comms';
    this.commsElement.innerHTML = `
      <div class="comms-header">
        <div class="comms-rec">
          <span class="rec-dot"></span>
          <span>LIVE COMMS // SEC-NET</span>
        </div>
        <div class="comms-equalizer">
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
        </div>
      </div>
      <div class="comms-text" id="comms-msg">${this.currentCommsText}</div>
    `;
    this.container.appendChild(this.commsElement);

    // 2. Mini-Radar (Yuqori-o'ng)
    const radarBox = document.createElement('div');
    radarBox.className = 'hud-mini-radar';
    radarBox.innerHTML = `<canvas class="radar-canvas" width="140" height="80"></canvas>`;
    this.container.appendChild(radarBox);
    this.radarCanvas = radarBox.querySelector('canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');

    // 3. Event Toast Stack (Pastki-chap)
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'hud-toast-stack';
    this.container.appendChild(this.toastContainer);
  }

  setCommsMessage(text) {
    this.currentCommsText = text;
    const el = document.getElementById('comms-msg');
    if (el) el.textContent = text;
  }

  addToast(text, type = 'gold') {
    const toast = { id: Date.now() + Math.random(), text, type, timer: 3.5 };
    this.toasts.push(toast);

    if (this.toastContainer) {
      const item = document.createElement('div');
      item.className = `toast-item ${type}`;
      item.textContent = text;
      item.dataset.id = toast.id;
      this.toastContainer.appendChild(item);

      setTimeout(() => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'all 0.3s ease';
        setTimeout(() => item.remove(), 300);
      }, 3200);
    }
  }

  showBanner(text, duration = 2.0, type = 'normal') {
    this.bannerText = text;
    this.bannerTimer = duration;
    this.bannerType = type;
  }

  update(dt, p1, p2) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    // Mini-Radar skaneri
    this.radarAngle += dt * 3.5;
    if (this.radarCtx && p1 && p2) {
      this.renderMiniRadar(p1, p2);
    }
  }

  renderMiniRadar(p1, p2) {
    const ctx = this.radarCtx;
    const w = 140;
    const h = 80;

    ctx.clearRect(0, 0, w, h);

    // Grid chiziqlari
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Skaner nuri
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(this.radarAngle);
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, 0.6);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    // 1-O'yinchi blip (Cyan / Olov)
    const p1RadarX = (p1.x / 1280) * (w - 16) + 8;
    const p1RadarY = (p1.y / 720) * (h - 16) + 8;
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p1RadarX, p1RadarY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 2-O'yinchi blip (Violet / Crimson)
    const p2RadarX = (p2.x / 1280) * (w - 16) + 8;
    const p2RadarY = (p2.y / 720) * (h - 16) + 8;
    ctx.fillStyle = '#ff2e54';
    ctx.shadowColor = '#ff2e54';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p2RadarX, p2RadarY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  render(ctx, p1, p2, roundTime = 90) {
    if (!p1 || !p2) return;

    // 1. Taktik Segmentli HP Barlar
    this.renderHealthBar(ctx, p1, 40, 36, false);
    this.renderHealthBar(ctx, p2, 1280 - 40 - 390, 36, true);
    this.renderTimerAndRounds(ctx, roundTime);

    // 2. Dinamik Kombo Hisoblagichi
    if (p1.currentComboCount >= 3) {
      this.renderCombo(ctx, p1.currentComboCount, 120, 160, p1.heroConfig.palette.accent);
    }
    if (p2.currentComboCount >= 3) {
      this.renderCombo(ctx, p2.currentComboCount, 1280 - 180, 160, p2.heroConfig.palette.accent);
    }

    // 3. Markaziy Hazard / Alert Banner ("RAUND 1 — JANG!")
    if (this.bannerTimer > 0 && this.bannerText) {
      this.renderHazardBanner(ctx);
    }

    // 4. Low-HP Vignette (<25% HP)
    if (p1.hp < p1.maxHp * 0.25 && !p1.isDead) {
      this.renderVignette(ctx);
    }
  }

  renderHealthBar(ctx, fighter, x, y, isRight) {
    const width = 390;
    const height = 24;

    ctx.save();
    ctx.translate(x, y);

    // Chamfered poligon foni
    ctx.fillStyle = 'rgba(11, 19, 36, 0.95)';
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.4)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(0, 0);
      ctx.lineTo(width - 12, 0);
      ctx.lineTo(width, 12);
      ctx.lineTo(width, height);
      ctx.lineTo(12, height);
      ctx.lineTo(0, height - 12);
    } else {
      ctx.moveTo(12, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, height - 12);
      ctx.lineTo(width - 12, height);
      ctx.lineTo(0, height);
      ctx.lineTo(0, 12);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ghost HP (Oltin sariq kechikuvchi qatlam)
    const ghostPercent = Math.max(0, fighter.ghostHp / fighter.maxHp);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.65)';
    if (isRight) {
      ctx.fillRect(width * (1 - ghostPercent) + 2, 2, width * ghostPercent - 4, height - 4);
    } else {
      ctx.fillRect(2, 2, width * ghostPercent - 4, height - 4);
    }

    // Jonli HP (Neon gradient)
    const hpPercent = Math.max(0, fighter.hp / fighter.maxHp);
    ctx.fillStyle = fighter.heroConfig.palette.accent;
    ctx.shadowColor = fighter.heroConfig.palette.glow;
    ctx.shadowBlur = 10;
    if (isRight) {
      ctx.fillRect(width * (1 - hpPercent) + 2, 2, width * hpPercent - 4, height - 4);
    } else {
      ctx.fillRect(2, 2, width * hpPercent - 4, height - 4);
    }
    ctx.shadowBlur = 0;

    // Segment chiziqlari (Har 10% da ajratuvchi vertikal chiziq)
    ctx.strokeStyle = 'rgba(5, 8, 16, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 10; i++) {
      const segX = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(segX, 2);
      ctx.lineTo(segX, height - 2);
      ctx.stroke();
    }

    ctx.restore();

    // Qahramon nomi va HP matni
    ctx.save();
    ctx.fillStyle = '#eaf6ff';
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.textBaseline = 'bottom';
    if (isRight) {
      ctx.textAlign = 'right';
      ctx.fillText(fighter.name.toUpperCase(), x + width, y - 6);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(fighter.name.toUpperCase(), x, y - 6);
    }
    ctx.restore();
  }

  renderTimerAndRounds(ctx, roundTime) {
    ctx.save();
    ctx.translate(640, 48);

    // Taymer qutisi (Chamfered)
    ctx.fillStyle = 'rgba(11, 19, 36, 0.95)';
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-45, -20, 90, 40);
    ctx.strokeRect(-45, -20, 90, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.fillText(String(Math.ceil(roundTime)).padStart(2, '0'), 0, 0);

    // Raund olmoslari
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < this.p1Wins ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
      ctx.shadowColor = i < this.p1Wins ? '#00e5ff' : 'transparent';
      ctx.shadowBlur = 8;
      ctx.fillRect(-65 - i * 18, -6, 12, 12);

      ctx.fillStyle = i < this.p2Wins ? '#ff2e54' : 'rgba(255, 255, 255, 0.2)';
      ctx.shadowColor = i < this.p2Wins ? '#ff2e54' : 'transparent';
      ctx.fillRect(53 + i * 18, -6, 12, 12);
    }
    ctx.restore();
  }

  renderCombo(ctx, count, x, y, color) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(11, 19, 36, 0.88)';
    ctx.strokeStyle = color || '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-10, -22, 160, 40);
    ctx.strokeRect(-10, -22, 160, 40);

    ctx.fillStyle = color || '#00e5ff';
    ctx.font = '900 24px "Orbitron", sans-serif';
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillText(`${count}x COMBO!`, 6, 6);
    ctx.restore();
  }

  renderHazardBanner(ctx) {
    ctx.save();
    ctx.translate(640, 260);

    // To'liq kenglikdagi ogohlantirish lentasi
    ctx.fillStyle = 'rgba(11, 19, 36, 0.94)';
    ctx.fillRect(-640, -42, 1280, 84);

    // Diagonal chevrons
    ctx.strokeStyle = this.bannerType === 'boss' ? '#ff2e54' : '#ffd166';
    ctx.lineWidth = 3;
    ctx.strokeRect(-640, -42, 1280, 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.bannerType === 'boss' ? '#ff2e54' : '#00e5ff';
    ctx.shadowBlur = 24;
    ctx.fillText(this.bannerText, 0, 0);

    ctx.restore();
  }

  renderVignette(ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(640, 360, 360, 640, 360, 720);
    grad.addColorStop(0, 'rgba(255, 46, 84, 0)');
    grad.addColorStop(1, 'rgba(255, 46, 84, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }
}
