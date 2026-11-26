// Arena Clash 2D v3.2 — Advanced Web Audio API Synth & Tactical Sound Engine
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.enabled = true;
    this.bgmEnabled = true;
    this.isInitialized = false;

    this.bgmInterval = null;
    this.bgmStep = 0;

    const unlockAudio = () => {
      this.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.startBgmLoop();
    } catch (e) {
      console.warn('Web Audio API xatosi:', e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  setBgmVolume(val) {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  // 1. Procedural Cyberpunk BGM Arpeggio (Zero-Asset)
  startBgmLoop() {
    if (this.bgmInterval) return;
    const bassNotes = [55, 55, 65.4, 49, 55, 55, 73.4, 65.4]; // A1, C2, G1, D2
    const leadNotes = [220, 261.6, 329.6, 392, 440, 523.2];   // A3 minor pentatonic

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      this.bgmStep = (this.bgmStep + 1) % 16;

      // Bassline (har 2 taktda)
      if (this.bgmStep % 2 === 0) {
        const bassFreq = bassNotes[(this.bgmStep / 2) % bassNotes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.24);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 0.24);
      }

      // Arp Lead (har 4 taktda)
      if (this.bgmStep % 4 === 1 && Math.random() < 0.7) {
        const leadFreq = leadNotes[Math.floor(Math.random() * leadNotes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(leadFreq, t);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 0.35);
      }
    }, 180);
  }

  // 2. Qilich va Tig' zarbalari
  playSlash(isHeavy = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = isHeavy ? 0.24 : 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isHeavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isHeavy ? 280 : 440, t);
    osc.frequency.exponentialRampToValueAtTime(isHeavy ? 50 : 80, t + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);

    gain.gain.setValueAtTime(isHeavy ? 0.38 : 0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  // 3. Zarba tekkandagi kuchli akustika
  playHit(isHeavy = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = isHeavy ? 0.28 : 0.15;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeavy ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(isHeavy ? 160 : 220, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + dur);

    gain.gain.setValueAtTime(isHeavy ? 0.5 : 0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  // 4. Mukammal Parry (Oltin chaqnash tovushi)
  playParry() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(1400, t);
    osc1.frequency.exponentialRampToValueAtTime(1900, t + 0.35);
    osc2.frequency.setValueAtTime(2200, t);
    osc2.frequency.exponentialRampToValueAtTime(2800, t + 0.35);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  // 5. Qurollar To'qnashuvi (Clash)
  playClash() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.linearRampToValueAtTime(920, t + 0.15);
    osc.frequency.linearRampToValueAtTime(460, t + 0.45);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // 6. Sakrash / Dodge
  playJump() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playDodge() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(460, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.18);

    gain.gain.setValueAtTime(0.26, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // 7. Elementar Snaryadlar
  playFireball() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.32);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  playIceShard() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, t);
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.18);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // 8. Taktik Cyber Voiceover / Stingerlar (Last Grid TD kabi)
  playTacticalVoice(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    if (type === 'engage') {
      // 3 tonali kibernetik akkord (ARENA ENGAGED)
      [440, 554, 659].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.2, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.28);
      });
    } else if (type === 'warning') {
      // Past chastotali pulsatsiya (WARNING: BOSS / RAGE)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.4);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  }

  // 9. KO Finisher va Powerup
  playKo() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.9);

    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  playPowerup() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // 10. Taktil UI tovushlari
  playClick() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playHover() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }

  playModal(isOpen = true) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (isOpen) {
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.12);
    } else {
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.12);
    }

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }
}

export const audioEngine = new AudioEngine();
