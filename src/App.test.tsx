import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { buildShareHash, DEFAULT_PRESET_ID, SHARE_STATE_VERSION } from './lib/shareState'

vi.mock('./components/LandmarkScene', () => ({
  LandmarkScene: (props: {
    phase: string
    onRevealRequest: () => void
    onRevealComplete: () => void
    onReturnComplete: () => void
    onSceneUnavailable: () => void
  }) => (
    <div data-testid="landmark-scene" data-phase={props.phase}>
      <button type="button" onClick={props.onRevealRequest}>
        Mock landmark
      </button>
      <button type="button" onClick={props.onRevealComplete}>
        Finish reveal
      </button>
      <button type="button" onClick={props.onReturnComplete}>
        Finish return
      </button>
      <button type="button" onClick={props.onSceneUnavailable}>
        Fail scene
      </button>
    </div>
  ),
}))

vi.mock('./components/InlineScanLayer', () => ({
  InlineScanLayer: (props: {
    destinationUrl: string
    landmarkName: string
    shareUrl: string
    onReturn: () => void
    visible: boolean
  }) =>
    props.visible ? (
      <div role="region" aria-label="Mock inline scan layer">
        <span>{props.destinationUrl}</span>
        <span>{props.landmarkName}</span>
        <span data-testid="share-url">{props.shareUrl}</span>
        <button type="button" onClick={props.onReturn}>
          Return to 3D
        </button>
      </div>
    ) : null,
}))

describe('App integration', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/landmark-qr/')
  })

  it('validates destinations before updating the QR experience', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText('Destination URL')
    await user.clear(input)
    await user.type(input, 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only HTTP and HTTPS destinations are supported.',
    )
  })

  it('runs reveal, scan, and return as explicit phases', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Transform to QR' }))
    expect(screen.getByTestId('landmark-scene')).toHaveAttribute(
      'data-phase',
      'revealing',
    )

    await user.click(screen.getByRole('button', { name: 'Finish reveal' }))
    expect(
      screen.getByRole('region', { name: 'Mock inline scan layer' }),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Return to 3D' }))
    expect(
      screen.queryByRole('region', { name: 'Mock inline scan layer' }),
    ).toBeNull()
    expect(screen.getByTestId('landmark-scene')).toHaveAttribute(
      'data-phase',
      'returning',
    )

    await user.click(screen.getByRole('button', { name: 'Finish return' }))
    expect(screen.getByTestId('landmark-scene')).toHaveAttribute(
      'data-phase',
      'explore',
    )
  })

  it('restores a valid GitHub Pages share hash on first load', () => {
    const hash = buildShareHash({
      v: SHARE_STATE_VERSION,
      url: 'https://example.org/shared',
      landmarkId: 'eiffel-tower',
      presetId: DEFAULT_PRESET_ID,
    })
    expect(hash.ok).toBe(true)
    if (!hash.ok) return

    window.history.replaceState(null, '', `/landmark-qr/${hash.value}`)
    render(<App />)

    expect(screen.getByLabelText('Destination URL')).toHaveValue(
      'https://example.org/shared',
    )
    expect(screen.getByRole('heading', { name: 'Eiffel Tower' })).toBeVisible()
  })

  it('keeps the landmark visible before offering scan fallback without WebGL', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Fail scene' }))
    expect(
      screen.queryByRole('region', { name: 'Mock inline scan layer' }),
    ).toBeNull()
    expect(screen.getByTestId('landmark-scene')).toHaveAttribute(
      'data-phase',
      'explore',
    )

    await user.click(screen.getByRole('button', { name: 'Transform to QR' }))
    expect(
      screen.getByRole('region', { name: 'Mock inline scan layer' }),
    ).toBeVisible()
  })
})
