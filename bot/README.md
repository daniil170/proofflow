# ProofFlow Telegram Bot (`bot`)

Telegram-бот сервиса ProofFlow для сбора заявок на закрытое бета-тестирование и безопасной привязки Telegram-аккаунтов пользователей продукта.

## 1. Секрет бота (TELEGRAM_BOT_SECRET)

Привязка аккаунта через команду `/start link_<токен>` защищена общим секретом между ботом и Cloud Functions (`confirmTelegramLink`).

### Задание секрета в production (Secret Manager)

```bash
# Сохранение общего секрета в Google Cloud Secret Manager
firebase functions:secrets:set TELEGRAM_BOT_SECRET
```

### Задание секрета для локальной разработки

1. В `functions/.env`:
   ```bash
   TELEGRAM_BOT_SECRET=ваш_надежный_секретный_ключ
   ```

2. В `bot/.env`:
   ```bash
   TELEGRAM_BOT_SECRET=ваш_надежный_секретный_ключ
   ```

## 2. Локальный запуск бота

### Шаг 1: Установка зависимостей

```bash
cd bot
npm install
```

### Шаг 2: Настройка переменных окружения

Создайте файл `bot/.env` на основе примера:

```bash
cp .env.example .env
```

Заполните ключевые переменные:

```env
BOT_TOKEN=123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_BOT_SECRET=ваш_надежный_секретный_ключ
ADMIN_CHAT_ID=ваш_telegram_id_для_уведомлений
BOT_MODE=polling
BOT_STORAGE=firestore
# Для локального тестирования привязки с эмулятором функций:
FUNCTIONS_BASE_URL=http://127.0.0.1:5001/demo-proofflow-rules-test/us-central1
```

### Шаг 3: Запуск в режиме разработки

```bash
# Запуск с автоперезагрузкой при изменении файлов:
npm run dev
```

### Шаг 4: Сборка и тесты

```bash
# Линтер
npm run lint

# Сборка TypeScript
npm run build

# Юнит-тесты
npm test
```
