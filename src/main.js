// Arena Clash 2D v3.2 — Asosiy O'yin Boshqaruvchisi (main.js)
import { GameLoop } from './core/GameLoop.js';
import { inputManager } from './core/InputManager.js';
import { settingsManager } from './core/SettingsManager.js';
import { audioEngine } from './core/AudioEngine.js';
import { Camera } from './core/Camera.js';
import { ParticleSystem } from './render/ParticleSystem.js';
import { ArenaRenderer } from './render/ArenaRenderer.js';
import { FighterRenderer } from './render/FighterRenderer.js';
import { Fighter } from './entities/Fighter.js';
import { BotAI } from './entities/BotAI.js';
import { Projectile } from './entities/Projectile.js';
import { ArenaObjects } from './entities/ArenaObjects.js';
import { HUD } from './ui/HUD.js';
import { MenuManager } from './ui/MenuManager.js';
import { TouchControls } from './ui/TouchControls.js';
import { uz } from './i18n/uz.js';

// Canvas va Render o'lchamlari
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiRoot = document.getElementById('ui-root');

const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;

// Asosiy tizimlar
const camera = new Camera(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
const particleSystem = new ParticleSystem(250);
const arenaRenderer = new ArenaRenderer();
const fighterRenderer = new FighterRenderer();
const arenaObjects = new ArenaObjects();
const hud = new HUD(uiRoot); // Live Comms, Mini-Radar, Toast Stack
const botAI = new BotAI('medium');
const attractBot1 = new BotAI('hard');
const attractBot2 = new BotAI('hard');

// O'yin holati
let matchState = 'attract'; // 'attract' | 'round_start' | 'playing' | 'round_end' | 'match_over'
let currentMode = 'vsBot';
let round = 1;
let roundTime = 90;
let roundEndTimer = 0;
let isAnimeKo = false;
let animeKoTimer = 0;

let p1 = new Fighter('p1', 'Player 1', 'blaze_knight', 380, 1);
let p2 = new Fighter('p2', 'Gladiator AI', 'shadow_ninja', 900, -1);
let projectiles = [];
projectiles.ProjectileClass = Projectile;

// Jangni boshlash
function startMatch(mode, heroP1, heroP2) {
  currentMode = mode;
  round = 1;
  hud.round = 1;
  hud.p1Wins = 0;
  hud.p2Wins = 0;

  p1 = new Fighter('p1', mode === 'localP2' ? '1-O\'YINCHI' : 'SIZ', heroP1, 380, 1);
  p2 = new Fighter('p2', mode === 'localP2' ? '2-O\'YINCHI' : 'AI GLADIATOR', heroP2, 900, -1);
  projectiles = [];
  projectiles.ProjectileClass = Projectile;

  hud.addToast('DUEL BOSHLANDI // ARENA ENGAGED', 'gold');
  startRound();
}

function startRound() {
  matchState = 'round_start';
  roundTime = 90;
  isAnimeKo = false;
  animeKoTimer = 0;

  p1.hp = p1.maxHp;
  p1.ghostHp = p1.maxHp;
  p1.stamina = p1.maxStamina;
  p1.x = 380;
  p1.y = 520;
  p1.vx = 0;
  p1.vy = 0;
  p1.facing = 1;
  p1.state = 'idle';

  p2.hp = p2.maxHp;
  p2.ghostHp = p2.maxHp;
  p2.stamina = p2.maxStamina;
  p2.x = 900;
  p2.y = 520;
  p2.vx = 0;
  p2.vy = 0;
  p2.facing = -1;
  p2.state = 'idle';

  projectiles = [];
  projectiles.ProjectileClass = Projectile;

  hud.showBanner(`RAUND ${round} — JANG!`, 1.8);
  hud.setCommsMessage(`RAUND ${round} // JANG HARAKATLARI BOSHLANDI`);

  setTimeout(() => {
    if (matchState === 'round_start') {
      matchState = 'playing';
    }
  }, 1200);
}

function onRoundWon(winner, loser) {
  if (matchState !== 'playing') return;
  matchState = 'round_end';
  roundEndTimer = 2.5;

  if (winner.id === 'p1') hud.p1Wins++;
  else hud.p2Wins++;

  // Dramatik KO
  isAnimeKo = true;
  animeKoTimer = 0.55;
  camera.triggerKo(loser);
  camera.triggerShake(20);
  audioEngine.playKo();
  loop.setTimeScale(0.2, 0.9);

  const victoryText = winner.id === 'p1' ? "SIZ G'ALABA QOZONDINGIZ!" : `${winner.name} G'ALABA QOZONDI!`;
  hud.showBanner(victoryText, 2.2, 'hazard');
  hud.setCommsMessage(`K.O. QAYD ETILDI // ${victoryText}`);
  hud.addToast(`K.O. FINISHER // ${victoryText}`, 'crimson');
}

// Fixed Update sikli (60Hz)
function onUpdate(dt) {
  inputManager.update();
  camera.update(dt, p1, p2);
  particleSystem.update(dt);
  arenaRenderer.update(dt);
  arenaObjects.update(dt, particleSystem);
  hud.update(dt, p1, p2);

  if (animeKoTimer > 0) {
    animeKoTimer -= dt;
    if (animeKoTimer <= 0) isAnimeKo = false;
  }

  // 1. Attract Mode (Bosh menyuda 2 ta bot jangi)
  if (matchState === 'attract') {
    const b1Input = attractBot1.update(dt, p1, p2, arenaObjects, projectiles);
    const b2Input = attractBot2.update(dt, p2, p1, arenaObjects, projectiles);

    p1.update(dt, b1Input, arenaObjects, projectiles, audioEngine, particleSystem);
    p2.update(dt, b2Input, arenaObjects, projectiles, audioEngine, particleSystem);

    checkCombat(p1, p2);
    checkCombat(p2, p1);
    updateProjectiles(dt);

    if (p1.isDead || p2.isDead) {
      p1.hp = p1.maxHp;
      p2.hp = p2.maxHp;
    }
    return;
  }

  // 2. Raund davomida jang
  if (matchState === 'playing') {
    roundTime -= dt;
    if (roundTime <= 0) {
      const winner = p1.hp >= p2.hp ? p1 : p2;
      const loser = winner === p1 ? p2 : p1;
      onRoundWon(winner, loser);
      return;
    }

    const p1Input = inputManager.getState('p1');
    let p2Input;
    if (currentMode === 'vsBot') {
      p2Input = botAI.update(dt, p2, p1, arenaObjects, projectiles);
    } else {
      p2Input = inputManager.getState('p2');
    }

    p1.update(dt, p1Input, arenaObjects, projectiles, audioEngine, particleSystem);
    p2.update(dt, p2Input, arenaObjects, projectiles, audioEngine, particleSystem);

    arenaObjects.checkPowerupPickup(p1, particleSystem);
    arenaObjects.checkPowerupPickup(p2, particleSystem);

    // Hujum to'qnashuvlari
    checkCombat(p1, p2);
    checkCombat(p2, p1);

    updateProjectiles(dt);

    // KO tekshiruvi
    if (p1.isDead) {
      onRoundWon(p2, p1);
    } else if (p2.isDead) {
      onRoundWon(p1, p2);
    }
    return;
  }

  // 3. Raund oxiri
  if (matchState === 'round_end') {
    roundEndTimer -= dt;
    p1.update(dt, null, arenaObjects, projectiles, audioEngine, particleSystem);
    p2.update(dt, null, arenaObjects, projectiles, audioEngine, particleSystem);

    if (roundEndTimer <= 0) {
      if (hud.p1Wins >= 2 || hud.p2Wins >= 2) {
        matchState = 'match_over';
        const matchWinner = hud.p1Wins >= 2 ? p1 : p2;
        menuManager.showMvp(matchWinner, {
          maxCombo: Math.max(p1.maxComboInMatch, 3),
          parryCount: p1.parryCount,
          totalDamage: p1.totalDamageDealt,
          accuracy: p1.totalAttacksFired > 0 ? Math.round((p1.hitsLanded / p1.totalAttacksFired) * 100) : 85,
        }, () => {
          startMatch(currentMode, p1.heroId, p2.heroId);
        });
      } else {
        round++;
        hud.round = round;
        startRound();
      }
    }
  }
}

// Zarba va To'qnashuv mantiqi
function checkCombat(attacker, defender) {
  if (!attacker.isAttacking || defender.isDead || defender.isInvulnerable) return;

  const hitbox = attacker.getHitbox();
  if (!hitbox) return;

  const hurtbox = defender.getHurtbox();

  // AABB to'qnashuvi
  if (
    hitbox.x < hurtbox.x + hurtbox.width &&
    hitbox.x + hitbox.width > hurtbox.x &&
    hitbox.y < hurtbox.y + hurtbox.height &&
    hitbox.y + hitbox.height > hurtbox.y
  ) {
    let dmg = 10;
    let kx = 180;
    let ky = -90;

    if (attacker.state === 'attack_light') {
      dmg = attacker.comboStep === 3 ? 15 : 10;
    } else if (attacker.state === 'attack_heavy') {
      dmg = 22;
      kx = 380;
      ky = -220;
    } else if (attacker.state === 'skill') {
      dmg = attacker.heroConfig.combat.skill.damage || 28;
      kx = 420;
      ky = -240;
    }

    if (attacker.damageBuffTimer > 0) dmg *= 1.25;
    if (attacker.isAwakened) dmg *= 1.15;

    // Qurollar to'qnashuvi (Clash) tekshiruvi
    if (defender.isAttacking && (attacker.state === 'attack_heavy' || attacker.state === 'skill') && (defender.state === 'attack_heavy' || defender.state === 'skill')) {
      loop.setTimeScale(0.25, 1.2);
      camera.triggerShake(16);
      audioEngine.playClash();
      particleSystem.emit('spark', (attacker.x + defender.x) / 2, attacker.y - 40, 28, { color: '#ffd166', speed: 280 });
      hud.addToast('QUROLLAR TO\'QNASHUVI (WEAPON CLASH)!', 'gold');
      hud.setCommsMessage('TACTICAL ALERT // QUROLLAR TO\'QNASHUVI YUZ BERDI');
      attacker.vx = -attacker.facing * 160;
      defender.vx = -defender.facing * 160;
      return;
    }

    const hitResult = defender.takeDamage(dmg, kx, ky, attacker);

    if (hitResult === 'parry') {
      loop.triggerHitstop(0.08);
      camera.triggerShake(12);
      audioEngine.playParry();
      particleSystem.emit('spark', defender.x + defender.facing * 20, defender.y - 40, 24, { color: '#ffd166', speed: 280 });
      particleSystem.addDamageText(defender.x, defender.y - 60, 'MUKAMMAL PARRY!', '#ffd166', true);
      hud.addToast('MUKAMMAL PARRY MUVAFFAQ QILINDI!', 'gold');
      hud.setCommsMessage(`${defender.name}: MUKAMMAL PARRY MUVAFFAQ QILINDI`);
    } else if (hitResult === true) {
      attacker.hitsLanded++;
      attacker.totalDamageDealt += dmg;
      attacker.currentComboCount++;
      attacker.maxComboInMatch = Math.max(attacker.maxComboInMatch, attacker.currentComboCount);

      loop.triggerHitstop(attacker.state === 'attack_heavy' ? 0.07 : 0.04);
      camera.triggerShake(attacker.state === 'attack_heavy' ? 14 : 7);
      audioEngine.playHit(attacker.state === 'attack_heavy');

      // Zamin Decali (Zarba izi)
      const decalType = attacker.heroConfig.element === 'fire' ? 'scorch' : attacker.heroConfig.element === 'frost' ? 'frost' : 'shadow';
      arenaRenderer.addDecal(decalType, defender.x);

      particleSystem.emit('spark', defender.x, defender.y - 40, 14, {
        color: attacker.heroConfig.palette.accent,
        speed: 200,
      });
      particleSystem.addDamageText(defender.x, defender.y - 40, Math.round(dmg), '#ff2e54', attacker.state === 'attack_heavy');

      // Kombo Toast
      if (attacker.currentComboCount === 3 || attacker.currentComboCount === 5 || attacker.currentComboCount === 8) {
        hud.addToast(`[STREAK] ${attacker.currentComboCount}x COMBO RAMPAGE!`, 'violet');
        hud.setCommsMessage(`${attacker.name}: ${attacker.currentComboCount}x KOMBO ZARBA BERILMOQDA`);
      }
    }
  }
}

// Snaryadlar harakati va to'qnashuvlari
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.update(dt, particleSystem);

    if (!proj.isActive) {
      projectiles.splice(i, 1);
      continue;
    }

    const target = proj.ownerId === 'p1' ? p2 : p1;
    if (proj.checkHit(target)) {
      const hitRes = target.takeDamage(proj.damage, 140, -80);
      if (hitRes === 'parry') {
        audioEngine.playParry();
      } else {
        audioEngine.playHit(false);
        arenaRenderer.addDecal(proj.element === 'frost' ? 'frost' : 'shadow', target.x);
        particleSystem.emit('spark', target.x, target.y - 35, 14, { color: '#00e5ff', speed: 180 });
        particleSystem.addDamageText(target.x, target.y - 40, proj.damage, '#00e5ff');
      }
      projectiles.splice(i, 1);
    }
  }
}

// Render Sikli
function onRender(alpha) {
  ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // 1. Kamera transformatsiyasini qo'llash
  camera.apply(ctx);

  // 2. Arena foni
  arenaRenderer.render(ctx, camera, arenaObjects);

  // 3. Snaryadlar
  for (const proj of projectiles) {
    proj.render(ctx);
  }

  // 4. Jangchilar
  fighterRenderer.render(ctx, p1, isAnimeKo);
  fighterRenderer.render(ctx, p2, isAnimeKo);

  // 5. Zarralar
  particleSystem.render(ctx);

  camera.restore(ctx);

  // 6. HUD (Kameradan tashqari ekranda qat'iy)
  if (matchState !== 'attract') {
    hud.render(ctx, p1, p2, roundTime);
  }
}

// Boshqaruv va Menyularni yuklash
const menuManager = new MenuManager(uiRoot, (mode, hero1, hero2) => {
  startMatch(mode, hero1, hero2);
});

const touchControls = new TouchControls(uiRoot);

// Game Loop ni ishga tushirish
const loop = new GameLoop(onUpdate, onRender);
loop.start();

console.log(`${uz.appName} v3.2 — Cyber-Tactical Arena to'liq ishga tushirildi!`);
