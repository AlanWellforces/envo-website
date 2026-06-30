import { LegalPage } from '@/components/legal/LegalPage'
import { RichTextRenderer } from '@/components/blog/RichTextRenderer'
import type { CmsPage } from '@/lib/cms-pages'

function formatUpdated(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function CmsPageView({ page }: { page: CmsPage }) {
  return (
    <LegalPage title={page.title} updated={formatUpdated(page.updatedAt)}>
      <RichTextRenderer doc={page.content} />
    </LegalPage>
  )
}
