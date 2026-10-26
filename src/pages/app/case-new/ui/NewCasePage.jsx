import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { CaseUploadForm, useCaseUpload } from '@/features/case-upload'
import { UploadTrustNotice } from '@/components/legal'
import styles from './NewCasePage.module.css'

export const NewCasePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const uploadState = useCaseUpload({
    user,
    onSuccess: (createdCase) => {
      navigate(`/app/cases/${createdCase.id}`)
    },
  })

  return (
    <div className={styles.container}>
      <Link to="/app" className={styles.backLink}>
        ← Назад к списку кейсов
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Создать новый кейс</h1>
        <p className={styles.subtitle}>
          Загрузите скриншоты переписки, аудиозапись созвона или надиктуйте голосовой пересказ
        </p>
      </header>

      <CaseUploadForm uploadState={uploadState} />

      <UploadTrustNotice />
    </div>
  )
}
