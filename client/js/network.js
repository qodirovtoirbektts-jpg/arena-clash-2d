class NetworkManager {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.ping = 0;
    this.pingInterval = null;
    this.onMessageHandlers = {};
    this.serverTick = 0;

    // Session ma'lumotlari
    this.sessionToken = localStorage.getItem('arena_clash_token') || null;
    this.playerId = localStorage.getItem('arena_clash_player_id') || null;
    this.lastRoomCode = localStorage.getItem('arena_clash_room') || null;
  }

  connect(url) {
    let wsUrl = url || localStorage.getItem('arena_clash_server_url');
    if (!wsUrl) {
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        // Agar Vercelda ochilgan bo'lsa, avval localhost:3000 yoki o'z domeniga ulanish
        if (location.hostname.includes('vercel.app')) {
          wsUrl = 'ws://localhost:3000';
        } else {
          wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
        }
      } else {
        wsUrl = 'ws://localhost:3000';
      }
    }

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err) {
      console.warn('[Network] WebSocket ochilmadi:', err);
      const pingEl = document.getElementById('ping-display');
      if (pingEl) pingEl.textContent = '📴 Offline / Bot';
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      console.log('[Network] Serverga ulandi:', wsUrl);
      const pingEl = document.getElementById('ping-display');
      if (pingEl) pingEl.textContent = '📶 0 ms';
      this.startPing();

      // Agar oldingi seans bo'lsa, avtomatik qayta ulanishga urinish
      if (this.sessionToken && this.playerId) {
        if (this.lastRoomCode) {
          this.reconnect(this.lastRoomCode);
        } else {
          this.auth();
        }
      } else {
        this.auth();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('[Network] Xabarni o\'qishda xatolik:', e);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.stopPing();
      const pingEl = document.getElementById('ping-display');
      if (pingEl) pingEl.textContent = '📴 Offline / Lokal';
      // Faqat serverda ishlayotgan bo'lsa qayta ulanishga urinish
      if (!location.hostname.includes('vercel.app')) {
        setTimeout(() => this.connect(wsUrl), 3000);
      }
    };

    this.ws.onerror = (err) => {
      const pingEl = document.getElementById('ping-display');
      if (pingEl) pingEl.textContent = '📴 Offline / Lokal';
    };
  }

  on(type, handler) {
    if (!this.onMessageHandlers[type]) this.onMessageHandlers[type] = [];
    this.onMessageHandlers[type].push(handler);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.connected) {
        this.send({
          type: window.GameProtocol.MSG.C_PING,
          clientTime: Date.now()
        });
      }
    }, 1200);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  handleMessage(msg) {
    const { MSG } = window.GameProtocol;

    if (msg.type === MSG.S_PONG) {
      this.ping = Math.round(Date.now() - msg.clientTime);
      return;
    }

    if (msg.type === MSG.S_AUTH_OK) {
      this.sessionToken = msg.user.token;
      this.playerId = msg.user.id;
      localStorage.setItem('arena_clash_token', this.sessionToken);
      localStorage.setItem('arena_clash_player_id', this.playerId);
    }

    if (msg.type === MSG.S_SNAPSHOT) {
      this.serverTick = msg.tick;
    }

    const handlers = this.onMessageHandlers[msg.type];
    if (handlers) {
      for (const h of handlers) h(msg);
    }
  }

  auth(username, favoriteCharacter) {
    this.send({
      type: window.GameProtocol.MSG.C_AUTH,
      token: this.sessionToken,
      username: username || localStorage.getItem('arena_clash_username') || null,
      favoriteCharacter
    });
  }

  reconnect(roomCode) {
    this.send({
      type: window.GameProtocol.MSG.C_RECONNECT,
      roomCode: roomCode || this.lastRoomCode,
      playerId: this.playerId,
      sessionToken: this.sessionToken
    });
  }

  joinQueue(characterId) {
    this.send({
      type: window.GameProtocol.MSG.C_JOIN_QUEUE,
      characterId
    });
  }

  leaveQueue() {
    this.send({
      type: window.GameProtocol.MSG.C_LEAVE_QUEUE
    });
  }

  createRoom(characterId) {
    this.send({
      type: window.GameProtocol.MSG.C_CREATE_ROOM,
      characterId
    });
  }

  joinRoom(roomCode, characterId) {
    this.lastRoomCode = roomCode;
    localStorage.setItem('arena_clash_room', roomCode);
    this.send({
      type: window.GameProtocol.MSG.C_JOIN_ROOM,
      roomCode,
      characterId
    });
  }

  leaveRoom() {
    this.lastRoomCode = null;
    localStorage.removeItem('arena_clash_room');
    this.send({
      type: window.GameProtocol.MSG.C_LEAVE_ROOM
    });
  }

  setReady(ready) {
    this.send({
      type: window.GameProtocol.MSG.C_READY,
      ready
    });
  }

  selectCharacter(characterId) {
    this.send({
      type: window.GameProtocol.MSG.C_SELECT_CHAR,
      characterId
    });
  }

  sendInput(inputData) {
    this.send({
      type: window.GameProtocol.MSG.C_INPUT,
      ...inputData
    });
  }
}

window.networkManager = new NetworkManager();
