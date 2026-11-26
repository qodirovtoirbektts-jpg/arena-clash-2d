# Arena Clash 2D v3.2 — Mukammal Avtonom Texnik Spetsifikatsiya (SPEC)

> **AVTONOM AGENT REJIMI (ZERO-PERMISSION POLICY):**
> Ushbu hujjat to'liq mustaqil (unattended) ijro uchun yozilgan. Agent hech qanday bosqichda foydalanuvchidan ruxsat, tasdiq yoki aniqlashtirish so'ramasdan barcha texnik qarorlarni ushbu spetsifikatsiya asosida o'zi qabul qiladi, barcha 8 ta bosqichni uzluksiz bajaradi, xatolarni mustaqil tuzatadi va yakuniy build tayyor bo'lgach hisobot beradi.

---

## 1. Loyiha Maqsadi va Bartaraf Etiladigan Xatolar
`Arena Clash 2D` ni oddiy brauzer prototipidan mobil va kompyuterda barqaror 60 FPS ishlaydigan, AAA darajadagi 2D teksturali skelet animatsiyasi, chuqur jang mexanikalari hamda real-time WebSocket multiplayeriga ega professional **2D Arena Brawler** darajasiga olib chiqish.

### Eski versiyadan (`arena-clash-2d.vercel.app`) majburiy tuzatiladigan kamchiliklar:
1. **`Space` tugmasi to'qnashuvi:** Sakrash (`W`) va Dodge (`Shift`) funksiyalari qat'iy ajratiladi; bitta tugmaga ikki xil vazifa yuklanmaydi.
2. **Lokal 2-o'yinchi boshqaruvi:** Bitta klaviaturada 2-o'yinchi uchun barcha tugmalar to'liq ishlaydi va Pauza / Boshqaruv oynasida aniq ko'rsatiladi.
3. **`F3 Debug` yashirilishi:** Dasturchi debug paneli oddiy o'yinchilar interfeysidan butunlay olib tashlanadi; faqat URL da `?debug=1` parametri bo'lgandagina faollashadi.
4. **Qahramonlar balansi va shaffoflik:** Barcha 3 ta qahramon qayta balanslanadi; tanlash oynasida HP, zarar, tezlik, masofa va cooldown qiymatlari ochiq ko'rsatiladi.
5. **Vercel + Render Multiplayer arxitekturasi:** Frontend Vercel'da, doimiy WebSocket server esa alohida `server/` papkasidan Render'da ishlaydi. Statik `0 ms` o'rniga real RTT ping va rangli ulanish holati ko'rsatiladi; server uyquda yoki o'chiq bo'lsa o'yin xatosiz Offlayn/Bot rejimida ishlayveradi.
6. **Til va interfeys tozaligi:** Barcha matnlar yagona lug'at (`src/i18n/uz.js`) orqali 100% sof o'zbek tilida beriladi; bosh sahifa ortiqcha zichlikdan tozalanadi.

---

## 2. Modulli Monorepo Arxitekturasi (Qat'iy Qoida)
Barcha mantiq bitta faylda yozilmasligi shart. Loyiha bitta GitHub repozitoriyasida **Frontend (Vercel)** va **Backend (Render)** ga avtomatik deploy qilinadigan monorepo shaklida quriladi:

