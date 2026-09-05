import Link from 'next/link'

import {
  Bookmark,
  CircleDashed,
  GraduationCap,
  History,
  XCircle
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
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

const practiceIcons: Record<string, typeof Bookmark> = {
  Missed: XCircle,
  'Never seen': CircleDashed,
  Bookmarked: Bookmark,
  'Past runs': History
}

function AppSidebar({
  certifications,
  practiceItems
}: Readonly<AppSidebarProps>) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarTrigger className="self-end group-data-[collapsible=icon]:self-center" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Certifications</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {certifications.length === 0 ? (
                <SidebarMenuItem>
                  <span className="text-muted-foreground px-2 text-sm">
                    None seeded
                  </span>
                </SidebarMenuItem>
              ) : (
                certifications.map((certification) => (
                  <SidebarMenuItem key={certification.slug}>
                    <SidebarMenuButton
                      render={<Link href={`/${certification.slug}`} />}
                      tooltip={certification.name}
                    >
                      <GraduationCap />
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

        <SidebarGroup>
          <SidebarGroupLabel>Practice</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {practiceItems.length === 0 ? (
                <SidebarMenuItem>
                  <span className="text-muted-foreground px-2 text-sm">
                    Seed a certification first
                  </span>
                </SidebarMenuItem>
              ) : (
                practiceItems.map((item) => {
                  const Icon = practiceIcons[item.label] ?? GraduationCap
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        tooltip={item.label}
                      >
                        <Icon />
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                      </SidebarMenuButton>
                      {item.count !== null && (
                        <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }
export type { AppSidebarCertification, AppSidebarPracticeItem }
