# Arena Clash 2D — Serverni Deploy Qilish va Monitoring Bo'yicha Qo'llanma (Bosqich 90)

Ushbu qo'llanma **Arena Clash 2D** serverini Linux VPS, Docker yoki bulutli xizmatlarda (Render, Railway, Heroku, AWS, DigitalOcean) ishlab chiqarish (production) muhitida deploy qilish, monitoring qilish va loglarni boshqarish bo'yicha ko'rsatmalarni o'z ichiga oladi.

---

## 1. Minimal Server Talablari

- **OS:** Ubuntu 22.04 LTS / Debian 12 / Alpine Linux (yoki Windows Server)
- **Node.js:** v18.0.0 yoki v20 LTS+
- **CPU:** 1 vCPU (300+ faol o'yinchilar uchun yetarli)
- **RAM:** 512 MB – 1 GB
- **Disk:** 5 GB SSD (Match replays va foydalanuvchilar ma'lumotlari uchun)

---

## 2. Docker orqali Deploy qilish (Tavsiya etiladi)

Eng tez va qulay usul:

```bash
# 1. Repozitoriyni serverga yuklash
git clone <repo-url> arena-clash
cd arena-clash

# 2. Docker va Docker Compose orqali ishga tushirish
docker-compose up -d --build

# 3. Konteyner holatini tekshirish
docker-compose ps
docker-compose logs -f
```

---

## 3. Ubuntu / Linux VPS-da PM2 orqali Deploy qilish

### A. Tizim paketlarini o'rnatish:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git

# PM2 jarayon boshqaruvchisini global o'rnatish
sudo npm install -g pm2
```

### B. Loyihani sozlash va ishga tushirish:
```bash
git clone <repo-url> arena-clash
cd arena-clash

npm install --production

# PM2 yordamida serverni fon rejimida yoqish
pm2 start server/index.js --name "arena-clash"

# Server qayta yuklanganda (reboot) avtomatik yoqilish
pm2 startup
pm2 save
```

### C. Monitoring va Loglarni ko'rish:
```bash
# Jonli loglarni ko'rish
pm2 logs arena-clash

# CPU, RAM va faol jarayonlarni ko'rish
pm2 monit
```

---

## 4. Nginx Reverse Proxy va SSL (WebSocket Qo'llab-quvvatlash)

WebSocket protokoli to'g'ri ishlashi uchun Nginx konfiguratsiyasiga `Upgrade` va `Connection` sarlavhalari qo'shilishi shart:

`/etc/nginx/sites-available/arenaclash.conf`:
```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name arena.misol.uz; # O'z domeningiz

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket sarlavhalari
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeoutlari (uzilib qolmasligi uchun)
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

SSL sertifikatini o'rnatish (Let's Encrypt Certbot):
```bash
sudo certbot --nginx -d arena.misol.uz
```

---

## 5. Monitoring REST API va Metrikalar

Server quyidagi monitoring endpointlariga ega:

| Endpoint | Metod | Tavsif |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Server holati, uptime va faol xonalar/o'yinchilar soni |
| `/api/leaderboard` | `GET` | Eng yuqori MMR reytingiga ega top o'yinchilar |
| `/api/replays` | `GET` | Saqlangan match replays ro'yxati va metama'lumotlari |
| `/api/replays/:id` | `GET` | Muayyan matchning tick-by-tick to'liq replayi |

Misol `/api/status` natijasi:
```json
{
  "status": "online",
  "uptime": 1420.5,
  "stats": {
    "totalRooms": 4,
    "totalPlayers": 8,
    "inGameRooms": 3
  }
}
```

---

## 6. Favqulodda Holatlar (Disaster Recovery & Backup)

- Foydalanuvchilar va match tarixlari `data/database.json` faylida saqlanadi.
- Match replays `data/replays/` papkasida saqlanadi.
- Har kuni ushbu papkalarni zaxira nusxalash (backup) yetarli:
  ```bash
  tar -czvf arena_backup_$(date +%F).tar.gz ./data
  ```
