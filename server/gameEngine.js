const { TICK_RATE, TICK_INTERVAL_MS, DELTA_TIME, ROUNDS_TO_WIN, ROUND_TIME_SECONDS, COUNTDOWN_SECONDS, MATCH_STATE, PLATFORMS } = require('../shared/constants');
const { CHARACTERS } = require('../shared/characters');
const { updatePlayerPhysics } = require('../shared/physics');
const { createPlayerState, updateTimers, handleCombatInput, resolveAttacks, updateProjectiles, respawnPlayer } = require('../shared/combat');
const { MSG, EVENT_TYPE } = require('../shared/protocol');
const storage = require('./storage');

class GameEngine {
  constructor(room) {
    this.room = room;
    this.tick = 0;
    this.state = MATCH_STATE.COUNTDOWN;
    this.countdown = COUNTDOWN_SECONDS;
    this.roundTime = ROUND_TIME_SECONDS;
    this.round = 1;
    this.maxRounds = ROUNDS_TO_WIN * 2 - 1;

    // O'yinchilar
    this.players = {}; // playerId -> playerState
    this.projectiles = [];
    this.events = [];
    this.inputQueues = {}; // playerId -> array of pending inputs

    // Lag Compensation uchun tarixiy bufer (oxirgi 30 tick = 1000ms)
    this.historyBuffer = []; // [ { tick, timestamp, players: { ...positions } } ]
    this.maxHistorySize = 30;

    // Match Replay yozish buferi
    this.replayTicks = [];
    this.matchStartTime = Date.now();

    this.timer = null;
    this.initPlayers();
  }

  initPlayers() {
    let index = 0;
    for (const p of this.room.players) {
      this.players[p.id] = createPlayerState(p.id, p.username, p.characterId, index++);
      this.inputQueues[p.id] = [];
    }
  }

  start() {
    this.state = MATCH_STATE.COUNTDOWN;
    this.countdown = COUNTDOWN_SECONDS;
    this.events.push({ type: EVENT_TYPE.ROUND_START, round: this.round });

    this.timer = setInterval(() => {
      this.update();
    }, TICK_INTERVAL_MS);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Clientdan kelgan inputni qabul qilish va tekshirish (Anti-cheat)
  queueInput(playerId, input) {
    if (!this.inputQueues[playerId]) this.inputQueues[playerId] = [];
    
    // Rate limit: buferda ko'pi bilan 10 ta buyruq
    if (this.inputQueues[playerId].length > 10) {
      this.inputQueues[playerId].shift();
    }

    // Sanitization: input qiymatlarini tekshirish
    const sanitized = {
      seq: typeof input.seq === 'number' ? input.seq : 0,
      clientTick: input.tick || 0,
      moveX: Math.max(-1, Math.min(1, Number(input.moveX) || 0)),
      moveY: Math.max(-1, Math.min(1, Number(input.moveY) || 0)),
      jump: !!input.jump,
      drop: !!input.drop,
      attackLight: !!input.attackLight,
      attackHeavy: !!input.attackHeavy,
      skill: !!input.skill,
      dodge: !!input.dodge
    };

    this.inputQueues[playerId].push(sanitized);
  }

  update() {
    this.tick++;
    const dt = DELTA_TIME;

    // 1. COUNTDOWN holati
    if (this.state === MATCH_STATE.COUNTDOWN) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = MATCH_STATE.PLAYING;
        this.roundTime = ROUND_TIME_SECONDS;
      }
      this.broadcastSnapshot();
      return;
    }

    // 2. ROUND_END holati
    if (this.state === MATCH_STATE.ROUND_END) {
      this.roundEndTimer -= dt;
      if (this.roundEndTimer <= 0) {
        this.checkMatchProgression();
      }
      this.broadcastSnapshot();
      return;
    }

    // 3. MATCH_OVER holati
    if (this.state === MATCH_STATE.MATCH_OVER) {
      this.broadcastSnapshot();
      return;
    }

    // 4. PLAYING holati
    this.roundTime -= dt;
    if (this.roundTime <= 0) {
      this.handleRoundTimeout();
      return;
    }

