# Node.js Alpine asosidagi yengil konteyner
FROM node:20-alpine

WORKDIR /app

# Bog'liqliklarni o'rnatish
COPY package*.json ./
RUN npm ci --only=production

# Dastur kodlarini ko'chirish
COPY . .

# Server porti
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Serverni ishga tushirish
CMD ["node", "server/index.js"]
