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
import { deleteObject, getMetadata, ref, uploadBytes } from 'firebase/storage'

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

  describe('Firestore: Users access control', () => {
    it('allows user to read and update own profile and consent', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users/alice'), {
          id: 'alice',
          email: 'alice@example.com',
          accessStatus: 'active',
          workspaceId: 'alice',
          profile: {
            displayName: 'Alice',
            companyName: 'Acme',
            businessType: 'agency_or_studio',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const userRef = doc(aliceDb, 'users/alice')

      await assertSucceeds(getDoc(userRef))

      await assertSucceeds(
        updateDoc(userRef, {
          profile: {
            displayName: 'Alice Cooper',
            companyName: 'Acme Studio',
            businessType: 'agency_or_studio',
          },
          updatedAt: Date.now(),
        })
      )

      await assertSucceeds(
        updateDoc(userRef, {
          consent: {
            documentVersion: '2026-10-v1',
            acceptedAt: Date.now(),
          },
          updatedAt: Date.now(),
        })
      )
    })

    it('denies user from modifying accessStatus or workspaceId', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users/alice'), {
          id: 'alice',
          email: 'alice@example.com',
          accessStatus: 'waitlist',
          workspaceId: 'alice',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const userRef = doc(aliceDb, 'users/alice')

      await assertFails(
        updateDoc(userRef, {
          accessStatus: 'active',
          updatedAt: Date.now(),
        })
      )

      await assertFails(
        updateDoc(userRef, {
          workspaceId: 'other-workspace',
          updatedAt: Date.now(),
        })
      )
    })

    it('denies non-owner from reading, updating, or deleting user document', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users/alice'), {
          id: 'alice',
          accessStatus: 'active',
          workspaceId: 'alice',
        })
      })

      const bobDb = testEnv.authenticatedContext('bob', { access: 'active' }).firestore()
      const aliceRef = doc(bobDb, 'users/alice')

      await assertFails(getDoc(aliceRef))
      await assertFails(
        updateDoc(aliceRef, {
          updatedAt: Date.now(),
        })
      )
      await assertFails(deleteDoc(aliceRef))
    })

    it('denies clients from creating or deleting user document directly', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore()
      const userRef = doc(aliceDb, 'users/alice')

      await assertFails(
        setDoc(userRef, {
          id: 'alice',
          accessStatus: 'active',
          workspaceId: 'alice',
        })
      )
    })
  })

  describe('Firestore: Cases access control with access status', () => {
    it('allows active user to create, read, and update own case', async () => {
      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
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

    it('denies user in waitlist from reading or creating cases', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users/waitlist-user'), {
          id: 'waitlist-user',
          accessStatus: 'waitlist',
          workspaceId: 'waitlist-user',
        })
        await setDoc(doc(adminDb, 'cases/case-waitlist'), {
          ownerId: 'waitlist-user',
          clientLabel: 'Pre-existing Case',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const waitlistDb = testEnv.authenticatedContext('waitlist-user', { access: 'waitlist' }).firestore()
      const newCaseRef = doc(waitlistDb, 'cases/case-new')
      const existingCaseRef = doc(waitlistDb, 'cases/case-waitlist')

      await assertFails(
        setDoc(newCaseRef, {
          ownerId: 'waitlist-user',
          clientLabel: 'Attempted Case',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )

      await assertFails(getDoc(existingCaseRef))
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

      const bobDb = testEnv.authenticatedContext('bob', { access: 'active' }).firestore()
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
          clientLabel: 'Alice Case',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      const caseRef = doc(unauthDb, 'cases/case-1')

      await assertFails(getDoc(caseRef))
      await assertFails(
        setDoc(caseRef, {
          ownerId: 'alice',
          clientLabel: 'Hacked',
          status: 'draft',
        })
      )
    })

    it('denies creating a case with another users ownerId', async () => {
      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const caseRef = doc(aliceDb, 'cases/case-2')

      await assertFails(
        setDoc(caseRef, {
          ownerId: 'bob',
          clientLabel: 'Spoofed Owner',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )
    })

    it('denies changing ownerId on existing case', async () => {
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

      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const caseRef = doc(aliceDb, 'cases/case-1')

      await assertFails(
        updateDoc(caseRef, {
          ownerId: 'bob',
          updatedAt: Date.now(),
        })
      )
    })

    it('prevents client from creating or updating pipeline-controlled fields', async () => {
      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const caseRef = doc(aliceDb, 'cases/case-pipeline-test')

      await assertFails(
        setDoc(caseRef, {
          ownerId: 'alice',
          clientLabel: 'Illegal Field Test',
          status: 'draft',
          transcript: { segments: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )

      await assertSucceeds(
        setDoc(caseRef, {
          ownerId: 'alice',
          clientLabel: 'Legal Case',
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      )

      await assertFails(
        updateDoc(caseRef, {
          transcript: { segments: [{ start: 0, end: 1, text: 'hi' }] },
          updatedAt: Date.now(),
        })
      )

      await assertFails(
        updateDoc(caseRef, {
          failReason: 'Injected Error',
          updatedAt: Date.now(),
        })
      )

      await assertFails(
        updateDoc(caseRef, {
          stageProgress: 100,
          updatedAt: Date.now(),
        })
      )
    })

    it('handles feedback and events creation rules', async () => {
      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const feedbackRef = doc(aliceDb, 'feedback/fb-1')
      const eventRef = doc(aliceDb, 'events/ev-1')

      await assertSucceeds(
        setDoc(feedbackRef, {
          userId: 'alice',
          message: 'Great service!',
          createdAt: Date.now(),
        })
      )

      await assertSucceeds(
        setDoc(eventRef, {
          userId: 'alice',
          name: 'case_created',
          createdAt: Date.now(),
        })
      )

      await assertFails(getDoc(feedbackRef))
      await assertFails(
        updateDoc(feedbackRef, {
          message: 'Updated feedback',
        })
      )
    })

    it('denies non-admin from reading or writing beta_signups', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'beta_signups/signup-1'), {
          source: 'web',
          email: 'founder@studio.com',
          status: 'new',
          createdAt: Date.now(),
        })
      })

      const clientDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const clientRef = doc(clientDb, 'beta_signups/signup-1')
      const newRef = doc(clientDb, 'beta_signups/signup-new')

      await assertFails(getDoc(clientRef))
      await assertFails(
        setDoc(newRef, {
          source: 'web',
          email: 'alice@test.com',
          status: 'new',
        })
      )
      await assertFails(deleteDoc(clientRef))

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(unauthDb, 'beta_signups/signup-1')))
      await assertFails(
        setDoc(doc(unauthDb, 'beta_signups/signup-unauth'), {
          source: 'web',
          email: 'unauth@test.com',
        })
      )
    })

    it('allows admin to read, create, and update beta_signups and invites', async () => {
      const adminDb = testEnv.authenticatedContext('admin-1', { admin: true }).firestore()
      const signupRef = doc(adminDb, 'beta_signups/signup-admin-test')
      const inviteRef = doc(adminDb, 'invites/PF-9999-ZZ')

      await assertSucceeds(
        setDoc(signupRef, {
          source: 'web',
          email: 'prospect@acme.ru',
          status: 'new',
          createdAt: Date.now(),
        })
      )

      await assertSucceeds(getDoc(signupRef))

      await assertSucceeds(
        updateDoc(signupRef, {
          status: 'approved',
          inviteCode: 'PF-9999-ZZ',
        })
      )

      await assertSucceeds(
        setDoc(inviteRef, {
          code: 'PF-9999-ZZ',
          status: 'issued',
          expiresAt: Date.now() + 1000000,
          createdBy: 'admin-1',
          createdAt: Date.now(),
        })
      )

      await assertSucceeds(getDoc(inviteRef))
    })

    it('denies non-admin clients from reading or writing invites and telegram tokens', async () => {
      const aliceDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const inviteRef = doc(aliceDb, 'invites/INVITE123')
      const tokenRef = doc(aliceDb, 'telegram_link_tokens/token-abc')

      await assertFails(getDoc(inviteRef))
      await assertFails(
        setDoc(inviteRef, {
          code: 'INVITE123',
          status: 'issued',
        })
      )

      await assertFails(getDoc(tokenRef))
      await assertFails(
        setDoc(tokenRef, {
          token: 'token-abc',
          uid: 'alice',
        })
      )
    })
  })

  describe('Storage: Access control and file constraints', () => {
    it('allows active owner to upload and read case files', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'processing',
        })
      })

      const aliceStorage = testEnv.authenticatedContext('alice', { access: 'active' }).storage()
      const aliceFileRef = ref(aliceStorage, 'cases/case-1/screenshot.png')
      const smallPngData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

      await assertSucceeds(
        uploadBytes(aliceFileRef, smallPngData, {
          contentType: 'image/png',
        })
      )

      await assertSucceeds(getMetadata(aliceFileRef))
    })

    it('denies waitlist owner from uploading case files', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users/waitlist-user'), {
          id: 'waitlist-user',
          accessStatus: 'waitlist',
          workspaceId: 'waitlist-user',
        })
        await setDoc(doc(adminDb, 'cases/case-waitlist'), {
          ownerId: 'waitlist-user',
          status: 'processing',
        })
      })

      const waitlistStorage = testEnv.authenticatedContext('waitlist-user', { access: 'waitlist' }).storage()
      const fileRef = ref(waitlistStorage, 'cases/case-waitlist/screenshot.png')
      const smallPngData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

      await assertFails(
        uploadBytes(fileRef, smallPngData, {
          contentType: 'image/png',
        })
      )
    })

    it('denies non-owner from uploading, reading, or deleting case files', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'cases/case-1'), {
          ownerId: 'alice',
          status: 'processing',
        })
      })

      const aliceStorage = testEnv.authenticatedContext('alice', { access: 'active' }).storage()
      const bobStorage = testEnv.authenticatedContext('bob', { access: 'active' }).storage()

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

      const aliceStorage = testEnv.authenticatedContext('alice', { access: 'active' }).storage()
      const fileRef = ref(aliceStorage, 'cases/case-1/exploit.exe')

      await assertFails(
        uploadBytes(fileRef, new Uint8Array([1, 2, 3]), {
          contentType: 'application/x-msdownload',
        })
      )
    })
  })
})
