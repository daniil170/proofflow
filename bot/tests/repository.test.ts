import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryBetaApplicationRepository } from '../src/shared/storage/InMemoryBetaApplicationRepository.js'

describe('InMemoryBetaApplicationRepository', () => {
  let repo: InMemoryBetaApplicationRepository

  beforeEach(() => {
    repo = new InMemoryBetaApplicationRepository()
  })

  it('creates and finds application by telegramUserId', async () => {
    const created = await repo.create({
      source: 'telegram',
      telegramUserId: 12345,
      telegramUsername: 'testuser',
      businessType: 'Веб-студия',
      casesVolume: '4-10',
      consent: true,
      deepLink: 'landing',
    })

    expect(created.id).toBeDefined()
    expect(created.telegramUserId).toBe(12345)

    const found = await repo.findByTelegramUserId(12345)
    expect(found).not.toBeNull()
    expect(found?.telegramUsername).toBe('testuser')
    expect(found?.businessType).toBe('Веб-студия')
  })

  it('updates existing application', async () => {
    const created = await repo.create({
      source: 'telegram',
      telegramUserId: 54321,
      businessType: 'Консалтинг',
      casesVolume: '1-3',
      consent: true,
    })

    const updated = await repo.update(created.id!, {
      feedbackText: 'Updated feedback note',
    })

    expect(updated.feedbackText).toBe('Updated feedback note')

    const found = await repo.findByTelegramUserId(54321)
    expect(found?.feedbackText).toBe('Updated feedback note')
  })

  it('deletes application by telegramUserId', async () => {
    await repo.create({
      source: 'telegram',
      telegramUserId: 99999,
      businessType: 'Фрилансер',
      casesVolume: '1-3',
      consent: true,
    })

    const deleted = await repo.deleteByTelegramUserId(99999)
    expect(deleted).toBe(true)

    const found = await repo.findByTelegramUserId(99999)
    expect(found).toBeNull()
  })

  it('marks application as unsubscribed and filters it out', async () => {
    await repo.create({
      source: 'telegram',
      telegramUserId: 88888,
      businessType: 'IT-аутсорс',
      casesVolume: 'больше 10',
      consent: true,
    })

    await repo.setUnsubscribed(88888, true)
    const found = await repo.findByTelegramUserId(88888)
    expect(found).toBeNull()
  })
})
