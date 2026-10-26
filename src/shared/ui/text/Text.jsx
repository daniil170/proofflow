import PropTypes from 'prop-types'
import styles from './Text.module.css'

const SIZE_STYLE_MAP = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  base: styles.sizeBase,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
}

const WEIGHT_STYLE_MAP = {
  regular: styles.weightRegular,
  medium: styles.weightMedium,
  semibold: styles.weightSemibold,
  bold: styles.weightBold,
}

const COLOR_STYLE_MAP = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  muted: styles.colorMuted,
  inverse: styles.colorInverse,
  inverseMuted: styles.colorInverseMuted,
  accent: styles.colorAccent,
}

const ALIGN_STYLE_MAP = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

export const Text = ({
  children,
  as: Tag = 'p',
  size = 'base',
  weight = 'regular',
  color = 'primary',
  align = 'left',
  className = '',
  ...props
}) => {
  const combinedClassName = [
    styles.text,
    SIZE_STYLE_MAP[size],
    WEIGHT_STYLE_MAP[weight],
    COLOR_STYLE_MAP[color],
    ALIGN_STYLE_MAP[align],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag className={combinedClassName} {...props}>
      {children}
    </Tag>
  )
}

Text.propTypes = {
  children: PropTypes.node.isRequired,
  as: PropTypes.oneOf(['p', 'span', 'div', 'label', 'small']),
  size: PropTypes.oneOf(['xs', 'sm', 'base', 'lg', 'xl']),
  weight: PropTypes.oneOf(['regular', 'medium', 'semibold', 'bold']),
  color: PropTypes.oneOf(['primary', 'secondary', 'muted', 'inverse', 'inverseMuted', 'accent']),
  align: PropTypes.oneOf(['left', 'center', 'right']),
  className: PropTypes.string,
}
