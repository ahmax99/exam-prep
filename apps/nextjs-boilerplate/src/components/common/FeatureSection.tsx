import { PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/features/auth/lib/routes'

import { ButtonLink } from '../atoms/ButtonLink'

const NEXT_STEPS = [
  {
    title: 'Browse the demo',
    description:
      'A working posts and comments flow with authenticated CRUD and CASL-enforced authorization.',
    href: PUBLIC_ROUTES.POSTS,
    label: 'View posts'
  },
  {
    title: 'Create a post',
    description:
      'Post creation is Admin-only — sign in as an admin to try the full write path: form validation, image upload, and the BFF boundary.',
    href: PROTECTED_ROUTES.POST_CREATE,
    label: 'Create post'
  }
] as const

function FeatureSection() {
  return (
    <section className="px-4 py-6">
      <div className="divide-border border-border divide-y rounded-xl border">
        {NEXT_STEPS.map((step) => (
          <div
            className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
            key={step.title}
          >
            <div className="space-y-1">
              <h2 className="text-foreground text-xl font-medium">
                {step.title}
              </h2>
              <p className="text-muted-foreground max-w-md text-sm">
                {step.description}
              </p>
            </div>
            <ButtonLink href={step.href} variant="outline">
              {step.label}
            </ButtonLink>
          </div>
        ))}
      </div>
    </section>
  )
}

export { FeatureSection }
