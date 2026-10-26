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
  Trust,
} from '@/widgets'

export const LandingPage = () => {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Audience />
        <Steps />
        <Comparison />
        <Trust />
        <BetaOffer />
        <Faq />
        <BetaForm />
      </main>
      <Footer />
    </>
  )
}
