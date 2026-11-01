import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'

export interface AdminUserStats {
  id: string
  email?: string
  displayName?: string
  companyName?: string
  businessType?: string
  telegramUserId?: string | number | null
  accessStatus: 'waitlist' | 'active' | 'blocked'
  caseLimit?: number
  accessExpiresAt?: number | null
  casesCount: number
  downloadsCount: number
  sharesCount: number
  lastActiveAt?: number | null
  createdAt?: number
  updatedAt?: number
}

export interface UpdateUserLimitsPayload {
  userId: string
  caseLimit?: number
  accessExpiresAt?: number | null
  accessStatus?: 'active' | 'blocked' | 'waitlist'
}

export class UpdateUserLimitsError extends Error {
  constructor(
    public code: 'not-found' | 'invalid-argument' | 'permission-denied',
    message: string
  ) {
    super(message)
    this.name = 'UpdateUserLimitsError'
  }
}

export const executeGetAdminUsers = async (
  db: Firestore
): Promise<AdminUserStats[]> => {
  const [usersSnap, casesSnap, eventsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('cases').get(),
    db.collection('events').get().catch(() => ({ docs: [] })),
  ])

  // Group cases by ownerId
  const casesByOwner = new Map<
    string,
    Array<{ createdAt?: number; updatedAt?: number }>
  >()
  for (const doc of casesSnap.docs) {
    const data = doc.data()
    const ownerId = data?.ownerId
    if (ownerId && typeof ownerId === 'string') {
      const list = casesByOwner.get(ownerId) || []
      list.push({
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
      })
      casesByOwner.set(ownerId, list)
    }
  }

  // Aggregate events by userId
  const eventsByUser = new Map<
    string,
    { downloadsCount: number; sharesCount: number; maxTimestamp: number }
  >()
  for (const doc of eventsSnap.docs) {
    const data = doc.data()
    const userId = data?.userId
    if (userId && typeof userId === 'string') {
      const current = eventsByUser.get(userId) || {
        downloadsCount: 0,
        sharesCount: 0,
        maxTimestamp: 0,
      }
      if (data.eventName === 'png_downloaded') {
        current.downloadsCount++
      } else if (
        data.eventName === 'link_copied' ||
        data.eventName === 'embed_copied'
      ) {
        current.sharesCount++
      }
      if (typeof data.timestamp === 'number' && data.timestamp > current.maxTimestamp) {
        current.maxTimestamp = data.timestamp
      }
      eventsByUser.set(userId, current)
    }
  }

  const users: AdminUserStats[] = usersSnap.docs.map((doc) => {
    const u = doc.data() || {}
    const userId = doc.id
    const userCases = casesByOwner.get(userId) || []
    const userEvents = eventsByUser.get(userId) || {
      downloadsCount: 0,
      sharesCount: 0,
      maxTimestamp: 0,
    }

    const timestamps: number[] = []
    if (typeof u.updatedAt === 'number') timestamps.push(u.updatedAt)
    if (typeof u.createdAt === 'number') timestamps.push(u.createdAt)
    if (userEvents.maxTimestamp > 0) timestamps.push(userEvents.maxTimestamp)
    for (const c of userCases) {
      if (typeof c.updatedAt === 'number') timestamps.push(c.updatedAt)
      if (typeof c.createdAt === 'number') timestamps.push(c.createdAt)
    }

    const lastActiveAt = timestamps.length > 0 ? Math.max(...timestamps) : null

    return {
      id: userId,
      email: u.email || '',
      displayName: u.profile?.displayName || '',
      companyName: u.profile?.companyName || '',
      businessType: u.profile?.businessType || '',
      telegramUserId: u.telegramUserId ?? null,
      accessStatus: (u.accessStatus || 'waitlist') as 'waitlist' | 'active' | 'blocked',
      caseLimit: typeof u.caseLimit === 'number' ? u.caseLimit : 3,
      accessExpiresAt: typeof u.accessExpiresAt === 'number' ? u.accessExpiresAt : null,
      casesCount: userCases.length,
      downloadsCount: userEvents.downloadsCount,
      sharesCount: userEvents.sharesCount,
      lastActiveAt,
      createdAt: typeof u.createdAt === 'number' ? u.createdAt : undefined,
      updatedAt: typeof u.updatedAt === 'number' ? u.updatedAt : undefined,
    }
  })

  users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  return users
}

export const executeUpdateUserLimits = async (
  db: Firestore,
  auth: Auth | null,
  payload: UpdateUserLimitsPayload
): Promise<Record<string, unknown>> => {
  const { userId, caseLimit, accessExpiresAt, accessStatus } = payload

  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new UpdateUserLimitsError('invalid-argument', 'Не указан userId')
  }

  const cleanUserId = userId.trim()

  if (caseLimit !== undefined) {
    if (
      typeof caseLimit !== 'number' ||
      !Number.isInteger(caseLimit) ||
      caseLimit < 0
    ) {
      throw new UpdateUserLimitsError(
        'invalid-argument',
        'caseLimit должен быть неотрицательным целым числом'
      )
    }
  }

  if (accessExpiresAt !== undefined && accessExpiresAt !== null) {
    if (
      typeof accessExpiresAt !== 'number' ||
      !Number.isInteger(accessExpiresAt) ||
      accessExpiresAt <= 0
    ) {
      throw new UpdateUserLimitsError(
        'invalid-argument',
        'accessExpiresAt должен быть положительным числовым timestamp или null'
      )
    }
  }

  if (accessStatus !== undefined) {
    const allowedStatuses = ['active', 'blocked', 'waitlist']
    if (!allowedStatuses.includes(accessStatus)) {
      throw new UpdateUserLimitsError(
        'invalid-argument',
        'Недопустимый accessStatus (разрешены: active, blocked, waitlist)'
      )
    }
  }

  const userRef = db.collection('users').doc(cleanUserId)
  const userSnap = await userRef.get()

  if (!userSnap.exists) {
    throw new UpdateUserLimitsError('not-found', 'Пользователь не найден')
  }

  const now = Date.now()
  const updates: Record<string, unknown> = {
    updatedAt: now,
  }

  if (caseLimit !== undefined) {
    updates.caseLimit = caseLimit
  }
  if (accessExpiresAt !== undefined) {
    updates.accessExpiresAt = accessExpiresAt
  }
  if (accessStatus !== undefined) {
    updates.accessStatus = accessStatus
  }

  await userRef.update(updates)

  if (accessStatus && auth) {
    try {
      const authUser = await auth.getUser(cleanUserId)
      const existingClaims = authUser.customClaims || {}
      await auth.setCustomUserClaims(cleanUserId, {
        ...existingClaims,
        access: accessStatus,
      })
    } catch {
      // Ignored if user not found in Firebase Auth
    }
  }

  const updatedSnap = await userRef.get()
  const userData = updatedSnap.data() || {}

  return {
    id: cleanUserId,
    ...userData,
  }
}
