# Arena Clash 2D — Arxitektura, Tarmoq Model va Cheat Threat Model (Bosqich 81)

Ushbu hujjat **Arena Clash 2D** onlayn multiplayer jang arenasi arxitekturasi, server-authoritative mexanizmi, tarmoq sinxronizatsiyasi, tick rate va xavfsizlik (anti-cheat) modelini belgilab beradi.

---

## 1. Multiplayer Scope va Spetsifikatsiya

| Ko'rsatkich | Qiymat | Izoh |
| :--- | :--- | :--- |
| **Janr** | 2D Multiplayer Fighting / Brawler | 2–4 nafar o'yinchi real vaqtda arenada jang qiladi |
| **Server Tick Rate** | **30 Hz (33.33 ms / tick)** | Fizika, collision, cooldown va hit detection hisoblash chastotasi |
| **Client Render Rate** | **60–144 FPS** | Interpolatsiya (lerp) va lokal client prediction bilan to'liq silliq harakat |
| **Maksimal o'yinchilar** | 2–4 o'yinchi / xona | 1v1 duellar, 4-o'yinchili Free-For-All (FFA) yoki 2v2 |
| **Transport protokoli** | **WebSocket (Binary/JSON)** | Kam kechikishli ikki tomonlama to'liq dupleks aloqa |
| **Target Platformalar** | **Web (HTML5 Canvas)** & **Windows** | Brauzerda to'g'ridan-to'g'ri va Windows desktop ilova sifatida ishlaydi |
| **Lag Compensation oynasi**| **200 ms** | Server 200 ms gacha bo'lgan tarixiy buferni (tick history) saqlaydi |

---

## 2. Server Authority (Server Mustaqilligi)

Arena Clash 2D to'liq **Server-Authoritative** arxitekturada qurilgan:

```
+-------------------------------------------------------+
|                       SERVER                          |
|  - Fixed Update Loop (30 Ticks/sek)                  |
|  - Inputs validation (tezlik, cooldown, holat)        |
|  - Deterministic Physics & Collision                  |
|  - Lag-Compensated Hitbox Resolution                  |
|  - Health, Score, Respawn va Round Manager            |
|  - Broadcast State Snapshot (30 times/sec)            |
+---------------------------+---------------------------+
                            | WebSocket (State & Events)
         +------------------+------------------+
         |                                     |
+--------v----------------+           +--------v----------------+
|      CLIENT 1           |           |      CLIENT 2           |
|  - Client Prediction    |           |  - Entity Interpolation |
|  - Server Reconciliation|           |  - Visual/Audio SFX     |
|  - 60+ FPS Rendering    |           |  - Reconnect Support    |
+-------------------------+           +-------------------------+
```

### Server nimalarni boshqaradi va tasdiqlaydi:
1. **O'yinchi pozitsiyasi va tezligi:** Client faqat kirish tugmalarini (input: direction, jump, dash) yuboradi. Server tezlik, gravitatsiya va to'siqlar bilan to'qnashuvni o'zi hisoblaydi.
2. **Hujum va Hitbox tekshiruvi:** Hujum amalga oshirilganda, server hujumchining joriy cooldown holatini, animatsiya bosqichini va nishonning o'sha paytdagi pozitsiyasini tekshiradi (Lag Compensation).
3. **Jon (HP), shikastlanish va o'lim:** Client hech qachon o'zining yoki raqibining jonini o'zgartira olmaydi.
4. **Vaqt va Raundlar:** Raund boshlanishi, 60 soniyalik taymer, hisob (score) va g'alaba serverda hal qilinadi.
5. **Matchmaking va Reyting (MMR):** Match yakunida Elo tizimi bo'yicha g'olib/mag'lub reytingi server bazasida yangilanadi.

---

## 3. Client Prediction va Server Reconciliation

- **Prediction:** Foydalanuvchi WASD yoki J/K/L/Space bosganda, o'yin sekinlashmasligi (snappy responsiveness) uchun klient kiritilgan buyruqni darhol o'zida ijro etadi va `sequence_id` bilan navbatga (unacknowledged input buffer) qo'yadi.
- **Reconciliation:** Serverdan har bir tickda kelgan haqiqiy `state` klientdagi bashorat qilingan pozitsiya bilan solishtiriladi:
  - Agar farq $E < \epsilon$ (2-3 piksel) bo'lsa, xatolik silliq to'g'irlanadi.
  - Agar farq katta bo'lsa (masalan devorga urilish yoki stun holati), klient o'z pozitsiyasini server pozitsiyasiga qaytaradi va hali tasdiqlanmagan kirishlarni qaytadan ijro etadi (replay).
- **Interpolation:** Boshqa (remote) o'yinchilarning harakati 100 ms lik bufer bilan silliq `lerp` yordamida chiziladi.

---

## 4. Cheat Threat Model va Himoya Mexanizmlari

| Xavf (Threat) | Hujum usuli | Serverdagi himoya mexanizmi (Mitigation) |
| :--- | :--- | :--- |
| **Speed Hack** | Klient tezlik qiymatini sun'iy oshirib yuboradi | Server har bir tickda maksimal ruxsat etilgan siljishni $(\Delta x_{max} = v_{max} \cdot \Delta t)$ tekshiradi. Agar oshsa, ortiqcha siljish kesiladi (clamped). |
| **Teleport Hack** | Klient kutilmaganda xaritada uzoq nuqtaga sakraydi | Server harakat uzluksizligini tekshiradi. Agar devor orqali yoki haddan tashqari masofaga sakrash bo'lsa, server uni rad etadi va haqiqiy koordinataga qaytaradi. |
| **Cooldown Bypass** | Klient maxsus skillni cooldown tugamasdan qayta-qayta yuboradi | Har bir qahramonning qobiliyatlari uchun server o'zida `cooldownExpiresAt` taymerini ushlaydi. Vaqt yetmasdan kelgan buyruq bekor qilinadi. |
| **Hitbox Spoofing** | Klient "men raqibga 50 metr uzoqlikdan pichoq urdim" deb xabar beradi | Klient shikastlanish haqida buyruq yubora olmaydi! Klient faqat `attack` tugmasini yuboradi. Hitbox o'lchami, yo'nalishi va to'qnashuvi 100% serverda hisoblanadi. |
| **God Mode (Infinite HP)** | Klient o'z HP ko'rsatkichini muzlatib qo'yadi | HP faqat server xotirasida mavjud. Klientdagi HP faqat ko'rsatish (rendering) uchun mo'ljallangan. |
| **Input Replay & Flooding** | Klient sekundiga 10,000 ta paket jo'natib serverni qotirishga urinadi | Rate-limiting (har bir client uchun maksimal 60 input/sek). Ortiqcha paketlar tashlab yuboriladi. |
| **Ghost Disconnect** | O'yinchi mag'lub bo'layotganda brauzerni yopadi | 30 soniyalik Reconnect oynasi beriladi. Agar qaytmasa, avtomatik texnik mag'lubiyat yoziladi va MMR kamaytiriladi. |

---

## 5. Reconnection Arxitekturasi

1. Har bir o'yinchiga autentifikatsiya vaqtida unikal `sessionToken` beriladi.
2. Tarmoq uzilsa yoki sahifa yangilansa, klient `reconnect` so'rovi va `sessionToken`ni yuboradi.
3. Server xonadagi o'sha o'yinchi o'rnini saqlab turadi (30 soniya davomida o'yinchi bot/idle holatida turadi).
4. Qayta ulanganda server joriy to'liq o'yin holatini (Full Snapshot) yuboradi va o'yin davom etadi.
