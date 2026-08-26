import type { LandmarkId } from '../data/landmarks'
import {
  QR_QUIET_ZONE_MODULES,
  createQrMatrix,
  type QrDarkCell,
} from './qr'

export type MorphVector3 = readonly [x: number, y: number, z: number]

export type MorphPoint = {
  cell: QrDarkCell
  start: MorphVector3
  flat: MorphVector3
  target: MorphVector3
  startScale: MorphVector3
  flatScale: MorphVector3
  targetScale: MorphVector3
  delay: number
}

export type MorphLayout = {
  matrixSize: number
  moduleSize: number
  planeSize: number
  points: MorphPoint[]
}

export type CreateMorphLayoutOptions = {
  value: string
  landmarkId: LandmarkId
  moduleSize?: number
}

export const MORPH_MAX_MODULE_SIZE = 0.18
export const MORPH_QR_EXTENT = 7.2
export const MORPH_TARGET_Y = 0.09
export const MORPH_MAX_DELAY = 0.06

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function squareShell(width: number, random: () => number): [number, number] {
  const face = Math.floor(random() * 4)
  const offset = (random() * 2 - 1) * width

  if (face === 0) return [width, offset]
  if (face === 1) return [-width, offset]
  if (face === 2) return [offset, width]
  return [offset, -width]
}

function taipei101Point(
  index: number,
  count: number,
  random: () => number,
): MorphVector3 {
  const normalized = (index + 0.5) / Math.max(count, 1)
  let y: number
  let halfWidth: number

  if (normalized < 0.1) {
    const local = normalized / 0.1
    y = 0.12 + local * 0.52
    halfWidth = 1.08 - local * 0.1
  } else if (normalized < 0.86) {
    const towerProgress = (normalized - 0.1) / 0.76
    const tierFloat = towerProgress * 8
    const tier = Math.min(7, Math.floor(tierFloat))
    const tierProgress = tierFloat - tier
    y = 0.64 + towerProgress * 4.72
    const tierWidth = 0.93 - tier * 0.072
    halfWidth = tierWidth * (0.72 + 0.28 * (1 - tierProgress))
  } else {
    const spireProgress = (normalized - 0.86) / 0.14
    y = 5.36 + spireProgress * 1.5
    halfWidth = Math.max(0.035, 0.2 * (1 - spireProgress))
  }

  const [x, z] = squareShell(halfWidth, random)
  const facadeJitter = Math.min(halfWidth * 0.08, 0.035)
  return [
    x + (random() - 0.5) * facadeJitter,
    y,
    z + (random() - 0.5) * facadeJitter,
  ]
}

function genericTowerPoint(
  index: number,
  count: number,
  random: () => number,
): MorphVector3 {
  const normalized = (index + 0.5) / Math.max(count, 1)
  const podium = normalized < 0.14
  const towerProgress = podium ? normalized / 0.14 : (normalized - 0.14) / 0.86
  const halfWidth = podium
    ? 1.2 - towerProgress * 0.18
    : Math.max(0.12, 0.82 * Math.pow(1 - towerProgress, 0.72))
  const y = podium ? 0.12 + towerProgress * 0.54 : 0.66 + towerProgress * 5.25
  const [x, z] = squareShell(halfWidth, random)
  return [x, y, z]
}

function operaHousePoint(
  index: number,
  count: number,
  random: () => number,
): MorphVector3 {
  const normalized = (index + 0.5) / Math.max(count, 1)
  const shell = Math.min(4, Math.floor(normalized * 5))
  const local = normalized * 5 - shell
  const shellCenter = (shell - 2) * 0.74
  const angle = Math.PI * (0.08 + local * 0.84)
  const radius = 0.78 + shell * 0.08
  const x = shellCenter + Math.cos(angle) * radius * 0.72
  const y = 0.28 + Math.sin(angle) * (0.92 + shell * 0.08)
  const z = (random() * 2 - 1) * (0.44 + Math.sin(angle) * 0.22)
  return [x, y, z]
}

function landmarkStartPoint(
  landmarkId: LandmarkId,
  index: number,
  count: number,
  random: () => number,
): MorphVector3 {
  if (landmarkId === 'taipei-101') {
    return taipei101Point(index, count, random)
  }
  if (landmarkId === 'sydney-opera-house') {
    return operaHousePoint(index, count, random)
  }
  return genericTowerPoint(index, count, random)
}

function flattenedLandmarkPoint(
  landmarkId: LandmarkId,
  start: MorphVector3,
): MorphVector3 {
  if (landmarkId === 'sydney-opera-house') {
    return [start[0], MORPH_TARGET_Y, start[2]]
  }

  return [
    start[0] * 1.14,
    MORPH_TARGET_Y,
    (start[1] - 3.42) * 0.88 + start[2] * 0.08,
  ]
}

function planarDistanceSquared(a: MorphVector3, b: MorphVector3) {
  const dx = a[0] - b[0]
  const dz = a[2] - b[2]
  return dx * dx + dz * dz
}

export function createMorphLayout({
  value,
  landmarkId,
  moduleSize,
}: CreateMorphLayoutOptions): MorphLayout {
  const matrix = createQrMatrix(value)
  const resolvedModuleSize =
    moduleSize ??
    Math.min(
      MORPH_MAX_MODULE_SIZE,
      MORPH_QR_EXTENT / (matrix.size + QR_QUIET_ZONE_MODULES * 2),
    )
  const center = (matrix.size - 1) / 2
  const seed = hashString(`${landmarkId}:${value}:${matrix.size}`)
  const random = mulberry32(seed)

  const sources = matrix.darkCells.map((_, index) => {
    const start = landmarkStartPoint(
      landmarkId,
      index,
      matrix.darkCells.length,
      random,
    )
    const flat = flattenedLandmarkPoint(landmarkId, start)
    const scaleNoise = 0.48 + random() * 0.22

    return {
      start,
      flat,
      startScale: [scaleNoise, 0.58 + random() * 0.28, scaleNoise] as MorphVector3,
      flatScale: [scaleNoise * 0.92, 0.2, scaleNoise * 0.92] as MorphVector3,
      delay: random() * MORPH_MAX_DELAY,
    }
  })
  const remainingSources = [...sources]

  const points = matrix.darkCells.map((cell): MorphPoint => {
    const [column, row] = cell
    const target: MorphVector3 = [
        (column - center) * resolvedModuleSize,
        MORPH_TARGET_Y,
        (row - center) * resolvedModuleSize,
      ]
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    remainingSources.forEach((source, sourceIndex) => {
      const distance = planarDistanceSquared(source.flat, target)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = sourceIndex
      }
    })

    const [source] = remainingSources.splice(nearestIndex, 1)
    return {
      cell,
      start: source.start,
      flat: source.flat,
      target,
      startScale: source.startScale,
      flatScale: source.flatScale,
      targetScale: [1, 0.42, 1],
      delay: source.delay,
    }
  })

  return {
    matrixSize: matrix.size,
    moduleSize: resolvedModuleSize,
    planeSize:
      (matrix.size + QR_QUIET_ZONE_MODULES * 2) * resolvedModuleSize,
    points,
  }
}

export function delayedMorphProgress(progress: number, delay: number) {
  if (progress <= delay) return 0
  if (progress >= 1) return 1
  const local = (progress - delay) / (1 - delay)
  return local * local * (3 - 2 * local)
}
