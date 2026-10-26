import PropTypes from 'prop-types'
import styles from './Container.module.css'

export const Container = ({ children, size = 'default', className = '', ...props }) => {
  const combinedClassName = [styles.container, styles[size], className].filter(Boolean).join(' ')

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  )
}

Container.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['default', 'narrow', 'fluid']),
  className: PropTypes.string,
}
