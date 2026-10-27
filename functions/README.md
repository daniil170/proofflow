# ProofFlow Cloud Functions

## Настройка секретов (Secret Manager)

Для работы с AI API в production-окружении секреты задаются через Google Cloud Secret Manager с помощью Firebase CLI:

```bash
# Ключ OpenAI API (Whisper транскрибация)
firebase functions:secrets:set OPENAI_API_KEY

# Ключ Anthropic API (Claude анализ и OCR)
firebase functions:secrets:set ANTHROPIC_API_KEY

# Ключ Gemini API (опционально, только для GEMINI_MODE=api)
firebase functions:secrets:set GEMINI_API_KEY
```

## Выбор AI-провайдеров для пайплайна

Каждый шаг конвейера обработки настраивается независимо через переменные окружения:

- `TRANSCRIBER_PROVIDER`: `openai` (по умолчанию, Whisper), `google` (Gemini), `google-speech` (Google Cloud Speech-to-Text), `mock`.
- `CHAT_READER_PROVIDER`: `anthropic` (по умолчанию, Claude), `google` (Gemini), `mock`.
- `ANALYZER_PROVIDER`: `anthropic` (по умолчанию, Claude), `google` (Gemini), `mock`.

Поведение по умолчанию (если переменные не заданы) остается неизменным: Whisper для транскрибации, Claude для OCR скриншотов и анализа кейса.

## Подключение Gemini через Vertex AI (рекомендуемый режим)

По умолчанию для `google` используется режим корпоративного Vertex AI (`GEMINI_MODE=vertex`) без передачи API-ключей: авторизация происходит автоматически через сервисный аккаунт Cloud Functions.

### 1. Включение Vertex AI API в проекте Google Cloud

```bash
gcloud services enable aiplatform.googleapis.com --project <ID_ПРОЕКТА>
```

### 2. Назначение роли сервисному аккаунту Cloud Functions

Сервисному аккаунту функций (обычно `<project-id>@appspot.gserviceaccount.com` или `<project-number>-compute@developer.gserviceaccount.com`) требуется роль **Vertex AI User**:

```bash
gcloud projects add-iam-policy-binding <ID_ПРОЕКТА> \
  --member="serviceAccount:<СЕРВИСНЫЙ_АККАУНТ>" \
  --role="roles/aiplatform.user"
```

### 3. Переменные окружения Gemini

- `GEMINI_MODE`: `vertex` (по умолчанию) или `api`.
- `GEMINI_REGION` или `VERTEX_REGION`: регион размещения модели (например, `us-central1`, `europe-west4`). Значения по умолчанию отсутствуют — регион задается явно.
- `GEMINI_MODEL`: имя модели Gemini (например, `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`). Значения по умолчанию отсутствуют.
- `GEMINI_TIER`: уровень тарифа (`pay-as-you-go` или `paid`). В production-окружении значение `free` запрещено и приводит к немедленному завершению с ошибкой безопасности, так как бесплатный тариф разрешает использование данных для дообучения моделей.
- `GEMINI_API_KEY`: API-ключ в Secret Manager (требуется только при явном указании `GEMINI_MODE=api`).

## Подключение Google Speech-to-Text (адаптер GoogleSpeechTranscriber)

Адаптер `google-speech` реализует распознавание речи с таймкодами слов через Google Cloud Speech-to-Text v1 API:

```bash
# Включение Speech-to-Text API
gcloud services enable speech.googleapis.com --project <ID_ПРОЕКТА>

# Назначение роли Cloud Speech Client
gcloud projects add-iam-policy-binding <ID_ПРОЕКТА> \
  --member="serviceAccount:<СЕРВИСНЫЙ_АККАУНТ>" \
  --role="roles/speech.client"
```

Опциональные переменные:
- `GOOGLE_SPEECH_REGION`: региональная конечная точка (по умолчанию глобальная).
- `GOOGLE_SPEECH_LANGUAGE`: язык аудио (по умолчанию `ru-RU`).

## Сравнение провайдеров (scripts/compare-providers)

Скрипт запускает конвейер на тестовых материалах для разных конфигураций провайдеров, замеряет скорость, оценку стоимости, число токенов, проверяет качество верификации цитат (`verifyDraft`) и расхождение таймкодов относительно эталона Whisper. Результаты выводятся в таблицу и сохраняются в JSON-файл рядом с материалами без записи в Firestore.

> ⚠️ **Предупреждение по безопасности данных:**
> Для тестирования и сравнения внешних провайдеров используйте строго обезличенные тестовые данные либо материалы, на передачу которых третьим лицам получено официальное согласие заказчика.

### Запуск сравнения:

```bash
# Базовый запуск на папке с материалами (проверяет default-current, all-gemini, google-speech-gemini)
./scripts/compare-providers <путь_к_папке_с_материалами>

# Запуск с указанием конкретных конфигураций
./scripts/compare-providers <путь_к_папке> --configs default-current,all-gemini
```

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
