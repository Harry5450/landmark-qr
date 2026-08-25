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

export type Landmark = {
  id: LandmarkId
  name: string
  city: string
  country: string
  emoji: string
  ready: boolean
  accent: string
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
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    city: 'Paris',
    country: 'France',
    emoji: '🇫🇷',
    ready: true,
    accent: '#c99a63',
  },
  {
    id: 'sydney-opera-house',
    name: 'Sydney Opera House',
    city: 'Sydney',
    country: 'Australia',
    emoji: '🇦🇺',
    ready: true,
    accent: '#f1efe9',
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty',
    city: 'New York',
    country: 'United States',
    emoji: '🇺🇸',
    ready: false,
    accent: '#69b7a8',
  },
  {
    id: 'big-ben',
    name: 'Elizabeth Tower',
    city: 'London',
    country: 'United Kingdom',
    emoji: '🇬🇧',
    ready: false,
    accent: '#d0a65c',
  },
  {
    id: 'colosseum',
    name: 'Colosseum',
    city: 'Rome',
    country: 'Italy',
    emoji: '🇮🇹',
    ready: false,
    accent: '#d89b72',
  },
  {
    id: 'giza-pyramid',
    name: 'Great Pyramid of Giza',
    city: 'Giza',
    country: 'Egypt',
    emoji: '🇪🇬',
    ready: false,
    accent: '#d8b66b',
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    city: 'Agra',
    country: 'India',
    emoji: '🇮🇳',
    ready: false,
    accent: '#eee7d7',
  },
  {
    id: 'christ-redeemer',
    name: 'Christ the Redeemer',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    emoji: '🇧🇷',
    ready: false,
    accent: '#d8ded8',
  },
  {
    id: 'burj-khalifa',
    name: 'Burj Khalifa',
    city: 'Dubai',
    country: 'United Arab Emirates',
    emoji: '🇦🇪',
    ready: false,
    accent: '#8ca8b9',
  },
]

export const initialLandmarkId: LandmarkId = 'taipei-101'
