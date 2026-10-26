import { Composer } from 'grammy'
import type { BotContext } from '../../app/types.js'
import {
  createBusinessTypesKeyboard,
  createCasesVolumeKeyboard,
  createConsentKeyboard,
  createFeedbackKeyboard,
  createHowItWorksKeyboard,
} from '../../shared/keyboards.js'
import { getRepository } from '../../shared/storage/index.js'
import { TEXTS } from '../../shared/texts.js'
import { notifyAdmin } from '../admin-notify/notifyAdmin.js'
import { initialSessionData, signupReducer } from './machine.js'

export const signupComposer = new Composer<BotContext>()

signupComposer.callbackQuery('signup:how_it_works', async (ctx) => {
  await ctx.answerCallbackQuery()
  const result = signupReducer(ctx.session.signup, {
    type: 'SELECT_HOW_IT_WORKS',
  })
  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.howItWorks.description, {
    reply_markup: createHowItWorksKeyboard(),
  })
})

signupComposer.callbackQuery('signup:start', async (ctx) => {
  await ctx.answerCallbackQuery()
  const result = signupReducer(ctx.session.signup, { type: 'START' })
  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.questions.businessType, {
    reply_markup: createBusinessTypesKeyboard(),
  })
})

signupComposer.callbackQuery(/^business:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const selectedType = ctx.match[1]
  const result = signupReducer(ctx.session.signup, {
    type: 'SELECT_BUSINESS_TYPE',
    payload: selectedType,
  })

  if (result.errorKey) {
    await ctx.reply(TEXTS.validation[result.errorKey], {
      reply_markup: createBusinessTypesKeyboard(),
    })
    return
  }

  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.questions.casesVolume, {
    reply_markup: createCasesVolumeKeyboard(),
  })
})

signupComposer.callbackQuery(/^volume:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const selectedVolume = ctx.match[1]
  const result = signupReducer(ctx.session.signup, {
    type: 'SELECT_CASES_VOLUME',
    payload: selectedVolume,
  })

  if (result.errorKey) {
    await ctx.reply(TEXTS.validation[result.errorKey], {
      reply_markup: createCasesVolumeKeyboard(),
    })
    return
  }

  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.questions.feedback, {
    reply_markup: createFeedbackKeyboard(),
  })
})

signupComposer.callbackQuery('signup:skip_feedback', async (ctx) => {
  await ctx.answerCallbackQuery()
  const result = signupReducer(ctx.session.signup, { type: 'SKIP_FEEDBACK' })

  if (result.errorKey) {
    await ctx.reply(TEXTS.validation[result.errorKey])
    return
  }

  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.questions.consent, {
    reply_markup: createConsentKeyboard(),
  })
})

signupComposer.callbackQuery('signup:update_feedback', async (ctx) => {
  await ctx.answerCallbackQuery()
  const result = signupReducer(ctx.session.signup, {
    type: 'UPDATE_FEEDBACK_START',
  })
  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.questions.feedback, {
    reply_markup: createFeedbackKeyboard(),
  })
})

signupComposer.callbackQuery('signup:consent_yes', async (ctx) => {
  await ctx.answerCallbackQuery()
  const userId = ctx.from?.id
  if (!userId) return

  const result = signupReducer(ctx.session.signup, {
    type: 'SUBMIT_CONSENT',
    agreed: true,
  })

  if (!result.shouldSave) {
    return
  }

  const repo = getRepository()
  const app = await repo.create({
    source: 'telegram',
    deepLink: ctx.session.signup.deepLink,
    telegramUserId: userId,
    telegramUsername: ctx.from?.username,
    businessType: ctx.session.signup.businessType || 'Не указано',
    casesVolume: ctx.session.signup.casesVolume || '1-3',
    feedbackText: ctx.session.signup.feedbackText,
    voiceAttachment: ctx.session.signup.voiceAttachment,
    consent: true,
  })

  ctx.session.signup = {
    ...initialSessionData,
    existingApplicationId: app.id,
  }

  await ctx.reply(TEXTS.results.success)
  await notifyAdmin(ctx.api, app)
})

signupComposer.callbackQuery('signup:consent_no', async (ctx) => {
  await ctx.answerCallbackQuery()
  const result = signupReducer(ctx.session.signup, {
    type: 'SUBMIT_CONSENT',
    agreed: false,
  })
  ctx.session.signup = result.nextState
  await ctx.reply(TEXTS.results.disagreed)
})

signupComposer.on('message:voice', async (ctx) => {
  const step = ctx.session.signup.step
  if (step !== 'awaiting_feedback') {
    await ctx.reply(TEXTS.validation.selectButton)
    return
  }

  const voice = ctx.message.voice
  const result = signupReducer(ctx.session.signup, {
    type: 'SUBMIT_FEEDBACK_VOICE',
    fileId: voice.file_id,
    duration: voice.duration,
  })

  ctx.session.signup = result.nextState

  if (result.shouldUpdate && ctx.session.signup.existingApplicationId) {
    const repo = getRepository()
    await repo.update(ctx.session.signup.existingApplicationId, {
      voiceAttachment: {
        fileId: voice.file_id,
        duration: voice.duration,
      },
      feedbackText: undefined,
    })
    await ctx.reply(TEXTS.results.feedbackUpdated)
    return
  }

  await ctx.reply(TEXTS.questions.consent, {
    reply_markup: createConsentKeyboard(),
  })
})

