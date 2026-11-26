// Arena Clash 2D v3.2 — Kinematik Yaqin Kamera Tizimi (Cinematic Close-Up Camera)
export class Camera {
  constructor(virtualWidth = 1280, virtualHeight = 720) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    this.x = virtualWidth / 2;
    this.y = 440;
    this.targetX = this.x;
    this.targetY = this.y;

    // Kinematik yaqin zoom (1.30x – 1.80x) — jangchilar ekranda yirik va aniq ko'rinadi
    this.zoom = 1.45;
    this.targetZoom = 1.45;
    this.minZoom = 1.25;
    this.maxZoom = 1.80;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 18;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // KO Dramatic Zoom (2.1x)
    this.koTimer = 0;
    this.koTarget = null;
  }

  triggerShake(intensity = 10) {
    this.shakeIntensity = Math.min(26, Math.max(this.shakeIntensity, intensity));
  }

  triggerKo(targetPlayer) {
    this.koTimer = 1.0;
    this.koTarget = targetPlayer;
  }

  update(dt, p1, p2) {
    if (!p1 || !p2) return;

    // 1. KO Rejimi (O'ta yaqin dramatik fokus)
    if (this.koTimer > 0) {
      this.koTimer -= dt;
      if (this.koTarget) {
        this.targetX = this.koTarget.x;
        this.targetY = this.koTarget.y - 50;
        this.targetZoom = 2.10;
      }
    } else {
      // 2. Ikkala jangchi markazini yaqindan kuzatish
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - 50;

      // Maydon chegaralari ichida ushlab turish
      this.targetX = Math.max(340, Math.min(940, midX));
      this.targetY = Math.max(360, Math.min(480, midY));

      // 3. Masofaga qarab kinematik zoom
      const distX = Math.abs(p1.x - p2.x);
      const distY = Math.abs(p1.y - p2.y);
      const maxDist = Math.max(distX, distY * 1.4);

      if (maxDist > 550) {
        this.targetZoom = Math.max(this.minZoom, 1.45 - (maxDist - 550) / 1000);
      } else if (maxDist < 260) {
        this.targetZoom = Math.min(this.maxZoom, 1.45 + (260 - maxDist) / 450);
      } else {
        this.targetZoom = 1.45;
      }
    }

    // Yumshoq garmonik silliqlash (Spring Lerp)
    this.x += (this.targetX - this.x) * Math.min(1, dt * 7);
    this.y += (this.targetY - this.y) * Math.min(1, dt * 7);
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 6);

    // Screen Shake
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
