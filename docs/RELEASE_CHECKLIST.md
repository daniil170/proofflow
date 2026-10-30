# ProofFlow Release Checklist

Пошаговый чек-лист для ручной подготовки консолей, проверки после релиза и процедуры отката.

---

## 1. Ручные действия в консолях (до первого деплоя)

### 1.1 Google Cloud Platform & Firebase Console
1. **План Blaze и бюджет:**
   - Перевести проект Firebase на тарифный план Blaze (Pay-as-you-go), необходимый для Cloud Functions v2 и Secret Manager.
   - Настроить бюджет и оповещения о расходах (GCP Console → Billing → Budgets & alerts).
2. **Активация API в Google Cloud:**
   - Secret Manager API: `gcloud services enable secretmanager.googleapis.com`
   - Cloud Functions & Cloud Build: `gcloud services enable cloudfunctions.googleapis.com cloudbuild.googleapis.com`
   - Vertex AI (для Gemini на проде): `gcloud services enable aiplatform.googleapis.com`
   - Cloud Speech-to-Text API (если используется): `gcloud services enable speech.googleapis.com`
   - Cloud Run (для бота в webhook-режиме): `gcloud services enable run.googleapis.com`
3. **Firebase Authentication:**
   - Включить провайдер входа: Email / Password (или Google Sign-In) в Firebase Console → Authentication → Sign-in method.
   - Добавить авторизованные домены: `proofflow.ru`, `proofflow.web.app`, `proofflow.firebaseapp.com`.
4. **Cloud Storage CORS:**
   - Настроить CORS для бакета Storage, чтобы браузер мог напрямую загружать аудио и видео через Signed URL / Firebase SDK:
     ```json
     [
       {
         "origin": ["https://proofflow.ru", "https://proofflow.web.app"],
         "method": ["GET", "PUT", "POST", "HEAD", "DELETE"],
         "maxAgeSeconds": 3600,
         "responseHeader": ["Content-Type", "x-goog-resumable"]
       }
     ]
     ```
     Применить: `gsutil cors set cors.json gs://proofflow-b6955.firebasestorage.app`
5. **Администраторский доступ:**
   - Задать в `functions/.env` или переменных Cloud Functions: `ADMIN_EMAILS=daniilivakin30@gmail.com,admin@proofflow.ru`.
   - Зарегистрировать первого пользователя через интерфейс или консоль и убедиться, что триггер `syncAdminClaims` выставил claim `admin: true`.

### 1.2 Telegram Bot & Webhook
1. **Создание бота через @BotFather:**
   - Получить `BOT_TOKEN`.
   - Сгенерировать два разных случайных криптографических секрета командой `openssl rand -hex 32`:
     * `TELEGRAM_BOT_SECRET` — общий секрет между ботом и Cloud Functions для безопасной привязки аккаунтов (`X-Telegram-Bot-Secret`). Сохранить в Secret Manager: `firebase functions:secrets:set TELEGRAM_BOT_SECRET`.
     * `WEBHOOK_SECRET_TOKEN` — секретный токен для проверки подлинности входящих webhook-запросов от Telegram API (`X-Telegram-Bot-Api-Secret-Token`).
     * Внимание: эти секреты решают разные задачи безопасности, приравнивать их запрещено.
2. **Административный чат:**
   - Создать закрытую группу для команды, добавить бота, назначить администратором.
   - Получить ID группы (`ADMIN_CHAT_ID`) и прописать в окружение бота.
3. **Деплой бота в Cloud Run и регистрация Webhook:**
   - Деплой сервиса с передачей всех обязательных переменных и секретов:
     ```bash
     gcloud run deploy proofflow-bot \
       --image gcr.io/proofflow-b6955/proofflow-bot \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars BOT_MODE=webhook,BOT_STORAGE=firestore,ADMIN_CHAT_ID=7517071405,NODE_ENV=production,FUNCTIONS_BASE_URL=https://us-central1-proofflow-b6955.cloudfunctions.net \
       --set-secrets BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest,TELEGRAM_BOT_SECRET=TELEGRAM_BOT_SECRET:latest,WEBHOOK_SECRET_TOKEN=WEBHOOK_SECRET_TOKEN:latest
     ```
   - Установить webhook:
     ```bash
     curl -F "url=https://<BOT_CLOUD_RUN_URL>/webhook" \
          -F "secret_token=<WEBHOOK_SECRET_TOKEN>" \
          https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
     ```

