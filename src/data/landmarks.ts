export type LandmarkId =
  | 'taipei-101'
  | 'eiffel-tower'
  | 'statue-of-liberty'
  | 'big-ben'
  | 'colosseum'
  | 'giza-pyramid'
  | 'sydney-opera-house'
  | 'taj-mahal'
  | 'christ-redeemer'
  | 'burj-khalifa'

export type LandmarkVector3 = [number, number, number]

export type LandmarkTransform = {
  scale: number | LandmarkVector3
  position: LandmarkVector3
  rotation: LandmarkVector3
}

export type LandmarkSource =
  | {
      type: 'procedural'
    }
  | {
      type: 'glb'
      src: string
      fallback?: boolean
    }

export type LandmarkCamera = {
  distance: number
  targetY: number
}

export type LandmarkQrMark = 'taipei-101'

export type Landmark = {
  id: LandmarkId
  name: string
  city: string
  country: string
  emoji: string
  ready: boolean
  accent: string
  source: LandmarkSource
  transform: LandmarkTransform
  camera: LandmarkCamera
  conceptImage?: string
  qrMark?: LandmarkQrMark
}

const defaultTransform: LandmarkTransform = {
  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
}

const defaultCamera: LandmarkCamera = {
  distance: 8,
  targetY: 1.5,
}

function modelAssetPath(fileName: string) {
  return `${import.meta.env.BASE_URL}models/${fileName}`
}

function referenceAssetPath(fileName: string) {
  return `${import.meta.env.BASE_URL}assets/references/${fileName}`
}

export const landmarks: Landmark[] = [
  {
    id: 'taipei-101',
    name: 'Taipei 101',
    city: 'Taipei',
    country: 'Taiwan',
    emoji: '🇹🇼',
    ready: true,
    accent: '#20c7b7',
    source: {
      type: 'glb',
      src: modelAssetPath('taipei-101.glb'),
      fallback: true,
    },
    transform: {
      ...defaultTransform,
      scale: 1,
    },
    camera: {
      distance: 8,
      targetY: 2.5,
    },
    conceptImage: referenceAssetPath('taipei-101-concept-transparent.png'),
    qrMark: 'taipei-101',
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    city: 'Paris',
    country: 'France',
    emoji: '🇫🇷',
    ready: true,
    accent: '#c99a63',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { distance: 8, targetY: 1.7 },
  },
  {
    id: 'sydney-opera-house',
    name: 'Sydney Opera House',
    city: 'Sydney',
    country: 'Australia',
    emoji: '🇦🇺',
    ready: true,
    accent: '#f1efe9',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { distance: 7.5, targetY: 0.9 },
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty',
    city: 'New York',
    country: 'United States',
    emoji: '🇺🇸',
    ready: false,
    accent: '#69b7a8',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
  {
    id: 'big-ben',
    name: 'Elizabeth Tower',
    city: 'London',
    country: 'United Kingdom',
    emoji: '🇬🇧',
    ready: false,
    accent: '#d0a65c',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
  {
    id: 'colosseum',
    name: 'Colosseum',
    city: 'Rome',
    country: 'Italy',
    emoji: '🇮🇹',
    ready: false,
    accent: '#d89b72',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
  {
    id: 'giza-pyramid',
    name: 'Great Pyramid of Giza',
    city: 'Giza',
    country: 'Egypt',
    emoji: '🇪🇬',
    ready: false,
    accent: '#d8b66b',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    city: 'Agra',
    country: 'India',
    emoji: '🇮🇳',
    ready: false,
    accent: '#eee7d7',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
  {
    id: 'christ-redeemer',
    name: 'Christ the Redeemer',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    emoji: '🇧🇷',
    ready: false,
    accent: '#d8ded8',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa',
    city: 'Dubai',
    country: 'United Arab Emirates',
    emoji: '🇦🇪',
    ready: false,
    accent: '#8ca8b9',
    source: { type: 'procedural' },
    transform: { ...defaultTransform },
    camera: { ...defaultCamera },
  },
]

export const initialLandmarkId: LandmarkId = 'taipei-101'
