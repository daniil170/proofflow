import PropTypes from 'prop-types'
import { FileAudioIcon, FileVideoIcon, FileGenericIcon } from '@/shared/ui'
import styles from './FileList.module.css'

export const FileList = ({
  files,
  onRemoveFile,
  onMoveUp,
  onMoveDown,
  onRetryUpload,
  onCancelUpload,
}) => {
  if (!files || files.length === 0) return null

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Б'
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} КБ`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  }

  const getKindLabel = (kind) => {
    switch (kind) {
      case 'screenshot':
        return 'Скриншот'
      case 'voice':
        return 'Голосовое'
      case 'audio':
        return 'Аудио'
      case 'video':
        return 'Видео'
      default:
        return 'Файл'
    }
  }

  const getKindIcon = (kind) => {
    switch (kind) {
      case 'voice':
      case 'audio':
        return <FileAudioIcon size={16} />
      case 'video':
        return <FileVideoIcon size={16} />
      default:
        return <FileGenericIcon size={16} />
    }
  }

  return (
    <div className={styles.list}>
      {files.map((item, index) => {
        const isImage = item.kind === 'screenshot' && item.previewUrl
        const isAudio = (item.kind === 'audio' || item.kind === 'voice') && item.previewUrl

        return (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                {isImage ? (
                  <img src={item.previewUrl} alt={item.name} className={styles.thumbnail} />
                ) : (
                  <div className={styles.typeIcon}>{getKindIcon(item.kind)}</div>
                )}

                <div className={styles.info}>
                  <span className={styles.name} title={item.name}>
                    {item.name}
                  </span>
                  <div className={styles.meta}>
                    <span className={styles.kindBadge}>{getKindLabel(item.kind)}</span>
                    <span>•</span>
                    <span>{formatFileSize(item.size)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.reorderButton}
                  onClick={() => onMoveUp(item.id)}
                  disabled={index === 0}
                  aria-label={`Переместить ${item.name} выше`}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className={styles.reorderButton}
                  onClick={() => onMoveDown(item.id)}
                  disabled={index === files.length - 1}
                  aria-label={`Переместить ${item.name} ниже`}
                >
                  ↓
                </button>

                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => onRemoveFile(item.id)}
                  aria-label={`Удалить ${item.name}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {isAudio && (
              <div className={styles.audioRow}>
                <audio controls src={item.previewUrl} className={styles.audioPlayer} />
              </div>
            )}

            {item.status === 'uploading' && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${item.progress}%` }} />
                </div>
                <span className={styles.progressText}>{item.progress}%</span>
                {onCancelUpload && (
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => onCancelUpload(item.id)}
                  >
                    Отмена
                  </button>
                )}
              </div>
            )}

            {item.status === 'error' && (
              <div className={styles.errorRow}>
                <span>{item.error || 'Ошибка загрузки'}</span>
                {onRetryUpload && (
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => onRetryUpload(item.id)}
                  >
                    Повторить
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

FileList.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired,
      kind: PropTypes.string.isRequired,
      previewUrl: PropTypes.string,
      status: PropTypes.string.isRequired,
      progress: PropTypes.number.isRequired,
      error: PropTypes.string,
    })
  ).isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onRetryUpload: PropTypes.func,
  onCancelUpload: PropTypes.func,
}
