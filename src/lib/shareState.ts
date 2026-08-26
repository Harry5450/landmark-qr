import { landmarks, type LandmarkId } from '../data/landmarks'
import { normalizeDestinationUrl } from './qr'

export const SHARE_STATE_VERSION = 1 as const
export const SHARE_HASH_PREFIX = '#/s/'
export const MAX_SHARE_PAYLOAD_LENGTH = 4096

export const SHARE_PRESET_IDS = ['collectible-daylight'] as const
export type SharePresetId = (typeof SHARE_PRESET_IDS)[number]
export const DEFAULT_PRESET_ID: SharePresetId = 'collectible-daylight'

export type ShareStateV1 = {
  v: typeof SHARE_STATE_VERSION
  url: string
  landmarkId: LandmarkId
  presetId: SharePresetId
}

export type ShareStateErrorCode =
  | 'invalid-state'
  | 'invalid-url'
  | 'invalid-landmark-id'
  | 'invalid-preset-id'
  | 'unsupported-version'
  | 'malformed-payload'
  | 'payload-too-long'
  | 'not-share-hash'
  | 'invalid-base-url'

export type ShareStateError = {
  code: ShareStateErrorCode
  message: string
}

export type ShareStateResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ShareStateError }

const landmarkIds = new Set<LandmarkId>(
  landmarks.filter(({ ready }) => ready).map(({ id }) => id),
)
const presetIds = new Set<string>(SHARE_PRESET_IDS)
const shareStateKeys = ['landmarkId', 'presetId', 'url', 'v']

function fail<T>(code: ShareStateErrorCode, message: string): ShareStateResult<T> {
  return { ok: false, error: { code, message } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateShareState(value: unknown): ShareStateResult<ShareStateV1> {
  if (!isRecord(value)) {
    return fail('invalid-state', 'Share state must be an object.')
  }

  const keys = Object.keys(value).sort()
  if (
    keys.length !== shareStateKeys.length ||
    keys.some((key, index) => key !== shareStateKeys[index])
  ) {
    return fail('invalid-state', 'Share state contains unexpected fields.')
  }

  if (value.v !== SHARE_STATE_VERSION) {
    return fail('unsupported-version', 'This share link version is not supported.')
  }

  if (typeof value.url !== 'string') {
    return fail('invalid-url', 'The shared destination URL is invalid.')
  }

  const normalizedUrl = normalizeDestinationUrl(value.url)
  if (!normalizedUrl.ok) {
    return fail('invalid-url', 'The shared destination URL is invalid.')
  }

  if (typeof value.landmarkId !== 'string' || !landmarkIds.has(value.landmarkId as LandmarkId)) {
    return fail('invalid-landmark-id', 'The shared landmark is not available.')
  }

  if (typeof value.presetId !== 'string' || !presetIds.has(value.presetId)) {
    return fail('invalid-preset-id', 'The shared visual preset is not available.')
  }

  return {
    ok: true,
    value: {
      v: SHARE_STATE_VERSION,
      url: normalizedUrl.value,
      landmarkId: value.landmarkId as LandmarkId,
      presetId: value.presetId as SharePresetId,
    },
  }
}

function encodeUtf8Base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeUtf8Base64Url(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    throw new Error('Invalid base64url payload')
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export function encodeShareState(state: unknown): ShareStateResult<string> {
  const validated = validateShareState(state)
  if (!validated.ok) return validated

  const payload = encodeUtf8Base64Url(JSON.stringify(validated.value))
  if (payload.length > MAX_SHARE_PAYLOAD_LENGTH) {
    return fail('payload-too-long', 'The share payload is too long.')
  }

  return { ok: true, value: payload }
}

export function decodeShareState(payload: string): ShareStateResult<ShareStateV1> {
  if (!payload || payload.length > MAX_SHARE_PAYLOAD_LENGTH) {
    return fail(
      payload.length > MAX_SHARE_PAYLOAD_LENGTH ? 'payload-too-long' : 'malformed-payload',
      payload.length > MAX_SHARE_PAYLOAD_LENGTH
        ? 'The share payload is too long.'
        : 'The share payload is malformed.',
    )
  }

  try {
    const decoded = decodeUtf8Base64Url(payload)
    return validateShareState(JSON.parse(decoded) as unknown)
  } catch {
    return fail('malformed-payload', 'The share payload is malformed.')
  }
}

export function buildShareHash(state: unknown): ShareStateResult<string> {
  const encoded = encodeShareState(state)
  if (!encoded.ok) return encoded

  return { ok: true, value: `${SHARE_HASH_PREFIX}${encoded.value}` }
}

export function decodeShareHash(hash: string): ShareStateResult<ShareStateV1> {
  if (!hash.startsWith(SHARE_HASH_PREFIX)) {
    return fail('not-share-hash', 'The URL does not contain a Landmark QR share hash.')
  }

  return decodeShareState(hash.slice(SHARE_HASH_PREFIX.length))
}

export function buildShareUrl(
  baseUrl: string | URL,
  state: unknown,
): ShareStateResult<string> {
  const hash = buildShareHash(state)
  if (!hash.ok) return hash

  let url: URL
  try {
    url = new URL(baseUrl.toString())
  } catch {
    return fail('invalid-base-url', 'The share page URL is invalid.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return fail('invalid-base-url', 'The share page URL must use HTTP or HTTPS.')
  }

  url.hash = hash.value
  return { ok: true, value: url.toString() }
}
