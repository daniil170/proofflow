import PropTypes from 'prop-types'
import styles from './Textarea.module.css'

export const Textarea = ({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  label,
  error,
  helperText,
  rows = 3,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onBlur,
  ...props
}) => {
  const textareaId = id || name

  const combinedTextareaClassName = [styles.textarea, error ? styles.textareaError : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        className={combinedTextareaClassName}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
      {error && (
        <span id={`${textareaId}-error`} role="alert" className={styles.errorText}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${textareaId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}

Textarea.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
}
