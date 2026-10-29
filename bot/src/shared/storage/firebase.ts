import admin from 'firebase-admin'

let dbInstance: admin.firestore.Firestore | null = null

export const getAdminFirestore = (): admin.firestore.Firestore => {
  if (dbInstance) return dbInstance

  if (!admin.apps.length) {
    admin.initializeApp()
  }

  dbInstance = admin.firestore()
  return dbInstance
}

export const getFirestoreDb = getAdminFirestore
