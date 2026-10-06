import { describe, expect, it } from 'vitest'
import { chain, isoSegments, topoPaths } from './topo'

describe('топографические линии', () => {
  it('находит отрезок уровня в клетке', () => {
    // Левый столбец ниже уровня, правый выше → вертикальный отрезок посередине.
    const grid = [
      [0, 2],
      [0, 2],
    ]
    expect(isoSegments(grid, 10, 1)).toEqual([
      [
        [5, 0],
        [5, 10],
      ],
    ])
  })

  it('склеивает соседние отрезки в одну линию', () => {
    const lines = chain([
      [
        [0, 0],
        [1, 0],
      ],
      [
        [1, 0],
        [2, 1],
      ],
      [
        [3, 3],
        [2, 1],
      ],
    ])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toHaveLength(4)
  })

  it('детерминирован: одинаковый seed — одинаковые линии', () => {
    const opts = { width: 400, height: 200, cols: 30, seed: 3, levels: 8, hills: 6 }
    expect(topoPaths(opts)).toEqual(topoPaths(opts))
    expect(topoPaths({ ...opts, seed: 4 })).not.toEqual(topoPaths(opts))
  })
})
