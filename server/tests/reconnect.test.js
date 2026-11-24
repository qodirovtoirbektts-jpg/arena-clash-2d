const assert = require('assert');
const Room = require('../room');

function testReconnect() {
  console.log('--- Reconnect Test boshlandi ---');

  const mockSocket1 = { send: () => {}, readyState: 1 };
  const mockSocket2 = { send: () => {}, readyState: 1 };

  const hostPlayer = {
    id: 'p_host',
    username: 'Fighter1',
    characterId: 'blaze_knight',
    sessionToken: 'token_123',
    socket: mockSocket1,
    mmr: 1200
  };

  const guestPlayer = {
    id: 'p_guest',
    username: 'Fighter2',
    characterId: 'frost_mage',
    sessionToken: 'token_456',
    socket: mockSocket2,
    mmr: 1200
  };

  const room = new Room('TEST1', hostPlayer);
  room.addPlayer(guestPlayer);
  assert.strictEqual(room.players.length, 2, 'Xonada 2 ta o\'yinchi bo\'lishi kerak');

  // O'yinni boshlash
  room.setPlayerReady('p_host', true);
  room.setPlayerReady('p_guest', true);
  assert.strictEqual(room.state, 'IN_GAME', 'Xona IN_GAME holatiga o\'tishi kerak');

  // Fighter2 aloqasi uzildi (Disconnection)
  room.handleDisconnect('p_guest');
  const disconnectedGuest = room.players.find(p => p.id === 'p_guest');
  assert.strictEqual(disconnectedGuest.connected, false, 'O\'yinchi connected: false bo\'lishi kerak');
  assert.ok(room.reconnectTimers['p_guest'], '30 soniyalik reconnect taymeri yoqilishi kerak');
  console.log('✓ Test 1: Disconnect muvaffaqiyatli qayd qilindi va taymer yoqildi');

  // Noto'g'ri token bilan qayta ulanish
  const fakeSocket = { send: () => {}, readyState: 1 };
  const failedReconnect = room.handleReconnect('p_guest', 'wrong_token', fakeSocket);
  assert.strictEqual(failedReconnect, false, 'Noto\'g\'ri token bilan ulanish rad etilishi kerak');
  console.log('✓ Test 2: Noto\'g\'ri token rad etildi');

  // To'g'ri token bilan qayta ulanish (Legitimate Reconnect)
  const legitReconnect = room.handleReconnect('p_guest', 'token_456', fakeSocket);
  assert.strictEqual(legitReconnect, true, 'To\'g\'ri token bilan qayta ulanish tasdiqlanishi kerak');
  assert.strictEqual(disconnectedGuest.connected, true, 'O\'yinchi qaytadan connected: true bo\'lishi kerak');
  assert.strictEqual(disconnectedGuest.socket, fakeSocket, 'Yangi socket muvaffaqiyatli biriktirilishi kerak');
  assert.strictEqual(room.reconnectTimers['p_guest'], undefined, 'Reconnect taymeri bekor qilinishi kerak');
  console.log('✓ Test 3: Qayta ulanish va seans tiklanishi muvaffaqiyatli o\'tdi!');

  // Tozalash
  room.resetToLobby();
  console.log('=== Reconnect testlari to\'liq muvaffaqiyatli o\'tdi! ===\n');
}

module.exports = testReconnect;

if (require.main === module) {
  testReconnect();
}
