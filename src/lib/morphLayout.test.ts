import { describe, expect, it } from 'vitest'
import { QR_QUIET_ZONE_MODULES, createQrMatrix } from './qr'
import {
  MORPH_MAX_DELAY,
  MORPH_TARGET_Y,
  createMorphLayout,
  delayedMorphProgress,
} from './morphLayout'

const VALUE = 'https://example.com/landmark'

describe('createMorphLayout', () => {
  it('is deterministic for the same destination and landmark', () => {
    const first = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })
    const second = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })

    expect(second).toEqual(first)
  })

  it('maps every dark QR module to its exact planar target', () => {
    const matrix = createQrMatrix(VALUE)
    const layout = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })
    const center = (matrix.size - 1) / 2

    expect(layout.points).toHaveLength(matrix.darkCells.length)
    layout.points.forEach((point, index) => {
      const [column, row] = matrix.darkCells[index]
      expect(point.cell).toEqual([column, row])
      expect(point.target).toEqual([
        (column - center) * layout.moduleSize,
        MORPH_TARGET_Y,
        (row - center) * layout.moduleSize,
      ])
      expect(point.flat[1]).toBe(MORPH_TARGET_Y)
    })
  })

  it('collapses the landmark to a shallow plane before QR alignment', () => {
    const layout = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })

    expect(layout.points.every((point) => point.flat[1] === MORPH_TARGET_Y)).toBe(
      true,
    )
    expect(Math.max(...layout.points.map((point) => point.flatScale[1]))).toBe(
      0.2,
    )
  })

  it('keeps QR targets inside the matrix and the four-module quiet-zone plane', () => {
    const layout = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })
    const targetHalfExtent = ((layout.matrixSize - 1) * layout.moduleSize) / 2
    const planeHalfExtent = layout.planeSize / 2
    const requiredMargin = QR_QUIET_ZONE_MODULES * layout.moduleSize

    for (const point of layout.points) {
      expect(Math.abs(point.target[0])).toBeLessThanOrEqual(targetHalfExtent)
      expect(Math.abs(point.target[2])).toBeLessThanOrEqual(targetHalfExtent)
      expect(point.delay).toBeGreaterThanOrEqual(0)
      expect(point.delay).toBeLessThanOrEqual(MORPH_MAX_DELAY)
    }

    expect(planeHalfExtent - targetHalfExtent).toBeGreaterThanOrEqual(
      requiredMargin,
    )
  })

  it('preserves all three finder-pattern corners in the target geometry', () => {
    const layout = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })
    const cells = new Set(
      layout.points.map((point) => `${point.cell[0]},${point.cell[1]}`),
    )
    const last = layout.matrixSize - 1

    for (const [column, row] of [
      [0, 0],
      [6, 0],
      [0, 6],
      [6, 6],
      [3, 3],
      [last, 0],
      [last - 6, 0],
      [last, 6],
      [last - 3, 3],
      [0, last],
      [6, last],
      [0, last - 6],
      [3, last - 3],
    ]) {
      expect(cells.has(`${column},${row}`)).toBe(true)
    }
  })

  it('forms a tall, tiered Taipei 101 start silhouette', () => {
    const layout = createMorphLayout({ value: VALUE, landmarkId: 'taipei-101' })
    const heights = layout.points.map((point) => point.start[1])
    const lower = layout.points.filter((point) => point.start[1] < 1)
    const upper = layout.points.filter(
      (point) => point.start[1] > 4.2 && point.start[1] < 5.4,
    )
    const radialExtent = (point: (typeof layout.points)[number]) =>
      Math.max(Math.abs(point.start[0]), Math.abs(point.start[2]))

    expect(Math.max(...heights)).toBeGreaterThan(6.5)
    expect(Math.min(...heights)).toBeGreaterThan(0)
    expect(lower.length).toBeGreaterThan(0)
    expect(upper.length).toBeGreaterThan(0)
    expect(
      lower.reduce((sum, point) => sum + radialExtent(point), 0) / lower.length,
    ).toBeGreaterThan(
      upper.reduce((sum, point) => sum + radialExtent(point), 0) / upper.length,
    )
    expect(Math.max(...layout.points.map((point) => point.startScale[0]))).toBeLessThan(
      0.72,
    )
  })
})

describe('delayedMorphProgress', () => {
  it('clamps its terminal poses exactly', () => {
    expect(delayedMorphProgress(0, 0.2)).toBe(0)
    expect(delayedMorphProgress(0.2, 0.2)).toBe(0)
    expect(delayedMorphProgress(1, 0.2)).toBe(1)
    expect(delayedMorphProgress(2, 0.2)).toBe(1)
  })
})
