// Arena Clash 2D v3.2 — Sensor Boshqaruv (TouchControls.js)
import { inputManager } from '../core/InputManager.js';

export class TouchControls {
  constructor(rootContainer) {
    this.container = rootContainer;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.element = null;
    this.joystick = null;
    this.touchId = null;

    if (this.isTouchDevice) {
      this.init();
    }
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'touch-overlay';
    this.element.className = 'touch-overlay';
    this.element.innerHTML = `
      <div class="touch-joystick-zone" id="joystick-zone">
        <div class="joystick-base" id="joystick-base">
          <div class="joystick-stick" id="joystick-stick"></div>
        </div>
      </div>
      <div class="touch-buttons-zone">
        <button class="t-btn t-btn-switch" data-action="switchWeapon">🔄<br><small>Qurol</small></button>
        <button class="t-btn t-btn-light" data-action="lightAttack">J<br><small>Yengil</small></button>
        <button class="t-btn t-btn-heavy" data-action="heavyAttack">K<br><small>Og'ir</small></button>
        <button class="t-btn t-btn-skill" data-action="skill">L<br><small>Skill</small></button>
        <button class="t-btn t-btn-dodge" data-action="dodge">Dodge</button>
        <button class="t-btn t-btn-jump" data-action="jump">Sakrash</button>
        <button class="t-btn t-btn-block" data-action="block">Parry</button>
      </div>
    `;

    this.container.appendChild(this.element);
    this.setupEvents();
  }

  setupEvents() {
    const zone = this.element.querySelector('#joystick-zone');
    const stick = this.element.querySelector('#joystick-stick');
    const base = this.element.querySelector('#joystick-base');

    let startX = 0, startY = 0;
    const maxRadius = 40;

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.touchId = touch.identifier;
      const rect = base.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          const clampedDist = Math.min(dist, maxRadius);
          const stickX = Math.cos(angle) * clampedDist;
          const stickY = Math.sin(angle) * clampedDist;

          stick.style.transform = `translate(${stickX}px, ${stickY}px)`;

          // Normalize -1..1
          const normX = stickX / maxRadius;
          const normY = stickY / maxRadius;
          inputManager.setTouchJoystick(normX > 0.25 ? 1 : normX < -0.25 ? -1 : 0, normY);
        }
      }
    }, { passive: false });

    const resetJoystick = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.touchId = null;
          stick.style.transform = 'translate(0px, 0px)';
          inputManager.setTouchJoystick(0, 0);
        }
      }
    };

    zone.addEventListener('touchend', resetJoystick);
    zone.addEventListener('touchcancel', resetJoystick);

    // Tugmalar
    const btns = this.element.querySelectorAll('.t-btn');
    btns.forEach(btn => {
      const action = btn.dataset.action;
      const trigger = (pressed) => {
        inputManager.setTouchButton(action, pressed);
        if (pressed && navigator.vibrate) navigator.vibrate(12);
      };

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        trigger(true);
        if (action === 'switchWeapon') {
          setTimeout(() => trigger(false), 80);
        }
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        trigger(false);
      }, { passive: false });
    });
  }
}
