import QRCode from 'qrcode'

export const QR_ERROR_CORRECTION_LEVEL = 'H' as const
export const QR_QUIET_ZONE_MODULES = 4
export const MAX_DESTINATION_URL_LENGTH = 2048

export type QrDarkCell = readonly [column: number, row: number]

export type QrMatrix = {
  size: number
  darkCells: QrDarkCell[]
}

export function createQrMatrix(value: string): QrMatrix {
  const qr = QRCode.create(value, {
    errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL,
  })
  const darkCells: QrDarkCell[] = []

  for (let row = 0; row < qr.modules.size; row += 1) {
    for (let column = 0; column < qr.modules.size; column += 1) {
      if (qr.modules.get(row, column)) darkCells.push([column, row])
    }
  }

  return { size: qr.modules.size, darkCells }
}

export type DestinationUrlErrorCode =
  | 'empty'
  | 'malformed'
  | 'unsupported-protocol'
  | 'too-long'

export type DestinationUrlError = {
  code: DestinationUrlErrorCode
  message: string
}

export type DestinationUrlResult =
  | { ok: true; value: string }
  | { ok: false; error: DestinationUrlError }

const EXPLICIT_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i
const NON_HIERARCHICAL_SCHEME = /^[a-z][a-z\d+.-]*:(?!\d)/i
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function normalizeDestinationUrl(value: string): DestinationUrlResult {
  const trimmed = value.trim()

  if (!trimmed) {
    return {
      ok: false,
      error: {
        code: 'empty',
        message: 'Enter a destination URL.',
      },
    }
  }

  if (!EXPLICIT_SCHEME.test(trimmed) && NON_HIERARCHICAL_SCHEME.test(trimmed)) {
    return {
      ok: false,
      error: {
        code: 'unsupported-protocol',
        message: 'Only HTTP and HTTPS destinations are supported.',
      },
    }
  }

  const candidate = EXPLICIT_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return {
      ok: false,
      error: {
        code: 'malformed',
        message: 'Enter a valid destination URL.',
      },
    }
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      error: {
        code: 'unsupported-protocol',
        message: 'Only HTTP and HTTPS destinations are supported.',
      },
    }
  }

  if (!parsed.hostname) {
    return {
      ok: false,
      error: {
        code: 'malformed',
        message: 'Enter a valid destination URL.',
      },
    }
  }

  const normalized = parsed.toString()
  if (normalized.length > MAX_DESTINATION_URL_LENGTH) {
    return {
      ok: false,
      error: {
        code: 'too-long',
        message: `Destination URLs must be ${MAX_DESTINATION_URL_LENGTH} characters or fewer.`,
      },
    }
  }

  return { ok: true, value: normalized }
}
