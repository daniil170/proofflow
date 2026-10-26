import { useState, useCallback, useEffect, useRef } from 'react'
import { GALLERY_ITEMS } from './galleryRegistry'

export const useCaseGallery = (initialSelectedId = 'dark') => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeMode, setActiveMode] = useState('card')
  const [device, setDevice] = useState('desktop')
  const [selectedStyleId, setSelectedStyleId] = useState(initialSelectedId)

  const openerRef = useRef(null)

  const openGallery = useCallback((index = 0) => {
    openerRef.current = document.activeElement
    const clampedIndex = Math.max(0, Math.min(index, GALLERY_ITEMS.length - 1))
    setCurrentIndex(clampedIndex)
    setIsOpen(true)
  }, [])

  const closeGallery = useCallback(() => {
    setIsOpen(false)
    if (openerRef.current && typeof openerRef.current.focus === 'function') {
      openerRef.current.focus()
    }
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % GALLERY_ITEMS.length)
  }, [])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length)
  }, [])

  const goTo = useCallback((index) => {
    const clampedIndex = Math.max(0, Math.min(index, GALLERY_ITEMS.length - 1))
    setCurrentIndex(clampedIndex)
  }, [])

  const selectStyle = useCallback(
    (styleId) => {
      setSelectedStyleId(styleId)
      closeGallery()
    },
    [closeGallery]
  )

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeGallery()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeGallery, next, prev])

  return {
    isOpen,
    currentIndex,
    currentItem: GALLERY_ITEMS[currentIndex] || GALLERY_ITEMS[0],
    activeMode,
    device,
    selectedStyleId,
    totalItems: GALLERY_ITEMS.length,
    openGallery,
    closeGallery,
    next,
    prev,
    goTo,
    setMode: setActiveMode,
    setDevice,
    selectStyle,
  }
}
