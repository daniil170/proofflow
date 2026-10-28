const STORAGE_KEY = 'proofflow_beta_signups'
const MOCK_LATENCY_MS = 600

const inMemoryStore = []

export const mockBetaSignupGateway = Object.freeze({
  async submit(payload) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

    const submissionId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const record = {
      id: submissionId,
      source: payload.source || 'web',
      channel: payload.channel || payload.source || 'web',
      status: 'new',
      createdAt: Date.now(),
      submittedAt: new Date().toISOString(),
      history: [{ action: 'submitted', timestamp: Date.now(), performedBy: 'client' }],
      ...payload,
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        let existing = []
        if (raw) {
          existing = JSON.parse(raw)
        }
        existing.unshift(record)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      } catch {
        inMemoryStore.unshift(record)
      }
    } else {
      inMemoryStore.unshift(record)
    }

    return {
      success: true,
      id: submissionId,
    }
  },
})
