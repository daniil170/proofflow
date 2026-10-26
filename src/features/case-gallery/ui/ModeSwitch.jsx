import PropTypes from 'prop-types'
import { GALLERY_MODES } from '../model/modeRegistry'
import styles from './ModeSwitch.module.css'

export const ModeSwitch = ({ activeMode, onModeChange }) => {
  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const nextIndex = (index + 1) % GALLERY_MODES.length
      onModeChange(GALLERY_MODES[nextIndex].id)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prevIndex = (index - 1 + GALLERY_MODES.length) % GALLERY_MODES.length
      onModeChange(GALLERY_MODES[prevIndex].id)
    }
  }

  return (
    <div className={styles.switchGroup} role="tablist" aria-label="Режимы отображения кейса">
      {GALLERY_MODES.map((mode, index) => {
        const isActive = activeMode === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            id={`mode-tab-${mode.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`${styles.switchButton} ${isActive ? styles.switchButtonActive : ''}`}
            onClick={() => onModeChange(mode.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}

ModeSwitch.propTypes = {
  activeMode: PropTypes.oneOf(['card', 'site', 'story']).isRequired,
  onModeChange: PropTypes.func.isRequired,
}
