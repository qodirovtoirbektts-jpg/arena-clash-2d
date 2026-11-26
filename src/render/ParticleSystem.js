// Arena Clash 2D v3.2 — Object-Pooled Zarralar Tizimi (ParticleSystem.js)
export class ParticleSystem {
  constructor(maxParticles = 200) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.pool = [];
    this.floatingTexts = [];

    for (let i = 0; i < maxParticles; i++) {
      this.pool.push({
        active: false,
        x: 0, y: 0,
        vx: 0, vy: 0,
        size: 2,
        color: '#FFFFFF',
        alpha: 1,
        life: 0,
        maxLife: 1,
        type: 'spark',
        drag: 0.98,
        gravity: 0,
      });
    }
  }

  setMaxParticles(limit) {
    this.maxParticles = limit;
  }

  emit(type, x, y, count = 1, options = {}) {
    for (let i = 0; i < count; i++) {
      const p = this.pool.pop() || { active: false };
      p.active = true;
      p.type = type;
      p.x = x + (Math.random() * 16 - 8);
      p.y = y + (Math.random() * 16 - 8);
      p.maxLife = options.life || (0.3 + Math.random() * 0.4);
      p.life = p.maxLife;
      p.alpha = 1.0;
      p.color = options.color || '#FF5A1F';
      p.size = options.size || (2 + Math.random() * 4);
      p.drag = options.drag || 0.96;
      p.gravity = options.gravity || 200;

      const speed = options.speed || (100 + Math.random() * 200);
      const angle = options.angle !== undefined ? options.angle + (Math.random() * 0.6 - 0.3) : Math.random() * Math.PI * 2;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;

      this.particles.push(p);
      if (this.particles.length > this.maxParticles) {
        const oldest = this.particles.shift();
        oldest.active = false;
        this.pool.push(oldest);
      }
    }
  }

  // Suzuvchi zarar raqamlari
  addDamageText(x, y, text, color = '#FF4757', isCrit = false) {
    this.floatingTexts.push({
      x: x + (Math.random() * 24 - 12),
      y: y - 20,
      text: String(text),
      color,
      isCrit,
      size: isCrit ? 26 : 18,
      life: 0.8,
      maxLife: 0.8,
      vy: -60,
    });
  }

  update(dt) {
    // 1. Zarralar yangilanishi
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.pool.push(p);
        this.particles.splice(i, 1);
        continue;
      }

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // 2. Suzuvchi matnlar
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
    }
  }

  render(ctx) {
    // Zarralar
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.type === 'smoke' || p.type === 'steam') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - p.alpha), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Suzuvchi zarar matnlari
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, ft.life / (ft.maxLife * 0.5));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
