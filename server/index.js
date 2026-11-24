const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');

const { MSG } = require('../shared/protocol');
const auth = require('./auth');
const storage = require('./storage');
const RoomManager = require('./roomManager');
const MatchmakingQueue = require('./matchmaking');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Statik fayllarni ulash
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));

// REST API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    stats: roomManager.getActiveStats()
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(storage.getLeaderboard(15));
});

app.get('/api/profile/:id', (req, res) => {
  const profile = auth.getProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profil topilmadi' });
  res.json(profile);
});

app.get('/api/replays', (req, res) => {
  res.json(storage.replays);
});

app.get('/api/replays/:id', (req, res) => {
  const replay = storage.getReplay(req.params.id);
  if (!replay) return res.status(404).json({ error: 'Replay topilmadi' });
  res.json(replay);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const roomManager = new RoomManager();
const matchmaking = new MatchmakingQueue(roomManager);

// WebSocket ulanishlar
wss.on('connection', (ws) => {
  let playerUser = null;
  let currentRoom = null;

  const send = (msgObj) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(msgObj));
    }
  };

  ws.on('message', (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw);

      switch (msg.type) {
        // 1. PING (Latency tekshirish)
        case MSG.C_PING:
          send({
            type: MSG.S_PONG,
            clientTime: msg.clientTime,
            serverTime: Date.now()
          });
          break;

        // 2. AUTHENTICATION
        case MSG.C_AUTH:
          playerUser = auth.authenticate({
            token: msg.token,
            username: msg.username,
            favoriteCharacter: msg.favoriteCharacter
          });
          send({
            type: MSG.S_AUTH_OK,
            user: playerUser
          });
          break;

        // 3. MATCHMAKING
        case MSG.C_JOIN_QUEUE:
          if (!playerUser) return send({ type: MSG.S_ERROR, message: 'Avval avtorizatsiyadan o\'ting!' });
          if (currentRoom) {
            currentRoom.removePlayer(playerUser.id);
            currentRoom = null;
          }
          matchmaking.add(playerUser, ws, msg.characterId || playerUser.favoriteCharacter);
          break;

        case MSG.C_LEAVE_QUEUE:
          if (playerUser) {
            matchmaking.remove(playerUser.id);
          }
          break;

        // 4. CUSTOM ROOM YARATISH (Do'stlar bilan o'ynash)
        case MSG.C_CREATE_ROOM:
          if (!playerUser) return send({ type: MSG.S_ERROR, message: 'Avtorizatsiyadan o\'ting!' });
          matchmaking.remove(playerUser.id);
          if (currentRoom) currentRoom.removePlayer(playerUser.id);

          currentRoom = roomManager.createRoom({
            id: playerUser.id,
            username: playerUser.username,
            characterId: msg.characterId || playerUser.favoriteCharacter,
            sessionToken: playerUser.token,
            socket: ws,
            mmr: playerUser.mmr
          });
          break;

        // 5. CUSTOM ROOMGA QO'SHILISH
        case MSG.C_JOIN_ROOM:
          if (!playerUser) return send({ type: MSG.S_ERROR, message: 'Avtorizatsiyadan o\'ting!' });
          matchmaking.remove(playerUser.id);
          const targetRoom = roomManager.getRoom(msg.roomCode);
          if (!targetRoom) {
            return send({ type: MSG.S_ERROR, message: 'Bunday kodli xona topilmadi!' });
          }
          if (targetRoom.state !== 'LOBBY') {
            return send({ type: MSG.S_ERROR, message: 'Ushbu xonada o\'yin allaqachon boshlangan!' });
          }
          if (targetRoom.players.length >= targetRoom.maxPlayers) {
            return send({ type: MSG.S_ERROR, message: 'Xona to\'lgan (maksimal 4 o\'yinchi)!' });
          }

          if (currentRoom) currentRoom.removePlayer(playerUser.id);
          currentRoom = targetRoom;
          currentRoom.addPlayer({
            id: playerUser.id,
            username: playerUser.username,
            characterId: msg.characterId || playerUser.favoriteCharacter,
            sessionToken: playerUser.token,
            socket: ws,
            mmr: playerUser.mmr
          });
          break;

        // 6. XONADAN CHIQISH
        case MSG.C_LEAVE_ROOM:
          if (currentRoom && playerUser) {
            currentRoom.removePlayer(playerUser.id);
            currentRoom = null;
          }
          break;

        // 7. READY HOLATI
        case MSG.C_READY:
          if (currentRoom && playerUser) {
            currentRoom.setPlayerReady(playerUser.id, msg.ready);
          }
          break;

        // 8. QAHRAMONNI TANLASH
        case MSG.C_SELECT_CHAR:
          if (playerUser) {
            playerUser.favoriteCharacter = msg.characterId;
            if (currentRoom) {
              currentRoom.selectCharacter(playerUser.id, msg.characterId);
            }
          }
          break;

        // 9. REALTIME INPUT (Server-Authoritative Game Loop)
        case MSG.C_INPUT:
          if (currentRoom && currentRoom.engine && playerUser) {
            currentRoom.engine.queueInput(playerUser.id, msg);
          }
          break;

        // 10. RECONNECT (Uzilgan o'yinchi qayta ulanishi)
        case MSG.C_RECONNECT:
          const existingRoom = roomManager.getRoom(msg.roomCode) || roomManager.findRoomByPlayerId(msg.playerId);
          if (existingRoom) {
            const reconnected = existingRoom.handleReconnect(msg.playerId, msg.sessionToken, ws);
            if (reconnected) {
              currentRoom = existingRoom;
              playerUser = auth.getProfile(msg.playerId);
              if (playerUser) playerUser.token = msg.sessionToken;
              console.log(`[Server] O'yinchi ${msg.playerId} xona ${existingRoom.code} ga qayta ulandi!`);
            } else {
              send({ type: MSG.S_ERROR, message: 'Qayta ulanish tokeni noto\'g\'ri yoki muddati tugagan!' });
            }
          } else {
            send({ type: MSG.S_ERROR, message: 'Xona allaqachon yopilgan.' });
          }
          break;
      }
    } catch (err) {
      console.error('[WebSocket] Xabarni o\'qishda xatolik:', err);
    }
  });

  ws.on('close', () => {
    if (playerUser) {
      matchmaking.remove(playerUser.id);
      if (currentRoom) {
        currentRoom.handleDisconnect(playerUser.id);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Arena Clash 2D Server ishga tushdi!          `);
  console.log(`  URL: http://localhost:${PORT}                 `);
  console.log(`  Tick Rate: 30 Hz | Server-Authoritative       `);
  console.log(`===============================================`);
});

module.exports = { server, app, roomManager, matchmaking };
