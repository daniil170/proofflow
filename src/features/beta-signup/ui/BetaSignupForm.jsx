import PropTypes from 'prop-types'
import { BETA_OFFER_CONTENT, BUSINESS_TYPE_OPTIONS, CASES_VOLUME_OPTIONS } from '@/pages/landing'
import { Button, Checkbox, Input, Select, Textarea } from '@/shared/ui'
import { useBetaSignup } from '../model/index.js'
import { BetaSignupSuccess } from './BetaSignupSuccess.jsx'
import styles from './BetaSignupForm.module.css'

export const BetaSignupForm = ({ gateway = null }) => {
  const { formData, errors, serverError, isLoading, isSuccess, updateField, submit, reset } =
    useBetaSignup(gateway)

  if (isSuccess) {
    return <BetaSignupSuccess email={formData.email} onReset={reset} />
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <input
        type="text"
        name="website_url_hp"
        tabIndex={-1}
        autoComplete="off"
        value={formData.websiteHoneypot}
        onChange={(event) => updateField('websiteHoneypot', event.target.value)}
        className={styles.honeypot}
        aria-hidden="true"
      />

      {serverError && (
        <div role="alert" className={styles.errorBanner}>
          {serverError}
        </div>
      )}

      <Input
        id="beta-email"
        name="email"
        type="email"
        label="Рабочая почта *"
        placeholder="you@studio.ru"
        value={formData.email}
        error={errors.email}
        disabled={isLoading}
        required
        onChange={(event) => updateField('email', event.target.value)}
      />

      <Select
        id="beta-business-type"
        name="businessType"
        label="Чем вы занимаетесь"
        options={BUSINESS_TYPE_OPTIONS}
        value={formData.businessType}
        disabled={isLoading}
        onChange={(event) => updateField('businessType', event.target.value)}
      />

      <Select
        id="beta-cases-volume"
        name="casesVolume"
        label="Сколько кейсов хотите делать в месяц"
        options={CASES_VOLUME_OPTIONS}
        value={formData.casesVolume}
        disabled={isLoading}
        onChange={(event) => updateField('casesVolume', event.target.value)}
      />

      <Textarea
        id="beta-current-process"
        name="currentProcess"
        label="Как вы делаете кейсы сейчас"
        placeholder="Например: расшифровываем созвоны вручную, пишем черновик с нуля, отдаем дизайнеру на верстку..."
        rows={3}
        value={formData.currentProcess}
        disabled={isLoading}
        onChange={(event) => updateField('currentProcess', event.target.value)}
      />

      <Checkbox
        id="beta-consent"
        name="consent"
        checked={formData.consent}
        error={errors.consent}
        disabled={isLoading}
        required
        label="Даю согласие на обработку email для связи по закрытой бете *"
        onChange={(event) => updateField('consent', event.target.checked)}
      />

      <div className={styles.submitWrapper}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          aria-label="Отправить заявку на участие в закрытой бете"
        >
          {isLoading ? 'Отправляем...' : 'Оставить заявку'}
        </Button>
      </div>

      <p className={styles.directContact}>
        <span>{BETA_OFFER_CONTENT.form.directContactPrefix}</span>
        <a
          href={`https://t.me/${BETA_OFFER_CONTENT.form.directContactHandle.replace('@', '')}`}
          target="_blank"
          rel="noreferrer"
          className={styles.telegramLink}
        >
          {BETA_OFFER_CONTENT.form.directContactHandle}
        </a>
      </p>
    </form>
  )
}

BetaSignupForm.propTypes = {
  gateway: PropTypes.shape({
    submit: PropTypes.func.isRequired,
  }),
}
