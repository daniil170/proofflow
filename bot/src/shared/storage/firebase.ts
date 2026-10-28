import { getApps, initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { config } from '../config.js'

let dbInstance: Firestore | null = null

export const getFirestoreDb = (): Firestore => {
  if (dbInstance) return dbInstance

  const apps = getApps()
  const app =
    apps.length > 0
      ? apps[0]
      : initializeApp({
          apiKey: config.firebase.apiKey,
          authDomain: config.firebase.authDomain,
          projectId: config.firebase.projectId,
          storageBucket: config.firebase.storageBucket,
          messagingSenderId: config.firebase.messagingSenderId,
          appId: config.firebase.appId,
        })

  dbInstance = getFirestore(app)
  return dbInstance
}
