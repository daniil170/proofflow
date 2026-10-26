import PropTypes from 'prop-types'
import styles from './Input.module.css'

export const Input = ({
  id,
  name,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onBlur,
  ...props
}) => {
  const inputId = id || name

  const combinedInputClassName = [styles.input, error ? styles.inputError : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={combinedInputClassName}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} role="alert" className={styles.errorText}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${inputId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
}
