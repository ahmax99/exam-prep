import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldTitle
} from './Field'

interface FormFieldProps {
  name: string
  label: string
  error?: { message?: string }
  children: React.ReactNode
}

export const FormField = ({
  name,
  label,
  error,
  children
}: Readonly<FormFieldProps>) => (
  <Field>
    <FieldLabel className="flex items-center justify-between" htmlFor={name}>
      <FieldTitle>{label}</FieldTitle>
    </FieldLabel>
    <FieldContent>
      {children}
      <FieldError errors={error ? [error] : []} />
    </FieldContent>
  </Field>
)
