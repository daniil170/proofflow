import PropTypes from 'prop-types'
import styles from './Checkbox.module.css'

export const Checkbox = ({
  id,
  name,
  checked,
  defaultChecked,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onBlur,
  ...props
}) => {
  const checkboxId = id || name

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label
        htmlFor={checkboxId}
        className={`${styles.labelRow} ${disabled ? styles.labelRowDisabled : ''}`}
      >
        <input
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          className={styles.input}
          onChange={onChange}
          onBlur={onBlur}
          {...props}
        />
        <span
          className={[styles.box, checked ? styles.boxChecked : '', error ? styles.boxError : '']
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          {checked && (
            <svg
              className={styles.checkIcon}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
            </svg>
          )}
        </span>
        <span className={styles.labelText}>{label}</span>
      </label>
      {error && (
        <span id={`${checkboxId}-error`} role="alert" className={styles.errorText}>
          {error}
        </span>
      )}
    </div>
  )
}

Checkbox.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  label: PropTypes.node.isRequired,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
}
