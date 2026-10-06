import styles from './HeroPreview.module.scss'

// Декоративная «открытка» справа от формы: как будет выглядеть день поездки.
// Чистая разметка и CSS-анимации — JavaScript для неё не нужен.

const STOPS = [
  { name: 'Казанский кремль', time: '2 ч', x: 74, y: 70 },
  { name: 'Кул-Шариф', time: '1 ч', x: 128, y: 44 },
  { name: 'Улица Баумана', time: '1,5 ч', x: 214, y: 118 },
]

export function HeroPreview({ className }: { className?: string }) {
  return (
    <div className={`${styles.wrap} ${className ?? ''}`} aria-hidden="true">
      <div className={styles.map}>
        <svg viewBox="0 0 300 180">
          <path className={styles.river} d="M-10 150 C 60 120, 90 160, 160 140 S 260 90, 320 110" />
          <path
            className={styles.route}
            d={`M${STOPS[0].x} ${STOPS[0].y} Q 96 30 ${STOPS[1].x} ${STOPS[1].y} T ${STOPS[2].x} ${STOPS[2].y}`}
            pathLength={1}
          />
          {STOPS.map((s, i) => (
            <g key={s.name} className={styles.pin} style={{ '--i': i } as React.CSSProperties}>
              <circle cx={s.x} cy={s.y} r="11" />
              <text x={s.x} y={s.y + 4}>
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className={styles.ticket}>
        <div className={styles.ticketHead}>
          <div>
            <span className={styles.dayLabel}>День 1 · сб</span>
            <b className="display">18 октября</b>
          </div>
          <span className={styles.weather}>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="4.5" fill="#f2a33a" />
              <g stroke="#f2a33a" strokeWidth="1.6" strokeLinecap="round">
                {Array.from({ length: 8 }, (_, i) => (
                  <line key={i} x1="12" y1="2" x2="12" y2="4.5" transform={`rotate(${i * 45} 12 12)`} />
                ))}
              </g>
            </svg>
            +12°
          </span>
        </div>
        <ol className={styles.stops}>
          {STOPS.map((s, i) => (
            <li key={s.name} style={{ '--i': i } as React.CSSProperties}>
              <span className={styles.num}>{i + 1}</span>
              <span>{s.name}</span>
              <span className={styles.time}>{s.time}</span>
            </li>
          ))}
        </ol>
        <div className={styles.ticketFoot}>
          <span>2,4 км пешком</span>
          <span>≈ 4,5 ч</span>
        </div>
      </div>

      <div className={styles.stamp}>
        <span>Казань</span>
        <span className="mono">55.79° N</span>
      </div>
    </div>
  )
}
