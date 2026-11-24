// Arena Clash 2D — Mobil va Sensorli Qurilmalar Uchun Virtual Boshqaruv (Touch Controls & Haptics)
class TouchControlsManager {
  constructor() {
    this.enabled = false;
    this.activeTouches = {}; // identifier -> role
    this.touchState = {
      moveX: 0,
      moveY: 0,
      jump: false,
      drop: false,
      attackLight: false,
      attackHeavy: false,
      skill: false,
      dodge: false
    };

    // Sensorli ekran mavjudligini avtomatik aniqlash
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia('(pointer: coarse)').matches);
  }

  init() {
    this.enabled = this.isTouchDevice;
    this.bindTouchEvents();
    this.updateVisibility();
    this.setupAudioUnlock();
  }

  toggle() {
    this.enabled = !this.enabled;
    this.updateVisibility();
    return this.enabled;
  }

  updateVisibility() {
    const overlay = document.getElementById('virtual-touch-controls');
    const touchBtn = document.getElementById('btn-toggle-touch');
    if (overlay) {
      overlay.style.display = this.enabled ? 'flex' : 'none';
    }
    if (touchBtn) {
      touchBtn.textContent = this.enabled ? '📱 Sensor: Yoqiq' : '📱 Sensor: O\'chiq';
      touchBtn.style.color = this.enabled ? 'var(--primary)' : 'var(--text-muted)';
    }
  }

  // Mobil brauzerlarda AudioContext ni birinchi teginishdayoq faollashtirish
  setupAudioUnlock() {
    const unlock = () => {
      if (window.audioManager) {
        window.audioManager.resume();
      }
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
  }

  vibrate(ms = 15) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  bindTouchEvents() {
    // 1. D-PAD / YO'NALISH TUGMALARI
    const dpadButtons = [
      { id: 'btn-touch-left', dir: 'left', moveX: -1, moveY: 0 },
      { id: 'btn-touch-right', dir: 'right', moveX: 1, moveY: 0 },
      { id: 'btn-touch-up', dir: 'up', jump: true },
      { id: 'btn-touch-down', dir: 'down', drop: true }
    ];

    dpadButtons.forEach(btnDef => {
      const el = document.getElementById(btnDef.id);
      if (!el) return;

      const handleStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        this.vibrate(12);

        if (btnDef.moveX !== undefined) this.touchState.moveX = btnDef.moveX;
        if (btnDef.jump) this.touchState.jump = true;
        if (btnDef.drop) this.touchState.drop = true;
      };

      const handleEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');

        if (btnDef.moveX !== undefined && this.touchState.moveX === btnDef.moveX) {
          this.touchState.moveX = 0;
        }
        if (btnDef.jump) this.touchState.jump = false;
        if (btnDef.drop) this.touchState.drop = false;
      };

      el.addEventListener('touchstart', handleStart, { passive: false });
      el.addEventListener('touchend', handleEnd, { passive: false });
      el.addEventListener('touchcancel', handleEnd, { passive: false });

      // Sichqoncha orqali ham sinab ko'rish imkoniyati
      el.addEventListener('mousedown', handleStart);
      el.addEventListener('mouseup', handleEnd);
      el.addEventListener('mouseleave', handleEnd);
    });

    // 2. JANG AMALLARI TUGMALARI (Light, Heavy, Skill, Dodge)
    const actionButtons = [
      { id: 'btn-touch-light', action: 'attackLight' },
      { id: 'btn-touch-heavy', action: 'attackHeavy' },
      { id: 'btn-touch-skill', action: 'skill' },
      { id: 'btn-touch-dodge', action: 'dodge' }
    ];

    actionButtons.forEach(btnDef => {
      const el = document.getElementById(btnDef.id);
      if (!el) return;

      const handleStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        this.vibrate(18);
        this.touchState[btnDef.action] = true;
      };

      const handleEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
        this.touchState[btnDef.action] = false;
      };

      el.addEventListener('touchstart', handleStart, { passive: false });
      el.addEventListener('touchend', handleEnd, { passive: false });
      el.addEventListener('touchcancel', handleEnd, { passive: false });

      el.addEventListener('mousedown', handleStart);
      el.addEventListener('mouseup', handleEnd);
      el.addEventListener('mouseleave', handleEnd);
    });

    // 3. TO'LIQ EKRAN (Fullscreen Toggle)
    const fsBtn = document.getElementById('btn-toggle-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // 4. SENSOR TUGMASI (Touch Toggle)
    const touchBtn = document.getElementById('btn-toggle-touch');
    if (touchBtn) {
      touchBtn.addEventListener('click', () => this.toggle());
    }
  }

  toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
      // Mobil qurilmalarda landshaft (Landscape) rejimiga o'tishga urinish
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  getTouchState() {
    return this.touchState;
  }
}

window.touchControls = new TouchControlsManager();
