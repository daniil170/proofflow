import { defineSecret } from 'firebase-functions/params'

export const openAiApiKey = defineSecret('OPENAI_API_KEY')
export const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')
export const geminiApiKey = defineSecret('GEMINI_API_KEY')
export const telegramBotSecret = defineSecret('TELEGRAM_BOT_SECRET')
