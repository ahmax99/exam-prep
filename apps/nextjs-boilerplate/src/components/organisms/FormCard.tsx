import { Button } from '../atoms/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../molecules/Card'
import { LoadingSwap } from '../molecules/LoadingSwap'

interface FormCardProps {
  title: string
  description: string
  submitLabel: string
  isSubmitting: boolean
  onSubmit: React.SubmitEventHandler<HTMLFormElement>
  children: React.ReactNode
}

export const FormCard = ({
  title,
  description,
  submitLabel,
  isSubmitting,
  onSubmit,
  children
}: Readonly<FormCardProps>) => (
  <Card className="w-full sm:max-w-96">
    <CardHeader className="text-2xl font-bold">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>

    <CardContent>
      <form className="space-y-4" noValidate onSubmit={onSubmit}>
        {children}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          <LoadingSwap isLoading={isSubmitting}>{submitLabel}</LoadingSwap>
        </Button>
      </form>
    </CardContent>
  </Card>
)
