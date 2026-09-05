import { expect, it } from 'vitest'
import { createVoxelLayout } from './voxelLayout'

it('does not let the widest low tier mask every taller tier', () => {
  const layout = createVoxelLayout({ value: 'https://example.com', landmarkId: 'taipei-101' })
  const heights = layout.cells.filter(cell => cell.isTower).map(cell => cell.exploreHeight)
  expect(Math.max(...heights)).toBeGreaterThan(4)
  expect(new Set(heights).size).toBeGreaterThan(5)
})
