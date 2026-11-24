(function(exports) {
  // Arena O'lchamlari va Tarmoq Konstantalari
  exports.ARENA_WIDTH = 960;
  exports.ARENA_HEIGHT = 540;

  // Server va Tarmoq
  exports.TICK_RATE = 30; // 30 ticks/sek
  exports.TICK_INTERVAL_MS = 1000 / exports.TICK_RATE; // ~33.33ms
  exports.DELTA_TIME = 1 / exports.TICK_RATE; // ~0.0333s
  exports.LAG_COMPENSATION_WINDOW_MS = 250; // 250ms bufer
  exports.RECONNECT_TIMEOUT_MS = 30000; // 30 soniya qayta ulanish oynasi

  // Fizika
  exports.GRAVITY = 1100; // px/s^2
  exports.MAX_FALL_SPEED = 900;
  exports.GROUND_FRICTION = 0.82;
  exports.AIR_FRICTION = 0.95;

  // O'yin rejimlari va qoidalari
  exports.ROUNDS_TO_WIN = 2; // Best of 3
  exports.ROUND_TIME_SECONDS = 60;
  exports.COUNTDOWN_SECONDS = 3;
  exports.RESPAWN_DELAY_SECONDS = 2.0;

  // Platformalar (Xaritadagi joylashuvi)
  exports.PLATFORMS = [
    // Asosiy pol (Ground)
    { id: 'floor', x: 60, y: 470, width: 840, height: 40, oneWay: false },
    // Chap platforma
    { id: 'plat_left', x: 130, y: 350, width: 200, height: 16, oneWay: true },
    // O'ng platforma
    { id: 'plat_right', x: 630, y: 350, width: 200, height: 16, oneWay: true },
    // Markaziy yuqori platforma
    { id: 'plat_mid', x: 380, y: 240, width: 200, height: 16, oneWay: true },
    // Chap va o'ng devorlar
    { id: 'wall_left', x: 40, y: 40, width: 20, height: 470, oneWay: false },
    { id: 'wall_right', x: 900, y: 40, width: 20, height: 470, oneWay: false }
  ];

  // Spawn nuqtalari (2-4 o'yinchilar uchun)
  exports.SPAWN_POINTS = [
    { x: 180, y: 300, facing: 1 },
    { x: 780, y: 300, facing: -1 },
    { x: 260, y: 400, facing: 1 },
    { x: 700, y: 400, facing: -1 }
  ];

  // O'yin holatlari (Match State Machine)
  exports.MATCH_STATE = {
    WAITING: 'WAITING',
    COUNTDOWN: 'COUNTDOWN',
    PLAYING: 'PLAYING',
    ROUND_END: 'ROUND_END',
    MATCH_OVER: 'MATCH_OVER'
  };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.GameConstants = {}));
