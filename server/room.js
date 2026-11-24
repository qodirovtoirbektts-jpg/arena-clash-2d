const { MSG } = require('../shared/protocol');
const { RECONNECT_TIMEOUT_MS } = require('../shared/constants');
const GameEngine = require('./gameEngine');

class Room {
  constructor(code, hostPlayer, maxPlayers = 4) {
    this.code = code;
    this.hostId = hostPlayer.id;
    this.maxPlayers = maxPlayers;
    this.state = 'LOBBY'; // 'LOBBY' | 'IN_GAME'
    this.players = [];
    this.engine = null;
    this.reconnectTimers = {}; // playerId -> timeout
    this.createdTime = Date.now();

    this.addPlayer(hostPlayer);
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) return false;
    if (this.players.find(p => p.id === player.id)) return false;

    this.players.push({
      id: player.id,
      username: player.username,
      characterId: player.characterId || 'blaze_knight',
      ready: false,
      connected: true,
      socket: player.socket,
      sessionToken: player.sessionToken,
      mmr: player.mmr || 1200
    });

    this.broadcastRoomUpdate();
    return true;
  }

  removePlayer(playerId) {
    const idx = this.players.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      this.players.splice(idx, 1);
      // Agar host chiqib ketsa, keyingi o'yinchini host qilish
      if (this.hostId === playerId && this.players.length > 0) {
        this.hostId = this.players[0].id;
      }
      this.broadcastRoomUpdate();
    }
  }

  handleDisconnect(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    player.connected = false;
    player.socket = null;

    if (this.state === 'IN_GAME') {
      // O'yin davom etayotganda 30 soniyalik reconnect taymerini yoqish
      this.reconnectTimers[playerId] = setTimeout(() => {
        console.log(`[Room ${this.code}] O'yinchi ${playerId} qaytib kelmadi, xonadan chiqarildi.`);
        this.removePlayer(playerId);
        delete this.reconnectTimers[playerId];

        // Agar barcha o'yinchilar chiqib ketgan bo'lsa
        if (this.players.filter(p => p.connected).length === 0) {
          if (this.engine) this.engine.stop();
        }
      }, RECONNECT_TIMEOUT_MS);
    } else {
      // Lobbida bo'lsa darhol xonadan chiqarish
      this.removePlayer(playerId);
    }

    this.broadcastRoomUpdate();
  }

  handleReconnect(playerId, sessionToken, newSocket) {
    const player = this.players.find(p => p.id === playerId && p.sessionToken === sessionToken);
    if (!player) return false;

    // Taymerni bekor qilish
    if (this.reconnectTimers[playerId]) {
      clearTimeout(this.reconnectTimers[playerId]);
      delete this.reconnectTimers[playerId];
    }

    player.connected = true;
    player.socket = newSocket;

    // Klientga qayta ulanish muvaffaqiyatli bo'lganini bildirish
    newSocket.send(JSON.stringify({
      type: MSG.S_RECONNECTED,
      roomCode: this.code,
      state: this.state,
      characterId: player.characterId
    }));

    this.broadcastRoomUpdate();
    return true;
  }

  setPlayerReady(playerId, ready) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    player.ready = !!ready;
    this.broadcastRoomUpdate();

    // Agar hamma ready bo'lsa va kamida 2 o'yinchi bo'lsa, o'yinni boshlash
    if (this.state === 'LOBBY' && this.players.length >= 2 && this.players.every(p => p.ready)) {
      this.startGame();
    }
  }

  selectCharacter(playerId, characterId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.state !== 'LOBBY') return;
    player.characterId = characterId;
    this.broadcastRoomUpdate();
  }

  startGame() {
    this.state = 'IN_GAME';
    this.broadcast({
      type: MSG.S_MATCH_START,
      roomCode: this.code,
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        characterId: p.characterId
      }))
    });

    this.engine = new GameEngine(this);
    this.engine.start();
  }

  resetToLobby() {
    if (this.engine) {
      this.engine.stop();
      this.engine = null;
    }
    this.state = 'LOBBY';
    for (const p of this.players) {
      p.ready = false;
    }
    this.broadcastRoomUpdate();
  }

  broadcast(message) {
    const raw = JSON.stringify(message);
    for (const p of this.players) {
      if (p.socket && p.connected && p.socket.readyState === 1) { // WebSocket.OPEN
        try {
          p.socket.send(raw);
        } catch (e) {
          console.error(`[Room ${this.code}] Broadcast xatoligi:`, e);
        }
      }
    }
  }

  broadcastRoomUpdate() {
    this.broadcast({
      type: MSG.S_ROOM_UPDATE,
      room: {
        code: this.code,
        hostId: this.hostId,
        state: this.state,
        players: this.players.map(p => ({
          id: p.id,
          username: p.username,
          characterId: p.characterId,
          ready: p.ready,
          connected: p.connected,
          mmr: p.mmr
        }))
      }
    });
  }

  isEmpty() {
    return this.players.length === 0;
  }
}

module.exports = Room;
