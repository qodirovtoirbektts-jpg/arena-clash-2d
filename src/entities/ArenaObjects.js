// Arena Clash 2D v3.2 — Arena Obyektlari (ArenaObjects.js)
export class ArenaObjects {
  constructor() {
    // 1. Sinadigan va qayta tiklanadigan platformalar
    this.platforms = [
      {
        id: 'left_plat',
        x: 180, y: 390, width: 220, height: 16,
        maxHp: 3, hp: 3, isBroken: false, respawnTimer: 0
      },
      {
        id: 'right_plat',
        x: 880, y: 390, width: 220, height: 16,
        maxHp: 3, hp: 3, isBroken: false, respawnTimer: 0
      },
      {
        id: 'mid_plat',
        x: 480, y: 270, width: 320, height: 16,
        maxHp: 999, hp: 999, isBroken: false, respawnTimer: 0 // Markaziy mustahkam
      }
    ];

    // 2. Power-up Sferalari (Har 15 soniyada markazda paydo bo'ladi)
    this.powerupTimer = 15.0;
    this.activePowerup = null; // { type: 'health' | 'damage', x, y, radius: 18, bobAngle: 0 }

    // 3. Ko'tarilayotgan Lava (Xaos rejimi yoki oxirgi 15s)
    this.isLavaRising = false;
    this.lavaY = 720;
    this.targetLavaY = 720;
  }

  damagePlatform(platformId, damage = 1, particleSystem) {
    const plat = this.platforms.find(p => p.id === platformId);
    if (!plat || plat.isBroken || plat.maxHp > 100) return;

    plat.hp -= damage;
    if (particleSystem) {
      particleSystem.emit('spark', plat.x + plat.width / 2, plat.y, 8, {
        color: '#D1D5DB',
        speed: 120
      });
    }

    if (plat.hp <= 0) {
      plat.isBroken = true;
      plat.respawnTimer = 10.0; // 10 soniyadan keyin qayta tiklanadi
      if (particleSystem) {
        particleSystem.emit('smoke', plat.x + plat.width / 2, plat.y, 16, {
          color: '#6B7280',
          size: 8,
          speed: 180
        });
      }
    }
  }

  update(dt, particleSystem) {
    // 1. Platformalar tiklanishi
    for (const plat of this.platforms) {
      if (plat.isBroken) {
        plat.respawnTimer -= dt;
        if (plat.respawnTimer <= 0) {
          plat.isBroken = false;
          plat.hp = plat.maxHp;
          if (particleSystem) {
            particleSystem.emit('spark', plat.x + plat.width / 2, plat.y, 12, {
              color: '#34D399',
              speed: 150
            });
          }
        }
      }
    }

    // 2. Power-up taymeri
    if (!this.activePowerup) {
      this.powerupTimer -= dt;
      if (this.powerupTimer <= 0) {
        this.powerupTimer = 15.0;
        const type = Math.random() < 0.5 ? 'health' : 'damage';
        this.activePowerup = {
          type,
          x: 640,
          y: 220,
          baseY: 220,
          radius: 18,
          bobAngle: 0,
        };
      }
    } else {
      this.activePowerup.bobAngle += dt * 3;
      this.activePowerup.y = this.activePowerup.baseY + Math.sin(this.activePowerup.bobAngle) * 8;
    }

    // 3. Lava ko'tarilishi
    if (this.isLavaRising) {
      this.targetLavaY = 560; // Pastki 160px maydonni egallaydi
      this.lavaY += (this.targetLavaY - this.lavaY) * Math.min(1, dt * 0.5);
    } else {
      this.lavaY = 720;
    }
  }

  // Power-up ni yig'ish tekshiruvi
  checkPowerupPickup(fighter, particleSystem) {
    if (!this.activePowerup || fighter.isDead) return;

    const dx = fighter.x - this.activePowerup.x;
    const dy = (fighter.y - 40) - this.activePowerup.y;
    if (dx * dx + dy * dy < (this.activePowerup.radius + 30) ** 2) {
      const type = this.activePowerup.type;
      this.activePowerup = null;

      if (type === 'health') {
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + 20);
        if (particleSystem) {
          particleSystem.addDamageText(fighter.x, fighter.y - 40, '+20 HP', '#10B981', true);
        }
      } else {
        fighter.damageBuffTimer = 6.0;
        if (particleSystem) {
          particleSystem.addDamageText(fighter.x, fighter.y - 40, '+25% ZARAR', '#F59E0B', true);
        }
      }
    }
  }

  render(ctx) {
    // 1. Platformalar
    for (const plat of this.platforms) {
      if (plat.isBroken) continue;
      ctx.save();
      ctx.fillStyle = '#2D3748';
      ctx.strokeStyle = '#4A5568';
      ctx.lineWidth = 2;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

      // Ziyon ko'rsatkichi (yoriqlar)
      if (plat.hp < plat.maxHp) {
        ctx.strokeStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(plat.x + 30, plat.y);
        ctx.lineTo(plat.x + 50, plat.y + plat.height);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Power-up sferasi
    if (this.activePowerup) {
      ctx.save();
      const p = this.activePowerup;
      const isHp = p.type === 'health';
      ctx.shadowColor = isHp ? '#10B981' : '#F59E0B';
      ctx.shadowBlur = 18;
      ctx.fillStyle = isHp ? '#34D399' : '#FBBF24';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ikonka
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isHp ? '♥' : '⚔', p.x, p.y);
      ctx.restore();
    }

    // 3. Ko'tarilayotgan Lava
    if (this.isLavaRising && this.lavaY < 720) {
      ctx.save();
      const grad = ctx.createLinearGradient(0, this.lavaY, 0, 720);
      grad.addColorStop(0, '#FF4500');
      grad.addColorStop(0.3, '#DC2626');
      grad.addColorStop(1, '#7F1D1D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, this.lavaY, 1280, 720 - this.lavaY);
      ctx.restore();
    }
  }
}
