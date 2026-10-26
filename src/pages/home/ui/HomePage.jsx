import { useState } from 'react'
import { Button, Container, Heading, Input, Section, Select, Text } from '@/shared/ui'
import { HOME_STUB_CONTENT } from '../config/content.js'
import styles from './HomePage.module.css'

export const HomePage = () => {
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')

  return (
    <main>
      <Section variant="light" spacing="relaxed">
        <Container>
          <div className={styles.heroWrapper}>
            <span className={styles.badge}>{HOME_STUB_CONTENT.badge}</span>

            <Heading level={1} size="2xl" align="center">
              {HOME_STUB_CONTENT.title}
            </Heading>

            <Text size="lg" color="secondary" align="center">
              {HOME_STUB_CONTENT.description}
            </Text>

            <div className={styles.buttonGroup}>
              <Button variant="primary" size="lg">
                {HOME_STUB_CONTENT.ctaPrimary}
              </Button>
              <Button variant="secondary" size="lg">
                {HOME_STUB_CONTENT.ctaSecondary}
              </Button>
            </div>

            <div className={styles.previewGrid}>
              <Input
                label={HOME_STUB_CONTENT.inputLabel}
                placeholder={HOME_STUB_CONTENT.inputPlaceholder}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
              />

              <Select
                label={HOME_STUB_CONTENT.selectLabel}
                placeholder={HOME_STUB_CONTENT.selectPlaceholder}
                options={HOME_STUB_CONTENT.selectOptions}
                value={selectValue}
                onChange={(event) => setSelectValue(event.target.value)}
              />
            </div>
          </div>
        </Container>
      </Section>
    </main>
  )
}
