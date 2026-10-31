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

const drawShieldIcon = (ctx, x, y, size, color = '#157347') => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, size * 0.1)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(x + size * 0.5, y + size * 0.95)
  ctx.lineTo(x + size * 0.85, y + size * 0.75)
  ctx.lineTo(x + size * 0.85, y + size * 0.25)
  ctx.lineTo(x + size * 0.5, y + size * 0.1)
  ctx.lineTo(x + size * 0.15, y + size * 0.25)
  ctx.lineTo(x + size * 0.15, y + size * 0.75)
  ctx.closePath()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x + size * 0.35, y + size * 0.5)
  ctx.lineTo(x + size * 0.47, y + size * 0.65)
  ctx.lineTo(x + size * 0.7, y + size * 0.38)
  ctx.stroke()

  ctx.restore()
}

const drawCheckIcon = (ctx, x, y, size, color = '#ffffff') => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, size * 0.15)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(x + size * 0.2, y + size * 0.52)
  ctx.lineTo(x + size * 0.44, y + size * 0.76)
  ctx.lineTo(x + size * 0.82, y + size * 0.26)
  ctx.stroke()
  ctx.restore()
}

const drawAvatar = (ctx, centerX, centerY, radius, initial, bgColor = '#101c16', textColor = '#ffffff') => {
  ctx.save()
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  if (initial) {
    ctx.fillStyle = textColor
    ctx.font = `700 ${Math.round(radius * 0.9)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(initial, centerX, centerY + Math.round(radius * 0.33))
    ctx.textAlign = 'left'
  } else {
    ctx.fillStyle = textColor
    ctx.beginPath()
    ctx.arc(centerX, centerY - radius * 0.2, radius * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX, centerY + radius * 0.7, radius * 0.5, Math.PI, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

const measureTextLines = (ctx, text, maxWidth) => {
  if (!text) return []
  const paragraphs = String(text).split('\n')
  const lines = []
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean)
    if (words.length === 0) continue
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
  }
  return lines
}

const extractMessages = (data) => {
  const rawMessages =
    Array.isArray(data.cardMessages) && data.cardMessages.length > 0
      ? data.cardMessages
      : Array.isArray(data.chatMessages)
      ? data.chatMessages
      : []

  return rawMessages.slice(0, 3).map((m, idx) => {
    if (typeof m === 'string') {
      return { text: m, side: idx % 2 === 0 ? 'client' : 'me' }
    }
    return { text: m.text, side: m.side || 'client', time: m.time }
  })
}

const renderWhatsAppLayout = (data, isStory = false) => {
  const width = isStory ? 1080 : 1200
  const defaultHeight = isStory ? 1920 : 800
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = defaultHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const cardPadding = isStory ? 40 : 44
  const cardX = isStory ? 60 : 40
  const cardWidth = isStory ? 960 : 1120
  const contentWidth = cardWidth - cardPadding * 2

  const authorName = data.author && data.author.trim() ? data.author.trim() : 'Клиент'
  const isDefaultAuthor = authorName.toLowerCase() === 'клиент'
  const authorInitial = !isDefaultAuthor ? authorName.charAt(0).toUpperCase() : null
  const authorRole = [data.authorRole, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow' && !v.toLowerCase().includes('кондитерск'))
    .join(' · ')

  const headline =
    data.headline ||
    (data.title && !data.title.toLowerCase().startsWith('кейс для') ? data.title : '')
  const accentColor = data.accentColor || '#ffd13b'

  const rows =
    Array.isArray(data.summaryRows) && data.summaryRows.length > 0
      ? data.summaryRows
      : [
          data.before ? { label: 'Задача', text: data.before } : null,
          data.done ? { label: 'Сделано', text: data.done } : null,
          data.after ? { label: 'Результат', text: data.after } : null,
        ].filter(Boolean)

  const messages = extractMessages(data)
  const messenger = data.messenger || 'unknown'
  const transcriptTitle =
    messenger === 'telegram'
      ? 'ОРИГИНАЛ · ПЕРЕПИСКА В TELEGRAM'
      : messenger === 'whatsapp'
      ? 'ОРИГИНАЛ · ПЕРЕПИСКА В WHATSAPP'
      : 'ОРИГИНАЛ · ПЕРЕПИСКА'

  let headlineLines = []
  let headlineBoxH = 0
  let headlineBoxW = 0
  if (headline) {
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    headlineLines = measureTextLines(ctx, headline, contentWidth - 44)
    let maxW = 0
    for (const l of headlineLines) {
      maxW = Math.max(maxW, ctx.measureText(l).width)
    }
    headlineBoxW = Math.min(contentWidth, maxW + 40)
    headlineBoxH = 20 + headlineLines.length * 44
  }

  const renderedRows = []
  for (const row of rows) {
    ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const tagW = Math.max(90, ctx.measureText(row.label).width + 16)
    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textLines = measureTextLines(ctx, row.text, contentWidth - tagW - 48)
    const rowH = Math.max(52, 20 + textLines.length * 28)
    renderedRows.push({ label: row.label, textLines, tagW, rowH })
  }

  const renderedBubbles = []
  let chatBoxH = 0
  if (messages.length > 0) {
    const bubbleMaxW = Math.round(contentWidth * 0.88)
    for (const msg of messages) {
      const isOutgoing = msg.side === 'me'
      ctx.font = isOutgoing
        ? '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '500 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const lines = measureTextLines(ctx, msg.text, bubbleMaxW - 36)
      let maxLineW = 0
      for (const l of lines) {
        maxLineW = Math.max(maxLineW, ctx.measureText(l).width)
      }
      const bubbleW = Math.min(bubbleMaxW, Math.max(140, maxLineW + 36))
      const bubbleH = 22 + lines.length * 26
      renderedBubbles.push({ lines, isOutgoing, bubbleW, bubbleH })
    }
    const bubblesSum = renderedBubbles.reduce((acc, b) => acc + b.bubbleH + 12, 0)
    chatBoxH = 32 + bubblesSum
  }

  let quoteLines = []
  let quoteH = 0
  if (!messages.length && data.quote) {
    ctx.font = 'italic 500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    quoteLines = measureTextLines(ctx, `«${data.quote}»`, contentWidth - 44)
    quoteH = 28 + quoteLines.length * 32
  }

  const badgeH = 34
  const rowsSumH = renderedRows.reduce((acc, r) => acc + r.rowH + 10, 0)
  const chatHeaderH = messages.length > 0 ? 24 : 0
  const dividerH = 2
  const footerH = 54

  const totalContentH =
    badgeH +
    18 +
    (headlineBoxH > 0 ? headlineBoxH + 18 : 0) +
    (rowsSumH > 0 ? rowsSumH + 12 : 0) +
    (chatHeaderH > 0 ? chatHeaderH + 10 : 0) +
    (chatBoxH > 0 ? chatBoxH + 18 : 0) +
    (quoteH > 0 ? quoteH + 18 : 0) +
    dividerH +
    18 +
    footerH

  const cardHeight = cardPadding * 2 + totalContentH

  const canvasHeight = isStory ? 1920 : Math.max(760, cardHeight + 80)
  canvas.height = canvasHeight

  if (isStory) {
    const bgGradient = ctx.createLinearGradient(0, 0, width, canvasHeight)
    bgGradient.addColorStop(0, '#0c1611')
    bgGradient.addColorStop(0.5, '#060a08')
    bgGradient.addColorStop(1, '#020403')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, canvasHeight)
  } else {
    ctx.fillStyle = '#e8efe6'
    ctx.fillRect(0, 0, width, canvasHeight)
  }

  const cardY = isStory ? Math.round((canvasHeight - cardHeight) / 2) : Math.round((canvasHeight - cardHeight) / 2)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 12
  ctx.fillStyle = '#f4f7f2'
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 28)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#dce4d8'
  ctx.lineWidth = 1.5
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 28)
  ctx.stroke()

  let currentY = cardY + cardPadding

  const badgeW = 160
  ctx.fillStyle = '#157347'
  drawRoundRect(ctx, cardX + cardPadding, currentY, badgeW, badgeH, 17)
  ctx.fill()

  drawCheckIcon(ctx, cardX + cardPadding + 14, currentY + 9, 16, '#ffffff')
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Отзыв клиента', cardX + cardPadding + 38, currentY + 22)

  currentY += badgeH + 18

  if (headlineBoxH > 0) {
    ctx.fillStyle = accentColor
    drawRoundRect(ctx, cardX + cardPadding, currentY, headlineBoxW, headlineBoxH, 8)
    ctx.fill()

    ctx.fillStyle = '#0e1411'
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    let hY = currentY + 36
    for (const l of headlineLines) {
      ctx.fillText(l, cardX + cardPadding + 20, hY)
      hY += 44
    }

    currentY += headlineBoxH + 18
  }

  for (const r of renderedRows) {
    ctx.fillStyle = '#e5ede2'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, r.rowH, 14)
    ctx.fill()

    ctx.fillStyle = '#157347'
    ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(r.label, cardX + cardPadding + 18, currentY + 31)

    ctx.fillStyle = '#1f2d25'
    ctx.font = '500 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textStartX = cardX + cardPadding + 18 + r.tagW
    let tY = currentY + 31
    for (const l of r.textLines) {
      ctx.fillText(l, textStartX, tY)
      tY += 28
    }

    currentY += r.rowH + 10
  }

  if (renderedRows.length > 0) {
    currentY += 2
  }

  if (messages.length > 0) {
    ctx.fillStyle = '#63776b'
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(transcriptTitle, cardX + cardPadding, currentY + 16)
    currentY += chatHeaderH + 10

    ctx.fillStyle = '#ffffff'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, chatBoxH, 18)
    ctx.fill()
    ctx.strokeStyle = '#e1e8dd'
    ctx.lineWidth = 1.5
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, chatBoxH, 18)
    ctx.stroke()

    let bubbleY = currentY + 16
    for (const b of renderedBubbles) {
      const bubbleX = b.isOutgoing
        ? cardX + cardPadding + contentWidth - 16 - b.bubbleW
        : cardX + cardPadding + 16

      ctx.fillStyle = b.isOutgoing ? '#dcf8c6' : '#edf1ea'
      drawRoundRect(ctx, bubbleX, bubbleY, b.bubbleW, b.bubbleH, 14)
      ctx.fill()

      if (b.isOutgoing) {
        ctx.strokeStyle = '#c7e8b0'
        ctx.lineWidth = 1
        drawRoundRect(ctx, bubbleX, bubbleY, b.bubbleW, b.bubbleH, 14)
        ctx.stroke()
      }

      ctx.fillStyle = b.isOutgoing ? '#0d1e13' : '#1a221e'
      ctx.font = b.isOutgoing
        ? '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

      let lineY = bubbleY + 23
      for (const l of b.lines) {
        ctx.fillText(l, bubbleX + 16, lineY)
        lineY += 26
      }

      bubbleY += b.bubbleH + 12
    }

    currentY += chatBoxH + 18
  } else if (quoteH > 0) {
    ctx.fillStyle = '#ffffff'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, quoteH, 12)
    ctx.fill()

    ctx.fillStyle = '#157347'
    ctx.fillRect(cardX + cardPadding, currentY, 5, quoteH)

    ctx.fillStyle = '#1a221e'
    ctx.font = 'italic 500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    let qY = currentY + 26
    for (const l of quoteLines) {
      ctx.fillText(l, cardX + cardPadding + 20, qY)
      qY += 32
    }
    currentY += quoteH + 18
  }

  ctx.strokeStyle = '#dce4d8'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + cardPadding, currentY)
  ctx.lineTo(cardX + cardWidth - cardPadding, currentY)
  ctx.stroke()

  currentY += 18

  const avatarRadius = 24
  const avatarCenterX = cardX + cardPadding + avatarRadius
  const avatarCenterY = currentY + avatarRadius

  drawAvatar(ctx, avatarCenterX, avatarCenterY, avatarRadius, authorInitial, '#101c16', '#ffffff')

  const authorTextX = avatarCenterX + avatarRadius + 14
  ctx.fillStyle = '#101c16'
  ctx.font = '800 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(authorName, authorTextX, currentY + 22)

  if (authorRole) {
    ctx.fillStyle = '#5d7065'
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(authorRole, authorTextX, currentY + 44)
  }

  const badgeShieldX = cardX + cardPadding + Math.round(contentWidth * 0.44)
  drawShieldIcon(ctx, badgeShieldX, currentY + 12, 22, '#157347')
  ctx.fillStyle = '#157347'
  ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Проверено по переписке', badgeShieldX + 28, currentY + 28)

  const brandX = cardX + cardWidth - cardPadding
  const wordmarkW = 54
  const wordmarkH = 13
  const wordmarkX = brandX - wordmarkW
  const wordmarkY = currentY + 18

  drawProofFlowWordmark(ctx, wordmarkX, wordmarkY, wordmarkH, '#101c16', '#157347')

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(16, 28, 22, 0.75)'
  ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const labelX = wordmarkX - 4
  ctx.fillText('Powered by', labelX, currentY + 28)

  const labelW = ctx.measureText('Powered by').width
  drawProofFlowIcon(ctx, labelX - labelW - 10, currentY + 14, 18)
  ctx.textAlign = 'left'

  return canvas
}

const renderDarkLayout = (data, isStory = false) => {
  const width = isStory ? 1080 : 1200
  const defaultHeight = isStory ? 1920 : 800
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = defaultHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const cardPadding = isStory ? 44 : 48
  const cardX = isStory ? 60 : 40
  const cardWidth = isStory ? 960 : 1120
  const contentWidth = cardWidth - cardPadding * 2

  const accentColor = data.accentColor || '#d6f94c'
  const category = (data.category || data.niche || 'КЕЙС').toUpperCase()
  const authorName = data.author && data.author.trim() ? data.author.trim() : 'Клиент'
  const isDefaultAuthor = authorName.toLowerCase() === 'клиент'
  const authorInitial = !isDefaultAuthor ? authorName.charAt(0).toUpperCase() : null
  const authorRole = [data.authorRole, data.company || data.authorCompany]
    .filter(Boolean)
    .filter((v) => v !== 'Клиент' && v !== 'ProofFlow')
    .join(' · ')

  const rows =
    Array.isArray(data.summaryRows) && data.summaryRows.length > 0
      ? data.summaryRows
      : [
          data.before ? { label: 'было', text: data.before } : null,
          data.done ? { label: 'сделано', text: data.done } : null,
          data.after ? { label: 'стало', text: data.after } : null,
        ].filter(Boolean)

  const headline = data.headline || ''
  const hasMetric = Boolean(data.metric)
  const messages = extractMessages(data)

  const renderedRows = []
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx]
    const isHighlight = idx === rows.length - 1
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const tagW = Math.max(90, ctx.measureText(row.label.toLowerCase()).width + 16)
    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textLines = measureTextLines(ctx, row.text, contentWidth - tagW - 48)
    const rowH = Math.max(54, 22 + textLines.length * 28)
    renderedRows.push({ label: row.label.toLowerCase(), textLines, tagW, rowH, isHighlight })
  }

  const renderedBubbles = []
  let chatBoxH = 0
  if (messages.length > 0) {
    const bubbleMaxW = Math.round(contentWidth * 0.88)
    for (const msg of messages) {
      const isOutgoing = msg.side === 'me'
      ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const lines = measureTextLines(ctx, msg.text, bubbleMaxW - 36)
      let maxLineW = 0
      for (const l of lines) {
        maxLineW = Math.max(maxLineW, ctx.measureText(l).width)
      }
      const bubbleW = Math.min(bubbleMaxW, Math.max(140, maxLineW + 36))
      const bubbleH = 22 + lines.length * 26
      renderedBubbles.push({ lines, isOutgoing, bubbleW, bubbleH })
    }
    const bubblesSum = renderedBubbles.reduce((acc, b) => acc + b.bubbleH + 12, 0)
    chatBoxH = 32 + bubblesSum
  }

  ctx.font = 'italic 500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const quoteLines = !messages.length && data.quote ? measureTextLines(ctx, `«${data.quote}»`, contentWidth) : []
  const quoteHeight = quoteLines.length > 0 ? quoteLines.length * 34 : 0

  const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : []
  const hasTags = tags.length > 0
  const tagsHeight = hasTags ? 36 : 0

  const rowsSumH = renderedRows.reduce((acc, r) => acc + r.rowH + 10, 0)

  const totalContentHeight =
    28 +
    20 +
    (hasMetric ? 80 + 12 + 32 + 24 : headline ? 40 + 24 : 0) +
    (rowsSumH > 0 ? rowsSumH + 14 : 0) +
    (chatBoxH > 0 ? 24 + chatBoxH + 18 : 0) +
    (hasTags ? 18 + tagsHeight : 0) +
    (quoteHeight > 0 ? 22 + quoteHeight + 24 : 0) +
    1 +
    22 +
    52

  const cardHeight = cardPadding * 2 + totalContentHeight
  const canvasHeight = isStory ? 1920 : Math.max(760, cardHeight + 80)
  canvas.height = canvasHeight

  const bgGradient = ctx.createLinearGradient(0, 0, width, canvasHeight)
  bgGradient.addColorStop(0, '#0a100d')
  bgGradient.addColorStop(0.5, '#040706')
  bgGradient.addColorStop(1, '#020302')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, canvasHeight)

  const cardY = isStory ? Math.round((canvasHeight - cardHeight) / 2) : Math.round((canvasHeight - cardHeight) / 2)

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
    ctx.font = '800 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(headline, cardX + cardPadding, currentY + 30)
    currentY += 40 + 24
  }

  for (const r of renderedRows) {
    ctx.fillStyle = r.isHighlight ? 'rgba(214, 249, 76, 0.1)' : 'rgba(255, 255, 255, 0.04)'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, r.rowH, 14)
    ctx.fill()

    if (r.isHighlight) {
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 1.5
      drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, r.rowH, 14)
      ctx.stroke()
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.lineWidth = 1
      drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, r.rowH, 14)
      ctx.stroke()
    }

    ctx.fillStyle = r.isHighlight ? accentColor : '#94a3b8'
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(r.label, cardX + cardPadding + 18, currentY + 32)

    ctx.fillStyle = '#ffffff'
    ctx.font = r.isHighlight
      ? '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '500 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textStartX = cardX + cardPadding + 18 + r.tagW
    let tY = currentY + 32
    for (const l of r.textLines) {
      ctx.fillText(l, textStartX, tY)
      tY += 28
    }

    currentY += r.rowH + 10
  }

  if (renderedRows.length > 0) {
    currentY += 4
  }

  if (messages.length > 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const messengerTitle =
      data.messenger === 'telegram'
        ? 'ОРИГИНАЛ · ПЕРЕПИСКА В TELEGRAM'
        : data.messenger === 'whatsapp'
        ? 'ОРИГИНАЛ · ПЕРЕПИСКА В WHATSAPP'
        : 'ОРИГИНАЛ · ПЕРЕПИСКА'
    ctx.fillText(messengerTitle, cardX + cardPadding, currentY + 16)
    currentY += 24 + 10

    ctx.fillStyle = '#0a100d'
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, chatBoxH, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    drawRoundRect(ctx, cardX + cardPadding, currentY, contentWidth, chatBoxH, 16)
    ctx.stroke()

    let bubbleY = currentY + 16
    for (const b of renderedBubbles) {
      const bubbleX = b.isOutgoing
        ? cardX + cardPadding + contentWidth - 16 - b.bubbleW
        : cardX + cardPadding + 16

      ctx.fillStyle = b.isOutgoing ? '#182b20' : '#141d18'
      drawRoundRect(ctx, bubbleX, bubbleY, b.bubbleW, b.bubbleH, 12)
      ctx.fill()

      if (b.isOutgoing) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)'
        ctx.lineWidth = 1
        drawRoundRect(ctx, bubbleX, bubbleY, b.bubbleW, b.bubbleH, 12)
        ctx.stroke()
      }

      ctx.fillStyle = '#f1f5f9'
      ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

      let lineY = bubbleY + 22
      for (const l of b.lines) {
        ctx.fillText(l, bubbleX + 16, lineY)
        lineY += 26
      }

      bubbleY += b.bubbleH + 12
    }

    currentY += chatBoxH + 18
  }

  if (hasTags) {
    currentY += 12
    let tagX = cardX + cardPadding
    for (const tag of tags.slice(0, 4)) {
      ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const tagW = ctx.measureText(tag).width + 22
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      drawRoundRect(ctx, tagX, currentY, tagW, 30, 15)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      drawRoundRect(ctx, tagX, currentY, tagW, 30, 15)
      ctx.stroke()
      ctx.fillStyle = '#cbd5e1'
      ctx.fillText(tag, tagX + 11, currentY + 21)
      tagX += tagW + 10
    }
    currentY += tagsHeight
  }

  if (quoteHeight > 0) {
    currentY += 18
    ctx.fillStyle = '#f4f4f5'
    ctx.font = 'italic 500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    let qY = currentY + 24
    for (const ql of quoteLines) {
      ctx.fillText(ql, cardX + cardPadding, qY)
      qY += 34
    }
    currentY += quoteHeight + 20
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardX + cardPadding, currentY)
  ctx.lineTo(cardX + cardWidth - cardPadding, currentY)
  ctx.stroke()

  currentY += 20

  const avatarRadius = 24
  const avatarCenterX = cardX + cardPadding + avatarRadius
  const avatarCenterY = currentY + avatarRadius

  drawAvatar(ctx, avatarCenterX, avatarCenterY, avatarRadius, authorInitial, '#1e293b', '#ffffff')

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

export const renderCardPng = (data = {}) => {
  const variant = data.variant || 'dark'
  if (variant === 'whatsapp') {
    return renderWhatsAppLayout(data, false)
  }
  return renderDarkLayout(data, false)
}

export const renderStoryPng = (data = {}) => {
  const variant = data.variant || 'dark'
  if (variant === 'whatsapp') {
    return renderWhatsAppLayout(data, true)
  }
  return renderDarkLayout(data, true)
}
