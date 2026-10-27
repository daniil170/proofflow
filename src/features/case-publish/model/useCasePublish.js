import { useState, useCallback } from 'react'
import { getCaseRepository } from '@/shared/api'
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
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      setCopiedLink(false)
    }
  }, [publicUrl])

  const copyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    } catch {
      setCopiedEmbed(false)
    }
  }, [embedCode])

  const downloadCard = useCallback(() => {
    const draft = caseItem?.draft || {}
    const data = {
      metric: draft.metric?.value || '+45%',
      metricLabel: draft.metric?.label || 'рост конверсии',
      before: draft.problem || 'Клиент терял лиды на первом шаге',
      done: draft.solution || 'Полностью переработали интерфейс',
      after: draft.result || 'Увеличили показатель почти в полтора раза',
      quote: draft.quote?.text || 'Отличный результат!',
      author: draft.quote?.authorLabel || 'Анна К.',
      company: caseItem?.branding?.companyName || 'ProofFlow',
      accentColor: caseItem?.branding?.accentColor || '#d6f94c',
    }
    const canvas = renderCardPng(data)
    downloadCanvasBlob(canvas, `case-${caseItem?.id || 'card'}.png`)
  }, [caseItem])

  const downloadStory = useCallback(() => {
    const draft = caseItem?.draft || {}
    const data = {
      metric: draft.metric?.value || '+45%',
      metricLabel: draft.metric?.label || 'рост конверсии',
      before: draft.problem || 'Клиент терял лиды на первом шаге',
      done: draft.solution || 'Полностью переработали интерфейс',
      after: draft.result || 'Увеличили показатель почти в полтора раза',
      quote: draft.quote?.text || 'Отличный результат!',
      author: draft.quote?.authorLabel || 'Анна К.',
      company: caseItem?.branding?.companyName || 'ProofFlow',
      accentColor: caseItem?.branding?.accentColor || '#d6f94c',
    }
    const canvas = renderStoryPng(data)
    downloadCanvasBlob(canvas, `case-${caseItem?.id || 'story'}-story.png`)
  }, [caseItem])

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