```text
arena-clash-2d/
├── .gitignore                  # 10-bo'limdagi andozadan avtomatik yaratiladi
├── vercel.json                 # 10-bo'limdagi andozadan avtomatik yaratiladi
├── render.yaml                 # 10-bo'limdagi andozadan avtomatik yaratiladi
├── package.json                # Faqat Frontend (Vite) kutubxonalari (ws bu yerga kiritilmaydi)
├── spec.md                     # Ushbu texnik spetsifikatsiya
├── plan.md                     # Antigravity uchun 8 fazali avtonom ish rejasi
├── public/
│   ├── manifest.json           # PWA to'liq ekranli (landscape) ilova konfiguratsiyasi
│   ├── sw.js                   # Offlayn keshlash uchun Service Worker
│   └── assets/
│       └── heroes/
│           ├── heroes_rig_manifest.json # 3 qahramonning yagona rig, pivot va rang manifesti
│           ├── blaze_knight/            # atlas.png, atlas.json, rig.json + 8 ta zaxira PNG
│           ├── shadow_ninja/            # atlas.png, atlas.json, rig.json + 8 ta zaxira PNG
│           └── frost_mage/              # atlas.png, atlas.json, rig.json + 8 ta zaxira PNG
├── src/
│   ├── core/
│   │   ├── GameLoop.js         # 60Hz fixed-timestep fizika, interpolatsiyali render, timeScale, hitstopTimer
│   │   ├── InputManager.js     # P1/P2 klaviatura, Touch, Input Buffering (120ms), Coyote Time (100ms)
│   │   ├── Camera.js           # Dinamik zoom (0.85x–1.25x), smooth follow, screen shake, KO zoom
│   │   ├── AudioEngine.js      # Web Audio API zero-asset protsedural SFX + UI klik tovushlari
│   │   └── SettingsManager.js  # Grafika sifati, ovoz, sensor rejim, power-up va Custom HUD (localStorage)
│   ├── entities/
│   │   ├── Fighter.js          # Jangchi FSM holatlari, HP, Stamina, Combo, Parry, Awakening, Taunt
│   │   ├── SkeletonRig.js      # 2D bo'g'imli skelet iyerarxiyasi, Verlet plash fizikasi, Weapon Ribbon Trail
│   │   ├── Projectile.js       # Snaryadlar (Kunai, Frost Bolt, Ice Wave) + elementar to'qnashuvlar
│   │   ├── ArenaObjects.js     # Sinadigan platformalar, Power-up sferalari, Ko'tarilayotgan lava
│   │   ├── BotAI.js            # 3 darajali AI (Oson/O'rta/Qiyin), Attract Mode AI, Shadow Clone AI
│   │   └── heroes.config.js    # 3 qahramon balansi, rang palitrasi, hitbox/hurtbox va rig konfiguratsiyasi
│   ├── systems/
│   │   ├── CombatSystems.js    # Weapon Clash, Elemental Reactions, Wall Bounce, Combo Tracker
│   │   ├── MutatorSystem.js    # Xaos rejimi mutatorlari (Zulmat, Oy gravitatsiyasi, Lava)
│   │   └── ReplaySystem.js     # Oxirgi 5 ta jang yozuvi, o'yinchi uslubi profili va MMR statistikasi
│   ├── render/
│   │   ├── AssetLoader.js      # 3 bosqichli yuklovchi: Sprite Atlas -> Individual PNG -> Procedural Fallback
│   │   ├── ArenaRenderer.js    # 3 qatlamli 2.5D Parallax fon, dinamik bloom yorug'ligi, Zulmat maskasi
│   │   ├── FighterRenderer.js  # Teksturali Cutout Rig + Procedural Fallback, Rim Lighting, Hit Flash, KO siluet
│   │   └── ParticleSystem.js   # Object-pooled zarralar: uchqun, olov, muz, bug', chang, zarar raqamlari
│   ├── ui/
│   │   ├── TouchControls.js    # Avtomatik sensor boshqaruv (suzuvchi joystik + ergonomik yoy tugmalar)
│   │   ├── HudEditor.js        # Mobil tugmalarni surish, kattalashtirish va shaffofligini saqlash muharriri
│   │   ├── HUD.js              # Qiyshiq Ghost HP Bar, Diegetic UI, Combo Counter, Vignette, Off-screen strelka
│   │   └── MenuManager.js      # Attract Mode menyu, Qahramon tanlash preview, MVP ekrani, Pauza va modallar
│   ├── net/
│   │   └── NetworkClient.js    # WebSocket (wss://), Render /health pre-warm, real RTT ping, offline fallback
│   └── i18n/
│       └── uz.js               # 100% yagona sof o'zbekcha matnlar lug'ati
├── server/
│   ├── package.json            # 10-bo'limdagi andozadan avtomatik yaratiladi (faqat ws)
│   └── ws-server.js            # Render uchun HTTP (/health) + WebSocket (ws) multiplayer serveri
└── tools/
    └── slice_sprites.py        # Qahramon sprite sheetlarini kesish va oq jiyak tozalash skripti
```

