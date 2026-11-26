// Arena Clash 2D v3.2 — 2.5D Parallax Arena Rendereri (ArenaRenderer.js)
export class ArenaRenderer {
  constructor() {
    this.currentArena = 'fire_castle'; // 'fire_castle' | 'frost_temple'
    this.animTime = 0;
  }

  setArena(arenaId) {
    this.currentArena = arenaId;
  }

  render(ctx, camera, arenaObjects, mutator = 'none') {
    this.animTime += 0.016;
    const isFire = this.currentArena === 'fire_castle';

    // 1. Uzoq Parallax Qatlam (Osmon / Qorong'u tog'lar)
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    if (isFire) {
      skyGrad.addColorStop(0, '#100b0d');
      skyGrad.addColorStop(0.5, '#261110');
      skyGrad.addColorStop(1, '#3b1812');
    } else {
      skyGrad.addColorStop(0, '#060d1a');
      skyGrad.addColorStop(0.5, '#0d1e38');
      skyGrad.addColorStop(1, '#1a3359');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Qadimiy tosh ustunlar va qasr siluetlari
    ctx.fillStyle = isFire ? 'rgba(35, 20, 22, 0.65)' : 'rgba(15, 30, 55, 0.65)';
    for (let i = 0; i < 7; i++) {
      const colX = i * 220 - (camera.x * 0.15) % 220;
      ctx.fillRect(colX, 160, 48, 400);
      // Ustun tepaligi
      ctx.fillRect(colX - 8, 150, 64, 18);
    }
    ctx.restore();

    // 2. O'rta Qatlam (Mash'alalar, kristallar va tuman)
    ctx.save();
    if (isFire) {
      // Mash'ala yorug'liklari
      for (let i = 0; i < 5; i++) {
        const torchX = 140 + i * 250 - (camera.x * 0.35) % 250;
        const torchY = 320;
        const flicker = Math.sin(this.animTime * 8 + i) * 6;

        const radGrad = ctx.createRadialGradient(torchX, torchY, 4, torchX, torchY, 70 + flicker);
        radGrad.addColorStop(0, 'rgba(255, 120, 20, 0.45)');
        radGrad.addColorStop(0.5, 'rgba(255, 70, 0, 0.15)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(torchX, torchY, 70 + flicker, 0, Math.PI * 2);
        ctx.fill();

        // Mash'ala dastasi
        ctx.fillStyle = '#1A181C';
        ctx.fillRect(torchX - 3, torchY, 6, 28);
      }
    } else {
      // Muz kristallari nurlari
      for (let i = 0; i < 5; i++) {
        const cX = 120 + i * 260 - (camera.x * 0.35) % 260;
        const cY = 310;
        const glow = Math.sin(this.animTime * 5 + i) * 4;

        const radGrad = ctx.createRadialGradient(cX, cY, 4, cX, cY, 65 + glow);
        radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        radGrad.addColorStop(0.6, 'rgba(34, 211, 238, 0.12)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cX, cY, 65 + glow, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 3. Yaqin Qatlam (Asosiy Pol va Tosh Zinalar)
    ctx.save();
    const groundY = 520;

    // Asosiy pol foni
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, 720);
    groundGrad.addColorStop(0, isFire ? '#262024' : '#142236');
    groundGrad.addColorStop(0.3, isFire ? '#1a1618' : '#0c1624');
    groundGrad.addColorStop(1, '#0d0e12');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, 1280, 200);

    // Pol chetidagi metall / neon neon jiyak
    ctx.fillStyle = isFire ? '#FF5A1F' : '#38BDF8';
    ctx.shadowColor = isFire ? '#FF6A00' : '#22D3EE';
    ctx.shadowBlur = 12;
    ctx.fillRect(0, groundY, 1280, 4);

    // Pol plitalari chiziqlari
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1280; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 4);
      ctx.lineTo(x + 20, 720);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Platformalar va lava obyektlarini render qilish
    if (arenaObjects) {
      arenaObjects.render(ctx);
    }

    // 5. Mutator: Zulmat (Radial ko'rish nuri)
    if (mutator === 'darkness') {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 6, 8, 0.92)';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
    }
  }
}
