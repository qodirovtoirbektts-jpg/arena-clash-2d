const storage = require('./storage');

class AuthManager {
  authenticate({ token, username, favoriteCharacter }) {
    let user = null;

    if (token) {
      user = storage.getUserByToken(token);
    }

    if (!user && username) {
      user = storage.getUserByUsername(username);
    }

    if (!user) {
      user = storage.createUser(username, favoriteCharacter || 'blaze_knight');
    } else if (favoriteCharacter) {
      user.favoriteCharacter = favoriteCharacter;
      storage.save();
    }

    return {
      id: user.id,
      username: user.username,
      token: user.token,
      mmr: user.mmr,
      favoriteCharacter: user.favoriteCharacter,
      stats: user.stats,
      matchHistory: user.matchHistory.slice(0, 10)
    };
  }

  getProfile(userId) {
    const user = storage.getUserById(userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      mmr: user.mmr,
      favoriteCharacter: user.favoriteCharacter,
      stats: user.stats,
      matchHistory: user.matchHistory
    };
  }
}

module.exports = new AuthManager();
