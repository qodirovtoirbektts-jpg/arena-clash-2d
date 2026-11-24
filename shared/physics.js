(function(exports) {
  const { ARENA_WIDTH, ARENA_HEIGHT, GRAVITY, MAX_FALL_SPEED, GROUND_FRICTION, AIR_FRICTION, PLATFORMS } = 
    (typeof require !== 'undefined') ? require('./constants') : window.GameConstants;

  // AABB (Axis-Aligned Bounding Box) to'qnashuvi
  exports.checkAABB = function(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  // Nuqta va AABB to'qnashuvi
  exports.pointInAABB = function(px, py, box) {
    return (
      px >= box.x &&
      px <= box.x + box.width &&
      py >= box.y &&
      py <= box.y + box.height
    );
  };

  // Doira va AABB to'qnashuvi (Projectiles va AoE uchun)
  exports.circleAABB = function(cx, cy, radius, box) {
    const closestX = Math.max(box.x, Math.min(cx, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(cy, box.y + box.height));
    const distX = cx - closestX;
    const distY = cy - closestY;
    return (distX * distX + distY * distY) < (radius * radius);
  };

  // O'yinchining to'liq AABB hitboksi
  exports.getPlayerBounds = function(player) {
    return {
      x: player.x - player.width / 2,
      y: player.y - player.height,
      width: player.width,
      height: player.height
    };
  };

  // Har bir o'yinchining deterministik fizikasi (Server va Clientda bir xil)
  exports.updatePlayerPhysics = function(player, input, dt, platforms = PLATFORMS) {
    // Agar o'yinchi o'lgan bo'lsa yoki harakatsiz holatda bo'lsa
    if (player.isDead) return;

    // Sekinlashtirish (Slow effect) koeffitsienti
    let speedMult = 1.0;
    if (player.slowTimer > 0) {
      player.slowTimer -= dt;
      speedMult = 0.5;
    }

    // Dodging / Dash holati
    if (player.isDodging) {
      player.dodgeTimer -= dt;
      if (player.dodgeTimer <= 0) {
        player.isDodging = false;
        player.invulnerable = false;
      } else {
        // Dash vaqtida belgilangan yo'nalishda yuqori tezlikda uchadi
        player.x += player.dodgeVx * dt;
        player.y += player.dodgeVy * dt;

        // Devorlar bilan cheklash
        player.x = Math.max(70, Math.min(player.x, ARENA_WIDTH - 70));
        return;
      }
    }

    // Inferno Dash (Blaze Knight skill) holati
    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.invulnerable = false;
      } else {
        player.x += player.dashVx * dt;
        player.x = Math.max(70, Math.min(player.x, ARENA_WIDTH - 70));
        return;
      }
    }

    // Stun holati
    if (player.stunTimer > 0) {
      player.stunTimer -= dt;
      input = { moveX: 0, moveY: 0, jump: false, drop: false }; // Hech qanday boshqaruv qabul qilinmaydi
    }

    const prevY = player.y;
    const prevX = player.x;

    // Gorizontal harakat (WASD: A / D)
    const moveDir = input.moveX || 0;
    const targetVx = moveDir * player.baseSpeed * speedMult;

    // Knockback susayishi
    if (Math.abs(player.vx) > player.baseSpeed * speedMult) {
      player.vx *= player.onGround ? 0.88 : 0.95;
    } else {
      player.vx = targetVx;
    }

    // Yuzlanish yo'nalishi (Facing direction: 1 = o'ng, -1 = chap)
    if (moveDir !== 0 && !player.isAttacking) {
      player.facing = moveDir > 0 ? 1 : -1;
    }

    // Sakrash (Jump: W yoki Space)
    if (input.jump && !player.jumpHeld) {
      if (player.onGround) {
        player.vy = -player.baseJumpForce;
        player.onGround = false;
        player.hasDoubleJumped = false;
      } else if (player.canDoubleJump && !player.hasDoubleJumped) {
        player.vy = -player.baseJumpForce * 0.92;
        player.hasDoubleJumped = true;
      }
    }
    player.jumpHeld = !!input.jump;

    // Gravitatsiya
    player.vy += GRAVITY * dt;
    if (player.vy > MAX_FALL_SPEED) {
      player.vy = MAX_FALL_SPEED;
    }

    // Pozitsiyani yangilash
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Pastga sakrash (Drop down through one-way platforms: S)
    const dropping = !!input.drop;

    // Platformalar va yer bilan to'qnashuvni tekshirish
    player.onGround = false;
    const halfW = player.width / 2;

    for (let i = 0; i < platforms.length; i++) {
      const plat = platforms[i];

      // Bir tomonlama platforma (One-way)
      if (plat.oneWay) {
        if (!dropping && prevY <= plat.y + 2 && player.y >= plat.y) {
          // O'yinchi platforma eni bo'ylab ustidami?
          if (player.x + halfW > plat.x && player.x - halfW < plat.x + plat.width) {
            player.y = plat.y;
            player.vy = 0;
            player.onGround = true;
            player.hasDoubleJumped = false;
          }
        }
      } else {
        // Qattiq platforma yoki devor (Solid)
        const pBox = exports.getPlayerBounds(player);
        if (exports.checkAABB(pBox, plat)) {
          // Tepadan tushish (Yerga qo'nish)
          if (prevY <= plat.y && player.vy >= 0) {
            player.y = plat.y;
            player.vy = 0;
            player.onGround = true;
            player.hasDoubleJumped = false;
          }
          // Pastdan bosh bilan urilish (Shift)
          else if (prevY - player.height >= plat.y + plat.height && player.vy < 0) {
            player.y = plat.y + plat.height + player.height;
            player.vy = 0;
          }
          // Yon devorlar
          else if (player.x < plat.x + plat.width / 2) {
            player.x = plat.x - halfW;
          } else {
            player.x = plat.x + plat.width + halfW;
          }
        }
      }
    }

    // Xarita chegaralaridan chiqib ketmaslik
    if (player.x < 70) player.x = 70;
    if (player.x > ARENA_WIDTH - 70) player.x = ARENA_WIDTH - 70;

    // Agar qandaydir sabab bilan tubsizlikka tushib ketsa
    if (player.y > ARENA_HEIGHT) {
      player.y = 470;
      player.vy = 0;
      player.onGround = true;
    }
  };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.GamePhysics = {}));
