# 5. Карта маршрута

[src/components/planner/TripMap.tsx](../../src/components/planner/TripMap.tsx). Глава — [05. Карта](../05-map.md).

## Где на экране

Справа от доски — карта города: метки мест (цвет — по дню, номер — порядок), линии маршрутов
дней. Выбрали день — его линия «прорисовывается» от первой точки к последней. Наведение на карточку
подсвечивает метку и наоборот. Смена темы — тёмная карта.

## Главная сложность: два мира

| React | MapLibre |
| --- | --- |
| декларативный: «вот состояние — нарисуй» | императивный объект: `map.addLayer`, `source.setData` |
| перерисовывает разметку | своё состояние внутри WebGL |

Решение: карта создаётся **один раз** и хранится в `useRef`, а несколько эффектов
**синхронизируют** её с пропсами — каждый отвечает за своё.

## Код по частям

### Создание — один раз

```tsx
useEffect(() => {
  if (!container.current) return
  const map = new MapLibre({
    container: container.current,
    style: STYLES[currentTheme()],
    center: [trip.city.lon, trip.city.lat],
    zoom: 12,
    pitchWithRotate: false,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
  map.on('style.load', () => {
    addRouteLayers(map, currentTheme())
    setReady((n) => n + 1)
  })
  mapRef.current = map
  const ro = new ResizeObserver(() => map.resize())
  ro.observe(container.current)
  return () => { ro.disconnect(); pins.clear(); map.remove(); mapRef.current = null }
}, [])
```

- Пустые зависимости — карта создаётся один раз. Новая карта на каждый рендер — новый
  WebGL-контекст, и браузер быстро упрётся в лимит.
- `pitchWithRotate: false` — наклон карты двумя пальцами путал бы с прокруткой на телефоне.
- **`style.load` → заново свои слои.** Смена темы делает `setStyle`, а он удаляет **всё** — и
  подложку, и наши слои. Поэтому слои добавляются на каждый `style.load`, а счётчик `ready`
  перезапускает эффекты с данными.
- `ResizeObserver` — на телефоне панель карты показывают и прячут: холст должен подстроиться.
- Уборка: `map.remove()` освобождает WebGL и обработчики.

### Свежие колбэки для обработчиков карты

```tsx
const handlers = useRef({ onHighlight, onActiveDay })
useEffect(() => { handlers.current = { onHighlight, onActiveDay } })
```

Обработчики кликов и наведения вешаются на карту один раз. Внутри — замыкание первого рендера.
Через `ref` они всегда зовут **свежие** колбэки.

### Линии маршрутов — данные в источник

```tsx
useEffect(() => {
  const map = mapRef.current
  if (!map || !ready) return
  const features = trip.days
    .map((day, i) => ({ day, i, places: dayPlaces(trip, day) }))
    .filter(({ places }) => places.length > 1)
    .map(({ day, i, places }) => ({
      type: 'Feature',
      properties: { day: day.id, color: dayColor(i), active: activeDay === null || activeDay === day.id },
      geometry: { type: 'LineString', coordinates: places.map((p) => [p.lon, p.lat]) },
    }))
  ;(map.getSource('routes') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features })
}, [trip, activeDay, ready])
```

- **GeoJSON** — стандартный формат: линия — список координат `[долгота, широта]` (именно в таком
  порядке, не наоборот!).
- Один **источник** `routes` со всеми линиями, а **слой** рисует их по свойствам: цвет из
  `properties.color`, неактивные дни — бледнее (`active`).
- Изменилась поездка — `setData`: слой перерисуется сам.
- День из одного места линии не имеет — отфильтрован.

### Линия «рисуется»

```tsx
const tick = (now: number) => {
  const t = reduced ? 1 : Math.min((now - started) / 1100, 1)
  const eased = 1 - (1 - t) ** 3
  map.setPaintProperty('active-route', 'line-gradient', [
    'step', ['line-progress'],
    color, Math.max(eased, 0.0001),
    'rgba(0,0,0,0)',
  ])
  if (t < 1) frame = requestAnimationFrame(tick)
}
frame = requestAnimationFrame(tick)
return () => cancelAnimationFrame(frame)
```

- `line-progress` — доля длины линии от 0 (начало) до 1 (конец); работает, если у источника
  `lineMetrics: true`.
- **`line-gradient` со ступенькой**: до точки `eased` — цвет дня, после — прозрачно. Каждый кадр
  ступенька сдвигается — линия «рисуется».
- `1 - (1 - t)³` — быстрый старт и мягкое торможение.
- `Math.max(eased, 0.0001)` — ступенька в точке 0 недопустима для выражения.
- «Меньше движения» — сразу вся линия.
- Уборка отменяет кадр — выбрали другой день посреди анимации, старая не продолжится.
- Эффект зависит от `activeKey` — порядка мест дня строкой: переставили места — линия
  прорисовывается заново.

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| создавать карту в зависимостях от `trip` | новая карта на каждое изменение, утечка WebGL-контекстов |
| добавить слои только при создании | после смены темы линии пропадают |
| `[lat, lon]` вместо `[lon, lat]` | маршрут Петербурга где-то в Индийском океане |
| без `cancelAnimationFrame` | при быстрой смене дней две анимации спорят |

## Проверьте себя

1. Почему эффекты карты проверяют `ready`, а не просто `mapRef.current`?
2. Как сделать линию дня пунктирной?

<details>
<summary>Ответы</summary>

1. Карта есть сразу, а слои и источники появляются только после загрузки стиля (`style.load`).
   `ready` — «стиль загружен, источники на месте»; он же растёт после смены темы и перезапускает
   эффекты.
2. В описании слоя линий добавить `paint: { 'line-dasharray': [2, 2] }` (у слоя с `line-gradient`
   пунктир не поддерживается — только для обычных линий).
</details>
