// Arena Clash 2D — Mukammallashtirilgan Jang va Vizual Effektlar Rendereri
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.floatingTexts = [];
    this.groundDecals = []; // Olovli yoki muzli yer izlari
    this.screenShake = 0;
    this.showDebug = false;

    // Hit stop (Zarba tanaffusi - zarba kuchini his qilish uchun)
    this.hitStopTimer = 0;

    // Trailing Healthbars (Sarg'ish kechikuvchi zarba ko'rsatkichi)
    this.trailingHp = {}; // playerId -> currentTrailingHp

    // Combo bannerlari
    this.activeCombos = {}; // playerId -> { count, timer, x, y }

    // Hit flashes
    this.hitFlashes = {}; // playerId -> flashTimer

    // Animatsiya vaqti
    this.animTime = 0;
    this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  triggerScreenShake(intensity = 8) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  triggerHitStop(duration = 0.05) {
    this.hitStopTimer = duration; // 50ms to'xtash
  }

  addHitFlash(playerId) {
    this.hitFlashes[playerId] = 0.14; // 140ms oq rangda chaqnash
  }

  addDamageText(x, y, text, color = '#ff4757', isCrit = false) {
    this.floatingTexts.push({
      x: x + (Math.random() * 24 - 12),
      y: y - 10,
      vy: -75,
      text: String(text),
      color,
      isCrit,
      size: isCrit ? 24 : 16,
      scale: 1.4, // Boshlanishida kattalashib chiqadi
      life: 0.85,
      maxLife: 0.85
    });
  }

  addComboNotification(x, y, count, attackerName = '') {
    let title = `${count}x COMBO!`;
    let color = '#ffa502';
    if (count >= 5) {
      title = `${count}x ULTRA COMBO! 🔥`;
      color = '#ff4757';
    } else if (count >= 3) {
      title = `${count}x GREAT COMBO! ⚡`;
      color = '#e056fd';
    }

    this.floatingTexts.push({
      x,
      y: y - 25,
      vy: -45,
      text: title,
      color,
      isCrit: true,
      size: 22,
      scale: 1.6,
      life: 1.1,
      maxLife: 1.1
    });
  }

  spawnParticles(x, y, count = 10, color = '#ff4757', speed = 150) {
    const actualCount = this.isMobile ? Math.ceil(count * 0.6) : count;
    const maxAllowed = this.isMobile ? 45 : 120;
    if (this.particles.length > maxAllowed) {
      this.particles.splice(0, this.particles.length - maxAllowed);
    }
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 40,
        radius: Math.random() * 3 + 2,
        color,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75
      });
    }
  }

  // Chang va sakrash zarralari (Footstep dust)
  spawnDust(x, y, dir = 1) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y - 2,
        vx: -dir * (Math.random() * 60 + 20),
        vy: -(Math.random() * 30 + 10),
        radius: Math.random() * 3 + 2,
        color: 'rgba(148, 163, 184, 0.5)',
        life: 0.3,
        maxLife: 0.3
      });
    }
  }

  // Olovli yoki muzli yer izlari (Inferno Dash izi)
  addGroundDecal(x, y, type = 'fire') {
    this.groundDecals.push({
      x,
      y,
      type,
      life: 2.2,
      maxLife: 2.2,
      width: 48,
      height: 12
    });
  }

  updateEffects(dt) {
    this.animTime += dt;

    // Hit stop
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Bu vaqtda harakatlar to'xtab turadi
    }

    // Screen shake susayishi
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 28);
    }

    // Hit flashes
    for (const id in this.hitFlashes) {
      this.hitFlashes[id] -= dt;
      if (this.hitFlashes[id] <= 0) delete this.hitFlashes[id];
    }

    // Ground Decals
    for (let i = this.groundDecals.length - 1; i >= 0; i--) {
      const d = this.groundDecals[i];
      d.life -= dt;
      if (d.life <= 0) this.groundDecals.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // gravity
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.scale > 1.0) {
        t.scale = Math.max(1.0, t.scale - dt * 3);
      }
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

    // 2. YER IZLARI (Decals - olov, muz izlari)
    this.drawGroundDecals();

    // 3. PLATFORMALAR
    this.drawPlatforms(platforms || window.GameConstants.PLATFORMS);

    // 4. PROJECTILES (Snaryadlar)
    if (renderState.projectiles) {
      this.drawProjectiles(renderState.projectiles);
    }

    // 5. O'YINCHILAR (Mukammallashtirilgan qahramonlar)
    if (renderState.players) {
      for (const p of renderState.players) {
        this.updateTrailingHp(p);
        this.drawAdvancedPlayer(p);
      }
    }

    // 6. ZARRALAR (Particles)
    this.drawParticles();

    // 7. SUZUVCHI MATNLAR & COMBO BANNERLARI
    this.drawFloatingTexts();

    // 8. DEBUG OVERLAY
    if (this.showDebug && renderState.debugInfo) {
      this.drawDebugOverlay(renderState.debugInfo);
    }

    ctx.restore();
  }

  updateTrailingHp(p) {
    if (this.trailingHp[p.id] === undefined) {
      this.trailingHp[p.id] = p.hp;
    } else {
      if (p.hp < this.trailingHp[p.id]) {
        // Sarg'ish bar asta-sekin pasayadi (Street Fighter / Tekken effekti)
        this.trailingHp[p.id] = Math.max(p.hp, this.trailingHp[p.id] - 0.45);
      } else {
        this.trailingHp[p.id] = p.hp;
      }
    }
  }

  drawBackground(w, h) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#070a12');
    grad.addColorStop(0.55, '#0d1322');
    grad.addColorStop(1, '#04060a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Dinamik kiberpanjara (Pulsing Grid)
    const pulseOpacity = 0.04 + Math.sin(this.animTime * 2) * 0.02;
    ctx.strokeStyle = `rgba(56, 189, 248, ${pulseOpacity})`;
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

    // Arena orqa fonidagi arkalar va neon chiroqlar
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, 470, 320, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawGroundDecals() {
    const ctx = this.ctx;
    for (const d of this.groundDecals) {
      ctx.save();
      const alpha = Math.max(0, d.life / d.maxLife);
      ctx.globalAlpha = alpha;

      if (d.type === 'fire') {
        const flickerH = Math.sin(this.animTime * 15 + d.x) * 4;
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = '#ffa502';
        ctx.shadowBlur = 10;
        ctx.fillRect(d.x - d.width / 2, d.y - 8 + flickerH, d.width, 10);
      } else if (d.type === 'frost') {
        ctx.fillStyle = '#74b9ff';
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 10;
        ctx.fillRect(d.x - d.width / 2, d.y - 4, d.width, 6);
      }
      ctx.restore();
    }
  }

  drawPlatforms(platforms) {
    const ctx = this.ctx;

    for (const plat of platforms) {
      if (plat.oneWay) {
        // Bir tomonlama platforma (Semi-transparent neon)
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Neon chiziq
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
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

        if (plat.id === 'floor') {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.moveTo(plat.x, plat.y);
          ctx.lineTo(plat.x + plat.width, plat.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  // MUKAMMAL QAHRAMON CHIZISH (Detailed Skeletal / Procedural Character)
  drawAdvancedPlayer(p) {
    const ctx = this.ctx;
    if (p.isDead) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const charDef = window.GameCharacters.CHARACTERS[p.characterId] || window.GameCharacters.CHARACTERS.blaze_knight;
    const isFlashing = !!this.hitFlashes[p.id];
    const facing = p.facing || 1;
    const isMoving = Math.abs(p.vx) > 30;
    const isGrounded = p.onGround;

    // 1. Dodge / Dash paytidagi arvoh siluetlar (Motion Ghost Trail)
    if (p.isDodging || p.isDashing) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = charDef.accentColor;
      ctx.fillRect(-p.width / 2 - facing * 20, -p.height, p.width, p.height);
      ctx.globalAlpha = 0.15;
      ctx.fillRect(-p.width / 2 - facing * 38, -p.height, p.width, p.height);
      ctx.restore();
    }

    // 2. O'zgarmaslik (Invulnerability) qalpog'i (Gold Hexagon Shield)
    if (p.invulnerable) {
      ctx.save();
      ctx.strokeStyle = '#fbc531';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#fbc531';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(0, -p.height / 2, p.width * 0.8, p.height * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Super-Armor aurası (Blaze Knight Heavy Windup paytida)
    if (p.actionState === 'WINDUP' && p.characterId === 'blaze_knight') {
      ctx.save();
      ctx.strokeStyle = '#ffa502';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, -p.height / 2, p.width, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Muzlash effekti (Frozen Ice Block)
    if (p.freezeTimer > 0 || p.actionState === 'FROZEN') {
      this.drawIceEncasement(p, ctx);
      ctx.restore();
      this.drawPlayerHUD(p);
      return; // Muzlagan paytda boshqa animatsiyalar muzlatiladi
    }

    // Yugurish / Nafas olish harakati (Bobbing)
    const walkCycle = isMoving && isGrounded ? Math.sin(this.animTime * 14) * 4 : 0;
    const breath = !isMoving && isGrounded ? Math.sin(this.animTime * 3) * 2 : 0;
    const lean = isMoving ? facing * 0.12 : 0;

    ctx.rotate(lean);

    // QAHRAMON SPECIFIK QISMLARI
    if (p.characterId === 'blaze_knight') {
      this.drawBlazeKnight(p, charDef, facing, isFlashing, walkCycle, breath, ctx);
    } else if (p.characterId === 'shadow_ninja') {
      this.drawShadowNinja(p, charDef, facing, isFlashing, walkCycle, breath, ctx);
    } else if (p.characterId === 'frost_mage') {
      this.drawFrostMage(p, charDef, facing, isFlashing, walkCycle, breath, ctx);
    }

    // Hujum zarbasi vfx (Slash Arc)
    if (p.isAttacking && p.attackType) {
      this.drawAttackVFX(p, charDef, facing, ctx);
    }

    ctx.restore();

    // O'yinchi boshi ustidagi holat badge va HP bar
    this.drawPlayerHUD(p);
  }

  // 1. BLAZE KNIGHT PROCEDURAL ART
  drawBlazeKnight(p, charDef, facing, isFlashing, walk, breath, ctx) {
    const mainCol = isFlashing ? '#ffffff' : '#ff4757';
    const armorCol = isFlashing ? '#ffffff' : '#2f3542';
    const goldCol = isFlashing ? '#ffffff' : '#ffa502';

    // Oqayotgan Qizil Plash (Cape)
    ctx.save();
    ctx.fillStyle = '#b33939';
    ctx.beginPath();
    const capeW = 20;
    const capeFlutter = -facing * Math.abs(p.vx) * 0.05 + Math.sin(this.animTime * 8) * 3;
    ctx.moveTo(-facing * 8, -p.height + 26);
    ctx.lineTo(-facing * 18 + capeFlutter, -8);
    ctx.lineTo(-facing * 4 + capeFlutter, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Oyoqlar (Boots)
    ctx.fillStyle = armorCol;
    ctx.fillRect(-12, -18 + walk, 10, 18);
    ctx.fillRect(2, -18 - walk, 10, 18);

    // Tana (Armor Breastplate)
    ctx.fillStyle = armorCol;
    ctx.fillRect(-18, -p.height + 22 + breath, 36, 32);

    // Olovli ko'krak nishoni (Fire Crest)
    ctx.fillStyle = goldCol;
    ctx.beginPath();
    ctx.moveTo(0, -p.height + 26 + breath);
    ctx.lineTo(8 * facing, -p.height + 36 + breath);
    ctx.lineTo(0, -p.height + 46 + breath);
    ctx.lineTo(-8 * facing, -p.height + 36 + breath);
    ctx.closePath();
    ctx.fill();

    // Bosh (Ritsar dubulg'asi va shoxlar)
    ctx.fillStyle = armorCol;
    ctx.beginPath();
    ctx.arc(0, -p.height + 12 + breath, 14, 0, Math.PI * 2);
    ctx.fill();

    // Shoxlar (Horns)
    ctx.fillStyle = goldCol;
    ctx.beginPath();
    ctx.moveTo(-10, -p.height + 8 + breath);
    ctx.lineTo(-18, -p.height - 4 + breath);
    ctx.lineTo(-8, -p.height + 4 + breath);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -p.height + 8 + breath);
    ctx.lineTo(18, -p.height - 4 + breath);
    ctx.lineTo(8, -p.height + 4 + breath);
    ctx.fill();

    // Ko'z tirqishi (Fiery Visor Slit)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#ffa502';
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 8;
    ctx.fillRect(facing > 0 ? 0 : -8, -p.height + 11 + breath, 10, 3);
    ctx.shadowBlur = 0;

    // Katta Olovli Qilich (Greatsword)
    ctx.save();
    const isCharging = p.actionState === 'WINDUP';
    let swordAngle = facing > 0 ? -0.4 : 0.4;
    if (p.isAttacking) swordAngle = facing > 0 ? 1.0 : -1.0;
    if (isCharging) swordAngle = facing > 0 ? -1.2 : 1.2; // Qilichni orqaga tortish (Windup)

    ctx.translate(facing * 12, -p.height + 30 + breath);
    ctx.rotate(swordAngle);

    // Qilich pichoq qismi
    ctx.fillStyle = isCharging ? '#ffa502' : '#f1f2f6';
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    ctx.fillRect(-4, -48, 8, 48);
    ctx.strokeRect(-4, -48, 8, 48);

    // Qilich dastagi (Crossguard)
    ctx.fillStyle = goldCol;
    ctx.fillRect(-12, 0, 24, 6);
    ctx.restore();
  }

  // 2. SHADOW NINJA PROCEDURAL ART
  drawShadowNinja(p, charDef, facing, isFlashing, walk, breath, ctx) {
    const ninjaDark = isFlashing ? '#ffffff' : '#1e1b2e';
    const cyanGlow = isFlashing ? '#ffffff' : '#00d2d3';
    const purpleAcc = isFlashing ? '#ffffff' : '#9b59b6';

    // Chaqqon sharf (Fluttering Cyan Scarf)
    ctx.save();
    ctx.fillStyle = cyanGlow;
    ctx.shadowColor = cyanGlow;
    ctx.shadowBlur = 10;
    const scarfFlutter = -facing * Math.abs(p.vx) * 0.08 + Math.sin(this.animTime * 12) * 4;
    ctx.beginPath();
    ctx.moveTo(-facing * 4, -p.height + 22);
    ctx.quadraticCurveTo(-facing * 20 + scarfFlutter, -p.height + 26, -facing * 34 + scarfFlutter, -p.height + 14);
    ctx.lineTo(-facing * 30 + scarfFlutter, -p.height + 20);
    ctx.lineTo(-facing * 4, -p.height + 25);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Oyoqlar (Ninja Tabi Boots)
    ctx.fillStyle = ninjaDark;
    ctx.fillRect(-10, -16 + walk, 8, 16);
    ctx.fillRect(2, -16 - walk, 8, 16);

    // Tana (Shinobi Shozoku)
    ctx.fillStyle = ninjaDark;
    ctx.fillRect(-14, -p.height + 20 + breath, 28, 28);

    // Binafsha kamar (Purple Obi Sash)
    ctx.fillStyle = purpleAcc;
    ctx.fillRect(-14, -p.height + 34 + breath, 28, 5);

    // Bosh (Maskalangan yuz / Cowl)
    ctx.fillStyle = ninjaDark;
    ctx.beginPath();
    ctx.arc(0, -p.height + 12 + breath, 12, 0, Math.PI * 2);
    ctx.fill();

    // Yonayotgan kiber-ko'zlar (Cyan Glowing Eyes)
    ctx.fillStyle = cyanGlow;
    ctx.shadowColor = cyanGlow;
    ctx.shadowBlur = 8;
    const eyeX = facing > 0 ? 2 : -6;
    ctx.fillRect(eyeX, -p.height + 10 + breath, 5, 3);
    ctx.shadowBlur = 0;

    // Qo'sh xanjarlar (Twin Ninjato / Daggers)
    ctx.save();
    ctx.fillStyle = cyanGlow;
    ctx.translate(facing * 10, -p.height + 26 + breath);
    const daggerAngle = p.isAttacking ? (facing > 0 ? 0.9 : -0.9) : (facing > 0 ? 0.2 : -0.2);
    ctx.rotate(daggerAngle);
    ctx.fillRect(0, -18, 4, 22);
    ctx.restore();
  }

  // 3. FROST MAGE PROCEDURAL ART
  drawFrostMage(p, charDef, facing, isFlashing, walk, breath, ctx) {
    const robeCol = isFlashing ? '#ffffff' : '#1e3799';
    const iceCol = isFlashing ? '#ffffff' : '#74b9ff';
    const whiteCol = isFlashing ? '#ffffff' : '#f8fafc';

    // Sehrgar mantiyasi (Flowing Arcane Robe)
    ctx.fillStyle = robeCol;
    ctx.beginPath();
    ctx.moveTo(0, -p.height + 16 + breath);
    ctx.lineTo(16, 0);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();

    // Oq hoshiyalar (Runic Trims)
    ctx.fillStyle = iceCol;
    ctx.fillRect(-16, -4, 32, 4);

    // Sehrgar qalpoqchasi (Wizard Cowl)
    ctx.fillStyle = robeCol;
    ctx.beginPath();
    ctx.arc(0, -p.height + 12 + breath, 12, 0, Math.PI * 2);
    ctx.fill();

    // Muzli Ko'zlar (Azure Glowing Eyes)
    ctx.fillStyle = iceCol;
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 10;
    const eyeX = facing > 0 ? 2 : -6;
    ctx.fillRect(eyeX, -p.height + 10 + breath, 5, 4);
    ctx.shadowBlur = 0;

    // Aylanuvchi Muzli Orb (Floating Arcane Orb)
    ctx.save();
    const orbAngle = this.animTime * 4;
    const orbDist = 24;
    const orbX = Math.cos(orbAngle) * orbDist;
    const orbY = -p.height + 24 + Math.sin(orbAngle) * 8;

    ctx.fillStyle = whiteCol;
    ctx.shadowColor = '#74b9ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Muzli Hassa (Crystal Staff)
    ctx.save();
    ctx.translate(facing * 12, -p.height + 20 + breath);
    ctx.fillStyle = '#a4b0be';
    ctx.fillRect(-2, -10, 4, 36);

    // Hassaning uchidagi kristal
    ctx.fillStyle = iceCol;
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(6, -12);
    ctx.lineTo(0, -6);
    ctx.lineTo(-6, -12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Muzga qotish animatsiyasi (Ice Encasement)
  drawIceEncasement(p, ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(116, 185, 255, 0.65)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 18;

    // Qirrali muz kristali (Faceted Crystal Hexagon)
    ctx.beginPath();
    ctx.moveTo(0, -p.height - 12);
    ctx.lineTo(p.width * 0.75, -p.height * 0.75);
    ctx.lineTo(p.width * 0.75, -p.height * 0.2);
    ctx.lineTo(0, 4);
    ctx.lineTo(-p.width * 0.75, -p.height * 0.2);
    ctx.lineTo(-p.width * 0.75, -p.height * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ichki muz qirralari
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -p.height - 12);
    ctx.lineTo(0, 4);
    ctx.stroke();

    ctx.restore();
  }

  // Hujum zarbasi vfx (Slash Arc)
  drawAttackVFX(p, charDef, facing, ctx) {
    if (p.attackType === 'light' || p.attackType === 'heavy') {
      ctx.strokeStyle = charDef.accentColor;
      ctx.lineWidth = p.attackType === 'heavy' ? 8 : 4;
      ctx.shadowColor = charDef.color;
      ctx.shadowBlur = 16;

      ctx.beginPath();
      const startAngle = facing > 0 ? -Math.PI * 0.45 : Math.PI * 0.55;
      const endAngle = facing > 0 ? Math.PI * 0.45 : Math.PI * 1.45;
      const radius = p.attackType === 'heavy' ? 52 : 38;
      ctx.arc(0, -p.height / 2, radius, startAngle, endAngle);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (p.attackType === 'skill') {
      if (p.characterId === 'frost_mage') {
        // AoE Blizzard Shockwave
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, -p.height / 2, 95, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  // O'YINCHI HUD (Bosh ustidagi status va telegraflar)
  drawPlayerHUD(p) {
    const ctx = this.ctx;
    const barW = 54;
    const barH = 6;
    const barX = p.x - barW / 2;
    const barY = p.y - p.height - 20;

    // 1. HOLAT BADGE (Nima bo'layotgani aniq ko'rsatilishi uchun)
    if (p.actionBadgeText) {
      ctx.save();
      ctx.font = 'bold 11px system-ui, sans-serif';
      const badgeW = ctx.measureText(p.actionBadgeText).width + 12;
      const badgeX = p.x - badgeW / 2;
      const badgeY = barY - 22;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = p.actionState === 'WINDUP' ? '#ffa502' : (p.actionState === 'FROZEN' ? '#00d2d3' : '#38bdf8');
      ctx.lineWidth = 1.5;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, 18, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(p.actionBadgeText, p.x, badgeY + 13);
      ctx.restore();
    }

    // 2. Ism
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(p.username, p.x, barY - 4);
    ctx.shadowBlur = 0;

    // 3. HP Bar Orqa fon
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // 4. Trailing Yellow Damage Chunk (Sarg'ish kechikuvchi bar)
    const trailingVal = this.trailingHp[p.id] !== undefined ? this.trailingHp[p.id] : p.hp;
    const trailingRatio = Math.max(0, trailingVal / p.maxHp);
    ctx.fillStyle = '#fbc531';
    ctx.fillRect(barX, barY, barW * trailingRatio, barH);

    // 5. Asosiy HP
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
      ctx.shadowBlur = 14;

      if (pr.type === 'kunai') {
        // Aylanuvchi metall kunai
        ctx.translate(pr.x, pr.y);
        const rot = this.animTime * 18;
        ctx.rotate(rot);
        ctx.fillStyle = '#00d2d3';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(4, -3, 6, 6);
      } else {
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius || 8, 0, Math.PI * 2);
        ctx.fill();

        // Dum izi (Trail)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pr.x, pr.y);
        ctx.lineTo(pr.x - (pr.vx || 0) * 0.05, pr.y - (pr.vy || 0) * 0.05);
        ctx.stroke();
      }

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
      const currentSize = Math.round(t.size * (t.scale || 1.0));
      ctx.font = `bold ${currentSize}px system-ui, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  drawDebugOverlay(info) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.fillRect(10, 10, 230, 140);
    ctx.strokeRect(10, 10, 230, 140);

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
