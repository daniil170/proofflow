import { useRef } from 'react'
import PropTypes from 'prop-types'
import { GALLERY_MODES } from '../model/modeRegistry'
import styles from './GalleryCarousel.module.css'

export const GalleryCarousel = ({
  item,
  currentIndex,
  totalItems,
  activeMode,
  device,
  onDeviceChange,
  onNext,
  onPrev,
}) => {
  const touchStartXRef = useRef(null)

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX
    if (diff > 45) {
      onNext()
    } else if (diff < -45) {
      onPrev()
    }
    touchStartXRef.current = null
  }

  const modeConfig = GALLERY_MODES.find((m) => m.id === activeMode) || GALLERY_MODES[0]
  const ModeComponent = modeConfig.component

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Галерея стилей карточек"
    >
      <div className={styles.metaHeader}>
        <span className={styles.counterBadge}>
          {currentIndex + 1} из {totalItems}
        </span>
        <h3 className={styles.styleTitle}>{item.title}</h3>
        <p className={styles.styleDescription}>{item.description}</p>
      </div>

      <div className={styles.stageRow} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button
          id="carousel-btn-prev"
          type="button"
          aria-label="Предыдущий стиль"
          className={`${styles.navButton} ${styles.navButtonPrev}`}
          onClick={onPrev}
        >
          <svg
            className={styles.navIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className={styles.stageContent}
          role="group"
          aria-roledescription="slide"
          aria-label={`${currentIndex + 1} из ${totalItems}`}
        >
          <ModeComponent item={item} device={device} onDeviceChange={onDeviceChange} />
        </div>

        <button
          id="carousel-btn-next"
          type="button"
          aria-label="Следующий стиль"
          className={`${styles.navButton} ${styles.navButtonNext}`}
          onClick={onNext}
        >
          <svg
            className={styles.navIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

GalleryCarousel.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    storyBackground: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  }).isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  activeMode: PropTypes.oneOf(['card', 'site', 'story']).isRequired,
  device: PropTypes.oneOf(['desktop', 'mobile']).isRequired,
  onDeviceChange: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
}
