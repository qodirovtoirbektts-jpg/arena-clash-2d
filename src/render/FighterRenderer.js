// Arena Clash 2D v3.2 — Professional Qo'lda Chizilgan Qahramon Rendereri (Handcrafted Studio Art)
export class FighterRenderer {
  constructor() {
    this.animTime = 0;
  }

  render(ctx, fighter, isAnimeKo = false) {
    if (!fighter) return;
    this.animTime += 0.016;

    ctx.save();
    const { x, y, facing, heroConfig, isAwakened, hitFlashTimer, state, stateTimer } = fighter;

    // 1. Zamin Soyasi (Balandlikka mos dinamik ellips)
    const distFromGround = Math.max(0, 520 - y);
    const shadowScale = Math.max(0.25, 1.0 - distFromGround / 320);
    const shadowAlpha = Math.max(0.1, 0.55 - distFromGround / 400);

    ctx.save();
    ctx.translate(x, 520);
    ctx.scale(shadowScale, shadowScale * 0.3);
    ctx.fillStyle = `rgba(3, 5, 10, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Anime KO Finisher Rejimi (Qora-qizil manga kontrasti)
    if (isAnimeKo) {
      ctx.translate(x, y);
      ctx.scale(facing, 1);
      ctx.fillStyle = fighter.isDead ? '#050508' : '#e11d48';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 28;
      this.drawFullSilhouette(ctx, heroConfig.id);
      ctx.restore();
      return;
    }

    // 3. Squash & Stretch (Harakat va sakrashdagi elastiklik)
    let sx = 1.0;
    let sy = 1.0;
    if (!fighter.isGrounded) {
      if (fighter.vy < -100) {
        sx = 0.92;
        sy = 1.08; // Cho'zilish
      } else if (fighter.vy > 100) {
        sx = 1.05;
        sy = 0.95; // Qisiluvchan tushish
      }
    } else if (state === 'idle') {
      const breath = Math.sin(this.animTime * 3) * 0.02;
      sy = 1.0 + breath;
      sx = 1.0 - breath * 0.5;
    } else if (state === 'run') {
      const runBob = Math.abs(Math.sin(this.animTime * 12)) * 0.04;
      sy = 1.0 - runBob;
    }

    // 4. Qahramon Koordinatalari
    ctx.translate(x, y);
    ctx.scale(facing * sx, sy);

    const isHitFlash = hitFlashTimer > 0;

    // Elementar Rim Lighting va Aura
    ctx.shadowColor = isHitFlash ? '#ffffff' : heroConfig.palette.glow;
    ctx.shadowBlur = isAwakened ? 26 : 12;

    // Awakening / Rage Qat'iy Olovli Aulasi
    if (isAwakened) {
      ctx.save();
      const auraP = Math.sin(this.animTime * 14) * 4;
      ctx.strokeStyle = heroConfig.palette.glow;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, -42, 34 + auraP, 52 + auraP, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Ko'z nur izlari
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = heroConfig.palette.glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(8, -72, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Verlet Plash / Sharf (Orqa qatlam)
    this.drawHandcraftedCape(ctx, fighter, isHitFlash);

    // 6. Qahramon Tanasi va Bo'g'imlari (Anime/Indie Fighter silueti)
    if (heroConfig.id === 'blaze_knight') {
      this.drawBlazeKnight(ctx, fighter, isHitFlash);
    } else if (heroConfig.id === 'shadow_ninja') {
      this.drawShadowNinja(ctx, fighter, isHitFlash);
    } else {
      this.drawFrostMage(ctx, fighter, isHitFlash);
    }

    // 7. Qilich Harakati va Hujum Yoyi Smearlari (Attack Slash Arcs)
    this.drawAttackSmear(ctx, fighter);

    ctx.restore();
  }

  // 1. Olovli Ritsar (Blaze Knight — Og'ir Temir Zirh, Yirtilgan Qizil Plash, Katta Qilich)
  drawBlazeKnight(ctx, fighter, isHitFlash) {
    const pal = fighter.heroConfig.palette;
    const { state } = fighter;

    // Orqa oyoq va boldir
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.strokeStyle = isHitFlash ? '#fff' : pal.armorMid;
    ctx.lineWidth = 2;
    // Oyoq silueti
    ctx.beginPath();
    ctx.roundRect(4, -28, 14, 28, 4);
    ctx.fill();
    ctx.stroke();
    // Sabaton (temir botinka)
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorMid;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(24, 0);
    ctx.lineTo(18, -10);
    ctx.lineTo(4, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Orqa yelka va qo'l
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.beginPath();
    ctx.roundRect(8, -54, 12, 22, 4);
    ctx.fill();
    ctx.restore();

    // Tana va Ko'krak Qafasi Zirhi (Cuirass with Magma Veins)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.strokeStyle = isHitFlash ? '#fff' : pal.armorLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -60);
    ctx.lineTo(16, -60);
    ctx.lineTo(12, -26);
    ctx.lineTo(-12, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Zirhning ichki o'yma chiziqlari va magma yoriqlari
    if (!isHitFlash) {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-6, -50);
      ctx.lineTo(0, -42);
      ctx.lineTo(8, -48);
      ctx.stroke();
    }
    // Temir kamar
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-14, -28, 28, 6);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-4, -28, 8, 6);
    ctx.restore();

    // Oldingi Oyoq va Greave
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorMid;
    ctx.strokeStyle = isHitFlash ? '#fff' : pal.armorLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -30, 14, 30, 4);
    ctx.fill();
    ctx.stroke();
    // Tizza qalqoni (poleyn)
    ctx.fillStyle = pal.armorLight;
    ctx.fillRect(-17, -22, 16, 8);
    // Oldingi sabaton
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, -10);
    ctx.lineTo(-16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dubulg'a (Great Helm with Glowing Visor Slit)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.strokeStyle = isHitFlash ? '#fff' : pal.armorLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -78, 22, 20, 6);
    ctx.fill();
    ctx.stroke();

    // Dubulg'a tepasidagi olovli toj / qirra
    ctx.fillStyle = isHitFlash ? '#fff' : pal.accent;
    ctx.beginPath();
    ctx.moveTo(-4, -78);
    ctx.lineTo(0, -88);
    ctx.lineTo(6, -78);
    ctx.closePath();
    ctx.fill();

    // Visor yorig'i (Ko'z nuri)
    if (!isHitFlash) {
      ctx.fillStyle = pal.eyeGlow;
      ctx.shadowColor = pal.eyeGlow;
      ctx.shadowBlur = 12;
      ctx.fillRect(2, -71, 9, 3);
    }
    ctx.restore();

    // Oldingi Yelka Zirhi (Layered Pauldron)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorMid;
    ctx.strokeStyle = isHitFlash ? '#fff' : pal.armorLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -62, 16, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Qurol: Katta Olovli Qilich (Two-Handed Claymore)
    this.drawKnightSword(ctx, fighter, isHitFlash);
  }

  // 2. Soya Qotili (Shadow Ninja — Ko'mir-Qora Shinobi, Binafsha Sharf, Egri Xanjar)
  drawShadowNinja(ctx, fighter, isHitFlash) {
    const pal = fighter.heroConfig.palette;
    const { state } = fighter;

    // Orqa oyoq va shinobi bog'ichlari
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.beginPath();
    ctx.roundRect(2, -26, 12, 26, 3);
    ctx.fill();
    // Oyoq kiyimi (Tabi)
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(2, -8, 16, 8);
    ctx.restore();

    // Tana (Shinobi Shozoku & Crossed Straps)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorMid;
    ctx.beginPath();
    ctx.moveTo(-12, -56);
    ctx.lineTo(14, -56);
    ctx.lineTo(10, -24);
    ctx.lineTo(-10, -24);
    ctx.closePath();
    ctx.fill();

    // Ko'krakdagi xoch shaklidagi charm bog'ichlar
    if (!isHitFlash) {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -52);
      ctx.lineTo(8, -26);
      ctx.moveTo(10, -52);
      ctx.lineTo(-8, -26);
      ctx.stroke();
    }
    ctx.restore();

    // Oldingi oyoq
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.beginPath();
    ctx.roundRect(-14, -28, 12, 28, 3);
    ctx.fill();
    // Binafsha tizma bog'ich
    ctx.fillStyle = pal.accent;
    ctx.fillRect(-15, -16, 14, 4);
    // Tabi
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(-14, -8, 18, 8);
    ctx.restore();

    // Bosh (Ninja Cowl & Face Mask with Blowing Headband)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.beginPath();
    ctx.arc(2, -68, 12, 0, Math.PI * 2);
    ctx.fill();

    // Yuz niqobi
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(-4, -68, 16, 12);

    // Ko'z kesmasi va binafsha nur
    if (!isHitFlash) {
      ctx.fillStyle = pal.eyeGlow;
      ctx.shadowColor = pal.eyeGlow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(6, -69, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boshbog'ning orqada hilpirab turgan tasmasi
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -70);
      const wave = Math.sin(this.animTime * 10) * 6;
      ctx.quadraticCurveTo(-18, -72 + wave, -30, -68 + wave * 1.5);
      ctx.stroke();
    }
    ctx.restore();

    // Qurol: Egri Soya Xanjari (Curved Shadow Dagger)
    this.drawNinjaDagger(ctx, fighter, isHitFlash);
  }

  // 3. Muz Sehrgari (Frost Mage — Tun-Ko'k Mantiya, Qirovli Zirh, Kristall Muz Tayog'i)
  drawFrostMage(ctx, fighter, isHitFlash) {
    const pal = fighter.heroConfig.palette;

    // Uzun Qirovli Mantiya (Robe Body)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorDark;
    ctx.strokeStyle = isHitFlash ? '#fff' : pal.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, -58);
    ctx.lineTo(14, -58);
    ctx.lineTo(20, 0);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mantiyaning oldingi ochiq qismi va kumush qirov zanjiri
    ctx.fillStyle = pal.armorMid;
    ctx.beginPath();
    ctx.moveTo(-4, -56);
    ctx.lineTo(4, -56);
    ctx.lineTo(8, 0);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Sehrgar Kapshoni (Mysterious Hood casting Face Shadow)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#fff' : pal.armorMid;
    ctx.beginPath();
    ctx.moveTo(-12, -58);
    ctx.lineTo(2, -78);
    ctx.lineTo(16, -58);
    ctx.closePath();
    ctx.fill();

    // Qorong'u yuz va moviy sehrli ko'zlar
    ctx.fillStyle = '#060a14';
    ctx.beginPath();
    ctx.arc(3, -66, 9, 0, Math.PI * 2);
    ctx.fill();

    if (!isHitFlash) {
      ctx.fillStyle = pal.eyeGlow;
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(6, -67, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Qurol: Kristall Muz Tayog'i (Crystal Ice Staff)
    this.drawMageStaff(ctx, fighter, isHitFlash);
  }

  // Plash / Sharf Verlet fizikasi
  drawHandcraftedCape(ctx, fighter, isHitFlash) {
    const { heroConfig } = fighter;
    ctx.save();
    ctx.strokeStyle = isHitFlash ? '#ffffff' : heroConfig.palette.cloth;
    ctx.lineWidth = heroConfig.id === 'shadow_ninja' ? 9 : 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -42);
    for (let i = 1; i < fighter.capePoints.length; i++) {
      const pt = fighter.capePoints[i];
      const lx = (pt.x - fighter.x) * fighter.facing;
      const ly = pt.y - fighter.y;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Qilichlar va Qurollar
  drawKnightSword(ctx, fighter, isHitFlash) {
    const pal = fighter.heroConfig.palette;
    const { state } = fighter;

    ctx.save();
    ctx.translate(14, -34);

    if (state === 'attack_light') ctx.rotate(-0.5);
    else if (state === 'attack_heavy') ctx.rotate(0.8);
    else if (state === 'block') ctx.rotate(-1.2);

    // Tig' (Blade)
    ctx.fillStyle = isHitFlash ? '#fff' : pal.weaponMetal;
    ctx.fillRect(0, -7, 52, 14);

    // Qilich uchi (Point)
    ctx.beginPath();
    ctx.moveTo(52, -7);
    ctx.lineTo(66, 0);
    ctx.lineTo(52, 7);
    ctx.closePath();
    ctx.fill();

    // Olovli yoriq nuri
    ctx.strokeStyle = pal.weaponAura;
    ctx.lineWidth = 3;
    ctx.shadowColor = pal.weaponAura;
    ctx.shadowBlur = 14;
    ctx.strokeRect(2, -5, 48, 10);

    // Qilich gardasi (Crossguard)
    ctx.fillStyle = '#262428';
    ctx.fillRect(-4, -14, 8, 28);

    // Qilich dastasi (Grip)
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(-16, -4, 12, 8);
    ctx.restore();
  }

  drawNinjaDagger(ctx, fighter, isHitFlash) {
    const pal = fighter.heroConfig.palette;
    const { state } = fighter;

    ctx.save();
    ctx.translate(12, -30);
    if (state === 'attack_light') ctx.rotate(-0.4);
    else if (state === 'attack_heavy') ctx.rotate(0.5);

    // Egri tig'
    ctx.fillStyle = isHitFlash ? '#fff' : pal.weaponMetal;
    ctx.shadowColor = pal.weaponAura;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.quadraticCurveTo(24, -12, 38, -2);
    ctx.quadraticCurveTo(20, 6, 0, 4);
    ctx.closePath();
    ctx.fill();

    // Dasta
    ctx.fillStyle = '#111827';
    ctx.fillRect(-10, -3, 10, 6);
    ctx.restore();
  }

  drawMageStaff(ctx, fighter, isHitFlash) {
    const pal = fighter.heroConfig.palette;
    ctx.save();
    ctx.translate(10, -28);

    // Tayoq dastasi
    ctx.strokeStyle = isHitFlash ? '#fff' : '#475569';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-6, 28);
    ctx.lineTo(18, -32);
    ctx.stroke();

    // Kristall uchi (Glowing Floating Ice Crystal)
    const floatP = Math.sin(this.animTime * 6) * 3;
    ctx.fillStyle = isHitFlash ? '#fff' : pal.accent;
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(20, -36 + floatP);
    ctx.lineTo(26, -44 + floatP);
    ctx.lineTo(20, -52 + floatP);
    ctx.lineTo(14, -44 + floatP);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Hujum Yoyi Smearlari (Attack Slash Arcs — Qilichning Havodagi Yarim Oy Izlari)
  drawAttackSmear(ctx, fighter) {
    const { state, stateTimer, heroConfig } = fighter;
    if (!['attack_light', 'attack_heavy', 'skill'].includes(state)) return;

    ctx.save();
    ctx.translate(16, -34);

    const isHeavy = state === 'attack_heavy';
    const isSkill = state === 'skill';
    const radius = isSkill ? 75 : isHeavy ? 65 : 50;

    // Yarim oy shaklidagi dinamik smear
    const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.7, heroConfig.palette.glow);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

    ctx.fillStyle = grad;
    ctx.shadowColor = heroConfig.palette.glow;
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI * 0.4, Math.PI * 0.4, false);
    ctx.arc(0, 0, radius * 0.7, Math.PI * 0.4, -Math.PI * 0.4, true);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawFullSilhouette(ctx, heroId) {
    ctx.beginPath();
    ctx.ellipse(0, -42, 28, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
