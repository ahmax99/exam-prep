import { FeatureSection, HeroSection } from '@/components/common'
import { PageTemplate } from '@/components/layout'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Home',
    description:
      'A production-grade full-stack boilerplate — Next.js BFF, Elysia API, Cognito auth, and Neon Postgres.'
  })

export default function HomePage() {
  return (
    <PageTemplate maxWidth="wide">
      <HeroSection />
      <FeatureSection />
    </PageTemplate>
  )
}
