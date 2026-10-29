import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isAllowedMimeType,
  MAX_CASES_PER_ACCOUNT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_CASE,
  MAX_RECORDING_DURATION_SEC,
  STORAGE_RETENTION_DAYS,
  SUPPORT_TELEGRAM_URL,
} from '@/shared/config/limits.ts'
import { getCaseRepository, getSourceUploader, trackAnalyticsEvent } from '@/shared/api'

export const detectFileKind = (file) => {
  const type = file.type || ''
  if (type.startsWith('image/')) return 'screenshot'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  return 'screenshot'
}

export const useCaseUpload = ({
  user,
  onSuccess,
  uploader = getSourceUploader(),
  repository = getCaseRepository(),
} = {}) => {
  const [files, setFiles] = useState([])
  const [clientLabel, setClientLabel] = useState('')
  const [language, setLanguage] = useState('ru')
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userCasesCount, setUserCasesCount] = useState(0)

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null)
  const [recorderError, setRecorderError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const activeUploadTasksRef = useRef(new Map())

  useEffect(() => {
    trackAnalyticsEvent('case_started', {
      userId: user?.id,
    })
  }, [user?.id])

  useEffect(() => {
    if (typeof repository.countByOwner === 'function' && user?.id) {
      repository
        .countByOwner(user.id)
        .then((count) => {
          if (typeof count === 'number') {
            setUserCasesCount(count)
          }
        })
        .catch(() => {})
    }
  }, [repository, user?.id])

  useEffect(() => {
    const tasks = activeUploadTasksRef.current
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      tasks.forEach((task) => {
        if (typeof task.cancel === 'function') {
          task.cancel()
        }
      })
    }
  }, [])

  const addFiles = useCallback((incomingFiles, forcedKind) => {
    setErrorMessage(null)
    const list = Array.from(incomingFiles || [])
    if (list.length === 0) return

    setFiles((current) => {
      const remainingSlots = MAX_FILES_PER_CASE - current.length
      if (remainingSlots <= 0) {
        setErrorMessage(`Максимальное количество файлов для одного кейса — ${MAX_FILES_PER_CASE}.`)
        return current
      }

      const toProcess = list.slice(0, remainingSlots)
      if (list.length > remainingSlots) {
        setErrorMessage(
          `Было добавлено только ${remainingSlots} файлов, так как лимит на кейс — ${MAX_FILES_PER_CASE}.`
        )
      }

      const newItems = []
      for (const file of toProcess) {
        const type = file.type || ''
        if (!isAllowedMimeType(type)) {
          setErrorMessage(
            `Файл «${file.name}» имеет неподдерживаемый формат. Допустимы изображения, аудио и видео.`
          )
          continue
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          const maxMb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))
          setErrorMessage(`Файл «${file.name}» превышает лимит ${maxMb} МБ.`)
          continue
        }

        const id = `src-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        const kind = forcedKind || detectFileKind(file)
        const previewUrl =
          typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
            ? URL.createObjectURL(file)
            : ''

        newItems.push({
          id,
          file,
          name: file.name || 'recording.ogg',
          size: file.size,
          mimeType: type || 'audio/webm',
          kind,
          previewUrl,
          status: 'idle',
          progress: 0,
          error: null,
          order: current.length + newItems.length,
        })
      }

      if (newItems.length > 0) {
        trackAnalyticsEvent('files_uploaded', {
          userId: user?.id,
          metadata: { count: newItems.length },
        })
      }

      return [...current, ...newItems]
    })
  }, [user?.id])

  const removeFile = useCallback((id) => {
    setFiles((current) => {
      const target = current.find((item) => item.id === id)
      if (target?.previewUrl && typeof URL !== 'undefined') {
        URL.revokeObjectURL(target.previewUrl)
      }
      const activeTask = activeUploadTasksRef.current.get(id)
      if (activeTask && typeof activeTask.cancel === 'function') {
        activeTask.cancel()
        activeUploadTasksRef.current.delete(id)
      }
      const filtered = current.filter((item) => item.id !== id)
      return filtered.map((item, index) => ({ ...item, order: index }))
    })
  }, [])

  const moveFile = useCallback((fromIndex, toIndex) => {
    setFiles((current) => {
      if (
        fromIndex < 0 ||
        fromIndex >= current.length ||
        toIndex < 0 ||
        toIndex >= current.length ||
        fromIndex === toIndex
      ) {
        return current
      }
      const updated = [...current]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated.map((item, index) => ({ ...item, order: index }))
    })
  }, [])

  const moveFileUp = useCallback((id) => {
    setFiles((current) => {
      const index = current.findIndex((item) => item.id === id)
      if (index <= 0) return current
      const updated = [...current]
      const [item] = updated.splice(index, 1)
      updated.splice(index - 1, 0, item)
      return updated.map((f, i) => ({ ...f, order: i }))
    })
  }, [])

  const moveFileDown = useCallback((id) => {
    setFiles((current) => {
      const index = current.findIndex((item) => item.id === id)
      if (index === -1 || index >= current.length - 1) return current
      const updated = [...current]
      const [item] = updated.splice(index, 1)
      updated.splice(index + 1, 0, item)
      return updated.map((f, i) => ({ ...f, order: i }))
    })
  }, [])

  const handlePaste = useCallback(
    (event) => {
      const items = event.clipboardData?.items
      if (!items) return

      const imageFiles = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type && item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) {
            const fileName = `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
            const file = new File([blob.slice(0, blob.size, blob.type || 'image/png')], fileName, {
              type: blob.type || 'image/png',
            })
            imageFiles.push(file)
          }
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault()
        addFiles(imageFiles, 'screenshot')
      }
    },
    [addFiles]
  )

  const startRecording = useCallback(async () => {
    setRecorderError(null)
    if (recordedAudioUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(recordedAudioUrl)
      setRecordedAudioUrl(null)
      setRecordedBlob(null)
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setRecorderError('Запись аудио не поддерживается в данном браузере')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const mimeType =
        typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        setRecordedBlob(finalBlob)
        if (typeof URL !== 'undefined') {
          const url = URL.createObjectURL(finalBlob)
          setRecordedAudioUrl(url)
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        }
        setIsRecording(false)
        setIsPaused(false)
      }

      recorder.start(250)
      setIsRecording(true)
      setIsPaused(false)
      setRecordingDuration(0)

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev + 1 >= MAX_RECORDING_DURATION_SEC) {
            recorder.stop()
            return prev + 1
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      setRecorderError(
        err?.message || 'Не удалось получить доступ к микрофону. Проверьте разрешения.'
      )
    }
  }, [recordedAudioUrl])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const discardRecording = useCallback(() => {
    if (recordedAudioUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(recordedAudioUrl)
    }
    setRecordedBlob(null)
    setRecordedAudioUrl(null)
    setRecordingDuration(0)
    setIsRecording(false)
    setIsPaused(false)
    setRecorderError(null)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [recordedAudioUrl])

  const attachVoiceRecording = useCallback(() => {
    if (!recordedBlob) return
    const extension = recordedBlob.type.includes('mp4') ? 'm4a' : 'webm'
    const fileName = `voice-recap-${Date.now()}.${extension}`
    const file = new File([recordedBlob], fileName, {
      type: recordedBlob.type || 'audio/webm',
    })
    addFiles([file], 'voice')
    discardRecording()
  }, [recordedBlob, addFiles, discardRecording])

  const uploadSingleFile = useCallback(
    async (item, caseId) => {
      const path = `cases/${caseId}/${item.id}-${item.name}`

      setFiles((current) =>
        current.map((f) =>
          f.id === item.id ? { ...f, status: 'uploading', progress: 0, error: null } : f
        )
      )

      const task = uploader.upload(item.file, path, (progress) => {
        setFiles((current) => current.map((f) => (f.id === item.id ? { ...f, progress } : f)))
      })

      activeUploadTasksRef.current.set(item.id, task)

      try {
        const result = await task.promise
        setFiles((current) =>
          current.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'success',
                  progress: 100,
                  storagePath: result.storagePath,
                }
              : f
          )
        )
        return {
          id: item.id,
          kind: item.kind,
          storagePath: result.storagePath,
          downloadUrl: result.downloadUrl || null,
          mimeType: item.mimeType,
          durationSec: item.durationSec || null,
          order: item.order,
        }
      } catch (err) {
        setFiles((current) =>
          current.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error',
                  error: err?.message || 'Ошибка загрузки файла',
                }
              : f
          )
        )
        throw err
      } finally {
        activeUploadTasksRef.current.delete(item.id)
      }
    },
    [uploader]
  )

  const retryUpload = useCallback(
    async (fileId, caseId = 'draft') => {
      const target = files.find((f) => f.id === fileId)
      if (!target) return
      return uploadSingleFile(target, caseId)
    },
    [files, uploadSingleFile]
  )

  const cancelUpload = useCallback((fileId) => {
    const task = activeUploadTasksRef.current.get(fileId)
    if (task && typeof task.cancel === 'function') {
      task.cancel()
      activeUploadTasksRef.current.delete(fileId)
    }
    setFiles((current) =>
      current.map((f) =>
        f.id === fileId ? { ...f, status: 'error', error: 'Загрузка отменена' } : f
      )
    )
  }, [])

  const tryExampleCase = useCallback(async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const ownerId = user?.id || 'demo-user'
      const seeded = await repository.seedExamples(ownerId)
      const target = seeded[0]
      if (onSuccess && target) {
        onSuccess(target)
      }
      return target
    } catch (err) {
      setErrorMessage(err?.message || 'Не удалось создать демонстрационный кейс')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.id, repository, onSuccess])

  const submitAndUpload = useCallback(async () => {
    setErrorMessage(null)

    if (!consentConfirmed) {
      setErrorMessage('Необходимо подтвердить согласие клиента на использование материалов.')
      return
    }

    if (files.length === 0) {
      setErrorMessage('Пожалуйста, добавьте хотя бы один файл или запишите голос.')
      return
    }

    if (typeof repository.countByOwner === 'function' && user?.id) {
      const count = await repository.countByOwner(user.id)
      if (count >= MAX_CASES_PER_ACCOUNT) {
        setErrorMessage(
          `Достигнут лимит кейсов на аккаунт (${MAX_CASES_PER_ACCOUNT}). Удалите старые кейсы.`
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      const caseId = `case-${Date.now()}`
      const uploadedSources = []

      for (const item of files) {
        if (item.status === 'success' && item.storagePath) {
          uploadedSources.push({
            id: item.id,
            kind: item.kind,
            storagePath: item.storagePath,
            downloadUrl: item.downloadUrl || null,
            mimeType: item.mimeType,
            durationSec: item.durationSec || null,
            order: item.order,
          })
        } else {
          const source = await uploadSingleFile(item, caseId)
          uploadedSources.push(source)
        }
      }

      const created = await repository.create({
        ownerId: user?.id || 'guest-user',
        status: 'processing',
        clientLabel: clientLabel.trim() || 'Клиент',
        consentConfirmed: true,
        sources: uploadedSources,
        selectedVariant: 'dark',
        branding: {
          showLogo: true,
          companyName: user?.companyName || user?.profile?.companyName || null,
          logoPath: user?.logoPath || user?.profile?.logoPath || null,
        },
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      if (onSuccess) {
        onSuccess(created)
      }

      return created
    } catch (err) {
      setErrorMessage(err?.message || 'Не удалось загрузить файлы или создать кейс.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [
    consentConfirmed,
    files,
    uploadSingleFile,
    repository,
    user?.id,
    user?.companyName,
    user?.logoPath,
    user?.profile?.companyName,
    user?.profile?.logoPath,
    clientLabel,
    language,
    onSuccess,
  ])

  const remainingCases = Math.max(0, MAX_CASES_PER_ACCOUNT - userCasesCount)
  const isLimitExhausted = userCasesCount >= MAX_CASES_PER_ACCOUNT
  const canSubmit =
    consentConfirmed && files.length > 0 && !isSubmitting && !isLimitExhausted

  return {
    files,
    clientLabel,
    setClientLabel,
    language,
    setLanguage,
    consentConfirmed,
    setConsentConfirmed,
    errorMessage,
    setErrorMessage,
    isSubmitting,
    canSubmit,

    remainingCases,
    isLimitExhausted,
    userCasesCount,
    maxCases: MAX_CASES_PER_ACCOUNT,
    storageRetentionDays: STORAGE_RETENTION_DAYS,
    supportUrl: SUPPORT_TELEGRAM_URL,

    addFiles,
    removeFile,
    moveFile,
    moveFileUp,
    moveFileDown,
    handlePaste,

    isRecording,
    isPaused,
    recordingDuration,
    recordedBlob,
    recordedAudioUrl,
    recorderError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    attachVoiceRecording,

    submitAndUpload,
    retryUpload,
    cancelUpload,
    tryExampleCase,
  }
}
