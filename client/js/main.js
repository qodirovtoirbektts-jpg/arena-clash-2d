// Arena Clash 2D — Asosiy Klient O'yin Tsikli (Main Client Loop)
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  window.renderer = new Renderer(canvas);
  window.uiManager.init();
  window.touchControls.init();

  let lastTime = performance.now();
  let fpsCounter = 0;
  let fpsTimer = 0;
  let currentFps = 60;
  let clientTick = 0;

  // Onlayn snapshot va o'yin holati
  let currentMatchData = null;
  let latestSnapshot = null;
  let isLocalMode = false;

  // Tarmoq hodisalarini ulash
  const net = window.networkManager;
  const { MSG, EVENT_TYPE } = window.GameProtocol;

  // 1. Auth OK
  net.on(MSG.S_AUTH_OK, (msg) => {
    window.uiManager.updateProfileUI(msg.user);
  });

  // 2. Queue Update
  net.on(MSG.S_QUEUE_UPDATE, (msg) => {
    window.uiManager.showQueueStatus(msg.inQueue, msg.queueTime, msg.playersInQueue);
  });

  // 3. Room Update
  net.on(MSG.S_ROOM_UPDATE, (msg) => {
    if (msg.room.state === 'LOBBY') {
      window.uiManager.showScreen('screen-lobby');
      window.uiManager.updateLobbyUI(msg.room);
    }
  });

  // 4. Match Start
  net.on(MSG.S_MATCH_START, (msg) => {
    currentMatchData = msg;
    isLocalMode = false;
    window.uiManager.inOnlineGame = true;
    window.uiManager.showScreen('screen-arena');
    window.uiManager.showAnnouncement('ROUND 1 — FIGHT!');
    window.audioManager.playCountdown(true);

    // Local player predictionni initsializatsiya qilish
    const selfPlayerDef = msg.players.find(p => p.id === net.playerId) || msg.players[0];
    const initialPlayerState = window.GameCombat.createPlayerState(
      selfPlayerDef.id,
      selfPlayerDef.username,
      selfPlayerDef.characterId,
      0
    );
    window.clientPrediction.init(initialPlayerState);
    window.entityInterpolation.clearAll();
    window.inputManager.clear();
  });

  // 5. Reconnected
  net.on(MSG.S_RECONNECTED, (msg) => {
    window.uiManager.inOnlineGame = true;
    window.uiManager.showScreen('screen-arena');
    window.uiManager.showAnnouncement('QAYTA ULANDI!');
  });

  // 6. Snapshot (Server-Authoritative Game State Replication)
  net.on(MSG.S_SNAPSHOT, (msg) => {
    latestSnapshot = msg;

    const selfId = net.playerId;
    const serverSelfPlayer = msg.players[selfId];

    // Server Reconciliation
    if (serverSelfPlayer) {
      window.inputManager.acknowledge(serverSelfPlayer.lastProcessedInput);
      window.clientPrediction.reconcile(
        serverSelfPlayer,
        window.inputManager.unacknowledgedInputs,
        window.GameConstants.DELTA_TIME
      );
    }

    // Remote Players Interpolation
    for (const id in msg.players) {
      if (id !== selfId) {
        window.entityInterpolation.addSnapshot(id, msg.players[id], msg.serverTime);
      }
    }

    // Hodisalarni qayta ishlash (Hits, Deaths, SFX)
    if (msg.events && msg.events.length > 0) {
      for (const ev of msg.events) {
        handleServerEvent(ev, selfId);
      }
    }
  });

  // 7. Match Result
  net.on(MSG.S_MATCH_RESULT, (msg) => {
    const isVictory = msg.winnerId === net.playerId;
    window.uiManager.showMatchResult(isVictory, msg.mmrResult, msg.stats);
    // Profilni yangilash
    fetch(`/api/profile/${net.playerId}`)
      .then(res => res.json())
      .then(user => window.uiManager.updateProfileUI(user))
      .catch(() => {});
  });

  // 8. Server Error
  net.on(MSG.S_ERROR, (msg) => {
    if (window.uiManager && window.uiManager.showToast) {
      window.uiManager.showToast(msg.message || 'Xatolik yuz berdi', 'danger');
    } else {
      console.error('[Server Error]', msg.message);
    }
  });

  function handleServerEvent(ev, selfId) {
    if (ev.type === EVENT_TYPE.HIT) {
      const isHeavy = ev.damage > 20;
      window.renderer.triggerScreenShake(isHeavy ? 10 : 4);
      if (isHeavy) window.renderer.triggerHitStop(0.045);
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
      window.renderer.spawnParticles(ev.x, ev.y, 6, '#38bdf8', 120);
    } else if (ev.type === EVENT_TYPE.SKILL_CAST) {
      window.audioManager.playSkill(ev.characterId);
      if (ev.characterId === 'frost_mage') {
        window.renderer.addGroundDecal(ev.x, ev.y, 'frost');
        window.renderer.spawnParticles(ev.x, ev.y, 30, '#00d2d3', 220);
      } else if (ev.characterId === 'blaze_knight') {
        window.renderer.addGroundDecal(ev.x, ev.y, 'fire');
        window.renderer.spawnParticles(ev.x, ev.y, 30, '#ff4757', 260);
      }
    } else if (ev.type === EVENT_TYPE.KILL) {
      window.audioManager.playDeath();
      window.renderer.triggerScreenShake(16);
      window.renderer.triggerHitStop(0.08);
      window.renderer.spawnParticles(ev.x, ev.y, 35, '#ff4757', 280);
      window.renderer.addDamageText(ev.x, ev.y - 30, 'KNOCKOUT!', '#e74c3c', true);
    } else if (ev.type === EVENT_TYPE.ROUND_START) {
      window.uiManager.showAnnouncement(`ROUND ${ev.round} — JANG!`);
      window.audioManager.playCountdown(true);
    } else if (ev.type === EVENT_TYPE.ROUND_WIN) {
      const isWinner = ev.winnerId === selfId;
      window.uiManager.showAnnouncement(isWinner ? 'RAUND G\'ALABASI!' : 'RAUND MAG\'LUBIYATI');
    }
  }

  // Asosiy Render va O'yin Tsikli
  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    clientTick++;

    // FPS hisoblash
    fpsCounter++;
    fpsTimer += dt;
    if (fpsTimer >= 1.0) {
      currentFps = fpsCounter;
      fpsCounter = 0;
      fpsTimer = 0;
      const pingEl = document.getElementById('ping-display');
      if (pingEl) {
        const iconHtml = window.GameIcons ? window.GameIcons.get('signal') : '';
        pingEl.innerHTML = `${iconHtml} <span>${net.ping} ms</span>`;
      }
    }

    // Effektlarni yangilash
    window.renderer.updateEffects(dt);
    window.clientPrediction.updateVisualOffset();

    // 1. LOKAL REJIM
    if (!window.uiManager.inOnlineGame && window.localGame.active) {
      window.localGame.update(dt);
      const localState = window.localGame.getRenderState();

      window.renderer.render({
        players: localState.players,
        projectiles: localState.projectiles,
        debugInfo: {
          fps: currentFps,
          ping: 0,
          tickRate: 60,
          serverTick: window.localGame.tick,
          reconciledCount: 0,
          lastSeq: window.localGame.tick
        }
      });

      // HUD yangilash
      window.uiManager.updateArenaHUD(
        window.localGame.players.p1,
        window.localGame.players.p2,
        localState.round,
        localState.roundTime,
        localState.matchState
      );

      if (localState.matchState === window.GameConstants.MATCH_STATE.MATCH_OVER) {
        const isVictory = localState.winner && localState.winner.id === 'p1';
        window.uiManager.showMatchResult(isVictory, null, {
          p1: { username: 'Player 1', roundsWon: window.localGame.players.p1.roundsWon, damageDealt: window.localGame.players.p1.stats.damageDealt, kills: window.localGame.players.p1.stats.kills },
          p2: { username: window.localGame.players.p2.username, roundsWon: window.localGame.players.p2.roundsWon, damageDealt: window.localGame.players.p2.stats.damageDealt, kills: window.localGame.players.p2.stats.kills }
        });
        window.localGame.stop();
      }
    }
    // 2. ONLAYN REJIM
    else if (window.uiManager.inOnlineGame && latestSnapshot) {
      // 1. Klient kirishini olish va serverga jo'natish
      const input = window.inputManager.getPlayer1Input(clientTick);
      net.sendInput(input);

      // 2. Client-Side Prediction
      window.clientPrediction.predict(input, dt);

      // 3. Render holatini tayyorlash
      const renderPlayers = [];
      const selfId = net.playerId;

      // Lokal o'yinchi (bashorat qilingan pozitsiya va vizual silliqlash bilan)
      if (window.clientPrediction.predictedState) {
        const renderPos = window.clientPrediction.getRenderPosition();
        renderPlayers.push({
          ...window.clientPrediction.predictedState,
          x: renderPos.x,
          y: renderPos.y
        });
      }

      // Masofaviy o'yinchilar (Interpolatsiya bilan)
      const renderTime = Date.now();
      for (const id in latestSnapshot.players) {
        if (id !== selfId) {
          const interp = window.entityInterpolation.getInterpolatedState(id, renderTime);
          if (interp) {
            renderPlayers.push(interp);
          } else {
            renderPlayers.push(latestSnapshot.players[id]);
          }
        }
      }

      window.renderer.render({
        players: renderPlayers,
        projectiles: latestSnapshot.projectiles,
        debugInfo: {
          fps: currentFps,
          ping: net.ping,
          tickRate: window.GameConstants.TICK_RATE,
          serverTick: latestSnapshot.tick,
          reconciledCount: window.clientPrediction.reconciledCount,
          lastSeq: input.seq
        }
      });

      // HUD yangilash
      const selfPlayer = renderPlayers.find(p => p.id === selfId);
      const enemyPlayer = renderPlayers.find(p => p.id !== selfId);
      window.uiManager.updateArenaHUD(
        selfPlayer,
        enemyPlayer,
        latestSnapshot.round,
        latestSnapshot.roundTime,
        latestSnapshot.matchState
      );
    }

    requestAnimationFrame(gameLoop);
  }

  // WebSocket ga ulanish
  net.connect();

  // O'yin tsiklini ishga tushirish
  requestAnimationFrame(gameLoop);
});
