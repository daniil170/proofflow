export const downloadCanvasBlob = (canvas, filename) => {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

const drawRoundRect = (ctx, x, y, width, height, radius) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

const drawProofFlowIcon = (ctx, x, y, size) => {
  ctx.fillStyle = '#0B0B0C'
  drawRoundRect(ctx, x, y, size, size, Math.round(size * 0.23))
  ctx.fill()

  ctx.save()
  ctx.lineWidth = Math.max(1.5, size * 0.1)
  ctx.lineCap = 'round'

  ctx.strokeStyle = '#FFFFFF'
  const leftX = x + size * 0.38
  const rightX = x + size * 0.62
  const bottomY = y + size * 0.78
  const archTopY = y + size * 0.28
  const archPeakY = y + size * 0.22

  ctx.beginPath()
  ctx.moveTo(leftX, bottomY)
  ctx.lineTo(leftX, archTopY)
  ctx.quadraticCurveTo(leftX, archPeakY, leftX + size * 0.1, archPeakY)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(rightX, bottomY)
  ctx.lineTo(rightX, archTopY)
  ctx.quadraticCurveTo(rightX, archPeakY, rightX + size * 0.1, archPeakY)
  ctx.stroke()

  ctx.strokeStyle = '#D4FF3A'
  ctx.beginPath()
  ctx.moveTo(x + size * 0.24, y + size * 0.44)
  ctx.lineTo(x + size * 0.76, y + size * 0.44)
  ctx.stroke()

  ctx.restore()
}

const drawProofFlowWordmark = (ctx, x, y, height = 12, color = '#FFFFFF', limeColor = '#D4FF3A') => {
  ctx.save()
  const scale = height / 80
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.strokeStyle = color
  if (typeof Path2D !== 'undefined') {
    ctx.stroke(
      new Path2D(
        'M4.5 75.5V24.5M51.5 55.5V24.5M51.5 40A15.5 15.5 0 0 1 67 24.5M172.5 55.5V16A11.5 11.5 0 0 1 184 4.5M196.5 55.5V16A11.5 11.5 0 0 1 208 4.5M223 4.5V55.5M284 24.5L294 55.5L304 30L314 55.5L324 24.5'
      )
    )
    const drawCircle = (cx, cy, r) => {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    drawCircle(20, 40, 15.5)
    drawCircle(96, 40, 15.5)
    drawCircle(142, 40, 15.5)
    drawCircle(253.5, 40, 15.5)

    ctx.strokeStyle = limeColor
    ctx.stroke(new Path2D('M165 24.5H209'))
  }
  ctx.restore()
}

const measureTextLines = (ctx, text, maxWidth) => {
  if (!text) return []
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n]
    const testWidth = ctx.measureText(testLine).width
    if (testWidth > maxWidth && n > 0) {
      lines.push(line)
      line = words[n]
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)
  return lines
}

export const renderStoryPng = (data = {}) => {
  const width = 1080
  const height = 1920
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bgGradient = ctx.createLinearGradient(0, 0, width, height)
  bgGradient.addColorStop(0, '#0a100d')
  bgGradient.addColorStop(0.5, '#040706')
  bgGradient.addColorStop(1, '#020302')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  const accentColor = data.accentColor || '#d6f94c'
  const cardX = 80
  const cardWidth = 920
  const cardPadding = 48
  const contentWidth = cardWidth - cardPadding * 2

  const category = (data.category || data.niche || 'КЕЙС').toUpperCase()
  const authorName = (data.author && data.author.trim()) ? data.author.trim() : 'Клиент'
  const isDefaultAuthor = authorName.toLowerCase() === 'клиент'
  const authorInitial = !isDefaultAuthor ? authorName.charAt(0).toUpperCase() : null
  const authorRole = [data.authorRole, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow')
    .join(' · ')

  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'БЫЛО', text: data.before } : null,
        data.done ? { label: 'СДЕЛАНО', text: data.done } : null,
        data.after ? { label: 'СТАЛО', text: data.after } : null,
      ].filter(Boolean)

  const headline = data.headline || ''
  const hasMetric = Boolean(data.metric)

  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const lineH = 34

  const renderedBoxes = rows.slice(0, 3).map((row, idx) => {
    const isHighlight = idx === rows.length - 1
    ctx.font = isHighlight
      ? '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const lines = measureTextLines(ctx, row.text, contentWidth - 44)
    const boxHeight = Math.max(104, 48 + lines.length * lineH + 14)
    return { label: row.label.toUpperCase(), lines, isHighlight, boxHeight }
  })

  ctx.font = 'italic 500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const quoteLines = data.quote ? measureTextLines(ctx, `«${data.quote}»`, contentWidth) : []
  const quoteHeight = quoteLines.length > 0 ? quoteLines.length * 40 : 0

  const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : []
  const hasTags = tags.length > 0
  const tagsHeight = hasTags ? 40 : 0

  const boxesTotalHeight = renderedBoxes.reduce((sum, b) => sum + b.boxHeight + 14, 0)

  const totalContentHeight =
    32 +
    24 +
    (hasMetric ? 96 + 14 + 36 + 28 : (headline ? 48 + 28 : 0)) +
    boxesTotalHeight +
    (hasTags ? 20 + tagsHeight : 0) +
    (quoteHeight > 0 ? 24 + quoteHeight + 28 : 0) +
    1 +
    24 +
    54

  const cardHeight = cardPadding * 2 + totalContentHeight
  const cardY = Math.max(80, Math.round((height - cardHeight) / 2))

  ctx.fillStyle = '#0d1714'
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 32)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  let currentY = cardY + cardPadding

  ctx.fillStyle = '#94a3b8'
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`КЕЙС · ${category}`, cardX + cardPadding, currentY + 22)

  ctx.fillStyle = '#22c55e'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('🛡 Проверено по переписке', cardX + cardWidth - cardPadding, currentY + 22)
  ctx.textAlign = 'left'

  currentY += 32 + 24

  if (hasMetric) {
    ctx.fillStyle = accentColor
    ctx.font = '900 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(data.metric, cardX + cardPadding, currentY + 84)

    currentY += 96 + 14

    if (data.metricLabel) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(data.metricLabel, cardX + cardPadding, currentY + 28)
      currentY += 36 + 28
    } else {
      currentY += 28
    }
  } else if (headline) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(headline, cardX + cardPadding, currentY + 36)
    currentY += 48 + 28
  }

  for (const b of renderedBoxes) {
    ctx.fillStyle = b.isHighlight ? 'rgba(214, 249, 76, 0.1)' : 'rgba(255, 255, 255, 0.04)'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, b.boxHeight, 18)
    ctx.fill()
    if (b.isHighlight) {
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.fillStyle = b.isHighlight ? accentColor : '#94a3b8'
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(b.label, cardX + cardPadding + 24, currentY + 34)

    ctx.fillStyle = '#ffffff'
    ctx.font = b.isHighlight
      ? '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    let textY = currentY + 68
    for (const l of b.lines) {
      ctx.fillText(l, cardX + cardPadding + 24, textY)
      textY += lineH
    }
    currentY += b.boxHeight + 14
  }

  if (hasTags) {
    currentY += 6
    let tagX = cardX + cardPadding
    for (const tag of tags.slice(0, 3)) {
      ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const tagW = ctx.measureText(tag).width + 28
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      drawRoundRect(ctx, tagX, currentY, tagW, 36, 18)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(tag, tagX + 14, currentY + 24)
      tagX += tagW + 10
    }
    currentY += tagsHeight + 14
  }

  if (quoteHeight > 0) {
    currentY += 10
    ctx.fillStyle = '#f4f4f5'
    ctx.font = 'italic 500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    let qY = currentY + 28
    for (const ql of quoteLines) {
      ctx.fillText(ql, cardX + cardPadding, qY)
      qY += 40
    }
    currentY += quoteHeight + 28
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + cardPadding, currentY)
  ctx.lineTo(cardX + cardWidth - cardPadding, currentY)
  ctx.stroke()

  currentY += 24

  const avatarRadius = 26
  const avatarCenterX = cardX + cardPadding + avatarRadius
  const avatarCenterY = currentY + avatarRadius

  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.stroke()

  if (authorInitial) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(authorInitial, avatarCenterX, avatarCenterY + 8)
    ctx.textAlign = 'left'
  } else {
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(avatarCenterX, avatarCenterY - 5, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(avatarCenterX, avatarCenterY + 18, 14, Math.PI, Math.PI * 2)
    ctx.fill()
  }

  const authorTextX = avatarCenterX + avatarRadius + 16
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(authorName, authorTextX, currentY + 22)

  if (authorRole) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(authorRole, authorTextX, currentY + 46)
  }

  const brandX = cardX + cardWidth - cardPadding
  const wordmarkW = 62
  const wordmarkH = 15
  const wordmarkX = brandX - wordmarkW
  const wordmarkY = currentY + 22

  drawProofFlowWordmark(ctx, wordmarkX, wordmarkY, wordmarkH, '#FFFFFF', '#D4FF3A')

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const labelX = wordmarkX - 4
  ctx.fillText('Powered by', labelX, currentY + 34)

  const labelW = ctx.measureText('Powered by').width
  drawProofFlowIcon(ctx, labelX - labelW - 10, currentY + 17, 20)
  ctx.textAlign = 'left'

  return canvas
}

