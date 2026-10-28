import { useState } from 'react'
import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import { DeviceFrame } from './DeviceFrame'
import styles from './SitePreview.module.css'

export const SitePreview = ({
  item,
  variant,
  data,
  device: externalDevice,
  onDeviceChange: externalOnDeviceChange,
}) => {
  const [internalDevice, setInternalDevice] = useState('desktop')
  const device = externalDevice || internalDevice
  const onDeviceChange = externalOnDeviceChange || setInternalDevice

  const effectiveVariant = variant || item?.variant || 'dark'
  const effectiveData = data || item?.data || {}

  return (
    <DeviceFrame device={device} onDeviceChange={onDeviceChange}>
      <div className={styles.pageContainer}>
        <div className={styles.siteNav} aria-hidden="true">
          <div className={styles.siteLogo}>AGENCY GROWTH</div>
          <div className={styles.siteMenu}>
            <span>Услуги</span>
            <span>Кейсы</span>
            <span>О нас</span>
            <span>Контакты</span>
          </div>
        </div>

        <article className={styles.articleLayout}>
          <span className={styles.articleCategory}>Кейс агентства</span>
          <h3 className={styles.articleHeading}>
            Как мы выстроили стабильный поток лидов для нашего клиента
          </h3>
          <p className={styles.paragraph}>
            В условиях меняющегося рынка агентству важно доказывать клиентам окупаемость каждого
            вложенного рубля. Мы заменили длинные отчеты прямым доказательством результата:
          </p>

          <div className={styles.embedWrapper}>
            <CaseCard variant={effectiveVariant} data={effectiveData} />
          </div>

          <p className={styles.paragraph}>
            После пересборки лид-магнитов и запуска обновленной воронки конверсия созвонов в целевые
            сделки выросла, а клиент получил предсказуемый канал привлечения.
          </p>

          <div className={styles.conclusionBox} aria-hidden="true">
            <strong>Итог:</strong> прозрачные кейсы укрепляют доверие заказчиков и ускоряют цикл
            закрытия сделок в 2,5 раза.
          </div>
        </article>
      </div>
    </DeviceFrame>
  )
}

SitePreview.propTypes = {
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
  device: PropTypes.oneOf(['desktop', 'mobile']),
  onDeviceChange: PropTypes.func,
}
