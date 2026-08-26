import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareActions } from './ShareActions'

const destinationUrl = 'https://example.com/article'
const shareUrl = 'https://example.com/landmark-qr/#/s/state'

function setNavigatorMethod(name: 'clipboard' | 'share', value: unknown) {
  Object.defineProperty(window.navigator, name, {
    configurable: true,
    value,
  })
}

afterEach(() => {
  setNavigatorMethod('clipboard', undefined)
  setNavigatorMethod('share', undefined)
  vi.restoreAllMocks()
})

describe('ShareActions', () => {
  it('copies the interactive share URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigatorMethod('clipboard', { writeText })

    render(
      <ShareActions
        shareUrl={shareUrl}
        destinationUrl={destinationUrl}
        onDownloadQr={vi.fn()}
        onReturn={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(writeText).toHaveBeenCalledWith(shareUrl)
    expect(screen.getByRole('status')).toHaveTextContent('Share link copied.')
  })

  it('uses the native share sheet when it is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNavigatorMethod('share', share)

    render(
      <ShareActions
        shareUrl={shareUrl}
        destinationUrl={destinationUrl}
        onDownloadQr={vi.fn()}
        onReturn={vi.fn()}
        shareTitle="Taipei 101 Landmark QR"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Share' }))

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Taipei 101 Landmark QR',
        url: shareUrl,
      }),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Share sheet opened.')
  })

  it('copies the share URL when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigatorMethod('clipboard', { writeText })
    setNavigatorMethod('share', undefined)

    render(
      <ShareActions
        shareUrl={shareUrl}
        destinationUrl={destinationUrl}
        onDownloadQr={vi.fn()}
        onReturn={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Share' }))

    expect(writeText).toHaveBeenCalledWith(shareUrl)
    expect(screen.getByRole('status')).toHaveTextContent('copied instead')
  })

  it('exposes download and return actions', async () => {
    const onDownloadQr = vi.fn()
    const onReturn = vi.fn()

    render(
      <ShareActions
        shareUrl={shareUrl}
        destinationUrl={destinationUrl}
        onDownloadQr={onDownloadQr}
        onReturn={onReturn}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Download QR' }))
    await userEvent.click(screen.getByRole('button', { name: 'Return to 3D' }))

    expect(onDownloadQr).toHaveBeenCalledTimes(1)
    expect(onReturn).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Download encodes the destination/)).toHaveTextContent(
      destinationUrl,
    )
  })
})
