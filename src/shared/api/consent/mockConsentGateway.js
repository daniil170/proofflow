import { getCaseRepository } from '../cases/index.js'

export const mockConsentGateway = Object.freeze({
  async createConsentRequest(caseId) {
    const caseRepo = getCaseRepository()
    const caseItem = await caseRepo.getById(caseId)

    const token = `mock-token-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const draft = caseItem?.draft || {}

    const record = {
      token,
      caseId,
      ownerId: caseItem?.ownerId || 'mock-user',
      clientLabel: caseItem?.clientLabel || 'Клиент',
      status: 'pending',
      createdAt: Date.now(),
      anonymizedCase: {
        metric: draft.metric?.value || '+45%',
        metricLabel: draft.metric?.label || 'рост выручки',
        problem: draft.problem || 'Долгий цикл согласования',
        solution: draft.solution || 'Внедрили ProofFlow',
        result: draft.result || 'Сократили время до 1 дня',
        quote: draft.quote?.text || 'Кейс получился отличный!',
        author: draft.quote?.authorLabel || 'Анна К.',
        company: caseItem?.branding?.companyName || 'ProofFlow',
      },
    }

    try {
      const stored = JSON.parse(localStorage.getItem('proofflow_mock_consents') || '{}')
      stored[token] = record
      localStorage.setItem('proofflow_mock_consents', JSON.stringify(stored))
    } catch {
      window._mockConsents = window._mockConsents || {}
      window._mockConsents[token] = record
    }

    await caseRepo.update(caseId, {
      clientConsentStatus: 'pending',
    })

    return {
      token,
      url: `${window.location.origin}/consent/${token}`,
    }
  },

  async getConsentByToken(token) {
    const getStored = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('proofflow_mock_consents') || '{}')
        return stored[token] || null
      } catch {
        return window._mockConsents?.[token] || null
      }
    }

    const record = getStored()

    if (!record) {
      return {
        token,
        caseId: 'demo-case',
        status: 'pending',
        createdAt: Date.now(),
        anonymizedCase: {
          metric: '+45%',
          metricLabel: 'рост выручки',
          problem: 'Долгий цикл согласования',
          solution: 'Внедрили ProofFlow для автоматизации',
          result: 'Сократили время согласования до 1 дня',
          quote: 'Кейс получился отличный, согласовали моментально!',
          author: 'Анна К.',
          company: 'ProofFlow',
        },
      }
    }

    return record
  },

  async submitClientConsent(token, decision) {
    const updateStored = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('proofflow_mock_consents') || '{}')
        if (stored[token]) {
          stored[token].status = decision
          stored[token].decidedAt = Date.now()
          localStorage.setItem('proofflow_mock_consents', JSON.stringify(stored))
          return stored[token]
        }
      } catch {
        if (window._mockConsents?.[token]) {
          window._mockConsents[token].status = decision
          window._mockConsents[token].decidedAt = Date.now()
          return window._mockConsents[token]
        }
      }
      return null
    }

    const record = updateStored()

    if (record?.caseId) {
      const caseRepo = getCaseRepository()
      if (decision === 'approved') {
        await caseRepo.update(record.caseId, {
          clientConsentStatus: 'approved',
          consentConfirmed: true,
        })
      } else {
        await caseRepo.update(record.caseId, {
          clientConsentStatus: 'declined',
        })
      }
    }

    return {
      success: true,
      status: decision,
    }
  },
})
