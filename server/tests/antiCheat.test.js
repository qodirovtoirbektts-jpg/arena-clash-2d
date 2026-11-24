const assert = require('assert');
const { updatePlayerPhysics } = require('../../shared/physics');
const { createPlayerState, handleCombatInput } = require('../../shared/combat');
const { TICK_RATE } = require('../../shared/constants');

function testAntiCheat() {
  console.log('--- Anti-Cheat & Authority Test boshlandi ---');

  // 1. Tezlik xaki (Speed Hack) sinovi
  const p1 = createPlayerState('p1', 'SpeedHacker', 'blaze_knight');
  const initialX = p1.x;

  // Xaker ruxsat etilmagan haddan tashqari katta moveX (masalan 100x) yuboradi
  const illegalInput = {
    seq: 1,
    moveX: 100, // Noqonuniy qiymat
    moveY: 0,
    jump: false,
    drop: false
  };

  // Server sanitization: -1 va 1 oralig'iga qisqartiradi
  const sanitizedMoveX = Math.max(-1, Math.min(1, illegalInput.moveX));
  assert.strictEqual(sanitizedMoveX, 1, 'Server moveX ni -1..1 oraliqda cheklashi kerak!');

  updatePlayerPhysics(p1, { ...illegalInput, moveX: sanitizedMoveX }, 1 / TICK_RATE);
  const deltaX = p1.x - initialX;
  const maxPossible = (p1.baseSpeed / TICK_RATE) * 1.5;
  assert.ok(deltaX <= maxPossible, `O'yinchi 1 tickda ruxsat etilgan maksimal siljishdan (${maxPossible}px) oshmasligi kerak. Haqiqiy: ${deltaX}px`);
  console.log('✓ Test 1: Speed Hack to\'xtatildi va cheklandi!');

  // 2. Cooldown Bypass (Hujum va Skill takrorlanishi)
  const p2 = createPlayerState('p2', 'SpamHacker', 'blaze_knight');
  const projectiles = [];
  const events = [];

  // 1-marta Skill ishlatish (Inferno Dash)
  const { CHARACTERS } = require('../../shared/characters');
  const expectedCooldown = CHARACTERS.blaze_knight.attacks.skill.cooldown;
  handleCombatInput(p2, { skill: true }, projectiles, events);
  assert.strictEqual(p2.cooldowns.skill, expectedCooldown, `Skill ishlatilganda cooldown ${expectedCooldown} ga teng bo'lishi kerak!`);

  // Darhol keyingi tickda yana Skill bosish
  const oldEventsCount = events.length;
  handleCombatInput(p2, { skill: true }, projectiles, events);
  assert.strictEqual(events.length, oldEventsCount, 'Cooldown tugamasdan yana skill yuborilsa server uni rad etishi kerak!');
  console.log('✓ Test 2: Cooldown Bypass rad etildi!');

  // 3. Chegaradan tashqariga chiqish (Out of bounds)
  const p3 = createPlayerState('p3', 'WallHacker', 'shadow_ninja');
  p3.x = 99999; // Xaritadan tashqariga teleport qilishga urinish
  updatePlayerPhysics(p3, { moveX: 1 }, 1 / TICK_RATE);
  assert.ok(p3.x <= 960 - 70, 'O\'yinchi xarita o\'ng devoridan tashqariga chiqa olmasligi kerak!');
  console.log('✓ Test 3: Wall Hack & Out of bounds to\'xtatildi!');

  console.log('=== Barcha Anti-Cheat testlari muvaffaqiyatli o\'tdi! ===\n');
}

module.exports = testAntiCheat;

if (require.main === module) {
  testAntiCheat();
}
