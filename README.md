# ProofFlow (`proofflow`)

> **Статус:** 🟢 Релиз-кандидат v0.1.0-beta  
> **Миссия:** Автоматическая AI-упаковка сырых артефактов (созвонов, видео, переписок и скриншотов) в продающие B2B-кейсы и интерактивные виджеты социального доказательства.

---

## 1. Архитектура проекта и пакеты

Репозиторий устроен как модульный монорепозиторий из четырёх ключевых компонентов:

```
proofflow/
├── src/                  # Web SPA (React 19, Vite, Tailwind CSS, Feature-Sliced Design)
│   ├── app/              # Инициализация приложения, провайдеры, роутер с error boundaries
│   ├── pages/            # Маршруты: лендинг, вход, кейсы, админка, юридические страницы
│   ├── widgets/          # Составные блоки интерфейса (хедер, футер, карточки кейсов)
│   ├── features/         # Бизнес-фичи: загрузка, ревью, публикация, заявки, онбординг
│   ├── entities/         # Модели данных и валидация Zod (кейсы, пользователи, инвайты)
│   └── shared/           # API-клиенты, дизайн-система, утилиты, токены, защита от моков
├── functions/            # Бэкенд Cloud Functions v2 (Node.js 22, TypeScript)
│   ├── src/application/  # Сценарии: запуск пайплайна, подтверждение линка, публикация
│   ├── src/domain/       # Лимиты, схемы данных, типы
│   ├── src/infrastructure# Адаптеры Gemini (Vertex AI), Whisper, Claude, Firestore, Storage
│   └── src/interfaces/   # Триггеры Firestore, HTTP эндпоинты, Callable-функции
├── bot/                  # Telegram-бот сервиса (grammY, TypeScript, архитектура слоев)
│   ├── src/app/          # Бот-инстанс, middleware, валидатор продакшен-конфигурации
│   ├── src/features/     # Сценарии: заявка, поддержка (24ч), банк идей, FAQ, команды
│   ├── src/entities/     # Модели SupportTicket, Idea, IdeaVote, BetaApplication
│   └── src/shared/       # Тексты, клавиатуры, репозитории (Firestore + In-Memory)
├── embed/                # Легковесный встраиваемый виджет embed.js (Vite IIFE, 2.09 KB gzip)
├── firestore.rules       # Правила безопасности Firestore (Default Deny, закрытые коллекции)
├── storage.rules         # Правила безопасности Cloud Storage (проверка владельца и MIME)
├── firestore.indexes.json# Составные индексы Firestore
├── firebase.json         # Конфигурация Firebase CLI, регион us-central1, rewrites
└── docs/                 # Документация и чеклисты релиза
```

---

## 2. Локальный запуск

### 2.1 Быстрый старт с In-Memory моками (без эмуляторов)

1. **Фронтенд:**
   ```bash
   cp .env.example .env
   # В .env: VITE_USE_MOCK_API=true
   npm install
   npm run dev
   ```
2. **Телеграм-бот:**
   ```bash
   cd bot
   cp .env.example .env
   # В bot/.env: BOT_STORAGE=memory, BOT_TOKEN=<ваш_токен>
   npm install
   npm run dev
   ```

### 2.2 Локальный запуск с Firebase Emulators (полный стек)

1. **Запуск эмуляторов Firestore, Storage, Auth, Functions:**
   ```bash
   firebase emulators:start --project demo-proofflow-rules-test
   ```
2. **Запуск фронтенда с эмуляторами:**
   ```bash
   # В .env: VITE_USE_MOCK_API=false
   npm run dev
   ```
3. **Запуск локального пайплайна обработки:**
   ```bash
   cd functions
   npm run local -- --input fixtures/sample-case/chat.png
   ```

---

## 3. Переменные окружения и секреты

### 3.1 Web SPA (Root Frontend)

| Переменная | Где хранится | Обязательна в Prod | Описание и пример |
| :--- | :--- | :--- | :--- |
| `VITE_USE_MOCK_API` | `.env` / CI | Нет (в prod строго `false`) | `false` |
| `VITE_FIREBASE_API_KEY` | `.env` / Hosting | Да | Ключ веб-приложения Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env` / Hosting | Да | `proofflow-b6955.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `.env` / Hosting | Да | `proofflow-b6955` |
| `VITE_FIREBASE_STORAGE_BUCKET`| `.env` / Hosting | Да | `proofflow-b6955.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| `.env` / Hosting | Да | Числовой ID отправителя |
| `VITE_FIREBASE_APP_ID` | `.env` / Hosting | Да | App ID из консоли Firebase |
| `VITE_ADMIN_EMAILS` | `.env` / Hosting | Да | `admin@proofflow.ru,daniilivakin30@gmail.com` |
| `VITE_TELEGRAM_SUPPORT_URL`| `.env` / Hosting | Да | `https://t.me/proofflowbot` |

### 3.2 Cloud Functions (`functions`)

