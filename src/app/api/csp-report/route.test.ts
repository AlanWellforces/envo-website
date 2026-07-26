import { describe, expect, test, vi } from 'vitest'
import { POST } from './route'

function report(body: unknown, type = 'application/csp-report') {
  return new Request('http://localhost/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': type },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/csp-report', () => {
  test('logs a compact line and returns 204', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await POST(
      report({
        'csp-report': {
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.example.com/x.js',
          'document-uri': 'https://envolighting.com/products',
        },
      }),
    )
    expect(res.status).toBe(204)
    expect(warn).toHaveBeenCalledWith(
      '[csp-report]',
      expect.stringContaining('script-src'),
    )
    warn.mockRestore()
  })

  test('malformed body still returns 204 (never 5xx a beacon)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await POST(report('not-json'))
    expect(res.status).toBe(204)
    warn.mockRestore()
  })

  test('oversized body is dropped with 204', async () => {
    const res = await POST(report('x'.repeat(20_000)))
    expect(res.status).toBe(204)
  })
})
