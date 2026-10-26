import { useEffect } from 'react'
import { LegalLayout, privacyData } from '@/components/legal'

export const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Политика конфиденциальности — ProofFlow'
    window.scrollTo(0, 0)
  }, [])

  return <LegalLayout doc={privacyData} />
}
