import PropTypes from 'prop-types'
import { DEFAULT_CASE_DATA, CONFECTIONERY_CASE_DATA } from '@/entities/case'
import { DarkCard } from './variants/DarkCard'
import { NewspaperCard } from './variants/NewspaperCard'
import { WhatsAppCard } from './variants/WhatsAppCard'
import { ReceiptCard } from './variants/ReceiptCard'
import { MinimalCard } from './variants/MinimalCard'
import styles from './CaseCard.module.css'

const VARIANT_COMPONENTS = {
  dark: DarkCard,
  newspaper: NewspaperCard,
  whatsapp: WhatsAppCard,
  receipt: ReceiptCard,
  minimal: MinimalCard,
}

const getDefaultDataForVariant = (variant) => {
  if (variant === 'whatsapp' || variant === 'receipt') {
    return CONFECTIONERY_CASE_DATA
  }
  return DEFAULT_CASE_DATA
}

export const CaseCard = ({ variant = 'dark', data, className, style }) => {
  const Component = VARIANT_COMPONENTS[variant] || DarkCard
  const caseData = data || getDefaultDataForVariant(variant)

  const cardStyle = {
    ...(caseData?.accentColor ? { '--case-accent': caseData.accentColor } : {}),
    ...style,
  }

  return (
    <div className={`${styles.wrapper} ${className || ''}`} style={cardStyle}>
      <Component data={caseData} />
    </div>
  )
}

CaseCard.propTypes = {
  variant: PropTypes.oneOf(['dark', 'newspaper', 'whatsapp', 'receipt', 'minimal']),
  data: PropTypes.shape({
    metric: PropTypes.string.isRequired,
    metricLabel: PropTypes.string.isRequired,
    before: PropTypes.string.isRequired,
    done: PropTypes.string.isRequired,
    after: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    isVerifiedByChat: PropTypes.bool.isRequired,
    title: PropTypes.string,
    category: PropTypes.string,
    niche: PropTypes.string,
    channel: PropTypes.string,
    duration: PropTypes.string,
    chatMessages: PropTypes.arrayOf(PropTypes.string),
    accentColor: PropTypes.string,
  }),
  className: PropTypes.string,
  style: PropTypes.object,
}
