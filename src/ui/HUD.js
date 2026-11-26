// Arena Clash 2D v3.2 — Professional Jang Ichi Interfeysi (HUD.js)
import { uz } from '../i18n/uz.js';

export class HUD {
  constructor() {
    this.bannerText = '';
    this.bannerTimer = 0;
    this.round = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
  }

  showBanner(text, duration = 2.0) {
    this.bannerText = text;
    this.bannerTimer = duration;
  }

  update(dt) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }
  }

  render(ctx, p1, p2, roundTime = 90) {
    if (!p1 || !p2) return;

    // 1. Yuqori HP Barlar va Taymer
    this.renderHealthBar(ctx, p1, 40, 36, false);
    this.renderHealthBar(ctx, p2, 1280 - 40 - 380, 36, true);
    this.renderTimerAndRounds(ctx, roundTime);

    // 2. Dinamik Kombo Hisoblagichi
    if (p1.currentComboCount >= 3) {
      this.renderCombo(ctx, p1.currentComboCount, 120, 150, p1.heroConfig.palette.accent);
    }
    if (p2.currentComboCount >= 3) {
      this.renderCombo(ctx, p2.currentComboCount, 1280 - 180, 150, p2.heroConfig.palette.accent);
    }

    // 3. Markaziy Raund Banneri ("RAUND 1 — JANG!")
    if (this.bannerTimer > 0 && this.bannerText) {
      ctx.save();
      ctx.translate(640, 260);
      ctx.transform(1, 0, -0.14, 1, 0, 0); // Dynamic Skew

      // Orqa fon chizig'i
      ctx.fillStyle = 'rgba(13, 14, 18, 0.88)';
      ctx.fillRect(-320, -36, 640, 72);
      ctx.strokeStyle = '#FF5A1F';
      ctx.lineWidth = 3;
      ctx.strokeRect(-320, -36, 640, 72);

      // Matn
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FF5A1F';
      ctx.shadowBlur = 18;
      ctx.fillText(this.bannerText, 0, 0);
      ctx.restore();
    }

    // 4. Low-HP Vignette (<25% HP)
    if (p1.hp < p1.maxHp * 0.25 && !p1.isDead) {
      this.renderVignette(ctx);
    }
  }

  renderHealthBar(ctx, fighter, x, y, isRight) {
    const width = 380;
    const height = 24;

    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, isRight ? 0.14 : -0.14, 1, 0, 0); // Dynamic Skew

    // Fon
    ctx.fillStyle = 'rgba(20, 24, 34, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Ghost HP (Oq/Sariq kechikuvchi qatlam)
    const ghostPercent = Math.max(0, fighter.ghostHp / fighter.maxHp);
    ctx.fillStyle = '#FBBF24';
    if (isRight) {
      ctx.fillRect(width * (1 - ghostPercent), 0, width * ghostPercent, height);
    } else {
      ctx.fillRect(0, 0, width * ghostPercent, height);
    }

    // Jonli HP (Rang qahramon elementiga mos)
    const hpPercent = Math.max(0, fighter.hp / fighter.maxHp);
    ctx.fillStyle = fighter.heroConfig.palette.accent;
    if (isRight) {
      ctx.fillRect(width * (1 - hpPercent), 0, width * hpPercent, height);
    } else {
      ctx.fillRect(0, 0, width * hpPercent, height);
    }

    // Chegara
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Qahramon nomi va HP raqamlari
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textBaseline = 'bottom';
    if (isRight) {
      ctx.textAlign = 'right';
      ctx.fillText(fighter.name, x + width, y - 6);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(fighter.name, x, y - 6);
    }
    ctx.restore();
  }

  renderTimerAndRounds(ctx, roundTime) {
    ctx.save();
    ctx.translate(640, 48);

    // Taymer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(String(Math.ceil(roundTime)), 0, 0);

    // Raund olmoslari (P1 g'alabalari chapda, P2 o'ngda)
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < this.p1Wins ? '#FF5A1F' : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(-55 - i * 18, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = i < this.p2Wins ? '#FF5A1F' : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(55 + i * 18, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderCombo(ctx, count, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -0.14, 1, 0, 0);

    ctx.fillStyle = color || '#FF5A1F';
    ctx.font = '900 28px sans-serif';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillText(`${count} ZARBA!`, 0, 0);
    ctx.restore();
  }

  renderVignette(ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(640, 360, 400, 640, 360, 720);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }
}
