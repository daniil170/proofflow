import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { CASE_STATUS, getCaseRepository } from '@/shared/api'
import styles from './NewCasePage.module.css'

export const NewCasePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [metric, setMetric] = useState('')
  const [metricLabel, setMetricLabel] = useState('')
  const [sourceType, setSourceType] = useState('audio')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !client.trim()) {
      setError('Заполните название кейса и имя клиента')
      return
    }

    setIsSubmitting(true)
    try {
      const repository = getCaseRepository()
      const slug = client
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/g, '-')
        .replace(/^-|-$/g, '')

      const created = await repository.create({
        ownerId: user?.id,
        title: title.trim(),
        client: client.trim(),
        metric: metric.trim() || '+100%',
        metricLabel: metricLabel.trim() || 'результат проекта',
        summary: notes.trim() || 'Кейс находится в процессе упаковки и анализа.',
        quote: 'Проект реализован с использованием инструментов ProofFlow.',
        author: client.trim(),
        sourceType,
        status: CASE_STATUS.PROCESSING,
        slug,
      })

      navigate(`/app/cases/${created.id}`)
    } catch (err) {
      setError(err?.message || 'Не удалось создать кейс. Попробуйте еще раз.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <Link to="/app" className={styles.backLink}>
        ← Назад к списку кейсов
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Создать новый кейс</h1>
        <p className={styles.subtitle}>
          Задайте вводные данные созвона или интервью, чтобы запустить генерацию продающего кейса
        </p>
      </header>

      <div className={styles.card}>
        {error && <div className={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="case-client" className={styles.label}>
                Клиент / Компания *
              </label>
              <input
                id="case-client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Например: Acme IT Solutions"
                required
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="case-source-type" className={styles.label}>
                Тип источника
              </label>
              <select
                id="case-source-type"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="audio">Запись Zoom / Meet (аудио)</option>
                <option value="video">Скринкаст / Видео</option>
                <option value="text">Текстовые заметки / Интервью</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="case-title" className={styles.label}>
              Название кейса или тема проекта *
            </label>
            <input
              id="case-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Увеличение конверсии в отделе продаж на 140%"
              required
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="case-metric" className={styles.label}>
                Ключевая цифра / метрика
              </label>
              <input
                id="case-metric"
                type="text"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                placeholder="+140%, 3x, 48 часов"
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="case-metric-label" className={styles.label}>
                Пояснение к метрике
              </label>
              <input
                id="case-metric-label"
                type="text"
                value={metricLabel}
                onChange={(e) => setMetricLabel(e.target.value)}
                placeholder="рост конверсии воронки"
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="case-notes" className={styles.label}>
              Ключевые факты, цитаты или тезисы созвона
            </label>
            <textarea
              id="case-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Вставьте расшифровку созвона, основные тезисы или факты о том, какую проблему решали и что получили..."
              className={styles.textarea}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.actions}>
            <Link to="/app" className={styles.cancelButton}>
              Отмена
            </Link>
            <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? 'Создаем кейс...' : 'Запустить генерацию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
