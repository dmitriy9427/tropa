# 1. Поездка как данные

[src/lib/trip.ts](../../src/lib/trip.ts) — чистые функции: получают `Trip`, возвращают новый `Trip`.

## Где на экране

Всё на странице поездки: колонка «Идеи», дни с местами, «+ день», удаление дня, заметка и
длительность у места, переименование поездки, смена даты начала.

## Данные

```ts
type Trip = {
  id: string
  title: string
  city: City
  ideaIds: string[]                          // «Идеи» — список id
  days: { id: string; date: string; placeIds: string[] }[]
  places: Record<string, Place>               // все места — словарём по id
  createdAt: number
  updatedAt: number
}
```

Главное решение: **места лежат в словаре, а списки хранят только id**. Перенести место из «Идей»
в день — переложить строку-id из одного массива в другой; сами данные места не копируются и не
расходятся.

Контейнер — `'ideas'` или `'day:<id>'`: один тип для «любого списка», куда можно положить место.

## Код по частям

### Список контейнера и где место

```ts
export const dayContainer = (day: Day): ContainerId => `day:${day.id}`

export function itemsOf(trip: Trip, container: ContainerId): string[] {
  if (container === 'ideas') return trip.ideaIds
  return trip.days.find((d) => dayContainer(d) === container)?.placeIds ?? []
}

export function containerOf(trip: Trip, placeId: string): ContainerId | null {
  if (trip.ideaIds.includes(placeId)) return 'ideas'
  const day = trip.days.find((d) => d.placeIds.includes(placeId))
  return day ? dayContainer(day) : null
}
```

Два вопроса, на которых построено перетаскивание: «что в этом списке» и «в каком списке это место».

### Перенос

```ts
export function movePlace(trip: Trip, placeId: string, to: ContainerId, index: number): Trip {
  const from = containerOf(trip, placeId)
  if (!from) return trip
  const source = itemsOf(trip, from).filter((id) => id !== placeId)
  let next = setItems(trip, from, source)
  const target = from === to ? source : [...itemsOf(next, to)]
  const at = Math.max(0, Math.min(index, target.length))
  target.splice(at, 0, placeId)
  next = setItems(next, to, target)
  return touch(next)
}
```

Одна функция и для сортировки внутри дня, и для переноса между днями:

1. Убрать место из исходного списка (`filter` — новый массив).
2. Целевой список: тот же (если сортируем) или копия другого.
3. `index` зажат в границы — позиция за концом списка означает «в конец».
4. `splice` вставляет id на позицию. Он меняет массив **на месте** — поэтому работаем с копией.
5. `touch` — обновить `updatedAt` (сортировка «последние изменённые»).

`setItems` возвращает **новую** поездку с заменённым списком: `{ ...trip, days: trip.days.map(…) }`.

### Добавление без дублей

```ts
export function findDuplicate(trip: Trip, draft: PlaceDraft): Place | undefined {
  return Object.values(trip.places).find(
    (p) => Math.abs(p.lat - draft.lat) < 1e-5 && Math.abs(p.lon - draft.lon) < 1e-5,
  )
}

export function addPlace(trip: Trip, draft: PlaceDraft, to: ContainerId = 'ideas'): Trip {
  if (findDuplicate(trip, draft)) return trip
  const place: Place = { durationMin: DEFAULT_DURATION[draft.kind], ...draft, id: uid() }
  …
}
```

- Дубль — по **координатам**, а не по названию: «Эрмитаж» из двух источников мог называться
  по-разному. `1e-5` градуса — около метра.
- Возврат **того же** `trip` (а не копии) — сигнал стору «ничего не изменилось», перерисовки не
  будет.
- Длительность по умолчанию — по типу места: музей 2 часа, смотровая — полчаса.

### Удаление дня — места не теряются

```ts
export function removeDay(trip: Trip, dayId: string): Trip {
  if (trip.days.length <= 1) return trip
  const day = trip.days.find((d) => d.id === dayId)
  if (!day) return trip
  const start = trip.days[0].date
  const days = trip.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, date: addDays(start, i) }))
  return touch({ ...trip, days, ideaIds: [...trip.ideaIds, ...day.placeIds] })
}
```

- Последний день удалить нельзя — поездка без дней бессмысленна.
- Места удалённого дня возвращаются в «Идеи».
- Даты пересчитываются подряд от начала: удалили второй день из пяти — дни не «рвутся».

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| хранить место внутри дня целиком | перенос копирует данные, заметка правится в одном месте и не в другом |
| `splice` по исходному массиву | изменится старая поездка — React и стор не заметят разницу |
| дубли по названию | одно место дважды или разные места «склеятся» |
| удалять места вместе с днём | человек теряет найденные места |

## Проверьте себя

1. В дне `['a', 'b', 'c']`. Что вернёт `movePlace` для `'a'` в тот же день на позицию 2?
2. Зачем `addPlace` возвращает тот же объект при дубле?

<details>
<summary>Ответы</summary>

1. `['b', 'c', 'a']`: сначала `a` убрано (`['b', 'c']`), потом вставлено на позицию 2.
2. Стор сравнивает `next === trip`: тот же объект — состояние не меняется, лишней перерисовки и
   записи в `localStorage` нет.
</details>
