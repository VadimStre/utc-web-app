# ---- Dockerfile для локального запуска приложения "База данных УТК" ----
FROM node:20-bookworm-slim

# Prisma требует openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Сначала копируем только манифест для кэширования слоёв зависимостей
COPY package.json ./

# Устанавливаем зависимости (npm, т.к. не требует lock-файла)
RUN npm install

# Копируем остальной код проекта
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

EXPOSE 3000

# Запускаем скрипт инициализации БД и dev-сервер
CMD ["sh", "docker-entrypoint.sh"]
