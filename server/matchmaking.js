const { MSG } = require('../shared/protocol');

class MatchmakingQueue {
  constructor(roomManager) {
    this.roomManager = roomManager;
    this.queue = []; // [ { player, socket, characterId, joinTime, mmr } ]
    this.checkInterval = setInterval(() => this.processQueue(), 1000);
  }

  add(player, socket, characterId = 'blaze_knight') {
    // Agar allaqachon navbatda bo'lsa
    this.remove(player.id);

    this.queue.push({
      player,
      socket,
      characterId,
      joinTime: Date.now(),
      mmr: player.mmr || 1200
    });

    this.notifyPlayer(socket, true, 0, this.queue.length);
  }

  remove(playerId) {
    const idx = this.queue.findIndex(item => item.player.id === playerId);
    if (idx !== -1) {
      const item = this.queue[idx];
      this.queue.splice(idx, 1);
      this.notifyPlayer(item.socket, false, 0, this.queue.length);
    }
  }

  processQueue() {
    if (this.queue.length < 2) {
      // Navbatdagi o'yinchilarga vaqtni yangilash
      const now = Date.now();
      for (const item of this.queue) {
        const waited = Math.floor((now - item.joinTime) / 1000);
        this.notifyPlayer(item.socket, true, waited, this.queue.length);
      }
      return;
    }

    const now = Date.now();

    // MMR bo'yicha saralash
    this.queue.sort((a, b) => a.mmr - b.mmr);

    for (let i = 0; i < this.queue.length - 1; i++) {
      const p1 = this.queue[i];
      const waitedSec1 = (now - p1.joinTime) / 1000;
      // Kutish vaqti ortgani sari ruxsat etilgan MMR farqi kengayadi (100 + 40/sek)
      const allowedDiff1 = 120 + waitedSec1 * 40;

      for (let j = i + 1; j < this.queue.length; j++) {
        const p2 = this.queue[j];
        const waitedSec2 = (now - p2.joinTime) / 1000;
        const allowedDiff2 = 120 + waitedSec2 * 40;
        const maxAllowed = Math.max(allowedDiff1, allowedDiff2);

        const actualDiff = Math.abs(p1.mmr - p2.mmr);

        if (actualDiff <= maxAllowed) {
          // Mos raqib topildi! Xona yaratish
          const matchedPlayers = [p1, p2];
          this.queue.splice(j, 1);
          this.queue.splice(i, 1);

          this.createMatchedRoom(matchedPlayers);
          return;
        }
      }
    }
  }

  createMatchedRoom(matched) {
    const host = matched[0];
    const guest = matched[1];

    const room = this.roomManager.createRoom({
      id: host.player.id,
      username: host.player.username,
      characterId: host.characterId,
      sessionToken: host.player.token,
      socket: host.socket,
      mmr: host.player.mmr
    });

    room.addPlayer({
      id: guest.player.id,
      username: guest.player.username,
      characterId: guest.characterId,
      sessionToken: guest.player.token,
      socket: guest.socket,
      mmr: guest.player.mmr
    });

    // Avtomatik ready qilib matchni boshlash
    room.setPlayerReady(host.player.id, true);
    room.setPlayerReady(guest.player.id, true);
  }

  notifyPlayer(socket, inQueue, queueTime, playersInQueue) {
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        type: MSG.S_QUEUE_UPDATE,
        inQueue,
        queueTime,
        playersInQueue
      }));
    }
  }
}

module.exports = MatchmakingQueue;
