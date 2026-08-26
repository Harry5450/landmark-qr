import { describe, expect, it } from 'vitest'
import {
  experiencePhaseReducer,
  type ExperiencePhase,
  type ExperiencePhaseEvent,
} from './useExperiencePhase'

function transition(
  phase: ExperiencePhase,
  ...events: ExperiencePhaseEvent[]
): ExperiencePhase {
  return events.reduce(experiencePhaseReducer, phase)
}

describe('experiencePhaseReducer', () => {
  it('runs the reveal and return lifecycle', () => {
    expect(
      transition(
        'explore',
        { type: 'REVEAL' },
        { type: 'REVEAL_COMPLETE' },
        { type: 'RETURN' },
        { type: 'RETURN_COMPLETE' },
      ),
    ).toBe('explore')
  })

  it('ignores repeated events that would overlap a transition', () => {
    expect(transition('revealing', { type: 'REVEAL' })).toBe('revealing')
    expect(transition('returning', { type: 'RETURN' })).toBe('returning')
    expect(transition('explore', { type: 'REVEAL_COMPLETE' })).toBe('explore')
  })

  it('can interrupt an in-progress reveal with a return', () => {
    expect(transition('revealing', { type: 'RETURN' })).toBe('returning')
  })

  it('jumps directly to the canonical scan surface after a scene error', () => {
    const phases: ExperiencePhase[] = [
      'explore',
      'revealing',
      'scan',
      'returning',
    ]

    for (const phase of phases) {
      expect(transition(phase, { type: 'SCENE_ERROR' })).toBe('scan')
    }
  })

  it('resets any phase for a newly generated experience', () => {
    expect(transition('scan', { type: 'RESET' })).toBe('explore')
    expect(transition('returning', { type: 'RESET' })).toBe('explore')
  })
})
