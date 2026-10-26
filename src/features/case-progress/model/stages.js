export const PIPELINE_STAGES = Object.freeze([
  {
    id: 'preparing',
    label: 'Готовим материал',
    description: 'Проверяем форматы и подготавливаем записи',
  },
  {
    id: 'transcribing',
    label: 'Расшифровываем',
    description: 'Распознаем речь из аудио и видеофайлов',
  },
  {
    id: 'reading',
    label: 'Читаем переписку',
    description: 'Извлекаем диалоги и контекст со скриншотов',
  },
  {
    id: 'analyzing',
    label: 'Ищем проблему, решение и результат',
    description: 'Формируем сильную структуру и выделяем факты',
  },
  {
    id: 'verifying',
    label: 'Проверяем цитаты и цифры',
    description: 'Сверяем числа и дословные фразы с первоисточниками',
  },
])

export const calculateStageStatuses = (currentStage, caseStatus) => {
  if (caseStatus === 'review' || caseStatus === 'published' || currentStage === 'done') {
    return PIPELINE_STAGES.map((stage) => ({
      ...stage,
      status: 'completed',
    }))
  }

  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStage)
  const safeIndex = currentIndex === -1 ? 0 : currentIndex

  return PIPELINE_STAGES.map((stage, index) => {
    if (caseStatus === 'failed') {
      if (index < safeIndex) {
        return { ...stage, status: 'completed' }
      }
      if (index === safeIndex) {
        return { ...stage, status: 'failed' }
      }
      return { ...stage, status: 'pending' }
    }

    if (index < safeIndex) {
      return { ...stage, status: 'completed' }
    }
    if (index === safeIndex) {
      return { ...stage, status: 'active' }
    }
    return { ...stage, status: 'pending' }
  })
}

export const formatRussianFailReason = (rawReason) => {
  if (!rawReason) {
    return 'Произошла непредвиденная ошибка при обработке материалов'
  }

  const lower = String(rawReason).toLowerCase()

  if (lower.includes('audio') || lower.includes('whisper') || lower.includes('sound')) {
    return 'Не удалось распознать речь: проверьте качество аудиозаписи и отсутствие сильного шума'
  }
  if (lower.includes('image') || lower.includes('screenshot') || lower.includes('vision')) {
    return 'Не удалось прочитать текст на скриншотах: убедитесь, что сообщения четко видны'
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('504')) {
    return 'Время обработки истекло из-за высокой нагрузки или большого объема файлов'
  }
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
    return 'Превышен лимит запросов сервиса. Попробуйте повторить чуть позже'
  }
  if (lower.includes('format') || lower.includes('corrupt') || lower.includes('codec')) {
    return 'Не удалось открыть один из файлов: возможно, формат поврежден или не поддерживается'
  }

  return rawReason
}
