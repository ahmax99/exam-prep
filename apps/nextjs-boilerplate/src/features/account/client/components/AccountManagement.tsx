'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { TriangleAlert, User } from 'lucide-react'

import { Button } from '@/components/atoms'
import {
  Card,
  CardContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/molecules'
import { PROTECTED_ROUTES } from '@/features/auth/lib/routes'

import { DeleteAccountButton } from './DeleteAccountButton'

const setTabParam = (
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  tab: string
) => {
  const params = new URLSearchParams(searchParams.toString())
  params.set('tab', tab)
  router.replace(`?${params.toString()}`, { scroll: false })
}

export const AccountManagement = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTab = tabParam === 'danger-zone' ? 'danger-zone' : 'profile'

  const handleTabChange = (value: string) =>
    setTabParam(router, searchParams, value)

  useEffect(() => {
    if (!tabParam) setTabParam(router, searchParams, 'profile')
  }, [tabParam, router, searchParams])

  return (
    <Tabs onValueChange={handleTabChange} value={activeTab}>
      <TabsList className="grid h-fit w-full grid-cols-2">
        <TabsTrigger value="profile">
          <User />
          <span className="max-sm:hidden">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="danger-zone">
          <TriangleAlert />
          <span className="max-sm:hidden">Danger Zone</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent
        className="flex flex-col justify-center gap-4"
        value="profile"
      >
        <h2 className="text-2xl font-medium">Settings</h2>
        <Card className="flex flex-row items-center justify-between">
          <CardContent>
            <h3 className="text-lg font-medium">Update Profile</h3>
            <p>You can update your account name.</p>
          </CardContent>
          <CardContent>
            <Button onClick={() => router.push(PROTECTED_ROUTES.ACCOUNT_EDIT)}>
              Update Profile
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        className="flex flex-col justify-center gap-4"
        value="danger-zone"
      >
        <h2 className="text-2xl font-medium">Danger Zone</h2>
        <Card className="border-destructive flex flex-row items-center justify-between">
          <CardContent>
            <h3 className="text-lg font-medium">Delete this account</h3>
            <p>
              Once you delete this account, there is no going back. Please be
              certain.
            </p>
          </CardContent>
          <CardContent>
            <DeleteAccountButton />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
