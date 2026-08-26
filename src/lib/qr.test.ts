import { describe, expect, it } from 'vitest'
import {
  MAX_DESTINATION_URL_LENGTH,
  QR_ERROR_CORRECTION_LEVEL,
  QR_QUIET_ZONE_MODULES,
  normalizeDestinationUrl,
} from './qr'

describe('QR domain policy', () => {
  it('keeps the scan-safe QR settings explicit', () => {
    expect(QR_ERROR_CORRECTION_LEVEL).toBe('H')
    expect(QR_QUIET_ZONE_MODULES).toBe(4)
  })

  it.each([
    ['https://example.com/path?x=1', 'https://example.com/path?x=1'],
    ['http://example.com', 'http://example.com/'],
    ['  example.com/docs  ', 'https://example.com/docs'],
    ['localhost:5173/landmark-qr', 'https://localhost:5173/landmark-qr'],
    ['example.com:8080/demo', 'https://example.com:8080/demo'],
  ])('normalizes an HTTP(S) destination: %s', (input, expected) => {
    expect(normalizeDestinationUrl(input)).toEqual({ ok: true, value: expected })
  })

  it('normalizes Unicode domains and preserves fragments', () => {
    const result = normalizeDestinationUrl('https://例子.測試/路徑#章節')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(
        'https://xn--fsqu00a.xn--g6w251d/%E8%B7%AF%E5%BE%91#%E7%AB%A0%E7%AF%80',
      )
    }
  })

  it('reports empty and malformed values', () => {
    expect(normalizeDestinationUrl('   ')).toMatchObject({
      ok: false,
      error: { code: 'empty' },
    })
    expect(normalizeDestinationUrl('https://?broken')).toMatchObject({
      ok: false,
      error: { code: 'malformed' },
    })
  })

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/a']) (
    'rejects unsupported schemes: %s',
    (input) => {
      expect(normalizeDestinationUrl(input)).toMatchObject({
        ok: false,
        error: { code: 'unsupported-protocol' },
      })
    },
  )

  it('accepts the maximum normalized length and rejects one character more', () => {
    const prefix = 'https://example.com/'
    const atLimit = `${prefix}${'a'.repeat(MAX_DESTINATION_URL_LENGTH - prefix.length)}`
    const overLimit = `${atLimit}a`

    expect(normalizeDestinationUrl(atLimit)).toEqual({ ok: true, value: atLimit })
    expect(normalizeDestinationUrl(overLimit)).toMatchObject({
      ok: false,
      error: { code: 'too-long' },
    })
  })
})
