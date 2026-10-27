import { useState } from 'react'
import PropTypes from 'prop-types'
import { ClientConsentSection } from '@/features/consent'
import { useCasePublish } from '../model/useCasePublish'
import { CMS_INSTRUCTIONS } from '../model/embedSnippets'
import styles from './PublishSection.module.css'

export const PublishSection = ({ caseItem, onPublishChanged }) => {
  const [openCmsId, setOpenCmsId] = useState('tilda')
  const {
    isPublished,
    isPublishing,
    isUnpublishing,
    error,
    publicUrl,
    embedCode,
    copiedLink,
    copiedEmbed,
    publish,
    unpublish,
    copyLink,
    copyEmbed,
    downloadCard,
    downloadStory,
  } = useCasePublish({ caseItem, onPublishChanged })

  const toggleCms = (id) => {
    setOpenCmsId((prev) => (prev === id ? null : id))
  }

  return (
    <div className={styles.container}>
      <ClientConsentSection
        caseItem={caseItem}
        onConsentUpdated={(patch) => {
          if (typeof onPublishChanged === 'function') {
            onPublishChanged(patch)
          }
        }}
      />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.title}>Публикация кейса</h3>
            <p className={styles.desc}>
              После публикации кейс станет доступен по прямой ссылке и через embed-виджет. Скриншоты и исходные аудио не публикуются.
            </p>
          </div>

          <div className={styles.actionsRow}>
            {isPublished ? (
              <>
                <span className={`${styles.statusBadge} ${styles.badgePublished}`}>
                  ✓ Опубликован
                </span>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={unpublish}
                  disabled={isUnpublishing}
                >
                  {isUnpublishing ? 'Снятие...' : 'Снять с публикации'}
                </button>
              </>
            ) : (
              <>
                <span className={`${styles.statusBadge} ${styles.badgeDraft}`}>
                  Черновик
                </span>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={publish}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Публикация...' : 'Опубликовать кейс'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{error}</span>}

        {isPublished && (
          <div className={styles.linkGroup}>
            <input
              type="text"
              readOnly
              value={publicUrl}
              className={styles.inputField}
            />
            <button
              type="button"
              className={`${styles.btn} ${copiedLink ? styles.btnPrimary : ''}`}
              onClick={copyLink}
            >
              {copiedLink ? 'Скопировано!' : 'Скопировать ссылку'}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btn}
            >
              Открыть в новой вкладке ↗
            </a>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h3 className={styles.title}>Экспорт в PNG</h3>
        <p className={styles.desc}>
          Скачайте графический файл для публикаций в соцсетях, презентаций или коммерческих предложений.
        </p>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.btn}
            onClick={downloadCard}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Скачать карточку (PNG)
          </button>

          <button
            type="button"
            className={styles.btn}
            onClick={downloadStory}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Скачать для Сторис 1080×1920
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.title}>Вставка на сайт (Embed-виджет)</h3>
            <p className={styles.desc}>
              Вставьте интерактивную карточку в любую CMS или лендинг. Стили карточки изолированы внутри Shadow DOM и не конфликтуют с вашим сайтом.
            </p>
          </div>

          <button
            type="button"
            className={`${styles.btn} ${copiedEmbed ? styles.btnPrimary : styles.btnPrimary}`}
            onClick={copyEmbed}
          >
            {copiedEmbed ? 'Код скопирован!' : 'Скопировать embed-код'}
          </button>
        </div>

        <textarea
          rows={3}
          readOnly
          value={embedCode}
          className={styles.codeArea}
        />

        <div className={styles.cmsAccordion}>
          <span className={styles.desc} style={{ fontWeight: '600' }}>
            Инструкции по вставке в популярные CMS:
          </span>

          {CMS_INSTRUCTIONS.map((cms) => {
            const isOpen = openCmsId === cms.id
            return (
              <div key={cms.id} className={styles.cmsItem}>
                <button
                  type="button"
                  className={styles.cmsTrigger}
                  onClick={() => toggleCms(cms.id)}
                >
                  <span>{cms.title}</span>
                  <span>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className={styles.cmsContent}>
                    {cms.steps.map((step, idx) => (
                      <p key={idx} className={styles.cmsStep}>
                        <strong>{idx + 1}.</strong> {step}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

PublishSection.propTypes = {
  caseItem: PropTypes.object,
  onPublishChanged: PropTypes.func,
}
