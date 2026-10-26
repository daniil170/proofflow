import { Container } from '@/shared/ui'
import { CaseCard } from '@/widgets/case-card'
import { useCaseGallery, GALLERY_ITEMS, GalleryModal } from '@/features/case-gallery'
import styles from './StylePicker.module.css'

export const StylePicker = () => {
  const gallery = useCaseGallery('dark')

  return (
    <section id="case-styles" className={styles.section} aria-labelledby="style-picker-title">
      <Container>
        <div className={styles.header}>
          <span className={styles.badge}>5 готовых стилей</span>
          <h2 id="style-picker-title" className={styles.title}>
            Выберите стиль
          </h2>
          <p className={styles.description}>
            От строгой аналитики до живых отзывов из чата — выберите оформление, которое вызывает
            доверие именно у ваших клиентов.
          </p>

          <button
            type="button"
            className={styles.openAllButton}
            onClick={() => gallery.openGallery(0)}
          >
            Посмотреть все стили
          </button>
        </div>

        <div className={styles.cardsContainer}>
          <div className={styles.grid}>
            {GALLERY_ITEMS.map((item, index) => {
              const isSelected = gallery.selectedStyleId === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.cardItem} ${isSelected ? styles.cardItemSelected : ''}`}
                  onClick={() => gallery.openGallery(index)}
                  aria-label={`Открыть галерею на стиле ${item.title}`}
                >
                  {isSelected && <span className={styles.selectedBadge}>✓ Выбран</span>}

                  <div className={styles.previewBox} aria-hidden="true">
                    <div className={styles.miniCardScaler}>
                      <CaseCard variant={item.variant} data={item.data} />
                    </div>
                  </div>

                  <div className={styles.cardMeta}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDesc}>{item.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Container>

      <GalleryModal
        isOpen={gallery.isOpen}
        item={gallery.currentItem}
        currentIndex={gallery.currentIndex}
        totalItems={gallery.totalItems}
        activeMode={gallery.activeMode}
        device={gallery.device}
        selectedStyleId={gallery.selectedStyleId}
        onClose={gallery.closeGallery}
        onNext={gallery.next}
        onPrev={gallery.prev}
        onGoTo={gallery.goTo}
        onModeChange={gallery.setMode}
        onDeviceChange={gallery.setDevice}
        onSelectStyle={gallery.selectStyle}
      />
    </section>
  )
}
