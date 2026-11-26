# Arena Clash 2D v3.2 — To'liq Avtonom Amalga Oshirish Rejasi (PLAN)

> **ANTIGRAVITY AGENT UCHUN TO'LIQ AVTONOM REJIM (UNATTENDED / ZERO-PERMISSION):**
> 1. **RUXSAT SO'RAMA VA TO'XTAMA:** `Phase 1` dan `Phase 8` gacha barcha bosqichlarni **bitta uzluksiz sessiyada, foydalanuvchidan hech qanday tasdiq yoki savol so'ramasdan** mustaqil bajar.
> 2. **AVTOMATIK QAROR QABUL QIL:** Har qanday noaniq texnik detalda eng zamonaviy va barqaror muhandislik yechimini `spec.md` doirasida o'zing tanla.
> 3. **O'ZINI O'ZI TUZATISH (SELF-HEALING):** Build, sintaksis yoki runtime tekshiruvida xato chiqsa, darhol o'zing tashxis qo'y va tuzat (zarurat bo'lsa 3 martagacha qayta tekshir).
> 4. **MODULLI MONOREPO ARXITEKTURA:** Kodni bitta faylga jamlama — `spec.md` 2-bo'limidagi papka va fayl nomlariga qat'iy rioya qil. Frontend (Vercel) va Backend (`server/`, Render) bog'liqliklarini aralashtirma.
> 5. **YAKUNIY HISOBOT:** Faqat barcha 8 ta bosqich yakunlanib, `npm run build` va `node --check server/ws-server.js` xatosiz o'tgandan keyingina bitta qisqa yakuniy hisobot chiqar.

---

## Phase 1: Monorepo Arxitekturasi, Deploy Konfiguratsiyalari, i18n va Asosiy Xatolar
**Avtonom vazifalar:**
- [ ] Mavjud loyiha fayllarini skanerlash va `spec.md` 2-bo'limidagi barcha papkalarni yaratish (`public/assets/heroes/`, `src/core/`, `src/entities/`, `src/systems/`, `src/render/`, `src/ui/`, `src/net/`, `src/i18n/`, `server/`, `tools/`).
- [ ] `spec.md` 10-bo'limidagi tayyor andozalar asosida `.gitignore`, `vercel.json`, `render.yaml` va `server/package.json` fayllarini aynan ko'rsatilgan tarkibda yaratish (yoki yangilash).
- [ ] `src/i18n/uz.js`: Barcha menyu, HUD, 3 qahramon nomi/tavsifi/skillari, mutatorlar, MVP statistikasi, server holatlari (`"Server uyg'onmoqda..."`) va sozlama matnlarini 100% sof o'zbek tilida yozish.
- [ ] `SettingsManager.js`: Grafika sifati (`low/medium/high`), ovoz balandligi, sensor rejim, power-up va Custom HUD joylashuvini `localStorage` da saqlash/yuklash.
- [ ] `GameLoop.js`: 60Hz fixed-timestep fizika sikli, interpolatsiyali render, `timeScale` (Slow-Mo) va `hitstopTimer`.
- [ ] `InputManager.js`: `Space` to'qnashuvini yo'qotish (`W` — Sakrash, `Shift` — Dodge), P1 va Lokal P2 to'liq boshqaruvlari (`Parry`, `Taunt`), `120ms` Input Buffering va `100ms` Coyote Time.
- [ ] `heroes.config.js`: Uchala qahramon (`blaze_knight`, `shadow_ninja`, `frost_mage`) uchun `spec.md` 3 va 4-bo'limdagi to'liq balans, rang palitrasi, hitbox/hurtbox va pivot konfiguratsiyasini kiritish.
- [ ] `F3 Debug` ni faqat `?debug=1` URL parametriga bog'lash.
- **Avto-tekshiruv:** Importlar va 4 ta deploy konfiguratsiya fayli toza, avtomatik `Phase 2` ga o'tish.

---

## Phase 2: AAA Sprite Atlas Yuklovchi, 2D Skelet va Procedural Fallback
**Avtonom vazifalar:**
- [ ] `AssetLoader.js`: 3 bosqichli xavfsiz yuklash zanjirini yozish:
  1. `public/assets/heroes/heroes_rig_manifest.json` hamda har qahramon uchun `atlas.png` + `atlas.json` + `rig.json` ni yuklash (1 HTTP so'rov / qahramon).
  2. Atlas topilmasa `head.png`, `torso.png`, `arm_upper.png`, `arm_lower.png`, `leg_upper.png`, `leg_lower.png`, `weapon.png`, `cape.png` fayllarini yuklash.
  3. Assetlar hali qo'yilmagan bo'lsa, xato bermasdan `mode: 'procedural'` ga o'tish.
- [ ] `SkeletonRig.js`: `pelvis` ildizli 8 qismli bo'g'imlar iyerarxiyasi, `rig.json` dan pivot va burchaklarni o'qish, silliq burchak interpolatsiyasi, 5 nuqtali Verlet plash/sharf/mantiya fizikasi va Weapon Ribbon Trail.
- [ ] `FighterRenderer.js`:
  - Atlas (`drawImage` source-rect) va alohida PNG rejimlarida Z-order bo'yicha chizish.
  - Procedural rejimda barcha 3 qahramon uchun yuqori detallashgan "Dark Semi-Realism" chizma.
  - Elementar Rim Lighting, balandlikka mos yer soyasi, `80ms` Hit Flash, Squash & Stretch va barcha FSM holat animatsiyalari (`IDLE`, `RUN`, `JUMP`, `ATTACK` 3 faza, `DODGE`, `BLOCK`, `PARRY`, `CLASH`, `TAUNT`, `HITSTUN`, `KO`).
- **Avto-tekshiruv:** Uchala qahramon ham assetlar bilan, ham assetsiz konsol xatolarisiz 60 FPS animatsiyalanadi, avtomatik `Phase 3` ga o'tish.

---

## Phase 3: 2.5D Parallax Arenalar, Kamera, "Game Feel" va Web Audio
**Avtonom vazifalar:**
- [ ] `ArenaRenderer.js`: 3 qatlamli 2.5D Parallax fon va 2 ta tanlanadigan arena (*Olovli Qal'a*, *Muzli Ibodatxona*) + dinamik bloom yorug'ligi.
- [ ] `Camera.js`: Dinamik zoom (`0.85x–1.25x`), smooth follow, yo'nalishli screen shake va KO fokus zoom.
- [ ] `ParticleSystem.js`: Object pooling asosida uchqunlar, olov cho'g'lari, muz bo'laklari, qadam changi, bug' buluti, tutun va suzuvchi zarar raqamlari.
- [ ] `Fighter.js` + `Projectile.js` + `ArenaObjects.js`: 3-hit combo, Stamina tizimi, Perfect Parry (`0.2s` -> `0.6s` stun), Hitstop (`45–80ms`) va har `15s` da markaziy Power-up sferalari.
- [ ] `AudioEngine.js`: Web Audio API yordamida barcha jang (zarba, qilich, olov, muz, parry, clash, KO) va UI klik tovushlarini sintez qilish.
- **Avto-tekshiruv:** Fizika, zarba va audio modullari xatosiz bog'langan, avtomatik `Phase 4` ga o'tish.

---

## Phase 4: 8 ta Kutilmagan ("Wow") Jang Mexanikasi va Xaos Rejimi
**Avtonom vazifalar:**
- [ ] `CombatSystems.js`:
  - **Weapon Clash:** `150ms` oynada `K`/`L` to'qnashganda `1.5s` `0.25x` slow-mo, chaqmoq uchqunlari va tugma bosish dueli (`18 dmg` + kuchli knockback).
  - **Elementar Reaksiyalar:** Olov + Muz -> `3s` ko'rishni to'suvchi Bug' buluti; Soya + Olov -> `2.5s` yonuvchi tutun (`3 dmg/s`).
  - **Wall Bounce:** Arena chetiga kuchli urilganda devordan sakrab qaytish.
- [ ] `Fighter.js`:
  - **Awakening / Rage:** HP `20%` dan pastda avtomatik aura, yorqin ko'zlar va `+15%` zarba kuchi.
  - **Risky Taunt:** `1.5s` chorlov (zarba yesa `2x` zarar, omon qolsa Skill cooldown = 0).
- [ ] `ArenaObjects.js`: 3 ta kuchli zarbada sinib tushadigan va `10s` da qayta tiklanadigan yon platformalar.
- [ ] `FighterRenderer.js` + `Camera.js`: **Anime KO Finisher** (`1.0s` `0.2x` slow-mo, keskin zoom, `0.35s` qora-qizil manga siluet).
- [ ] `MutatorSystem.js`: **Xaos Rejimi** — *Zulmat* (radial light mask), *Oy Gravitatsiyasi* (50%), *Ko'tarilayotgan Lava* (oxirgi `15s`, `10 dmg/s`).
- **Avto-tekshiruv:** Barcha 8 mexanika ziddiyatsiz integratsiya qilingan, avtomatik `Phase 5` ga o'tish.

---

## Phase 5: Professional Dizayn Tizimi, Lobby (Attract Mode), Diegetic HUD va MVP
**Avtonom vazifalar:**
- [ ] CSS Dizayn Tizimi: `6–10` daraja Dynamic Skew, 60–30–10 rang tokenlari, `tabular-nums` raqamlar va taktil tugma mikro-animatsiyalari (`scale` + sheen + SFX).
- [ ] `MenuManager.js`:
  - **Attract Mode:** Bosh menyu ortida xiralashtirilgan arenada 2 ta AI botning jonli jangi.
  - **Toza Lobby:** Markaziy "JANGNI BOSHLASH", rejim kartalari va yuqori burchakda ixcham Profil/Reyting/Replay/Sozlamalar modallari.
  - **Qahramon tanlash:** 3 qahramon uchun jonli mini-canvas preview + qahramon elementiga qarab almashuvchi fon zarralari + to'liq balans/cooldown kartasi.
  - **MVP Ekrani:** Eng uzun kombo, Parry soni, jami zarar, aniqlik %, jonli MMR chizig'i va 1 bosishda Tezkor Revansh.
  - **Minimalist Pauza:** Xira fon, klaviatura eslatmasi (faqat shu yerda), ovoz va grafika sozlamalari.
- [ ] `HUD.js`:
  - Markaziy `60–65%` maydonni mutlaqo bo'sh qoldiruvchi chekka joylashuv.
  - Qiyshiq Ghost Health Bar (`0.4s` kechikish), yonuvchi raund olmoslari, `RAUND 1 — JANG!` banneri.
  - **Diegetic UI:** Personaj yonida mini stamina chizig'i va Skill tayyor bo'lganda qurol chaqnashi.
  - **Dinamik Combo Counter** (parchalanish animatsiyasi bilan), **Low-HP Vignette** (`<25%`) va **Off-screen raqib strelkasi**.
- **Avto-tekshiruv:** Barcha matnlar `uz.js` dan olinadi, layout toza, avtomatik `Phase 6` ga o'tish.

---

## Phase 6: Avtomatik Sensor Tugmalar va Custom HUD Editor
**Avtonom vazifalar:**
- [ ] `TouchControls.js`:
  - Sensor qurilmani avtomatik aniqlash + `env(safe-area-inset-*)` himoyasi.
  - Chapda suzuvchi (yoki fiksirlangan) virtual joystik, o'ngda ergonomik yoy (arc) tugmalar: Attack, Heavy, Skill, Dodge, Jump, Parry va Taunt.
  - Aylanma cooldown indikatori, `navigator.vibrate(15)`, `clamp(48px, 11dvh, 76px)` masshtab + Kichik/O'rta/Katta profillar.
  - Portrait rejimda ekranni burish bo'yicha oqlangan overlay.
- [ ] `HudEditor.js`:
  - Sozlamalar ichida har bir sensor tugmani barmoq bilan surib joyini, o'lchamini va shaffofligini individual sozlash, "Standartga qaytarish" va `localStorage` da saqlash.
- **Avto-tekshiruv:** Mobil va desktop rejimlar xatosiz almashadi, avtomatik `Phase 7` ga o'tish.

---

## Phase 7: Aqlli Bot, "Arvoh Klon" AI, Replay va Render WebSocket Multiplayer
**Avtonom vazifalar:**
- [ ] `BotAI.js`: 3 darajali AI (Oson / O'rta / Qiyin) — masofa nazorati, snaryaddan sakrash, parry, combo, power-up va lavadan qochish.
- [ ] `ReplaySystem.js` + `BotAI.js`:
  - Oxirgi 5 ta jang replayini `localStorage` da saqlash va ijro etish.
  - **Shadow Clone AI:** Oxirgi 3 ta jang profilidan o'yinchining shaffof klonini yaratish.
- [ ] `server/ws-server.js`:
  - Node.js `http` + `ws` server: `GET /health` (`200 OK` + CORS), `ALLOWED_ORIGINS` tekshiruvi, `PORT = process.env.PORT || 8080`.
  - Xona yaratish (`CREATE_ROOM`), kod bilan qo'shilish (`JOIN_ROOM`), tezkor matchmaking (`QUICK_MATCH`), `HERO_SELECT`, `READY`, `INPUT_STATE`, `MATCH_RESULT`, in-memory Leaderboard va `PING/PONG`.
- [ ] `NetworkClient.js`:
  - `import.meta.env.VITE_WS_URL` (`wss://...`) ulanishi.
  - Sayt ochilishi bilan fonda `https://.../health` ga **Render cold-start pre-warm** so'rovi yuborish.
  - Real RTT ping (ms), status indikatori (`Onlayn • 42 ms` / `Server uyg'onmoqda...` / `Offlayn rejim`) va server javob bermaganda xatosiz Offlayn fallback.
- **Avto-tekshiruv:** `node --check server/ws-server.js` o'tadi, offlayn rejimlar xatosiz ishlaydi, avtomatik `Phase 8` ga o'tish.

---

## Phase 8: Grafika Rejimlari, PWA, Production Build va Yakuniy QA
**Avtonom vazifalar:**
- [ ] Past / O'rta / Yuqori grafika rejimlarini `ArenaRenderer`, `ParticleSystem` (pool chegaralari), Verlet plash va `devicePixelRatio` (`1 / 1.5 / 2`) ga to'liq bog'lash.
- [ ] `public/manifest.json` va `public/sw.js` yaratish (PWA to'liq ekranli o'rnatish va offlayn kesh).
- [ ] `npm run build` va `node --check server/ws-server.js` buyruqlarini ishga tushirib, chiqqan har qanday xatoni to'liq bartaraf etish.
- [ ] `spec.md` 11-bo'limdagi barcha **QA Checklist** bandlarini tekshirish va yakuniy hisobot berish.

---

## Antigravity uchun Yagona Avtonom Buyruq (One-Shot Master Prompt)

Quyidagi buyruqni bir marta yuboring — agent ruxsat so'ramasdan `Phase 1` dan `Phase 8` gacha barcha ishni yakunlaydi:

> **"Loyiha ildizidagi `spec.md` va `plan.md` fayllarini to'liq o'qib chiq. TO'LIQ AVTONOM REJIMDA (hech qanday bosqichda ruxsat, tasdiq yoki savol so'ramasdan) `Phase 1` dan `Phase 8` gacha barcha vazifalarni bitta uzluksiz sessiyada oxirigacha bajar. `spec.md` 10-bo'limidagi andozalar asosida `.gitignore`, `vercel.json`, `render.yaml` va `server/package.json` ni avtomatik yarat. Qahramonlar uchun `public/assets/heroes/` dagi `heroes_rig_manifest.json` + `atlas.png` + `atlas.json` + `rig.json` ni 1-ustuvorlikda, individual PNG ni 2-ustuvorlikda va Procedural Fallback ni 3-ustuvorlikda ishlaydigan qilib ula. Har qanday build, import yoki runtime xatosini o'zing mustaqil tuzat. Faqat barcha 8 bosqich yakunlanib, `npm run build` va `node --check server/ws-server.js` xatosiz o'tgach yakuniy hisobot ber."**