import { useState } from 'react'
import { Container } from '@/shared/ui'
import {
  Audience,
  BetaForm,
  BetaOffer,
  Comparison,
  Faq,
  Footer,
  Header,
  Hero,
  LogoDemoIntro,
  Steps,
  StylePicker,
  Trust,
} from '@/widgets'
import BetaProgramSection from '@/components/landing/BetaProgramSection'
import styles from './LandingPage.module.css'

export const LandingPage = () => {
  const [showDemoIntro, setShowDemoIntro] = useState(true)

  return (
    <>
      {showDemoIntro && (
        <LogoDemoIntro onFinish={() => setShowDemoIntro(false)} />
      )}
      <Header onLogoClick={() => setShowDemoIntro(true)} />
      <main>
        <Hero />
        <Audience />
        <Steps />
        <StylePicker />
        <Comparison />
        <Trust />
        <BetaProgramSection />
        <Faq />
        <section id="beta-form" className={styles.betaSection} aria-labelledby="beta-offer-title">
          <Container>
            <div className={styles.betaGrid}>
              <BetaOffer />
              <BetaForm />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}
