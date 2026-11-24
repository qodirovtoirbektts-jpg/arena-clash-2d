# ⚔️ Arena Clash 2D — Onlayn Multiplayer Jang Arenasi

**Arena Clash 2D** — bu real vaqt rejimida kichik kiber-arenada 2–4 nafar o'yinchining to'qnashuviga asoslangan, to'liq **Server-Authoritative** arxitekturada yaratilgan 2D multiplayer fighting arena o'yini.

> **Murakkablik:** Ekspert  
> **Janr:** 2D Multiplayer / Fighting Arena  
> **Platforma:** Windows va Web (HTML5 Canvas + Node.js WebSocket)  
> **Boshqaruv:** `WASD` — harakat; `J/K` — hujumlar; `L` — maxsus skill; `Space` — dodge/dash.

---

## 🎮 Asosiy Imkoniyatlar va Mexanikalar

1. **Server-Authoritative Game State (30 Hz Tick Rate):**
   - Barcha harakatlar, to'qnashuvlar (collision), zarbalar, shikastlanish (damage) va o'lim serverda hal qilinadi.
   - Tezlik xaki (Speed hack), devor orqali sakrash (Wall hack) va Cooldown bypass server tomonidan rad etiladi.
2. **Client-Side Prediction va Server Reconciliation:**
   - Mahalliy o'yinchi harakatlari hech qanday kechikishsiz (0 latency hissi) silliq boshqariladi.
   - Server snapshotlari bilan nomuvofiqlik bo'lsa, xatolik silliq to'g'irlanadi (reconciliation error visual smoothing).
3. **Entity Interpolation (Remote Players):**
   - Raqiblarning harakati snapshot buferi (80–100ms) orqali `lerp` bilan silliq 60–144 FPSda chiziladi.
4. **Tarmoq va Qayta Ulanish (Reconnect Support):**
   - Tarmoq uzilsa yoki brauzer sahifasi yangilansa, `sessionToken` orqali 30 soniya ichida jonli matchga qayta ulanish mumkin.
5. **3 Xil Muvozanatlangan Qahramonlar:**
   - 🗡️ **Blaze Knight (Bruiser / Tank):** 120 HP, kuchli qilich zarbalari, *Inferno Dash* (35 dmg + i-frame).
   - 🥷 **Shadow Ninja (Assassin / Mobility):** 95 HP, eng yuqori tezlik, ikki marta sakrash, masofaviy *Kunai*, *Shadow Strike* teleporti.
   - ❄️ **Frost Mage (Zoner / Control):** 100 HP, *Frost Bolt*, 3 yo'nalishli *Ice Shard Wave*, maydonni sekinlashtiruvchi *Blizzard Nova*.
6. **Lokal Prototip va Offline Rejimlar:**
   - **👥 Lokal 2-O'yinchi (1 ta klaviaturada):** P1 (`WASD` + `J/K/L/Space`) vs P2 (`Strelkalar` + `U/I/O/Shift`).
   - **🤖 AI Botga qarshi mashg'ulot:** Aqlli bot platformalar bo'ylab harakatlanadi, hujum qiladi, skill va dodgelardan foydalanadi.
7. **Reyting (MMR), Matchmaking va Do'stlar Xonasi:**
   - Elo algoritmi asosida avtomatik MMR hisoblash (+/- reyting).
   - Do'stlar bilan o'ynash uchun unikal Room Code tizimi.
   - Match yakunida to'liq statistika (zarar, knockoutlar, raundlar).
8. **Audio va Vizual Effektlar:**
   - Web Audio API orqali sintezlangan procedural tovushlar (tashqi audio fayllarsiz ishlaydi).
   - Zarba zarrachalari, olov, muz kristallari, ekran silkinishi (screen shake) va suzuvchi zarar matnlari.
9. **F3 Debug Inspector & Replay Tizimi:**
   - `F3` tugmasi orqali FPS, Ping, Server Tick, Reconciliation xatolari sonini ko'rish.
   - Serverda har bir match tick-by-tick yozib olinadi va `/api/replays` orqali saqlanadi.

---

## 🕹️ Boshqaruv Tugmalari (Controls)

