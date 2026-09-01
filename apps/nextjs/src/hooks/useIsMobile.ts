'use client'

import { useSyncExternalStore } from 'react'

// Matches the app's own lg breakpoint (Tailwind's default 1024px) — the
// point where AppRail/BottomTabBar already switch — not shadcn's stock 768px,
// so the Sidebar organism's internal desktop/mobile split stays consistent
// with the rest of the layout.
const MOBILE_BREAKPOINT = 1024

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT
const getServerSnapshot = () => false

const useIsMobile = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

export { useIsMobile }
