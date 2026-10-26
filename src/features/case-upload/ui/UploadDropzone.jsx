import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { ALLOWED_MIME_TYPES } from '@/shared/config/limits.ts'
import styles from './UploadDropzone.module.css'

export const UploadDropzone = ({ onFilesAdded, onPaste }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleWindowPaste = (e) => {
      if (onPaste) {
        onPaste(e)
      }
    }
    window.addEventListener('paste', handleWindowPaste)
    return () => {
      window.removeEventListener('paste', handleWindowPaste)
    }
  }, [onPaste])

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer && e.dataTransfer.files) {
      onFilesAdded(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files) {
      onFilesAdded(e.target.files)
      e.target.value = ''
    }
  }

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleZoneClick()
    }
  }

  return (
    <div
      className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleZoneClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Зона для загрузки файлов и скриншотов"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleInputChange}
        className={styles.hiddenInput}
        aria-hidden="true"
      />

      <div className={styles.iconCircle}>📁</div>

      <h3 className={styles.title}>Перетащите файлы сюда или выберите с устройства</h3>

      <p className={styles.subtitle}>
        Скриншоты переписки, аудиозаписи созвонов, видео или скринкасты
      </p>

      <span className={styles.pasteBadge}>
        <span>📋</span>
        <span>Можно просто вставить скриншот по Ctrl+V / Cmd+V</span>
      </span>

      <button
        type="button"
        className={styles.selectButton}
        onClick={(e) => {
          e.stopPropagation()
          handleZoneClick()
        }}
      >
        Выбрать файлы
      </button>
    </div>
  )
}

UploadDropzone.propTypes = {
  onFilesAdded: PropTypes.func.isRequired,
  onPaste: PropTypes.func.isRequired,
}
