import { useEffect } from 'react'
import { LegalLayout, termsData } from '@/components/legal'

export const TermsPage = () => {
  useEffect(() => {
    document.title = 'Условия использования — ProofFlow'
    window.scrollTo(0, 0)
  }, [])

  return <LegalLayout doc={termsData} />
}
