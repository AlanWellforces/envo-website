import { beforeAll, describe, expect, it, vi } from 'vitest'

// toLegacy() fetches a token and the certification records; answer both offline.
beforeAll(() => {
  process.env.NEWPIM_CLIENT_ID = 'test'
  process.env.NEWPIM_CLIENT_SECRET = 'test'
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL) => {
    const body = String(url).includes('/auth/token') ? { access_token: 't', expires_in: 3600 } : { items: [] }
    return new Response(JSON.stringify(body), { status: 200 })
  }))
})
const load = () => import('./newpim')

describe('toLegacy site pins', () => {
  it('keeps a pinned SKU on its previous series and family', async () => {
    const p = { identifier: 'SR-2422NK2-DA2', family: 'psu_led_controller', enabled: true,
      values: { series: [{ locale: null, channel: null, data: 'envo_dali' }] } }
    const { toLegacy } = await load()
    const out = await toLegacy(p)
    expect(out.values.series[0].data).toBe('sr_triac')
    expect(out.family).toBe('switch_switch_module')
  })
  it('leaves unpinned SKUs alone', async () => {
    const p = { identifier: 'SR-DA9033A-MW', family: 'psu_led_controller', enabled: true,
      values: { series: [{ locale: null, channel: null, data: 'envo_dali' }] } }
    const { toLegacy } = await load()
    const out = await toLegacy(p)
    expect(out.values.series[0].data).toBe('envo_dali')
    expect(out.family).toBe('psu_led_controller')
  })
  it('pins exactly the 14 SKUs hidden by the first sync', async () => {
    const { SITE_PINS } = await load()
    expect(Object.keys(SITE_PINS)).toHaveLength(14)
  })
})
