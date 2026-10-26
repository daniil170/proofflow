export interface CaseEmailPayload {
  toEmail: string
  caseId: string
  clientLabel: string
  caseUrl: string
}

export interface EmailNotifier {
  sendReviewReadyEmail(payload: CaseEmailPayload): Promise<void>
}
