import { useState } from 'react'
import PropTypes from 'prop-types'
import styles from './SourcePreview.module.css'

export const SourcePreview = ({ evidence, source, sourcesDeletedAt = null }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!evidence) {
    return null
  }

  const isAudio =
    evidence.kind === 'transcriptSegment' ||
    source?.kind === 'audio' ||
    source?.kind === 'voice' ||
    source?.kind === 'video'

  const togglePlayback = () => {
    setIsPlaying((prev) => !prev)
  }

  const isDeleted = Boolean(
    sourcesDeletedAt ||
    evidence?.sourcesDeletedAt ||
    source?.sourcesDeletedAt
  )

  if (isDeleted) {
    return (
      <div className={styles.container}>
        <div className={styles.sourceHeader}>
          <span className={styles.sourceBadge}>
            {isAudio ? 'Аудиозапись / Созвон' : 'Скриншот переписки'}
          </span>
          <span className={styles.sourceBadge}>Срок хранения истёк</span>
        </div>
        <p className={styles.deletedSubtitle}>
          Исходный файл удалён по сроку хранения
        </p>
        <div className={styles.highlightedTextCard}>
          <p className={styles.quoteLabel}>Сохранённая цитата:</p>
          <p className={styles.quoteText}>«{evidence.exactQuote}»</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.sourceHeader}>
        <span className={styles.sourceBadge}>
          {isAudio ? 'Аудиозапись / Созвон' : 'Скриншот переписки'}
        </span>
        {evidence.reference && (
          <span className={styles.sourceBadge}>Таймкод: {evidence.reference}</span>
        )}
      </div>

      {isAudio ? (
        <div className={styles.audioPlayerBox}>
          <div className={styles.audioControls}>
            <button
              type="button"
              className={styles.playButton}
              onClick={togglePlayback}
              aria-label={isPlaying ? 'Остановить аудио' : 'Слушать фрагмент'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span>{isPlaying ? 'Остановить' : 'Слушать фрагмент'}</span>
            </button>

            <div className={styles.waveformSimulation} aria-hidden="true">
              {[8, 14, 22, 16, 24, 12, 18, 20, 10, 16, 22, 14, 10, 18].map(
                (h, idx) => (
                  <div
                    key={idx}
                    className={`
                      ${styles.waveBar}
                      ${isPlaying ? styles.waveBarPlaying : ''}
                    `}
                    style={{ height: `${isPlaying ? (h * 1.2) % 24 : h}px` }}
                  />
                )
              )}
            </div>
          </div>

          <div className={styles.highlightedTextCard}>
            <p className={styles.quoteLabel}>Дословный фрагмент записи:</p>
            <p className={styles.quoteText}>«{evidence.exactQuote}»</p>
          </div>
        </div>
      ) : (
        <div className={styles.screenshotComparison}>
          <div className={styles.screenshotBox}>
            <p className={styles.columnHeading}>Оригинал скриншота:</p>
            <div className={styles.screenshotPlaceholder}>
              <div className={styles.mockChatMessage}>
                «{evidence.exactQuote}»
              </div>
            </div>
          </div>

          <div className={styles.extractedBox}>
            <p className={styles.columnHeading}>Распознанный текст модели:</p>
            <div className={styles.highlightedTextCard}>
              <p className={styles.quoteText}>«{evidence.exactQuote}»</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

SourcePreview.propTypes = {
  evidence: PropTypes.shape({
    kind: PropTypes.string,
    reference: PropTypes.string,
    exactQuote: PropTypes.string,
    sourcesDeletedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }),
  source: PropTypes.shape({
    kind: PropTypes.string,
    sourcesDeletedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }),
  sourcesDeletedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}
