(function(exports) {
  exports.CHARACTERS = {
    blaze_knight: {
      id: 'blaze_knight',
      name: 'Blaze Knight',
      title: 'Olovli Ritsar (Bruiser / Melee)',
      description: 'Kuchli qilich zarbalari va olovli dash bilan yuqori chidamli jangchi.',
      maxHp: 120,
      speed: 280,
      jumpForce: 520,
      doubleJump: false,
      width: 42,
      height: 58,
      color: '#ff4757',
      accentColor: '#ffa502',
      attacks: {
        light: {
          name: 'Fire Slash',
          key: 'J',
          damage: 12,
          range: 65,
          hitboxW: 65,
          hitboxH: 45,
          cooldown: 0.35,
          windup: 0.08,
          duration: 0.22,
          knockbackX: 240,
          knockbackY: -120,
          type: 'melee'
        },
        heavy: {
          name: 'Flame Cleave',
          key: 'K',
          damage: 26,
          range: 80,
          hitboxW: 80,
          hitboxH: 55,
          cooldown: 0.85,
          windup: 0.16,
          duration: 0.35,
          knockbackX: 420,
          knockbackY: -220,
          type: 'melee'
        },
        skill: {
          name: 'Inferno Dash',
          key: 'L',
          damage: 35,
          dashSpeed: 680,
          hitboxW: 75,
          hitboxH: 50,
          cooldown: 6.0,
          duration: 0.28,
          invulnerable: true,
          knockbackX: 450,
          knockbackY: -180,
          type: 'dash_attack'
        },
        dodge: {
          name: 'Flame Roll',
          key: 'Space',
          speed: 430,
          duration: 0.22,
          cooldown: 1.1,
          invulnerable: true
        }
      }
    },

    shadow_ninja: {
      id: 'shadow_ninja',
      name: 'Shadow Ninja',
      title: 'Soya Qotili (Assassin / Mobile)',
      description: 'Yuqori tezlik, ikki marta sakrash va masofaviy kunai uloqtiruvchi chaqqon qotil.',
      maxHp: 95,
      speed: 345,
      jumpForce: 550,
      doubleJump: true,
      width: 36,
      height: 54,
      color: '#9b59b6',
      accentColor: '#00d2d3',
      attacks: {
        light: {
          name: 'Twin Daggers',
          key: 'J',
          damage: 8,
          range: 48,
          hitboxW: 48,
          hitboxH: 40,
          cooldown: 0.22,
          windup: 0.05,
          duration: 0.16,
          knockbackX: 160,
          knockbackY: -80,
          type: 'melee'
        },
        heavy: {
          name: 'Kunai Toss',
          key: 'K',
          damage: 18,
          cooldown: 0.65,
          windup: 0.10,
          duration: 0.25,
          type: 'projectile',
          projSpeed: 760,
          projRadius: 7,
          projLifespan: 1.2,
          knockbackX: 260,
          knockbackY: -100
        },
        skill: {
          name: 'Shadow Strike',
          key: 'L',
          damage: 30,
          teleportDist: 220,
          hitboxRadius: 65,
          cooldown: 7.0,
          duration: 0.24,
          invulnerable: true,
          knockbackX: 380,
          knockbackY: -200,
          type: 'teleport_attack'
        },
        dodge: {
          name: 'Smoke Phase',
          key: 'Space',
          speed: 480,
          duration: 0.25,
          cooldown: 0.95,
          invulnerable: true
        }
      }
    },

    frost_mage: {
      id: 'frost_mage',
      name: 'Frost Mage',
      title: 'Muz Sehrgari (Zoner / Control)',
      description: 'Muzli snaryadlar, maydonni sekinlashtiruvchi Blizzard Nova bilan raqibni masofada ushlaydi.',
      maxHp: 100,
      speed: 260,
      jumpForce: 495,
      doubleJump: false,
      width: 38,
      height: 56,
      color: '#3498db',
      accentColor: '#74b9ff',
      attacks: {
        light: {
          name: 'Frost Bolt',
          key: 'J',
          damage: 14,
          cooldown: 0.42,
          windup: 0.08,
          duration: 0.22,
          type: 'projectile',
          projSpeed: 620,
          projRadius: 9,
          projLifespan: 1.4,
          knockbackX: 200,
          knockbackY: -90
        },
        heavy: {
          name: 'Ice Shard Wave',
          key: 'K',
          damage: 10,
          cooldown: 0.90,
          windup: 0.15,
          duration: 0.32,
          type: 'multi_projectile',
          count: 3,
          spreadAngles: [-0.18, 0, 0.18], // Radians
          projSpeed: 580,
          projRadius: 8,
          projLifespan: 1.3,
          knockbackX: 220,
          knockbackY: -120
        },
        skill: {
          name: 'Blizzard Nova',
          key: 'L',
          damage: 32,
          hitboxRadius: 125,
          cooldown: 8.0,
          duration: 0.35,
          slowDuration: 2.0,
          slowFactor: 0.45, // 55% sekinlashtiradi
          knockbackX: 320,
          knockbackY: -250,
          type: 'aoe_blast'
        },
        dodge: {
          name: 'Glacial Blink',
          key: 'Space',
          speed: 440,
          duration: 0.22,
          cooldown: 1.25,
          invulnerable: true
        }
      }
    }
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : (window.GameCharacters = {}));
