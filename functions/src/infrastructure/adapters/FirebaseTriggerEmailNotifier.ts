import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { CaseEmailPayload, EmailNotifier } from '../ports/EmailNotifier.js'

export class FirebaseTriggerEmailNotifier implements EmailNotifier {
  private mailCollection: string

  constructor(mailCollection = 'mail') {
    this.mailCollection = mailCollection
  }

  async sendReviewReadyEmail(payload: CaseEmailPayload): Promise<void> {
    const db = getFirestore()
    await db.collection(this.mailCollection).add({
      to: payload.toEmail,
      message: {
        subject: `Кейс «${payload.clientLabel}» готов к проверке — ProofFlow`,
        text: `Черновик кейса готов. Ссылка на готовый кейс: ${payload.caseUrl}`,
        html: `<p>Здравствуйте!</p><p>Материалы обработаны. Черновик кейса <strong>«${payload.clientLabel}»</strong> готов к проверке.</p><p><a href="${payload.caseUrl}">Перейти к проверке кейса</a></p><p>Команда ProofFlow</p>`,
      },
      createdAt: FieldValue.serverTimestamp(),
    })
  }
}