### 1-O'yinchi (Onlayn yoki Lokal P1):
| Harakat | Tugma | Tavsif |
| :--- | :--- | :--- |
| **Chapga / O'ngga** | `A` / `D` | Harakatlanish |
| **Sakrash (Jump)** | `W` yoki `Space` | Sakrash (Ninja: 2 marta) |
| **Pastga tushish** | `S` | Bir tomonlama platformalardan pastga tushish |
| **Yengil hujum (Light)** | `J` | Tezkor yengil zarba / snaryad |
| **Og'ir hujum (Heavy)** | `K` | Yuqori zararli kuchli zarba / kunai / muz to'lqini |
| **Maxsus Skill** | `L` | Qahramonning asosiy maxsus qobiliyati |
| **Dodge / Dash** | `Space` | Dushman zarbalaridan qochish (i-frame) |

### 2-O'yinchi (Faqat Lokal 2-Player Rejimida):
| Harakat | Tugma |
| :--- | :--- |
| **Harakat / Sakrash** | `Strelkalar` (Up, Down, Left, Right) |
| **Yengil hujum** | `U` yoki `Num4` |
| **Og'ir hujum** | `I` yoki `Num5` |
| **Maxsus Skill** | `O` yoki `Num6` |
| **Dodge / Dash** | `Shift` (O'ng) yoki `Num0` / `P` |

---

## 🚀 Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. Serverni ishga tushirish
```bash
npm start
```
Brauzerda oching: **`http://localhost:3000`**

### 3. Testlarni bajarish (Anti-Cheat, Reconnect, Load Test)
```bash
npm test
```

---

## 📂 Loyiha Strukturasi

```
arena-clash-2d/
├── shared/
│   ├── constants.js          # Arena o'lchamlari, 30 Hz tick rate, platformalar
│   ├── characters.js         # 3 ta qahramon parametrlari, HP, tezlik, hitboxlar
│   ├── protocol.js           # WebSocket paket turlari va xabarlar
│   ├── physics.js            # Deterministik AABB to'qnashuv va fizika
│   └── combat.js             # Zarbani aniqlash, snaryadlar, status effektlar
├── server/
│   ├── index.js              # Express HTTP & WebSocket server
│   ├── auth.js               # Profil, token va seans boshqaruvi
│   ├── storage.js            # Elo MMR reytingi, statistika va replaylar
│   ├── room.js               # Xona holati, ready, disconnect va reconnect taymeri
│   ├── roomManager.js        # Xonalar yaratish va kodlarni boshqarish
│   ├── matchmaking.js        # MMR asosida navbat va raqib tanlash
│   ├── gameEngine.js         # Server-authoritative tsikl va lag compensation
│   └── tests/
│       ├── antiCheat.test.js # Speed hack va cooldown abuse sinovlari
│       ├── reconnect.test.js # Uzilish va qayta ulanish sinovi
│       ├── loadTest.js       # Ko'p klientli stress test
│       └── runAllTests.js    # Barcha testlarni birlashtiruvchi skript
├── client/
│   ├── index.html            # Asosiy HTML interfeys
│   ├── css/style.css         # Zamonaviy kiberpank dizayn
│   └── js/
│       ├── audio.js          # Web Audio API tovush effekti generatori
│       ├── renderer.js       # Canvas 2D render, zarrachalar va VFX
│       ├── input.js          # Klaviatura kiritish va sequence boshqaruvi
│       ├── prediction.js     # Client prediction va server reconciliation
│       ├── interpolation.js  # Remote entity silliq interpolatsiyasi
│       ├── network.js        # WebSocket, ping RTT va auto-reconnect
│       ├── localGame.js      # Lokal 1v1 va AI Bot dvigateli
│       ├── ui.js             # Ekranlar va modallarni boshqarish
│       └── main.js           # Klient asosiy o'yin tsikli
├── docs/
│   ├── ARCHITECTURE.md       # Bosqich 81: Tarmoq modeli va xavfsizlik
│   └── DEPLOYMENT.md         # Bosqich 90: Linux VPS, Docker va Nginx qo'llanmasi
├── Dockerfile                # Konteynerlash
├── docker-compose.yml        # 1-buyruq bilan deploy
└── package.json
```

---

## 🛡️ Anti-Cheat va Qabul Qilish Mezonlari

1. **Server natijani tasdiqlaydi:** Barcha HP o'zgarishlari va g'alaba faqat server hisob-kitoblariga asoslanadi.
2. **Qayta ulanish (Reconnect):** Tarmoq uzilsa, o'yinchi 30 soniya ichida o'yinni o'z o'rnidan davom ettira oladi.
3. **Noto'g'ri klient harakati rad etiladi:** Ruxsat etilmagan tezlik, cooldown buzilishi yoki xaritadan tashqariga chiqish serverda to'xtatiladi.
4. **Avval lokal prototip, keyin online:** Ikkala rejim ham tayyor va to'liq o'ynash mumkin.
