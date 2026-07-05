import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function DELETE() {
  try {
    const payload = await getPayload({ config })

    const found = await payload.find({
      collection: 'products',
      where: { or: [{ family: { equals: null } }, { family: { equals: '' } }] },
      limit: 500,
    })

    let deleted = 0
    for (const doc of found.docs) {
      await payload.delete({ collection: 'products', id: doc.id })
      deleted++
    }

    return NextResponse.json({ deleted, message: `Removed ${deleted} products with no family.` })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
