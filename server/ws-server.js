// Arena Clash 2D v3.2 — Render WebSocket & HTTP Server
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['*'];

// In-memory xonalar va reyting jadvali
const rooms = new Map();
const waitingPlayers = []; // Tezkor matchmaking navbati
const leaderboard = [
  { name: "Temur_Pro", mmr: 1420, hero: "blaze_knight" },
  { name: "Soya_Uz", mmr: 1385, hero: "shadow_ninja" },
  { name: "Muz_Qori", mmr: 1310, hero: "frost_mage" },
  { name: "Jangchi_01", mmr: 1250, hero: "blaze_knight" },
  { name: "Samarqand_Clash", mmr: 1210, hero: "shadow_ninja" },
];

function isOriginAllowed(origin) {
  if (ALLOWED_ORIGINS.includes('*')) return true;
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

// 1. HTTP Server: Render Cold-Start Pre-Warm (/health)
const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*';
  const corsAllowed = isOriginAllowed(origin);

  // CORS sarlavhalari
  res.setHeader('Access-Control-Allow-Origin', corsAllowed ? origin : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'arena-clash-2d-ws',
      version: '3.2.0',
      uptime: process.uptime(),
      roomsCount: rooms.size,
      timestamp: Date.now()
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// 2. WebSocket Server
const wss = new WebSocketServer({ server });

function send(ws, type, data = {}) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

function broadcastToRoom(room, type, data, excludeWs = null) {
  if (!room) return;
  for (const player of room.players) {
    if (player.ws !== excludeWs) {
      send(player.ws, type, data);
    }
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`Origin rad etildi: ${origin}`);
    ws.close(1008, 'Origin not allowed');
    return;
  }

  let currentRoomId = null;
  let playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  let playerNumber = null;

  // Har 30 soniyada tiriklikni tekshirish
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      const { type } = msg;

      // 1. PING / PONG (RTT o'lchash)
      if (type === 'PING') {
        send(ws, 'PONG', { clientTime: msg.time, serverTime: Date.now() });
        return;
      }

      // 2. CREATE_ROOM
      if (type === 'CREATE_ROOM') {
        const roomId = generateRoomCode();
        playerNumber = 1;
        const room = {
          id: roomId,
          createdAt: Date.now(),
          players: [{ id: playerId, ws, number: 1, hero: msg.hero || 'blaze_knight', ready: false }],
          state: 'waiting',
        };
        rooms.set(roomId, room);
        currentRoomId = roomId;

        send(ws, 'ROOM_CREATED', {
          roomId,
          playerId,
          playerNumber: 1,
        });
        return;
      }

      // 3. JOIN_ROOM
      if (type === 'JOIN_ROOM') {
        const code = (msg.roomId || '').toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          send(ws, 'ERROR', { message: 'Xona topilmadi!' });
          return;
        }

        if (room.players.length >= 2) {
          send(ws, 'ERROR', { message: 'Xona to\'lgan!' });
          return;
        }

        playerNumber = 2;
        currentRoomId = code;
        room.players.push({
          id: playerId,
          ws,
          number: 2,
          hero: msg.hero || 'shadow_ninja',
          ready: false,
        });

        send(ws, 'ROOM_JOINED', {
          roomId: code,
          playerId,
          playerNumber: 2,
          opponentHero: room.players[0].hero,
        });

        // 1-o'yinchiga xabar
        send(room.players[0].ws, 'OPPONENT_JOINED', {
          opponentId: playerId,
          opponentHero: msg.hero || 'shadow_ninja',
        });
        return;
      }

      // 4. QUICK_MATCH
      if (type === 'QUICK_MATCH') {
        // Navbatda kimdir bormi?
        while (waitingPlayers.length > 0) {
          const waiting = waitingPlayers.shift();
          if (waiting.ws.readyState === WebSocket.OPEN) {
            // Yangi xona
            const roomId = generateRoomCode();
            currentRoomId = roomId;
            playerNumber = 2;

            const room = {
              id: roomId,
              createdAt: Date.now(),
              players: [
                waiting,
                { id: playerId, ws, number: 2, hero: msg.hero || 'shadow_ninja', ready: false }
              ],
              state: 'ready',
            };
            rooms.set(roomId, room);

            send(waiting.ws, 'ROOM_JOINED', {
              roomId,
              playerId: waiting.id,
              playerNumber: 1,
              opponentHero: msg.hero || 'shadow_ninja',
            });

            send(ws, 'ROOM_JOINED', {
              roomId,
              playerId,
              playerNumber: 2,
              opponentHero: waiting.hero,
            });
            return;
          }
        }

        // Navbatda hech kim yo'q, kutishga qo'shish
        waitingPlayers.push({
          id: playerId,
          ws,
          number: 1,
          hero: msg.hero || 'blaze_knight',
          ready: false,
        });
        send(ws, 'WAITING_FOR_OPPONENT');
        return;
      }

      // 5. HERO_SELECT & READY
      if (type === 'HERO_SELECT') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (player) {
          player.hero = msg.hero;
          broadcastToRoom(room, 'OPPONENT_HERO_CHANGED', {
            playerNumber: player.number,
            hero: msg.hero,
          }, ws);
        }
        return;
      }

      if (type === 'READY') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (player) {
          player.ready = true;
          broadcastToRoom(room, 'PLAYER_READY', { playerNumber: player.number });

          // Ikkala o'yinchi tayyormi?
          if (room.players.length === 2 && room.players.every(p => p.ready)) {
            room.state = 'playing';
            const seed = Math.floor(Math.random() * 100000);
            broadcastToRoom(room, 'MATCH_START', {
              seed,
              players: room.players.map(p => ({
                id: p.id,
                number: p.number,
                hero: p.hero,
              })),
            });
          }
        }
        return;
      }

      // 6. INPUT_STATE (20-30Hz real-time sinxronizatsiya)
      if (type === 'INPUT_STATE') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room || room.state !== 'playing') return;

        broadcastToRoom(room, 'OPPONENT_INPUT', {
          playerNumber,
          state: msg.state,
          tick: msg.tick,
          timestamp: msg.timestamp,
        }, ws);
        return;
      }

      // 7. MATCH_RESULT
      if (type === 'MATCH_RESULT') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (room) {
          broadcastToRoom(room, 'MATCH_FINISHED', msg);
          rooms.delete(currentRoomId);
        }
        return;
      }

      // 8. LEADERBOARD_GET
      if (type === 'LEADERBOARD_GET') {
        send(ws, 'LEADERBOARD_DATA', { leaderboard });
        return;
      }

    } catch (e) {
      console.error('Xabarni qayta ishlashda xato:', e);
    }
  });

  ws.on('close', () => {
    // Navbatdan o'chirish
    const qIdx = waitingPlayers.findIndex(p => p.ws === ws);
    if (qIdx !== -1) waitingPlayers.splice(qIdx, 1);

    // Xonadan o'chirish
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        broadcastToRoom(room, 'OPPONENT_DISCONNECTED', {
          playerNumber,
        }, ws);
        rooms.delete(currentRoomId);
      }
    }
  });
});

// Ping interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, () => {
  console.log(`Arena Clash 2D WebSocket & HTTP server ishga tushdi: port ${PORT}`);
});