---

## 3. AAA "Dark Semi-Realism" Teksturali 2D Skelet va Sprite Atlas Tizimi

Brauzer va telefonda ham yuqori yarim-realistik vizual sifat, ham 1 soniyada yuklanish va 60 FPS tezlik uchun **Sprite Atlas Cutout Rigging + Procedural Fallback** arxitekturasi qo'llaniladi.

### A. 3 Bosqichli Xavfsiz Asset Yuklash Zanjiri (`AssetLoader.js`)
1. **1-ustuvorlik (Eng tez — Production):** `public/assets/heroes/heroes_rig_manifest.json` hamda har bir qahramon uchun `atlas.png` + `atlas.json` + `rig.json` yuklanadi (har bir qahramon uchun 8 ta emas, **1 ta HTTP so'rov**, jami ~1.2 MB).
2. **2-ustuvorlik (Alohida PNG zaxira):** Agar `atlas.png` topilmasa, `public/assets/heroes/{hero_id}/` ichidagi 8 ta alohida oq-jiyaksiz RGBA PNG (`head.png`, `torso.png`, `arm_upper.png`, `arm_lower.png`, `leg_upper.png`, `leg_lower.png`, `weapon.png`, `cape.png`) yuklanadi.
3. **3-ustuvorlik (Procedural Fallback):** Agar asset papkasi hali joylanmagan bo'lsa ham o'yin sinmaydi — `FighterRenderer.js` har 3 qahramonni yuqori detallashgan "Dark Semi-Realism" protsedural grafika (zirh plastinalari, magma yoriqlari, yonuvchi ko'zlar, Verlet mato, elementar qurol) bilan chizadi.

### B. Skelet Bo'g'imlari Iyerarxiyasi va Pivot Standarti (`SkeletonRig.js`)
- **Ildiz (Root):** `pelvis` (bel/chanoq).
- **Chizish tartibi (Z-order):**
  `cape` -> orqa `leg_upper` -> orqa `leg_lower` -> orqa `arm_upper` -> orqa `arm_lower` -> `torso` -> `head` -> oldingi `leg_upper` -> oldingi `leg_lower` -> oldingi `arm_upper` -> oldingi `arm_lower` -> `weapon`.
- **Pivot koordinatalari:** `rig.json` / `heroes_rig_manifest.json` dagi qiymatlar ustuvor; standart qiymatlar:

| Qism | Pivot X | Pivot Y | Aylanish nuqtasi |
| :--- | :---: | :---: | :--- |
| `head` | `0.45` | `0.85` | Bo'yin qismidan |
| `torso` | `0.50` | `0.80` | Bel markazidan |
| `arm_upper` | `0.50` | `0.15` | Yelka bo'g'imidan |
| `arm_lower` | `0.50` | `0.15` | Tirsakdan |
| `leg_upper` | `0.50` | `0.15` | Chanoq (son tepasi)dan |
| `leg_lower` | `0.50` | `0.15` | Tizzadan |
| `weapon` | `0.20` | `0.50` | Dastasidan (o'ngga qaragan gorizontal) |
| `cape` | `0.50` | `0.10` | Yelka ilgagidan (+ Verlet mato tebranishi) |

### C. 3 ta Qahramonning Vizual Pasporti
- **Blaze Knight (`blaze_knight` — Olovli Ritsar):** Qoraytirilgan temir zirh (`#262428`–`#4A4346`), magma yoriqlari (`#FF5A1F`), Rim Lighting `#FF6A00`, yirtilgan to'q qizil plash, yirik olovli katta qilich.
- **Shadow Ninja (`shadow_ninja` — Soya Qotili):** Ko'mir-qora shinobi kiyimi (`#1A1B22`–`#353846`), kumush bog'ichlar, Rim Lighting `#A855F7`, binafsha jiyakli uzun sharf, egri binafsha qirrali xanjar.
- **Frost Mage (`frost_mage` — Muz Sehrgari):** Tun-ko'k mantiya (`#0E1E3A`–`#1E3A5F`), muzlagan kumush zirh, Rim Lighting `#22D3EE`, yarim shaffof qirovli mantiya, kristall muz asosi.

### D. Animatsiya Holatlari (FSM) va Vizual Aniqlik
- Holatlar: `IDLE`, `RUN`, `JUMP / DOUBLE_JUMP / FALL`, `ATTACK_LIGHT / HEAVY / SKILL` (3 faza: anticipation -> active + Weapon Ribbon Trail -> recovery), `DODGE` (afterimage ghosts), `BLOCK / PARRY`, `CLASH`, `TAUNT`, `HITSTUN / WALL_BOUNCE / KO`.
- Anti-Clutter: Har bir jangchi chetida elementar **Rim Lighting**, yerdagi balandlikka mos yumshoq **soya**, sakrash/tushishda **Squash & Stretch** va zarbada `80ms` **oq Hit Flash**.

---

## 4. Qahramonlar Balansi (`heroes.config.js`)

| Qahramon | Rol | HP | Tezlik | Sakrash | Yengil (`J`) | Og'ir (`K`) | Skill (`L`) | Dodge (`Shift`) |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **Blaze Knight** | Tank / Jangchi | 125 | 260 | 1x | 10 dmg (`0.35s`, 3-zarba: 15) | 22 dmg (`1.8s`, kuchli itarish) | 28 dmg (`6.5s`, Inferno Dash + `0.25s` i-frame) | `2.2s` (35 Stamina) |
| **Shadow Ninja** | Qotil / Tezkor | 95 | 340 | 2x | 7x2 dmg (`0.28s`, tezkor xanjar) | 16 dmg (`1.6s`, Kunai snaryad) | 32 dmg (`6.0s`, Raqib ortiga teleport) | `1.5s` (25 Stamina) |
| **Frost Mage** | Sehrgar / Nazorat | 100 | 285 | 1x + sekin tushish | 9 dmg (`0.45s`, Frost Bolt) | 3x7 dmg (`2.2s`, 3 ta muz o'qi) | 24 dmg + `2.5s` 35% Slow (`7.0s`, Frost Nova) | `2.0s` (30 Stamina) |

- **Stamina tizimi:** Maksimal `100`, sekundiga `22` tezlikda tiklanadi (`0.6s` harakatsizlikdan so'ng). Blok ushlab turish `14/s`, Dodge `25–35`, Og'ir zarba `18` stamina sarflaydi.

---

## 5. "Game Feel" Asoslari va 8 ta Kutilmagan ("Wow") Mexanika

### A. Professional "Game Feel"
- **Perfect Parry:** Zarba tegishidan `0.2s` oldin Blok (`U`) bosilsa, zarar 0 ga tushadi, oltin chaqnash chiqadi va hujumchi `0.6s` karaxt (`stun`) bo'ladi.
- **Hitstop:** Og'ir zarba, Skill va Parry tekkanda fizika `45–80ms` ga muzlaydi.
- **Kechirimli fizika:** `100ms` Coyote Time va `120ms` Input Buffering.
- **Arena Power-up Sferalari:** Har `15s` da maydon markazida tasodifiy sfera paydo bo'ladi: *Jon (+20 HP)* yoki *Kuch (+25% zarar, 6s)* (sozlamadan o'chirish mumkin).

### B. 8 ta Kutilmagan ("Wow") Mexanika
1. **Qurollar To'qnashuvi (Weapon Clash):** Ikkala o'yinchi `150ms` oyna ichida Og'ir (`K`) yoki Skill (`L`) bilan to'qnashsa, vaqt `1.5s` ga `0.25x` sekinlashadi, chaqmoq uchqunlari otiladi va tugma bosish dueli boshlanadi. G'olib raqibini `18 dmg` va kuchli knockback bilan uchiradi.
2. **Elementar Reaksiyalar:**
   - *Olov + Muz = Bug' Buluti:* To'qnashuv nuqtasida `3s` ko'rishni to'suvchi quyuq bug' paydo bo'ladi.
   - *Soya + Olov = Yonayotgan Tutun:* Ninja olov zonasi orqali teleport qilsa, `2.5s` davomida `3 dmg/s` yonish beruvchi tutun qoladi.
3. **So'nggi Nafas (Awakening / Rage):** HP `20%` dan pastga tushganda avtomatik faollashadi — yorqin ko'zlar, elementar aura va `+15%` zarba kuchi.
4. **Xavfli Masxara (Risky Taunt):** `T` (yoki mobil Taunt) bosilganda `1.5s` qimirlamay chorlov qiladi; zarba yesa `2x` zarar oladi, zarba yemay tugatsa **Skill cooldown'i darhol nollanadi**.
5. **Sinadigan Platformalar va Devordan Sakrash (Wall Bounce):** Yon platformalar 3 ta kuchli zarbada sinadi va `10s` dan keyin tiklanadi. Arena devoriga kuchli urilgan raqib qaytib uchadi (havo kombosi imkoniyati).
6. **Anime Uslubidagi KO Finisher:** Raundni yakunlovchi hal qiluvchi zarbada vaqt `1.0s` ga `0.2x` sekinlashadi, kamera zarba nuqtasiga keskin yaqinlashadi va fon `0.35s` ga qora-qizil manga siluetiga aylanadi.
7. **Raund Mutatorlari ("Xaos" Rejimi):** Har raund boshida tasodifiy qoida tushadi:
   - *Zulmat:* Butun arena qorong'i; faqat ko'zlar, qurol izi va elementar hujumlar radial nur maskasi taratadi.
   - *Oy Gravitatsiyasi:* Gravitatsiya `50%` ga pasayadi — havo jangi.
   - *Ko'tarilayotgan Lava:* Raundning oxirgi `15s` ida pastdan lava (`10 dmg/s`) ko'tariladi.
8. **O'z "Arvohing"ga Qarshi Jang (Shadow Clone AI):** `ReplaySystem.js` oxirgi 3 ta jangdagi o'yinchi xulq-atvor profilini (sakrash chastotasi, hujum masofasi, Yengil/Og'ir/Skill/Dodge nisbati) saqlaydi va xuddi o'sha uslubda jang qiluvchi shaffof klonni raqib sifatida yaratadi.

---

## 6. 2.5D Arenalar va Grafika Sifati Rejimlari
- **2 ta 2.5D Parallax Arena (3 qatlam):** *Olovli Qal'a* (mash'alalar, uchuvchi cho'g'lar) va *Muzli Ibodatxona* (qor zarralari, kristall nuri).
- **Grafika Sifati (`SettingsManager.js`):**
  - **Past:** Minimal zarralar (pool max 60), blur/bloom o'chiq, soddalashtirilgan plash, `DPR = 1`.
  - **O'rta (Standart):** O'rtacha zarralar (pool max 150), yengil bloom, Verlet plash, `DPR <= 1.5`.
  - **Yuqori:** To'liq bloom va dinamik yorug'lik (pool max 300), barcha ob-havo zarralari, `DPR <= 2`.

---

## 7. Professional Dizayn Tizimi va Interfeys (UI/UX)

### A. Art Direction
- **Dynamic Skew:** Barcha asosiy tugmalar, HP barlar va bannerlar `6–10` daraja qiyshaygan (parallelogram) kinetik geometriyada.
- **60–30–10 Rang Intizomi:** `60%` chuqur to'q neytral fon, `30%` yarim shaffof qoramtir oyna (`backdrop-filter: blur`), `10%` qahramon elementiga mos aksent (Olov `#FF5A1F`, Soya `#A855F7`, Muz `#22D3EE`).
- **Tipografiya:** Sarlavha va bannerlar (`RAUND 1`, `KO`, `CLASH`) uchun keskin qalin shrift; HP, taymer, kombo va ping raqamlari uchun majburiy `font-variant-numeric: tabular-nums`.
- **Taktil Mikro-animatsiyalar:** Tugma bosilganda `scale(0.95)`, chetidan yorug' chiziq o'tishi va Web Audio mexanik klik tovushi.

### B. Bosh Menyu va Oqim (Lobby UX)
- **Attract Mode:** Bosh menyu ortida xiralashtirilgan arenada 2 ta AI bot jonli jang qilib turadi.
- **3 Bosishda Jang:** Markazda yirik **"JANGNI BOSHLASH"** tugmasi va rejim kartalari (*Botga Qarshi*, *Lokal 2-O'yinchi*, *Xaos Rejimi*, *Arvoh Klon*, *Onlayn Duel*). Profil, Reyting, Replay va Sozlamalar yuqori burchakdagi ixcham ikonka-tugmalarda (modal oynalar).
- **Qahramon Tanlash:** Jonli animatsiyali mini-canvas preview + qahramon almashtirilganda fon elementar zarralari almashishi + to'liq balans/cooldown kartasi.

### C. Jang Ichi Interfeys (Combat HUD)
- **Markaziy Maydon Qoidasi:** Ekranning markaziy **60–65% qismi mutlaqo bo'sh** qoladi; barcha elementlar periferiyaga joylashadi.
- **Ghost Health Bar:** Asosiy jon darhol tushadi, oq/sariq zaxira qatlam `0.4s` da silliq pasayadi.
- **Diegetic UI:** Personaj yonida ingichka stamina chizig'i; Skill qayta tiklanganda qurolda qisqa yorug' chaqnash.
- **Dinamik Combo Counter:** `3+` zarbada ekran chetida kattalashib chiquvchi hisoblagich (`4 ZARBA — CHAQQON!`, `8 ZARBA — TO'XTATIB BO'LMAS!`), uzilganda parchalanish animatsiyasi.
- **Chekka Signallari:** Jon `25%` dan pastda qizil pulsatsiyali **Low-HP Vignette**; raqib kamera chetidan chiqsa yo'nalish ko'rsatuvchi **Off-screen strelka**.
- **Raund Kristallari va Banner:** Yonib to'ladigan raund olmoslari va raund boshida sirg'alib o'tuvchi `RAUND 1 — JANG!` banneri.
- **Minimalist Pauza:** Xira fon, "Davom etish", "Boshqaruv", "Ovoz/Grafika" va "Chiqish". Klaviatura eslatmasi faqat shu menyu ichida turadi.

### D. Jangdan Keyingi MVP Ekrani
- "G'ALABA" / "MAG'LUBIYAT" + statistika (eng uzun kombo, Parry soni, jami zarar, aniqlik %), jonli to'luvchi MMR reyting chizig'i va 1 bosishda **Tezkor Revansh**.

---

## 8. Avtomatik Boshqaruv va Custom HUD Editor

### A. Mobil va Sensor Qurilmalar (`TouchControls.js` + `HudEditor.js`)
- Sensor ekran (`pointer: coarse` / `touchstart`) avtomatik aniqlanadi; sozlamadan qo'lda boshqarish mumkin.
- **Safe-Area:** Barcha tugmalar `env(safe-area-inset-top/right/bottom/left)` hisobida joylashadi.
- **Portrait Ogohlantirish:** Telefon tik ushlanganda ekranni gorizontal burish bo'yicha oqlangan overlay.
- **Chap tomon:** Dinamik suzuvchi (yoki fiksirlangan) virtual joystik.
- **O'ng tomon:** Bosh barmoq yoyida (arc) joylashgan tugmalar: markazda katta **Yengil Zarba**, atrofida **Og'ir**, **Skill**, **Dodge**, **Sakrash**, **Blok/Parry** va ixcham **Taunt**. Har birida aylanma cooldown taymeri va `navigator.vibrate(15)`.
- **Masshtab:** `clamp(48px, 11dvh, 76px)` + *Kichik / O'rta / Katta* profillar.
- **Custom HUD Editor:** Har bir sensor tugmani barmoq bilan surib joyini, o'lchamini va shaffofligini individual sozlash, "Standartga qaytarish" va `localStorage` da saqlash.

### B. Kompyuter (Klaviatura) Boshqaruvi
- **1-O'yinchi:** `A / D` Harakat | `W` Sakrash | `S` Pastga | `J` Yengil | `K` Og'ir | `L` Skill | `Shift` Dodge | `U` Blok/Parry | `T` Taunt.
- **2-O'yinchi (Lokal):** `← / →` Harakat | `↑` Sakrash | `↓` Pastga | `Numpad 1 / N` Yengil | `Numpad 2 / M` Og'ir | `Numpad 3 / ,` Skill | `Numpad 0 / .` Dodge | `Numpad 4 / /` Blok/Parry | `Numpad 5 / ;` Taunt.

---

## 9. Audio, WebSocket Multiplayer Protokoli va PWA
- **Audio (`AudioEngine.js`):** Web Audio API protsedural sintez (zarba, qilich, olov, muz, parry, clash, KO, UI kliklar).
- **Multiplayer (`NetworkClient.js` + `server/ws-server.js`):**
  - Xabar protokoli (JSON): `PING / PONG` (har 2 soniyada real RTT o'lchash), `CREATE_ROOM`, `JOIN_ROOM`, `QUICK_MATCH`, `HERO_SELECT`, `READY`, `INPUT_STATE` (20–30Hz), `MATCH_RESULT`, `LEADERBOARD_GET`.
  - Status indikatori: Yashil (`Onlayn • 42 ms`), Sariq (`Server uyg'onmoqda...` / `Ulanmoqda...`), Kulrang (`Offlayn rejim`). Server o'chiq bo'lsa xato bermasdan avtomatik Offlayn/Bot rejimida ishlash imkoniyati.
- **PWA:** `public/manifest.json` (`display: "fullscreen"`, `orientation: "landscape"`) va `public/sw.js` (statik assetlar, atlaslar va o'yin kodini keshlash).

---

## 10. GitHub + Vercel + Render Deploy Arxitekturasi va Tayyor Fayl Andozalari

| Platforma | Papka | Vazifasi | Asosiy Sozlama |
| :--- | :--- | :--- | :--- |
| **GitHub** | `/` (Butun repo) | Yagona manba (push -> auto-deploy) | `.gitignore` orqali katta xom rasmlar chiqarib tashlanadi |
| **Vercel** | `/` (Root) | Vite Frontend, UI, PWA, Hero Atlaslari | `Build: npm run build`, `Output: dist`, Env: `VITE_WS_URL` |
| **Render** | `server/` | Node.js WebSocket Server (`ws`) | `render.yaml` Blueprint, `Start: npm start`, `Health: /health` |

### Majburiy Deploy Qoidalari:
1. **HTTPS -> `wss://` Majburiyligi:** Frontend WebSocket manzilini `import.meta.env.VITE_WS_URL` orqali oladi (`wss://arena-clash-2d-ws.onrender.com`). Lokal ishlab chiqishda default `ws://localhost:8080`.
2. **Render Free Tier Cold-Start Pre-Warm:**
   - `server/ws-server.js` bitta HTTP server ustida ham `GET /health` (`200 OK`, CORS header bilan), ham WebSocket (`ws`) ni ishlatadi.
   - Foydalanuvchi saytni ochishi bilanoq (hali Bosh Menyuda turganda) `NetworkClient.js` fonda `https://.../health` ga so'rov yuborib Render serverini oldindan uyg'otadi.
   - Server uyg'onayotgan 30–50 soniya ichida HUD da `"Server uyg'onmoqda..."` holati ko'rinadi, o'yinchi esa kutmasdan Bot yoki Lokal 2-o'yinchi rejimida o'ynab tura oladi.
3. **Origin Xavfsizligi:** `server/ws-server.js` `process.env.ALLOWED_ORIGINS` bo'yicha CORS va WebSocket origin tekshiruvini qo'llab-quvvatlaydi (bo'sh bo'lsa lokal dev uchun ruxsat beradi).

### Agent Phase 1 da Aynan Shu Mazmunda Yaratishi Shart Bo'lgan 4 ta Konfiguratsiya Fayli:

#### 1) `.gitignore`
```gitignore
node_modules/
server/node_modules/
dist/
.vercel/
.env
.env.local
.env.*.local
.DS_Store
Thumbs.db
.vscode/
.idea/

# Katta xom sprite sheetlar, arxivlar va QA fayllar (Vercel buildni tez saqlash uchun)
*.zip
raw_sheets/
public/assets/heroes/**/_qa_dark_preview.png
public/assets/heroes/**/extras/
```

#### 2) `vercel.json`
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 3) `render.yaml`
```yaml
services:
  - type: web
    name: arena-clash-2d-ws
    runtime: node
    rootDir: server
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: ALLOWED_ORIGINS
        value: https://arena-clash-2d.vercel.app
```

#### 4) `server/package.json`
```json
{
  "name": "arena-clash-2d-ws-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Arena Clash 2D real-time WebSocket multiplayer server for Render",
  "main": "ws-server.js",
  "scripts": {
    "start": "node ws-server.js",
    "dev": "node --watch ws-server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

---

## 11. Yakuniy Qabul Qilish Mezonlari (QA Checklist)
- [ ] `Space` tugmasi to'qnashuvi yo'q; P1 va P2 klaviatura tugmalari to'liq ishlaydi.
- [ ] `F3 Debug` oddiy foydalanuvchiga ko'rinmaydi (`?debug=1` bilangina ochiladi).
- [ ] Interfeys 100% sof o'zbek tilida (`src/i18n/uz.js`).
- [ ] 3 ta qahramon (`blaze_knight`, `shadow_ninja`, `frost_mage`) Sprite Atlas (`atlas.png` + `atlas.json` + `rig.json`), alohida PNG hamda Procedural Fallback zanjiri bilan 60 FPS xatosiz ishlaydi.
- [ ] Barcha 8 ta kutilmagan mexanika (Clash, Elementar reaksiyalar, Awakening, Taunt, Sinadigan platforma/Wall Bounce, Anime KO, Xaos mutatorlari, Arvoh Klon) ishlaydi.
- [ ] Attract Mode menyu, Diegetic HUD, Ghost HP Bar, Dynamic Combo, Low-HP Vignette va MVP ekrani to'liq ishlaydi.
- [ ] Mobil (360x800, 412x915 gorizontal) va Desktop ekranlarda markaziy 60–65% zona ochiq; Custom HUD Editor sozlamalari saqlanadi.
- [ ] `.gitignore`, `vercel.json`, `render.yaml`, `server/package.json`, `server/ws-server.js` (`/health` + `ws`) hamda Render cold-start pre-warm to'liq tayyor va `npm run build` xatosiz o'tadi.