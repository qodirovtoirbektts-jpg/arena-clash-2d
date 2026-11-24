const Room = require('./room');

class RoomManager {
  constructor() {
    this.rooms = {}; // code -> Room
    setInterval(() => this.cleanup(), 20000);
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms[code]);
    return code;
  }

  createRoom(hostPlayer) {
    const code = this.generateCode();
    const room = new Room(code, hostPlayer);
    this.rooms[code] = room;
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms[code.toUpperCase()] || null;
  }

  findRoomByPlayerId(playerId) {
    for (const code in this.rooms) {
      const room = this.rooms[code];
      if (room.players.some(p => p.id === playerId)) {
        return room;
      }
    }
    return null;
  }

  cleanup() {
    for (const code in this.rooms) {
      const room = this.rooms[code];
      if (room.isEmpty()) {
        delete this.rooms[code];
      }
    }
  }

  getActiveStats() {
    const totalRooms = Object.keys(this.rooms).length;
    let totalPlayers = 0;
    let inGameRooms = 0;

    for (const code in this.rooms) {
      const r = this.rooms[code];
      totalPlayers += r.players.length;
      if (r.state === 'IN_GAME') inGameRooms++;
    }

    return { totalRooms, totalPlayers, inGameRooms };
  }
}

module.exports = RoomManager;
