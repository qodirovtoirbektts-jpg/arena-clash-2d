class EntityInterpolation {
  constructor(renderDelayMs = 90) {
    this.renderDelayMs = renderDelayMs;
    this.buffers = {}; // playerId -> [ { timestamp, state } ]
  }

  addSnapshot(playerId, playerState, serverTimestamp) {
    if (!this.buffers[playerId]) {
      this.buffers[playerId] = [];
    }

    const buffer = this.buffers[playerId];
    buffer.push({
      timestamp: serverTimestamp || Date.now(),
      state: JSON.parse(JSON.stringify(playerState))
    });

    // Faqat oxirgi 25 ta snapshotni saqlash
    if (buffer.length > 25) {
      buffer.shift();
    }
  }

  getInterpolatedState(playerId, clientRenderTime) {
    const buffer = this.buffers[playerId];
    if (!buffer || buffer.length === 0) return null;

    // Eng so'nggi holat agar bitta bo'lsa
    if (buffer.length === 1) {
      return buffer[0].state;
    }

    const targetTime = clientRenderTime - this.renderDelayMs;

    // Buffer ichidan oraliqni topish
    let s0 = null;
    let s1 = null;

    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i].timestamp <= targetTime && targetTime <= buffer[i + 1].timestamp) {
        s0 = buffer[i];
        s1 = buffer[i + 1];
        break;
      }
    }

    // Agar targetTime hali eng eski snapshottan ham orqada bo'lsa
    if (!s0 && targetTime < buffer[0].timestamp) {
      return buffer[0].state;
    }

    // Agar targetTime eng so'nggi snapshottan o'tib ketgan bo'lsa (paket kechikishi - Extrapolation)
    if (!s0) {
      const latest = buffer[buffer.length - 1];
      const prev = buffer[buffer.length - 2];
      const dt = (targetTime - latest.timestamp) / 1000;

      // Maksimal 100ms ekstrapolyatsiya
      const clampedDt = Math.min(0.1, Math.max(0, dt));
      const extrapolated = JSON.parse(JSON.stringify(latest.state));
      extrapolated.x += latest.state.vx * clampedDt;
      extrapolated.y += latest.state.vy * clampedDt;
      return extrapolated;
    }

    // Normal silliq chiziqli interpolatsiya (Lerp)
    const timeDelta = s1.timestamp - s0.timestamp;
    const alpha = timeDelta > 0 ? (targetTime - s0.timestamp) / timeDelta : 1.0;
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    const p0 = s0.state;
    const p1 = s1.state;

    return {
      ...p1, // Hujum, animatsiya, hp ko'rsatkichlari eng so'nggi holatdan
      x: p0.x + (p1.x - p0.x) * clampedAlpha,
      y: p0.y + (p1.y - p0.y) * clampedAlpha,
      facing: p1.facing,
      hp: p1.hp,
      maxHp: p1.maxHp,
      isAttacking: p1.isAttacking,
      attackType: p1.attackType,
      isDodging: p1.isDodging,
      isDashing: p1.isDashing,
      isDead: p1.isDead,
      invulnerable: p1.invulnerable
    };
  }

  clearPlayer(playerId) {
    delete this.buffers[playerId];
  }

  clearAll() {
    this.buffers = {};
  }
}

window.entityInterpolation = new EntityInterpolation(80);
