import styles from './StoryProgress.module.css'

export const StoryProgress = () => {
  return (
    <div className={styles.progressContainer} aria-hidden="true">
      <div className={styles.segment}>
        <div className={styles.fill} style={{ animationDelay: '-5s' }} />
      </div>
      <div className={`${styles.segment} ${styles.segmentActive}`}>
        <div className={styles.fill} />
      </div>
      <div className={styles.segment} />
    </div>
  )
}