| Переменная / Секрет | Где хранится | Обязательна в Prod | Описание и пример |
| :--- | :--- | :--- | :--- |
| `OPENAI_API_KEY` | Secret Manager | Да (если выбран openai) | Секретный ключ OpenAI Whisper |
| `ANTHROPIC_API_KEY` | Secret Manager | Да (если выбран anthropic)| Секретный ключ Claude 3.5 |
| `GEMINI_API_KEY` | Secret Manager | Да (если выбран google) | Ключ Gemini Developer API |
| `TELEGRAM_BOT_SECRET`| Secret Manager | Да | Общий секрет для привязки Telegram |
| `GEMINI_TIER` | `functions/.env` | Да (`pay-as-you-go`/`paid`)| `pay-as-you-go` (`free` запрещён) |
| `GEMINI_MODEL` | `functions/.env` | Да | `gemini-2.5-flash` |
| `ADMIN_EMAILS` | `functions/.env` | Да | `admin@proofflow.ru,daniilivakin30@gmail.com` |
| `USE_MOCK_ADAPTERS` | `functions/.env` | Нет (в prod строго `false`) | `false` |
| `STORAGE_RETENTION_DAYS`| `functions/.env`| Нет | `14` |

### 3.3 Telegram Bot (`bot`)

| Переменная | Где хранится | Обязательна в Prod | Описание и пример |
| :--- | :--- | :--- | :--- |
| `BOT_TOKEN` | Secret Manager / Env | Да | Токен Telegram-бота от @BotFather |
| `TELEGRAM_BOT_SECRET`| Secret Manager / Env | Да | Общий секрет подтверждения link (X-Telegram-Bot-Secret) |
| `WEBHOOK_SECRET_TOKEN`| Secret Manager / Env | Да (для webhook) | Секретный токен входящих webhook от Telegram |
| `FUNCTIONS_BASE_URL` | Env | Да | URL Cloud Functions (https://us-central1-proofflow-b6955.cloudfunctions.net) |
| `ADMIN_CHAT_ID` | Env / Secret Manager | Да | ID группы команды для тикетов и идей |
| `BOT_STORAGE` | Env | Да (в prod строго `firestore`)| `firestore` |
| `BOT_MODE` | Env | Да | `polling` или `webhook` |
| `MAX_DAILY_TICKETS_AND_IDEAS`| Env | Нет | `5` |
| `PRIVACY_URL` | Env | Нет | `https://proofflow.ru/privacy` |
| `RATE_LIMIT_PER_SECOND`| Env | Нет | `3` |
| `PORT` | Env | Да (для webhook) | `3000` |

---

## 4. Единая последовательность первого деплоя

Развёртывание выполняется в строгом порядке зависимостей:

### Шаг 1. Сохранение секретов в Secret Manager

```bash
# 1. API-ключи AI-провайдеров для Functions
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set GEMINI_API_KEY

# 2. Генерация двух РАЗНЫХ криптографических секретов для бота и функций:
# Секрет привязки аккаунтов между ботом и Cloud Functions (X-Telegram-Bot-Secret):
openssl rand -hex 32
firebase functions:secrets:set TELEGRAM_BOT_SECRET

# Секрет входящего webhook Telegram API (X-Telegram-Bot-Api-Secret-Token):
openssl rand -hex 32
# Сохранить в Secret Manager для Cloud Run как WEBHOOK_SECRET_TOKEN
# Внимание: WEBHOOK_SECRET_TOKEN и TELEGRAM_BOT_SECRET должны быть двумя разными случайными значениями. Приравнивать их запрещено.
```

### Шаг 2. Развёртывание правил безопасности и индексов Firestore

```bash
# Деплой правил Firestore, правил Storage и составных индексов:
firebase deploy --only firestore:rules,storage,firestore:indexes
```

### Шаг 3. Сборка и деплой Cloud Functions

```bash
cd functions
npm ci
npm run build
cd ..
firebase deploy --only functions
```

### Шаг 4. Сборка и деплой фронтенда и виджета (Hosting)

```bash
# Сборка React SPA и embed.js в папку dist:
npm ci
npm run build

# Деплой статики и rewrites:
firebase deploy --only hosting
```

### Шаг 5. Деплой Telegram-бота

#### Вариант А: Cloud Run (Webhook-режим, рекомендуется для production)

```bash
# Сборка контейнера и деплой в Cloud Run:
gcloud builds submit --tag gcr.io/proofflow-b6955/proofflow-bot bot/
gcloud run deploy proofflow-bot \
  --image gcr.io/proofflow-b6955/proofflow-bot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars BOT_MODE=webhook,BOT_STORAGE=firestore,ADMIN_CHAT_ID=7517071405,NODE_ENV=production,FUNCTIONS_BASE_URL=https://us-central1-proofflow-b6955.cloudfunctions.net \
  --set-secrets BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest,TELEGRAM_BOT_SECRET=TELEGRAM_BOT_SECRET:latest,WEBHOOK_SECRET_TOKEN=WEBHOOK_SECRET_TOKEN:latest

# Регистрация Webhook в Telegram:
curl -F "url=https://<CLOUD_RUN_URL>/webhook" \
     -F "secret_token=<WEBHOOK_SECRET_TOKEN>" \
     https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
```

#### Вариант Б: Сервер / Docker Compose (Long Polling режим)

```bash
cd bot
docker build -t proofflow-bot .
docker run -d \
  --name proofflow-bot \
  --restart unless-stopped \
  --env-file /etc/proofflow/bot.env \
  proofflow-bot
```

---

## 5. Тестирование и верификация

```bash
# Проверка корневого пакета (Frontend)
npm run lint
npm run build
npm test

# Проверка Cloud Functions
cd functions && npm run lint && npm run build && npm test && cd ..

# Проверка Telegram-бота
cd bot && npm run lint && npm run build && npm test && cd ..

# Проверка правил безопасности в эмуляторе
npm run test:rules
```
