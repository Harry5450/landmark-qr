import type { LandmarkQrMark } from '../data/landmarks'

export type LandmarkQrImageSettings = {
  src: string
  width: number
  height: number
  excavate: boolean
}

const TAIPEI_101_MARK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 112">
  <rect width="84" height="112" rx="14" fill="#fff"/>
  <g stroke="#0b1020" stroke-width="3" stroke-linejoin="round">
    <path d="M42 8v13" fill="none" stroke-linecap="round"/>
    <path d="M37 21h10l3 9H34z" fill="#20c7b7"/>
    <path d="M31 30h22l-3 10H34z" fill="#20c7b7"/>
    <path d="M28 40h28l-4 11H32z" fill="#20c7b7"/>
    <path d="M25 51h34l-4 12H29z" fill="#20c7b7"/>
    <path d="M22 63h40l-5 13H27z" fill="#20c7b7"/>
    <path d="M19 76h46l-5 14H24z" fill="#20c7b7"/>
    <path d="M17 90h50l6 13H11z" fill="#20c7b7"/>
  </g>
  <path d="M28 44h28M25 56h34M22 69h40M19 83h46" stroke="#fff" stroke-width="2" opacity=".9"/>
</svg>`

function svgDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

export function getLandmarkQrImageSettings(
  mark?: LandmarkQrMark,
): LandmarkQrImageSettings | undefined {
  if (mark !== 'taipei-101') return undefined

  return {
    src: svgDataUri(TAIPEI_101_MARK),
    width: 54,
    height: 72,
    excavate: true,
  }
}
