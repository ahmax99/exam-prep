import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text
} from '@react-email/components'

import type { ContactFormSchema } from '../../schemas/contactForm.schema'

export const ContactNotificationEmail = ({
  name,
  email,
  subject,
  message
}: ContactFormSchema) => (
  <Html>
    <Head />
    <Preview>New contact form submission from {name}</Preview>
    <Tailwind>
      <Body className="bg-[#fcfcfc] font-sans">
        <Container className="mx-auto max-w-xl px-4 py-8">
          <Section className="rounded-lg bg-white p-8 shadow-sm">
            <Text className="mb-4 text-2xl font-bold text-black">
              New Contact Form Submission
            </Text>
            <Text className="mb-2 text-base text-black">
              <strong>From:</strong> {name} ({email})
            </Text>
            <Text className="mb-2 text-base text-black">
              <strong>Subject:</strong> {subject}
            </Text>
            <Section className="mt-4 rounded-md bg-[#f5f5f5] p-4">
              <Text className="text-base text-black">{message}</Text>
            </Section>
          </Section>
          <Section className="mt-4 text-center">
            <Text className="text-xs text-[#525252]">
              This message was sent via the contact form on Nextjs Boilerplate.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