---

## 2. Проверка после деплоя (Post-Deploy Verification)

### 2.1 Негативные проверки доступа
1. Попытка чтения коллекции `support_tickets`, `ideas`, `publicCases`, `telegram_link_tokens` клиентом без прав — получение `PERMISSION_DENIED` (HTTP 403 / Firestore error).
2. Попытка перехода на `/admin` неавторизованным пользователем или пользователем без статуса администратора — показ экрана 404 (NotFoundPage) без утечки структуры панели.
3. Попытка создания кейса пользователем со статусом `waitlist` или `blocked` — блокировка правилами безопасности и показ WaitlistScreen/BlockedScreen.

### 2.2 Живой прогон сквозного сценария
1. **Лендинг и заявка:**
   - Открытие `https://proofflow.ru/`. Проверка отсутствия ошибок в консоли браузера.
   - Заполнение формы заявки на бету на лендинге → появление заявки в `beta_signups` и уведомление в админке.
2. **Инвайт и регистрация:**
   - Генерация инвайт-кода администратором в `/admin`.
   - Переход по ссылке `/invite/<code>` → активация статуса `active`.
3. **Загрузка и упаковка кейса:**
   - Переход в `/app/cases/new`. Загрузка скриншота или аудиофайла.
   - Запуск процесса обработки → переход на `/app/cases/:id` → статус `processing` → `ready`.
   - Редактирование метрик, цитат и оформление карточки кейса.
4. **Публикация и Embed:**
   - Нажатие «Опубликовать кейс» → публикация в `publicCases`.
   - Переход по ссылке `https://proofflow.ru/c/:id` → рендеринг кейса.
   - Проверка Open Graph карточки для соцсетей: `curl -I https://proofflow.ru/c/:id`.
   - Проверка встраивания через `embed.js` на тестовой HTML-странице.
5. **Телеграм-бот:**
   - Запуск `/start` в боте → вывод главного меню.
   - Отправка обращения в `/support` → доставка уведомления в `ADMIN_CHAT_ID`. Ответ администратора через reply → доставка пользователю.
   - Предложение идеи через `/idea` → модерация в `ADMIN_CHAT_ID` → появление в общем списке `/ideas`.

---

## 3. Процедура отката (Rollback Procedure)

### 3.1 Откат хостинга (Frontend)
В Firebase Console → Hosting перейти в раздел истории релизов и нажать «Rollback» к предыдущей версии, либо через CLI:
```bash
firebase hosting:rollback
```

### 3.2 Откат Cloud Functions
1. В GCP Console → Cloud Run / Cloud Functions выбрать нужную функцию (`onCaseProcessTrigger`, `getPublicCase` и др.).
2. Во вкладке «Revisions» переключить 100% трафика на предыдущую стабильную ревизию (Manage Traffic → 100% to previous revision).

### 3.3 Откат правил безопасности Firestore и Cloud Storage
Правила зафиксированы в Git теге `pre-release-backup`:
```bash
git checkout pre-release-backup -- firestore.rules storage.rules firestore.indexes.json
firebase deploy --only firestore:rules,storage,firestore:indexes
```

### 3.4 Откат Telegram-бота
При деплое на Cloud Run:
```bash
gcloud run services update-traffic proofflow-bot --to-revisions=<PREVIOUS_REVISION>=100
```
При запуске на сервере (systemd / docker):
```bash
docker stop proofflow-bot
docker run -d --name proofflow-bot --env-file /etc/proofflow/bot.env proofflow-bot:<PREVIOUS_TAG>
```
