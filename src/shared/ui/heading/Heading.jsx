import PropTypes from 'prop-types'
import styles from './Heading.module.css'

const DEFAULT_LEVEL_SIZE_MAP = {
  1: '2xl',
  2: 'xl',
  3: 'lg',
  4: 'md',
  5: 'sm',
  6: 'xs',
}

const COLOR_STYLE_MAP = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  inverse: styles.colorInverse,
  accent: styles.colorAccent,
}

const ALIGN_STYLE_MAP = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

export const Heading = ({
  children,
  level = 2,
  size,
  color = 'primary',
  align = 'left',
  className = '',
  ...props
}) => {
  const Tag = `h${level}`
  const selectedSize = size || DEFAULT_LEVEL_SIZE_MAP[level]

  const combinedClassName = [
    styles.heading,
    styles[`size-${selectedSize}`],
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

Heading.propTypes = {
  children: PropTypes.node.isRequired,
  level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'inverse', 'accent']),
  align: PropTypes.oneOf(['left', 'center', 'right']),
  className: PropTypes.string,
}
