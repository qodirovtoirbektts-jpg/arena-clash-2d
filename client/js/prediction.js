class ClientPrediction {
  constructor() {
    this.predictedState = null;
    this.predictionHistory = []; // [ { seq, x, y, vx, vy, onGround } ]
    this.reconciledCount = 0;
    this.lastServerState = null;

    // Vizual silliqlash (Visual error smoothing)
    this.visualOffset = { x: 0, y: 0 };
  }

  init(initialPlayerState) {
    this.predictedState = JSON.parse(JSON.stringify(initialPlayerState));
    this.predictionHistory = [];
    this.reconciledCount = 0;
    this.visualOffset = { x: 0, y: 0 };
  }

  // Har bir frame yoki tickda lokal bashorat qilish
  predict(input, dt) {
    if (!this.predictedState) return;

    // Fizika hisoblash
    window.GamePhysics.updatePlayerPhysics(this.predictedState, input, dt, window.GameConstants.PLATFORMS);

    // Bashorat tarixiga saqlash
    this.predictionHistory.push({
      seq: input.seq,
      x: this.predictedState.x,
      y: this.predictedState.y,
      vx: this.predictedState.vx,
      vy: this.predictedState.vy,
      onGround: this.predictedState.onGround
    });

    if (this.predictionHistory.length > 60) {
      this.predictionHistory.shift();
    }
  }

  // Server snapshot kelganda moslashtirish (Reconciliation)
  reconcile(serverPlayer, pendingInputs, dt) {
    if (!serverPlayer) return;
    this.lastServerState = serverPlayer;

    const lastSeq = serverPlayer.lastProcessedInput;
    if (!lastSeq) {
      // Agar hali hech qanday sequence qaytmagan bo'lsa
      this.predictedState = { ...this.predictedState, ...serverPlayer };
      return;
    }

    // Tarixdan o'sha sequence ga mos keladigan bashoratni topish
    const matchedIdx = this.predictionHistory.findIndex(h => h.seq === lastSeq);

    if (matchedIdx !== -1) {
      const recorded = this.predictionHistory[matchedIdx];
      const diffX = serverPlayer.x - recorded.x;
      const diffY = serverPlayer.y - recorded.y;
      const dist = Math.hypot(diffX, diffY);

      // Agar farq 3 pikseldan katta bo'lsa (Misol uchun devorga urilish yoki knockback)
      if (dist > 3.0) {
        this.reconciledCount++;

        // Vizual sakrashni yo'qotish uchun offset qo'yish
        this.visualOffset.x = recorded.x - serverPlayer.x;
        this.visualOffset.y = recorded.y - serverPlayer.y;

        // Pozitsiyani server pozitsiyasiga qaytarish
        this.predictedState.x = serverPlayer.x;
        this.predictedState.y = serverPlayer.y;
        this.predictedState.vx = serverPlayer.vx;
        this.predictedState.vy = serverPlayer.vy;
        this.predictedState.onGround = serverPlayer.onGround;

        // Hali serverga yetib bormagan / tasdiqlanmagan buyruqlarni qaytadan ijro etish (Replay)
        for (const inp of pendingInputs) {
          window.GamePhysics.updatePlayerPhysics(this.predictedState, inp, dt, window.GameConstants.PLATFORMS);
        }
      }

      // Tasdiqlangan tarixlarni tozalash
      this.predictionHistory = this.predictionHistory.slice(matchedIdx + 1);
    } else {
      // To'g'ridan-to'g'ri yangilash
      this.predictedState.x = serverPlayer.x;
      this.predictedState.y = serverPlayer.y;
      this.predictedState.vx = serverPlayer.vx;
      this.predictedState.vy = serverPlayer.vy;
    }

    // Boshqa barcha statik parametrlarni (HP, cooldown, animatsiya) serverdan olish
    this.predictedState.hp = serverPlayer.hp;
    this.predictedState.maxHp = serverPlayer.maxHp;
    this.predictedState.cooldowns = serverPlayer.cooldowns;
    this.predictedState.isAttacking = serverPlayer.isAttacking;
    this.predictedState.attackType = serverPlayer.attackType;
    this.predictedState.isDodging = serverPlayer.isDodging;
    this.predictedState.isDashing = serverPlayer.isDashing;
    this.predictedState.isDead = serverPlayer.isDead;
    this.predictedState.respawnTimer = serverPlayer.respawnTimer;
    this.predictedState.invulnerable = serverPlayer.invulnerable;
    this.predictedState.score = serverPlayer.score;
    this.predictedState.roundsWon = serverPlayer.roundsWon;
    this.predictedState.facing = serverPlayer.facing;
  }

  // Har bir frame renderida vizual offsetni 0 ga intiltirish
  updateVisualOffset(decayRate = 0.85) {
    this.visualOffset.x *= decayRate;
    this.visualOffset.y *= decayRate;
    if (Math.abs(this.visualOffset.x) < 0.1) this.visualOffset.x = 0;
    if (Math.abs(this.visualOffset.y) < 0.1) this.visualOffset.y = 0;
  }

  getRenderPosition() {
    if (!this.predictedState) return { x: 0, y: 0 };
    return {
      x: this.predictedState.x + this.visualOffset.x,
      y: this.predictedState.y + this.visualOffset.y
    };
  }
}

window.clientPrediction = new ClientPrediction();
