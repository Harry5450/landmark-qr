import type { LandmarkId } from '../data/landmarks'
import { QR_QUIET_ZONE_MODULES, createQrMatrix } from './qr'

export type VoxelCell = {
  column: number
  row: number
  /** Fixed world X; never changes between explore and scan. */
  x: number
  /** Fixed world Z; never changes between explore and scan. */
  z: number
  /** Height in explore mode (building form). */
  exploreHeight: number
  /** Height in scan mode (flat QR module). */
  scanHeight: number
  /** True when the cell belongs to the landmark silhouette in explore mode. */
  isTower: boolean
}

export type VoxelLayout = {
  matrixSize: number
  moduleSize: number
  planeSize: number
  maxExploreHeight: number
  cells: VoxelCell[]
}

export type CreateVoxelLayoutOptions = {
  value: string
  landmarkId: LandmarkId
  moduleSize?: number
}

export const VOXEL_QR_EXTENT = 7.2
export const VOXEL_SCAN_HEIGHT = 0.12
export const VOXEL_GROUND_HEIGHT = 0.06

type TowerTier = { halfWidth: number; height: number }

/**
 * Taipei 101 silhouette bands, tested outermost-first.
 * A cell falls into the widest band whose half-width contains it, so the
 * height naturally steps up toward the center (tiered tower profile).
 */
const TAIPEI_101_TIERS: readonly TowerTier[] = [
  { halfWidth: 0.52, height: 0.55 },
  { halfWidth: 0.44, height: 1.05 },
  { halfWidth: 0.38, height: 1.6 },
  { halfWidth: 0.33, height: 2.15 },
  { halfWidth: 0.28, height: 2.7 },
  { halfWidth: 0.24, height: 3.25 },
  { halfWidth: 0.2, height: 3.8 },
  { halfWidth: 0.16, height: 4.35 },
  { halfWidth: 0.12, height: 4.9 },
  { halfWidth: 0.07, height: 5.6 },
  { halfWidth: 0.03, height: 6.2 },
]

function taipei101ExploreHeight(nx: number, nz: number): number {
  for (const tier of TAIPEI_101_TIERS) {
    if (Math.abs(nx) < tier.halfWidth && Math.abs(nz) < tier.halfWidth) {
      return tier.height
    }
  }
  return 0
}

function genericTowerExploreHeight(nx: number, nz: number): number {
  const radius = Math.sqrt(nx * nx + nz * nz)
  if (radius > 0.45) return 0
  return Math.max(0.15, 4.2 * (1 - radius / 0.45))
}

function exploreHeightFor(
  landmarkId: LandmarkId,
  nx: number,
  nz: number,
): number {
  if (landmarkId === 'taipei-101') return taipei101ExploreHeight(nx, nz)
  return genericTowerExploreHeight(nx, nz)
}

export function createVoxelLayout({
  value,
  landmarkId,
  moduleSize,
}: CreateVoxelLayoutOptions): VoxelLayout {
  const matrix = createQrMatrix(value)
  const resolvedModuleSize =
    moduleSize ??
    Math.min(
      0.18,
      VOXEL_QR_EXTENT / (matrix.size + QR_QUIET_ZONE_MODULES * 2),
    )
  const center = (matrix.size - 1) / 2

  const cells: VoxelCell[] = matrix.darkCells.map(([column, row]) => {
    const x = (column - center) * resolvedModuleSize
    const z = (row - center) * resolvedModuleSize
    const nx = (column - center) / Math.max(center, 1)
    const nz = (row - center) / Math.max(center, 1)
    const rawHeight = exploreHeightFor(landmarkId, nx, nz)
    const isTower = rawHeight > 0.1
    const exploreHeight = isTower ? rawHeight : VOXEL_GROUND_HEIGHT

    return {
      column,
      row,
      x,
      z,
      exploreHeight,
      scanHeight: VOXEL_SCAN_HEIGHT,
      isTower,
    }
  })

  return {
    matrixSize: matrix.size,
    moduleSize: resolvedModuleSize,
    planeSize:
      (matrix.size + QR_QUIET_ZONE_MODULES * 2) * resolvedModuleSize,
    maxExploreHeight: 6.2,
    cells,
  }
}
