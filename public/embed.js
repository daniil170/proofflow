(function(){var e=`
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
}

.pf-watermark strong {
  color: #ffffff;
}
`,t=(t,r)=>{t.innerHTML=`
    <style>
      ${e}
      :host {
        --pf-accent: ${r.branding?.accentColor||`#d6f94c`};
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
        <span class="pf-metric-val">${n(r.metric||``)}</span>
        <span class="pf-metric-lbl">${n(r.metricLabel||``)}</span>
      </div>

      <div class="pf-stats-grid">
        <div class="pf-stat-box">
          <span class="pf-stat-lbl">было</span>
          <span class="pf-stat-txt">${n(r.problem||``)}</span>
        </div>
        <div class="pf-stat-box">
          <span class="pf-stat-lbl">сделано</span>
          <span class="pf-stat-txt">${n(r.solution||``)}</span>
        </div>
        <div class="pf-stat-box-highlight">
          <span class="pf-stat-lbl-hi">стало</span>
          <span class="pf-stat-txt">${n(r.result||``)}</span>
        </div>
      </div>

      <blockquote class="pf-quote">
        «${n(r.quote||``)}»
      </blockquote>

      <div class="pf-footer">
        <div>
          <span class="pf-author">${n(r.author||`Анна К.`)}</span>
          <span class="pf-company">, ${n(r.companyName||`ProofFlow`)}</span>
        </div>
        <a href="https://proofflow.ru" target="_blank" rel="noopener" class="pf-watermark">
          Powered by <strong>ProofFlow</strong>
        </a>
      </div>
    </div>
  `},n=e=>e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``,r=()=>{let n=document.currentScript,r=n?.src?new URL(n.src).origin:`https://proofflow.ru`;Array.from(document.querySelectorAll(`[data-proofflow-case]`)).forEach(async n=>{if(n._pfMounted)return;n._pfMounted=!0;let i=n.getAttribute(`data-proofflow-case`);if(!i)return;let a=n.attachShadow({mode:`open`});a.innerHTML=`<style>${e}</style><div class="pf-card" style="opacity: 0.6; min-height: 180px; justify-content: center; align-items: center;">Загрузка кейса...</div>`;try{let n=await fetch(`${r}/getPublicCase?id=${encodeURIComponent(i)}`);if(!n.ok){a.innerHTML=`<style>${e}</style><div class="pf-card" style="opacity: 0.7; font-size: 13px;">Кейс недоступен или снят с публикации.</div>`;return}t(a,await n.json())}catch{a.innerHTML=`<style>${e}</style><div class="pf-card" style="opacity: 0.7; font-size: 13px;">Не удалось загрузить кейс.</div>`}})};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,r):r()})();