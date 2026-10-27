import { useState } from 'react'
import PropTypes from 'prop-types'
import { BUSINESS_TYPE_OPTIONS } from '@/pages/landing'
import { Button, Checkbox, Input, Select, Textarea } from '@/shared/ui'
import { LegalModal } from '@/components/legal'
import { useOnboarding } from '../model/useOnboarding.js'
import styles from './OnboardingForm.module.css'

export const OnboardingForm = ({ onSuccess }) => {
  const { formData, errors, serverError, isSubmitting, updateField, submit } =
    useOnboarding(onSuccess)

  const [legalModalState, setLegalModalState] = useState({
    isOpen: false,
    doc: 'terms',
  })

  const openDoc = (e, doc) => {
    e.preventDefault()
    setLegalModalState({ isOpen: true, doc })
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>Шаг 1 из 1</span>
          <h1 className={styles.title}>Знакомство</h1>
          <p className={styles.subtitle}>
            Заполните данные о себе и проекте. Название компании и логотип будут
            использоваться в оформлении готовых кейсов.
          </p>
        </div>

        {serverError && <div className={styles.serverError}>{serverError}</div>}

        <form onSubmit={submit} className={styles.form} noValidate>
          <Input
            id="onboarding-display-name"
            name="displayName"
            label="Ваше имя"
            placeholder="Например, Алексей Смирнов"
            value={formData.displayName}
            error={errors.displayName}
            helperText="Как к вам обращаться в уведомлениях и интерфейсе"
            required
            disabled={isSubmitting}
            onChange={(e) => updateField('displayName', e.target.value)}
          />

          <Input
            id="onboarding-company-name"
            name="companyName"
            label="Название компании или проекта"
            placeholder="Например, Студия «Вектор»"
            value={formData.companyName}
            error={errors.companyName}
            helperText="Будет отображаться на карточках кейсов"
            required
            disabled={isSubmitting}
            onChange={(e) => updateField('companyName', e.target.value)}
          />

          <Select
            id="onboarding-business-type"
            name="businessType"
            label="Сфера деятельности"
            options={BUSINESS_TYPE_OPTIONS}
            value={formData.businessType}
            error={errors.businessType}
            helperText="Помогает ИИ точнее подбирать отраслевой тон и метрики"
            required
            disabled={isSubmitting}
            onChange={(e) => updateField('businessType', e.target.value)}
          />

          <Input
            id="onboarding-website-url"
            name="websiteUrl"
            type="url"
            label="Сайт или портфолио"
            placeholder="https://vector-studio.ru"
            value={formData.websiteUrl}
            error={errors.websiteUrl}
            helperText="Ссылка на ваш сайт, блог или канал"
            disabled={isSubmitting}
            onChange={(e) => updateField('websiteUrl', e.target.value)}
          />

          <Textarea
            id="onboarding-current-process"
            name="currentProcessNote"
            label="Как вы сейчас упаковываете кейсы?"
            placeholder="Например: пишем статьи в блог вручную или собираем PDF в Figma..."
            value={formData.currentProcessNote}
            helperText="Необязательно. Поможет нам настроить рекомендации для вас"
            rows={3}
            disabled={isSubmitting}
            onChange={(e) => updateField('currentProcessNote', e.target.value)}
          />

          <div className={styles.consentWrapper}>
            <Checkbox
              id="onboarding-consent"
              name="consent"
              checked={formData.consent}
              disabled={isSubmitting}
              error={errors.consent}
              onChange={(e) => updateField('consent', e.target.checked)}
              label={
                <span className={styles.consentText}>
                  Я принимаю{' '}
                  <a
                    href="/terms"
                    onClick={(e) => openDoc(e, 'terms')}
                    className={styles.consentLink}
                  >
                    условия использования
                  </a>{' '}
                  и соглашаюсь с{' '}
                  <a
                    href="/privacy"
                    onClick={(e) => openDoc(e, 'privacy')}
                    className={styles.consentLink}
                  >
                    политикой обработки данных
                  </a>
                  .
                </span>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Сохранение...' : 'Завершить настройку и войти'}
          </Button>
        </form>

        {legalModalState.isOpen && (
          <LegalModal
            isOpen={legalModalState.isOpen}
            initialDoc={legalModalState.doc}
            onClose={() => setLegalModalState({ isOpen: false, doc: 'terms' })}
          />
        )}
      </div>
    </div>
  )
}

OnboardingForm.propTypes = {
  onSuccess: PropTypes.func,
}
