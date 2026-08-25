import type { ComponentType } from 'react'
import type { LandmarkId } from '../data/landmarks'
import { EiffelTower } from '../landmarks/procedural/EiffelTower'
import { SydneyOperaHouse } from '../landmarks/procedural/SydneyOperaHouse'
import { Taipei101 } from '../landmarks/procedural/Taipei101'

type LandmarkModelProps = {
  id: LandmarkId
}

type ProceduralLandmarkComponent = ComponentType

const proceduralLandmarks: Partial<Record<LandmarkId, ProceduralLandmarkComponent>> = {
  'taipei-101': Taipei101,
  'eiffel-tower': EiffelTower,
  'sydney-opera-house': SydneyOperaHouse,
}

/** Shared procedural fallback boundary. It contains no QR generation logic. */
export function LandmarkModel({ id }: LandmarkModelProps) {
  const Model = proceduralLandmarks[id]
  return Model ? <Model /> : null
}
