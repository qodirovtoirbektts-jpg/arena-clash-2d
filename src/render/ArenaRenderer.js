// Arena Clash 2D v3.2 — Handcrafted Atmospheric Battleground Arena Renderer
export class ArenaRenderer {
  constructor() {
    this.currentArena = 'fire_castle';
    this.animTime = 0;
    this.decals = []; // Zamin izlari
    this.embers = []; // Ko'tariluvchi cho'g'lar
    this.fogClouds = [];

    // Olov cho'g'lari
    for (let i = 0; i < 35; i++) {
      this.embers.push({
        x: Math.random() * 1280,
        y: 400 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 30,
        vy: -40 - Math.random() * 60,
        size: 1.5 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    // Tuman qatlamlari
    for (let i = 0; i < 5; i++) {
      this.fogClouds.push({
        x: i * 280,
        y: 490,
        width: 320,
        height: 60,
        vx: 15 + Math.random() * 10,
      });
    }
  }

  setArena(arenaId) {
    this.currentArena = arenaId;
  }

  addDecal(type, x, y = 520, radius = 28) {
    this.decals.push({
      type, // 'scorch' | 'frost' | 'shadow'
      x,
      y,
      radius,
      life: 12.0,
      maxLife: 12.0,
    });
    if (this.decals.length > 40) {
      this.decals.shift();
    }
  }

  update(dt) {
    this.animTime += dt;

    // Decallarni yangilash
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].life -= dt;
      if (this.decals[i].life <= 0) {
        this.decals.splice(i, 1);
      }
    }

    // Embers
    for (const em of this.embers) {
      em.x += em.vx * dt;
      em.y += em.vy * dt;
      if (em.y < 150) {
        em.y = 520;
        em.x = Math.random() * 1280;
      }
    }

    // Fog
    for (const f of this.fogClouds) {
      f.x += f.vx * dt;
      if (f.x > 1350) f.x = -350;
    }
  }

  render(ctx, camera, arenaObjects, mutator = 'none') {
    // 1. Chuqur Qadimiy Qal'a Osmoni (Handcrafted Atmospheric Gradient)
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 520);
    skyGrad.addColorStop(0, '#090507');
    skyGrad.addColorStop(0.4, '#1c0b0f');
    skyGrad.addColorStop(0.8, '#2d1313');
    skyGrad.addColorStop(1, '#451c14');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // "Toxa Ai Studio" Arena Orqa Fonidagi Neon / Tosh Yozuvi
    ctx.save();
    ctx.translate(640, 110 - (camera.y * 0.08));
    ctx.font = '900 32px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 90, 31, 0.45)';
    ctx.shadowColor = '#ff5a1f';
    ctx.shadowBlur = 18;
    ctx.letterSpacing = '0.2em';
    ctx.fillText('TOXA AI STUDIO', 0, 0);

    ctx.font = '600 12px "Orbitron", sans-serif';
    ctx.fillStyle = 'rgba(234, 246, 255, 0.35)';
    ctx.shadowBlur = 8;
    ctx.fillText('TACTICAL BATTLEGROUND // CHAMPIONSHIP', 0, 26);
    ctx.restore();

    // Qadimiy tosh qal'a devorlari va minoralar (Parallax layer 1)
    ctx.fillStyle = 'rgba(24, 12, 14, 0.75)';
    for (let i = 0; i < 6; i++) {
      const colX = i * 240 - (camera.x * 0.12) % 240;
      // Minoralar
      ctx.fillRect(colX, 180, 70, 340);
      // Minora tishlari (Crenellations)
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(colX + j * 24, 164, 16, 16);
      }
    }
    ctx.restore();

