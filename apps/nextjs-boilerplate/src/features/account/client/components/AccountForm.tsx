'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type UseFormRegister, useForm } from 'react-hook-form'

import { Input } from '@/components/atoms'
import { FormCard, FormField } from '@/components/organisms'

import { useAccountActions } from '../../client/hooks/useAccountActions'
import {
  AccountFormModel,
  type UpdateProfileSchema
} from '../../schemas/accountForm.schema'

export interface FieldConfig {
  name: 'name' | 'image'
  label: string
  description: string
}

interface AccountFormConfig {
  title: string
  description: string
  fields: FieldConfig[]
  submitLabel: string
  defaultValues: UpdateProfileSchema
}

interface AccountFormProps {
  config: AccountFormConfig
}

const FieldInput = ({
  field,
  error,
  register,
  onImageChange
}: Readonly<{
  field: FieldConfig
  error: boolean
  register: UseFormRegister<UpdateProfileSchema>
  onImageChange: (file: File) => void
}>) => {
  if (field.name === 'image')
    return (
      <Input
        accept="image/*"
        aria-invalid={error}
        id={field.name}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageChange(file)
        }}
        type="file"
      />
    )

  return (
    <Input
      id={field.name}
      placeholder={field.description}
      type="text"
      {...register(field.name)}
      aria-invalid={error}
    />
  )
}

export const AccountForm = ({ config }: Readonly<AccountFormProps>) => {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(AccountFormModel.updateProfile),
    defaultValues: config.defaultValues
  })
  const { handleUpdateProfile } = useAccountActions()

  const onSubmit = async (data: UpdateProfileSchema) =>
    await handleUpdateProfile(data, imageFile, () => {
      reset()
      setImageFile(null)
    })

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
          error={errors[field.name as keyof typeof errors]}
          key={field.name}
          label={field.label}
          name={field.name}
        >
          <FieldInput
            error={!!errors[field.name as keyof typeof errors]}
            field={field}
            onImageChange={setImageFile}
            register={register}
          />
        </FormField>
      ))}
    </FormCard>
  )
}
