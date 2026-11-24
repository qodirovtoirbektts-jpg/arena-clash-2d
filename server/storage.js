const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const REPLAYS_DIR = path.join(DATA_DIR, 'replays');

// Papkalarni yaratish
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REPLAYS_DIR)) fs.mkdirSync(REPLAYS_DIR, { recursive: true });

class Storage {
  constructor() {
    this.users = {}; // id -> user object
    this.replays = []; // metadata of recorded matches
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        this.users = data.users || {};
        this.replays = data.replays || [];
      } else {
        // Standart test/bot foydalanuvchilar
        this.createUser('Bot_Blaze', 'blaze_knight', 1250);
        this.createUser('ShadowMaster', 'shadow_ninja', 1380);
        this.createUser('FrostQueen', 'frost_mage', 1310);
        this.save();
      }
    } catch (err) {
      console.error('[Storage] Xatolik ma\'lumotlar bazasini yuklashda:', err);
      this.users = {};
      this.replays = [];
    }
  }

  save() {
    try {
      const data = {
        users: this.users,
        replays: this.replays
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[Storage] Xatolik saqlashda:', err);
    }
  }

  createUser(username, favoriteCharacter = 'blaze_knight', initialMmr = 1200) {
    const id = 'usr_' + uuidv4().substring(0, 8);
    const token = uuidv4();
    const user = {
      id,
      username: username || ('Fighter_' + Math.floor(Math.random() * 9000 + 1000)),
      token,
      mmr: initialMmr,
      favoriteCharacter,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        totalDamage: 0
      },
      matchHistory: [],
      createdAt: Date.now()
    };
    this.users[id] = user;
    this.save();
    return user;
  }

  getUserById(id) {
    return this.users[id] || null;
  }

  getUserByToken(token) {
    for (const id in this.users) {
      if (this.users[id].token === token) return this.users[id];
    }
    return null;
  }

  getUserByUsername(username) {
    for (const id in this.users) {
      if (this.users[id].username.toLowerCase() === username.toLowerCase()) {
        return this.users[id];
      }
    }
    return null;
  }

  // Elo reytingini hisoblash
  updateMatchMmr(winnerId, loserId, matchDetails = {}) {
    const winner = this.getUserById(winnerId);
    const loser = this.getUserById(loserId);
    if (!winner || !loser) return { winnerDelta: 0, loserDelta: 0 };

    const K = 32;
    // Expected scores
    const expWinner = 1 / (1 + Math.pow(10, (loser.mmr - winner.mmr) / 400));
    const expLoser = 1 / (1 + Math.pow(10, (winner.mmr - loser.mmr) / 400));

    const winnerDelta = Math.round(K * (1 - expWinner));
    const loserDelta = Math.round(K * (0 - expLoser)); // manfiy qiymat

    winner.mmr += winnerDelta;
    loser.mmr = Math.max(500, loser.mmr + loserDelta);

    winner.stats.matchesPlayed++;
    winner.stats.wins++;
    loser.stats.matchesPlayed++;
    loser.stats.losses++;

    const historyRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      winnerId,
      loserId,
      winnerName: winner.username,
      loserName: loser.username,
      winnerMmrChange: winnerDelta,
      loserMmrChange: loserDelta,
      score: matchDetails.score || '2-0',
      durationSeconds: matchDetails.duration || 60,
      replayId: matchDetails.replayId || null
    };

    winner.matchHistory.unshift(historyRecord);
    loser.matchHistory.unshift(historyRecord);

    if (winner.matchHistory.length > 20) winner.matchHistory.pop();
    if (loser.matchHistory.length > 20) loser.matchHistory.pop();

    this.save();

    return {
      winnerDelta,
      loserDelta,
      winnerMmr: winner.mmr,
      loserMmr: loser.mmr
    };
  }

  getLeaderboard(limit = 10) {
    const list = Object.values(this.users).map(u => ({
      id: u.id,
      username: u.username,
      mmr: u.mmr,
      wins: u.stats.wins,
      losses: u.stats.losses,
      winRate: u.stats.matchesPlayed > 0 ? Math.round((u.stats.wins / u.stats.matchesPlayed) * 100) : 0,
      favoriteCharacter: u.favoriteCharacter
    }));
    list.sort((a, b) => b.mmr - a.mmr);
    return list.slice(0, limit);
  }

  saveReplay(replayData) {
    const replayId = 'rep_' + uuidv4().substring(0, 8);
    const meta = {
      id: replayId,
      date: Date.now(),
      players: replayData.players,
      winnerId: replayData.winnerId,
      totalTicks: replayData.ticks ? replayData.ticks.length : 0,
      duration: replayData.duration || 0
    };

    const filePath = path.join(REPLAYS_DIR, `${replayId}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(replayData), 'utf8');
      this.replays.unshift(meta);
      if (this.replays.length > 30) this.replays.pop();
      this.save();
    } catch (e) {
      console.error('[Storage] Replay saqlashda xatolik:', e);
    }
    return replayId;
  }

  getReplay(replayId) {
    const filePath = path.join(REPLAYS_DIR, `${replayId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

module.exports = new Storage();
