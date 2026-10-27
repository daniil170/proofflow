let admin
try {
  const mod = await import('firebase-admin')
  admin = mod.default || mod
} catch {
  const mod = await import('../functions/node_modules/firebase-admin/lib/index.js')
  admin = mod.default || mod
}

const args = process.argv.slice(2)
const makeAdmin = args.includes('--admin')
const target = args.find((arg) => !arg.startsWith('--'))

if (!target) {
  console.error('Использование: node scripts/grant-access.mjs <email|uid> [--admin]')
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

  const userDocData = {
    id: uid,
    email: userRecord.email || '',
    accessStatus: 'active',
    workspaceId: uid,
    updatedAt: now,
  }

  if (makeAdmin) {
    userDocData.role = 'admin'
  }

  await db.collection('users').doc(uid).set(userDocData, { merge: true })

  const existingClaims = userRecord.customClaims || {}
  const nextClaims = {
    ...existingClaims,
    access: 'active',
  }
  if (makeAdmin) {
    nextClaims.admin = true
  }

  await auth.setCustomUserClaims(uid, nextClaims)

  const adminMsg = makeAdmin ? ' и права администратора (admin: true)' : ''
  console.log(`Доступ "active"${adminMsg} успешно выдан пользователю: ${userRecord.email || uid} (UID: ${uid})`)
}

main().catch((err) => {
  console.error('Ошибка при выдаче доступа:', err)
  process.exit(1)
})
