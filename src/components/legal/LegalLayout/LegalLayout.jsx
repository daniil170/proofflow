import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useLocation } from 'react-router-dom'
import logoLightSvg from '@/assets/logo/proofflow-logo-horizontal-on-light.svg'
import logoDarkSvg from '@/assets/logo/proofflow-logo-horizontal-on-dark.svg'
import { ArrowLeftIcon, PrinterIcon, ShieldCheckIcon } from '../icons.jsx'
import styles from './LegalLayout.module.css'

export const LegalLayout = ({ doc, children }) => {
  const location = useLocation()
  const [activeId, setActiveId] = useState(doc.sections[0]?.id || '')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140
      for (let i = doc.sections.length - 1; i >= 0; i--) {
        const section = doc.sections[i]
        const element = document.getElementById(section.id)
        if (element) {
          const top = element.offsetTop
          if (scrollPosition >= top) {
            setActiveId(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [doc.sections])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const tabs = [
    { path: '/terms', label: 'Условия использования' },
    { path: '/privacy', label: 'Политика конфиденциальности' },
    { path: '/cookies', label: 'Файлы Cookie' },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.topNav}>
        <div className={styles.navContainer}>
          <div className={styles.navLeft}>
            <Link to="/" className={styles.homeLink} aria-label="ProofFlow Главная">
              <ArrowLeftIcon size={16} />
              <img
                src={logoLightSvg}
                alt="ProofFlow"
                className={styles.logoLight}
                width="110"
                height="22"
              />
              <img
                src={logoDarkSvg}
                alt="ProofFlow"
                className={styles.logoDark}
                width="110"
                height="22"
              />
            </Link>
            <span className={styles.badge}>
              <ShieldCheckIcon size={13} />
              Редакция: {doc.updatedAt}
            </span>
          </div>

          <div className={styles.navActions}>
            <button
              type="button"
              onClick={handlePrint}
              className={styles.printButton}
              title="Распечатать или сохранить в PDF"
            >
              <PrinterIcon size={14} />
              <span>Распечатать / PDF</span>
            </button>
          </div>
        </div>
      </header>

      <nav className={styles.tabsBar} aria-label="Юридические документы">
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`${styles.tabLink} ${isActive ? styles.tabLinkActive : ''}`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className={styles.mainContainer}>
        <aside className={styles.sidebar}>
          <div className={styles.tocSticky}>
            <div className={styles.tocHeader}>Содержание документа</div>
            <ul className={styles.tocList}>
              {doc.sections.map((section) => (
                <li key={section.id} className={styles.tocItem}>
                  <a
                    href={`#${section.id}`}
                    className={`${styles.tocLink} ${
                      activeId === section.id ? styles.tocLinkActive : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(section.id)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' })
                        setActiveId(section.id)
                      }
                    }}
                  >
                    {section.number}. {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className={styles.article}>
          <header className={styles.articleHeader}>
            <h1 className={styles.mainTitle}>{doc.title}</h1>
            <p className={styles.subtitle}>{doc.subtitle}</p>
            <div className={styles.metaRow}>
              <span>Официальный юридический документ платформы ProofFlow</span>
              <span>•</span>
              <span>Действующая редакция: {doc.updatedAt}</span>
            </div>
          </header>

          {children}

          {doc.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={`${styles.sectionBlock} ${
                section.highlight ? styles.sectionBlockHighlight : ''
              }`}
            >
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>{section.number}</span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </div>

              {section.summary && (
                <div className={styles.sectionSummary}>{section.summary}</div>
              )}

              <div className={styles.sectionBody}>
                {section.content.map((paragraph, idx) => {
                  const isUppercaseHeading =
                    paragraph === paragraph.toUpperCase() && paragraph.length > 10
                  return (
                    <p
                      key={idx}
                      className={`${styles.paragraph} ${
                        isUppercaseHeading ? styles.paragraphStrong : ''
                      }`}
                    >
                      {paragraph}
                    </p>
                  )
                })}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}

LegalLayout.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        number: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        summary: PropTypes.string,
        highlight: PropTypes.bool,
        content: PropTypes.arrayOf(PropTypes.string).isRequired,
      }),
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
}