    // Har bir o'yinchining kirish buyruqlarini qayta ishlash
    for (const id in this.players) {
      const player = this.players[id];
      const queue = this.inputQueues[id] || [];

      // Oxirgi inputni olish yoki bo'sh input qo'llash
      let currentInput = { moveX: 0, moveY: 0, jump: false, drop: false };
      let lastSeq = player.lastProcessedInput || 0;

      while (queue.length > 0) {
        const inp = queue.shift();
        currentInput = inp;
        lastSeq = inp.seq;

        // Jang amallari (hujum, dodge, skill)
        handleCombatInput(player, inp, this.projectiles, this.events);
      }
      player.lastProcessedInput = lastSeq;

      // Taymerlarni (cooldown, respawn, buff/debuff) yangilash
      updateTimers(player, dt);

      // Fizika va harakat
      updatePlayerPhysics(player, currentInput, dt, PLATFORMS);

      // Anti-cheat tezlik tekshiruvi: ruxsat etilgan chegaradan chiqmaslik
      const maxAllowedSpeed = player.baseSpeed * 2.5; // dash yoki knockback uchun zaxira
      if (Math.abs(player.vx) > maxAllowedSpeed && !player.isDodging && !player.isDashing) {
        player.vx = Math.sign(player.vx) * maxAllowedSpeed;
      }
    }

    // Melee va AoE to'qnashuvlarini hisoblash
    resolveAttacks(this.players, this.events, dt);

    // Snaryadlar (Projectiles) harakati
    updateProjectiles(this.projectiles, this.players, this.events, dt);

    // O'lim va Raund g'olibini tekshirish
    this.checkRoundStatus();

    // Lag Compensation buferiga joriy holatni saqlash
    this.recordHistory();

    // Replay uchun holatni qayd qilish
    if (this.tick % 2 === 0) {
      this.recordReplayTick();
    }

