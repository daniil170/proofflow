import { useOutletContext } from 'react-router-dom'
import { AnalyticsView } from '@/features/admin-analytics'

export const AdminAnalyticsPage = () => {
  const context = useOutletContext()
  const applications = context?.applications || null

  return (
    <div>
      <AnalyticsView initialApplications={applications} />
    </div>
  )
}
