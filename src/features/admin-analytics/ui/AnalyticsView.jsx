import { useState } from 'react'
import PropTypes from 'prop-types'
import { useAdminAnalytics } from '../model/useAdminAnalytics'
import { exportApplicationsToCsv } from '../model/exportCsv'
import { getApplicationRepository } from '@/shared/api'
import { DailyTrendChart, FunnelChart, HorizontalBarChart } from './Charts'
import styles from './AnalyticsView.module.css'

export const AnalyticsView = ({ initialApplications = null }) => {
  const { period, setPeriod, data, isLoading, error } = useAdminAnalytics()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      let apps = initialApplications
      if (!apps) {
        const repo = getApplicationRepository()
        apps = await repo.getApplications()
      }
      exportApplicationsToCsv(apps)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <div className={styles.container}>Загрузка аналитики...</div>
  }

  if (error) {
    return <div className={styles.container}>{error}</div>
  }

  if (!data) {
    return null
  }

  const { kpis, dailyTrend, funnel, byChannel, byBusinessType, hasEvents } = data

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.periodButtons}>
          <button
            type="button"
            className={`${styles.periodBtn} ${period === '7d' ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod('7d')}
          >
            7 дней
          </button>
          <button
            type="button"
            className={`${styles.periodBtn} ${period === '30d' ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod('30d')}
          >
            30 дней
          </button>
          <button
            type="button"
            className={`${styles.periodBtn} ${period === 'all' ? styles.periodBtnActive : ''}`}
            onClick={() => setPeriod('all')}
          >
            Все время
          </button>
        </div>

        <button
          type="button"
          className={styles.exportBtn}
          onClick={handleExport}
          disabled={isExporting}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isExporting ? 'Экспорт...' : 'Экспорт в CSV'}
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>За сегодня</span>
          <span className={styles.kpiValue}>{kpis.today}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>За 7 дней</span>
          <span className={styles.kpiValue}>{kpis.last7Days}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Всего заявок</span>
          <span className={styles.kpiValue}>{kpis.total}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Конверсия в активацию</span>
          <span className={styles.kpiValue}>{kpis.conversionRate}%</span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Динамика заявок по дням</h3>
          <DailyTrendChart data={dailyTrend} />
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Воронка заявок</h3>
          <FunnelChart stages={funnel} />
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Каналы привлечения</h3>
          <HorizontalBarChart items={byChannel} />
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Сферы деятельности</h3>
          <HorizontalBarChart items={byBusinessType} />
        </div>
      </div>

      {!hasEvents && (
        <div className={styles.emptyEventsBox}>
          <h4 className={styles.emptyEventsTitle}>События продукта еще не поступали</h4>
          <p className={styles.emptyEventsText}>
            Внутренняя продуктовая аналитика (действия пользователей, переходы по экранам) начнет накапливаться автоматически после открытия доступа первым пользователям.
          </p>
        </div>
      )}
    </div>
  )
}

AnalyticsView.propTypes = {
  initialApplications: PropTypes.array,
}
