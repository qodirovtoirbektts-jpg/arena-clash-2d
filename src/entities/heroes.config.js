// Arena Clash 2D v3.2 — Qahramonlar Balansi va Rig Konfiguratsiyasi (heroes.config.js)

export const HEROES_CONFIG = {
  blaze_knight: {
    id: "blaze_knight",
    name: "Olovli Ritsar",
    role: "tank",
    element: "fire",

    // Statik xarakteristikalar
    maxHp: 125,
    speed: 260,
    jumpForce: 620,
    maxJumps: 1,
    weight: 1.25, // Tezroq tushadi, qiyinroq itariladi

    // Ranglar palitrasi (Dark Semi-Realism)
    palette: {
      armorDark: "#262428",
      armorMid: "#3A3639",
      armorLight: "#4A4346",
      accent: "#FF5A1F",       // Magma yoriqlari
      glow: "#FF6A00",         // Rim lighting
      cloth: "#8B1E1E",        // Yirtilgan to'q qizil plash
      eyeGlow: "#FFAA00",      // Ko'z chaqnashi
      weaponMetal: "#A6A2A8",  // Temir tig'
      weaponAura: "#FF4500",   // Olov aulasi
    },

    // Qurol va zarba parametrlari
    combat: {
      lightAttack: {
        damage: 10,
        combo3Damage: 15,
        duration: 0.35,
        hitbox: { offsetX: 35, offsetY: -35, width: 75, height: 45 },
        knockback: { x: 180, y: -90 },
      },
      heavyAttack: {
        damage: 22,
        duration: 0.55,
        cooldown: 1.8,
        staminaCost: 18,
        hitbox: { offsetX: 40, offsetY: -40, width: 90, height: 60 },
        knockback: { x: 380, y: -220 },
      },
      skill: {
        name: "Inferno Dash",
        damage: 28,
        duration: 0.60,
        cooldown: 6.5,
        iFrameDuration: 0.25, // Daxlsizlik oynasi
        dashSpeed: 580,
        hitbox: { offsetX: 45, offsetY: -35, width: 95, height: 50 },
        knockback: { x: 440, y: -260 },
      },
      dodge: {
        duration: 0.32,
        cooldown: 2.2,
        staminaCost: 35,
        speedMultiplier: 1.8,
        iFrameDuration: 0.24,
      },
      block: {
        staminaDrainPerSec: 14,
        parryWindow: 0.20,     // 200ms ichida bosilsa Perfect Parry
        parryStunDuration: 0.60,
      },
      taunt: {
        duration: 1.5,
        vulnerableMultiplier: 2.0, // Zarba yesa 2x
      },
    },

    // Skelet rigi va bo'g'imlar uzunligi
    rig: {
      baseScale: 1.0,
      hurtbox: { width: 44, height: 86, offsetY: -43 },
      pivots: {
        pelvis:    { x: 0.50, y: 0.50 },
        torso:     { x: 0.50, y: 0.80 },
        head:      { x: 0.45, y: 0.85 },
        arm_upper: { x: 0.50, y: 0.15 },
        arm_lower: { x: 0.50, y: 0.15 },
        leg_upper: { x: 0.50, y: 0.15 },
        leg_lower: { x: 0.50, y: 0.15 },
        weapon:    { x: 0.20, y: 0.50 },
        cape:      { x: 0.50, y: 0.10 },
      },
      limbLengths: {
        torso: 36,
        arm_upper: 22,
        arm_lower: 20,
        leg_upper: 26,
        leg_lower: 24,
        weapon: 54,
        cape: 42,
      },
    },
  },

  shadow_ninja: {
    id: "shadow_ninja",
    name: "Soya Qotili",
    role: "assassin",
    element: "shadow",

    maxHp: 95,
    speed: 340,
    jumpForce: 590,
    maxJumps: 2, // Qo'sh sakrash
    weight: 0.88, // Yengil, tez sakraydi

    palette: {
      armorDark: "#131418",
      armorMid: "#1A1B22",
      armorLight: "#353846",
      accent: "#9333EA",       // Binafsha jiyaklar
      glow: "#A855F7",         // Rim lighting
      cloth: "#4A1D96",        // Uzun binafsha sharf
      eyeGlow: "#C084FC",      // Ko'z nuri
      weaponMetal: "#7E22CE",  // Egri binafsha xanjar
      weaponAura: "#A855F7",   // Soya tutuni
    },

    combat: {
      lightAttack: {
        damage: 7,             // 7x2 zarba
        hits: 2,
        duration: 0.28,
        hitbox: { offsetX: 30, offsetY: -35, width: 65, height: 40 },
        knockback: { x: 140, y: -70 },
      },
      heavyAttack: {
        name: "Shadow Kunai",
        damage: 16,
        isProjectile: true,
        duration: 0.40,
        cooldown: 1.6,
        staminaCost: 18,
        projectileSpeed: 650,
        projectileLifetime: 1.2,
      },
      skill: {
        name: "Shadow Teleport",
        damage: 32,
        duration: 0.45,
        cooldown: 6.0,
        teleportBehindDistance: 60,
        hitbox: { offsetX: 0, offsetY: -35, width: 80, height: 55 },
        knockback: { x: 320, y: -200 },
      },
      dodge: {
        duration: 0.26,
        cooldown: 1.5,
        staminaCost: 25,
        speedMultiplier: 2.2,
        iFrameDuration: 0.22,
      },
      block: {
        staminaDrainPerSec: 14,
        parryWindow: 0.20,
        parryStunDuration: 0.60,
      },
      taunt: {
        duration: 1.5,
        vulnerableMultiplier: 2.0,
      },
    },

    rig: {
      baseScale: 0.94,
      hurtbox: { width: 38, height: 80, offsetY: -40 },
      pivots: {
        pelvis:    { x: 0.50, y: 0.50 },
        torso:     { x: 0.50, y: 0.80 },
        head:      { x: 0.45, y: 0.85 },
        arm_upper: { x: 0.50, y: 0.15 },
        arm_lower: { x: 0.50, y: 0.15 },
        leg_upper: { x: 0.50, y: 0.15 },
        leg_lower: { x: 0.50, y: 0.15 },
        weapon:    { x: 0.25, y: 0.50 },
        cape:      { x: 0.50, y: 0.10 },
      },
      limbLengths: {
        torso: 32,
        arm_upper: 20,
        arm_lower: 18,
        leg_upper: 24,
        leg_lower: 22,
        weapon: 36,
        cape: 48, // Uzun sharf
      },
    },
  },

  frost_mage: {
    id: "frost_mage",
    name: "Muz Sehrgari",
    role: "mage",
    element: "frost",

    maxHp: 100,
    speed: 285,
    jumpForce: 580,
    maxJumps: 1,
    weight: 0.95,
    slowFallFactor: 0.45, // Sakrash cho'qqisida silliq parvoz qilish

    palette: {
      armorDark: "#0B1528",
      armorMid: "#0E1E3A",
      armorLight: "#1E3A5F",
      accent: "#38BDF8",       // Muz kristallari
      glow: "#22D3EE",         // Rim lighting
      cloth: "#0369A1",        // Kristall qirovli mantiya
      eyeGlow: "#E0F2FE",      // Moviy oq muz nuri
      weaponMetal: "#94A3B8",  // Kristall muz asosi
      weaponAura: "#38BDF8",   // Qirov zarralari
    },

    combat: {
      lightAttack: {
        name: "Frost Bolt",
        damage: 9,
        isProjectile: true,
        duration: 0.45,
        projectileSpeed: 520,
        projectileLifetime: 1.5,
      },
      heavyAttack: {
        name: "Triple Frost Shards",
        damage: 21,            // 3 x 7
        hits: 3,
        isProjectile: true,
        duration: 0.50,
        cooldown: 2.2,
        staminaCost: 18,
        projectileSpeed: 480,
        spreadAngle: 0.25,     // Uch tomonga tarqalish
      },
      skill: {
        name: "Frost Nova",
        damage: 24,
        duration: 0.65,
        cooldown: 7.0,
        slowPercent: 0.35,     // 35% sekinlashtirish
        slowDuration: 2.5,
        hitbox: { offsetX: 0, offsetY: -35, width: 140, height: 90 }, // Radial to'lqin
        knockback: { x: 260, y: -180 },
      },
      dodge: {
        duration: 0.28,
        cooldown: 2.0,
        staminaCost: 30,
        speedMultiplier: 1.9,
        iFrameDuration: 0.24,
      },
      block: {
        staminaDrainPerSec: 14,
        parryWindow: 0.20,
        parryStunDuration: 0.60,
      },
      taunt: {
        duration: 1.5,
        vulnerableMultiplier: 2.0,
      },
    },

    rig: {
      baseScale: 0.96,
      hurtbox: { width: 40, height: 82, offsetY: -41 },
      pivots: {
        pelvis:    { x: 0.50, y: 0.50 },
        torso:     { x: 0.50, y: 0.80 },
        head:      { x: 0.45, y: 0.85 },
        arm_upper: { x: 0.50, y: 0.15 },
        arm_lower: { x: 0.50, y: 0.15 },
        leg_upper: { x: 0.50, y: 0.15 },
        leg_lower: { x: 0.50, y: 0.15 },
        weapon:    { x: 0.30, y: 0.50 },
        cape:      { x: 0.50, y: 0.10 },
      },
      limbLengths: {
        torso: 34,
        arm_upper: 21,
        arm_lower: 19,
        leg_upper: 25,
        leg_lower: 23,
        weapon: 48,
        cape: 45,
      },
    },
  },
};

