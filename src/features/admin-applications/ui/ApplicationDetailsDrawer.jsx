import { useState } from 'react'
import PropTypes from 'prop-types'
import { useAdminInvite } from '@/features/admin-invites'
import styles from './ApplicationDetailsDrawer.module.css'

export const ApplicationDetailsDrawer = ({
  application,
  onClose,
  onSaveNote,
  onUpdateStatus,
}) => {
  const [note, setNote] = useState(application?.ownerNote || '')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState('')

  const {
    template,
    isLoading: isInviteLoading,
    copiedKey,
    setTemplate,
    createInvite,
    recreateInvite,
    revokeInvite,
    markInvited,
    buildInviteLink,
    buildMessage,
    copyToClipboard,
    openMailto,
    openTelegram,
  } = useAdminInvite()

  if (!application) return null

  const handleApprove = async () => {
    setActionError('')
    try {
      await createInvite(application.id)
    } catch (err) {
      setActionError(err?.message || 'Не удалось создать приглашение')
    }
  }

  const handleRecreate = async () => {
    setActionError('')
    try {
      await recreateInvite(application.id)
    } catch (err) {
      setActionError(err?.message || 'Не удалось перевыпустить код')
    }
  }

  const handleRevoke = async () => {
    if (!application.inviteCode) return
    setActionError('')
    try {
      await revokeInvite(application.inviteCode, 'Отозвано администратором')
    } catch (err) {
      setActionError(err?.message || 'Не удалось отозвать код')
    }
  }

  const handleMarkInvited = async () => {
    setActionError('')
    try {
      await markInvited(application.id)
    } catch (err) {
      setActionError(err?.message || 'Не удалось обновить статус')
    }
  }

  const handleSaveNote = async () => {
    setIsSavingNote(true)
    setActionError('')
    try {
      await onSaveNote(application.id, note)
    } catch (err) {
      setActionError(err?.message || 'Не удалось сохранить заметку')
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleConfirmReject = async () => {
    setActionError('')
    try {
      await onUpdateStatus(application.id, 'rejected', rejectReason)
      setRejectPromptOpen(false)
    } catch (err) {
      setActionError(err?.message || 'Не удалось отклонить заявку')
    }
  }

  const handleReturnToNew = async () => {
    setActionError('')
    try {
      await onUpdateStatus(application.id, 'new')
    } catch (err) {
      setActionError(err?.message || 'Не удалось вернуть статус')
    }
  }

  const code = application.inviteCode
  const contactName =
    application.telegramUsername ||
    (application.email ? application.email.split('@')[0] : 'партнёр')
  const inviteLink = code ? buildInviteLink(code) : ''
  const inviteMessage = code ? buildMessage(code, contactName) : ''

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <h2 className={styles.title}>Карточка заявки</h2>
            <p className={styles.subtitle}>ID: {application.id}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Действия и статус</h3>
            <div className={styles.actionsCard}>
              {actionError && (
                <div
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  {actionError}
                </div>
              )}
              <div className={styles.actionsButtons}>
                {!code && application.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={isInviteLoading}
                    onClick={handleApprove}
                    className={styles.primaryBtn}
                  >
                    Одобрить заявку
                  </button>
                )}

                {code && application.status !== 'invited' && application.status !== 'activated' && (
                  <button
                    type="button"
                    disabled={isInviteLoading}
                    onClick={handleMarkInvited}
                    className={styles.primaryBtn}
                  >
                    Отметить как отправлено
                  </button>
                )}

                {application.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={isInviteLoading}
                    onClick={() => setRejectPromptOpen(true)}
                    className={styles.dangerBtn}
                  >
                    Отклонить
                  </button>
                )}

                {application.status !== 'new' && (
                  <button
                    type="button"
                    disabled={isInviteLoading}
                    onClick={handleReturnToNew}
                    className={styles.secondaryBtn}
                  >
                    Вернуть в новые
                  </button>
                )}

                {application.telegramUsername && (
                  <a
                    href={`https://t.me/${application.telegramUsername.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondaryBtn}
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Открыть в Telegram ↗
                  </a>
                )}
              </div>

              {rejectPromptOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Причина отклонения (необязательно, для себя)"
                    style={{
                      padding: '0.45rem',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border-light)',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleConfirmReject}
                      className={styles.dangerBtn}
                    >
                      Подтвердить отклонение
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectPromptOpen(false)}
                      className={styles.secondaryBtn}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {code && (
                <div className={styles.inviteBox}>
                  <div className={styles.codeRow}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      Инвайт-код:
                    </span>
                    <span className={styles.codeDisplay}>{code}</span>
                  </div>

                  <div className={styles.copyTools}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(code, 'code')}
                      className={styles.smallCopyBtn}
                    >
                      {copiedKey === 'code' ? 'Скопировано!' : 'Скопировать код'}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteLink, 'link')}
                      className={styles.smallCopyBtn}
                    >
                      {copiedKey === 'link' ? 'Скопировано!' : 'Скопировать ссылку'}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteMessage, 'msg')}
                      className={styles.smallCopyBtn}
                    >
                      {copiedKey === 'msg' ? 'Скопировано!' : 'Скопировать сообщение'}
                    </button>
                  </div>

                  <div className={styles.copyTools}>
                    {application.email && (
                      <button
                        type="button"
                        onClick={() => openMailto(application.email, code, contactName)}
                        className={styles.secondaryBtn}
                      >
                        Открыть в почте ↗
                      </button>
                    )}
                    {application.telegramUsername && (
                      <button
                        type="button"
                        onClick={() =>
                          openTelegram(application.telegramUsername, code, contactName)
                        }
                        className={styles.secondaryBtn}
                      >
                        Открыть в Telegram ↗
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRecreate}
                      className={styles.secondaryBtn}
                    >
                      Перевыпустить код
                    </button>
                    <button
                      type="button"
                      onClick={handleRevoke}
                      className={styles.dangerBtn}
                    >
                      Отозвать
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      Шаблон сообщения (редактируемый):
                    </span>
                    <textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      rows={4}
                      className={styles.messagePreview}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ответы и контакты</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Канал</span>
                <span className={styles.fieldValue}>
                  {application.channel || application.source || 'web'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Статус</span>
                <span className={styles.fieldValue}>{application.status}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Электронная почта</span>
                <span className={styles.fieldValue}>{application.email || '—'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Telegram</span>
                <span className={styles.fieldValue}>
                  {application.telegramUsername ? (
                    <a
                      href={`https://t.me/${application.telegramUsername.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactLink}
                    >
                      @{application.telegramUsername.replace(/^@/, '')} ↗
                    </a>
                  ) : application.telegramUserId ? (
                    `ID: ${application.telegramUserId}`
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Сфера деятельности</span>
                <span className={styles.fieldValue}>{application.businessType}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Объем кейсов</span>
                <span className={styles.fieldValue}>{application.casesVolume}</span>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>Как делают кейсы сейчас</span>
                <span className={styles.fieldValue}>
                  {application.currentProcess || '—'}
                </span>
              </div>
              {application.rejectReason && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.fieldLabel}>Причина отклонения</span>
                  <span className={styles.fieldValue}>
                    {application.rejectReason}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Заметка владельца</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Внутренний комментарий по заявке или клиенту..."
              rows={3}
              className={styles.noteArea}
            />
            <button
              type="button"
              disabled={isSavingNote}
              onClick={handleSaveNote}
              className={styles.secondaryBtn}
              style={{ alignSelf: 'flex-start' }}
            >
              {isSavingNote ? 'Сохранение...' : 'Сохранить заметку'}
            </button>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>История действий</h3>
            <div className={styles.historyList}>
              {(!application.history || application.history.length === 0) ? (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  История пуста
                </div>
              ) : (
                application.history.map((item, idx) => (
                  <div key={idx} className={styles.historyItem}>
                    <div>
                      <strong>{item.action}</strong>
                      {item.note ? ` — ${item.note}` : ''} ({item.performedBy})
                    </div>
                    <span className={styles.historyDate}>
                      {new Date(item.timestamp).toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

ApplicationDetailsDrawer.propTypes = {
  application: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
}
