import { describe, expect, it } from 'vitest'
import { landmarks } from '../data/landmarks'
import {
  DEFAULT_PRESET_ID,
  MAX_SHARE_PAYLOAD_LENGTH,
  SHARE_HASH_PREFIX,
  buildShareHash,
  buildShareUrl,
  decodeShareHash,
  decodeShareState,
  encodeShareState,
  type ShareStateV1,
} from './shareState'

const stateFor = (landmarkId: ShareStateV1['landmarkId']): ShareStateV1 => ({
  v: 1,
  url: 'https://example.com/path?campaign=summer#details',
  landmarkId,
  presetId: DEFAULT_PRESET_ID,
})

function encodeRaw(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

describe('share-state codec', () => {
  it.each(landmarks.filter(({ ready }) => ready).map(({ id }) => [id]))(
    'round-trips the ready landmark %s',
    (landmarkId) => {
      const state = stateFor(landmarkId)
      const encoded = encodeShareState(state)

      expect(encoded.ok).toBe(true)
      if (encoded.ok) expect(decodeShareState(encoded.value)).toEqual({ ok: true, value: state })
    },
  )

  it('builds a GitHub Pages hash without losing the Vite base path or query', () => {
    const state = stateFor('taipei-101')
    const result = buildShareUrl(
      'https://harry5450.github.io/landmark-qr/?source=app#old',
      state,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const url = new URL(result.value)
    expect(url.pathname).toBe('/landmark-qr/')
    expect(url.search).toBe('?source=app')
    expect(url.hash.startsWith(SHARE_HASH_PREFIX)).toBe(true)
    expect(decodeShareHash(url.hash)).toEqual({ ok: true, value: state })
  })

  it('builds and decodes a standalone share hash', () => {
    const state = stateFor('eiffel-tower')
    const hash = buildShareHash(state)

    expect(hash.ok).toBe(true)
    if (hash.ok) expect(decodeShareHash(hash.value)).toEqual({ ok: true, value: state })
  })

  it('canonicalizes a valid destination before serializing it', () => {
    const state = { ...stateFor('taipei-101'), url: 'example.com' }
    const encoded = encodeShareState(state)

    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      expect(decodeShareState(encoded.value)).toMatchObject({
        ok: true,
        value: { url: 'https://example.com/' },
      })
    }
  })

  it.each([
    [{ ...stateFor('taipei-101'), v: 2 }, 'unsupported-version'],
    [{ ...stateFor('taipei-101'), landmarkId: 'unknown-landmark' }, 'invalid-landmark-id'],
    [{ ...stateFor('taipei-101'), landmarkId: 'statue-of-liberty' }, 'invalid-landmark-id'],
    [{ ...stateFor('taipei-101'), presetId: 'unknown-preset' }, 'invalid-preset-id'],
    [{ ...stateFor('taipei-101'), url: 'javascript:alert(1)' }, 'invalid-url'],
    [{ ...stateFor('taipei-101'), script: '<script>alert(1)</script>' }, 'invalid-state'],
  ])('rejects unsafe or unsupported decoded state', (rawState, errorCode) => {
    expect(decodeShareState(encodeRaw(rawState))).toMatchObject({
      ok: false,
      error: { code: errorCode },
    })
  })

  it.each(['not base64!', 'a', '____'])('handles malformed payloads without throwing: %s', (payload) => {
    expect(() => decodeShareState(payload)).not.toThrow()
    expect(decodeShareState(payload)).toMatchObject({
      ok: false,
      error: { code: 'malformed-payload' },
    })
  })

  it('rejects oversized payloads before decoding', () => {
    expect(decodeShareState('a'.repeat(MAX_SHARE_PAYLOAD_LENGTH + 1))).toMatchObject({
      ok: false,
      error: { code: 'payload-too-long' },
    })
  })

  it('rejects non-share hashes and unsafe base URLs', () => {
    const state = stateFor('taipei-101')

    expect(decodeShareHash('#/other/value')).toMatchObject({
      ok: false,
      error: { code: 'not-share-hash' },
    })
    expect(buildShareUrl('javascript:alert(1)', state)).toMatchObject({
      ok: false,
      error: { code: 'invalid-base-url' },
    })
  })
})
