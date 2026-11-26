// Arena Clash 2D v3.2 — Asosiy Kirish Nuqtasi (main.js)
import { GameLoop } from './core/GameLoop.js';
import { inputManager } from './core/InputManager.js';
import { settingsManager } from './core/SettingsManager.js';
import { HEROES_CONFIG, GAMEPLAY_CONFIG } from './entities/heroes.config.js';
import { uz } from './i18n/uz.js';

console.log(`${uz.appName} v3.2 yuklanmoqda... (Til: O'zbekcha)`);

// Canvas va Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fixed o'lcham
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;

// O'yin holati
const gameState = {
  phase: 1,
  mode: 'vsBot',
  heroP1: 'blaze_knight',
  heroP2: 'shadow_ninja',
  isAttractMode: true,
};

// Fizika yangilanishi (60Hz)
function onUpdate(dt) {
  inputManager.update();
  const p1Input = inputManager.getState('p1');
  const p2Input = inputManager.getState('p2');

  // Input buffering va debug holatini tekshirish
  if (inputManager.isDebugMode && Math.random() < 0.01) {
    // console.log('P1 Input:', p1Input);
  }
}

// Render interpolatsiyasi
function onRender(alpha) {
  ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // Orqa fon (Dark Semi-Realism)
  const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
  grad.addColorStop(0, '#0c0e14');
  grad.addColorStop(0.7, '#181b24');
  grad.addColorStop(1, '#251a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // Pol/Arena sathi
  ctx.fillStyle = '#222634';
  ctx.fillRect(0, GAMEPLAY_CONFIG.groundY, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GAMEPLAY_CONFIG.groundY);
  ctx.fillStyle = '#FF5A1F';
  ctx.fillRect(0, GAMEPLAY_CONFIG.groundY, VIRTUAL_WIDTH, 4);

  // Phase 1 tayyorlik ko'rinishi
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(uz.appName, VIRTUAL_WIDTH / 2, 280);

  ctx.fillStyle = '#FF5A1F';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(uz.tagline, VIRTUAL_WIDTH / 2, 320);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '16px monospace';
  ctx.fillText(`60Hz Fixed-Timestep Loop • ${loop.fps} FPS`, VIRTUAL_WIDTH / 2, 360);

  if (inputManager.isDebugMode) {
    ctx.fillStyle = '#10B981';
    ctx.fillText('DEBUG REJIMI FAOLLASHTIRILGAN (?debug=1)', VIRTUAL_WIDTH / 2, 400);
  }

  ctx.restore();
}

// GameLoop ni ishga tushirish
const loop = new GameLoop(onUpdate, onRender);
loop.start();

console.log(`${uz.appName} v3.2 Phase 1 poydevori muvaffaqiyatli ishga tushirildi!`);
