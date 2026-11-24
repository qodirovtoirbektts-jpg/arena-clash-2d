(function(exports) {
  const { ARENA_WIDTH, ARENA_HEIGHT, PLATFORMS } = 
    (typeof require !== 'undefined') ? require('./constants') : window.GameConstants;
  const { CHARACTERS } = 
    (typeof require !== 'undefined') ? require('./characters') : window.GameCharacters;
  const { checkAABB, circleAABB, getPlayerBounds } = 
    (typeof require !== 'undefined') ? require('./physics') : window.GamePhysics;
  const { EVENT_TYPE } = 
    (typeof require !== 'undefined') ? require('./protocol') : window.GameProtocol;

  // Yangi o'yinchi holatini yaratish
  exports.createPlayerState = function(id, username, characterId = 'blaze_knight', spawnIndex = 0) {
    const charDef = CHARACTERS[characterId] || CHARACTERS.blaze_knight;
    const { SPAWN_POINTS } = (typeof require !== 'undefined') ? require('./constants') : window.GameConstants;
    const spawn = SPAWN_POINTS[spawnIndex % SPAWN_POINTS.length] || { x: 200, y: 470, facing: 1 };

    return {
      id,
      username,
      characterId,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      facing: spawn.facing, // 1: o'ng, -1: chap
      width: charDef.width,
      height: charDef.height,
      baseSpeed: charDef.speed,
      baseJumpForce: charDef.jumpForce,
      canDoubleJump: charDef.doubleJump,
      hasDoubleJumped: false,
      onGround: false,
      hp: charDef.maxHp,
      maxHp: charDef.maxHp,
      score: 0,
      roundsWon: 0,
      isDead: false,
      respawnTimer: 0,
      invulnerable: false,

      // Cooldown taymerlari (soniyalarda)
      cooldowns: {
        light: 0,
        heavy: 0,
        skill: 0,
        dodge: 0
      },

      // Joriy hujum holati
      currentAttack: null, // { type: 'light'|'heavy'|'skill', timer: 0, windupTimer: 0, hasHit: {} }
      isAttacking: false,

      // Dodge holati
      isDodging: false,
      dodgeTimer: 0,
      dodgeVx: 0,
      dodgeVy: 0,

      // Skill holati (masalan Inferno Dash)
      isDashing: false,
      dashTimer: 0,
      dashVx: 0,

      // Status effektlari
      stunTimer: 0,
      slowTimer: 0,

      // Statistika
      stats: {
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0,
        hitsLanded: 0,
        totalAttacks: 0
      }
    };
  };

  // Cooldown va taymerlarni yangilash
  exports.updateTimers = function(player, dt) {
    // Cooldownlarni kamaytirish
    for (const k in player.cooldowns) {
      if (player.cooldowns[k] > 0) {
        player.cooldowns[k] = Math.max(0, player.cooldowns[k] - dt);
      }
    }

    // Respawn taymeri
    if (player.isDead) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        exports.respawnPlayer(player);
      }
    }
  };

  // O'yinchini qayta tiriltirish (Respawn)
  exports.respawnPlayer = function(player, spawnIndex = 0) {
    const { SPAWN_POINTS } = (typeof require !== 'undefined') ? require('./constants') : window.GameConstants;
    const spawn = SPAWN_POINTS[spawnIndex % SPAWN_POINTS.length] || { x: 200, y: 470, facing: 1 };
    const charDef = CHARACTERS[player.characterId] || CHARACTERS.blaze_knight;

    player.isDead = false;
    player.hp = charDef.maxHp;
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.facing = spawn.facing;
    player.currentAttack = null;
    player.isAttacking = false;
    player.isDodging = false;
    player.isDashing = false;
    player.stunTimer = 0;
    player.slowTimer = 0;
    // 1.5 soniya vaqtinchalik himoya (Spawn protection)
    player.invulnerable = true;
    setTimeout(() => {
      if (player) player.invulnerable = false;
    }, 1500);
  };

  // Hujum yoki Dodge buyrug'ini qabul qilish
  exports.handleCombatInput = function(player, input, projectiles, events) {
    if (player.isDead || player.stunTimer > 0) return;
    const charDef = CHARACTERS[player.characterId];
    if (!charDef) return;

    // 1. DODGE (Space)
    if (input.dodge && player.cooldowns.dodge <= 0 && !player.isDodging) {
      const dodgeDef = charDef.attacks.dodge;
      player.isDodging = true;
      player.dodgeTimer = dodgeDef.duration;
      player.cooldowns.dodge = dodgeDef.cooldown;
      player.invulnerable = true;
      player.currentAttack = null;
      player.isAttacking = false;

      // Yo'nalish
      let dirX = input.moveX || player.facing;
      if (dirX === 0) dirX = player.facing;
      player.dodgeVx = dirX * dodgeDef.speed;
      player.dodgeVy = 0;

      events.push({
        type: EVENT_TYPE.DODGE,
        playerId: player.id,
        x: player.x,
        y: player.y - player.height / 2
      });
      return;
    }

    if (player.isDodging || player.isDashing) return;

    // 2. SKILL (L)
    if (input.skill && player.cooldowns.skill <= 0 && !player.isAttacking) {
      const skillDef = charDef.attacks.skill;
      player.cooldowns.skill = skillDef.cooldown;
      player.stats.totalAttacks++;

      if (skillDef.type === 'dash_attack') {
        // Blaze Knight: Inferno Dash
        player.isDashing = true;
        player.dashTimer = skillDef.duration;
        player.dashVx = player.facing * skillDef.dashSpeed;
        player.invulnerable = true;

        player.currentAttack = {
          type: 'skill',
          def: skillDef,
          timer: skillDef.duration,
          windupTimer: 0,
          hitTargets: {}
        };
        player.isAttacking = true;

        events.push({
          type: EVENT_TYPE.SKILL_CAST,
          playerId: player.id,
          skillName: skillDef.name,
          characterId: player.characterId,
          x: player.x,
          y: player.y
        });
      } else if (skillDef.type === 'teleport_attack') {
        // Shadow Ninja: Shadow Strike
        const targetX = player.x + player.facing * skillDef.teleportDist;
        player.x = Math.max(80, Math.min(targetX, ARENA_WIDTH - 80));

        player.currentAttack = {
          type: 'skill',
          def: skillDef,
          timer: skillDef.duration,
          windupTimer: 0,
          hitTargets: {}
        };
        player.isAttacking = true;

        events.push({
          type: EVENT_TYPE.SKILL_CAST,
          playerId: player.id,
          skillName: skillDef.name,
          characterId: player.characterId,
          x: player.x,
          y: player.y
        });
      } else if (skillDef.type === 'aoe_blast') {
        // Frost Mage: Blizzard Nova
        player.currentAttack = {
          type: 'skill',
          def: skillDef,
          timer: skillDef.duration,
          windupTimer: 0,
          hitTargets: {}
        };
        player.isAttacking = true;

        events.push({
          type: EVENT_TYPE.SKILL_CAST,
          playerId: player.id,
          skillName: skillDef.name,
          characterId: player.characterId,
          x: player.x,
          y: player.y
        });
      }
      return;
    }

    // 3. HEAVY ATTACK (K)
    if (input.attackHeavy && player.cooldowns.heavy <= 0 && !player.isAttacking) {
      const heavyDef = charDef.attacks.heavy;
      player.cooldowns.heavy = heavyDef.cooldown;
      player.stats.totalAttacks++;

      if (heavyDef.type === 'projectile') {
        // Ninja Kunai
        projectiles.push({
          id: 'proj_' + Math.random().toString(36).substring(2, 9),
          ownerId: player.id,
          characterId: player.characterId,
          x: player.x + player.facing * 20,
          y: player.y - player.height * 0.6,
          vx: player.facing * heavyDef.projSpeed,
          vy: -30,
          radius: heavyDef.projRadius,
          damage: heavyDef.damage,
          knockbackX: heavyDef.knockbackX,
          knockbackY: heavyDef.knockbackY,
          lifespan: heavyDef.projLifespan,
          color: '#00d2d3',
          type: 'kunai'
        });
      } else if (heavyDef.type === 'multi_projectile') {
        // Frost Mage Shard Wave
        heavyDef.spreadAngles.forEach(angle => {
          const speed = heavyDef.projSpeed;
          const vx = Math.cos(angle) * speed * player.facing;
          const vy = Math.sin(angle) * speed;
          projectiles.push({
            id: 'proj_' + Math.random().toString(36).substring(2, 9),
            ownerId: player.id,
            characterId: player.characterId,
            x: player.x + player.facing * 25,
            y: player.y - player.height * 0.6,
            vx,
            vy,
            radius: heavyDef.projRadius,
            damage: heavyDef.damage,
            knockbackX: heavyDef.knockbackX,
            knockbackY: heavyDef.knockbackY,
            lifespan: heavyDef.projLifespan,
            color: '#74b9ff',
            type: 'ice_shard'
          });
        });
      } else {
        // Blaze Knight Flame Cleave (Melee)
        player.currentAttack = {
          type: 'heavy',
          def: heavyDef,
          timer: heavyDef.duration,
          windupTimer: heavyDef.windup,
          hitTargets: {}
        };
        player.isAttacking = true;
      }
      return;
    }

    // 4. LIGHT ATTACK (J)
    if (input.attackLight && player.cooldowns.light <= 0 && !player.isAttacking) {
      const lightDef = charDef.attacks.light;
      player.cooldowns.light = lightDef.cooldown;
      player.stats.totalAttacks++;

      if (lightDef.type === 'projectile') {
        // Frost Bolt
        projectiles.push({
          id: 'proj_' + Math.random().toString(36).substring(2, 9),
          ownerId: player.id,
          characterId: player.characterId,
          x: player.x + player.facing * 25,
          y: player.y - player.height * 0.6,
          vx: player.facing * lightDef.projSpeed,
          vy: 0,
          radius: lightDef.projRadius,
          damage: lightDef.damage,
          knockbackX: lightDef.knockbackX,
          knockbackY: lightDef.knockbackY,
          lifespan: lightDef.projLifespan,
          color: '#0984e3',
          type: 'frost_bolt'
        });
      } else {
        // Melee (Blaze Knight Slash / Ninja Daggers)
        player.currentAttack = {
          type: 'light',
          def: lightDef,
          timer: lightDef.duration,
          windupTimer: lightDef.windup,
          hitTargets: {}
        };
        player.isAttacking = true;
      }
    }
  };

  // Melee va AoE hujumlarni hisoblash
  exports.resolveAttacks = function(players, events, dt) {
    const playerList = Object.values(players);

    for (let i = 0; i < playerList.length; i++) {
      const attacker = playerList[i];
      if (!attacker.isAttacking || !attacker.currentAttack) continue;

      const attack = attacker.currentAttack;
      attack.timer -= dt;

      if (attack.windupTimer > 0) {
        attack.windupTimer -= dt;
        continue; // Windup vaqtida hali hitbox faol emas
      }

      // Hitbox hisoblash
      const def = attack.def;

      for (let j = 0; j < playerList.length; j++) {
        const target = playerList[j];
        if (target.id === attacker.id || target.isDead || target.invulnerable) continue;
        if (attack.hitTargets[target.id]) continue; // Bir hujum bitta targetga faqat 1 marta tekkiziladi

        let hit = false;
        const targetBounds = getPlayerBounds(target);

        if (def.type === 'melee' || def.type === 'dash_attack') {
          // Attacker oldidagi to'rtburchak hitbox
          const attackBox = {
            x: attacker.facing > 0 ? attacker.x : attacker.x - def.hitboxW,
            y: attacker.y - attacker.height * 0.85,
            width: def.hitboxW,
            height: def.hitboxH
          };
          hit = checkAABB(attackBox, targetBounds);
        } else if (def.type === 'aoe_blast' || def.type === 'teleport_attack') {
          // Doira shaklidagi AoE
          hit = circleAABB(attacker.x, attacker.y - attacker.height / 2, def.hitboxRadius, targetBounds);
        }

        if (hit) {
          attack.hitTargets[target.id] = true;
          exports.applyDamage(attacker, target, def.damage, def.knockbackX, def.knockbackY, def, events);
        }
      }

      // Hujum muddati tugagan bo'lsa
      if (attack.timer <= 0) {
        attacker.isAttacking = false;
        attacker.currentAttack = null;
      }
    }
  };

  // Snaryadlar (Projectiles) harakati va to'qnashuvini hisoblash
  exports.updateProjectiles = function(projectiles, players, events, dt) {
    const playerList = Object.values(players);

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.lifespan -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Platforma yoki devorga urilish
      let collidedWithObstacle = false;
      for (let p = 0; p < PLATFORMS.length; p++) {
        const plat = PLATFORMS[p];
        if (!plat.oneWay && circleAABB(proj.x, proj.y, proj.radius, plat)) {
          collidedWithObstacle = true;
          break;
        }
      }

      // Xaritadan chiqish yoki to'siqqa urilish
      if (collidedWithObstacle || proj.lifespan <= 0 || proj.x < 50 || proj.x > ARENA_WIDTH - 50) {
        projectiles.splice(i, 1);
        continue;
      }

      // O'yinchilarga urilish
      let hitTarget = false;
      for (let j = 0; j < playerList.length; j++) {
        const target = playerList[j];
        if (target.id === proj.ownerId || target.isDead || target.invulnerable) continue;

        const targetBounds = getPlayerBounds(target);
        if (circleAABB(proj.x, proj.y, proj.radius, targetBounds)) {
          const attacker = players[proj.ownerId];
          const kbDir = proj.vx > 0 ? 1 : -1;
          exports.applyDamage(
            attacker || { id: proj.ownerId, username: 'Unknown' },
            target,
            proj.damage,
            proj.knockbackX * kbDir,
            proj.knockbackY,
            proj,
            events
          );
          hitTarget = true;
          break;
        }
      }

      if (hitTarget) {
        projectiles.splice(i, 1);
      }
    }
  };

  // Shikastlanish (Damage) va knockback qo'llash
  exports.applyDamage = function(attacker, target, damage, kbX, kbY, attackDef, events) {
    target.hp = Math.max(0, target.hp - damage);

    // Knockback
    const dir = (attacker.x < target.x) ? 1 : -1;
    target.vx = (kbX || 250) * dir;
    target.vy = kbY || -150;
    target.onGround = false;

    // Status effektlari (Slow, Stun)
    if (attackDef && attackDef.slowDuration) {
      target.slowTimer = attackDef.slowDuration;
    }

    // Statistika
    if (attacker.stats) {
      attacker.stats.damageDealt += damage;
      attacker.stats.hitsLanded++;
    }
    if (target.stats) {
      target.stats.damageTaken += damage;
    }

    events.push({
      type: EVENT_TYPE.HIT,
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      x: target.x,
      y: target.y - target.height / 2,
      targetHp: target.hp
    });

    // O'lim holati
    if (target.hp <= 0 && !target.isDead) {
      target.isDead = true;
      target.respawnTimer = 2.0; // 2 soniyadan keyin respawn
      if (attacker.stats) attacker.stats.kills++;
      if (target.stats) target.stats.deaths++;
      if (attacker.score !== undefined) attacker.score++;

      events.push({
        type: EVENT_TYPE.KILL,
        killerId: attacker.id,
        victimId: target.id,
        killerName: attacker.username,
        victimName: target.username,
        x: target.x,
        y: target.y
      });
    }
  };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.GameCombat = {}));
