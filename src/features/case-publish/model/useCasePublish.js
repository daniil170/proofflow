import { useState, useCallback } from 'react'
import { getCaseRepository, trackAnalyticsEvent } from '@/shared/api'
import { renderCardPng, renderStoryPng, downloadCanvasBlob } from './pngExporter'
import { getEmbedCode } from './embedSnippets'

export const useCasePublish = ({
  caseItem,
  onPublishChanged = null,
  repository = getCaseRepository(),
} = {}) => {
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [error, setError] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const isPublished = caseItem?.status === 'published'
  const publicUrl = `${window.location.origin}/c/${caseItem?.id}`
  const embedCode = getEmbedCode(caseItem?.id || '', window.location.origin)

  const publish = useCallback(async () => {
    if (!caseItem?.id) return
    setIsPublishing(true)
    setError(null)
    try {
      await repository.publishCase(caseItem.id, true)
      if (typeof onPublishChanged === 'function') {
        onPublishChanged({ status: 'published', publishedAt: Date.now() })
      }
    } catch (err) {
      setError(err?.message || 'Не удалось опубликовать кейс')
    } finally {
      setIsPublishing(false)
    }
  }, [caseItem, repository, onPublishChanged])

  const unpublish = useCallback(async () => {
    if (!caseItem?.id) return
    setIsUnpublishing(true)
    setError(null)
    try {
      await repository.unpublishCase(caseItem.id)
      if (typeof onPublishChanged === 'function') {
        onPublishChanged({ status: 'ready', publishedAt: null })
      }
    } catch (err) {
      setError(err?.message || 'Не удалось снять кейс с публикации')
    } finally {
      setIsUnpublishing(false)
    }
  }, [caseItem, repository, onPublishChanged])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      trackAnalyticsEvent('link_copied', {
        userId: caseItem?.ownerId,
        caseId: caseItem?.id,
      })
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      setCopiedLink(false)
    }
  }, [publicUrl, caseItem])

  const copyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopiedEmbed(true)
      trackAnalyticsEvent('embed_copied', {
        userId: caseItem?.ownerId,
        caseId: caseItem?.id,
      })
      setTimeout(() => setCopiedEmbed(false), 2000)
    } catch {
      setCopiedEmbed(false)
    }
  }, [embedCode, caseItem])

  const buildExportPayload = useCallback(() => {
    const draft = caseItem?.draft || {}
    const tags = Array.isArray(draft.tags) ? draft.tags.filter(Boolean) : []
    const authorRole = draft.quote?.authorRole || ''
    const category = tags[0] || ''

    const rawSelected =
      Array.isArray(caseItem?.selectedChatMessages) && caseItem.selectedChatMessages.length > 0
        ? caseItem.selectedChatMessages
        : Array.isArray(caseItem?.cardMessages) && caseItem.cardMessages.length > 0
        ? caseItem.cardMessages
        : Array.isArray(caseItem?.chatMessages)
        ? caseItem.chatMessages.slice(0, 3)
        : []

    return {
      variant: caseItem?.selectedVariant || 'dark',
      headline: draft.headline?.text || '',
      metric: draft.metric?.value || '',
      metricLabel: draft.metric?.label || '',
      before: draft.problem || '',
      done: draft.solution || '',
      after: draft.result || '',
      summaryRows: Array.isArray(draft.summaryRows) && draft.summaryRows.length > 0 ? draft.summaryRows : [],
      quote: draft.quote?.text || '',
      author: draft.quote?.authorLabel || 'Клиент',
      authorRole,
      authorCompany: draft.quote?.authorCompany || '',
      category,
      tags,
      company: caseItem?.branding?.companyName || draft.quote?.authorCompany || '',
      accentColor: caseItem?.branding?.accentColor || (caseItem?.selectedVariant === 'whatsapp' ? '#ffd13b' : '#d6f94c'),
      messenger: caseItem?.messenger || 'unknown',
      cardMessages: rawSelected,
      chatMessages: rawSelected,
      isVerifiedByChat: Boolean(draft.quote?.evidenceId || draft.metric?.evidenceId || rawSelected.length > 0),
    }
  }, [caseItem])

  const downloadCard = useCallback(() => {
    const data = buildExportPayload()
    const canvas = renderCardPng(data)
    downloadCanvasBlob(canvas, `case-${caseItem?.id || 'card'}.png`)
    trackAnalyticsEvent('png_downloaded', {
      userId: caseItem?.ownerId,
      caseId: caseItem?.id,
      metadata: { format: 'card' },
    })
  }, [caseItem, buildExportPayload])

  const downloadStory = useCallback(() => {
    const data = buildExportPayload()
    const canvas = renderStoryPng(data)
    downloadCanvasBlob(canvas, `case-${caseItem?.id || 'story'}-story.png`)
    trackAnalyticsEvent('png_downloaded', {
      userId: caseItem?.ownerId,
      caseId: caseItem?.id,
      metadata: { format: 'story' },
    })
  }, [caseItem, buildExportPayload])

  return {
    isPublished,
    isPublishing,
    isUnpublishing,
    error,
    publicUrl,
    embedCode,
    copiedLink,
    copiedEmbed,
    publish,
    unpublish,
    copyLink,
    copyEmbed,
    downloadCard,
    downloadStory,
  }
}