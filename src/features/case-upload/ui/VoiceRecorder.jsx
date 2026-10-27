import PropTypes from 'prop-types'
import { MicIcon, RecordDotIcon } from '@/shared/ui'
import styles from './VoiceRecorder.module.css'

export const VoiceRecorder = ({
  isRecording,
  isPaused,
  recordingDuration,
  recordedAudioUrl,
  recorderError,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onDiscardRecording,
  onAttachRecording,
}) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={`${styles.micIcon} ${isRecording ? styles.micIconActive : ''}`}>
            <MicIcon size={18} />
          </div>
          <div>
            <h4 className={styles.title}>Голосовой пересказ</h4>
            <p className={styles.description}>
              Если нет записи звонка, надиктуйте суть проекта за 1–2 минуты
            </p>
          </div>
        </div>
      </div>

      {recorderError && <p className={styles.errorText}>{recorderError}</p>}

      {!isRecording && !recordedAudioUrl && (
        <div className={styles.idleView}>
          <button type="button" className={styles.recordButton} onClick={onStartRecording}>
            <RecordDotIcon size={12} />
            <span>Запишите пересказ: что сделали и что получилось</span>
          </button>
        </div>
      )}

      {isRecording && (
        <div className={styles.recordingView}>
          <div className={styles.recordingStatus}>
            <span className={styles.timer}>{formatDuration(recordingDuration)}</span>
            <span>{isPaused ? 'Пауза' : 'Идет запись микрофона...'}</span>
          </div>

          <div className={styles.recordingControls}>
            {isPaused ? (
              <button type="button" className={styles.actionButton} onClick={onResumeRecording}>
                Продолжить
              </button>
            ) : (
              <button type="button" className={styles.actionButton} onClick={onPauseRecording}>
                Пауза
              </button>
            )}

            <button
              type="button"
              className={`${styles.actionButton} ${styles.stopButton}`}
              onClick={onStopRecording}
            >
              Завершить запись
            </button>

            <button type="button" className={styles.actionButton} onClick={onDiscardRecording}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {!isRecording && recordedAudioUrl && (
        <div className={styles.previewView}>
          <audio controls src={recordedAudioUrl} className={styles.audioPlayer} />

          <div className={styles.previewActions}>
            <button type="button" className={styles.attachButton} onClick={onAttachRecording}>
              Прикрепить к кейсу
            </button>

            <button type="button" className={styles.actionButton} onClick={onStartRecording}>
              Перезаписать
            </button>

            <button type="button" className={styles.actionButton} onClick={onDiscardRecording}>
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

VoiceRecorder.propTypes = {
  isRecording: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  recordingDuration: PropTypes.number.isRequired,
  recordedAudioUrl: PropTypes.string,
  recorderError: PropTypes.string,
  onStartRecording: PropTypes.func.isRequired,
  onPauseRecording: PropTypes.func.isRequired,
  onResumeRecording: PropTypes.func.isRequired,
  onStopRecording: PropTypes.func.isRequired,
  onDiscardRecording: PropTypes.func.isRequired,
  onAttachRecording: PropTypes.func.isRequired,
}
