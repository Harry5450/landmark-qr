import { forwardRef, type SVGProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QR_ERROR_CORRECTION_LEVEL, QR_QUIET_ZONE_MODULES } from '../lib/qr'
import { ScanSurface } from './ScanSurface'

type MockQrProps = SVGProps<SVGSVGElement> & {
  value: string
  level: string
  marginSize: number
  title?: string
}

vi.mock('qrcode.react', () => ({
  QRCodeSVG: forwardRef<SVGSVGElement, MockQrProps>(
    ({ value, level, marginSize, title, ...props }, ref) => (
      <svg
        ref={ref}
        data-value={value}
        data-level={level}
        data-margin-size={marginSize}
        aria-label={title}
        {...props}
      />
    ),
  ),
}))

const destinationUrl = 'https://example.com/article'
const shareUrl = 'https://example.com/landmark-qr/#/s/state'

describe('ScanSurface', () => {
  it('renders a WebGL-independent canonical QR with explicit safety settings', () => {
    render(
      <ScanSurface
        destinationUrl={destinationUrl}
        landmarkName="Taipei 101"
        shareUrl={shareUrl}
        onClose={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Scan QR for Taipei 101' }),
    ).toBeInTheDocument()

    const qr = screen.getByLabelText(`QR code for ${destinationUrl}`)
    expect(qr).toHaveAttribute('data-value', destinationUrl)
    expect(qr).toHaveAttribute('data-level', QR_ERROR_CORRECTION_LEVEL)
    expect(qr).toHaveAttribute(
      'data-margin-size',
      String(QR_QUIET_ZONE_MODULES),
    )
    expect(screen.getByLabelText('Destination URL')).toHaveTextContent(destinationUrl)
    expect(document.querySelector('canvas')).not.toBeInTheDocument()
    expect(document.body).toHaveStyle({ overflow: 'hidden' })
  })

  it('focuses the close control and supports close, backdrop, return, and Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <ScanSurface
        destinationUrl={destinationUrl}
        landmarkName="Taipei 101"
        shareUrl={shareUrl}
        onClose={onClose}
      />,
    )

    const closeButton = screen.getByRole('button', { name: 'Close scan mode' })
    expect(closeButton).toHaveFocus()

    await user.click(closeButton)
    await user.click(screen.getByRole('button', { name: 'Dismiss scan mode' }))
    await user.click(screen.getByRole('button', { name: 'Return to 3D' }))
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(4)
  })

  it('downloads the exact rendered SVG surface', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:canonical-qr')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    render(
      <ScanSurface
        destinationUrl={destinationUrl}
        landmarkName="Taipei 101"
        shareUrl={shareUrl}
        onClose={vi.fn()}
        downloadFileName="taipei-101-qr.svg"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Download QR' }))

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('image/svg+xml;charset=utf-8')
    expect(click).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'QR code downloaded for the destination URL.',
    )
  })
})
