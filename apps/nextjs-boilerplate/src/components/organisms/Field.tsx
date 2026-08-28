'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/mergeClass'

import { Label } from '../atoms/Label'

const fieldVariants = cva(
  'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
        horizontal: [
          'flex-row items-center',
          '[&>[data-slot=field-label]]:flex-auto',
          'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px'
        ],
        responsive: [
          'flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto',
          '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
          '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px'
        ]
      }
    },
    defaultVariants: {
      orientation: 'vertical'
    }
  }
)

function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      className={cn(fieldVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="field"
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group/field-content flex flex-1 flex-col gap-1.5 leading-snug',
        className
      )}
      data-slot="field-content"
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border *:data-[slot=field]:p-4',
        'has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10',
        className
      )}
      data-slot="field-label"
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex w-fit items-center gap-2 font-medium text-sm leading-snug group-data-[disabled=true]/field:opacity-50',
        className
      )}
      data-slot="field-title"
      {...props}
    />
  )
}

type FieldErrorItem = { message?: string } | undefined

const dedupeErrorMessages = (errors: FieldErrorItem[]) => [
  ...new Map(errors.map((error) => [error?.message, error])).values()
]

const FieldErrorList = ({ errors }: { errors: FieldErrorItem[] }) => (
  <ul className="ml-4 flex list-disc flex-col gap-1">
    {errors.map(
      (error) => error?.message && <li key={error.message}>{error.message}</li>
    )}
  </ul>
)

const resolveFieldErrorContent = (
  children: React.ReactNode,
  errors: FieldErrorItem[] = []
) => {
  if (children) return children
  const unique = dedupeErrorMessages(errors)
  if (!unique.length) return null
  if (unique.length === 1) return unique[0]!.message

  return <FieldErrorList errors={unique} />
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: FieldErrorItem[]
}) {
  const content = resolveFieldErrorContent(children, errors)

  if (!content) return null

  return (
    <div
      className={cn('font-normal text-destructive text-sm', className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  )
}

export { Field, FieldContent, FieldError, FieldLabel, FieldTitle }
