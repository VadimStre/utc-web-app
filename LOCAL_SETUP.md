# Локальный запуск приложения «База данных УТК»

Это веб-приложение на **Next.js 14** с базой данных **PostgreSQL** и ORM **Prisma**.
Ниже — подробная инструкция по запуску на вашем ноутбуке (**Windows / macOS / Linux**).

Есть два способа запуска:

- **Способ A — Docker (самый простой).** Одна команда, ничего кроме Docker ставить не нужно. **Рекомендуется.**
- **Способ B — вручную (Node.js + PostgreSQL).** Больше шагов, но не требует Docker.

Выберите любой из них.

---

## Способ A. Запуск через Docker (рекомендуется)

### Шаг 1. Установите Docker Desktop

- **Windows / macOS:** скачайте и установите **Docker Desktop** с официального сайта:
  https://www.docker.com/products/docker-desktop/
  После установки **запустите Docker Desktop** и дождитесь, пока значок кита в трее станет зелёным/стабильным.
- **Linux (Ubuntu/Debian):** установите Docker Engine и плагин compose:
  ```bash
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo systemctl enable --now docker
  # чтобы запускать docker без sudo (нужно перелогиниться после команды):
  sudo usermod -aG docker $USER
  ```

Проверьте, что Docker работает:
```bash
docker --version
docker compose version
```

### Шаг 2. Распакуйте архив проекта

Распакуйте `utc_web_app_local.zip` в удобную папку и откройте терминал (командную строку) **внутри распакованной папки** — там, где лежат файлы `docker-compose.yml` и `package.json`.

- **Windows:** откройте папку в Проводнике → в адресной строке введите `cmd` и нажмите Enter (или используйте PowerShell / Терминал Windows).
- **macOS/Linux:** откройте Terminal и перейдите в папку командой `cd путь/к/папке`.

### Шаг 3. Запустите одну команду

```bash
docker compose up --build
```

Что произойдёт автоматически:
1. Скачается и запустится PostgreSQL.
2. Соберётся образ приложения и установятся зависимости.
3. Создадутся таблицы в базе (Prisma `db push`).
4. База заполнится тестовыми записями УТК.
5. Запустится сервер.

Первый запуск может занять несколько минут (скачивание образов и установка пакетов). Дождитесь строки вида:
```
✓ Ready in ... ms
```

### Шаг 4. Откройте приложение

Перейдите в браузере по адресу:

**http://localhost:3000**

### Управление

- **Остановить** приложение: нажмите `Ctrl + C` в терминале, затем при желании:
  ```bash
  docker compose down
  ```
- **Запустить снова** (без пересборки): `docker compose up`
- **Полностью удалить данные базы** (сброс к нулю): `docker compose down -v`
- Подключиться к базе внешним клиентом (pgAdmin/DBeaver): хост `localhost`, порт `5432`, база `utc_db`, пользователь `utc_user`, пароль `utc_password`.

> Если порт `3000` или `5432` уже занят на вашем компьютере, измените левое число в проброс-портах в файле `docker-compose.yml` (например, `"3001:3000"`) и откройте `http://localhost:3001`.

---

## Способ B. Запуск вручную (Node.js + PostgreSQL)

### Шаг 1. Установите Node.js (версия 18 или 20 LTS)

- **Windows / macOS:** скачайте установщик LTS с https://nodejs.org/ и установите.
  - *(macOS через Homebrew, по желанию:)* `brew install node@20`
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

Проверьте установку:
```bash
node -v      # должно быть v18.x или v20.x
npm -v
```

### Шаг 2. Установите PostgreSQL

- **Windows:** скачайте установщик с https://www.postgresql.org/download/windows/
  При установке задайте пароль для пользователя `postgres` и запомните его. Порт оставьте `5432`.
