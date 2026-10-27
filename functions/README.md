# ProofFlow Cloud Functions

## Настройка секретов (Secret Manager)

Для работы с AI API (OpenAI Whisper и Anthropic Claude) в production-окружении секреты задаются через Google Cloud Secret Manager с помощью Firebase CLI:

```bash
# Ключ OpenAI API (Whisper транскрибация)
firebase functions:secrets:set OPENAI_API_KEY

# Ключ Anthropic API (Claude анализ и OCR)
firebase functions:secrets:set ANTHROPIC_API_KEY
```

## Переменные окружения

Переменные конфигурации задаются в файле `.env` для локальной разработки или через параметры деплоя:

- `ANTHROPIC_MODEL`: название актуальной модели Claude (например, `claude-3-5-sonnet-latest`). Обязательный параметр в production.
- `STORAGE_BUCKET`: имя бакета Firebase Storage.
- `APP_BASE_URL`: базовый URL клиентского приложения.
- `MAX_CASES_PER_ACCOUNT`: лимит кейсов на аккаунт (по умолчанию 50).
- `MAX_RECORDING_DURATION_SEC`: максимальная длительность одной аудио/видео записи в секундах (по умолчанию 3600 = 60 минут).
- `USE_MOCK_ADAPTERS`: `false` для реального API. В продакшене флаг `true` блокируется на уровне рантайма.
- `FFMPEG_PATH`: опциональный кастомный путь к бинарнику ffmpeg.
- `FFPROBE_PATH`: опциональный кастомный путь к бинарнику ffprobe.

## Ресурсы функции обработки пайплайна

- Триггер: Firestore Eventarc (`onDocumentWritten`) на документе `cases/{caseId}`
- Memory: `2GiB` (2 vCPU)
- Timeout: `540` секунд (максимум для Eventarc / Firestore triggers в Cloud Functions 2nd gen)

## Сборка и тесты

```bash
# Сборка TypeScript
npm run build

# Линтер
npm run lint

# Тесты
npm run test

# Локальный запуск на файлах
npm run local <путь_к_папке> [имя_клиента]
```
