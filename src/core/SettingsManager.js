// Arena Clash 2D v3.2 — Sozlamalar Boshqaruvchisi (SettingsManager)
export class SettingsManager {
  static STORAGE_KEY = 'arena_clash_settings_v3.2';

  static DEFAULTS = {
    graphicsQuality: 'medium', // 'low' | 'medium' | 'high'
    masterVolume: 0.8,
    sfxVolume: 0.9,
    touchMode: 'auto',         // 'auto' | 'always' | 'off'
    powerupsEnabled: true,
    customHud: {
      btnScale: 'medium',      // 'small' | 'medium' | 'large'
      btnOpacity: 0.85,
      positions: null          // Saqlangan koordinatalar (agar o'zgartirilgan bo'lsa)
    }
  };

  constructor() {
    this.settings = { ...SettingsManager.DEFAULTS };
    this.listeners = new Set();
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          ...SettingsManager.DEFAULTS,
          ...parsed,
          customHud: {
            ...SettingsManager.DEFAULTS.customHud,
            ...(parsed.customHud || {})
          }
        };
      }
    } catch (e) {
      console.warn('Sozlamalarni yuklashda xatolik:', e);
      this.settings = { ...SettingsManager.DEFAULTS };
    }
    return this.settings;
  }

  save() {
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this.settings));
      this.notify();
    } catch (e) {
      console.warn('Sozlamalarni saqlashda xatolik:', e);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  updateCustomHud(hudConfig) {
    this.settings.customHud = {
      ...this.settings.customHud,
      ...hudConfig
    };
    this.save();
  }

  reset() {
    this.settings = JSON.parse(JSON.stringify(SettingsManager.DEFAULTS));
    this.save();
    return this.settings;
  }

  // Grafika sifatiga qarab mos DPR va zarralar chegarasini olish
  getGraphicsConfig() {
    switch (this.settings.graphicsQuality) {
      case 'low':
        return {
          dpr: 1.0,
          maxParticles: 60,
          enableBloom: false,
          enableVerletCloth: false,
          enableDistortion: false,
        };
      case 'high':
        return {
          dpr: Math.min(window.devicePixelRatio || 2, 2.0),
          maxParticles: 300,
          enableBloom: true,
          enableVerletCloth: true,
          enableDistortion: true,
        };
      case 'medium':
      default:
        return {
          dpr: Math.min(window.devicePixelRatio || 1.5, 1.5),
          maxParticles: 150,
          enableBloom: true,
          enableVerletCloth: true,
          enableDistortion: false,
        };
    }
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.settings);
      } catch (err) {
        console.error('Settings listener xatosi:', err);
      }
    }
  }
}

export const settingsManager = new SettingsManager();
