import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, getMetadata, ref, uploadBytes } from 'firebase/storage'

describe('Firebase Security Rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-proofflow-rules-test',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      },
      storage: {
        rules: readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 9199,
      },
    })
  })

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup()
    }
  })

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore()
      await testEnv.clearStorage()
    }
  })

  describe('Firestore: Cases access control', () => {
    it('allows owner to create, read, and update own case', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const caseRef = doc(aliceDb, 'cases/case-1')

      await assertSucceeds(
        setDoc(caseRef, {
          ownerId: 'alice',
          clientLabel: 'Acme Corp',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )

      await assertSucceeds(getDoc(caseRef))

      await assertSucceeds(
        updateDoc(caseRef, {
          clientLabel: 'Acme Corp Renovated',
          status: 'processing',
          updatedAt: Date.now(),
        })
      )
    })

    it('denies non-owner from reading, updating, or deleting a case', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          clientLabel: 'Alice Case',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const bobDb = testEnv.authenticatedContext('bob').firestore()
      const caseRef = doc(bobDb, 'cases/case-1')

      await assertFails(getDoc(caseRef))
      await assertFails(
        updateDoc(caseRef, {
          clientLabel: 'Hacked',
          updatedAt: Date.now(),
        })
      )
      await assertFails(deleteDoc(caseRef))
    })

    it('denies unauthenticated users from reading or writing cases', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'draft',
        })
      })

      const anonDb = testEnv.unauthenticatedContext().firestore()
      const caseRef = doc(anonDb, 'cases/case-1')

      await assertFails(getDoc(caseRef))
      await assertFails(
        setDoc(doc(anonDb, 'cases/case-anon'), {
          ownerId: 'anon',
          status: 'draft',
        })
      )
    })

    it('denies creating a case with another users ownerId', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const caseRef = doc(aliceDb, 'cases/case-forged')

      await assertFails(
        setDoc(caseRef, {
          ownerId: 'bob',
          status: 'draft',
        })
      )
    })

    it('denies changing ownerId on existing case', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const caseRef = doc(aliceDb, 'cases/case-1')

      await assertFails(
        updateDoc(caseRef, {
          ownerId: 'bob',
          updatedAt: Date.now(),
        })
      )
    })

    it('prevents client from creating or updating pipeline-controlled fields', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const newCaseRef = doc(aliceDb, 'cases/case-forged-pipeline')

      await assertFails(
        setDoc(newCaseRef, {
          ownerId: 'alice',
          status: 'ready',
          evidences: [{ id: 'fake-evidence' }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-existing'), {
          ownerId: 'alice',
          status: 'processing',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const existingRef = doc(aliceDb, 'cases/case-existing')

      await assertFails(
        updateDoc(existingRef, {
          evidences: [{ id: 'fake-evidence' }],
          updatedAt: Date.now(),
        })
      )

      await assertFails(
        updateDoc(existingRef, {
          failReason: 'Injected reason',
          updatedAt: Date.now(),
        })
      )

      await assertFails(
        updateDoc(existingRef, {
          stageProgress: 100,
          updatedAt: Date.now(),
        })
      )
    })

    it('handles feedback and events creation rules', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const feedbackRef = doc(aliceDb, 'feedback/fb-1')

      await assertSucceeds(
        setDoc(feedbackRef, {
          caseId: 'case-1',
          rating: 5,
          userId: 'alice',
          comment: 'Great tool',
        })
      )

      await assertFails(getDoc(feedbackRef))

      const forgedFeedbackRef = doc(aliceDb, 'feedback/fb-forged')
      await assertFails(
        setDoc(forgedFeedbackRef, {
          caseId: 'case-1',
          rating: 1,
          userId: 'bob',
        })
      )

      const eventsRef = doc(aliceDb, 'events/ev-1')
      await assertSucceeds(
        setDoc(eventsRef, {
          type: 'case_created',
          userId: 'alice',
        })
      )
      await assertFails(getDoc(eventsRef))
    })

    it('enforces beta signups creation and access rules for web and bot', async () => {
      const anonDb = testEnv.unauthenticatedContext().firestore()

      const webEmailOnlyRef = doc(anonDb, 'beta_signups/web-email')
      await assertSucceeds(
        setDoc(webEmailOnlyRef, {
          source: 'web',
          email: 'founder@agency.ru',
          consent: true,
          businessType: 'agency_or_studio',
          casesVolume: '1_to_3',
        })
      )

      const webTgOnlyRef = doc(anonDb, 'beta_signups/web-tg')
      await assertSucceeds(
        setDoc(webTgOnlyRef, {
          source: 'web',
          telegramUsername: 'agency_founder',
          consent: true,
          businessType: 'agency_or_studio',
          casesVolume: '1_to_3',
        })
      )

      const webBothRef = doc(anonDb, 'beta_signups/web-both')
      await assertSucceeds(
        setDoc(webBothRef, {
          source: 'web',
          email: 'founder@agency.ru',
          telegramUsername: 'agency_founder',
          consent: true,
          businessType: 'agency_or_studio',
          casesVolume: '1_to_3',
        })
      )

      const webNoContactsRef = doc(anonDb, 'beta_signups/web-no-contact')
      await assertFails(
        setDoc(webNoContactsRef, {
          source: 'web',
          consent: true,
          businessType: 'agency_or_studio',
          casesVolume: '1_to_3',
        })
      )

      const webNoConsentRef = doc(anonDb, 'beta_signups/web-no-consent')
      await assertFails(
        setDoc(webNoConsentRef, {
          source: 'web',
          email: 'founder@agency.ru',
          consent: false,
          businessType: 'agency_or_studio',
          casesVolume: '1_to_3',
        })
      )

      const botSignupRef = doc(anonDb, 'beta_signups/bot-tg')
      await assertSucceeds(
        setDoc(botSignupRef, {
          source: 'telegram',
          telegramUserId: 987654321,
          telegramUsername: 'telegram_lead',
          businessType: 'agency_or_studio',
          casesVolume: '1_to_3',
          consent: true,
        })
      )

      await assertFails(getDoc(webEmailOnlyRef))
      await assertFails(
        updateDoc(webEmailOnlyRef, {
          businessType: 'hacked',
        })
      )
      await assertFails(deleteDoc(webEmailOnlyRef))
    })
  })

  describe('Storage: Access control and file constraints', () => {
    it('allows owner to upload and read case files', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'processing',
        })
      })

      const aliceStorage = testEnv.authenticatedContext('alice').storage()
      const aliceFileRef = ref(aliceStorage, 'cases/case-1/screenshot.png')
      const smallPngData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

      await assertSucceeds(
        uploadBytes(aliceFileRef, smallPngData, {
          contentType: 'image/png',
        })
      )

      await assertSucceeds(getMetadata(aliceFileRef))
    })

    it('denies non-owner from uploading, reading, or deleting case files', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'processing',
        })
      })

      const aliceStorage = testEnv.authenticatedContext('alice').storage()
      const bobStorage = testEnv.authenticatedContext('bob').storage()

      const aliceFileRef = ref(aliceStorage, 'cases/case-1/screenshot.png')
      const bobFileRef = ref(bobStorage, 'cases/case-1/screenshot.png')
      const smallPngData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

      await assertSucceeds(
        uploadBytes(aliceFileRef, smallPngData, {
          contentType: 'image/png',
        })
      )

      await assertFails(
        uploadBytes(bobFileRef, smallPngData, {
          contentType: 'image/png',
        })
      )

      await assertFails(deleteObject(bobFileRef))
    })

    it('denies storage uploads with disallowed mime types', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'processing',
        })
      })

      const aliceStorage = testEnv.authenticatedContext('alice').storage()
      const fileRef = ref(aliceStorage, 'cases/case-1/exploit.exe')

      await assertFails(
        uploadBytes(fileRef, new Uint8Array([1, 2, 3]), {
          contentType: 'application/x-msdownload',
        })
      )
    })
  })
})
