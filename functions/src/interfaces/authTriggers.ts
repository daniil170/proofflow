import admin from 'firebase-admin'
import { auth } from 'firebase-functions/v1'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const onUserCreated = auth.user().onCreate(async (user) => {
  const userRef = admin.firestore().collection('users').doc(user.uid)
  const snap = await userRef.get()

  if (!snap.exists) {
    const now = Date.now()
    await userRef.set({
      id: user.uid,
      email: user.email || '',
      accessStatus: 'waitlist',
      workspaceId: user.uid,
      createdAt: now,
      updatedAt: now,
    })
  }

  const existingClaims = user.customClaims || {}
  if (!existingClaims.access) {
    await admin.auth().setCustomUserClaims(user.uid, {
      ...existingClaims,
      access: 'waitlist',
    })
  }
})
