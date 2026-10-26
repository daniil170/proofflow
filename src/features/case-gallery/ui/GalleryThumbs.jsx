import PropTypes from 'prop-types'
import { GALLERY_ITEMS } from '../model/galleryRegistry'
import styles from './GalleryThumbs.module.css'

const STYLE_DOT_COLORS = {
  dark: '#d6f94c',
  newspaper: '#b8321b',
  whatsapp: '#25d366',
  receipt: '#18181b',
  minimal: '#e64a19',
}

export const GalleryThumbs = ({ currentIndex, onSelect }) => {
  return (
    <div className={styles.strip} role="tablist" aria-label="Миниатюры стилей карточек">
      {GALLERY_ITEMS.map((item, index) => {
        const isActive = currentIndex === index
        const dotColor = STYLE_DOT_COLORS[item.id] || '#000000'

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Стиль ${item.title}`}
            className={`${styles.thumbButton} ${isActive ? styles.thumbButtonActive : ''}`}
            onClick={() => onSelect(index)}
          >
            <span
              className={styles.colorIndicator}
              style={{ backgroundColor: dotColor }}
              aria-hidden="true"
            />
            <span>{item.title}</span>
          </button>
        )
      })}
    </div>
  )
}

GalleryThumbs.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
}
