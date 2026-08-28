import { connection } from 'next/server'
import { Suspense } from 'react'

async function Connection() {
  await connection()
  return null
}

function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  )
}

export { DynamicMarker }
