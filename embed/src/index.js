const STYLES = `
:host {
  display: block;
  width: 100%;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color-scheme: light dark;
}

.pf-card {
  width: 100%;
  box-sizing: border-box;
  background-color: #0d1714;
  color: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  line-height: 1.4;
}

.pf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
}

.pf-category {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.55);
}

.pf-verified {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: var(--pf-accent, #d6f94c);
}

.pf-metric-block {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.pf-metric-val {
  font-size: clamp(38px, 6vw, 56px);
  font-weight: 900;
  color: var(--pf-accent, #d6f94c);
  line-height: 1;
}

.pf-metric-lbl {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.pf-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 580px) {
  .pf-stats-grid {
    grid-template-columns: 1fr;
  }
}

.pf-stat-box {
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pf-stat-box-highlight {
  background-color: rgba(214, 249, 76, 0.08);
  border: 1px solid var(--pf-accent, #d6f94c);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pf-stat-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #a1a1aa;
}

.pf-stat-lbl-hi {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--pf-accent, #d6f94c);
}

.pf-stat-txt {
  font-size: 13px;
  color: #ffffff;
}

.pf-quote {
  margin: 0;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid var(--pf-accent, #d6f94c);
  border-radius: 4px;
  font-style: italic;
  font-size: 14px;
  color: #e4e4e7;
}

.pf-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
}

.pf-author {
  color: #ffffff;
  font-weight: 600;
}

.pf-company {
  color: #a1a1aa;
}

.pf-watermark {
  color: #a1a1aa;
  text-decoration: none;
  font-weight: 500;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pf-watermark svg {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.pf-watermark strong {
  color: #ffffff;
}
`

const renderCardIntoShadow = (shadow, data) => {
  const accent = data.branding?.accentColor || '#d6f94c'
  shadow.innerHTML = `
    <style>
      ${STYLES}
      :host {
        --pf-accent: ${accent};
      }
    </style>
    <div class="pf-card">
      <div class="pf-header">
        <span class="pf-category">КЕЙС · ПРОВЕРЕНО ПО ПЕРЕПИСКЕ</span>
        <span class="pf-verified">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Проверено
        </span>
      </div>

      <div class="pf-metric-block">
        <span class="pf-metric-val">${escapeHtml(data.metric || '')}</span>
        <span class="pf-metric-lbl">${escapeHtml(data.metricLabel || '')}</span>
      </div>

      <div class="pf-stats-grid">
        <div class="pf-stat-box">
          <span class="pf-stat-lbl">было</span>
          <span class="pf-stat-txt">${escapeHtml(data.problem || '')}</span>
        </div>
        <div class="pf-stat-box">
          <span class="pf-stat-lbl">сделано</span>
          <span class="pf-stat-txt">${escapeHtml(data.solution || '')}</span>
        </div>
        <div class="pf-stat-box-highlight">
          <span class="pf-stat-lbl-hi">стало</span>
          <span class="pf-stat-txt">${escapeHtml(data.result || '')}</span>
        </div>
      </div>

      <blockquote class="pf-quote">
        «${escapeHtml(data.quote || '')}»
      </blockquote>

      <div class="pf-footer">
        <div>
          <span class="pf-author">${escapeHtml(data.author || 'Анна К.')}</span>
          <span class="pf-company">, ${escapeHtml(data.companyName || 'ProofFlow')}</span>
        </div>
        <a href="https://proofflow.ru" target="_blank" rel="noopener" class="pf-watermark">
          <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="100" height="100" rx="23" fill="#0B0B0C"/>
            <g transform="translate(50 50) scale(0.62) translate(-50 -50)">
              <g fill="none" stroke-width="12" stroke-linecap="round">
                <path d="M35 84V30A14 14 0 0 1 49 16M59 84V30A14 14 0 0 1 73 16" stroke="#FFFFFF"/>
                <path d="M21 44H79" stroke="#D4FF3A"/>
              </g>
            </g>
          </svg>
          <span>Powered by</span>
          <svg width="50" height="12" viewBox="0 0 330 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ProofFlow">
            <g stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 75.5V24.5M51.5 55.5V24.5M51.5 40A15.5 15.5 0 0 1 67 24.5M172.5 55.5V16A11.5 11.5 0 0 1 184 4.5M196.5 55.5V16A11.5 11.5 0 0 1 208 4.5M223 4.5V55.5M284 24.5L294 55.5L304 30L314 55.5L324 24.5"/>
              <circle cx="20" cy="40" r="15.5"/>
              <circle cx="96" cy="40" r="15.5"/>
              <circle cx="142" cy="40" r="15.5"/>
              <circle cx="253.5" cy="40" r="15.5"/>
            </g>
            <path d="M165 24.5H209" stroke="#D4FF3A" stroke-width="9" stroke-linecap="round"/>
          </svg>
        </a>
      </div>
    </div>
  `
}

const escapeHtml = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const initProofFlowWidgets = () => {
  const scriptTag = document.currentScript
  const origin = scriptTag?.src ? new URL(scriptTag.src).origin : 'https://proofflow.ru'

  const targets = Array.from(document.querySelectorAll('[data-proofflow-case]'))

  targets.forEach(async (el) => {
    if (el._pfMounted) return
    el._pfMounted = true

    const caseId = el.getAttribute('data-proofflow-case')
    if (!caseId) return

    const shadow = el.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>${STYLES}</style><div class="pf-card" style="opacity: 0.6; min-height: 180px; justify-content: center; align-items: center;">Загрузка кейса...</div>`

    try {
      const response = await fetch(`${origin}/getPublicCase?id=${encodeURIComponent(caseId)}`)
      if (!response.ok) {
        shadow.innerHTML = `<style>${STYLES}</style><div class="pf-card" style="opacity: 0.7; font-size: 13px;">Кейс недоступен или снят с публикации.</div>`
        return
      }
      const data = await response.json()
      renderCardIntoShadow(shadow, data)
    } catch {
      shadow.innerHTML = `<style>${STYLES}</style><div class="pf-card" style="opacity: 0.7; font-size: 13px;">Не удалось загрузить кейс.</div>`
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProofFlowWidgets)
} else {
  initProofFlowWidgets()
}