export const renderCardPng = (data = {}) => {
  const width = 1200
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = 800
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const accentColor = data.accentColor || '#d6f94c'
  const cardX = 60
  const cardWidth = 1080
  const cardPadding = 48
  const contentWidth = cardWidth - cardPadding * 2

  const category = (data.category || data.niche || 'КЕЙС').toUpperCase()
  const authorName = (data.author && data.author.trim()) ? data.author.trim() : 'Клиент'
  const isDefaultAuthor = authorName.toLowerCase() === 'клиент'
  const authorInitial = !isDefaultAuthor ? authorName.charAt(0).toUpperCase() : null
  const authorRole = [data.authorRole, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow')
    .join(' · ')

  const rows = Array.isArray(data.summaryRows) && data.summaryRows.length > 0
    ? data.summaryRows
    : [
        data.before ? { label: 'БЫЛО', text: data.before } : null,
        data.done ? { label: 'СДЕЛАНО', text: data.done } : null,
        data.after ? { label: 'СТАЛО', text: data.after } : null,
      ].filter(Boolean)

  const headline = data.headline || ''
  const hasMetric = Boolean(data.metric)

  const colCount = Math.max(1, Math.min(3, rows.length))
  const colWidth = Math.floor((contentWidth - (colCount - 1) * 14) / colCount)

  ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const renderedCols = rows.slice(0, 3).map((row, idx) => {
    const isHighlight = idx === rows.length - 1
    ctx.font = isHighlight
      ? '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const lines = measureTextLines(ctx, row.text, colWidth - 36)
    return { label: row.label.toUpperCase(), lines, isHighlight }
  })

  const maxLines = renderedCols.reduce((max, c) => Math.max(max, c.lines.length), 0)
  const colHeight = renderedCols.length > 0 ? Math.max(130, 44 + maxLines * 28 + 14) : 0

  ctx.font = 'italic 500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const quoteLines = data.quote ? measureTextLines(ctx, `«${data.quote}»`, contentWidth) : []
  const quoteHeight = quoteLines.length > 0 ? quoteLines.length * 34 : 0

  const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : []
  const hasTags = tags.length > 0
  const tagsHeight = hasTags ? 36 : 0

  const totalContentHeight =
    28 +
    20 +
    (hasMetric ? 80 + 12 + 32 + 24 : (headline ? 40 + 24 : 0)) +
    (colHeight > 0 ? colHeight : 0) +
    (hasTags ? 18 + tagsHeight : 0) +
    (quoteHeight > 0 ? 22 + quoteHeight + 24 : 0) +
    1 +
    22 +
    52

  const cardHeight = cardPadding * 2 + totalContentHeight
  const canvasHeight = Math.max(760, cardHeight + 80)
  canvas.height = canvasHeight

  const bgGradient = ctx.createLinearGradient(0, 0, width, canvasHeight)
  bgGradient.addColorStop(0, '#0a100d')
  bgGradient.addColorStop(0.5, '#040706')
  bgGradient.addColorStop(1, '#020302')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, canvasHeight)

  const cardY = Math.round((canvasHeight - cardHeight) / 2)

  ctx.fillStyle = '#0d1714'
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  let currentY = cardY + cardPadding

  ctx.fillStyle = '#94a3b8'
  ctx.font = '700 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`КЕЙС · ${category}`, cardX + cardPadding, currentY + 20)

  ctx.fillStyle = '#22c55e'
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('🛡 Проверено по переписке', cardX + cardWidth - cardPadding, currentY + 20)
  ctx.textAlign = 'left'

  currentY += 28 + 20

  if (hasMetric) {
    ctx.fillStyle = accentColor
    ctx.font = '900 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(data.metric, cardX + cardPadding, currentY + 70)

    currentY += 80 + 12

    if (data.metricLabel) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(data.metricLabel, cardX + cardPadding, currentY + 24)
      currentY += 32 + 24
    } else {
      currentY += 24
    }
  } else if (headline) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(headline, cardX + cardPadding, currentY + 30)
    currentY += 40 + 24
  }

  if (colHeight > 0) {
    renderedCols.forEach((col, idx) => {
      const colX = cardX + cardPadding + idx * (colWidth + 14)
      ctx.fillStyle = col.isHighlight ? 'rgba(214, 249, 76, 0.1)' : 'rgba(255, 255, 255, 0.04)'
      drawRoundRect(ctx, colX, currentY, colWidth, colHeight, 16)
      ctx.fill()
      if (col.isHighlight) {
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.fillStyle = col.isHighlight ? accentColor : '#94a3b8'
      ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(col.label, colX + 18, currentY + 30)

      ctx.fillStyle = '#ffffff'
      ctx.font = col.isHighlight
        ? '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

      let textY = currentY + 60
      for (const l of col.lines) {
        ctx.fillText(l, colX + 18, textY)
        textY += 28
      }
    })
    currentY += colHeight
  }

  if (hasTags) {
    currentY += 18
    let tagX = cardX + cardPadding
    for (const tag of tags.slice(0, 4)) {
      ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const tagW = ctx.measureText(tag).width + 24
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      drawRoundRect(ctx, tagX, currentY, tagW, 32, 16)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(tag, tagX + 12, currentY + 22)
      tagX += tagW + 10
    }
    currentY += tagsHeight
  }

  if (quoteHeight > 0) {
    currentY += 22
    ctx.fillStyle = '#f4f4f5'
    ctx.font = 'italic 500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    let qY = currentY + 24
    for (const ql of quoteLines) {
      ctx.fillText(ql, cardX + cardPadding, qY)
      qY += 34
    }
    currentY += quoteHeight + 24
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + cardPadding, currentY)
  ctx.lineTo(cardX + cardWidth - cardPadding, currentY)
  ctx.stroke()

  currentY += 22

  const avatarRadius = 24
  const avatarCenterX = cardX + cardPadding + avatarRadius
  const avatarCenterY = currentY + avatarRadius

  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.stroke()

  if (authorInitial) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(authorInitial, avatarCenterX, avatarCenterY + 7)
    ctx.textAlign = 'left'
  } else {
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(avatarCenterX, avatarCenterY - 4, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(avatarCenterX, avatarCenterY + 16, 12, Math.PI, Math.PI * 2)
    ctx.fill()
  }

  const authorTextX = avatarCenterX + avatarRadius + 14
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(authorName, authorTextX, currentY + 20)

  if (authorRole) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(authorRole, authorTextX, currentY + 42)
  }

  const brandX = cardX + cardWidth - cardPadding
  const wordmarkW = 54
  const wordmarkH = 13
  const wordmarkX = brandX - wordmarkW
  const wordmarkY = currentY + 19

  drawProofFlowWordmark(ctx, wordmarkX, wordmarkY, wordmarkH, '#FFFFFF', '#D4FF3A')

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const labelX = wordmarkX - 4
  ctx.fillText('Powered by', labelX, currentY + 30)

  const labelW = ctx.measureText('Powered by').width
  drawProofFlowIcon(ctx, labelX - labelW - 10, currentY + 15, 18)
  ctx.textAlign = 'left'

  return canvas
}