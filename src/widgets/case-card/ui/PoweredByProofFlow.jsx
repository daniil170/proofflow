import PropTypes from 'prop-types'
import appIconBlack from '@/assets/logo/app-icon-black.svg'
import wordmarkOnDark from '@/assets/logo/proofflow-wordmark-on-dark.svg'
import wordmarkOnLight from '@/assets/logo/proofflow-wordmark-on-light.svg'
import wordmarkMonoBlack from '@/assets/logo/proofflow-wordmark-mono-black.svg'
import styles from './PoweredByProofFlow.module.css'

export const PoweredByProofFlow = ({
  theme = 'dark',
  className = '',
  uppercase = false,
  iconSize = 18,
  wordmarkHeight = 12,
}) => {
  const isDark = theme === 'dark'
  const isNewspaper = theme === 'newspaper'

  const wordmarkSrc = isDark
    ? wordmarkOnDark
    : isNewspaper
      ? wordmarkMonoBlack
      : wordmarkOnLight

  return (
    <div className={`${styles.badge} ${styles[theme]} ${className}`.trim()}>
      <img
        src={appIconBlack}
        alt=""
        width={iconSize}
        height={iconSize}
        className={styles.appIcon}
        aria-hidden="true"
      />
      <span className={styles.label}>
        {uppercase ? 'POWERED BY' : 'Powered by'}
      </span>
      <img
        src={wordmarkSrc}
        alt="ProofFlow"
        height={wordmarkHeight}
        className={styles.wordmark}
      />
    </div>
  )
}

PoweredByProofFlow.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light', 'newspaper']),
  className: PropTypes.string,
  uppercase: PropTypes.bool,
  iconSize: PropTypes.number,
  wordmarkHeight: PropTypes.number,
}
