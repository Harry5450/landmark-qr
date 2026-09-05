import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InlineScanLayer } from './InlineScanLayer'

const destinationUrl = 'https://example.com/destination'
const shareUrl = 'https://example.com/landmark-qr/#/s/state'

function renderLayer(onReturn = vi.fn(), visible = true) {
  return {
    onReturn,
    ...render(
      <InlineScanLayer
        destinationUrl={destinationUrl}
        landmarkName="Taipei 101"
        qrMark="taipei-101"
        shareUrl={shareUrl}
        downloadFileName="taipei-101.svg"
        onReturn={onReturn}
        visible={visible}
      />,
    ),
  }
}

describe('InlineScanLayer', () => {
  it('renders no modal or backdrop and exposes a canonical destination QR', () => {
    renderLayer()

    expect(
      screen.getByRole('region', { name: 'Taipei 101 has become your QR' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.scan-backdrop')).not.toBeInTheDocument()

    const qr = screen.getByLabelText(`QR code for ${destinationUrl}`)
    expect(qr).toHaveAttribute('data-value', destinationUrl)
    expect(qr).not.toHaveAttribute('data-value', shareUrl)
    expect(qr).toHaveAttribute('shape-rendering', 'crispEdges')
    expect(qr.querySelector('image')).toHaveAttribute(
      'data-landmark-mark',
      'taipei-101',
    )
    expect(qr.querySelectorAll('path')).toHaveLength(2)
  })

  it('returns from the clickable QR, Return button, and Escape', async () => {
    const { onReturn } = renderLayer()
    const user = userEvent.setup()
    const qrButton = screen.getByRole('button', {
      name: 'Return to 3D from QR code',
    })

    expect(qrButton).toHaveFocus()
    await user.click(qrButton)
    await user.click(screen.getByRole('button', { name: 'Return to 3D' }))
    await user.keyboard('{Escape}')

    expect(onReturn).toHaveBeenCalledTimes(3)
  })

  it('does not render or listen for Escape when hidden', async () => {
    const { onReturn } = renderLayer(vi.fn(), false)

    expect(screen.queryByTestId('inline-scan-layer')).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onReturn).not.toHaveBeenCalled()
  })

  it('downloads the rendered destination QR rather than the share URL', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:inline-qr')
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

    renderLayer()
    await userEvent.click(screen.getByRole('button', { name: 'Download QR' }))

    expect(
      screen.getByLabelText(`QR code for ${destinationUrl}`),
    ).toHaveAttribute('data-value', destinationUrl)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'QR code downloaded for the destination URL.',
    )
  })
})
