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
  Steps,
  StylePicker,
  Trust,
} from '@/widgets'
import BetaProgramSection from '@/components/landing/BetaProgramSection'
import styles from './LandingPage.module.css'

export const LandingPage = () => {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Audience />
        <Steps />
        <Comparison />
        <StylePicker />
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
