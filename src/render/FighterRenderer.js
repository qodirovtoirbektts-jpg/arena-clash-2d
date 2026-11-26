// Arena Clash 2D v3.2 — Shadow Fight & Ninja Usulidagi Real Inson Anatomiyasi Rendereri
export class FighterRenderer {
  constructor() {
    this.animTime = 0;
  }

  render(ctx, fighter, isAnimeKo = false) {
    if (!fighter) return;
    this.animTime += 0.016;

    const { x, y, facing, heroConfig, isAwakened, hitFlashTimer, state, afterimages } = fighter;

    // 1. Shadow Fight Sharpalari (Afterimages / Ghost Clones)
    if (afterimages && afterimages.length > 0) {
      for (const ghost of afterimages) {
        ctx.save();
        ctx.translate(ghost.x, ghost.y);
        ctx.scale(ghost.facing, 1);
        ctx.globalAlpha = ghost.alpha;
        ctx.fillStyle = '#07090f';
        ctx.shadowColor = ghost.glow || '#a855f7';
        ctx.shadowBlur = 16;
        this.drawFighterBody(ctx, ghost.heroId, ghost.state, false, true);
        ctx.restore();
      }
    }

    ctx.save();

    // 2. Dinamik Zamin Soyasi (Balandlikka mos elastik ellips)
    const distFromGround = Math.max(0, 520 - y);
    const shadowScale = Math.max(0.25, 1.0 - distFromGround / 320);
    const shadowAlpha = Math.max(0.12, 0.58 - distFromGround / 380);

    ctx.save();
    ctx.translate(x, 520);
    ctx.scale(shadowScale, shadowScale * 0.28);
    ctx.fillStyle = `rgba(3, 5, 10, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Anime KO Finisher Rejimi (Qora-qizil manga kontrasti)
    if (isAnimeKo) {
      ctx.translate(x, y);
      ctx.scale(facing, 1);
      ctx.fillStyle = fighter.isDead ? '#050508' : '#e11d48';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 28;
      this.drawFighterBody(ctx, heroConfig.id, state, false, true);
      ctx.restore();
      return;
    }

    // 4. Squash & Stretch va Nafas Harakati
    let sx = 1.0;
    let sy = 1.0;
    if (!fighter.isGrounded) {
      if (fighter.vy < -100) {
        sx = 0.93; sy = 1.07;
      } else if (fighter.vy > 100) {
        sx = 1.06; sy = 0.94;
      }
    } else if (state === 'idle') {
      const breath = Math.sin(this.animTime * 3.5) * 0.025;
      sy = 1.0 + breath;
      sx = 1.0 - breath * 0.5;
    } else if (state === 'run') {
      const runBob = Math.abs(Math.sin(this.animTime * 12)) * 0.04;
      sy = 1.0 - runBob;
    }

    ctx.translate(x, y);
    ctx.scale(facing * sx, sy);

    const isHitFlash = hitFlashTimer > 0;

    // Elementar Rim Lighting (Shadow Fight uslubida mushaklar chetidagi neon nur)
    ctx.shadowColor = isHitFlash ? '#ffffff' : heroConfig.palette.glow;
    ctx.shadowBlur = isAwakened ? 28 : 14;

    // Awakening / Rage Qat'iy Olovli Aulasi
    if (isAwakened) {
      ctx.save();
      const auraP = Math.sin(this.animTime * 14) * 4;
      ctx.strokeStyle = heroConfig.palette.glow;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, -52, 36 + auraP, 60 + auraP, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Ko'z nurining shamolda cho'zilishi
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = heroConfig.palette.glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(10, -88, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Shamolda Hilpirayotgan Mato (Verlet Scarf / Cape)
    this.drawShadowCloth(ctx, fighter, isHitFlash);

    // 6. Inson Anatomiyasidagi Jangchi (Shadow Fight uslubidagi 7.5 bosh nisbati)
    this.drawFighterBody(ctx, heroConfig.id, state, isHitFlash, false);

    // 7. Qilich Harakati va Hujum Yoyi Smearlari (Attack Slash Arcs)
    this.drawAttackSmear(ctx, fighter);

    ctx.restore();
  }

  // Shadow Fight uslubidagi Inson Anatomiyasi (Proportional 7.5-head athletic build)
  drawFighterBody(ctx, heroId, state, isHitFlash, isGhost = false) {
    const isAttacking = ['attack_light', 'attack_heavy', 'skill'].includes(state);
    const isHeavy = state === 'attack_heavy';
    const isBlocking = state === 'block';

    // Retslar va ranglar
    let baseColor = isGhost ? '#07090f' : isHitFlash ? '#ffffff' : '#0c1018';
    let armorColor = isGhost ? '#07090f' : isHitFlash ? '#ffffff' : '#182030';
    let accentColor = heroId === 'blaze_knight' ? '#ff5a1f' : heroId === 'shadow_ninja' ? '#a855f7' : '#00e5ff';

    // 1. ORQA OYOQ (Muscular Rear Leg: Thigh + Knee + Calf + Tabi)
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = isGhost ? accentColor : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;

    // Orqa son (Thigh)
    ctx.beginPath();
    ctx.moveTo(4, -46);
    ctx.lineTo(16, -24);
    ctx.lineTo(8, -22);
    ctx.lineTo(2, -44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Orqa boldir va Tabi (Calf & Foot)
    ctx.beginPath();
    ctx.moveTo(12, -22);
    ctx.lineTo(18, 0);
    ctx.lineTo(28, 0);
    ctx.lineTo(22, -10);
    ctx.lineTo(8, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. ORQA QO'L (Rear Arm & Weapon Handle)
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(8, -78);
    ctx.lineTo(18, -62);
    ctx.lineTo(14, -46);
    ctx.lineTo(8, -48);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. TANA / QAD-QOMAT (Athletic V-Taper Torso & Abs)
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = isGhost ? accentColor : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.8;

    // Ko'krak qafasi va yelka kengligi (Pectoral V-Taper)
    ctx.beginPath();
    ctx.moveTo(-18, -82);
    ctx.lineTo(18, -82);
    ctx.lineTo(12, -52);
    ctx.lineTo(-12, -52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Qorin va bel (Abdominal & Waist)
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.moveTo(-12, -52);
    ctx.lineTo(12, -52);
    ctx.lineTo(9, -38);
    ctx.lineTo(-9, -38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mushaklar va Zirh plitalari chiziqlari (Anatomical contours)
    if (!isHitFlash && !isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      // Ko'krakdagi elementar chiziq
      ctx.beginPath();
      ctx.moveTo(-8, -70);
      ctx.lineTo(0, -64);
      ctx.lineTo(8, -70);
      ctx.stroke();
    }

    // Jangovar Belbog' (Obi Sash & Buckle)
    ctx.fillStyle = accentColor;
    ctx.fillRect(-12, -40, 24, 5);
    // Belbog'dan osilib turgan lentalar
    ctx.fillRect(-2, -35, 4, 16);
    ctx.fillRect(4, -35, 4, 12);
    ctx.restore();

    // 4. OLDINGI OYOQ (Athletic Front Leg in Martial Arts Stance)
    ctx.save();
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = isGhost ? accentColor : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.8;

    // Oldingi son (Muscular Thigh)
    ctx.beginPath();
    ctx.moveTo(-8, -46);
    ctx.lineTo(-2, -22);
    ctx.lineTo(-14, -20);
    ctx.lineTo(-16, -44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tizza qalqoni (Knee Guard)
    ctx.fillStyle = accentColor;
    ctx.fillRect(-12, -24, 10, 5);

    // Oldingi boldir va Tabi botinkasi (Kyahan Shin Wraps & Foot)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.lineTo(-12, 0);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 5. BOSH VA BO'YIN (Chiseled Chin, Cowl/Helmet & Glowing Slit)
    ctx.save();
    // Bo'yin (Neck)
    ctx.fillStyle = baseColor;
    ctx.fillRect(-4, -88, 8, 8);

    // Bosh (Stylized Ninja Cowl / Kabuto Helmet)
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = isGhost ? accentColor : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(-10, -100);
    ctx.lineTo(8, -102);
    ctx.lineTo(14, -94);
    ctx.lineTo(8, -84);
    ctx.lineTo(-6, -84);
    ctx.lineTo(-12, -92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ninja Yuz Niqobi va Ko'z Tirqishi (Glowing Slit Eye)
    if (!isHitFlash && !isGhost) {
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(3, -93);
      ctx.lineTo(11, -94);
      ctx.lineTo(9, -91);
      ctx.lineTo(3, -91);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 6. OLDINGI QO'L VA QUROL (Front Arm, Vambrace & Weapon Hand)
    ctx.save();
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = isGhost ? accentColor : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.8;

    // Yelka (Deltoid) va Tirsak
    ctx.beginPath();
    ctx.roundRect(-20, -82, 14, 16, 4);
    ctx.fill();
    ctx.stroke();

    // Bilak (Forearm & Vambrace)
    let armAngle = isBlocking ? -1.1 : isHeavy ? 0.9 : isAttacking ? -0.5 : 0.2;
    ctx.translate(-12, -70);
    ctx.rotate(armAngle);

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, 10, 24, 3);
    ctx.fill();
    ctx.stroke();

    // Qurolni chizish (Handheld Ninja/Knight Weapons)
    if (!isGhost) {
      this.drawHandheldWeapon(ctx, heroId, isHitFlash, accentColor);
    }
    ctx.restore();
  }

  // Qurollar: Ninja Xanjari / Qilichi, Ritsar Katana / Qilichi, Sehrgar Asosi
  drawHandheldWeapon(ctx, heroId, isHitFlash, accentColor) {
    ctx.save();
    ctx.translate(5, 22);

    if (heroId === 'shadow_ninja') {
      // Egri Ninja Qilichi (Ninjato / Katana)
      ctx.fillStyle = isHitFlash ? '#fff' : '#c4b5fd';
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(28, -20, 68, -12);
      ctx.quadraticCurveTo(34, -4, 0, 4);
      ctx.closePath();
      ctx.fill();

      // Dasta va Tsuba gardasi
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-12, -2, 12, 6);
      ctx.fillStyle = accentColor;
      ctx.fillRect(-2, -6, 4, 14);
    } else if (heroId === 'blaze_knight') {
      // Og'ir Olovli Nodachi / Katta Qilich
      ctx.fillStyle = isHitFlash ? '#fff' : '#fed7aa';
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 18;

      ctx.fillRect(0, -7, 72, 14);
      // Uchi
      ctx.beginPath();
      ctx.moveTo(72, -7);
      ctx.lineTo(88, 0);
      ctx.lineTo(72, 7);
      ctx.closePath();
      ctx.fill();

      // Magma o'yig'i
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, -4, 64, 8);

      // Gardasi
      ctx.fillStyle = '#292524';
      ctx.fillRect(-4, -16, 8, 32);
      // Dasta
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-18, -4, 14, 8);
    } else {
      // Kristall Muz Naginata Tayog'i
      ctx.strokeStyle = isHitFlash ? '#fff' : '#94a3b8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-18, 30);
      ctx.lineTo(24, -48);
      ctx.stroke();

      // Kristall uch
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(24, -48);
      ctx.lineTo(34, -62);
      ctx.lineTo(24, -76);
      ctx.lineTo(14, -62);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Shadow Fight uslubidagi lentalar va sharf (Verlet Cloth Ribbons)
  drawShadowCloth(ctx, fighter, isHitFlash) {
    const { heroConfig } = fighter;
    ctx.save();
    ctx.strokeStyle = isHitFlash ? '#ffffff' : heroConfig.palette.cloth;
    ctx.lineWidth = heroConfig.id === 'shadow_ninja' ? 10 : 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -60);
    for (let i = 1; i < fighter.capePoints.length; i++) {
      const pt = fighter.capePoints[i];
      const lx = (pt.x - fighter.x) * fighter.facing;
      const ly = pt.y - fighter.y;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Dynamic Curved Attack Slash Arcs (Qilichning yarim oy shaklidagi havodagi nuri)
  drawAttackSmear(ctx, fighter) {
    const { state, heroConfig } = fighter;
    if (!['attack_light', 'attack_heavy', 'skill'].includes(state)) return;

    ctx.save();
    ctx.translate(20, -42);

    const isHeavy = state === 'attack_heavy';
    const isSkill = state === 'skill';
    const radius = isSkill ? 95 : isHeavy ? 80 : 60;

    const grad = ctx.createRadialGradient(0, 0, radius * 0.45, 0, 0, radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.65, heroConfig.palette.glow);
    grad.addColorStop(1, '#ffffff');

    ctx.fillStyle = grad;
    ctx.shadowColor = heroConfig.palette.glow;
    ctx.shadowBlur = 24;

    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI * 0.45, Math.PI * 0.45, false);
    ctx.arc(0, 0, radius * 0.68, Math.PI * 0.45, -Math.PI * 0.45, true);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
