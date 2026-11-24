class UIManager {
  constructor() {
    this.currentScreen = 'screen-main-menu';
    this.selectedCharacter = localStorage.getItem('arena_clash_char') || 'blaze_knight';
    this.queueTimerInterval = null;
    this.userProfile = null;
    this.inOnlineGame = false;
  }

  init() {
    this.bindEvents();
    this.selectCharacterCard(this.selectedCharacter);
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }
  }

  updateProfileUI(user) {
    if (!user) return;
    this.userProfile = user;

    document.getElementById('user-display-name').textContent = user.username;
    document.getElementById('user-mmr-badge').textContent = `🏆 ${user.mmr} MMR`;
    document.getElementById('username-input').value = user.username;

    const stats = user.stats || { wins: 0, losses: 0, matchesPlayed: 0 };
    document.getElementById('profile-wl').textContent = `${stats.wins} / ${stats.losses}`;
    const winrate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;
    document.getElementById('profile-winrate').textContent = `${winrate}%`;

    const charDef = window.GameCharacters.CHARACTERS[user.favoriteCharacter || this.selectedCharacter];
    if (charDef) {
      document.getElementById('selected-char-name').textContent = charDef.name;
    }
  }

  selectCharacterCard(charId) {
    this.selectedCharacter = charId;
    localStorage.setItem('arena_clash_char', charId);

    document.querySelectorAll('.char-card').forEach(card => {
      if (card.dataset.char === charId) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    const charDef = window.GameCharacters.CHARACTERS[charId];
    if (charDef) {
      document.getElementById('selected-char-name').textContent = charDef.name;
    }
  }

  showQueueStatus(inQueue, queueTime = 0, playersCount = 1) {
    const box = document.getElementById('queue-status-box');
    const timerSpan = document.getElementById('queue-timer');
    const countSpan = document.getElementById('queue-count');

    if (inQueue) {
      box.style.display = 'block';
      timerSpan.textContent = queueTime;
      countSpan.textContent = playersCount;
    } else {
      box.style.display = 'none';
      if (this.queueTimerInterval) {
        clearInterval(this.queueTimerInterval);
        this.queueTimerInterval = null;
      }
    }
  }

  updateLobbyUI(room) {
    if (!room) return;
    document.getElementById('lobby-room-code').textContent = room.code;

    const container = document.getElementById('lobby-slots-container');
    container.innerHTML = '';

    const maxSlots = 4;
    for (let i = 0; i < maxSlots; i++) {
      const p = room.players[i];
      const slotDiv = document.createElement('div');

      if (p) {
        slotDiv.className = 'slot-card';
        const charDef = window.GameCharacters.CHARACTERS[p.characterId] || window.GameCharacters.CHARACTERS.blaze_knight;
        const isSelf = p.id === window.networkManager.playerId;

        slotDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px; width: 44px; height: 44px; background: rgba(255,255,255,0.06); border: 1px solid ${charDef.color}; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              ${charDef.id === 'blaze_knight' ? '🗡️' : (charDef.id === 'shadow_ninja' ? '🥷' : '❄️')}
            </div>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 15px;">${p.username} ${isSelf ? '(Siz)' : ''}</div>
              <div style="font-size: 12px; color: ${charDef.color};">${charDef.name} &bull; ${p.mmr || 1200} MMR</div>
            </div>
          </div>
          <div>
            <span class="ready-pill ${p.ready ? 'ready' : 'waiting'}">
              ${p.ready ? '✓ Tayyor' : 'Kutilmoqda'}
            </span>
          </div>
        `;
      } else {
        slotDiv.className = 'slot-card empty';
        slotDiv.innerHTML = `<span>+ Bo'sh o'rin</span>`;
      }

      container.appendChild(slotDiv);
    }

    // O'zimizning ready tugmamizni yangilash
    const selfPlayer = room.players.find(p => p.id === window.networkManager.playerId);
    const readyBtn = document.getElementById('btn-toggle-ready');
    if (selfPlayer && selfPlayer.ready) {
      readyBtn.textContent = 'Bekor qilish';
      readyBtn.className = 'btn btn-secondary';
    } else {
      readyBtn.textContent = 'Tayyorman (Ready)';
      readyBtn.className = 'btn btn-primary';
    }
  }

  updateArenaHUD(p1, p2, round, roundTime, matchState) {
    if (!p1) return;

    // P1 HUD
    document.getElementById('hud-p1-name').textContent = p1.username;
    const p1Char = window.GameCharacters.CHARACTERS[p1.characterId];
    if (p1Char) document.getElementById('hud-p1-char').textContent = p1Char.name;
    const p1HpRatio = Math.max(0, p1.hp / p1.maxHp);
    document.getElementById('hud-p1-hp').style.width = `${p1HpRatio * 100}%`;

    // P1 Raund yutuq pips
    const p1Pips = document.querySelectorAll('#hud-p1-pips .round-pip');
    p1Pips.forEach((pip, idx) => {
      pip.className = 'round-pip' + (idx < (p1.roundsWon || 0) ? ' won' : '');
    });

    // P2 HUD
    if (p2) {
      document.getElementById('hud-p2-name').textContent = p2.username;
      const p2Char = window.GameCharacters.CHARACTERS[p2.characterId];
      if (p2Char) document.getElementById('hud-p2-char').textContent = p2Char.name;
      const p2HpRatio = Math.max(0, p2.hp / p2.maxHp);
      document.getElementById('hud-p2-hp').style.width = `${p2HpRatio * 100}%`;

      const p2Pips = document.querySelectorAll('#hud-p2-pips .round-pip');
      p2Pips.forEach((pip, idx) => {
        pip.className = 'round-pip' + (idx < (p2.roundsWon || 0) ? ' won' : '');
      });
    }

    // Round Timer & Label
    document.getElementById('hud-match-timer').textContent = roundTime !== undefined ? roundTime : 60;
    document.getElementById('hud-round-label').textContent = `R${round || 1}`;

    // Mahoratlar Cooldown Paneli (Skill Bar)
    this.updateSkillCooldowns(p1);
  }

  updateSkillCooldowns(p1) {
    if (!p1 || !p1.cooldowns) return;
    const charDef = window.GameCharacters.CHARACTERS[p1.characterId] || window.GameCharacters.CHARACTERS.blaze_knight;
    const attacks = charDef.attacks;

    const skills = [
      { key: 'j', cd: p1.cooldowns.light || 0, maxCd: attacks.light.cooldown, name: attacks.light.name },
      { key: 'k', cd: p1.cooldowns.heavy || 0, maxCd: attacks.heavy.cooldown, name: attacks.heavy.name },
      { key: 'l', cd: p1.cooldowns.skill || 0, maxCd: attacks.skill.cooldown, name: attacks.skill.name },
      { key: 'space', cd: p1.cooldowns.dodge || 0, maxCd: attacks.dodge.cooldown, name: 'Dodge' }
    ];

    skills.forEach(s => {
      const slot = document.getElementById(`skill-slot-${s.key}`);
      const overlay = document.getElementById(`skill-cd-${s.key}`);
      const timer = document.getElementById(`skill-timer-${s.key}`);
      const nameEl = document.getElementById(`skill-name-${s.key}`);

      if (nameEl && s.name) nameEl.textContent = s.name.split(' ')[0];

      if (s.cd > 0.05) {
        if (slot) slot.className = 'skill-slot on-cooldown';
        if (overlay) {
          const pct = Math.min(100, Math.round((s.cd / s.maxCd) * 100));
          overlay.style.height = `${pct}%`;
        }
        if (timer) timer.textContent = s.cd >= 1.0 ? `${Math.ceil(s.cd)}s` : `${s.cd.toFixed(1)}s`;
      } else {
        if (slot) slot.className = 'skill-slot ready';
        if (overlay) overlay.style.height = '0%';
        if (timer) timer.textContent = '';
      }
    });
  }

  showAnnouncement(text, duration = 1500) {
    const el = document.getElementById('canvas-announcement');
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, duration);
  }

  showMatchResult(isVictory, mmrResult, stats) {
    this.showScreen('screen-match-result');
    const banner = document.getElementById('result-banner');
    const mmrBadge = document.getElementById('result-mmr-badge');

    if (isVictory) {
      banner.textContent = "G'ALABA!";
      banner.className = 'result-banner victory';
      window.audioManager.playVictory();
    } else {
      banner.textContent = "MAG'LUBIYAT";
      banner.className = 'result-banner defeat';
      window.audioManager.playDeath();
    }

    if (mmrResult) {
      const delta = isVictory ? mmrResult.winnerDelta : mmrResult.loserDelta;
      const newMmr = isVictory ? mmrResult.winnerMmr : mmrResult.loserMmr;
      const sign = delta >= 0 ? '+' : '';
      mmrBadge.textContent = `${sign}${delta} MMR (${newMmr})`;
      mmrBadge.className = `mmr-change-tag ${delta >= 0 ? 'positive' : 'negative'}`;
    } else {
      mmrBadge.textContent = isVictory ? '+24 MMR' : '-18 MMR';
    }

    // Statistika jadvali
    const tbody = document.getElementById('result-stats-body');
    tbody.innerHTML = '';

    if (stats) {
      for (const id in stats) {
        const s = stats[id];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.username || id}</strong></td>
          <td>${s.roundsWon || 0}</td>
          <td>${s.damageDealt || 0}</td>
          <td>${s.kills || 0}</td>
        `;
        tbody.appendChild(tr);
      }
    }
  }

  bindEvents() {
    // Qahramon tanlash kartalari
    document.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectCharacterCard(card.dataset.char);
      });
    });

    // Ovoz yoqish/o'chirish
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
      window.audioManager.enabled = !window.audioManager.enabled;
      document.getElementById('btn-toggle-sound').textContent = window.audioManager.enabled ? '🔊 Ovoz' : '🔇 Ovoz o\'chiq';
    });

    // Qahramon tanlash ekraniga o'tish
    document.getElementById('btn-open-char-select').addEventListener('click', () => {
      this.showScreen('screen-character-select');
    });

    document.getElementById('btn-back-from-char').addEventListener('click', () => {
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-confirm-char').addEventListener('click', () => {
      window.networkManager.selectCharacter(this.selectedCharacter);
      this.showScreen('screen-main-menu');
    });

    // Username saqlash
    document.getElementById('btn-save-username').addEventListener('click', () => {
      const val = document.getElementById('username-input').value.trim();
      if (val) {
        localStorage.setItem('arena_clash_username', val);
        window.networkManager.auth(val, this.selectedCharacter);
      }
    });

    // Matchmaking
    document.getElementById('btn-join-matchmaking').addEventListener('click', () => {
      window.networkManager.joinQueue(this.selectedCharacter);
    });

    document.getElementById('btn-cancel-queue').addEventListener('click', () => {
      window.networkManager.leaveQueue();
    });

    // Custom Room
    document.getElementById('btn-create-room').addEventListener('click', () => {
      window.networkManager.createRoom(this.selectedCharacter);
    });

    document.getElementById('btn-join-room').addEventListener('click', () => {
      const code = document.getElementById('join-room-code-input').value.trim();
      if (code) {
        window.networkManager.joinRoom(code, this.selectedCharacter);
      }
    });

    // Lobby
    document.getElementById('btn-leave-lobby').addEventListener('click', () => {
      window.networkManager.leaveRoom();
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-toggle-ready').addEventListener('click', () => {
      const btn = document.getElementById('btn-toggle-ready');
      const isCurrentlyReady = btn.textContent.includes('Bekor');
      window.networkManager.setReady(!isCurrentlyReady);
    });

    document.getElementById('lobby-room-code').addEventListener('click', () => {
      const code = document.getElementById('lobby-room-code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        alert(`Xona kodi (${code}) buferga nusxalandi! Do'stingizga yuboring.`);
      });
    });

    // Lokal 2-O'yinchi Rejimi
    document.getElementById('btn-local-pvp').addEventListener('click', () => {
      this.inOnlineGame = false;
      this.showScreen('screen-arena');
      window.localGame.start('1v1', this.selectedCharacter, 'shadow_ninja');
      this.showAnnouncement('LOKAL 1V1 — RAUND 1');
    });

    // Botga qarshi mashg'ulot
    document.getElementById('btn-vs-bot').addEventListener('click', () => {
      this.inOnlineGame = false;
      this.showScreen('screen-arena');
      window.localGame.start('vs_bot', this.selectedCharacter, 'shadow_ninja');
      this.showAnnouncement('MASHG\'ULOT — AI BOT');
    });

    // Match Result tugmalari
    document.getElementById('btn-result-menu').addEventListener('click', () => {
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-result-rematch').addEventListener('click', () => {
      if (this.inOnlineGame) {
        window.networkManager.joinQueue(this.selectedCharacter);
        this.showScreen('screen-main-menu');
      } else {
        this.showScreen('screen-arena');
        window.localGame.start(window.localGame.mode, this.selectedCharacter, 'shadow_ninja');
      }
    });

    // Leaderboard
    document.getElementById('btn-view-leaderboard').addEventListener('click', () => {
      fetch('/api/leaderboard')
        .then(res => res.json())
        .then(list => {
          const tbody = document.getElementById('leaderboard-table-body');
          tbody.innerHTML = '';
          list.forEach((u, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>#${i + 1}</td>
              <td><strong>${u.username}</strong></td>
              <td style="color: var(--accent-gold); font-weight: 700;">${u.mmr}</td>
              <td>${u.wins} / ${u.losses}</td>
              <td style="color: var(--accent-green);">${u.winRate}%</td>
            `;
            tbody.appendChild(tr);
          });
          document.getElementById('modal-leaderboard').classList.add('active');
        });
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
      document.getElementById('modal-leaderboard').classList.remove('active');
    });

    // Replays
    document.getElementById('btn-view-replays').addEventListener('click', () => {
      fetch('/api/replays')
        .then(res => res.json())
        .then(list => {
          const cont = document.getElementById('replays-list-container');
          cont.innerHTML = '';
          if (list.length === 0) {
            cont.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Hali saqlangan replaylar yo\'q.</div>';
          } else {
            list.forEach(r => {
              const div = document.createElement('div');
              div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;';
              div.innerHTML = `
                <div>
                  <div style="font-weight: 700;">Match ID: ${r.id}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${r.duration} sek davomiyligi &bull; ${r.totalTicks} ta tick</div>
                </div>
                <button class="btn btn-primary" style="width: auto; margin-bottom: 0; padding: 6px 14px; font-size: 13px;" onclick="alert('Replay yuklanmoqda... (Replay ID: ${r.id})')">Ko'rish</button>
              `;
              cont.appendChild(div);
            });
          }
          document.getElementById('modal-replays').classList.add('active');
        });
    });

    document.getElementById('btn-close-replays').addEventListener('click', () => {
      document.getElementById('modal-replays').classList.remove('active');
    });

    // F3 Debug tugmasi
    document.getElementById('btn-toggle-debug').addEventListener('click', () => {
      window.renderer.showDebug = !window.renderer.showDebug;
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        window.renderer.showDebug = !window.renderer.showDebug;
      }
    });
  }
}

window.uiManager = new UIManager();
