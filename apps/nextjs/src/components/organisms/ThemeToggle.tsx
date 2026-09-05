'use client'

import { useSyncExternalStore } from 'react'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/atoms'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/molecules'

const themeOptions = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon }
] as const

const subscribeToNothing = () => () => {}
const isMountedOnClient = () => true
const isMountedDuringSsr = () => false

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  const mounted = useSyncExternalStore(
    subscribeToNothing,
    isMountedOnClient,
    isMountedDuringSsr
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="theme-toggle"
        render={<Button size="icon-sm" variant="ghost" />}
      >
        <SunIcon aria-hidden className="dark:hidden" />
        <MoonIcon aria-hidden className="hidden dark:inline" />
        <span className="sr-only">
          {mounted ? `Theme: ${theme}` : 'Change theme'}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
          {themeOptions.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden className="size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeToggle }
