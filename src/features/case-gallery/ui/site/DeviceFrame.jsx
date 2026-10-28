import PropTypes from 'prop-types'
import styles from './DeviceFrame.module.css'

export const DeviceFrame = ({ device = 'desktop', onDeviceChange = () => {}, children }) => {
  return (
    <div className={styles.container}>
      <div
        className={styles.deviceBar}
        role="radiogroup"
        aria-label="Устройство для предпросмотра на сайте"
      >
        <button
          id="device-btn-desktop"
          type="button"
          role="radio"
          aria-checked={device === 'desktop'}
          className={`${styles.deviceButton} ${
            device === 'desktop' ? styles.deviceButtonActive : ''
          }`}
          onClick={() => onDeviceChange('desktop')}
        >
          <svg
            className={styles.deviceIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Десктоп
        </button>

        <button
          id="device-btn-mobile"
          type="button"
          role="radio"
          aria-checked={device === 'mobile'}
          className={`${styles.deviceButton} ${
            device === 'mobile' ? styles.deviceButtonActive : ''
          }`}
          onClick={() => onDeviceChange('mobile')}
        >
          <svg
            className={styles.deviceIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          Телефон
        </button>
      </div>

      <div className={styles.frameWrapper}>
        {device === 'desktop' ? (
          <div className={styles.desktopFrame}>
            <div className={styles.browserHeader} aria-hidden="true">
              <div className={styles.windowDots}>
                <div className={`${styles.dot} ${styles.dotRed}`} />
                <div className={`${styles.dot} ${styles.dotYellow}`} />
                <div className={`${styles.dot} ${styles.dotGreen}`} />
              </div>
              <div className={styles.urlBar}>agency-growth.ru/cases/smm</div>
            </div>
            <div className={styles.screenContent}>{children}</div>
          </div>
        ) : (
          <div className={styles.mobileFrame}>
            <div className={styles.phoneNotchBar} aria-hidden="true">
              <div className={styles.phoneSpeaker} />
            </div>
            <div className={styles.screenContent}>{children}</div>
          </div>
        )}
      </div>
    </div>
  )
}

DeviceFrame.propTypes = {
  device: PropTypes.oneOf(['desktop', 'mobile']),
  onDeviceChange: PropTypes.func,
  children: PropTypes.node.isRequired,
}
