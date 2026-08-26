import { useCallback, useReducer } from 'react'

export type ExperiencePhase = 'explore' | 'revealing' | 'scan' | 'returning'

export type ExperiencePhaseEvent =
  | { type: 'REVEAL' }
  | { type: 'REVEAL_COMPLETE' }
  | { type: 'RETURN' }
  | { type: 'RETURN_COMPLETE' }
  | { type: 'SCENE_ERROR' }
  | { type: 'RESET' }

export function experiencePhaseReducer(
  phase: ExperiencePhase,
  event: ExperiencePhaseEvent,
): ExperiencePhase {
  if (event.type === 'SCENE_ERROR') return 'scan'
  if (event.type === 'RESET') return 'explore'

  switch (phase) {
    case 'explore':
      return event.type === 'REVEAL' ? 'revealing' : phase
    case 'revealing':
      if (event.type === 'REVEAL_COMPLETE') return 'scan'
      if (event.type === 'RETURN') return 'returning'
      return phase
    case 'scan':
      return event.type === 'RETURN' ? 'returning' : phase
    case 'returning':
      return event.type === 'RETURN_COMPLETE' ? 'explore' : phase
  }
}

export function useExperiencePhase(initialPhase: ExperiencePhase = 'explore') {
  const [phase, dispatch] = useReducer(experiencePhaseReducer, initialPhase)

  const reveal = useCallback(() => dispatch({ type: 'REVEAL' }), [])
  const completeReveal = useCallback(
    () => dispatch({ type: 'REVEAL_COMPLETE' }),
    [],
  )
  const returnToExplore = useCallback(() => dispatch({ type: 'RETURN' }), [])
  const completeReturn = useCallback(
    () => dispatch({ type: 'RETURN_COMPLETE' }),
    [],
  )
  const failToScan = useCallback(() => dispatch({ type: 'SCENE_ERROR' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    phase,
    reveal,
    completeReveal,
    returnToExplore,
    completeReturn,
    failToScan,
    reset,
  }
}
