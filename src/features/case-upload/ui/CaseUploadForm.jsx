import PropTypes from 'prop-types'
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
      <aside className={styles.privacyNotice}>
        <span className={styles.privacyIcon}>🔒</span>
        <p className={styles.privacyText}>
          <span className={styles.privacyHighlight}>Подсказка про приватность:</span> перед
          загрузкой закройте на скриншотах конфиденциальные цифры или персональные контакты, которые
          не должны попасть в кейс. Имена и аватары в итоговом кейсе обезличиваются автоматически.
        </p>
      </aside>

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
