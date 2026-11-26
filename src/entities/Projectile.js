// Arena Clash 2D v3.2 — Snaryadlar Tizimi (Projectile.js)
export class Projectile {
  constructor(options) {
    this.ownerId = options.ownerId; // 'p1' | 'p2'
    this.type = options.type;       // 'kunai' | 'frost_bolt' | 'frost_shard' | 'fire_wave'
    this.element = options.element; // 'shadow' | 'frost' | 'fire'

    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx;
    this.vy = options.vy || 0;
    this.radius = options.radius || 10;
    this.damage = options.damage || 12;
    this.life = options.life || 1.5;
    this.slowDuration = options.slowDuration || 0;
    this.slowPercent = options.slowPercent || 0;

    this.isActive = true;
    this.trailTimer = 0;
  }

  update(dt, particleSystem) {
    if (!this.isActive) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.isActive = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Dum zarralari (Trail)
    this.trailTimer += dt;
    if (this.trailTimer > 0.04 && particleSystem) {
      this.trailTimer = 0;
      let color = '#FF5A1F';
      if (this.element === 'shadow') color = '#A855F7';
      if (this.element === 'frost') color = '#22D3EE';

      particleSystem.emit('spark', this.x, this.y, 2, {
        color,
        size: 3,
        life: 0.25,
        speed: 20,
      });
    }

    // Devorlar bilan to'qnashuv
    if (this.x < 30 || this.x > 1250) {
      this.isActive = false;
      if (particleSystem) {
        particleSystem.emit('spark', this.x, this.y, 6, {
          color: this.element === 'frost' ? '#22D3EE' : '#FFAA00',
          speed: 140,
        });
      }
    }
  }

  // O'yinchi bilan to'qnashuvni tekshirish
  checkHit(fighter) {
    if (!this.isActive || fighter.id === this.ownerId || fighter.isDead || fighter.isInvulnerable) {
      return false;
    }

    const hurtbox = fighter.getHurtbox();
    const closestX = Math.max(hurtbox.x, Math.min(this.x, hurtbox.x + hurtbox.width));
    const closestY = Math.max(hurtbox.y, Math.min(this.y, hurtbox.y + hurtbox.height));
    const dx = this.x - closestX;
    const dy = this.y - closestY;

    if (dx * dx + dy * dy < this.radius * this.radius) {
      this.isActive = false;
      return true;
    }
    return false;
  }

  render(ctx) {
    if (!this.isActive) return;
    ctx.save();

    if (this.type === 'kunai') {
      ctx.fillStyle = '#C084FC';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.element === 'frost') {
      ctx.fillStyle = '#E0F2FE';
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFAA00';
      ctx.shadowColor = '#FF5A1F';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
