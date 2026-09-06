'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo } from '@/components/molecules'
import {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/organisms/Sidebar'

interface AppSidebarCertification {
  slug: string
  name: string
  questionCount: number
}

interface AppSidebarPracticeItem {
  label: string
  count: number | null
  href: string
}

interface AppSidebarProps {
  certifications: AppSidebarCertification[]
  practiceItems: AppSidebarPracticeItem[]
}

function AppSidebar({
  certifications,
  practiceItems
}: Readonly<AppSidebarProps>) {
  const activeCertSlug = usePathname().split('/')[1]

  return (
    <Sidebar collapsible="offcanvas">
      <div className="border-row-border h-header-nav flex shrink-0 items-center justify-between border-b px-4 lg:hidden">
        <Logo />
        <SidebarClose className="-mr-2.5" />
      </div>
      <SidebarContent className="py-5">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>Certifications</SidebarGroupLabel>
          <SidebarGroupContent className="px-2.5">
            <SidebarMenu>
              {certifications.length === 0 ? (
                <SidebarMenuItem>
                  <span className="text-muted-foreground px-2.5 text-sm">
                    None seeded
                  </span>
                </SidebarMenuItem>
              ) : (
                certifications.map((certification) => (
                  <SidebarMenuItem key={certification.slug}>
                    <SidebarMenuButton
                      isActive={certification.slug === activeCertSlug}
                      render={<Link href={`/${certification.slug}`} />}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {certification.name}
                      </span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      {certification.questionCount}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 p-0">
          <SidebarGroupLabel>Practice</SidebarGroupLabel>
          <SidebarGroupContent className="px-2.5">
            <SidebarMenu>
              {practiceItems.length === 0 ? (
                <SidebarMenuItem>
                  <span className="text-muted-foreground px-2.5 text-sm">
                    Seed a certification first
                  </span>
                </SidebarMenuItem>
              ) : (
                practiceItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton render={<Link href={item.href} />}>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                    {item.count !== null && (
                      <SidebarMenuBadge
                        className={
                          item.label === 'Missed' ? 'text-destructive' : ''
                        }
                      >
                        {item.count}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export { AppSidebar }
export type { AppSidebarCertification, AppSidebarPracticeItem }
