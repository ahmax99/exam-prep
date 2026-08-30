import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export const GET = () =>
  NextResponse.json({
    keys: Object.keys(process.env).sort(),
    nodeVersion: process.version,
    platform: process.platform,
    now: new Date().toISOString()
  })
