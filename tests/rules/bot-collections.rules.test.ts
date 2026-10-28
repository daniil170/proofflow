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

describe('Bot Collections Security Rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-proofflow-bot-rules-test',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 8080,
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
    }
  })

  describe('support_tickets collection', () => {
    it('allows backend/admin access with disabled rules', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        const ticketRef = doc(adminDb, 'support_tickets/ticket-1')
        await assertSucceeds(
          setDoc(ticketRef, {
            subject: 'Help needed',
            status: 'open',
            createdAt: Date.now(),
          })
        )
        await assertSucceeds(getDoc(ticketRef))
        await assertSucceeds(updateDoc(ticketRef, { status: 'closed' }))
        await assertSucceeds(deleteDoc(ticketRef))
      })
    })

    it('denies unauthenticated client access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'support_tickets/ticket-1'), {
          subject: 'Existing ticket',
        })
      })

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      const ticketRef = doc(unauthDb, 'support_tickets/ticket-1')

      await assertFails(getDoc(ticketRef))
      await assertFails(setDoc(ticketRef, { subject: 'New ticket' }))
      await assertFails(updateDoc(ticketRef, { subject: 'Updated ticket' }))
      await assertFails(deleteDoc(ticketRef))
    })

    it('denies authenticated client access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'support_tickets/ticket-1'), {
          subject: 'Existing ticket',
        })
      })

      const userDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const ticketRef = doc(userDb, 'support_tickets/ticket-1')

      await assertFails(getDoc(ticketRef))
      await assertFails(setDoc(ticketRef, { subject: 'New ticket' }))
      await assertFails(updateDoc(ticketRef, { subject: 'Updated ticket' }))
      await assertFails(deleteDoc(ticketRef))
    })

    it('denies admin client access via client SDK', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'support_tickets/ticket-1'), {
          subject: 'Existing ticket',
        })
      })

      const adminClientDb = testEnv.authenticatedContext('admin-user', { admin: true }).firestore()
      const ticketRef = doc(adminClientDb, 'support_tickets/ticket-1')

      await assertFails(getDoc(ticketRef))
      await assertFails(setDoc(ticketRef, { subject: 'New ticket' }))
      await assertFails(updateDoc(ticketRef, { subject: 'Updated ticket' }))
      await assertFails(deleteDoc(ticketRef))
    })
  })

  describe('ideas collection', () => {
    it('allows backend/admin access with disabled rules', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        const ideaRef = doc(adminDb, 'ideas/idea-1')
        await assertSucceeds(
          setDoc(ideaRef, {
            title: 'New Feature',
            votesCount: 0,
            createdAt: Date.now(),
          })
        )
        await assertSucceeds(getDoc(ideaRef))
        await assertSucceeds(updateDoc(ideaRef, { votesCount: 1 }))
        await assertSucceeds(deleteDoc(ideaRef))
      })
    })

    it('denies unauthenticated client access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'ideas/idea-1'), {
          title: 'Existing idea',
        })
      })

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      const ideaRef = doc(unauthDb, 'ideas/idea-1')

      await assertFails(getDoc(ideaRef))
      await assertFails(setDoc(ideaRef, { title: 'New idea' }))
      await assertFails(updateDoc(ideaRef, { title: 'Updated idea' }))
      await assertFails(deleteDoc(ideaRef))
    })

    it('denies authenticated client access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'ideas/idea-1'), {
          title: 'Existing idea',
        })
      })

      const userDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const ideaRef = doc(userDb, 'ideas/idea-1')

      await assertFails(getDoc(ideaRef))
      await assertFails(setDoc(ideaRef, { title: 'New idea' }))
      await assertFails(updateDoc(ideaRef, { title: 'Updated idea' }))
      await assertFails(deleteDoc(ideaRef))
    })

    it('denies admin client access via client SDK', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'ideas/idea-1'), {
          title: 'Existing idea',
        })
      })

      const adminClientDb = testEnv.authenticatedContext('admin-user', { admin: true }).firestore()
      const ideaRef = doc(adminClientDb, 'ideas/idea-1')

      await assertFails(getDoc(ideaRef))
      await assertFails(setDoc(ideaRef, { title: 'New idea' }))
      await assertFails(updateDoc(ideaRef, { title: 'Updated idea' }))
      await assertFails(deleteDoc(ideaRef))
    })
  })

  describe('idea_votes collection', () => {
    it('allows backend/admin access with disabled rules', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        const voteRef = doc(adminDb, 'idea_votes/vote-1')
        await assertSucceeds(
          setDoc(voteRef, {
            ideaId: 'idea-1',
            userId: 'alice',
            createdAt: Date.now(),
          })
        )
        await assertSucceeds(getDoc(voteRef))
        await assertSucceeds(updateDoc(voteRef, { ideaId: 'idea-2' }))
        await assertSucceeds(deleteDoc(voteRef))
      })
    })

    it('denies unauthenticated client access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'idea_votes/vote-1'), {
          ideaId: 'idea-1',
        })
      })

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      const voteRef = doc(unauthDb, 'idea_votes/vote-1')

      await assertFails(getDoc(voteRef))
      await assertFails(setDoc(voteRef, { ideaId: 'idea-2' }))
      await assertFails(updateDoc(voteRef, { ideaId: 'idea-3' }))
      await assertFails(deleteDoc(voteRef))
    })

    it('denies authenticated client access', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'idea_votes/vote-1'), {
          ideaId: 'idea-1',
        })
      })

      const userDb = testEnv.authenticatedContext('alice', { access: 'active' }).firestore()
      const voteRef = doc(userDb, 'idea_votes/vote-1')

      await assertFails(getDoc(voteRef))
      await assertFails(setDoc(voteRef, { ideaId: 'idea-2' }))
      await assertFails(updateDoc(voteRef, { ideaId: 'idea-3' }))
      await assertFails(deleteDoc(voteRef))
    })

    it('denies admin client access via client SDK', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'idea_votes/vote-1'), {
          ideaId: 'idea-1',
        })
      })

      const adminClientDb = testEnv.authenticatedContext('admin-user', { admin: true }).firestore()
      const voteRef = doc(adminClientDb, 'idea_votes/vote-1')

      await assertFails(getDoc(voteRef))
      await assertFails(setDoc(voteRef, { ideaId: 'idea-2' }))
      await assertFails(updateDoc(voteRef, { ideaId: 'idea-3' }))
      await assertFails(deleteDoc(voteRef))
    })
  })
})
