import { useState } from 'react'
import { Button, Input, Select } from '@/shared/ui'
import { BETA_OFFER_CONTENT, BUSINESS_TYPE_OPTIONS } from '@/pages/landing'
import styles from './BetaForm.module.css'

export const BetaForm = () => {
  const [email, setEmail] = useState('')
  const [businessType, setBusinessType] = useState('agency_or_studio')

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <div className={styles.formCard}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          id="beta-email"
          name="email"
          type="email"
          label={BETA_OFFER_CONTENT.form.emailLabel}
          placeholder={BETA_OFFER_CONTENT.form.emailPlaceholder}
          value={email}
          required
          onChange={(event) => setEmail(event.target.value)}
        />

        <Select
          id="beta-business-type"
          name="businessType"
          label={BETA_OFFER_CONTENT.form.businessTypeLabel}
          options={BUSINESS_TYPE_OPTIONS}
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value)}
        />

        <div className={styles.buttonWrapper}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            aria-label="Отправить заявку на участие в закрытой бете"
          >
            {BETA_OFFER_CONTENT.form.submitButtonText}
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
    </div>
  )
}
