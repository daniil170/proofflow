import { InlineKeyboard } from 'grammy'
import { FAQ_ITEMS, TEXTS } from './texts.js'
import type { Idea } from '../entities/index.js'

export const createWelcomeKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.welcome.btnJoin, 'signup:start')
    .row()
    .text(TEXTS.welcome.btnHowItWorks, 'signup:how_it_works')
    .row()
    .text(TEXTS.welcome.btnFaq, 'faq:list')
    .row()
    .text(TEXTS.welcome.btnSupport, 'support:start')
    .row()
    .text(TEXTS.welcome.btnIdea, 'idea:start')
    .row()
    .text(TEXTS.welcome.btnIdeas, 'ideas:list:1')
}

export const createHowItWorksKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.howItWorks.btnReady, 'signup:start')
    .row()
    .text('← Главное меню', 'menu:main')
}

export const createBusinessTypesKeyboard = (): InlineKeyboard => {
  const keyboard = new InlineKeyboard()
  TEXTS.options.businessTypes.forEach((type, index) => {
    keyboard.text(type, `business:${type}`)
    if (index % 2 === 1) {
      keyboard.row()
    }
  })
  return keyboard
}

export const createCasesVolumeKeyboard = (): InlineKeyboard => {
  const keyboard = new InlineKeyboard()
  TEXTS.options.casesVolumes.forEach((volume) => {
    keyboard.text(volume, `volume:${volume}`).row()
  })
  return keyboard
}

export const createFeedbackKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard().text(TEXTS.questions.btnSkip, 'signup:skip_feedback')
}

export const createConsentKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.questions.consentAgree, 'signup:consent_yes')
    .text(TEXTS.questions.consentDisagree, 'signup:consent_no')
}

export const createAlreadySubmittedKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.results.btnUpdateFeedback, 'signup:update_feedback')
    .row()
    .text('← Главное меню', 'menu:main')
}

export const createDeleteConfirmKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.commands.deleteConfirm, 'delete:confirm')
    .text(TEXTS.commands.deleteCancel, 'delete:cancel')
}

export const createFaqListKeyboard = (): InlineKeyboard => {
  const keyboard = new InlineKeyboard()
  FAQ_ITEMS.forEach((item) => {
    keyboard.text(item.question, `faq:item:${item.id}`).row()
  })
  keyboard.text(TEXTS.faq.btnContactSupport, 'support:start').row()
  keyboard.text('← Главное меню', 'menu:main')
  return keyboard
}

export const createFaqItemKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.faq.btnBack, 'faq:list')
    .row()
    .text(TEXTS.faq.btnContactSupport, 'support:start')
}

export const createSupportTopicKeyboard = (): InlineKeyboard => {
  const keyboard = new InlineKeyboard()
  TEXTS.support.topics.forEach((topic) => {
    keyboard.text(topic, `support:topic:${topic}`).row()
  })
  keyboard.text(TEXTS.support.btnCancel, 'support:cancel')
  return keyboard
}

export const createSupportConfirmKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.support.btnSend, 'support:confirm_send')
    .text(TEXTS.support.btnCancel, 'support:cancel')
}

export const createOpenTicketKeyboard = (ticketId: string): InlineKeyboard => {
  return new InlineKeyboard().text(
    TEXTS.support.btnClose,
    `support:user_close:${ticketId}`
  )
}

export const createAdminTicketKeyboard = (ticketId: string): InlineKeyboard => {
  return new InlineKeyboard().text(
    TEXTS.admin.btnCloseTicket,
    `admin:ticket_close:${ticketId}`
  )
}

export const createIdeaCategoryKeyboard = (): InlineKeyboard => {
  const keyboard = new InlineKeyboard()
  TEXTS.ideas.categories.forEach((cat) => {
    keyboard.text(cat, `idea:category:${cat}`).row()
  })
  keyboard.text(TEXTS.ideas.btnCancel, 'idea:cancel')
  return keyboard
}

export const createIdeaContextKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.ideas.btnSkip, 'idea:skip_context')
    .row()
    .text(TEXTS.ideas.btnCancel, 'idea:cancel')
}

export const createAdminIdeaKeyboard = (ideaId: string): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.admin.btnApproveIdea, `admin:idea_approve:${ideaId}`)
    .text(TEXTS.admin.btnRejectIdea, `admin:idea_reject:${ideaId}`)
}

export const createIdeasListKeyboard = (
  ideas: readonly Idea[],
  page: number,
  totalPages: number,
  userVotedIdeaIds: ReadonlySet<string>
): InlineKeyboard => {
  const keyboard = new InlineKeyboard()

  ideas.forEach((idea, index) => {
    const isVoted = userVotedIdeaIds.has(idea.id)
    const label = `${isVoted ? '✅ ' : ''}${TEXTS.ideas.voteButton(idea.votesCount)}`
    keyboard.text(`[${index + 1}] ${label}`, `idea:vote:${idea.id}:${page}`).row()
  })

  const navRow = []
  if (page > 1) {
    navRow.push({ text: TEXTS.ideas.btnPrev, callback_data: `ideas:list:${page - 1}` })
  }
  if (page < totalPages) {
    navRow.push({ text: TEXTS.ideas.btnNext, callback_data: `ideas:list:${page + 1}` })
  }
  if (navRow.length > 0) {
    navRow.forEach((btn) => keyboard.text(btn.text, btn.callback_data))
    keyboard.row()
  }

  keyboard.text(TEXTS.ideas.btnSuggestIdea, 'idea:start').row()
  keyboard.text('← Главное меню', 'menu:main')
  return keyboard
}
