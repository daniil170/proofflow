import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import { StoryProgress } from './StoryProgress'
import { StoryHeader } from './StoryHeader'
import { StoryReplyBar } from './StoryReplyBar'
import styles from './StoryPreview.module.css'

export const StoryPreview = ({ item }) => {
  return (
    <div className={styles.container}>
      <div
        className={styles.storyFrame}
        style={{ background: item.storyBackground }}
        role="region"
        aria-label={`Сторис с кейсом стиля ${item.title}`}
      >
        <div className={styles.topOverlay} aria-hidden="true">
          <StoryProgress />
          <StoryHeader />
        </div>

        <div className={styles.safeAreaCard}>
          <div className={styles.cardScaler}>
            <CaseCard variant={item.variant} data={item.data} />
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
    id: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    storyBackground: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  }).isRequired,
}
