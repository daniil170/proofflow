import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import styles from './LogoDemoIntro.module.css'

export const LogoDemoIntro = ({ onFinish, autoPlay = true, duration = 2000 }) => {
  const [stage, setStage] = useState('drawing') // 'drawing' -> 'glow' -> 'text' -> 'complete'
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    setTimeout(() => {
      onFinish?.()
    }, 400)
  }, [onFinish])

  useEffect(() => {
    if (!autoPlay) return

    const t1 = setTimeout(() => setStage('glow'), 400)
    const t2 = setTimeout(() => setStage('text'), 900)
    const t3 = setTimeout(() => setStage('complete'), 1500)
    const t4 = setTimeout(() => {
      handleDismiss()
    }, duration)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [autoPlay, duration, handleDismiss])

  return (
    <div
      className={`${styles.overlay} ${isDismissed ? styles.overlayDismissed : ''}`}
      onClick={handleDismiss}
      role="dialog"
      aria-label="ProofFlow Logo Demo"
      aria-modal="true"
    >
      <div className={styles.ambientGlow} />

      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.logoCard} ${styles[`stage_${stage}`]}`}>
          {/* Animated SVG Logo */}
          <div className={styles.svgWrapper}>
            <svg
              viewBox="0 0 330 224"
              className={styles.svgLogo}
              xmlns="http://www.w3.org/2000/svg"
              aria-label="ProofFlow"
            >
              <defs>
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Logo Mark Arches */}
              <g transform="translate(112.5 0) scale(1.5) translate(-15 -10)">
                <g fill="none" strokeWidth="12" strokeLinecap="round">
                  <path
                    d="M35 84V30A14 14 0 0 1 49 16M59 84V30A14 14 0 0 1 73 16"
                    className={styles.markArch}
                    stroke="#FFFFFF"
                  />
                  <path
                    d="M21 44H79"
                    className={styles.markBeam}
                    stroke="#D4FF3A"
                    filter="url(#neon-glow)"
                  />
                </g>
              </g>

              {/* Logo Wordmark Letters */}
              <g transform="translate(0 144)">
                <g fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
                  <g className={styles.wordmarkLetters} stroke="#FFFFFF">
                    <path d="M4.5 75.5V24.5M51.5 55.5V24.5M51.5 40A15.5 15.5 0 0 1 67 24.5M172.5 55.5V16A11.5 11.5 0 0 1 184 4.5M196.5 55.5V16A11.5 11.5 0 0 1 208 4.5M223 4.5V55.5M284 24.5L294 55.5L304 30L314 55.5L324 24.5" />
                    <circle cx="20" cy="40" r="15.5" />
                    <circle cx="96" cy="40" r="15.5" />
                    <circle cx="142" cy="40" r="15.5" />
                    <circle cx="253.5" cy="40" r="15.5" />
                  </g>
                  <path
                    d="M165 24.5H209"
                    className={styles.wordmarkBeam}
                    stroke="#D4FF3A"
                    filter="url(#neon-glow)"
                  />
                </g>
              </g>
            </svg>
          </div>

          {/* Subtitle tag with glowing dot */}
          <div className={styles.badgeRow}>
            <span className={styles.badgePulse} />
            <span className={styles.badgeText}>Превращаем отзывы в кейсы</span>
          </div>

          <div className={styles.streamParticles}>
            <span className={styles.particle} />
            <span className={styles.particle} />
            <span className={styles.particle} />
          </div>
        </div>

        <button
          type="button"
          className={styles.skipButton}
          onClick={handleDismiss}
          aria-label="Пропустить анимацию"
        >
          Пропустить ✕
        </button>
      </div>
    </div>
  )
}

LogoDemoIntro.propTypes = {
  onFinish: PropTypes.func,
  autoPlay: PropTypes.bool,
  duration: PropTypes.number,
}
