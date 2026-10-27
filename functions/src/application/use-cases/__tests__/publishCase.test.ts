import { describe, expect, it } from 'vitest'
import { executePublishCase, PublishCaseError } from '../publishCase'
import { executeUnpublishCase, UnpublishCaseError } from '../unpublishCase'
import { extractCaseId } from '../../../interfaces/http'

const createMockDb = (initialCases: Record<string, Record<string, unknown>> = {}) => {
  const casesStore = new Map<string, Record<string, unknown>>()
  const publicCasesStore = new Map<string, Record<string, unknown>>()
  const usersStore = new Map<string, Record<string, unknown>>()

  Object.entries(initialCases).forEach(([k, v]) => {
    casesStore.set(k, { ...v })
  })

  usersStore.set('alice', {
    id: 'alice',
    profile: { companyName: 'Acme Agency' },
  })

  return {
    casesStore,
    publicCasesStore,
    usersStore,
    collection: (colName: string) => ({
      doc: (id: string) => ({
        get: async () => {
          let store = casesStore
          if (colName === 'publicCases') store = publicCasesStore
          if (colName === 'users') store = usersStore
          const data = store.get(id)
          return {
            exists: Boolean(data),
            data: () => data,
          }
        },
        set: async (data: Record<string, unknown>) => {
          let store = casesStore
          if (colName === 'publicCases') store = publicCasesStore
          if (colName === 'users') store = usersStore
          store.set(id, { ...data })
        },
        update: async (patch: Record<string, unknown>) => {
          let store = casesStore
          if (colName === 'publicCases') store = publicCasesStore
          if (colName === 'users') store = usersStore
          const existing = store.get(id) || {}
          store.set(id, { ...existing, ...patch })
        },
        delete: async () => {
          let store = casesStore
          if (colName === 'publicCases') store = publicCasesStore
          if (colName === 'users') store = usersStore
          store.delete(id)
        },
      }),
    }),
  }
}

describe('publishCase use-case', () => {
  const readyCaseData = {
    id: 'case-100',
    ownerId: 'alice',
    status: 'ready',
    clientLabel: 'ООО Ромашка',
    consentConfirmed: true,
    sources: [
      { id: 'src-1', kind: 'audio', storagePath: 'cases/case-100/audio.mp3', order: 0 },
    ],
    transcripts: [
      { sourceId: 'src-1', segments: [{ text: 'секретные переговоры', start: 0, end: 10 }] },
    ],
    evidences: [
      { id: 'ev-1', sourceId: 'src-1', reference: '0:05', exactQuote: 'секрет' },
    ],
    chatExtractions: [{ screenshotSourceId: 'src-2', messages: [] }],
    draft: {
      metric: { value: '+45%', label: 'конверсия в заявку' },
      problem: 'Мало заявок с сайта',
      solution: 'Переработали структуру первого экрана',
      result: 'Увеличили конверсию почти в полтора раза',
      quote: { text: 'Крутой результат!', authorLabel: 'Ольга П.', authorRole: 'Маркетолог' },
      tags: ['SMM', 'Кейс'],
    },
    selectedVariant: 'dark',
    branding: {
      showLogo: true,
      companyName: 'Acme Agency',
    },
  }

  it('fails if non-owner attempts to publish', async () => {
    const mockDb = createMockDb({ 'case-100': readyCaseData })

    await expect(
      executePublishCase({
        caseId: 'case-100',
        uid: 'bob',
        db: mockDb as never,
      })
    ).rejects.toThrowError(PublishCaseError)
  })

  it('fails if case is not in ready status', async () => {
    const mockDb = createMockDb({
      'case-100': { ...readyCaseData, status: 'review' },
    })

    await expect(
      executePublishCase({
        caseId: 'case-100',
        uid: 'alice',
        db: mockDb as never,
      })
    ).rejects.toThrowError(PublishCaseError)
  })

  it('fails if consent is not confirmed', async () => {
    const mockDb = createMockDb({
      'case-100': { ...readyCaseData, consentConfirmed: false },
    })

    await expect(
      executePublishCase({
        caseId: 'case-100',
        uid: 'alice',
        consentConfirmed: false,
        db: mockDb as never,
      })
    ).rejects.toThrowError('согласие клиента')
  })

  it('publishes clean copy without private fields and updates status to published', async () => {
    const mockDb = createMockDb({ 'case-100': readyCaseData })

    const result = await executePublishCase({
      caseId: 'case-100',
      uid: 'alice',
      db: mockDb as never,
    })

    expect(result.success).toBe(true)
    expect(result.publicUrl).toBe('https://proofflow.ru/c/case-100')

    const publicCopy = mockDb.publicCasesStore.get('case-100')
    expect(publicCopy).toBeDefined()
    expect(publicCopy?.metric).toBe('+45%')
    expect(publicCopy?.metricLabel).toBe('конверсия в заявку')
    expect(publicCopy?.problem).toBe('Мало заявок с сайта')
    expect(publicCopy?.author).toBe('Ольга П.')
    expect(publicCopy?.companyName).toBe('Acme Agency')

    expect(publicCopy).not.toHaveProperty('sources')
    expect(publicCopy).not.toHaveProperty('transcripts')
    expect(publicCopy).not.toHaveProperty('evidences')
    expect(publicCopy).not.toHaveProperty('chatExtractions')
    expect(publicCopy).not.toHaveProperty('ownerId')
    expect(publicCopy).not.toHaveProperty('clientLabel')
    expect(publicCopy).not.toHaveProperty('storagePath')

    const updatedCase = mockDb.casesStore.get('case-100')
    expect(updatedCase?.status).toBe('published')
    expect(updatedCase?.publishedAt).toBeDefined()
  })

  it('unpublishes case, removes public copy and reverts status to ready', async () => {
    const mockDb = createMockDb({
      'case-100': { ...readyCaseData, status: 'published', publishedAt: 1730000000000 },
    })
    mockDb.publicCasesStore.set('case-100', { id: 'case-100', metric: '+45%' })

    const result = await executeUnpublishCase({
      caseId: 'case-100',
      uid: 'alice',
      db: mockDb as never,
    })

    expect(result.success).toBe(true)
    expect(mockDb.publicCasesStore.has('case-100')).toBe(false)

    const updatedCase = mockDb.casesStore.get('case-100')
    expect(updatedCase?.status).toBe('ready')
    expect(updatedCase?.publishedAt).toBeNull()
  })

  it('fails to unpublish if user is not owner', async () => {
    const mockDb = createMockDb({
      'case-100': { ...readyCaseData, status: 'published' },
    })

    await expect(
      executeUnpublishCase({
        caseId: 'case-100',
        uid: 'attacker',
        db: mockDb as never,
      })
    ).rejects.toThrowError(UnpublishCaseError)
  })
})

describe('extractCaseId helper', () => {
  it('extracts caseId from query', () => {
    expect(extractCaseId({ query: { id: 'case-xyz' } })).toBe('case-xyz')
  })

  it('extracts caseId from /c/case-xyz path', () => {
    expect(extractCaseId({ path: '/c/case-xyz' })).toBe('case-xyz')
  })

  it('extracts caseId from /case-xyz path', () => {
    expect(extractCaseId({ path: '/case-xyz' })).toBe('case-xyz')
  })
})
