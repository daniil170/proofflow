import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import { StoryProgress } from './StoryProgress'
import { StoryHeader } from './StoryHeader'
import { StoryReplyBar } from './StoryReplyBar'
import styles from './StoryPreview.module.css'

export const StoryPreview = ({ item, variant, data }) => {
  const effectiveVariant = variant || item?.variant || 'dark'
  const effectiveData = data || item?.data || {}
  const storyBackground =
    item?.storyBackground ||
    (effectiveVariant === 'dark'
      ? 'radial-gradient(circle at 50% 30%, #1a2a22 0%, #0d1714 100%)'
      : '#141414')

  return (
    <div className={styles.container}>
      <div
        className={styles.storyFrame}
        style={{ background: storyBackground }}
        role="region"
        aria-label={`Сторис с кейсом стиля ${item?.title || effectiveVariant}`}
      >
        <div className={styles.topOverlay} aria-hidden="true">
          <StoryProgress />
          <StoryHeader />
        </div>

        <div className={styles.safeAreaCard}>
          <div className={styles.cardScaler}>
            <CaseCard variant={effectiveVariant} data={effectiveData} />
          </div>
        </div>

        <div className={styles.bottomOverlay} aria-hidden="true">
          <StoryReplyBar />
        </div>
      </div>
    </div>
  )
}

StoryPreview.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    variant: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    storyBackground: PropTypes.string,
    data: PropTypes.object,
  }),
  variant: PropTypes.string,
  data: PropTypes.object,
}
