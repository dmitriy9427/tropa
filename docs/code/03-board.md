# 3. Перетаскивание

[src/components/planner/Board.tsx](../../src/components/planner/Board.tsx). Глава — [04. Перетаскивание](../04-drag-and-drop.md).

## Где на экране

Слева «Идеи», справа дни. Тащите карточку места: соседние карточки раздвигаются, показывая, куда
она встанет; над другим днём она «перескакивает» туда сразу. Esc — всё вернётся как было. Работает
мышью, пальцем (после короткого удержания) и с клавиатуры.

## Устройство

```
<DndContext sensors onDragStart onDragOver onDragEnd onDragCancel accessibility>
  <Column id="ideas">
    <SortableContext items={trip.ideaIds}>  …<SortablePlace id=…>  </SortableContext>
  </Column>
  <Column id="day:…">  <SortableContext items={day.placeIds}> … </SortableContext>  </Column>
  …
  <DragOverlay> копия перетаскиваемой карточки </DragOverlay>
</DndContext>
```

Один `DndContext` на всю доску, по `SortableContext` на каждый список. `Column` —
`useDroppable`: пустой день тоже принимает карточку.

## Код по частям

### Датчики

```ts
const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)
```

| Датчик | Правило | Зачем |
| --- | --- | --- |
| мышь | начать после сдвига на 6 px | клик по кнопкам внутри карточки работает как клик |
| палец | удержать 200 мс (дрожание до 8 px) | обычный свайп прокручивает список, а не тащит карточку |
| клавиатура | Пробел — взять, стрелки, Пробел — положить, Esc — отмена | перетаскивание без мыши |

### Начало: запомнить, как было

```ts
const onDragStart = ({ active }: DragStartEvent) => {
  setDragId(String(active.id))
  snapshot.current = trip
}
```

Снимок поездки в `ref` (а не в состоянии — от него ничего не рисуется). Понадобится для отмены.

### Над другим списком — перенести сразу

```ts
const onDragOver = ({ active, over }: DragOverEvent) => {
  if (!over) return
  const id = String(active.id)
  const from = containerOf(trip, id)
  const to = resolve(String(over.id))
  if (!from || !to || from === to) return
  const target = itemsOf(trip, to)
  const overIndex = target.indexOf(String(over.id))
  const rect = active.rect.current.translated
  const below = rect && rect.top > over.rect.top + over.rect.height / 2
  const index = overIndex < 0 ? target.length : overIndex + (below ? 1 : 0)
  move(trip.id, id, to, index)
}
```

- `over` — над чем сейчас карточка: другая карточка или пустая колонка. `resolve` превращает это в
  контейнер (`'ideas'` / `'day:…'`).
- Тот же список — ничего не делаем: сортировку внутри списка сделает `onDragEnd`.
- **Другой список — переносим прямо во время перетаскивания.** Тогда `SortableContext` того списка
  раздвигает карточки, и видно, куда место встанет.
- Позиция: над карточкой-соседом — ниже её середины встаём **после** неё, выше — **перед**. Над
  пустым местом списка — в конец.

### Отпустили — порядок внутри списка

```ts
const onDragEnd = ({ active, over }: DragEndEvent) => {
  setDragId(null)
  if (!over) return
  const id = String(active.id)
  const to = resolve(String(over.id))
  if (!to || containerOf(trip, id) !== to) return
  const index = itemsOf(trip, to).indexOf(String(over.id))
  if (index >= 0 && String(over.id) !== id) move(trip.id, id, to, index)
}
```

К этому моменту карточка уже в нужном списке (её перенёс `onDragOver`); осталось поставить её на
место того, над кем отпустили.

### Esc — вернуть как было

```ts
const onDragCancel = () => {
  setDragId(null)
  if (snapshot.current) useTrips.getState().save(snapshot.current)
}
```

Поскольку перенос между списками применяется **по ходу**, «просто ничего не делать» при отмене
нельзя — карточка уже в другом дне. Возвращаем снимок поездки целиком.

### Копия под курсором

```tsx
<DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
  {dragged && (
    <PlaceCard tripId={trip.id} place={dragged} number={null}
      color={draggedDay >= 0 ? dayVar(draggedDay) : null} overlay />
  )}
</DragOverlay>
```

`number={null}` — номер на «летящей» карточке не показываем: новое место в списке известно только
после того, как её отпустят. `dropAnimation` — мягкая посадка на место.

Под курсором едет **копия**, а сама карточка остаётся в списке полупрозрачным «местом». Иначе
карточка, переехавшая в другой список (в `onDragOver`), размонтировалась бы вместе со своим
перетаскиванием.

### Доступность

```ts
const announcements: Announcements = {
  onDragStart: ({ active }) => `Взято место «${placeName(active.id)}».`,
  onDragOver: ({ active, over }) => over ? `«${placeName(active.id)}» над списком ${containerName(resolve(String(over.id)))}.` : undefined,
  onDragEnd: ({ active, over }) => over ? `«${placeName(active.id)}» перенесено в ${containerName(…)}.` : 'Перенос отменён.',
  onDragCancel: ({ active }) => `Перенос «${placeName(active.id)}» отменён.`,
}
```

dnd-kit сам объявляет действия скринридеру через «живую область» — но по-английски и с id. Здесь —
по-русски и с названиями мест и номерами дней. Плюс инструкция: «Чтобы перенести место, нажмите
Пробел…».

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| мышь без `distance` | кнопки «удалить», «заметка» в карточке не нажимаются — сразу начинается перетаскивание |
| палец без `delay` | список на телефоне не прокручивается |
| без `snapshot` в `onDragCancel` | Esc оставляет карточку в чужом дне |
| без `DragOverlay` | карточка «теряется» при переходе в другой список |
| без `KeyboardSensor` | перетаскивание недоступно с клавиатуры |

## Проверьте себя

1. Почему перенос между списками — в `onDragOver`, а не в `onDragEnd`?
2. Почему снимок — `useRef`, а не `useState`?

<details>
<summary>Ответы</summary>

1. Чтобы целевой список раздвинул карточки ещё во время перетаскивания: человек видит, куда место
   встанет.
2. От снимка ничего не рисуется; `useState` вызвал бы лишнюю перерисовку доски в момент начала
   перетаскивания.
</details>
