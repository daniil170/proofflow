import admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'

if (!admin.apps.length) {
  admin.initializeApp()
}

const clientRequestTimestamps = new Map<string, number[]>()

const isPublicRateLimited = (clientIp: string): boolean => {
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxRequests = 60
  const timestamps = (clientRequestTimestamps.get(clientIp) || []).filter(
    (t) => now - t < windowMs
  )
  if (timestamps.length >= maxRequests) {
    return true
  }
  timestamps.push(now)
  clientRequestTimestamps.set(clientIp, timestamps)
  return false
}

export const extractCaseId = (req: {
  query?: Record<string, unknown>
  path?: string
}): string => {
  if (req.query && typeof req.query.id === 'string' && req.query.id.trim()) {
    return req.query.id.trim()
  }
  const path = req.path || ''
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1) {
    return segments[0]
  }
  if (segments.length >= 2 && (segments[0] === 'c' || segments[0] === 'case')) {
    return segments[1]
  }
  return segments[segments.length - 1] || ''
}

export const getPublicCase = onRequest(
  {
    cors: true,
    timeoutSeconds: 15,
  },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Метод не поддерживается' })
      return
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown'
    if (isPublicRateLimited(clientIp)) {
      res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже' })
      return
    }

    const caseId = extractCaseId(req)
    if (!caseId) {
      res.status(400).json({ error: 'Идентификатор кейса не указан' })
      return
    }

    const db = admin.firestore()
    const snap = await db.collection('publicCases').doc(caseId).get()

    if (!snap.exists) {
      res.set('Cache-Control', 'public, max-age=10')
      res.status(404).json({ error: 'Кейс не найден или не опубликован' })
      return
    }

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300')
    res.status(200).json(snap.data())
  }
)

export const ogPage = onRequest(
  {
    cors: true,
    timeoutSeconds: 15,
  },
  async (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed')
      return
    }

    const caseId = extractCaseId(req)
    if (!caseId) {
      res.status(404).send('<!DOCTYPE html><html><head><title>Кейс не найден</title></head><body><h1>Кейс не найден</h1></body></html>')
      return
    }

    const db = admin.firestore()
    const snap = await db.collection('publicCases').doc(caseId).get()

    if (!snap.exists) {
      res.set('Cache-Control', 'public, max-age=10')
      res.status(404).send('<!DOCTYPE html><html><head><title>Кейс не найден или не опубликован — ProofFlow</title></head><body><h1>Кейс не найден или не опубликован</h1><p><a href="/">На главную</a></p></body></html>')
      return
    }

    const data = snap.data()!
    const title = `${data.metric || ''} ${data.metricLabel || ''} — Кейс ${data.companyName || 'ProofFlow'}`.trim()
    const description = `${data.problem || ''} ${data.solution || ''} ${data.result || ''}`.trim() || 'Кейс, подтверждённый перепиской с клиентом в ProofFlow'
    const imageUrl = data.ogImageUrl || 'https://proofflow.ru/og-default.png'
    const pageUrl = `https://proofflow.ru/c/${caseId}`

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300')
    res.status(200).send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta http-equiv="refresh" content="0;url=/c/${caseId}" />
  <script>
    window.location.replace('/c/' + ${JSON.stringify(caseId)})
  </script>
</head>
<body>
  <p>Загрузка кейса... Если перенаправление не произошло, <a href="/c/${caseId}">нажмите здесь</a>.</p>
</body>
</html>`)
  }
)

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
