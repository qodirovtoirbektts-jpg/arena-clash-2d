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
        this.drawFighterBody(ctx, ghost.heroId, ghost.state, false, true, 0);
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
      this.drawFighterBody(ctx, heroConfig.id, state, false, true, fighter.currentWeaponIndex || 0);
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
    this.drawFighterBody(ctx, heroConfig.id, state, isHitFlash, false, fighter.currentWeaponIndex || 0);

    // 7. Qilich Harakati va Hujum Yoyi Smearlari (Attack Slash Arcs)
    this.drawAttackSmear(ctx, fighter);

    ctx.restore();
  }

  // Shadow Fight uslubidagi Inson Anatomiyasi (Proportional 7.5-head athletic build)
  drawFighterBody(ctx, heroId, state, isHitFlash, isGhost = false, weaponIndex = 0) {
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
      this.drawHandheldWeapon(ctx, heroId, isHitFlash, accentColor, weaponIndex);
    }
    ctx.restore();
  }

  // Qurollar: Har bir qahramon uchun 3 xil to'liq qurollar to'plami
  drawHandheldWeapon(ctx, heroId, isHitFlash, accentColor, weaponIndex = 0) {
    ctx.save();
    ctx.translate(5, 22);

    if (heroId === 'shadow_ninja') {
      if (weaponIndex === 0) {
        // 1. Egri Ninja Qilichi (Ninjato / Katana)
        ctx.fillStyle = isHitFlash ? '#fff' : '#c4b5fd';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(28, -20, 68, -12);
        ctx.quadraticCurveTo(34, -4, 0, 4);
        ctx.closePath();
        ctx.fill();

        // Dasta va Tsuba gardasi
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-14, -2, 14, 6);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-2, -7, 4, 16);
      } else if (weaponIndex === 1) {
        // 2. Egizak Soya Xanjarlari (Dual Tactical Trench Daggers)
        ctx.fillStyle = isHitFlash ? '#fff' : '#e9d5ff';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 16;

        // Oldingi xanjar (Asosiy qo'l)
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(38, -10);
        ctx.lineTo(34, -2);
        ctx.lineTo(0, 4);
        ctx.closePath();
        ctx.fill();

        // Dasta va tishli garda
        ctx.fillStyle = '#2e1065';
        ctx.fillRect(-10, -3, 10, 6);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-2, -6, 3, 12);

        // Ikkinchi (orqa qo'ldagi) xanjar sharpasi
        ctx.save();
        ctx.translate(-14, 6);
        ctx.rotate(0.65);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.85)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(28, -6);
        ctx.lineTo(24, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // 3. Kusarigama Zanjirli O'roq (Chain Scythe & Hanging Weight)
        ctx.fillStyle = isHitFlash ? '#fff' : '#d8b4fe';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 18;

        // O'roq dastasi (Kama handle)
        ctx.fillStyle = '#1f1635';
        ctx.fillRect(-4, -10, 8, 36);

        // O'roqning yarimoy egri tig'i
        ctx.fillStyle = isHitFlash ? '#fff' : '#c084fc';
        ctx.beginPath();
        ctx.moveTo(2, -10);
        ctx.quadraticCurveTo(24, -32, 52, -22);
        ctx.quadraticCurveTo(28, -14, 2, -4);
        ctx.closePath();
        ctx.fill();

        // Zanjir halqalari (Hanging chain links)
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let chainX = -2;
        let chainY = 26;
        for (let i = 0; i < 5; i++) {
          const sway = Math.sin(this.animTime * 6 + i) * 3;
          ctx.lineTo(chainX + sway, chainY + i * 8);
        }
        ctx.stroke();

        // Zanjir uchidagi vazmin tosh / po'lat yuk (Fundo Weight)
        const finalSway = Math.sin(this.animTime * 6 + 5) * 3;
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(chainX + finalSway, chainY + 44, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (heroId === 'blaze_knight') {
      if (weaponIndex === 0) {
        // 1. Olovli Katta Qilich (Flame Greatsword)
        ctx.fillStyle = isHitFlash ? '#fff' : '#fed7aa';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 20;

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
      } else if (weaponIndex === 1) {
        // 2. Magma Jang Bolg'asi (Magma War Hammer)
        // Bolg'a dastasi
        ctx.fillStyle = '#292524';
        ctx.fillRect(-8, -4, 52, 8);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-14, -5, 8, 10);

        // Katta to'rtburchak bolg'a boshi (Massive Impact Block)
        ctx.fillStyle = isHitFlash ? '#fff' : '#1c1917';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 22;

        ctx.fillRect(44, -22, 28, 44);
        ctx.strokeRect(44, -22, 28, 44);

        // Magma yoriqlari
        ctx.fillStyle = '#ff7a00';
        ctx.beginPath();
        ctx.moveTo(48, -12);
        ctx.lineTo(62, -4);
        ctx.lineTo(54, 8);
        ctx.lineTo(68, 16);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Orqa zirh teshar nayza (Armor-Piercing Spike)
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.moveTo(44, -6);
        ctx.lineTo(30, 0);
        ctx.lineTo(44, 6);
        ctx.closePath();
        ctx.fill();
      } else {
        // 3. Olovli Halberd Nayza (Fire Halberd / Spear)
        // Uzun nayza dastasi (Polearm shaft)
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-22, -3, 102, 6);

        // Nayza uchi (Diamond Spearhead)
        ctx.fillStyle = isHitFlash ? '#fff' : '#fed7aa';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.moveTo(80, -6);
        ctx.lineTo(108, 0);
        ctx.lineTo(80, 6);
        ctx.closePath();
        ctx.fill();

        // Yon o'roq/bolta tig'i (Side Crescent Blade)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(68, -3);
        ctx.quadraticCurveTo(86, -26, 62, -30);
        ctx.quadraticCurveTo(70, -14, 68, -3);
        ctx.closePath();
        ctx.fill();

        // Oltin halqalar
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(50, -4, 4, 8);
        ctx.fillRect(72, -4, 4, 8);
      }
    } else {
      // FROST MAGE
      if (weaponIndex === 0) {
        // 1. Kristall Muz Asosi (Crystal Frost Staff)
        ctx.strokeStyle = isHitFlash ? '#fff' : '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-18, 30);
        ctx.lineTo(26, -52);
        ctx.stroke();

        // Sehrli kristall uch (Floating Cyan Octahedron Gem)
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(26, -52);
        ctx.lineTo(36, -66);
        ctx.lineTo(26, -82);
        ctx.lineTo(16, -66);
        ctx.closePath();
        ctx.fill();

        // Aylanuvchi muz parchalari (Orbiting frost shards)
        const rot = this.animTime * 5;
        for (let i = 0; i < 3; i++) {
          const a = rot + (i * Math.PI * 2) / 3;
          const ox = 26 + Math.cos(a) * 16;
          const oy = -66 + Math.sin(a) * 8;
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (weaponIndex === 1) {
        // 2. Muz Kristall Shpagasi (Glacial Ice Rapier)
        ctx.fillStyle = isHitFlash ? '#fff' : '#e0f2fe';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 20;

        // O'tkir ingichka tig'
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(76, 0);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();

        // Shpagadagi yarimoy qirovli garda (Swept Basket Hilt)
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-2, 0, 10, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // Dasta
        ctx.fillStyle = '#0e1e3a';
        ctx.fillRect(-14, -2, 12, 4);
      } else {
        // 3. Muzli Arktik Kosa / Glaive (Frost Naginata / Scythe)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-20, 20);
        ctx.lineTo(36, -42);
        ctx.stroke();

        // Keng yarimoy muz tig'i
        ctx.fillStyle = isHitFlash ? '#fff' : 'rgba(56, 189, 248, 0.9)';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.moveTo(34, -40);
        ctx.quadraticCurveTo(68, -72, 88, -50);
        ctx.quadraticCurveTo(62, -48, 40, -32);
        ctx.closePath();
        ctx.fill();

        // Arktik tishlar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(56, -60);
        ctx.lineTo(66, -68);
        ctx.lineTo(62, -56);
        ctx.closePath();
        ctx.fill();
      }
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
