// Arena Clash 2D v3.2 — Dinamik Kamera Tizimi (Camera.js)
export class Camera {
  constructor(virtualWidth = 1280, virtualHeight = 720) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    this.x = virtualWidth / 2;
    this.y = virtualHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    // Zoom (0.85x – 1.25x)
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.minZoom = 0.82;
    this.maxZoom = 1.25;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 16; // Sekundiga kamayish
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // KO Dramatic Zoom
    this.koTimer = 0;
    this.koTarget = null;
  }

  triggerShake(intensity = 8) {
    this.shakeIntensity = Math.min(24, Math.max(this.shakeIntensity, intensity));
  }

  triggerKo(targetPlayer) {
    this.koTimer = 1.0;
    this.koTarget = targetPlayer;
  }

  update(dt, p1, p2) {
    if (!p1 || !p2) return;

    // 1. KO Rejimi (Dramatik fokus)
    if (this.koTimer > 0) {
      this.koTimer -= dt;
      if (this.koTarget) {
        this.targetX = this.koTarget.x;
        this.targetY = this.koTarget.y - 40;
        this.targetZoom = 1.35;
      }
    } else {
      // 2. Ikkala jangchi markazini kuzatish
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 40;

      // Maydon chegaralari ichida ushlab turish
      this.targetX = Math.max(480, Math.min(800, midX));
      this.targetY = Math.max(280, Math.min(420, midY));

      // 3. Masofaga qarab dinamik zoom
      const distX = Math.abs(p1.x - p2.x);
      const distY = Math.abs(p1.y - p2.y);
      const maxDist = Math.max(distX, distY * 1.5);

      if (maxDist > 650) {
        this.targetZoom = Math.max(this.minZoom, 1.0 - (maxDist - 650) / 900);
      } else if (maxDist < 300) {
        this.targetZoom = Math.min(this.maxZoom, 1.0 + (300 - maxDist) / 600);
      } else {
        this.targetZoom = 1.0;
      }
    }

    // Smooth Lerp
    this.x += (this.targetX - this.x) * Math.min(1, dt * 6);
    this.y += (this.targetY - this.y) * Math.min(1, dt * 6);
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 5);

    // 4. Screen Shake yangilanishi
    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= this.shakeDecay * dt;
      if (this.shakeIntensity < 0) this.shakeIntensity = 0;

      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  // Render kontekstiga kamera transformatsiyasini qo'llash
  apply(ctx) {
    ctx.save();
    ctx.translate(this.virtualWidth / 2, this.virtualHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);
  }

  restore(ctx) {
    ctx.restore();
  }
}
