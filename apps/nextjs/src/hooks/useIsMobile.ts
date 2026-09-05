'use client'

import { useSyncExternalStore } from 'react'

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
