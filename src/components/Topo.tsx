import { topoPaths } from '@/lib/topo'

// Серверный компонент без 'use client': topoPaths() выполняется при сборке,
// в HTML попадает готовый <svg>, а код генератора в бандл браузера не входит.
export function Topo({ className, seed = 11 }: { className?: string; seed?: number }) {
  const paths = topoPaths({ width: 1600, height: 900, cols: 110, seed, levels: 30, hills: 34 })
  return (
    <svg className={className} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="var(--topo)"
          strokeWidth={p.major ? 1.6 : 0.9}
          strokeOpacity={p.major ? 1 : 0.65}
          // Линии «проявляются» по очереди: задержка зависит от высоты уровня.
          style={{ '--i': i } as React.CSSProperties}
        />
      ))}
    </svg>
  )
}
