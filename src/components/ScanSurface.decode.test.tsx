// @vitest-environment node

import { Resvg } from '@resvg/resvg-js'
import jsQR from 'jsqr'
import { QRCodeSVG } from 'qrcode.react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  QR_ERROR_CORRECTION_LEVEL,
  QR_QUIET_ZONE_MODULES,
} from '../lib/qr'
import { getLandmarkQrImageSettings } from '../lib/landmarkQrMark'

describe('ScanSurface QR read-back', () => {
  it('decodes the Taipei 101 branded SVG to the exact destination', () => {
    const destinationUrl =
      'https://example.org/landmark?theme=taipei-101&message=%E5%8F%B0%E5%8C%97'

    const svg = renderToStaticMarkup(
      <QRCodeSVG
        value={destinationUrl}
        size={292}
        level={QR_ERROR_CORRECTION_LEVEL}
        marginSize={QR_QUIET_ZONE_MODULES}
        bgColor="#ffffff"
        fgColor="#0b1020"
        imageSettings={getLandmarkQrImageSettings('taipei-101')}
      />,
    )

    const portableSvg = svg.replace(
      '<svg ',
      '<svg xmlns="http://www.w3.org/2000/svg" ',
    )
    const pixmap = new Resvg(portableSvg, {
      background: 'rgba(255, 255, 255, 1)',
      fitTo: { mode: 'width', value: 640 },
    }).render()
    const decoded = jsQR(
      new Uint8ClampedArray(pixmap.pixels),
      pixmap.width,
      pixmap.height,
      { inversionAttempts: 'dontInvert' },
    )

    expect(decoded?.data).toBe(destinationUrl)
  })
})
