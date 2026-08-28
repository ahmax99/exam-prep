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

export const ContactConfirmationEmail = ({
  name,
  subject,
  message
}: ContactFormSchema) => (
  <Html>
    <Head />
    <Preview>Thank you for contacting us, {name}!</Preview>
    <Tailwind>
      <Body className="bg-[#fcfcfc] font-sans">
        <Container className="mx-auto max-w-xl px-4 py-8">
          <Section className="rounded-lg bg-white p-8 shadow-sm">
            <Text className="mb-4 text-2xl font-bold text-black">
              Thank You for Reaching Out!
            </Text>
            <Text className="mb-4 text-base text-black">Hi {name},</Text>
            <Text className="mb-4 text-base text-black">
              We&apos;ve received your message and appreciate you taking the
              time to contact us. Our team will review your inquiry and get back
              to you as soon as possible.
            </Text>
            <Text className="mb-2 text-base font-medium text-black">
              Here&apos;s a summary of your message:
            </Text>
            <Text className="mb-2 text-base text-black">
              <strong>Subject:</strong> {subject}
            </Text>
            <Section className="mt-2 rounded-md bg-[#f5f5f5] p-4">
              <Text className="text-base text-black">{message}</Text>
            </Section>
            <Section className="mt-8 border-t border-[#e4e4e4] pt-8">
              <Text className="text-sm text-[#525252]">
                You don&apos;t need to reply to this email. If you have
                additional questions, feel free to submit another message
                through our contact form.
              </Text>
            </Section>
          </Section>
          <Section className="mt-4 text-center">
            <Text className="text-xs text-[#525252]">
              This is an automated confirmation from Nextjs Boilerplate.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
