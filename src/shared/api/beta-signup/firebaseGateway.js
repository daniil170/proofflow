import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from '../firebase/app.js'

export const firebaseBetaSignupGateway = Object.freeze({
  async submit(payload) {
    const app = getFirebaseApp()
    const functions = getFunctions(app)
    const submitFn = httpsCallable(functions, 'submitApplication')

    const response = await submitFn(payload)
    return response.data
  },
})
