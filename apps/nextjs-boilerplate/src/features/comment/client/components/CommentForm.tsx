'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button, Textarea } from '@/components/atoms'
import { LoadingSwap } from '@/components/molecules'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldTitle
} from '@/components/organisms/Field'

import {
  CommentFormModel,
  type CreateCommentSchema
} from '../../schemas/commentForm.schema'
import { useCommentActions } from '../hooks/useCommentActions'

export interface CommentFieldConfig {
  name: 'content'
  label: string
  description: string
}

export interface CommentFormConfig {
  fields: CommentFieldConfig[]
  submitLabel: string
  defaultValues: CreateCommentSchema
}

interface CommentFormProps {
  config: CommentFormConfig
}

export const CommentForm = ({ config }: Readonly<CommentFormProps>) => {
  const { handleCreateComment } = useCommentActions()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateCommentSchema>({
    resolver: zodResolver(CommentFormModel.createComment),
    defaultValues: config.defaultValues
  })

  const onSubmit = async (data: CreateCommentSchema) =>
    handleCreateComment(data, reset)

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      {config.fields.map((field) => {
        const fieldError = errors[field.name]

        return (
          <Field key={field.name}>
            <FieldLabel
              className="flex items-center justify-between"
              htmlFor={field.name}
            >
              <FieldTitle>{field.label}</FieldTitle>
            </FieldLabel>
            <FieldContent>
              <Textarea
                id={field.name}
                placeholder={field.description}
                {...register(field.name)}
                aria-invalid={!!fieldError}
              />
              <FieldError errors={fieldError ? [fieldError] : []} />
            </FieldContent>
          </Field>
        )
      })}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        <LoadingSwap isLoading={isSubmitting}>{config.submitLabel}</LoadingSwap>
      </Button>
    </form>
  )
}
