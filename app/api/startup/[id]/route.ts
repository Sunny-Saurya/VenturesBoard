import { NextResponse } from 'next/server'

import { client } from '@/sanity/lib/client'
import { STARTUP_BY_ID_QUERY } from '@/sanity/lib/queries'

// Disable caching so newly created pitches are always returned
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params 

    // Fetch with useCdn: false to get fresh data
    const data = await client.withConfig({ useCdn: false }).fetch(STARTUP_BY_ID_QUERY, { id })

    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('api/startup/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