// Umumiy fizika va jang qoidalari
export const GAMEPLAY_CONFIG = {
  gravity: 1250,               // Standart gravitatsiya (px/s^2)
  lowGravityMultiplier: 0.50,  // Oy gravitatsiyasi mutatori
  groundY: 520,                // Asosiy yer sathi
  arenaWidth: 1280,
  arenaHeight: 720,

  // Stamina parametrlari
  stamina: {
    max: 100,
    regenRate: 22,             // 22 / sekund
    regenDelay: 0.60,          // Harakatsizlikdan keyin tiklanish kechikishi
    blockDrainRate: 14,        // 14 / sekund
  },

  // "Game Feel" vaqt oynalari
  feel: {
    coyoteTime: 0.10,          // 100ms
    inputBufferWindow: 0.12,   // 120ms
    clashWindow: 0.15,         // 150ms oyna ichida og'ir zarbalar to'qnashsa CLASH
    clashDuration: 1.50,       // 1.5s duel
    clashSlowMo: 0.25,         // 0.25x vaqt tezligi
    hitFlashDuration: 0.08,    // 80ms oq zarba chaqnashi
    animeKoDuration: 1.0,      // 1.0s slow-mo
    animeKoSilhouetteDuration: 0.35, // 0.35s manga qora-qizil siluet
    rageHpThreshold: 0.20,     // 20% HP da Awakening
    rageDamageBonus: 0.15,     // +15% zarar
  },

  // Power-up intervallari
  powerups: {
    spawnInterval: 15.0,       // 15 soniya
    healAmount: 20,
    damageBuffMultiplier: 1.25,
    damageBuffDuration: 6.0,
  },
};
