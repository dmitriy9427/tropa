import type { PlaceKind } from '@/lib/types'
import type { WeatherIcon as WeatherKind } from '@/lib/weather'

// Набор иконок одним компонентом: штрихи 24×24, цвет — currentColor.
const PATHS = {
  sight: 'M4 21V10l8-6 8 6v11M9 21v-6h6v6M2 21h20',
  museum: 'M3 21h18M5 18V10M9.5 18V10M14.5 18V10M19 18V10M2.5 8 12 3l9.5 5z',
  view: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  park: 'M12 22v-6M7 16h10l-5-13zM8.5 10.5h7',
  food: 'M7 2v9m-3-9v5a3 3 0 0 0 6 0V2M7 11v11M17 22V2c-2.5 1.5-4 4-4 8h4',
  other: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6 6 18',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14',
  calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4zM4 10h16M8 2v4m8-4v4',
  note: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  grip: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14m6-12v14',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  walk: 'M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10 22l2-7 3 3v4M7 13l2-6 4 1 3 4 3 1M9 7l-2 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4l3 2',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
  back: 'M15 18l-6-6 6-6',
  layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18, className }: { name: IconName | PlaceKind; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'grip' ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export function WeatherIcon({ kind, size = 22 }: { kind: WeatherKind; size?: number }) {
  const sun = '#f2a33a'
  const cloud = 'var(--muted)'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round">
      {(kind === 'sun' || kind === 'partly') && (
        <g stroke={sun} strokeWidth="1.6">
          <circle cx={kind === 'sun' ? 12 : 9} cy={kind === 'sun' ? 12 : 9} r="4" fill={sun} />
          {kind === 'sun' &&
            Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1="12" y1="2" x2="12" y2="4.5" transform={`rotate(${i * 45} 12 12)`} />
            ))}
        </g>
      )}
      {kind !== 'sun' && (
        <path
          d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a4.25 4.25 0 0 1 .5 8.5z"
          fill="var(--card)"
          stroke={cloud}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )}
      {kind === 'rain' && <path d="M9 20.5l-1 2M13 20.5l-1 2M17 20.5l-1 2" stroke="#3d8bd9" strokeWidth="1.6" />}
      {kind === 'snow' && <path d="M9 21h.01M13 22h.01M17 21h.01" stroke="#7fb4e6" strokeWidth="2.4" />}
      {kind === 'storm' && <path d="M13 17l-2 3h3l-2 3" stroke={sun} strokeWidth="1.6" />}
      {kind === 'fog' && <path d="M5 21h14M7 23h10" stroke={cloud} strokeWidth="1.6" />}
    </svg>
  )
}