    // 2. Mash'alalar va Tirik Olovlar (Parallax layer 2)
    ctx.save();
    const torchPositions = [160, 420, 680, 940, 1200];
    for (const tx of torchPositions) {
      const px = tx - (camera.x * 0.25) % 300;
      const py = 330;

      // Mash'ala nuri (Radial Bloom)
      const flicker = Math.sin(this.animTime * 10 + tx) * 8;
      const glowGrad = ctx.createRadialGradient(px, py, 4, px, py, 90 + flicker);
      glowGrad.addColorStop(0, 'rgba(255, 140, 40, 0.55)');
      glowGrad.addColorStop(0.4, 'rgba(255, 70, 10, 0.2)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(px, py, 90 + flicker, 0, Math.PI * 2);
      ctx.fill();

      // Qora temir mash'ala ushlagichi
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(px - 4, py + 8, 8, 30);
      ctx.fillRect(px - 10, py + 6, 20, 6);

      // Olov tillari
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.arc(px, py, 6 + Math.sin(this.animTime * 12) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Ko'tarilayotgan Olov Cho'g'lari (Embers)
    ctx.save();
    for (const em of this.embers) {
      ctx.fillStyle = '#ff9040';
      ctx.globalAlpha = em.alpha * (0.8 + Math.sin(this.animTime * 8 + em.x) * 0.2);
      ctx.shadowColor = '#ff5a1f';
      ctx.shadowBlur = 8;
      ctx.fillRect(em.x, em.y, em.size, em.size);
    }
    ctx.restore();

    // 4. Asosiy Zamin: Qadimiy Tosh Plitalar (Handcrafted Paved Battleground)
    ctx.save();
    const groundY = 520;

    // Asosiy tosh qatlam
    const stoneGrad = ctx.createLinearGradient(0, groundY, 0, 720);
    stoneGrad.addColorStop(0, '#292524');
    stoneGrad.addColorStop(0.2, '#1c1917');
    stoneGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(0, groundY, 1280, 200);

    // Qadimiy tosh plitalari va yoriqlari
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1280; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 18, 720);
      ctx.stroke();

      // Gorizontal tosh bo'g'inlari
      ctx.beginPath();
      ctx.moveTo(x, groundY + 40);
      ctx.lineTo(x + 100, groundY + 40);
      ctx.stroke();
    }

    // Zaminning yuqori yonuvchi jiyagi
    ctx.fillStyle = '#ff5a1f';
    ctx.shadowColor = '#ff5a1f';
    ctx.shadowBlur = 16;
    ctx.fillRect(0, groundY, 1280, 4);

    // Zaminga o'yilgan "TOXA AI STUDIO" Arena Medallioni
    ctx.save();
    ctx.translate(640, groundY + 68);
    ctx.font = '900 24px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 90, 31, 0.35)';
    ctx.shadowColor = '#ff5a1f';
    ctx.shadowBlur = 14;
    ctx.fillText('⚡ TOXA AI STUDIO • CYBER ARENA ⚡', 0, 0);
    ctx.restore();

    ctx.restore();

    // 5. Zamin Decallari (Haqiqiy jang izlari — Scorch, Frost, Blood/Shadow)
    ctx.save();
    for (const d of this.decals) {
      const alpha = Math.min(1, d.life / (d.maxLife * 0.35));
      ctx.globalAlpha = alpha;

      if (d.type === 'scorch') {
        // Qoraygan yonish izi
        ctx.fillStyle = '#0c0a09';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.radius, d.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magma yoriqlari
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x - 14, d.y + 2);
        ctx.lineTo(d.x + 4, d.y + 5);
        ctx.lineTo(d.x + 16, d.y - 1);
        ctx.stroke();
      } else if (d.type === 'frost') {
        // Qirov va muz kristallari
        ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.radius, d.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Soya izi
        ctx.fillStyle = 'rgba(88, 28, 135, 0.45)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.radius, d.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 6. Zaminda Suzuvchi Tuman (Atmospheric Ground Mist)
    ctx.save();
    for (const fog of this.fogClouds) {
      const fogGrad = ctx.createLinearGradient(fog.x, fog.y, fog.x, fog.y + fog.height);
      fogGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      fogGrad.addColorStop(0.6, 'rgba(255, 140, 50, 0.08)');
      fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(fog.x, fog.y, fog.width, fog.height);
    }
    ctx.restore();

    // 7. Arena Obyektlari (Platformalar va Lava)
    if (arenaObjects) {
      arenaObjects.render(ctx);
    }
  }
}
