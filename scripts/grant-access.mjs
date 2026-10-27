import admin from 'firebase-admin'

const target = process.argv[2]

if (!target) {
  console.error('Использование: node scripts/grant-access.mjs <email|uid>')
  process.exit(1)
}

if (!admin.apps.length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-proofflow-rules-test' })
  } else {
    admin.initializeApp()
  }
}

const auth = admin.auth()
const db = admin.firestore()

async function main() {
  let userRecord
  try {
    if (target.includes('@')) {
      userRecord = await auth.getUserByEmail(target)
    } else {
      userRecord = await auth.getUser(target)
    }
  } catch (error) {
    console.error(`Пользователь "${target}" не найден в Firebase Auth:`, error.message)
    process.exit(1)
  }

  const uid = userRecord.uid
  const now = Date.now()

  await db.collection('users').doc(uid).set(
    {
      id: uid,
      email: userRecord.email || '',
      accessStatus: 'active',
      workspaceId: uid,
      updatedAt: now,
    },
    { merge: true }
  )

  const existingClaims = userRecord.customClaims || {}
  await auth.setCustomUserClaims(uid, {
    ...existingClaims,
    access: 'active',
  })

  console.log(`Доступ "active" успешно выдан пользователю: ${userRecord.email || uid} (UID: ${uid})`)
}

main().catch((err) => {
  console.error('Ошибка при выдаче доступа:', err)
  process.exit(1)
})
