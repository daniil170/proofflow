import type { Api } from 'grammy'
import type { BetaApplication } from '../../entities/index.js'
import { config } from '../../shared/config.js'
import { logger } from '../../shared/logger.js'

export const formatAdminNotification = (app: BetaApplication): string => {
  const userDisplay = app.telegramUsername
    ? `@${app.telegramUsername}`
    : `ID: ${app.telegramUserId}`
  const userLink = app.telegramUsername
    ? `https://t.me/${app.telegramUsername}`
    : `tg://user?id=${app.telegramUserId}`

  const feedbackDisplay = app.voiceAttachment
    ? `Голосовое (${app.voiceAttachment.duration} сек, id: ${app.voiceAttachment.fileId})`
    : app.feedbackText
      ? app.feedbackText
      : 'Пропущено'

  return [
    '🔔 <b>Новая заявка в бету ProofFlow!</b>',
    '',
    `👤 <b>Пользователь:</b> <a href="${userLink}">${userDisplay}</a>`,
    `🏢 <b>Тип бизнеса:</b> ${app.businessType}`,
    `📊 <b>Объём:</b> ${app.casesVolume} в месяц`,
    `💬 <b>Ответ:</b> ${feedbackDisplay}`,
    `🔗 <b>Источник:</b> ${app.deepLink || 'прямой переход'}`,
  ].join('\n')
}

export const notifyAdmin = async (api: Api, app: BetaApplication): Promise<void> => {
  if (!config.adminChatId) {
    logger.info('ADMIN_CHAT_ID is not configured, skipping notification', {
      telegramUserId: app.telegramUserId,
    })
    return
  }

  try {
    const text = formatAdminNotification(app)
    await api.sendMessage(config.adminChatId, text, {
      parse_mode: 'HTML',
    })
    logger.info('Admin notified about new application', {
      adminChatId: config.adminChatId,
      telegramUserId: app.telegramUserId,
    })
  } catch (error) {
    logger.error('Failed to send admin notification', error, {
      adminChatId: config.adminChatId,
      telegramUserId: app.telegramUserId,
    })
  }
}
