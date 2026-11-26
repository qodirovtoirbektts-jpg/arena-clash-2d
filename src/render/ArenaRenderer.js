// Arena Clash 2D v3.2 — Advanced 2.5D Parallax & Ground Decals Renderer
export class ArenaRenderer {
  constructor() {
    this.currentArena = 'cyber_grid'; // 'cyber_grid' | 'fire_castle' | 'frost_temple'
    this.animTime = 0;
    this.decals = []; // Zamin izlari (scorch marks, frost cracks, shadow runes)
    this.cyberRain = [];

    // Ambient kibernetik yomg'ir / zarralar
    for (let i = 0; i < 40; i++) {
      this.cyberRain.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        speed: 300 + Math.random() * 400,
        length: 12 + Math.random() * 24,
      });
    }
  }

  setArena(arenaId) {
    this.currentArena = arenaId;
  }

  addDecal(type, x, y = 520, radius = 24) {
    this.decals.push({
      type, // 'scorch' | 'frost' | 'shadow'
      x,
      y,
      radius,
      life: 10.0,
      maxLife: 10.0,
    });
    if (this.decals.length > 50) {
      this.decals.shift();
    }
  }

  update(dt) {
    this.animTime += dt;

    // Decallar sekin so'nadi
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].life -= dt;
      if (this.decals[i].life <= 0) {
        this.decals.splice(i, 1);
      }
    }

    // Cyber rain
    for (const r of this.cyberRain) {
      r.y += r.speed * dt;
      if (r.y > 720) {
        r.y = -30;
        r.x = Math.random() * 1280;
      }
    }
  }

  render(ctx, camera, arenaObjects, mutator = 'none') {
    const isCyber = this.currentArena === 'cyber_grid';
    const isFire = this.currentArena === 'fire_castle';

    // 1. Uzoq Parallax Qatlam (Osmon / Cyberspace Grid)
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    if (isCyber) {
      skyGrad.addColorStop(0, '#02040a');
      skyGrad.addColorStop(0.5, '#050c1e');
      skyGrad.addColorStop(1, '#091833');
    } else if (isFire) {
      skyGrad.addColorStop(0, '#0a0506');
      skyGrad.addColorStop(0.5, '#200b0e');
      skyGrad.addColorStop(1, '#3b1410');
    } else {
      skyGrad.addColorStop(0, '#040914');
      skyGrad.addColorStop(0.5, '#0c1a30');
      skyGrad.addColorStop(1, '#183154');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Kiber Vertikal Grid Chiziqlari (Parallax)
    ctx.strokeStyle = isCyber ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1280; x += 64) {
      const px = x - (camera.x * 0.1) % 64;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, 520);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Ambient Cyber Rain / Sparks
    ctx.save();
    ctx.strokeStyle = isCyber ? 'rgba(76, 201, 240, 0.25)' : 'rgba(255, 90, 31, 0.2)';
    ctx.lineWidth = 1.5;
    for (const r of this.cyberRain) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + r.length);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Asosiy Pol va Zamin Plitalari (520px)
    ctx.save();
    const groundY = 520;

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, 720);
    groundGrad.addColorStop(0, '#0b1324');
    groundGrad.addColorStop(0.3, '#060a14');
    groundGrad.addColorStop(1, '#02040a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, 1280, 200);

    // Neon Yoritilgan Yuqori Chekka (Hazard Hairline)
    ctx.fillStyle = isCyber ? '#00e5ff' : isFire ? '#ff5a1f' : '#38bdf8';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.fillRect(0, groundY, 1280, 4);
    ctx.shadowBlur = 0;

    // Pol Plitalari va Rivet Nuqtalari
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.12)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 1280; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 4);
      ctx.lineTo(x + 25, 720);
      ctx.stroke();

      // Rivet dot
      ctx.fillStyle = 'rgba(76, 201, 240, 0.3)';
      ctx.fillRect(x + 4, groundY + 12, 3, 3);
    }
    ctx.restore();

    // 4. Zamin Decallari (Scorch marks, Frost, Shadow)
    ctx.save();
    for (const d of this.decals) {
      const alpha = Math.min(1, d.life / (d.maxLife * 0.4));
      ctx.globalAlpha = alpha;

      if (d.type === 'scorch') {
        ctx.fillStyle = 'rgba(20, 10, 8, 0.85)';
        ctx.strokeStyle = '#ff5a1f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.radius, d.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (d.type === 'frost') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.radius, d.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(181, 123, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.radius, d.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 5. Arena Obyektlari (Platformalar va Lava)
    if (arenaObjects) {
      arenaObjects.render(ctx);
    }

    // 6. Mutator: Zulmat
    if (mutator === 'darkness') {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.94)';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
    }
  }
}
