// Топографические линии для фона главной страницы.
//
// Считается на этапе сборки внутри серверного компонента (components/Topo.tsx):
// в браузер уходит готовый SVG, а сам код генерации — нет. Это и есть
// главная идея серверных компонентов: тяжёлая работа там, где её не видно.
//
// Рельеф — сумма «холмов» (гауссиан) со случайными центрами, линии уровня —
// алгоритм marching squares: в каждой клетке сетки смотрим, какие углы выше
// уровня, и проводим отрезок через рёбра, где высота пересекает уровень.

function rng(seed: number) {
  // mulberry32 — короткий детерминированный генератор: одинаковый seed →
  // одинаковые линии на каждой сборке.
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Hill = { x: number; y: number; r: number; h: number }

export type TopoOptions = { width: number; height: number; cols: number; seed: number; levels: number; hills: number }

export function heightField({ width, height, cols, seed, hills }: TopoOptions) {
  const rand = rng(seed)
  const list: Hill[] = Array.from({ length: hills }, () => ({
    x: rand() * width,
    y: rand() * height,
    r: (0.05 + rand() * 0.16) * width,
    h: (rand() < 0.75 ? 1 : -0.6) * (0.4 + rand()),
  }))
  const step = width / cols
  const rows = Math.ceil(height / step)
  const grid: number[][] = []
  for (let j = 0; j <= rows; j++) {
    const row: number[] = []
    for (let i = 0; i <= cols; i++) {
      const x = i * step
      const y = j * step
      let v = 0
      for (const p of list) v += p.h * Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (p.r * p.r))
      row.push(v)
    }
    grid.push(row)
  }
  return { grid, step, rows }
}

type Pt = [number, number]

/** Отрезки линии уровня `level` по сетке высот. */
export function isoSegments(grid: number[][], step: number, level: number): [Pt, Pt][] {
  const segments: [Pt, Pt][] = []
  const lerp = (a: number, b: number) => (level - a) / (b - a)
  for (let j = 0; j < grid.length - 1; j++) {
    for (let i = 0; i < grid[j].length - 1; i++) {
      const tl = grid[j][i]
      const tr = grid[j][i + 1]
      const br = grid[j + 1][i + 1]
      const bl = grid[j + 1][i]
      const x = i * step
      const y = j * step
      // Точки пересечения уровня с рёбрами клетки (если ребро его пересекает).
      const edges: Pt[] = []
      if (tl < level !== tr < level) edges.push([x + lerp(tl, tr) * step, y])
      if (tr < level !== br < level) edges.push([x + step, y + lerp(tr, br) * step])
      if (bl < level !== br < level) edges.push([x + lerp(bl, br) * step, y + step])
      if (tl < level !== bl < level) edges.push([x, y + lerp(tl, bl) * step])
      if (edges.length === 2) segments.push([edges[0], edges[1]])
      // 4 пересечения — «седло»: соединяем попарно.
      if (edges.length === 4) segments.push([edges[0], edges[1]], [edges[2], edges[3]])
    }
  }
  return segments
}

const key = ([x, y]: Pt) => `${Math.round(x * 10)},${Math.round(y * 10)}`

/** Склеить отрезки в ломаные: соседние отрезки делят концы. Так SVG короче вдвое. */
export function chain(segments: [Pt, Pt][]): Pt[][] {
  const byEnd = new Map<string, number[]>()
  segments.forEach(([a, b], n) => {
    for (const p of [a, b]) byEnd.set(key(p), [...(byEnd.get(key(p)) ?? []), n])
  })
  const used = new Set<number>()
  const lines: Pt[][] = []
  const next = (p: Pt) => (byEnd.get(key(p)) ?? []).find((n) => !used.has(n))
  for (let n = 0; n < segments.length; n++) {
    if (used.has(n)) continue
    used.add(n)
    // Растим ломаную в обе стороны, пока у конца есть неиспользованный сосед.
    const forward: Pt[] = [...segments[n]]
    const backward: Pt[] = []
    for (const [list, start] of [
      [forward, segments[n][1]],
      [backward, segments[n][0]],
    ] as const) {
      let cursor = start
      let m: number | undefined
      while ((m = next(cursor)) !== undefined) {
        used.add(m)
        const [a, b] = segments[m]
        cursor = key(a) === key(cursor) ? b : a
        list.push(cursor)
      }
    }
    lines.push([...backward.reverse(), ...forward])
  }
  return lines
}

export function topoPaths(options: TopoOptions): { d: string; major: boolean }[] {
  const { grid, step } = heightField(options)
  const flat = grid.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)
  const out: { d: string; major: boolean }[] = []
  for (let l = 1; l < options.levels; l++) {
    const level = min + ((max - min) * l) / options.levels
    const d = chain(isoSegments(grid, step, level))
      .map((line) => 'M' + line.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join('L'))
      .join('')
    if (d) out.push({ d, major: l % 4 === 0 })
  }
  return out
}
