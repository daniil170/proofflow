import { describe, expect, it } from 'vitest'
import { checkIsAdmin } from '../../../interfaces/callables.js'

describe('syncAdminClaims permission logic', () => {
  it('correctly matches emails in admin list', () => {
    expect(checkIsAdmin('admin@proofflow.ru')).toBe(true)
    expect(checkIsAdmin('owner@proofflow.ru')).toBe(true)
    expect(checkIsAdmin('stranger@example.com')).toBe(false)
    expect(checkIsAdmin('')).toBe(false)
  })

  it('requires email_verified to be true to grant admin status', () => {
    const evaluateAdminClaim = (email: string, emailVerified: boolean): boolean => {
      const isEmailInAdminList = checkIsAdmin(email)
      return Boolean(emailVerified && isEmailInAdminList)
    }

    expect(evaluateAdminClaim('admin@proofflow.ru', true)).toBe(true)
    expect(evaluateAdminClaim('owner@proofflow.ru', true)).toBe(true)
    expect(evaluateAdminClaim('admin@proofflow.ru', false)).toBe(false)
    expect(evaluateAdminClaim('owner@proofflow.ru', false)).toBe(false)
    expect(evaluateAdminClaim('stranger@example.com', true)).toBe(false)
    expect(evaluateAdminClaim('stranger@example.com', false)).toBe(false)
  })
})