- **macOS (Homebrew):**
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install -y postgresql
  sudo systemctl enable --now postgresql
  ```

### Шаг 3. Создайте базу данных и пользователя

Откройте консоль PostgreSQL и выполните команды.

- **Linux/macOS:**
  ```bash
  sudo -u postgres psql        # на macOS с Homebrew просто: psql postgres
  ```
- **Windows:** запустите приложение **SQL Shell (psql)** из меню «Пуск» (войдите под пользователем `postgres` и его паролем).

Внутри `psql` выполните:
```sql
CREATE USER utc_user WITH PASSWORD 'utc_password';
CREATE DATABASE utc_db OWNER utc_user;
GRANT ALL PRIVILEGES ON DATABASE utc_db TO utc_user;
\q
```

> Можно использовать и существующего пользователя `postgres` — тогда в шаге 4 укажите его имя и пароль в строке подключения.

### Шаг 4. Настройте файл `.env`

В корне проекта скопируйте пример окружения в рабочий файл `.env`:

- **macOS/Linux:**
  ```bash
  cp .env.example .env
  ```
- **Windows (cmd):**
  ```bat
  copy .env.example .env
  ```

Откройте `.env` в текстовом редакторе и убедитесь, что строка подключения соответствует вашей базе. Для параметров из шага 3 подойдёт значение по умолчанию:
```
DATABASE_URL="postgresql://utc_user:utc_password@localhost:5432/utc_db?connect_timeout=15"
```
Если вы используете другого пользователя/пароль/базу — поправьте значения.

### Шаг 5. Установите зависимости

В терминале, находясь в папке проекта (где лежит `package.json`):
```bash
npm install
```
> Проект также поддерживает Yarn (`yarn install`), но `npm install` работает без дополнительных настроек.

### Шаг 6. Инициализируйте базу через Prisma

```bash
npx prisma generate      # сгенерировать Prisma Client
npx prisma db push       # создать таблицы в базе по схеме
npx prisma db seed       # (необязательно) заполнить тестовыми записями
```

### Шаг 7. Запустите сервер разработки

```bash
npm run dev
```

Откройте в браузере: **http://localhost:3000**

### Сборка и запуск в «боевом» режиме (по желанию)

```bash
npm run build
npm run start
```

---

## Полезные команды

| Действие | Команда |
|---|---|
| Просмотр данных в браузере (Prisma Studio) | `npx prisma studio` |
| Пересоздать таблицы по схеме | `npx prisma db push` |
| Заполнить тестовыми данными | `npx prisma db seed` |
| Запуск dev-сервера | `npm run dev` |
| Сборка production | `npm run build` |
| Запуск production | `npm run start` |

---

## Частые проблемы

- **`Error: P1001: Can't reach database server`** — база данных не запущена или неверный `DATABASE_URL`. Проверьте, что PostgreSQL/Docker запущен и данные подключения совпадают с `.env`.
- **`Port 3000 is already in use`** — порт занят. Запустите на другом порту: `npm run dev -- -p 3001` (или измените порт в `docker-compose.yml` для Docker).
- **`Port 5432 is already in use` (Docker)** — на компьютере уже стоит локальный PostgreSQL. Измените проброс в `docker-compose.yml`, например `"5433:5432"`.
- **Prisma не находит клиент** — выполните `npx prisma generate`.
- **Ошибки прав на `docker-entrypoint.sh` (Linux)** — при необходимости выдайте права: `chmod +x docker-entrypoint.sh`.

---

## Структура проекта (кратко)

```
app/                     # Страницы и API-роуты Next.js (App Router)
  api/utc/               # REST API для записей УТК (CRUD + экспорт)
  page.tsx               # Главная страница
  layout.tsx             # Корневой layout
components/              # React-компоненты (форма, таблица, фильтры и UI-кит)
lib/                     # Подключение к БД (Prisma) и утилиты
prisma/schema.prisma     # Схема базы данных (модель UTCRecord)
scripts/seed.ts          # Скрипт заполнения тестовыми данными
docker-compose.yml       # Запуск через Docker (app + PostgreSQL)
Dockerfile               # Образ приложения
.env.example             # Пример файла окружения
```
