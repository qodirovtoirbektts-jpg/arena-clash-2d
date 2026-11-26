class LocalGameEngine {
  constructor() {
    this.active = false;
    this.mode = '1v1'; // '1v1' yoki 'vs_bot'
    this.tick = 0;
    this.round = 1;
    this.roundTime = window.GameConstants.ROUND_TIME_SECONDS;
    this.state = window.GameConstants.MATCH_STATE.COUNTDOWN;
    this.countdown = 3;
    this.players = {};
    this.projectiles = [];
    this.events = [];
    this.winner = null;

    // Bot AI holati
    this.botDecisionTimer = 0;
    this.botCurrentInput = { moveX: 0, moveY: 0, jump: false, drop: false, attackLight: false, attackHeavy: false, skill: false, dodge: false };
  }

  start(mode = '1v1', p1Char = 'blaze_knight', p2Char = 'shadow_ninja') {
    this.active = true;
    this.mode = mode;
    this.round = 1;
    this.state = window.GameConstants.MATCH_STATE.COUNTDOWN;
    this.countdown = 3;
    this.roundTime = window.GameConstants.ROUND_TIME_SECONDS;
    this.projectiles = [];
    this.events = [];
    this.winner = null;

    const botGladiators = ['Vanguard-Prime', 'Kage-Zero', 'Ignis-Rex', 'Cryo-Specter', 'Dusk-Ronin'];
    const botName = botGladiators[Math.floor(Math.random() * botGladiators.length)];

    this.players = {
      p1: window.GameCombat.createPlayerState('p1', 'Player 1 (Siz)', p1Char, 0),
      p2: window.GameCombat.createPlayerState('p2', mode === 'vs_bot' ? botName : 'Player 2', p2Char, 1)
    };
  }

  stop() {
    this.active = false;
  }

  update(dt) {
    if (!this.active) return;
    this.tick++;

    // 1. COUNTDOWN
    if (this.state === window.GameConstants.MATCH_STATE.COUNTDOWN) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = window.GameConstants.MATCH_STATE.PLAYING;
        this.roundTime = window.GameConstants.ROUND_TIME_SECONDS;
      }
      return;
    }

    // 2. ROUND_END
    if (this.state === window.GameConstants.MATCH_STATE.ROUND_END) {
      this.roundEndTimer -= dt;
      if (this.roundEndTimer <= 0) {
        this.nextRound();
      }
      return;
    }

    if (this.state === window.GameConstants.MATCH_STATE.MATCH_OVER) {
      return;
    }

    // 3. PLAYING
    this.roundTime -= dt;
    if (this.roundTime <= 0) {
      this.handleTimeout();
      return;
    }

    const p1 = this.players.p1;
    const p2 = this.players.p2;

    // P1 Input (WASD + J/K/L/Space)
    const p1Input = window.inputManager.getPlayer1Input(this.tick);

    // P2 Input (Lokal 2-o'yinchi yoki AI Bot)
    let p2Input;
    if (this.mode === 'vs_bot') {
      p2Input = this.getBotInput(p2, p1, dt);
    } else {
      p2Input = window.inputManager.getPlayer2Input();
    }

    // P1 Harakat va Jang
    window.GameCombat.handleCombatInput(p1, p1Input, this.projectiles, this.events);
    window.GameCombat.updateTimers(p1, dt);
    window.GamePhysics.updatePlayerPhysics(p1, p1Input, dt, window.GameConstants.PLATFORMS);

    // P2 Harakat va Jang
    window.GameCombat.handleCombatInput(p2, p2Input, this.projectiles, this.events);
    window.GameCombat.updateTimers(p2, dt);
    window.GamePhysics.updatePlayerPhysics(p2, p2Input, dt, window.GameConstants.PLATFORMS);

    // Melee & Projectile to'qnashuvlari
    window.GameCombat.resolveAttacks(this.players, this.events, dt);
    window.GameCombat.updateProjectiles(this.projectiles, this.players, this.events, dt);

    // Hodisalarni ovoz va effektlarga yo'naltirish
    while (this.events.length > 0) {
      const ev = this.events.shift();
      this.handleLocalEvent(ev);
    }

    // O'lim va Raund tekshiruvi
    if (p1.isDead || p2.isDead) {
      this.state = window.GameConstants.MATCH_STATE.ROUND_END;
      this.roundEndTimer = 2.5;

      if (p1.isDead && !p2.isDead) p2.roundsWon++;
      else if (p2.isDead && !p1.isDead) p1.roundsWon++;
    }
  }

  getBotInput(bot, target, dt) {
    this.botDecisionTimer -= dt;
    if (this.botDecisionTimer <= 0) {
      this.botDecisionTimer = 0.08 + Math.random() * 0.08; // 80-160ms reaksion vaqt

      const distX = target.x - bot.x;
      const distY = target.y - bot.y;
      const absDistX = Math.abs(distX);

      const moveDir = distX > 15 ? 1 : (distX < -15 ? -1 : 0);
      const shouldJump = distY < -50 && bot.onGround;
      const shouldDrop = distY > 60;

      // Hujum qilish
      let attackLight = false;
      let attackHeavy = false;
      let skill = false;
      let dodge = false;

      if (absDistX < 85 && Math.abs(distY) < 60) {
        // Yaqin jang
        if (bot.cooldowns.skill <= 0 && Math.random() < 0.45) {
          skill = true;
        } else if (bot.cooldowns.heavy <= 0 && Math.random() < 0.6) {
          attackHeavy = true;
        } else if (bot.cooldowns.light <= 0) {
          attackLight = true;
        }
      } else if (absDistX > 150) {
        // Masofada snaryad yoki dash
        if (bot.characterId === 'frost_mage' || bot.characterId === 'shadow_ninja') {
          if (bot.cooldowns.heavy <= 0) attackHeavy = true;
          else if (bot.cooldowns.light <= 0) attackLight = true;
        } else if (bot.characterId === 'blaze_knight' && bot.cooldowns.skill <= 0 && absDistX < 300) {
          skill = true; // Inferno Dash
        }
      }

      // Raqib hujum qilganda dodge qilish
      if (target.isAttacking && absDistX < 100 && bot.cooldowns.dodge <= 0 && Math.random() < 0.7) {
        dodge = true;
      }

      this.botCurrentInput = {
        moveX: moveDir,
        moveY: distY > 0 ? 1 : -1,
        jump: shouldJump,
        drop: shouldDrop,
        attackLight,
        attackHeavy,
        skill,
        dodge
      };
    }
    return this.botCurrentInput;
  }

  handleLocalEvent(ev) {
    const { EVENT_TYPE } = window.GameProtocol;
    if (ev.type === EVENT_TYPE.HIT) {
      const isHeavy = ev.damage > 20;
      window.renderer.triggerScreenShake(isHeavy ? 10 : 4);
      if (isHeavy) window.renderer.triggerHitStop(0.045); // Micro-pause on heavy hit
      window.renderer.addHitFlash(ev.targetId);
      window.renderer.addDamageText(ev.x, ev.y, `-${ev.damage}`, isHeavy ? '#ffa502' : '#ff4757', isHeavy);
      window.renderer.spawnParticles(ev.x, ev.y, isHeavy ? 16 : 8, isHeavy ? '#ffa502' : '#ff4757', isHeavy ? 240 : 160);
      window.audioManager.playHit(isHeavy);
    } else if (ev.type === EVENT_TYPE.COMBO) {
      window.renderer.addComboNotification(ev.x, ev.y, ev.comboCount);
      window.audioManager.playCombo(ev.comboCount);
    } else if (ev.type === EVENT_TYPE.FREEZE) {
      window.audioManager.playFreeze();
      window.renderer.spawnParticles(ev.x, ev.y, 25, '#74b9ff', 200);
      window.renderer.addGroundDecal(ev.x, ev.y, 'frost');
    } else if (ev.type === EVENT_TYPE.DODGE) {
      window.audioManager.playDodge();
      window.renderer.spawnParticles(ev.x, ev.y, 6, '#38bdf8', 100);
    } else if (ev.type === EVENT_TYPE.SKILL_CAST) {
      window.audioManager.playSkill(ev.characterId);
      if (ev.characterId === 'blaze_knight') {
        window.renderer.addGroundDecal(ev.x, ev.y, 'fire');
        window.renderer.spawnParticles(ev.x, ev.y, 20, '#ff4757', 260);
      } else if (ev.characterId === 'frost_mage') {
        window.renderer.addGroundDecal(ev.x, ev.y, 'frost');
        window.renderer.spawnParticles(ev.x, ev.y, 25, '#00d2d3', 220);
      }
    } else if (ev.type === EVENT_TYPE.KILL) {
      window.audioManager.playDeath();
      window.renderer.triggerScreenShake(16);
      window.renderer.triggerHitStop(0.08); // Dramatik to'xtash
      window.renderer.spawnParticles(ev.x, ev.y, 35, '#ff4757', 280);
      window.renderer.addDamageText(ev.x, ev.y - 30, 'KNOCKOUT!', '#e74c3c', true);
    }
  }

  nextRound() {
    const p1 = this.players.p1;
    const p2 = this.players.p2;

    if (p1.roundsWon >= window.GameConstants.ROUNDS_TO_WIN) {
      this.state = window.GameConstants.MATCH_STATE.MATCH_OVER;
      this.winner = p1;
      window.audioManager.playVictory();
      return;
    }

    if (p2.roundsWon >= window.GameConstants.ROUNDS_TO_WIN) {
      this.state = window.GameConstants.MATCH_STATE.MATCH_OVER;
      this.winner = p2;
      window.audioManager.playDeath();
      return;
    }

    this.round++;
    window.GameCombat.respawnPlayer(p1, 0);
    window.GameCombat.respawnPlayer(p2, 1);
    this.projectiles = [];
    this.state = window.GameConstants.MATCH_STATE.COUNTDOWN;
    this.countdown = 3;
    this.roundTime = window.GameConstants.ROUND_TIME_SECONDS;
  }

  handleTimeout() {
    const p1 = this.players.p1;
    const p2 = this.players.p2;
    if (p1.hp > p2.hp) p1.roundsWon++;
    else if (p2.hp > p1.hp) p2.roundsWon++;
    this.state = window.GameConstants.MATCH_STATE.ROUND_END;
    this.roundEndTimer = 2.5;
  }

  getRenderState() {
    return {
      players: Object.values(this.players),
      projectiles: this.projectiles,
      matchState: this.state,
      round: this.round,
      countdown: Math.ceil(this.countdown),
      roundTime: Math.ceil(this.roundTime),
      winner: this.winner
    };
  }
}

window.localGame = new LocalGameEngine();
