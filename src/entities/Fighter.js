// Arena Clash 2D v3.2 — Jangchi Holat Mashinasi (Fighter.js)
import { HEROES_CONFIG, GAMEPLAY_CONFIG } from './heroes.config.js';

export class Fighter {
  constructor(id, name, heroId = 'blaze_knight', startX = 300, facing = 1) {
    this.id = id;
    this.name = name;
    this.heroId = heroId;
    this.heroConfig = HEROES_CONFIG[heroId] || HEROES_CONFIG.blaze_knight;

    this.x = startX;
    this.y = GAMEPLAY_CONFIG.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing; // 1 = o'ngga, -1 = chapga

    // HP va Stamina
    this.maxHp = this.heroConfig.maxHp;
    this.hp = this.maxHp;
    this.ghostHp = this.hp; // Sekin pasayuvchi HP qatlami (0.4s)
    this.ghostHpTimer = 0;

    this.maxStamina = GAMEPLAY_CONFIG.stamina.max;
    this.stamina = this.maxStamina;
    this.staminaRegenDelay = 0;

    // FSM Holatlari
    this.state = 'idle'; // 'idle' | 'run' | 'jump' | 'attack_light' | 'attack_heavy' | 'skill' | 'dodge' | 'block' | 'parry' | 'hitstun' | 'ko' | 'taunt'
    this.stateTimer = 0;
    this.isGrounded = true;
    this.jumpCount = 0;

    // Cooldownlar va taymerlar
    this.heavyCooldown = 0;
    this.skillCooldown = 0;
    this.dodgeCooldown = 0;
    this.iFrameTimer = 0;
    this.hitstunTimer = 0;
    this.hitFlashTimer = 0;
    this.parryTimer = 0;
    this.parrySuccessTimer = 0;
    this.damageBuffTimer = 0;
    this.slowTimer = 0;
    this.tauntTimer = 0;

    // Kombo kuzatuvi
    this.comboStep = 0;      // 1, 2, 3
    this.comboWindowTimer = 0;
    this.currentComboCount = 0;
    this.maxComboInMatch = 0;
    this.parryCount = 0;
    this.totalDamageDealt = 0;
    this.hitsLanded = 0;
    this.totalAttacksFired = 0;

    // Awakening / Rage (HP < 20%)
    this.isAwakened = false;

    // O'lchamlar
    this.width = this.heroConfig.rig.hurtbox.width;
    this.height = this.heroConfig.rig.hurtbox.height;

    // Plash / sharf Verlet fizikasi uchun nuqtalar
    this.capePoints = [];
    for (let i = 0; i < 5; i++) {
      this.capePoints.push({ x: this.x, y: this.y - 40 + i * 10, oldX: this.x, oldY: this.y - 40 + i * 10 });
    }
  }

  get isDead() {
    return this.hp <= 0;
  }

  get isInvulnerable() {
    return this.iFrameTimer > 0;
  }

  get isAttacking() {
    return ['attack_light', 'attack_heavy', 'skill'].includes(this.state);
  }

  getHurtbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height,
    };
  }

  // Hujum zarbasi berilayotgan hitbox
  getHitbox() {
    if (!this.isAttacking) return null;
    let cfg = this.heroConfig.combat.lightAttack.hitbox;
    if (this.state === 'attack_heavy') cfg = this.heroConfig.combat.heavyAttack.hitbox;
    if (this.state === 'skill') cfg = this.heroConfig.combat.skill.hitbox;
    if (!cfg) return null;

    return {
      x: this.facing === 1 ? this.x + cfg.offsetX : this.x - cfg.offsetX - cfg.width,
      y: this.y + cfg.offsetY,
      width: cfg.width,
      height: cfg.height,
    };
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0, attacker = null) {
    if (this.isDead || this.isInvulnerable) return false;

    // 1. Parry tekshiruvi (0.2s daxlsizlik)
    if (this.state === 'block' && this.parryTimer > 0) {
      this.parrySuccessTimer = 0.35;
      this.parryCount++;
      if (attacker) {
        attacker.hitstunTimer = 0.60;
        attacker.state = 'hitstun';
        attacker.vx = -attacker.facing * 120;
      }
      return 'parry';
    }

    // 2. Blok holati
    if (this.state === 'block' && this.stamina > 15) {
      this.stamina -= 16;
      amount *= 0.25; // 75% zarar kamayadi
      knockbackX *= 0.3;
    }

    // 3. Risky Taunt holatida 2x zarar
    if (this.state === 'taunt') {
      amount *= 2.0;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = 0.08; // 80ms oq chaqnash
    this.hitstunTimer = 0.22;
    this.state = this.hp <= 0 ? 'ko' : 'hitstun';

    this.vx = knockbackX * (attacker ? attacker.facing : 1);
    this.vy = knockbackY;

    // Awakening tekshiruvi (HP < 20%)
    if (this.hp <= this.maxHp * 0.20 && !this.isAwakened) {
      this.isAwakened = true;
    }

    return true;
  }

  update(dt, input, arenaObjects, projectiles, audio, particles) {
    // 1. Taymerlar yangilanishi
    if (this.heavyCooldown > 0) this.heavyCooldown -= dt;
    if (this.skillCooldown > 0) this.skillCooldown -= dt;
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.iFrameTimer > 0) this.iFrameTimer -= dt;
    if (this.parryTimer > 0) this.parryTimer -= dt;
    if (this.parrySuccessTimer > 0) this.parrySuccessTimer -= dt;
    if (this.damageBuffTimer > 0) this.damageBuffTimer -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= dt;
      if (this.comboWindowTimer <= 0) {
        this.comboStep = 0;
        this.currentComboCount = 0;
      }
    }

    // Ghost HP pasayishi (0.4s kechikish bilan)
    if (this.ghostHp > this.hp) {
      this.ghostHpTimer += dt;
      if (this.ghostHpTimer > 0.35) {
        this.ghostHp += (this.hp - this.ghostHp) * Math.min(1, dt * 5);
      }
    } else {
      this.ghostHp = this.hp;
      this.ghostHpTimer = 0;
    }

    // Stamina tiklanishi
    this.staminaRegenDelay -= dt;
    if (this.staminaRegenDelay <= 0 && this.state !== 'block') {
      this.stamina = Math.min(this.maxStamina, this.stamina + GAMEPLAY_CONFIG.stamina.regenRate * dt);
    }

    if (this.isDead) {
      this.state = 'ko';
      this.vy += GAMEPLAY_CONFIG.gravity * dt;
      this.y += this.vy * dt;
      if (this.y >= GAMEPLAY_CONFIG.groundY) {
        this.y = GAMEPLAY_CONFIG.groundY;
        this.vy = 0;
      }
      return;
    }

    // 2. Hitstun holatida harakat qilmaslik
    if (this.hitstunTimer > 0) {
      this.hitstunTimer -= dt;
      this.applyPhysics(dt, arenaObjects);
      return;
    }

    // 3. Kiritishlar va Harakat FSM
    this.handleInput(dt, input, arenaObjects, projectiles, audio, particles);
    this.applyPhysics(dt, arenaObjects);
    this.updateCapePhysics(dt);
  }

  handleInput(dt, input, arenaObjects, projectiles, audio, particles) {
    if (!input) return;

    // Blok / Parry
    if (input.block && this.stamina > 10) {
      if (this.state !== 'block') {
        this.state = 'block';
        this.parryTimer = 0.20; // 200ms ichida zarba kelsa Perfect Parry
      }
      this.stamina -= GAMEPLAY_CONFIG.stamina.blockDrainRate * dt;
      this.staminaRegenDelay = 0.6;
      this.vx = 0;
      return;
    } else if (this.state === 'block') {
      this.state = 'idle';
    }

    // Dodge (Shift)
    if (input.dodge && this.dodgeCooldown <= 0 && this.stamina >= this.heroConfig.combat.dodge.staminaCost) {
      const cfg = this.heroConfig.combat.dodge;
      this.state = 'dodge';
      this.stateTimer = cfg.duration;
      this.dodgeCooldown = cfg.cooldown;
      this.stamina -= cfg.staminaCost;
      this.staminaRegenDelay = 0.8;
      this.iFrameTimer = cfg.iFrameDuration;
      this.vx = this.facing * this.heroConfig.speed * cfg.speedMultiplier;
      if (audio) audio.playDodge();
      if (particles) particles.emit('smoke', this.x, this.y - 30, 8, { color: '#6B7280', speed: 80 });
      return;
    }

    // Masxara (Taunt - T)
    if (input.taunt && this.isGrounded && this.state !== 'taunt') {
      this.state = 'taunt';
      this.stateTimer = 1.5;
      this.vx = 0;
      return;
    }
    if (this.state === 'taunt') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.skillCooldown = 0; // Omon qolsa skill cooldown darhol nollanadi!
        if (particles) particles.addDamageText(this.x, this.y - 50, 'SKILL TAYYOR!', '#34D399', true);
      }
      return;
    }

    // Skill (L)
    if (input.skill && this.skillCooldown <= 0) {
      this.executeSkill(audio, projectiles, particles);
      return;
    }

    // Og'ir Zarba (K)
    if (input.heavyAttack && this.heavyCooldown <= 0 && this.stamina >= 18) {
      this.executeHeavyAttack(audio, projectiles, particles);
      return;
    }

    // Yengil Zarba (J)
    if (input.lightAttack && !this.isAttacking) {
      this.executeLightAttack(audio, projectiles, particles);
      return;
    }

    // Hujum davomiyligini tekshirish
    if (this.isAttacking) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
      }
      return;
    }

    // Sakrash (W) va Double Jump (Ninja)
    if (input.jump && (this.isGrounded || this.jumpCount < this.heroConfig.maxJumps)) {
      this.vy = -this.heroConfig.jumpForce;
      this.isGrounded = false;
      this.jumpCount++;
      this.state = 'jump';
      if (audio) audio.playJump();
      if (particles) particles.emit('spark', this.x, this.y, 6, { color: '#E5E7EB', speed: 60 });
    }

    // Gorizontal harakat (A / D)
    let moveSpeed = this.heroConfig.speed;
    if (this.slowTimer > 0) moveSpeed *= (1 - 0.35); // 35% sekinlash

    if (input.moveX !== 0) {
      this.vx = input.moveX * moveSpeed;
      this.facing = input.moveX > 0 ? 1 : -1;
      if (this.isGrounded && this.state !== 'jump') {
        this.state = 'run';
      }
    } else {
      this.vx = 0;
      if (this.isGrounded && this.state !== 'jump') {
        this.state = 'idle';
      }
    }
  }

  executeLightAttack(audio, projectiles, particles) {
    this.totalAttacksFired++;
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboWindowTimer = 0.55;
    this.state = 'attack_light';
    this.stateTimer = this.heroConfig.combat.lightAttack.duration;
    if (audio) audio.playSlash(false);

    // Frost Mage masofadan o'q otadi
    if (this.heroConfig.id === 'frost_mage') {
      projectiles.push(new (projectiles.ProjectileClass || Object)({
        ownerId: this.id,
        type: 'frost_bolt',
        element: 'frost',
        x: this.x + this.facing * 20,
        y: this.y - 35,
        vx: this.facing * 520,
        damage: 9,
      }));
    }
  }

  executeHeavyAttack(audio, projectiles, particles) {
    this.totalAttacksFired++;
    const cfg = this.heroConfig.combat.heavyAttack;
    this.state = 'attack_heavy';
    this.stateTimer = cfg.duration;
    this.heavyCooldown = cfg.cooldown;
    this.stamina -= cfg.staminaCost || 18;
    this.staminaRegenDelay = 0.8;
    if (audio) audio.playSlash(true);

    if (cfg.isProjectile) {
      projectiles.push(new (projectiles.ProjectileClass || Object)({
        ownerId: this.id,
        type: this.heroConfig.id === 'shadow_ninja' ? 'kunai' : 'frost_shard',
        element: this.heroConfig.element,
        x: this.x + this.facing * 24,
        y: this.y - 35,
        vx: this.facing * (cfg.projectileSpeed || 600),
        damage: cfg.damage,
      }));
    }
  }

  executeSkill(audio, projectiles, particles) {
    this.totalAttacksFired++;
    const cfg = this.heroConfig.combat.skill;
    this.state = 'skill';
    this.stateTimer = cfg.duration;
    this.skillCooldown = cfg.cooldown;

    if (this.heroId === 'blaze_knight') {
      // Inferno Dash
      this.iFrameTimer = cfg.iFrameDuration || 0.25;
      this.vx = this.facing * cfg.dashSpeed;
      if (audio) audio.playFireball();
      if (particles) particles.emit('spark', this.x, this.y - 30, 24, { color: '#FF5A1F', speed: 280 });
    } else if (this.heroId === 'shadow_ninja') {
      // Shadow Teleport (Raqib ortiga o'tish)
      this.iFrameTimer = 0.20;
      this.x += this.facing * 280;
      if (audio) audio.playSlash(true);
      if (particles) particles.emit('smoke', this.x, this.y - 30, 20, { color: '#A855F7', speed: 180 });
    } else if (this.heroId === 'frost_mage') {
      // Frost Nova
      if (audio) audio.playIceShard();
      if (particles) particles.emit('spark', this.x, this.y - 35, 32, { color: '#22D3EE', speed: 300 });
    }
  }

  applyPhysics(dt, arenaObjects) {
    // Gravitatsiya
    this.vy += GAMEPLAY_CONFIG.gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Asosiy yer bilan to'qnashuv
    if (this.y >= GAMEPLAY_CONFIG.groundY) {
      this.y = GAMEPLAY_CONFIG.groundY;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
    }

    // Platformalar bilan to'qnashuv
    if (arenaObjects && this.vy > 0) {
      for (const plat of arenaObjects.platforms) {
        if (plat.isBroken) continue;
        if (this.x >= plat.x && this.x <= plat.x + plat.width) {
          if (this.y >= plat.y && this.y - this.vy * dt <= plat.y + 12) {
            this.y = plat.y;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
          }
        }
      }
    }

    // Devordan sakrash (Wall Bounce)
    if (this.x < 40) {
      this.x = 40;
      if (this.state === 'hitstun' && Math.abs(this.vx) > 150) {
        this.vx = Math.abs(this.vx) * 0.7; // Ortga qaytish
      }
    } else if (this.x > 1240) {
      this.x = 1240;
      if (this.state === 'hitstun' && Math.abs(this.vx) > 150) {
        this.vx = -Math.abs(this.vx) * 0.7;
      }
    }
  }

  // 5 nuqtali Verlet plash tebranishi
  updateCapePhysics(dt) {
    const rootX = this.x - this.facing * 6;
    const rootY = this.y - 42;
    this.capePoints[0].x = rootX;
    this.capePoints[0].y = rootY;

    for (let i = 1; i < this.capePoints.length; i++) {
      const p = this.capePoints[i];
      const vx = (p.x - p.oldX) * 0.92 - this.facing * Math.abs(this.vx) * 0.04;
      const vy = (p.y - p.oldY) * 0.92 + 180 * dt;

      p.oldX = p.x;
      p.oldY = p.y;
      p.x += vx;
      p.y += vy;

      // Masofani ushlab turish
      const prev = this.capePoints[i - 1];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const dist = Math.hypot(dx, dy);
      const targetDist = 9;
      if (dist > 0) {
        p.x = prev.x + (dx / dist) * targetDist;
        p.y = prev.y + (dy / dist) * targetDist;
      }
    }
  }
}
