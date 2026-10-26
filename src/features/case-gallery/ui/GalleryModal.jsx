import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { ModeSwitch } from './ModeSwitch'
import { GalleryCarousel } from './GalleryCarousel'
import { GalleryThumbs } from './GalleryThumbs'
import styles from './GalleryModal.module.css'

export const GalleryModal = ({
  isOpen,
  item,
  currentIndex,
  totalItems,
  activeMode,
  device,
  selectedStyleId,
  onClose,
  onNext,
  onPrev,
  onGoTo,
  onModeChange,
  onDeviceChange,
  onSelectStyle,
}) => {
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const initialFocusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus()
      }
    }, 50)

    const handleFocusTrap = (event) => {
      if (event.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"]), [href]'
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleFocusTrap)

    return () => {
      clearTimeout(initialFocusTimer)
      window.removeEventListener('keydown', handleFocusTrap)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const isCurrentSelected = selectedStyleId === item.id

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="presentation">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        className={styles.modalWindow}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <h2 id="gallery-modal-title" className={styles.modalTitle}>
              Галерея стилей
            </h2>
          </div>

          <div className={styles.modeSwitchWrapper}>
            <ModeSwitch activeMode={activeMode} onModeChange={onModeChange} />
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Закрыть галерею"
            className={styles.closeButton}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <GalleryCarousel
            item={item}
            currentIndex={currentIndex}
            totalItems={totalItems}
            activeMode={activeMode}
            device={device}
            onDeviceChange={onDeviceChange}
            onNext={onNext}
            onPrev={onPrev}
          />
        </div>

        <div className={styles.modalFooter}>
          <GalleryThumbs currentIndex={currentIndex} onSelect={onGoTo} />

          <button
            type="button"
            className={styles.selectButton}
            onClick={() => onSelectStyle(item.id)}
          >
            <svg
              className={styles.checkIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{isCurrentSelected ? 'Стиль уже выбран' : 'Выбрать этот стиль'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

GalleryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
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
  selectedStyleId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onGoTo: PropTypes.func.isRequired,
  onModeChange: PropTypes.func.isRequired,
  onDeviceChange: PropTypes.func.isRequired,
  onSelectStyle: PropTypes.func.isRequired,
}
