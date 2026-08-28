import { PageHeader } from '@/components/layout'
import { ErrorScreenProvider } from '@/features/error/client/providers/ErrorScreenProvider'

export default function PublicLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ErrorScreenProvider />
      <PageHeader />
      {children}
    </>
  )
}
