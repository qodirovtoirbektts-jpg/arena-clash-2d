class InputManager {
  constructor() {
    this.keys = {};
    this.seq = 0;
    this.unacknowledgedInputs = [];

    // Tugmalar bosilishi
    window.addEventListener('keydown', (e) => {
      // Input yoki textarea da yozayotgan bo'lsa o'yin tugmalarini ushlamaslik
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  // P1 (Asosiy onlayn va lokal o'yinchi) kirish buyruqlari
  getPlayer1Input(clientTick = 0) {
    this.seq++;

    const touch = window.touchControls ? window.touchControls.getTouchState() : {};

    let moveX = 0;
    if (this.keys['KeyA']) moveX -= 1;
    if (this.keys['KeyD']) moveX += 1;
    if (touch.moveX) moveX = touch.moveX;

    let moveY = 0;
    if (this.keys['KeyW']) moveY -= 1;
    if (this.keys['KeyS']) moveY += 1;
    if (touch.moveY) moveY = touch.moveY;

    const inputData = {
      seq: this.seq,
      tick: clientTick,
      moveX,
      moveY,
      jump: !!this.keys['KeyW'] || !!touch.jump,
      drop: !!this.keys['KeyS'] || !!touch.drop,
      attackLight: !!this.keys['KeyJ'] || !!touch.attackLight,
      attackHeavy: !!this.keys['KeyK'] || !!touch.attackHeavy,
      skill: !!this.keys['KeyL'] || !!touch.skill,
      dodge: !!this.keys['Space'] || !!touch.dodge
    };

    this.unacknowledgedInputs.push(inputData);
    if (this.unacknowledgedInputs.length > 120) {
      this.unacknowledgedInputs.shift();
    }

    return inputData;
  }

  // P2 (Faqat lokal 2-o'yinchi rejimi uchun)
  getPlayer2Input() {
    let moveX = 0;
    if (this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['ArrowRight']) moveX += 1;

    let moveY = 0;
    if (this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['ArrowDown']) moveY += 1;

    return {
      moveX,
      moveY,
      jump: !!this.keys['ArrowUp'],
      drop: !!this.keys['ArrowDown'],
      attackLight: !!(this.keys['Numpad4'] || this.keys['KeyU']),
      attackHeavy: !!(this.keys['Numpad5'] || this.keys['KeyI']),
      skill: !!(this.keys['Numpad6'] || this.keys['KeyO']),
      dodge: !!(this.keys['Numpad0'] || this.keys['ShiftRight'] || this.keys['KeyP'])
    };
  }

  acknowledge(lastProcessedSeq) {
    this.unacknowledgedInputs = this.unacknowledgedInputs.filter(
      inp => inp.seq > lastProcessedSeq
    );
  }

  clear() {
    this.unacknowledgedInputs = [];
    this.seq = 0;
  }
}

window.inputManager = new InputManager();
