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

  // Twin arches (white)
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

  // Connector bar (lime)
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

export const renderStoryPng = (data) => {
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
  const authorInitial = data.author ? data.author.charAt(0).toUpperCase() : 'К'
  const authorRole = data.authorRole || 'Клиент'

  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const beforeLines = measureTextLines(ctx, data.before || '', contentWidth - 44)
  const doneLines = measureTextLines(ctx, data.done || '', contentWidth - 44)
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const afterLines = measureTextLines(ctx, data.after || '', contentWidth - 44)

  const lineH = 34
  const box1Height = Math.max(104, 48 + beforeLines.length * lineH + 14)
  const box2Height = Math.max(104, 48 + doneLines.length * lineH + 14)
  const box3Height = Math.max(104, 48 + afterLines.length * lineH + 14)

  ctx.font = 'italic 500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const quoteLines = measureTextLines(ctx, `«${data.quote || ''}»`, contentWidth)
  const quoteHeight = quoteLines.length * 40

  const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : []
  const hasTags = tags.length > 0
  const tagsHeight = hasTags ? 40 : 0

  const totalContentHeight =
    32 +
    24 +
    96 +
    14 +
    36 +
    28 +
    box1Height +
    14 +
    box2Height +
    14 +
    box3Height +
    (hasTags ? 20 + tagsHeight : 0) +
    24 +
    quoteHeight +
    28 +
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

  ctx.fillStyle = accentColor
  ctx.font = '900 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metric || '+45%', cardX + cardPadding, currentY + 84)

  currentY += 96 + 14

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metricLabel || 'рост ключевых показателей', cardX + cardPadding, currentY + 28)

  currentY += 36 + 28

  const drawBox = (label, lines, isHighlight, heightVal) => {
    ctx.fillStyle = isHighlight ? 'rgba(214, 249, 76, 0.1)' : 'rgba(255, 255, 255, 0.04)'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, heightVal, 18)
    ctx.fill()
    if (isHighlight) {
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.fillStyle = isHighlight ? accentColor : '#94a3b8'
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(label, cardX + cardPadding + 24, currentY + 34)

    ctx.fillStyle = '#ffffff'
    ctx.font = isHighlight
      ? '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    let textY = currentY + 68
    for (const l of lines) {
      ctx.fillText(l, cardX + cardPadding + 24, textY)
      textY += lineH
    }
    currentY += heightVal + 14
  }

  drawBox('БЫЛО', beforeLines, false, box1Height)
  drawBox('СДЕЛАНО', doneLines, false, box2Height)
  drawBox('СТАЛО', afterLines, true, box3Height)

  currentY -= 14

  if (hasTags) {
    currentY += 20
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
    currentY += tagsHeight
  }

  currentY += 24

  ctx.fillStyle = '#f4f4f5'
  ctx.font = 'italic 500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  let qY = currentY + 28
  for (const ql of quoteLines) {
    ctx.fillText(ql, cardX + cardPadding, qY)
    qY += 40
  }

  currentY += quoteHeight + 28

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

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(authorInitial, avatarCenterX, avatarCenterY + 8)
  ctx.textAlign = 'left'

  const authorTextX = avatarCenterX + avatarRadius + 16
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.author || 'Клиент', authorTextX, currentY + 22)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(authorRole, authorTextX, currentY + 46)

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

export const renderCardPng = (data) => {
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
  const authorInitial = data.author ? data.author.charAt(0).toUpperCase() : 'К'
  const authorRole = data.authorRole || 'Клиент'

  const colWidth = Math.floor((contentWidth - 28) / 3)
  ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const beforeLines = measureTextLines(ctx, data.before || '', colWidth - 36)
  const doneLines = measureTextLines(ctx, data.done || '', colWidth - 36)
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const afterLines = measureTextLines(ctx, data.after || '', colWidth - 36)

  const maxLines = Math.max(beforeLines.length, doneLines.length, afterLines.length)
  const colHeight = Math.max(130, 44 + maxLines * 28 + 14)

  ctx.font = 'italic 500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const quoteLines = measureTextLines(ctx, `«${data.quote || ''}»`, contentWidth)
  const quoteHeight = quoteLines.length * 34

  const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : []
  const hasTags = tags.length > 0
  const tagsHeight = hasTags ? 36 : 0

  const totalContentHeight =
    28 +
    20 +
    80 +
    12 +
    32 +
    24 +
    colHeight +
    (hasTags ? 18 + tagsHeight : 0) +
    22 +
    quoteHeight +
    24 +
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

  ctx.fillStyle = accentColor
  ctx.font = '900 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metric || '+45%', cardX + cardPadding, currentY + 70)

  currentY += 80 + 12

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metricLabel || 'рост ключевых показателей', cardX + cardPadding, currentY + 24)

  currentY += 32 + 24

  const drawCol = (label, lines, isHighlight, colX) => {
    ctx.fillStyle = isHighlight ? 'rgba(214, 249, 76, 0.1)' : 'rgba(255, 255, 255, 0.04)'
    drawRoundRect(ctx, colX, currentY, colWidth, colHeight, 16)
    ctx.fill()
    if (isHighlight) {
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.fillStyle = isHighlight ? accentColor : '#94a3b8'
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(label, colX + 18, currentY + 30)

    ctx.fillStyle = '#ffffff'
    ctx.font = isHighlight
      ? '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    let textY = currentY + 60
    for (const l of lines) {
      ctx.fillText(l, colX + 18, textY)
      textY += 28
    }
  }

  const col1X = cardX + cardPadding
  const col2X = col1X + colWidth + 14
  const col3X = col2X + colWidth + 14

  drawCol('БЫЛО', beforeLines, false, col1X)
  drawCol('СДЕЛАНО', doneLines, false, col2X)
  drawCol('СТАЛО', afterLines, true, col3X)

  currentY += colHeight

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

  currentY += 22

  ctx.fillStyle = '#f4f4f5'
  ctx.font = 'italic 500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  let qY = currentY + 24
  for (const ql of quoteLines) {
    ctx.fillText(ql, cardX + cardPadding, qY)
    qY += 34
  }

  currentY += quoteHeight + 24

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

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(authorInitial, avatarCenterX, avatarCenterY + 7)
  ctx.textAlign = 'left'

  const authorTextX = avatarCenterX + avatarRadius + 14
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.author || 'Клиент', authorTextX, currentY + 20)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(authorRole, authorTextX, currentY + 42)

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
