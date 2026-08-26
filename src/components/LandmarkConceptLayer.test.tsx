import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LandmarkConceptLayer } from './LandmarkConceptLayer'

describe('LandmarkConceptLayer', () => {
  it('allows click activation while treating a horizontal drag as rotation', async () => {
    const onTransform = vi.fn()
    render(
      <LandmarkConceptLayer
        src="/taipei-101.png"
        landmarkName="Taipei 101"
        phase="explore"
        onTransform={onTransform}
      />,
    )

    const button = screen.getByRole('button', {
      name: 'Transform Taipei 101 into a QR code',
    })
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 100 })
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 180 })
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 180 })
    fireEvent.click(button)

    expect(onTransform).not.toHaveBeenCalled()
    expect(document.querySelector('.landmark-concept-layer__turntable')).toHaveStyle(
      '--concept-drag-yaw: 11.200000000000001deg',
    )

    await userEvent.click(button)
    expect(onTransform).toHaveBeenCalledTimes(1)
  })
})
