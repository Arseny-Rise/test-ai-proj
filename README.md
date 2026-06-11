# Мой Todo — задачи и заметки

Личное PWA-приложение в стиле TickTick: **задачи** со списками, дедлайнами и подзадачами + **заметки** с текстом и чеклистами. Работает офлайн, синхронизируется при появлении сети.

## Возможности

- Inbox, списки, фильтры «Сегодня» / «Все» / «Выполненные»
- Подзадачи, приоритет, дедлайн
- Заметки с TipTap-редактором (текст, заголовки, чеклисты)
- Офлайн через IndexedDB + очередь синхронизации
- PWA: установка на главный экран телефона и ПК
- Тёмная и светлая тема

## Локальная разработка

### 1. PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Переменные окружения

```bash
cp .env.example .env
```

Отредактируйте `.env`: задайте `APP_PASSWORD` и `JWT_SECRET`.

### 3. Установка и запуск

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) и войдите с паролем из `APP_PASSWORD`.

## Деплой на Railway (бесплатно)

Railway — бесплатный хостинг с Docker и PostgreSQL. Подходит для этого проекта.

### 1. Подготовка

1. Создайте репозиторий на [GitHub](https://github.com) и запушьте код:

```bash
git remote add origin https://github.com/<ваш-юзернейм>/todo-app.git
git push -u origin main
```

2. Зарегистрируйтесь на [Railway](https://railway.app) (через GitHub).

### 2. Деплой

1. В Railway Dashboard нажмите **New Project** → **Deploy from GitHub repo**
2. Выберите ваш репозиторий
3. Railway автоматически обнаружит `Dockerfile` и начнёт сборку

### 3. PostgreSQL

1. В проекте Railway нажмите **New** → **Database** → **PostgreSQL**
2. Railway автоматически добавит переменную `DATABASE_URL` в окружение

### 4. Переменные окружения

В Railway Dashboard (`Variables`) добавьте:

| Variable | Значение |
|----------|----------|
| `JWT_SECRET` | длинная случайная строка (например, `openssl rand -base64 32`) |
| `APP_PASSWORD` | ваш пароль для входа в приложение |

### 5. Домен

1. В разделе **Settings** → **Domains** → **Generate Domain**
2. Или подключите свой домен

Готово! Приложение будет доступно по сгенерированному URL.

> Миграции БД (`prisma migrate deploy`) запускаются автоматически при старте контейнера.

## Деплой на VPS в РФ

Подходит Timeweb Cloud, Selectel, Yandex Cloud и другие.

### 1. Подготовка сервера

- Ubuntu 22.04+, Docker и Docker Compose
- Домен с A-записью на IP сервера (для HTTPS)

### 2. Настройка

```bash
git clone <ваш-репозиторий> todo-app
cd todo-app
cp .env.example .env
```

В `.env` укажите:

| Переменная | Описание |
|------------|----------|
| `APP_PASSWORD` | Ваш пароль для входа |
| `JWT_SECRET` | Длинная случайная строка |
| `POSTGRES_PASSWORD` | Пароль БД |
| `DOMAIN` | Домен, например `todo.example.ru` |
| `ACME_EMAIL` | Email для Let's Encrypt |

### 3. Запуск

```bash
docker compose up -d --build
```

Caddy автоматически получит HTTPS-сертификат.

### 4. PWA на телефоне

1. Откройте `https://ваш-домен` в Chrome/Safari
2. Войдите по паролю
3. «Добавить на главный экран» / «Установить приложение»

## Архитектура

- **Next.js** — UI и API
- **PostgreSQL + Prisma** — серверное хранилище
- **Dexie (IndexedDB)** — офлайн-кэш
- **Serwist** — service worker и PWA
- **TipTap** — редактор заметок

Синхронизация: изменения сразу пишутся локально, очередь отправляется на `POST /api/sync`, дельта подтягивается через `GET /api/sync?since=`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run build` | Сборка |
| `npm run start` | Продакшен |
| `npm run db:migrate` | Миграции Prisma |
