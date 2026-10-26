import PropTypes from 'prop-types'
import styles from './Section.module.css'

export const Section = ({
  children,
  variant = 'light',
  spacing = 'default',
  id,
  className = '',
  ...props
}) => {
  const combinedClassName = [styles.section, styles[variant], styles[spacing], className]
    .filter(Boolean)
    .join(' ')

  return (
    <section id={id} className={combinedClassName} {...props}>
      {children}
    </section>
  )
}

Section.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['light', 'dark', 'surface']),
  spacing: PropTypes.oneOf(['compact', 'default', 'relaxed']),
  id: PropTypes.string,
  className: PropTypes.string,
}
