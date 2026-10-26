import { Container } from '@/shared/ui'
import {
  Audience,
  BetaForm,
  BetaOffer,
  CaseStylesShowcase,
  Comparison,
  Faq,
  Footer,
  Header,
  Hero,
  Steps,
  Trust,
} from '@/widgets'
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
        <CaseStylesShowcase />
        <Trust />
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
