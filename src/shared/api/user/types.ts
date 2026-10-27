import type {
  AccessStatus,
  ConsentRecord,
  UserProfile,
  UserRecord,
} from '@/entities/user'

export const USER_STORAGE_KEYS = Object.freeze({
  MOCK_USER_DOC: 'proofflow_mock_user_doc',
  PENDING_INVITE: 'proofflow_pending_invite_code',
})

export interface CheckInviteResponse {
  valid: boolean
  status: 'issued' | 'used' | 'revoked' | 'expired' | 'not_found'
  message?: string
  expiresAt?: number
  channel?: string
}

export interface RedeemInviteResponse {
  success: boolean
  accessStatus: AccessStatus
  alreadyRedeemed?: boolean
}

export interface TelegramLinkTokenResponse {
  token: string
  botUsername: string
  expiresAt: number
}

export interface UserRepository {
  getUser(uid: string): Promise<UserRecord | null>
  subscribeToUser(
    uid: string,
    callback: (user: UserRecord | null) => void,
    onError?: (err: Error) => void
  ): () => void
  updateProfile(uid: string, profile: UserProfile): Promise<UserProfile>
  acceptConsent(uid: string, consent: ConsentRecord): Promise<ConsentRecord>
  redeemInvite(code: string): Promise<RedeemInviteResponse>
  checkInvite(code: string): Promise<CheckInviteResponse>
  createTelegramLinkToken(): Promise<TelegramLinkTokenResponse>
}
