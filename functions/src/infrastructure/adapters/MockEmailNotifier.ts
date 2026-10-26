import { CaseEmailPayload, EmailNotifier } from '../ports/EmailNotifier.js'

export class MockEmailNotifier implements EmailNotifier {
  public sentEmails: CaseEmailPayload[] = []

  async sendReviewReadyEmail(payload: CaseEmailPayload): Promise<void> {
    this.sentEmails.push({ ...payload })
  }
}
