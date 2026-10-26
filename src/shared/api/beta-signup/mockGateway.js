const STORAGE_KEY = 'proofflow_beta_signups'
const MOCK_LATENCY_MS = 600

const inMemoryStore = []

export const mockBetaSignupGateway = Object.freeze({
  async submit(payload) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

    const submissionId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const record = {
      id: submissionId,
      ...payload,
      submittedAt: new Date().toISOString(),
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
        existing.push(record)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      } catch {
        inMemoryStore.push(record)
      }
    } else {
      inMemoryStore.push(record)
    }

    return {
      success: true,
      id: submissionId,
    }
  },
})
