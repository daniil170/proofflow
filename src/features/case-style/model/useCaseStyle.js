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

  const [lastSyncedCaseId, setLastSyncedCaseId] = useState(caseItem?.id)
  if (caseItem?.id && caseItem.id !== lastSyncedCaseId) {
    setLastSyncedCaseId(caseItem.id)
    if (caseItem.selectedVariant) setSelectedVariant(caseItem.selectedVariant)
    if (caseItem.branding?.accentColor) setAccentColor(caseItem.branding.accentColor)
    if (caseItem.branding?.showLogo !== undefined) setShowLogo(caseItem.branding.showLogo)
    if (caseItem.branding?.companyName) setCompanyName(caseItem.branding.companyName)
    if (caseItem.branding?.logoPath) setLogoPath(caseItem.branding.logoPath)
    if (caseItem.branding?.logoUrl) setLogoUrl(caseItem.branding.logoUrl)
  }

  const bgColor = VARIANT_BACKGROUND_COLORS[selectedVariant] || '#0d1714'
  const contrastInfo = useMemo(() => {
    return calculateContrastRatio(accentColor, bgColor)
  }, [accentColor, bgColor])

  const previewData = useMemo(() => {
    const draft = caseItem?.draft || {}
    const headline = draft.headline?.text || ''
    const metric = draft.metric?.value || ''
    const metricLabel = draft.metric?.label || ''
    const before = draft.problem || ''
    const done = draft.solution || ''
    const after = draft.result || ''
    const summaryRows = Array.isArray(draft.summaryRows) ? draft.summaryRows : []
    const quote = draft.quote?.text || ''
    const rawAuthor = draft.quote?.authorLabel
    const author = (!rawAuthor || rawAuthor === 'Анна К.') ? 'Клиент' : rawAuthor
    const authorRole = draft.quote?.authorRole || ''
    const authorCompany = draft.quote?.authorCompany || ''

    const rawSelected =
      Array.isArray(caseItem?.selectedChatMessages) && caseItem.selectedChatMessages.length > 0
        ? caseItem.selectedChatMessages
        : Array.isArray(caseItem?.cardMessages) && caseItem.cardMessages.length > 0
        ? caseItem.cardMessages
        : Array.isArray(caseItem?.chatMessages)
        ? caseItem.chatMessages.slice(0, 3)
        : []

    const messenger = caseItem?.messenger || 'unknown'
    const category = draft.tags?.[0] || 'Отзыв клиента'
    const niche = draft.tags?.[1] || ''

    return {
      headline,
      title: headline,
      metric,
      metricLabel,
      before,
      done,
      after,
      summaryRows,
      quote,
      author,
      authorRole,
      authorCompany,
      company: companyName || authorCompany || '',
      isVerifiedByChat: Boolean(draft.quote?.evidenceId || draft.metric?.evidenceId || rawSelected.length > 0),
      category,
      niche,
      messenger,
      cardMessages: rawSelected,
      chatMessages: rawSelected,
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
