import { describe, expect, it } from 'vitest'
import {
  LANDMARK_RECESS_PORTION,
  MAX_TRANSITION_DELTA_SECONDS,
  REVEAL_DURATION_SECONDS,
  RETURN_DURATION_SECONDS,
  sampleRevealTimeline,
} from './SceneCameraController'

describe('shared reveal timeline', () => {
  it('keeps reveal and return inside the authored duration envelope', () => {
    expect(REVEAL_DURATION_SECONDS).toBeGreaterThanOrEqual(1.35)
    expect(REVEAL_DURATION_SECONDS).toBeLessThanOrEqual(1.6)
    expect(RETURN_DURATION_SECONDS).toBe(REVEAL_DURATION_SECONDS)
    expect(MAX_TRANSITION_DELTA_SECONDS).toBe(1 / 20)
  })

  it('clamps samples and exposes exact terminal states', () => {
    expect(sampleRevealTimeline(-1)).toMatchObject({
      progress: 0,
      cameraProgress: 0,
      landmarkProgress: 0,
      terminal: false,
    })
    expect(sampleRevealTimeline(2)).toMatchObject({
      progress: 1,
      cameraProgress: 1,
      landmarkProgress: 1,
      terminal: true,
    })
  })

  it('recedes the landmark during the first 45 percent without an early hide', () => {
    const beforeBoundary = sampleRevealTimeline(LANDMARK_RECESS_PORTION - 0.01)
    const atBoundary = sampleRevealTimeline(LANDMARK_RECESS_PORTION)

    expect(beforeBoundary.landmarkProgress).toBeGreaterThan(0)
    expect(beforeBoundary.landmarkProgress).toBeLessThan(1)
    expect(beforeBoundary.terminal).toBe(false)
    expect(atBoundary.landmarkProgress).toBe(1)
    expect(atBoundary.terminal).toBe(false)
  })

  it('provides a monotonic camera handoff and an exact reverse sample', () => {
    const samples = [0, 0.2, 0.5, 0.8, 1].map(sampleRevealTimeline)

    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index].cameraProgress).toBeGreaterThanOrEqual(
        samples[index - 1].cameraProgress,
      )
    }

    const returnProgress = 0.73
    const reverseSample = sampleRevealTimeline(1 - returnProgress)
    expect(reverseSample).toEqual(sampleRevealTimeline(0.27))
  })
})