    // Snapshot yuborish
    this.broadcastSnapshot();
  }

  // Raund yakunini tekshirish (o'limlar soni)
  checkRoundStatus() {
    const alivePlayers = Object.values(this.players).filter(p => !p.isDead && p.hp > 0);
    const totalPlayers = Object.values(this.players);

    // Agar 1v1 bo'lsa va 1 ta o'yinchi qolgan bo'lsa
    if (totalPlayers.length >= 2 && alivePlayers.length === 1) {
      const winner = alivePlayers[0];
      winner.roundsWon++;

      this.events.push({
        type: EVENT_TYPE.ROUND_WIN,
        winnerId: winner.id,
        winnerName: winner.username,
        round: this.round
      });

      this.state = MATCH_STATE.ROUND_END;
      this.roundEndTimer = 3.0; // 3 soniya tanaffus
    }
  }

  // Vaqt tugaganda g'olibni aniqlash
  handleRoundTimeout() {
    const list = Object.values(this.players);
    list.sort((a, b) => b.hp - a.hp);
    const winner = list[0];
    if (winner) {
      winner.roundsWon++;
      this.events.push({
        type: EVENT_TYPE.ROUND_WIN,
        winnerId: winner.id,
        winnerName: winner.username,
        round: this.round,
        reason: 'timeout'
      });
    }

    this.state = MATCH_STATE.ROUND_END;
    this.roundEndTimer = 3.0;
  }

  // Keyingi raund yoki match yakuni
  checkMatchProgression() {
    const list = Object.values(this.players);
    let matchWinner = null;

    for (const p of list) {
      if (p.roundsWon >= ROUNDS_TO_WIN) {
        matchWinner = p;
        break;
      }
    }

    if (matchWinner) {
      this.finalizeMatch(matchWinner);
    } else {
      // Keyingi raundga o'tish
      this.round++;
      let idx = 0;
      for (const p of list) {
        respawnPlayer(p, idx++);
      }
      this.projectiles = [];
      this.state = MATCH_STATE.COUNTDOWN;
      this.countdown = COUNTDOWN_SECONDS;
      this.events.push({ type: EVENT_TYPE.ROUND_START, round: this.round });
    }
  }

  // Matchni yakunlash va natijalarni saqlash
  finalizeMatch(winner) {
    this.state = MATCH_STATE.MATCH_OVER;
    const list = Object.values(this.players);
    const loser = list.find(p => p.id !== winner.id) || list[1] || { id: 'unknown', username: 'Opponent' };

    // Replayni saqlash
    const replayId = storage.saveReplay({
      players: list.map(p => ({ id: p.id, username: p.username, characterId: p.characterId })),
      winnerId: winner.id,
      score: `${winner.roundsWon} - ${loser.roundsWon || 0}`,
      duration: Math.round((Date.now() - this.matchStartTime) / 1000),
      ticks: this.replayTicks
    });

    // Elo MMR reytingini yangilash
    const mmrResult = storage.updateMatchMmr(winner.id, loser.id, {
      score: `${winner.roundsWon} - ${loser.roundsWon || 0}`,
      duration: Math.round((Date.now() - this.matchStartTime) / 1000),
      replayId
    });

    const matchStats = {};
    for (const p of list) {
      matchStats[p.id] = {
        ...p.stats,
        roundsWon: p.roundsWon,
        username: p.username
      };
    }

    this.events.push({
      type: EVENT_TYPE.MATCH_WIN,
      winnerId: winner.id,
      winnerName: winner.username,
      loserId: loser.id,
      mmrResult,
      replayId
    });

    this.room.broadcast({
      type: MSG.S_MATCH_RESULT,
      winnerId: winner.id,
      winnerName: winner.username,
      replayId,
      mmrResult,
      stats: matchStats
    });

    // 5 soniyadan so'ng xonani qaytadan Lobby holatiga o'tkazish
    setTimeout(() => {
      this.stop();
      this.room.resetToLobby();
    }, 6000);
  }

  recordHistory() {
    const snapshot = {
      tick: this.tick,
      time: Date.now(),
      positions: {}
    };
    for (const id in this.players) {
      const p = this.players[id];
      snapshot.positions[id] = { x: p.x, y: p.y, width: p.width, height: p.height };
    }
    this.historyBuffer.push(snapshot);
    if (this.historyBuffer.length > this.maxHistorySize) {
      this.historyBuffer.shift();
    }
  }

  recordReplayTick() {
    this.replayTicks.push({
      tick: this.tick,
      players: Object.values(this.players).map(p => ({
        id: p.id,
        x: Math.round(p.x),
        y: Math.round(p.y),
        facing: p.facing,
        hp: p.hp,
        isAttacking: p.isAttacking,
        attackType: p.currentAttack ? p.currentAttack.type : null,
        isDodging: p.isDodging,
        isDashing: p.isDashing
      })),
      projectiles: this.projectiles.map(pr => ({
        x: Math.round(pr.x),
        y: Math.round(pr.y),
        type: pr.type,
        color: pr.color
      }))
    });
  }

  // To'liq o'yin holatini barcha o'yinchilarga yuborish
  broadcastSnapshot() {
    const serializedPlayers = {};
    for (const id in this.players) {
      const p = this.players[id];
      serializedPlayers[id] = {
        id: p.id,
        username: p.username,
        characterId: p.characterId,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx),
        vy: Math.round(p.vy),
        facing: p.facing,
        hp: Math.round(p.hp),
        maxHp: p.maxHp,
        score: p.score,
        roundsWon: p.roundsWon,
        isDead: p.isDead,
        respawnTimer: Math.round(p.respawnTimer * 10) / 10,
        invulnerable: p.invulnerable,
        onGround: p.onGround,
        isAttacking: p.isAttacking,
        attackType: p.currentAttack ? p.currentAttack.type : null,
        isDodging: p.isDodging,
        isDashing: p.isDashing,
        stunTimer: Math.round(p.stunTimer * 10) / 10,
        slowTimer: Math.round(p.slowTimer * 10) / 10,
        cooldowns: {
          light: Math.round(p.cooldowns.light * 10) / 10,
          heavy: Math.round(p.cooldowns.heavy * 10) / 10,
          skill: Math.round(p.cooldowns.skill * 10) / 10,
          dodge: Math.round(p.cooldowns.dodge * 10) / 10
        },
        lastProcessedInput: p.lastProcessedInput || 0
      };
    }

    const payload = {
      type: MSG.S_SNAPSHOT,
      tick: this.tick,
      serverTime: Date.now(),
      matchState: this.state,
      round: this.round,
      countdown: Math.ceil(this.countdown),
      roundTime: Math.ceil(this.roundTime),
      players: serializedPlayers,
      projectiles: this.projectiles.map(pr => ({
        id: pr.id,
        x: Math.round(pr.x),
        y: Math.round(pr.y),
        vx: Math.round(pr.vx),
        vy: Math.round(pr.vy),
        radius: pr.radius,
        color: pr.color,
        type: pr.type
      })),
      events: [...this.events]
    };

    this.room.broadcast(payload);
    // Transient eventlarni tozalash
    this.events = [];
  }
}

module.exports = GameEngine;
