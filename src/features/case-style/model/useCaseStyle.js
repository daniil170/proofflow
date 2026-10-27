import { useState, useMemo, useCallback } from 'react'
import { getCaseRepository, getSourceUploader, trackAnalyticsEvent } from '@/shared/api'
import { calculateContrastRatio, VARIANT_BACKGROUND_COLORS } from './contrast'

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/svg+xml']

export const useCaseStyle = ({
  caseItem,
  userProfile = null,
  onSave = null,
  repository = getCaseRepository(),
  uploader = getSourceUploader(),
} = {}) => {
  const [selectedVariant, setSelectedVariant] = useState(
    caseItem?.selectedVariant || 'dark'
  )
  const [accentColor, setAccentColor] = useState(
    caseItem?.branding?.accentColor || '#d6f94c'
  )
  const [showLogo, setShowLogo] = useState(
    caseItem?.branding?.showLogo ?? true
  )
  const [companyName, setCompanyName] = useState(
    caseItem?.branding?.companyName || userProfile?.companyName || ''
  )
  const [logoPath, setLogoPath] = useState(caseItem?.branding?.logoPath || null)
  const [logoUrl, setLogoUrl] = useState(caseItem?.branding?.logoUrl || null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeMode, setActiveMode] = useState('card')

  const bgColor = VARIANT_BACKGROUND_COLORS[selectedVariant] || '#0d1714'
  const contrastInfo = useMemo(() => {
    return calculateContrastRatio(accentColor, bgColor)
  }, [accentColor, bgColor])

  const previewData = useMemo(() => {
    const draft = caseItem?.draft || {}
    const metric = draft.metric?.value || caseItem?.metric || '+45%'
    const metricLabel = draft.metric?.label || caseItem?.metricLabel || 'рост конверсии'
    const before = draft.problem || caseItem?.before || 'Клиент терял лиды на первом шаге'
    const done = draft.solution || caseItem?.done || 'Полностью переработали интерфейс'
    const after = draft.result || caseItem?.after || 'Увеличили показатель почти в полтора раза'
    const quote = draft.quote?.text || caseItem?.quote || 'Отличный результат!'
    const author = draft.quote?.authorLabel || caseItem?.author || 'Анна К.'
    const authorRole = draft.quote?.authorRole || ''

    return {
      metric,
      metricLabel,
      before,
      done,
      after,
      quote,
      author,
      company: companyName || 'ProofFlow',
      isVerifiedByChat: true,
      category: 'КЕЙС',
      niche: draft.tags?.[0] || 'B2B',
      channel: draft.tags?.[1] || 'Сайт',
      duration: '3 недели',
      authorRole,
      logoUrl: showLogo ? logoUrl : null,
      accentColor,
    }
  }, [caseItem, companyName, showLogo, logoUrl, accentColor])

  const handleSelectVariant = useCallback(
    (variant) => {
      setSelectedVariant(variant)
      trackAnalyticsEvent('style_selected', {
        userId: caseItem?.ownerId,
        caseId: caseItem?.id,
        metadata: { variant },
      })
    },
    [caseItem?.id, caseItem?.ownerId]
  )

  const handleAccentChange = useCallback((hex) => {
    setAccentColor(hex)
  }, [])

  const handleCompanyNameChange = useCallback((name) => {
    setCompanyName(name)
  }, [])

  const handleShowLogoToggle = useCallback(() => {
    setShowLogo((prev) => !prev)
  }, [])

  const handleLogoUpload = useCallback(
    async (file) => {
      if (!file) return
      setLogoError(null)

      if (!ALLOWED_LOGO_MIME_TYPES.includes(file.type)) {
        setLogoError('Разрешены только файлы PNG и SVG')
        return
      }

      if (file.size > MAX_LOGO_SIZE_BYTES) {
        setLogoError('Размер логотипа не должен превышать 2 МБ')
        return
      }

      setIsUploadingLogo(true)
      try {
        const caseId = caseItem?.id || 'temp-case'
        const fileExt = file.type === 'image/svg+xml' ? 'svg' : 'png'
        const path = `cases/${caseId}/branding/logo.${fileExt}`

        let uploadedUrl = null
        if (uploader && typeof uploader.upload === 'function') {
          const res = await uploader.upload({
            file,
            storagePath: path,
            caseId,
          })
          uploadedUrl = res?.downloadUrl || res?.storagePath || URL.createObjectURL(file)
        } else {
          uploadedUrl = URL.createObjectURL(file)
        }

        setLogoPath(path)
        setLogoUrl(uploadedUrl)
      } catch (err) {
        setLogoError(err?.message || 'Не удалось загрузить логотип')
      } finally {
        setIsUploadingLogo(false)
      }
    },
    [caseItem, uploader]
  )

  const handleRemoveLogo = useCallback(() => {
    setLogoPath(null)
    setLogoUrl(null)
  }, [])

  const saveStyle = useCallback(async () => {
    if (!caseItem?.id) return
    setIsSaving(true)
    try {
      const brandingPatch = {
        showLogo,
        accentColor,
        companyName,
        logoPath,
        logoUrl,
      }

      await repository.update(caseItem.id, {
        selectedVariant,
        branding: brandingPatch,
      })

      if (typeof onSave === 'function') {
        onSave({ selectedVariant, branding: brandingPatch })
      }
    } finally {
      setIsSaving(false)
    }
  }, [caseItem, selectedVariant, showLogo, accentColor, companyName, logoPath, logoUrl, repository, onSave])

  return {
    selectedVariant,
    accentColor,
    showLogo,
    companyName,
    logoPath,
    logoUrl,
    isUploadingLogo,
    logoError,
    isSaving,
    contrastInfo,
    activeMode,
    previewData,
    setActiveMode,
    handleSelectVariant,
    handleAccentChange,
    handleCompanyNameChange,
    handleShowLogoToggle,
    handleLogoUpload,
    handleRemoveLogo,
    saveStyle,
  }
}
