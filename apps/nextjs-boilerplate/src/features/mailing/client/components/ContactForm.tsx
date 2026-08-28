'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { type UseFormRegister, useForm } from 'react-hook-form'

import { Input, Textarea } from '@/components/atoms'
import { FormCard, FormField } from '@/components/organisms'

import {
  ContactFormModel,
  type ContactFormSchema
} from '../../schemas/contactForm.schema'
import { useContactActions } from '../hooks/useContactActions'

export interface FieldConfig {
  name: keyof ContactFormSchema
  label: string
  description: string
}

interface ContactFormConfig {
  title: string
  description: string
  fields: FieldConfig[]
  submitLabel: string
  defaultValues: ContactFormSchema
}

interface ContactFormProps {
  config: ContactFormConfig
}

const FieldInput = ({
  field,
  error,
  register
}: Readonly<{
  field: FieldConfig
  error: boolean
  register: UseFormRegister<ContactFormSchema>
}>) => {
  if (field.name === 'message')
    return (
      <Textarea
        id={field.name}
        placeholder={field.description}
        rows={5}
        {...register(field.name)}
        aria-invalid={error}
      />
    )

  return (
    <Input
      id={field.name}
      placeholder={field.description}
      type={field.name === 'email' ? 'email' : 'text'}
      {...register(field.name)}
      aria-invalid={error}
    />
  )
}

export const ContactForm = ({ config }: Readonly<ContactFormProps>) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormSchema>({
    resolver: zodResolver(ContactFormModel.contact),
    defaultValues: config.defaultValues
  })
  const { handleSendContact } = useContactActions()

  const onSubmit = async (data: ContactFormSchema) =>
    await handleSendContact(data)

  return (
    <FormCard
      description={config.description}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={config.submitLabel}
      title={config.title}
    >
      {config.fields.map((field) => (
        <FormField
          error={errors[field.name]}
          key={field.name}
          label={field.label}
          name={field.name}
        >
          <FieldInput
            error={!!errors[field.name]}
            field={field}
            register={register}
          />
        </FormField>
      ))}
    </FormCard>
  )
}
