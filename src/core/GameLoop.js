// Arena Clash 2D v3.2 — 60Hz Fixed-Timestep Game Loop
export class GameLoop {
  constructor(onUpdate, onRender) {
    this.onUpdate = onUpdate; // update(dt)
    this.onRender = onRender; // render(alpha)

    this.FIXED_TIMESTEP = 1 / 60; // 60Hz = ~0.016667s
    this.MAX_ACCUMULATOR = 0.2;   // 200ms spiral-of-death himoyasi

    this.isRunning = false;
    this.isPaused = false;
    this.rafId = null;

    this.lastTime = 0;
    this.accumulator = 0;
    this.timeScale = 1.0;         // Slow-Mo koeffitsienti (1.0 = normal, 0.25 = clash)
    this.targetTimeScale = 1.0;
    this.timeScaleLerpSpeed = 10; // Slow-mo ga o'tish tezligi

    this.hitstopTimer = 0;        // Hitstop muzlash vaqti (soniyalarda)

    // Unumdorlik ko'rsatkichlari (FPS)
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    this.loop = this.loop.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
  }

  // Hitstop chaqirish (masalan, og'ir zarba yoki parry da 0.06s ga fizika to'xtashi)
  triggerHitstop(duration = 0.06) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  // Slow-Mo rejimiga o'tish (vaqtinchalik yoki doimiy)
  setTimeScale(scale, duration = 0) {
    this.timeScale = scale;
    this.targetTimeScale = scale;
    if (duration > 0) {
      setTimeout(() => {
        this.targetTimeScale = 1.0;
      }, duration * 1000);
    }
  }

  loop(timestampMs) {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this.loop);

    const currentTime = timestampMs / 1000;
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Katta kechikishlarni (masalan, tab almashganda) cheklash
    if (frameTime > this.MAX_ACCUMULATOR) {
      frameTime = this.MAX_ACCUMULATOR;
    }

    // FPS o'lchash
    this.frameCount++;
    this.fpsTimer += frameTime;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer -= 1.0;
    }

    if (this.isPaused) return;

    // Slow-Mo interpolatsiyasi
    if (this.timeScale !== this.targetTimeScale) {
      const diff = this.targetTimeScale - this.timeScale;
      this.timeScale += diff * Math.min(1, frameTime * this.timeScaleLerpSpeed);
      if (Math.abs(diff) < 0.01) {
        this.timeScale = this.targetTimeScale;
      }
    }

    // Hitstop tekshiruvi: zarba paytida fizikani qisqa muddatga muzlatish
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= frameTime;
      // Hitstop vaqtida faqat render chaqiriladi (alpha = 1)
      if (this.onRender) {
        this.onRender(1.0);
      }
      return;
    }

    // Fixed-timestep fizika yangilanishi
    this.accumulator += frameTime * this.timeScale;

    while (this.accumulator >= this.FIXED_TIMESTEP) {
      if (this.onUpdate) {
        this.onUpdate(this.FIXED_TIMESTEP);
      }
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    // Render interpolatsiyasi (alpha: 0..1)
    const alpha = this.accumulator / this.FIXED_TIMESTEP;
    if (this.onRender) {
      this.onRender(alpha);
    }
  }
}
