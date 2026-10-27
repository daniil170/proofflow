import PropTypes from 'prop-types'
import { formatRemainingCases } from '@/shared/config/limits.ts'
import { LockIcon, ClockIcon, BriefcaseIcon } from '@/shared/ui'
import { FileList } from './FileList.jsx'
import { UploadDropzone } from './UploadDropzone.jsx'
import { VoiceRecorder } from './VoiceRecorder.jsx'
import styles from './CaseUploadForm.module.css'

export const CaseUploadForm = ({ uploadState }) => {
  const {
    files,
    clientLabel,
    setClientLabel,
    language,
    setLanguage,
    consentConfirmed,
    setConsentConfirmed,
    errorMessage,
    isSubmitting,
    canSubmit,

    remainingCases,
    isLimitExhausted,
    maxCases = 50,
    storageRetentionDays = 14,
    supportUrl = 'https://t.me/proofflowbot',

    addFiles,
    removeFile,
    moveFileUp,
    moveFileDown,
    handlePaste,

    isRecording,
    isPaused,
    recordingDuration,
    recordedAudioUrl,
    recorderError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    attachVoiceRecording,

    submitAndUpload,
    retryUpload,
    cancelUpload,
    tryExampleCase,
  } = uploadState

  const handleSubmit = (e) => {
    e.preventDefault()
    submitAndUpload()
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      {isLimitExhausted ? (
        <div className={styles.limitsExhaustedAlert} role="alert">
          <strong>Лимит создания кейсов исчерпан</strong>
          <span>
            В рамках текущего тарифа беты доступно {maxCases} кейсов.{' '}
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.limitsLink}
            >
              Написать нам
            </a>
            , чтобы запросить расширение лимита для вашего аккаунта.
          </span>
        </div>
      ) : (
        <div className={styles.limitsBanner}>
          <span className={styles.limitsBadge}>
            <BriefcaseIcon size={14} />
            <span>Доступный объем беты:</span>
            <span className={styles.limitsHighlight}>
              {formatRemainingCases(remainingCases ?? maxCases)}
            </span>
          </span>
          <span className={styles.privacyText}>Лимит: {maxCases} кейсов</span>
        </div>
      )}

      <div className={styles.noticesGrid}>
        <aside className={styles.privacyNotice}>
          <span className={styles.privacyIcon}>
            <LockIcon size={15} />
          </span>
          <p className={styles.privacyText}>
            <span className={styles.privacyHighlight}>Подсказка про приватность:</span> перед
            загрузкой закройте на скриншотах конфиденциальные цифры или персональные контакты.
            Имена и аватары в кейсе обезличиваются автоматически.
          </p>
        </aside>

        <div className={styles.retentionNotice}>
          <span className={styles.retentionIcon}>
            <ClockIcon size={15} />
          </span>
          <span>
            <strong>Срок хранения:</strong> исходные файлы автоматически удаляются через{' '}
            {storageRetentionDays} дней после готовности черновика. Готовый кейс и цитаты сохраняются навсегда.
          </span>
        </div>
      </div>

      {errorMessage && <div className={styles.alertError}>{errorMessage}</div>}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>1. Материалы проекта</h3>
        <UploadDropzone onFilesAdded={addFiles} onPaste={handlePaste} />
      </section>

      <section className={styles.section}>
        <VoiceRecorder
          isRecording={isRecording}
          isPaused={isPaused}
          recordingDuration={recordingDuration}
          recordedAudioUrl={recordedAudioUrl}
          recorderError={recorderError}
          onStartRecording={startRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onStopRecording={stopRecording}
          onDiscardRecording={discardRecording}
          onAttachRecording={attachVoiceRecording}
        />
      </section>

      {files.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Добавленные файлы ({files.length})</h3>
          <FileList
            files={files}
            onRemoveFile={removeFile}
            onMoveUp={moveFileUp}
            onMoveDown={moveFileDown}
            onRetryUpload={retryUpload}
            onCancelUpload={cancelUpload}
          />
        </section>
      )}

      <section className={styles.fieldsGrid}>
        <div className={styles.field}>
          <label htmlFor="client-label" className={styles.label}>
            Название клиента или проекта
            <span className={styles.optionalTag}>(необязательно)</span>
          </label>
          <input
            id="client-label"
            type="text"
            value={clientLabel}
            onChange={(e) => setClientLabel(e.target.value)}
            placeholder="Например: EdTech школа или Внедрение ERP"
            className={styles.input}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="case-language" className={styles.label}>
            Язык материала
          </label>
          <select
            id="case-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.select}
            disabled={isSubmitting}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      <section className={styles.consentCard}>
        <label className={styles.consentRow}>
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => setConsentConfirmed(e.target.checked)}
            className={styles.checkbox}
            disabled={isSubmitting}
          />
          <span className={styles.consentLabel}>
            Клиент согласен на использование его слов и переписки на сайте
          </span>
        </label>

        <div className={styles.scriptBox}>
          <span className={styles.scriptPrompt}>Формулировка для звонка клиенту:</span> «Мы
          упаковываем результаты нашей работы в короткий кейс. Вы не против, если мы покажем рост
          показателей и ключевые цитаты без разглашения коммерческой тайны?»
        </div>
      </section>

      <div className={styles.actionsCard}>
        <button
          type="button"
          onClick={tryExampleCase}
          disabled={isSubmitting}
          className={styles.demoButton}
        >
          Попробовать на примере
        </button>

        <div className={styles.primaryActions}>
          <button type="submit" disabled={!canSubmit} className={styles.submitButton}>
            {isSubmitting ? 'Загрузка и создание...' : 'Создать кейс'}
          </button>
        </div>
      </div>
    </form>
  )
}

CaseUploadForm.propTypes = {
  uploadState: PropTypes.shape({
    files: PropTypes.array.isRequired,
    clientLabel: PropTypes.string.isRequired,
    setClientLabel: PropTypes.func.isRequired,
    language: PropTypes.string.isRequired,
    setLanguage: PropTypes.func.isRequired,
    consentConfirmed: PropTypes.bool.isRequired,
    setConsentConfirmed: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    isSubmitting: PropTypes.bool.isRequired,
    canSubmit: PropTypes.bool.isRequired,
    addFiles: PropTypes.func.isRequired,
    removeFile: PropTypes.func.isRequired,
    moveFileUp: PropTypes.func.isRequired,
    moveFileDown: PropTypes.func.isRequired,
    handlePaste: PropTypes.func.isRequired,
    isRecording: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
    recordingDuration: PropTypes.number.isRequired,
    recordedAudioUrl: PropTypes.string,
    recorderError: PropTypes.string,
    startRecording: PropTypes.func.isRequired,
    pauseRecording: PropTypes.func.isRequired,
    onResumeRecording: PropTypes.func,
    resumeRecording: PropTypes.func.isRequired,
    stopRecording: PropTypes.func.isRequired,
    discardRecording: PropTypes.func.isRequired,
    attachVoiceRecording: PropTypes.func.isRequired,
    submitAndUpload: PropTypes.func.isRequired,
    retryUpload: PropTypes.func.isRequired,
    cancelUpload: PropTypes.func.isRequired,
    tryExampleCase: PropTypes.func.isRequired,
  }).isRequired,
}
