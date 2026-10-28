import PropTypes from 'prop-types'
import { CaseCard } from '@/widgets/case-card'
import { SitePreview, StoryPreview } from '@/features/case-gallery'
import { ACCENT_COLOR_TOKENS } from '../model/contrast'
import styles from './CaseStyleSelector.module.css'

const STYLES_LIST = [
  { id: 'dark', title: 'Тёмная', desc: 'Строгий B2B с неоновой метрикой' },
  { id: 'newspaper', title: 'Газета', desc: 'Винтажная колонка с засечками' },
  { id: 'whatsapp', title: 'WhatsApp', desc: 'Мессенджер с баблами и цитатой' },
  { id: 'receipt', title: 'Чек', desc: 'Термочек со штрихкодом и итогом' },
  { id: 'minimal', title: 'Минимализм', desc: 'Чистая белая карточка с крупной цифрой' },
]

export const CaseStyleSelector = ({ styleState, onNextStep = null }) => {
  const {
    selectedVariant,
    accentColor,
    showLogo,
    companyName,
    logoUrl,
    isUploadingLogo,
    logoError,
    isSaving,
    contrastInfo,
    activeMode,
    previewData,
    setActiveMode,
    handleSelectVariant,
    handleAccentChange,
    handleCompanyNameChange,
    handleShowLogoToggle,
    handleLogoUpload,
    handleRemoveLogo,
    saveStyle,
  } = styleState

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLogoUpload(file)
    }
  }

  const handleSaveAndProceed = async () => {
    await saveStyle()
    if (typeof onNextStep === 'function') {
      onNextStep()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h2 className={styles.previewTitle}>Внешний вид кейса</h2>
            <div className={styles.modeSwitchWrapper}>
              <button
                type="button"
                className={`${styles.colorPill} ${activeMode === 'card' ? styles.colorPillActive : ''}`}
                style={{
                  width: 'auto',
                  height: 'auto',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeMode === 'card' ? 'var(--color-accent, #d4ff3a)' : 'transparent',
                  color: activeMode === 'card' ? '#111' : 'var(--color-text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.78rem',
                }}
                onClick={() => setActiveMode('card')}
              >
                Карточка
              </button>
              <button
                type="button"
                className={`${styles.colorPill} ${activeMode === 'site' ? styles.colorPillActive : ''}`}
                style={{
                  width: 'auto',
                  height: 'auto',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeMode === 'site' ? 'var(--color-accent, #d4ff3a)' : 'transparent',
                  color: activeMode === 'site' ? '#111' : 'var(--color-text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.78rem',
                }}
                onClick={() => setActiveMode('site')}
              >
                На сайте
              </button>
              <button
                type="button"
                className={`${styles.colorPill} ${activeMode === 'story' ? styles.colorPillActive : ''}`}
                style={{
                  width: 'auto',
                  height: 'auto',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeMode === 'story' ? 'var(--color-accent, #d4ff3a)' : 'transparent',
                  color: activeMode === 'story' ? '#111' : 'var(--color-text-secondary)',
                  fontWeight: '600',
                  fontSize: '0.78rem',
                }}
                onClick={() => setActiveMode('story')}
              >
                Сторис
              </button>
            </div>
          </div>

          <div className={styles.previewCanvas} style={{ '--case-accent': accentColor }}>
            {activeMode === 'card' && (
              <div className={styles.cardPreviewWrapper}>
                <CaseCard variant={selectedVariant} data={{ ...previewData, accentColor }} />
              </div>
            )}
            {activeMode === 'site' && (
              <SitePreview variant={selectedVariant} data={{ ...previewData, accentColor }} />
            )}
            {activeMode === 'story' && (
              <StoryPreview variant={selectedVariant} data={{ ...previewData, accentColor }} />
            )}
          </div>

          <div>
            <span className={styles.fieldLabel}>Выберите стиль карточки</span>
            <div className={styles.stylesList}>
              {STYLES_LIST.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`${styles.styleCard} ${selectedVariant === st.id ? styles.styleCardActive : ''}`}
                  onClick={() => handleSelectVariant(st.id)}
                >
                  <span className={styles.styleCardTitle}>{st.title}</span>
                  <span className={styles.styleCardDesc}>{st.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.settingsPanel}>
          <h3 className={styles.sectionTitle}>Настройки брендинга</h3>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Цвет акцента</span>
            <div className={styles.tokenRow}>
              {ACCENT_COLOR_TOKENS.map((token) => (
                <button
                  key={token.hex}
                  type="button"
                  title={token.label}
                  className={`${styles.colorPill} ${accentColor.toLowerCase() === token.hex.toLowerCase() ? styles.colorPillActive : ''}`}
                  style={{ backgroundColor: token.hex }}
                  onClick={() => handleAccentChange(token.hex)}
                />
              ))}
            </div>

            <div className={styles.customHexRow}>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => handleAccentChange(e.target.value)}
                className={styles.colorInputPicker}
                aria-label="Выбрать произвольный цвет"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => handleAccentChange(e.target.value)}
                placeholder="#d6f94c"
                className={styles.hexInput}
              />
            </div>

            <div
              className={`${styles.contrastBadge} ${contrastInfo.isAccessible ? styles.contrastOk : styles.contrastWarn}`}
            >
              <span>{contrastInfo.isAccessible ? '✓' : '⚠'}</span>
              <span>
                Контраст {contrastInfo.ratio}:1 — {contrastInfo.scoreText}
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="company-name-input">
              Название компании
            </label>
            <input
              id="company-name-input"
              type="text"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Название вашей компании"
              className={styles.textInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.toggleRow}>
              <span className={styles.fieldLabel}>Показывать логотип</span>
              <input
                type="checkbox"
                checked={showLogo}
                onChange={handleShowLogoToggle}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {showLogo && (
              <div className={styles.logoUploadBox}>
                {logoUrl ? (
                  <div className={styles.logoPreviewWrapper}>
                    <img src={logoUrl} alt="Логотип" className={styles.logoImagePreview} />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className={styles.removeLogoBtn}
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className={styles.fileInputLabel}>
                      <input
                        type="file"
                        accept="image/png, image/svg+xml"
                        onChange={onFileInputChange}
                        style={{ display: 'none' }}
                        disabled={isUploadingLogo}
                      />
                      <span>
                        {isUploadingLogo ? 'Загрузка...' : '+ Загрузить логотип (PNG или SVG до 2 МБ)'}
                      </span>
                    </label>
                    {logoError && <span className={styles.errorText}>{logoError}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSaveAndProceed}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить и перейти к публикации →'}
          </button>
        </div>
      </div>
    </div>
  )
}

CaseStyleSelector.propTypes = {
  styleState: PropTypes.shape({
    selectedVariant: PropTypes.string.isRequired,
    accentColor: PropTypes.string.isRequired,
    showLogo: PropTypes.bool.isRequired,
    companyName: PropTypes.string.isRequired,
    logoUrl: PropTypes.string,
    isUploadingLogo: PropTypes.bool.isRequired,
    logoError: PropTypes.string,
    isSaving: PropTypes.bool.isRequired,
    contrastInfo: PropTypes.object.isRequired,
    activeMode: PropTypes.string.isRequired,
    previewData: PropTypes.object.isRequired,
    setActiveMode: PropTypes.func.isRequired,
    handleSelectVariant: PropTypes.func.isRequired,
    handleAccentChange: PropTypes.func.isRequired,
    handleCompanyNameChange: PropTypes.func.isRequired,
    handleShowLogoToggle: PropTypes.func.isRequired,
    handleLogoUpload: PropTypes.func.isRequired,
    handleRemoveLogo: PropTypes.func.isRequired,
    saveStyle: PropTypes.func.isRequired,
  }).isRequired,
  onNextStep: PropTypes.func,
}
