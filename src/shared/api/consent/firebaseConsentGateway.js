import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from '../firebase/app.js'

const getFunctionsInstance = () => getFunctions(getFirebaseApp())

export const firebaseConsentGateway = Object.freeze({
  async createConsentRequest(caseId) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'createConsentRequest')
    const res = await call({ caseId })
    return res.data
  },

  async getConsentByToken(token) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'getConsentByToken')
    const res = await call({ token })
    return res.data
  },

  async submitClientConsent(token, decision) {
    const functions = getFunctionsInstance()
    const call = httpsCallable(functions, 'submitClientConsent')
    const res = await call({ token, decision })
    return res.data
  },
})
