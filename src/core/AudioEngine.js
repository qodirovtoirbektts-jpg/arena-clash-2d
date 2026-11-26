// Arena Clash 2D v3.2 — Multi-Layered Arcade Studio Audio Engine (Handcrafted SFX)
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
      this.sfxGain.gain.setValueAtTime(0.95, this.ctx.currentTime);
      this.bgmGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.startStudioBgm();
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

  // Shovqin buferini (Noise Buffer) yaratish — havo, shamol va zarba qisirlashi uchun
  createNoiseBuffer(duration = 0.2) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Ko'p Qatlamli Qilich Shamoli va Zarbi (Multi-Layer Slash)
  playSlash(isHeavy = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = isHeavy ? 0.22 : 0.12;

    // Qatlam 1: Havoni kesish shovqini (Noise whoosh)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(dur);
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(isHeavy ? 900 : 1600, t);
    nFilter.frequency.exponentialRampToValueAtTime(isHeavy ? 200 : 400, t + dur);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.22, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(t);

    // Qatlam 2: Metall rezonans (Blade tonal ring)
    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isHeavy ? 320 : 540, t);
    osc.frequency.exponentialRampToValueAtTime(isHeavy ? 70 : 120, t + dur);

    oGain.gain.setValueAtTime(isHeavy ? 0.25 : 0.15, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(oGain);
    oGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  // 2. Kuchli Taktil Zarba (Multi-Layer Impact Crunch & Sub-Bass Thump)
  playHit(isHeavy = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = isHeavy ? 0.28 : 0.16;

    // Qatlam 1: Sub-bass zarbi (45-120Hz kick)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isHeavy ? 140 : 180, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + dur);

    subGain.gain.setValueAtTime(isHeavy ? 0.6 : 0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + dur);

    // Qatlam 2: Zirh qisirlashi (Crunch transient)
    const crunch = this.ctx.createBufferSource();
    crunch.buffer = this.createNoiseBuffer(0.08);
    const cFilter = this.ctx.createBiquadFilter();
    cFilter.type = 'lowpass';
    cFilter.frequency.setValueAtTime(1400, t);

    const cGain = this.ctx.createGain();
    cGain.gain.setValueAtTime(isHeavy ? 0.35 : 0.2, t);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    crunch.connect(cFilter);
    cFilter.connect(cGain);
    cGain.connect(this.sfxGain);
    crunch.start(t);
  }

  // 3. Mukammal Parry (Harmonic Crystal Ring)
  playParry() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const freqs = [1568, 2093, 3136]; // G6, C7, G7 akkordi
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.05, t + 0.45);

      gain.gain.setValueAtTime(0.25 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // 4. Qurollar To'qnashuvi (Weapon Clash Explosion & Sparks)
  playClash() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Metall ishqalanishi
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.linearRampToValueAtTime(940, t + 0.15);
    osc.frequency.linearRampToValueAtTime(320, t + 0.5);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);

    // Kuchli zarba to'lqini
    this.playHit(true);
  }

  // 5. Sakrash va Dodge
  playJump() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.14);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  playDodge() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Tezkor havo sirg'alishi
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playFireball() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playIceShard() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 6. K.O. Finisher
  playKo() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sub-bass zilzila
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 1.1);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.1);
  }

  playClick() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  playModal(isOpen = true) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isOpen ? 340 : 640, t);
    osc.frequency.exponentialRampToValueAtTime(isOpen ? 680 : 280, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playTacticalVoice(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    if (type === 'engage') {
      [440, 554, 659].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.22, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.28);
      });
    }
  }

  // 7. Handcrafted Cyber-Arcade BGM Loop
  startStudioBgm() {
    if (this.bgmInterval) return;
    const bassline = [55, 55, 65.4, 55, 73.4, 65.4, 49, 55]; // D-minor / A-minor arcade riff
    const chordNotes = [220, 261.6, 329.6, 392];

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      this.bgmStep = (this.bgmStep + 1) % 16;

      // Heavy Synth Bass
      if (this.bgmStep % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassline[(this.bgmStep / 2) % bassline.length], t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, t);
        filter.frequency.exponentialRampToValueAtTime(90, t + 0.22);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(t);
        osc.stop(t + 0.22);
      }

      // Metallic Hi-hat tick
      if (this.bgmStep % 2 === 1) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.03);
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(7000, t);

        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.05, t);
        hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        noise.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.bgmGain);
        noise.start(t);
      }
    }, 175);
  }
}

export const audioEngine = new AudioEngine();
