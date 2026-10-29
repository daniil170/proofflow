import type { Application, ApplicationStatus } from '@/entities/application'
import type { Invite } from '@/entities/invite'

export const ADMIN_STORAGE_KEYS = Object.freeze({
  MOCK_APPLICATIONS: 'proofflow_beta_signups',
  MOCK_INVITES: 'proofflow_mock_invites',
})

export type AnalyticsPeriod = '7d' | '30d' | 'all'

export interface DailyDataPoint {
  date: string
  label: string
  count: number
}

export interface FunnelStage {
  stage: ApplicationStatus
  label: string
  count: number
}

export interface AnalyticsData {
  totalApplications: number
  weekApplications: number
  todayApplications: number
  activatedApplications: number
  conversionRate: number
  channelBreakdown: {
    web: number
    telegram: number
  }
  businessTypeBreakdown: Record<string, number>
  dailyTrend: DailyDataPoint[]
  funnel: FunnelStage[]
  hasEvents: boolean
}

export interface ApplicationRepository {
  subscribeApplications(
    callback: (apps: Application[]) => void,
    onError?: (err: Error) => void
  ): () => void
  updateNote(applicationId: string, note: string): Promise<void>
  updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    rejectReason?: string
  ): Promise<void>
  markInvited(applicationId: string): Promise<void>
  deleteApplication(applicationId: string): Promise<void>
}

export interface AdminInviteRepository {
  createInvite(applicationId: string): Promise<{ success: boolean; invite: Invite; reused?: boolean }>
  recreateInvite(applicationId: string): Promise<{ success: boolean; invite: Invite }>
  revokeInvite(code: string, reason?: string): Promise<{ success: boolean }>
  subscribeInvites(callback: (invites: Invite[]) => void): () => void
}

export interface AnalyticsRepository {
  getAnalytics(period: AnalyticsPeriod): Promise<AnalyticsData>
}
