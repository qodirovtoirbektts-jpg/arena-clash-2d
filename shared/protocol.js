(function(exports) {
  // Paket turlari (Message Types)
  exports.MSG = {
    // Client -> Server
    C_AUTH: 'c_auth',
    C_JOIN_QUEUE: 'c_join_queue',
    C_LEAVE_QUEUE: 'c_leave_queue',
    C_CREATE_ROOM: 'c_create_room',
    C_JOIN_ROOM: 'c_join_room',
    C_LEAVE_ROOM: 'c_leave_room',
    C_READY: 'c_ready',
    C_SELECT_CHAR: 'c_select_char',
    C_INPUT: 'c_input',
    C_RECONNECT: 'c_reconnect',
    C_PING: 'c_ping',

    // Server -> Client
    S_AUTH_OK: 's_auth_ok',
    S_QUEUE_UPDATE: 's_queue_update',
    S_ROOM_UPDATE: 's_room_update',
    S_MATCH_START: 's_match_start',
    S_SNAPSHOT: 's_snapshot',
    S_EVENT: 's_event',
    S_MATCH_RESULT: 's_match_result',
    S_PONG: 's_pong',
    S_ERROR: 's_error',
    S_RECONNECTED: 's_reconnected'
  };

  // Hodisa turlari (Events)
  exports.EVENT_TYPE = {
    HIT: 'hit',
    DAMAGE: 'damage',
    KILL: 'kill',
    RESPAWN: 'respawn',
    DODGE: 'dodge',
    SKILL_CAST: 'skill_cast',
    ROUND_START: 'round_start',
    ROUND_WIN: 'round_win',
    MATCH_WIN: 'match_win'
  };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.GameProtocol = {}));