signupComposer.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim()
  const step = ctx.session.signup.step

  if (step === 'awaiting_business_type') {
    const matchedType = (TEXTS.options.businessTypes as readonly string[]).find(
      (t) => t.toLowerCase() === text.toLowerCase()
    )

    if (matchedType) {
      const result = signupReducer(ctx.session.signup, {
        type: 'SELECT_BUSINESS_TYPE',
        payload: matchedType,
      })
      ctx.session.signup = result.nextState
      await ctx.reply(TEXTS.questions.casesVolume, {
        reply_markup: createCasesVolumeKeyboard(),
      })
      return
    }

    await ctx.reply(TEXTS.validation.selectButton, {
      reply_markup: createBusinessTypesKeyboard(),
    })
    return
  }

  if (step === 'awaiting_cases_volume') {
    const matchedVolume = (TEXTS.options.casesVolumes as readonly string[]).find(
      (v) => v.toLowerCase() === text.toLowerCase()
    )

    if (matchedVolume) {
      const result = signupReducer(ctx.session.signup, {
        type: 'SELECT_CASES_VOLUME',
        payload: matchedVolume,
      })
      ctx.session.signup = result.nextState
      await ctx.reply(TEXTS.questions.feedback, {
        reply_markup: createFeedbackKeyboard(),
      })
      return
    }

    await ctx.reply(TEXTS.validation.selectButton, {
      reply_markup: createCasesVolumeKeyboard(),
    })
    return
  }

  if (step === 'awaiting_feedback') {
    const result = signupReducer(ctx.session.signup, {
      type: 'SUBMIT_FEEDBACK_TEXT',
      payload: text,
    })

    if (result.errorKey) {
      await ctx.reply(TEXTS.validation[result.errorKey], {
        reply_markup: createFeedbackKeyboard(),
      })
      return
    }

    ctx.session.signup = result.nextState

    if (result.shouldUpdate && ctx.session.signup.existingApplicationId) {
      const repo = getRepository()
      await repo.update(ctx.session.signup.existingApplicationId, {
        feedbackText: text,
        voiceAttachment: undefined,
      })
      await ctx.reply(TEXTS.results.feedbackUpdated)
      return
    }

    await ctx.reply(TEXTS.questions.consent, {
      reply_markup: createConsentKeyboard(),
    })
    return
  }

  if (step === 'awaiting_consent') {
    const lower = text.toLowerCase()
    if (lower === 'согласен' || lower === 'да') {
      const userId = ctx.from?.id
      if (!userId) return

      const repo = getRepository()
      const app = await repo.create({
        source: 'telegram',
        deepLink: ctx.session.signup.deepLink,
        telegramUserId: userId,
        telegramUsername: ctx.from?.username,
        businessType: ctx.session.signup.businessType || 'Не указано',
        casesVolume: ctx.session.signup.casesVolume || '1-3',
        feedbackText: ctx.session.signup.feedbackText,
        voiceAttachment: ctx.session.signup.voiceAttachment,
        consent: true,
      })

      ctx.session.signup = {
        ...initialSessionData,
        existingApplicationId: app.id,
      }

      await ctx.reply(TEXTS.results.success)
      await notifyAdmin(ctx.api, app)
      return
    }

    if (lower === 'не согласен' || lower === 'нет') {
      ctx.session.signup = { ...initialSessionData }
      await ctx.reply(TEXTS.results.disagreed)
      return
    }

    await ctx.reply(TEXTS.validation.consentExpected, {
      reply_markup: createConsentKeyboard(),
    })
    return
  }

  if (step === 'idle' || step === 'completed') {
    await ctx.reply(TEXTS.commands.help)
  }
})

signupComposer.on('message', async (ctx) => {
  const step = ctx.session.signup.step

  if (step === 'awaiting_feedback') {
    await ctx.reply(TEXTS.validation.feedbackExpected, {
      reply_markup: createFeedbackKeyboard(),
    })
    return
  }

  if (step === 'awaiting_business_type') {
    await ctx.reply(TEXTS.validation.selectButton, {
      reply_markup: createBusinessTypesKeyboard(),
    })
    return
  }

  if (step === 'awaiting_cases_volume') {
    await ctx.reply(TEXTS.validation.selectButton, {
      reply_markup: createCasesVolumeKeyboard(),
    })
    return
  }

  if (step === 'awaiting_consent') {
    await ctx.reply(TEXTS.validation.consentExpected, {
      reply_markup: createConsentKeyboard(),
    })
    return
  }

  await ctx.reply(TEXTS.commands.help)
})
