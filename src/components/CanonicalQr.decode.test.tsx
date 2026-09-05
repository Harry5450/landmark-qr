// @vitest-environment node
import { Resvg } from '@resvg/resvg-js'
import jsQR from 'jsqr'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CanonicalQr } from './CanonicalQr'
import { createQrMatrix } from '../lib/qr'
import { scanPixelSize } from '../lib/scanLayout'

describe('canonical scan handoff', () => {
  it.each([
    ['https://example.com', 300],
    ['https://example.org/landmark?theme=taipei-101&message=%E5%8F%B0%E5%8C%97', 300],
    ['https://example.org/台北101?城市=台北', 300],
    ['https://example.org/?q=' + 'a'.repeat(300), 380],
  ])('decodes the actual SVG at display size: %s', (value, pixels) => {
    const svg = renderToStaticMarkup(
      <CanonicalQr value={value as string} mark="taipei-101" />,
    )
    const image = new Resvg(svg, { fitTo: { mode: 'width', value: pixels as number } }).render()
    expect(jsQR(new Uint8ClampedArray(image.pixels), image.width, image.height)?.data).toBe(value)
    const matrix = createQrMatrix(value as string)
    expect(svg).toContain(`viewBox="0 0 ${matrix.size + 8} ${matrix.size + 8}"`)
  })
  it('embeds a Taipei 101 mark only when the theme requests it', () => {
    const branded = renderToStaticMarkup(
      <CanonicalQr value="https://example.com" mark="taipei-101" />,
    )
    const plain = renderToStaticMarkup(
      <CanonicalQr value="https://example.com" />,
    )

    expect(branded).toContain('data-landmark-mark="taipei-101"')
    expect(branded).toContain('data:image/svg+xml')
    expect(plain).not.toContain('data-landmark-mark')
  })
  it('keeps the QR within the mobile scene and reserves space for controls', () => {
    for (const [w, h] of [[304, 500], [358, 500], [1100, 540]]) {
      const size = scanPixelSize(w, h)
      expect(size).toBeLessThanOrEqual(w - 40)
      expect((h - size) / 2).toBeGreaterThanOrEqual(100)
    }
  })
})
