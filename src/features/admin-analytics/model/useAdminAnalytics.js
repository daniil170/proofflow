import { useEffect, useState } from 'react'
import { getAnalyticsRepository } from '@/shared/api'

export const useAdminAnalytics = ({
  repository = getAnalyticsRepository(),
} = {}) => {
  const [period, setPeriodState] = useState('7d')
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const setPeriod = (newPeriod) => {
    setIsLoading(true)
    setError(null)
    setPeriodState(newPeriod)
  }

  useEffect(() => {
    let isMounted = true

    repository
      .getAnalytics(period)
      .then((res) => {
        if (!isMounted) return

        const byChannel = [
          { label: 'Веб-форма', count: res.channelBreakdown?.web || 0 },
          { label: 'Telegram-бот', count: res.channelBreakdown?.telegram || 0 },
        ]

        const businessLabels = {
          agency_or_studio: 'Агентство / Студия',
          marketing_agency: 'Маркетинг',
          web_studio: 'Веб-студия',
          it_outsource: 'IT-аутсорс',
          consulting: 'Консалтинг',
          freelance: 'Фриланс / Инди',
          other: 'Другое',
        }

        const byBusinessType = Object.entries(res.businessTypeBreakdown || {}).map(
          ([key, count]) => ({
            label: businessLabels[key] || key,
            count,
          })
        )

        setData({
          ...res,
          kpis: {
            today: res.todayApplications,
            last7Days: res.weekApplications,
            total: res.totalApplications,
            conversionRate: res.conversionRate,
          },
          byChannel,
          byBusinessType,
        })
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err?.message || 'Не удалось загрузить аналитику')
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [repository, period])

  return {
    period,
    data,
    isLoading,
    error,
    setPeriod,
  }
}
