// Arena Clash 2D v3.2 — Aqlli Bot AI Tizimi (BotAI.js)
export class BotAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // 'easy' | 'medium' | 'hard'
    this.decisionTimer = 0;
    this.reactionDelay = difficulty === 'hard' ? 0.08 : difficulty === 'medium' ? 0.16 : 0.30;

    this.currentInput = {
      moveX: 0,
      moveY: 0,
      jump: false,
      drop: false,
      lightAttack: false,
      heavyAttack: false,
      skill: false,
      dodge: false,
      block: false,
      taunt: false,
    };
  }

  update(dt, bot, opponent, arenaObjects, projectiles = []) {
    this.decisionTimer -= dt;
    if (this.decisionTimer > 0) return this.currentInput;

    this.decisionTimer = this.reactionDelay;

    // Reset inputs
    this.currentInput = {
      moveX: 0,
      moveY: 0,
      jump: false,
      drop: false,
      lightAttack: false,
      heavyAttack: false,
      skill: false,
      dodge: false,
      block: false,
      taunt: false,
    };

    if (bot.isDead || opponent.isDead) return this.currentInput;

    const distX = opponent.x - bot.x;
    const distY = opponent.y - bot.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // 1. Snaryadlardan himoyalanish (Sakrash yoki Parry)
    for (const proj of projectiles) {
      if (proj.isActive && proj.ownerId !== bot.id) {
        const pDist = Math.hypot(proj.x - bot.x, proj.y - bot.y);
        if (pDist < 160) {
          if (Math.random() < (this.difficulty === 'hard' ? 0.8 : 0.4)) {
            this.currentInput.jump = true;
          } else {
            this.currentInput.block = true;
          }
          return this.currentInput;
        }
      }
    }

    // 2. Maydondagi Power-up ga qarab harakatlanish
    if (arenaObjects && arenaObjects.activePowerup && Math.random() < 0.4) {
      const pUp = arenaObjects.activePowerup;
      this.currentInput.moveX = pUp.x > bot.x ? 1 : -1;
      if (pUp.y < bot.y - 40) {
        this.currentInput.jump = true;
      }
      return this.currentInput;
    }

    // 3. Masofani boshqarish (Spacing)
    if (absDistX > 100) {
      this.currentInput.moveX = distX > 0 ? 1 : -1;
    } else if (absDistX < 45 && opponent.isAttacking) {
      // Qochish / Dodge
      this.currentInput.dodge = Math.random() < 0.6;
      this.currentInput.moveX = distX > 0 ? -1 : 1;
    }

    // Balandlik farqi bo'lsa sakrash
    if (distY < -60 && absDistX < 140) {
      this.currentInput.jump = true;
    } else if (distY > 60 && absDistX < 80) {
      this.currentInput.drop = true;
    }

    // 4. Hujum qarorlari
    if (absDistX < 95 && absDistY < 60) {
      // Raqib zarba beryaptimi? Parry qilish imkoniyati
      if (opponent.isAttacking && Math.random() < (this.difficulty === 'hard' ? 0.75 : 0.35)) {
        this.currentInput.block = true;
        return this.currentInput;
      }

      // Skill tayyor bo'lsa
      if (bot.skillCooldown <= 0 && Math.random() < 0.6) {
        this.currentInput.skill = true;
      } else if (bot.heavyCooldown <= 0 && Math.random() < 0.45) {
        this.currentInput.heavyAttack = true;
      } else {
        this.currentInput.lightAttack = true;
      }
    } else if (absDistX > 200 && absDistX < 450 && bot.heroConfig.combat.heavyAttack.isProjectile) {
      // Masofadan snaryad otish (Ninja Kunai / Mage Shard)
      if (bot.heavyCooldown <= 0 && Math.random() < 0.5) {
        this.currentInput.heavyAttack = true;
      }
    }

    return this.currentInput;
  }
}
