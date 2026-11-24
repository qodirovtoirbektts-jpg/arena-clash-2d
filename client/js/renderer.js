class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.showDebug = false;

    // Kesh rasmlar yoki naqshlar
    this.hitFlashes = {}; // playerId -> flashTimer
  }

  triggerScreenShake(intensity = 8) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  addHitFlash(playerId) {
    this.hitFlashes[playerId] = 0.12; // 120ms oq rangda miltillash
  }

  addDamageText(x, y, text, color = '#ff4757', isCrit = false) {
    this.floatingTexts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      vy: -60,
      text: String(text),
      color,
      isCrit,
      size: isCrit ? 22 : 16,
      life: 0.8,
      maxLife: 0.8
    });
  }

  spawnParticles(x, y, count = 10, color = '#ff4757', speed = 150) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 40,
        radius: Math.random() * 3 + 2,
        color,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  updateEffects(dt) {
    // Screen shake susayishi
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Hit flashes
    for (const id in this.hitFlashes) {
      this.hitFlashes[id] -= dt;
      if (this.hitFlashes[id] <= 0) delete this.hitFlashes[id];
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  render(renderState, platforms) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();

    // Screen Shake
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    // 1. ARENA FON (Cyber Neon Arena)
    this.drawBackground(width, height);

    // 2. PLATFORMALAR
    this.drawPlatforms(platforms || window.GameConstants.PLATFORMS);

    // 3. PROJECTILES (Snaryadlar)
    if (renderState.projectiles) {
      this.drawProjectiles(renderState.projectiles);
    }

    // 4. O'YINCHILAR
    if (renderState.players) {
      for (const p of renderState.players) {
        this.drawPlayer(p);
      }
    }

    // 5. ZARRALAR (Particles)
    this.drawParticles();

    // 6. SUZUVCHI MATNLAR (Damage Text)
    this.drawFloatingTexts();

    // 7. DEBUG OVERLAY
    if (this.showDebug && renderState.debugInfo) {
      this.drawDebugOverlay(renderState.debugInfo);
    }

    ctx.restore();
  }

  drawBackground(w, h) {
    const ctx = this.ctx;
    // Qorong'i gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0d1a');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#05070f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Kiberpanjara (Cyber Grid)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Markaziy arena yoritgichi (Glow)
    const centerGlow = ctx.createRadialGradient(w / 2, h / 2 + 50, 50, w / 2, h / 2 + 50, 420);
    centerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, w, h);
  }

  drawPlatforms(platforms) {
    const ctx = this.ctx;

    for (const plat of platforms) {
      // Bir tomonlama platforma
      if (plat.oneWay) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Neon ustki chegara
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y);
        ctx.lineTo(plat.x + plat.width, plat.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Qattiq platforma va pol
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

        // Pol ustidagi yorqin chiziq
        if (plat.id === 'floor') {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(plat.x, plat.y);
          ctx.lineTo(plat.x + plat.width, plat.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  drawPlayer(p) {
    const ctx = this.ctx;
    if (p.isDead) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const charDef = window.GameCharacters.CHARACTERS[p.characterId] || window.GameCharacters.CHARACTERS.blaze_knight;
    const isFlashing = !!this.hitFlashes[p.id];
    const facing = p.facing || 1;

    // Dodge vaqtida soyali siluetlar (Motion blur / clone)
    if (p.isDodging || p.isDashing) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = charDef.color;
      ctx.fillRect(-p.width / 2 - facing * 18, -p.height, p.width, p.height);
      ctx.globalAlpha = 1.0;
    }

    // Invulnerability shaffoflik yoki aura
    if (p.invulnerable) {
      ctx.strokeStyle = '#fbc531';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#fbc531';
      ctx.shadowBlur = 10;
      ctx.strokeRect(-p.width / 2 - 4, -p.height - 4, p.width + 8, p.height + 8);
      ctx.shadowBlur = 0;
    }

    // O'yinchi tanasi
    ctx.fillStyle = isFlashing ? '#ffffff' : charDef.color;

    // Qahramon ko'rinishi
    ctx.beginPath();
    // Bosh qismi (Head)
    ctx.arc(0, -p.height + 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Tana (Body)
    ctx.fillRect(-p.width / 2, -p.height + 24, p.width, p.height - 24);

    // Yuzlanish ko'zlari (Eyes)
    ctx.fillStyle = isFlashing ? '#ffffff' : charDef.accentColor;
    const eyeX = facing > 0 ? 3 : -7;
    ctx.fillRect(eyeX, -p.height + 11, 5, 4);

    // Qilich yoki Qurol
    this.drawWeapon(p, charDef, facing, ctx);

    // Hujum zarbasi vfx (Slash Arc)
    if (p.isAttacking && p.attackType) {
      this.drawAttackVFX(p, charDef, facing, ctx);
    }

    ctx.restore();

    // HP Bar va Username (O'yinchi boshi ustida)
    this.drawPlayerHUD(p);
  }

  drawWeapon(p, charDef, facing, ctx) {
    if (p.characterId === 'blaze_knight') {
      // Qilich
      ctx.save();
      ctx.fillStyle = '#f5f6fa';
      ctx.strokeStyle = '#ffa502';
      ctx.lineWidth = 2;
      const angle = p.isAttacking ? (facing > 0 ? 0.8 : -0.8) : (facing > 0 ? -0.4 : 0.4);
      ctx.rotate(angle);
      ctx.fillRect(facing > 0 ? 12 : -18, -p.height + 20, 6, 32);
      ctx.strokeRect(facing > 0 ? 12 : -18, -p.height + 20, 6, 32);
      ctx.restore();
    } else if (p.characterId === 'shadow_ninja') {
      // Qora xanjar
      ctx.fillStyle = '#00d2d3';
      ctx.fillRect(facing > 0 ? 10 : -16, -p.height + 30, 8, 4);
    } else if (p.characterId === 'frost_mage') {
      // Sehrli orb
      ctx.fillStyle = '#74b9ff';
      ctx.shadowColor = '#0984e3';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(facing > 0 ? 18 : -18, -p.height + 28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  drawAttackVFX(p, charDef, facing, ctx) {
    if (p.attackType === 'light' || p.attackType === 'heavy') {
      ctx.strokeStyle = charDef.accentColor;
      ctx.lineWidth = p.attackType === 'heavy' ? 8 : 4;
      ctx.shadowColor = charDef.color;
      ctx.shadowBlur = 14;

      ctx.beginPath();
      const startAngle = facing > 0 ? -Math.PI * 0.4 : Math.PI * 0.6;
      const endAngle = facing > 0 ? Math.PI * 0.4 : Math.PI * 1.4;
      const radius = p.attackType === 'heavy' ? 48 : 36;
      ctx.arc(0, -p.height / 2, radius, startAngle, endAngle);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (p.attackType === 'skill') {
      // Skill VFX
      if (p.characterId === 'frost_mage') {
        // AoE Blizzard
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, -p.height / 2, 85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  drawPlayerHUD(p) {
    const ctx = this.ctx;
    const barW = 50;
    const barH = 6;
    const barX = p.x - barW / 2;
    const barY = p.y - p.height - 18;

    // Ism
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.username, p.x, barY - 4);

    // HP Orqa fon
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // HP Qismi
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    const hpColor = hpRatio > 0.5 ? '#2ed573' : (hpRatio > 0.25 ? '#ffa502' : '#ff4757');
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
  }

  drawProjectiles(projectiles) {
    const ctx = this.ctx;
    for (const pr of projectiles) {
      ctx.save();
      ctx.fillStyle = pr.color || '#38bdf8';
      ctx.shadowColor = pr.color || '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius || 8, 0, Math.PI * 2);
      ctx.fill();

      // Qisqa dumi (Trail)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pr.x, pr.y);
      ctx.lineTo(pr.x - (pr.vx || 0) * 0.04, pr.y - (pr.vy || 0) * 0.04);
      ctx.stroke();

      ctx.restore();
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  drawFloatingTexts() {
    const ctx = this.ctx;
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.font = `bold ${t.size}px system-ui, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  drawDebugOverlay(info) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.fillRect(10, 10, 220, 130);
    ctx.strokeRect(10, 10, 220, 130);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${info.fps || 60}`, 20, 30);
    ctx.fillText(`Ping: ${info.ping || 0} ms`, 20, 50);
    ctx.fillText(`Tick Rate: ${info.tickRate || 30} Hz`, 20, 70);
    ctx.fillText(`Server Tick: ${info.serverTick || 0}`, 20, 90);
    ctx.fillText(`Reconcile Error: ${info.reconciledCount || 0}`, 20, 110);
    ctx.fillText(`Input Seq: ${info.lastSeq || 0}`, 20, 130);

    ctx.restore();
  }
}

window.Renderer = Renderer;
