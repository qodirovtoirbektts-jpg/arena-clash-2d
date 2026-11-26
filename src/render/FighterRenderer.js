// Arena Clash 2D v3.2 — Dark Semi-Realism Qahramon Rendereri (FighterRenderer.js)
export class FighterRenderer {
  constructor() {
    this.animTime = 0;
  }

  render(ctx, fighter, isAnimeKo = false) {
    if (!fighter) return;
    this.animTime += 0.016;

    ctx.save();
    const { x, y, facing, heroConfig, isAwakened, hitFlashTimer } = fighter;

    // 1. Balandlikka mos yumshoq yer soyasi
    const distFromGround = Math.max(0, 520 - y);
    const shadowScale = Math.max(0.3, 1.0 - distFromGround / 350);
    const shadowAlpha = Math.max(0.1, 0.5 - distFromGround / 450);

    ctx.save();
    ctx.translate(x, 520);
    ctx.scale(shadowScale, shadowScale * 0.35);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Anime KO Finisher Rejimi (Qora-qizil manga silueti)
    if (isAnimeKo) {
      ctx.translate(x, y);
      ctx.scale(facing, 1);
      ctx.fillStyle = fighter.isDead ? '#000000' : '#DC2626';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(0, -42, 28, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 3. Qahramon koordinatalari va yo'nalishi
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // 80ms Oq Hit Flash
    const isHitFlash = hitFlashTimer > 0;

    // Elementar Rim Lighting
    ctx.shadowColor = isHitFlash ? '#FFFFFF' : heroConfig.palette.glow;
    ctx.shadowBlur = isAwakened ? 22 : 10;

    // Awakening / Rage aulasi
    if (isAwakened) {
      ctx.save();
      const auraFlicker = Math.sin(this.animTime * 12) * 4;
      ctx.strokeStyle = heroConfig.palette.glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -42, 32 + auraFlicker, 50 + auraFlicker, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Verlet Plash / Sharf (Orqa qatlam)
    ctx.save();
    ctx.strokeStyle = isHitFlash ? '#FFFFFF' : heroConfig.palette.cloth;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -42);
    for (let i = 1; i < fighter.capePoints.length; i++) {
      const pt = fighter.capePoints[i];
      // Fighter lokal koordinatasiga o'tkazish
      const lx = (pt.x - x) * facing;
      const ly = pt.y - y;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
    ctx.restore();

    // 5. Orqa oyoq va qo'l
    this.drawLimb(ctx, 8, -6, 22, isHitFlash, heroConfig.palette.armorDark);
    this.drawLimb(ctx, 10, -38, 18, isHitFlash, heroConfig.palette.armorMid);

    // 6. Tana / Torso (Qoraytirilgan temir zirh va magma yoriqlari)
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#FFFFFF' : heroConfig.palette.armorDark;
    ctx.beginPath();
    ctx.roundRect(-16, -58, 32, 36, 6);
    ctx.fill();

    // Zirh plastinasi (Ko'krak qafasi)
    ctx.fillStyle = isHitFlash ? '#FFFFFF' : heroConfig.palette.armorMid;
    ctx.beginPath();
    ctx.roundRect(-12, -54, 24, 20, 4);
    ctx.fill();

    // Magma / Soya yoriqlari (Aksent)
    if (!isHitFlash) {
      ctx.strokeStyle = heroConfig.palette.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -48);
      ctx.lineTo(2, -42);
      ctx.lineTo(6, -46);
      ctx.stroke();
    }
    ctx.restore();

    // 7. Bosh va Dubulg'a
    ctx.save();
    ctx.fillStyle = isHitFlash ? '#FFFFFF' : heroConfig.palette.armorDark;
    ctx.beginPath();
    ctx.arc(2, -70, 15, 0, Math.PI * 2);
    ctx.fill();

    // Yonuvchi ko'zlar (Dark Semi-Realism)
    if (!isHitFlash) {
      ctx.fillStyle = heroConfig.palette.eyeGlow;
      ctx.shadowColor = heroConfig.palette.eyeGlow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(8, -71, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 8. Oldingi oyoq va qo'l
    this.drawLimb(ctx, -8, -6, 24, isHitFlash, heroConfig.palette.armorMid);
    this.drawLimb(ctx, -6, -38, 20, isHitFlash, heroConfig.palette.armorLight);

    // 9. Elementar Qurol (Katta qilich / Xanjar / Muz tayog'i)
    this.drawWeapon(ctx, fighter, isHitFlash);

    ctx.restore();
  }

  drawLimb(ctx, ox, oy, len, isHitFlash, color) {
    ctx.save();
    ctx.strokeStyle = isHitFlash ? '#FFFFFF' : color;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + len);
    ctx.stroke();
    ctx.restore();
  }

  drawWeapon(ctx, fighter, isHitFlash) {
    const { heroConfig, state } = fighter;
    ctx.save();
    ctx.translate(14, -30);

    // Hujum vaqtida qurol aylanishi
    if (state === 'attack_light') {
      ctx.rotate(-0.4);
    } else if (state === 'attack_heavy') {
      ctx.rotate(0.6);
    } else if (state === 'block') {
      ctx.rotate(-1.2);
    }

    if (heroConfig.id === 'blaze_knight') {
      // Olovli Katta Qilich
      ctx.fillStyle = isHitFlash ? '#FFFFFF' : heroConfig.palette.weaponMetal;
      ctx.fillRect(0, -6, 46, 12);
      // Dasta
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(-12, -4, 12, 8);
      // Olov tig'i nuri
      ctx.strokeStyle = heroConfig.palette.weaponAura;
      ctx.lineWidth = 3;
      ctx.shadowColor = heroConfig.palette.weaponAura;
      ctx.shadowBlur = 14;
      ctx.strokeRect(0, -6, 46, 12);
    } else if (heroConfig.id === 'shadow_ninja') {
      // Egri Soya Xanjari
      ctx.fillStyle = isHitFlash ? '#FFFFFF' : heroConfig.palette.weaponMetal;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(28, -8);
      ctx.lineTo(34, 4);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();
    } else {
      // Kristall Muz Tayog'i
      ctx.strokeStyle = isHitFlash ? '#FFFFFF' : '#94A3B8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-4, 14);
      ctx.lineTo(16, -26);
      ctx.stroke();
      // Kristall uchi
      ctx.fillStyle = heroConfig.palette.accent;
      ctx.shadowColor = heroConfig.palette.glow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(16, -26, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
