import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import styles from './CardPreview.module.css'

export const CardPreview = ({ item }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <CaseCard variant={item.variant} data={item.data} />
      </div>
    </div>
  )
}

CardPreview.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    storyBackground: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  }).isRequired,
}
