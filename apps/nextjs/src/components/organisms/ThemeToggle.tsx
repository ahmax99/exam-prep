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
        render={
          <Button
            className="group/theme hover:bg-transparent"
            size="icon"
            variant="ghost"
          />
        }
      >
        {/* The visible control is a 32px box, but the tappable target stays
            44px — the box is nested rather than sized down. */}
        <span className="border-border bg-card group-hover/theme:bg-muted flex size-8 items-center justify-center rounded-[4px] transition-colors max-lg:border-none max-lg:bg-transparent lg:border">
          <SunIcon aria-hidden className="size-[15px] dark:hidden" />
          <MoonIcon aria-hidden className="hidden size-[15px] dark:inline" />
        </span>
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
