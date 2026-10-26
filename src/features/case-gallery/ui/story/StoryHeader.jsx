import styles from './StoryHeader.module.css'

export const StoryHeader = () => {
  return (
    <div className={styles.header} aria-hidden="true">
      <div className={styles.authorBlock}>
        <div className={styles.avatar}>PF</div>
        <div className={styles.meta}>
          <span className={styles.name}>Ваше агентство</span>
          <span className={styles.time}>сейчас</span>
        </div>
      </div>
      <div className={styles.closeButton} aria-hidden="true">
        ✕
      </div>
    </div>
  )
}
