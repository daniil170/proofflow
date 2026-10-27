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

export const renderStoryPng = (data) => {
  const width = 1080
  const height = 1920
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bgGradient = ctx.createLinearGradient(0, 0, width, height)
  bgGradient.addColorStop(0, '#0d1714')
  bgGradient.addColorStop(1, '#050a08')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  const cardX = 90
  const cardY = 280
  const cardWidth = 900
  const cardHeight = 1320

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 36)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('КЕЙС · ПРОВЕРЕНО ПО ПЕРЕПИСКЕ', cardX + 60, cardY + 90)

  const accentColor = data.accentColor || '#d6f94c'
  ctx.fillStyle = accentColor
  ctx.font = '900 110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metric || '+45%', cardX + 60, cardY + 230)

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metricLabel || 'рост конверсии', cardX + 60, cardY + 290)

  const boxY = cardY + 360
  const boxHeight = 160
  const boxWidth = 780

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.beginPath()
  ctx.roundRect(cardX + 60, boxY, boxWidth, boxHeight, 20)
  ctx.fill()
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('БЫЛО', cardX + 90, boxY + 45)
  ctx.fillStyle = '#ffffff'
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, data.before || '', cardX + 90, boxY + 90, boxWidth - 60, 36)

  const box2Y = boxY + 190
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.beginPath()
  ctx.roundRect(cardX + 60, box2Y, boxWidth, boxHeight, 20)
  ctx.fill()
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('СДЕЛАНО', cardX + 90, box2Y + 45)
  ctx.fillStyle = '#ffffff'
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, data.done || '', cardX + 90, box2Y + 90, boxWidth - 60, 36)

  const box3Y = box2Y + 190
  ctx.fillStyle = 'rgba(212, 255, 58, 0.1)'
  ctx.beginPath()
  ctx.roundRect(cardX + 60, box3Y, boxWidth, boxHeight, 20)
  ctx.fill()
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = accentColor
  ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('СТАЛО', cardX + 90, box3Y + 45)
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, data.after || '', cardX + 90, box3Y + 90, boxWidth - 60, 36)

  const quoteY = box3Y + 220
  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'italic 500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, `«${data.quote || ''}»`, cardX + 60, quoteY, boxWidth, 42)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`— ${data.author || 'Анна К.'}, ${data.company || 'ProofFlow'}`, cardX + 60, cardY + cardHeight - 50)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Powered by ProofFlow', width / 2, height - 120)

  return canvas
}

export const renderCardPng = (data) => {
  const width = 1200
  const height = 800
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = '#090e0c'
  ctx.fillRect(0, 0, width, height)

  const cardX = 80
  const cardY = 60
  const cardWidth = 1040
  const cardHeight = 680

  ctx.fillStyle = '#0d1714'
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('КЕЙС · ПРОВЕРЕНО ПО ПЕРЕПИСКЕ', cardX + 50, cardY + 60)

  const accentColor = data.accentColor || '#d6f94c'
  ctx.fillStyle = accentColor
  ctx.font = '900 84px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metric || '+45%', cardX + 50, cardY + 160)

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(data.metricLabel || 'рост конверсии', cardX + 50, cardY + 205)

  const colWidth = 290
  const colsY = cardY + 260
  const colHeight = 160

  const drawCol = (label, text, x, isHighlight) => {
    ctx.fillStyle = isHighlight ? 'rgba(212, 255, 58, 0.08)' : 'rgba(255, 255, 255, 0.04)'
    ctx.beginPath()
    ctx.roundRect(x, colsY, colWidth, colHeight, 16)
    ctx.fill()
    if (isHighlight) {
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    ctx.fillStyle = isHighlight ? accentColor : '#a1a1aa'
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(label, x + 24, colsY + 36)

    ctx.fillStyle = '#ffffff'
    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    wrapText(ctx, text, x + 24, colsY + 70, colWidth - 48, 28)
  }

  drawCol('БЫЛО', data.before || '', cardX + 50, false)
  drawCol('СДЕЛАНО', data.done || '', cardX + 370, false)
  drawCol('СТАЛО', data.after || '', cardX + 690, true)

  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'italic 500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  wrapText(ctx, `«${data.quote || ''}»`, cardX + 50, cardY + 480, 940, 32)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`— ${data.author || 'Анна К.'}, ${data.company || 'ProofFlow'}`, cardX + 50, cardY + cardHeight - 40)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('Powered by ProofFlow', cardX + cardWidth - 50, cardY + cardHeight - 40)

  return canvas
}

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}
