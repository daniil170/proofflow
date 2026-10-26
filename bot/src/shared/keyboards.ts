import { InlineKeyboard } from 'grammy'
import { TEXTS } from './texts.js'

export const createWelcomeKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.welcome.btnJoin, 'signup:start')
    .row()
    .text(TEXTS.welcome.btnHowItWorks, 'signup:how_it_works')
}

export const createHowItWorksKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard().text(TEXTS.howItWorks.btnReady, 'signup:start')
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
  return new InlineKeyboard().text(TEXTS.results.btnUpdateFeedback, 'signup:update_feedback')
}

export const createDeleteConfirmKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text(TEXTS.commands.deleteConfirm, 'delete:confirm')
    .text(TEXTS.commands.deleteCancel, 'delete:cancel')
}
