import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { cookiesData } from '../content/cookiesData.js'
import { privacyData } from '../content/privacyData.js'
import { termsData } from '../content/termsData.js'
import {
  CookieIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ShieldCheckIcon,
  XIcon,
} from '../icons.jsx'
import styles from './LegalModal.module.css'

const DOCS_MAP = {
  terms: { data: termsData, path: '/terms', icon: FileTextIcon },
  privacy: { data: privacyData, path: '/privacy', icon: ShieldCheckIcon },
  cookies: { data: cookiesData, path: '/cookies', icon: CookieIcon },
}

export const LegalModal = ({ isOpen, onClose, initialDoc = 'terms' }) => {
  const [prevInitialDoc, setPrevInitialDoc] = useState(initialDoc)
  const [activeKey, setActiveKey] = useState(initialDoc)

  if (initialDoc !== prevInitialDoc) {
    setPrevInitialDoc(initialDoc)
    setActiveKey(initialDoc)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeDocInfo = DOCS_MAP[activeKey] || DOCS_MAP.terms
  const currentDoc = activeDocInfo.data
  const IconComponent = activeDocInfo.icon

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <IconComponent size={18} />
            </div>
            <div>
              <h2 id="legal-modal-title" className={styles.modalTitle}>
                {currentDoc.title}
              </h2>
              <p className={styles.modalSubtitle}>Редакция: {currentDoc.updatedAt}</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Link
              to={activeDocInfo.path}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fullPageLink}
              title="Открыть полную версию в новой вкладке"
            >
              <span>Полная версия</span>
              <ExternalLinkIcon size={12} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Закрыть окно"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeKey === 'terms' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveKey('terms')}
          >
            Условия использования
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeKey === 'privacy' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveKey('privacy')}
          >
            Конфиденциальность
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeKey === 'cookies' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveKey('cookies')}
          >
            Файлы Cookie
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.body}>
          {currentDoc.sections.map((section) => (
            <div key={section.id} className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {section.number}. {section.title}
              </h3>
              {section.summary && (
                <div className={styles.sectionSummary}>{section.summary}</div>
              )}
              {section.content.map((paragraph, idx) => (
                <p key={idx} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.btnOk}>
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

LegalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialDoc: PropTypes.oneOf(['terms', 'privacy', 'cookies']),
}
