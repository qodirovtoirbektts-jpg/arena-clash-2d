// Arena Clash 2D v3.2 — Boshqaruv Boshqaruvchisi (InputManager)
export class InputManager {
  constructor() {
    this.keys = new Map();
    this.previousKeys = new Map();

    // Input Buffering (120ms) va Coyote Time (100ms)
    this.BUFFER_WINDOW = 0.12; // 120ms
    this.inputBuffers = {
      p1: new Map(), // action -> timestamp
      p2: new Map(),
    };

    // Virtual Touch Boshqaruvi
    this.touchStates = {
      moveX: 0,
      moveY: 0,
      jump: false,
      drop: false,
      lightAttack: false,
      heavyAttack: false,
      skill: false,
      dodge: false,
      block: false,
      taunt: false,
      switchWeapon: false,
    };

    // Debug rejimi faqat ?debug=1 bo'lganda faollashadi
    this.isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

    // Klaviatura xaritasi (P1 va P2 qat'iy ajratilgan, Space to'qnashuvi yo'q)
    this.keyBindings = {
      p1: {
        moveLeft: ['KeyA'],
        moveRight: ['KeyD'],
        jump: ['KeyW'],             // Qat'iy W — Sakrash
        drop: ['KeyS'],
        lightAttack: ['KeyJ'],
        heavyAttack: ['KeyK'],
        skill: ['KeyL'],
        dodge: ['ShiftLeft', 'ShiftRight'], // Qat'iy Shift — Dodge (Space emas!)
        block: ['KeyU'],
        taunt: ['KeyT'],
        switchWeapon: ['KeyQ'], // 1 ta tugma bilan qurol almashtirish
      },
      p2: {
        moveLeft: ['ArrowLeft'],
        moveRight: ['ArrowRight'],
        jump: ['ArrowUp'],
        drop: ['ArrowDown'],
        lightAttack: ['Numpad1', 'KeyN'],
        heavyAttack: ['Numpad2', 'KeyM'],
        skill: ['Numpad3', 'Comma'],
        dodge: ['Numpad0', 'Period'],
        block: ['Numpad4', 'Slash'],
        taunt: ['Numpad5', 'Semicolon'],
        switchWeapon: ['Numpad7', 'KeyO'],
      },
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  onKeyDown(e) {
    // Agar form inputlarida bo'lsa klaviaturani ushlamaslik
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // F3 faqat ?debug=1 bo'lganda ruxsat etiladi
    if (e.code === 'F3') {
      if (!this.isDebugMode) {
        e.preventDefault();
        return;
      }
    }

    // Default brauzer harakatlarini (Arrow keys, Space sahifani surmasligi uchun) to'xtatish
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    this.keys.set(e.code, true);

    // Input bufferga kiritish
    const now = performance.now() / 1000;
    this.checkAndBufferAction('p1', e.code, now);
    this.checkAndBufferAction('p2', e.code, now);
  }

  onKeyUp(e) {
    this.keys.set(e.code, false);
  }

  checkAndBufferAction(player, code, timestamp) {
    const bindings = this.keyBindings[player];
    for (const [action, keys] of Object.entries(bindings)) {
      if (keys.includes(code)) {
        this.inputBuffers[player].set(action, timestamp);
      }
    }
  }

  // Touch tugma bosilganda bufferga kiritish
  triggerTouchAction(action) {
    const now = performance.now() / 1000;
    this.inputBuffers.p1.set(action, now);
  }

  // Har bir fixed frame boshida chaqiriladi (eski bufferlarni tozalash)
  update() {
    const now = performance.now() / 1000;
    for (const player of ['p1', 'p2']) {
      for (const [action, timestamp] of this.inputBuffers[player].entries()) {
        if (now - timestamp > this.BUFFER_WINDOW) {
          this.inputBuffers[player].delete(action);
        }
      }
    }
  }

  // Buffered harakatni iste'mol qilish (agar mavjud bo'lsa)
  consumeBufferedAction(player, action) {
    const timestamp = this.inputBuffers[player].get(action);
    if (!timestamp) return false;
    const now = performance.now() / 1000;
    if (now - timestamp <= this.BUFFER_WINDOW) {
      this.inputBuffers[player].delete(action);
      return true;
    }
    this.inputBuffers[player].delete(action);
    return false;
  }

  // 1-O'yinchi yoki 2-O'yinchi uchun barcha kiritish holatini olish
  getState(player = 'p1') {
    const bindings = this.keyBindings[player];
    const isP1 = player === 'p1';

    let moveX = 0;
    let moveY = 0;

    const left = bindings.moveLeft.some((k) => this.keys.get(k));
    const right = bindings.moveRight.some((k) => this.keys.get(k));
    const up = bindings.jump.some((k) => this.keys.get(k));
    const down = bindings.drop.some((k) => this.keys.get(k));

    if (left) moveX -= 1;
    if (right) moveX += 1;
    if (up) moveY -= 1;
    if (down) moveY += 1;

    // P1 uchun Virtual Touch qo'shiladi
    if (isP1) {
      if (Math.abs(this.touchStates.moveX) > 0.1) {
        moveX = this.touchStates.moveX;
      }
      if (Math.abs(this.touchStates.moveY) > 0.1) {
        moveY = this.touchStates.moveY;
      }
    }

    return {
      moveX,
      moveY,
      jump: up || (isP1 && this.touchStates.jump),
      drop: down || (isP1 && this.touchStates.drop),
      lightAttack: bindings.lightAttack.some((k) => this.keys.get(k)) || (isP1 && this.touchStates.lightAttack),
      heavyAttack: bindings.heavyAttack.some((k) => this.keys.get(k)) || (isP1 && this.touchStates.heavyAttack),
      skill: bindings.skill.some((k) => this.keys.get(k)) || (isP1 && this.touchStates.skill),
      dodge: bindings.dodge.some((k) => this.keys.get(k)) || (isP1 && this.touchStates.dodge),
      block: bindings.block.some((k) => this.keys.get(k)) || (isP1 && this.touchStates.block),
      taunt: bindings.taunt.some((k) => this.keys.get(k)) || (isP1 && this.touchStates.taunt),
      switchWeapon: (bindings.switchWeapon && bindings.switchWeapon.some((k) => this.keys.get(k))) || (isP1 && this.touchStates.switchWeapon),
    };
  }

  // Virtual joystik kiritishlarini yangilash
  setTouchJoystick(dx, dy) {
    this.touchStates.moveX = dx;
    this.touchStates.moveY = dy;
  }

  // Virtual tugma holatini o'rnatish
  setTouchButton(action, isPressed) {
    if (this.touchStates.hasOwnProperty(action)) {
      this.touchStates[action] = isPressed;
      if (isPressed) {
        this.triggerTouchAction(action);
      }
    }
  }
}

export const inputManager = new InputManager();
