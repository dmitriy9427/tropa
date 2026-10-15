# 4. Ссылка «поделиться»

[src/lib/share.ts](../../src/lib/share.ts). Тесты — `share.test.ts`.

## Где на экране

Кнопка «Поделиться» в шапке поездки копирует ссылку `…/trip/?s=N4Ig…`. Друг открывает её — и видит
ту же поездку, она сохраняется у него в «Мои поездки». Сервера у проекта **нет**.

## Идея: вся поездка — в адресе

Негде хранить поездку, чтобы друг её получил? Положим её **в саму ссылку**. Три шага:

1. **Упаковать** — убрать всё лишнее (длинные ключи, id, служебные поля).
2. **Сжать** — `lz-string` + кодировка, безопасная для адреса.
3. **При открытии** — распаковать и **проверить**: ссылку могли обрезать или испортить.

## Код по частям

### Упаковка: массивы вместо объектов

```ts
type PackedPlace = [name: string, kind: number, lat: number, lon: number, duration: number, note?: string, wiki?: string, image?: string]

type Packed = {
  v: number                 // версия формата
  t: string                 // название
  c: [name, country, lat, lon, timezone]   // город
  s: string                 // дата начала
  d: number[][]             // дни: индексы мест
  i: number[]               // «Идеи»: индексы мест
  p: PackedPlace[]          // места
}
```

- `["Эрмитаж", 1, 59.93983, 30.31456, 120]` вместо `{"name":"Эрмитаж","kind":"museum",…}` — имена
  полей не повторяются для каждого места.
- **Даты дней не храним** — только начало `s`: остальные даты получаются подряд.
- **id мест не храним** — дни ссылаются на места **индексом** в массиве `p`. При распаковке
  выдаются новые id.
- Тип места — номер в списке `KINDS`, а не строка.
- `v` — версия формата: поменяется упаковка — старые ссылки можно будет распознать.

```ts
const round = (n: number) => Math.round(n * 1e5) / 1e5
```

Координаты с точностью до 5 знаков — около метра. Хватает, а цифр в ссылке меньше.

```ts
const tail = [p.note ?? '', p.wikipedia ?? '', p.image ?? '']
while (tail.length && !tail.at(-1)) tail.pop()
row.push(...tail)
```

Хвостовые необязательные поля пишутся, только если есть: даже пустые строки удлиняют ссылку.

```ts
return compressToEncodedURIComponent(JSON.stringify(packed))
```

`lz-string` сжимает JSON и кодирует результат символами, которые можно вставить в адрес без
экранирования. Повторяющиеся куски (названия видов, координаты одного города) сжимаются хорошо.

### Распаковка: не верить ничему

```ts
export function decodeTrip(code: string, now = Date.now()): Trip | null {
  try {
    const json = decompressFromEncodedURIComponent(code)
    if (!json) return null
    const data = JSON.parse(json) as Packed
    if (data.v !== VERSION || !isStr(data.t) || !Array.isArray(data.p) || !Array.isArray(data.d) || !data.d.length) return null
    const [cName, country, lat, lon, timezone] = data.c
    if (!isStr(cName) || !isNum(lat) || !isNum(lon) || !/^\d{4}-\d{2}-\d{2}$/.test(data.s)) return null
    …
  } catch {
    return null
  }
}
```

- Ссылку обрезал мессенджер, кто-то поправил руками, пришла чужая — **любая** порча даёт `null`, а
  не исключение. Страница покажет «Поездка не найдена».
- Каждое поле проверяется по типу: `isStr`, `isNum` (`Number.isFinite` отсекает `NaN`).
- Длины ограничиваются (`name.slice(0, 120)`, заметка до 500, дней не больше 14) — ссылка не может
  «взорвать» интерфейс огромным текстом.
- Неизвестный тип места — `'other'`, а не ошибка.

```ts
const pick = (list: unknown) =>
  (Array.isArray(list) ? list : []).map((i) => ids[i as number]).filter((id) => id && places[id])
```

Индексы мест в днях проверяются: индекс за пределами массива или на битое место — выбрасывается.

### Повторное открытие той же ссылки

```ts
// Planner.tsx
const hash = hashCode(shared)
const existing = Object.values(trips).find((t) => t.importedFrom === hash)
if (existing) { router.replace(`/trip/?id=${existing.id}`); return }
const decoded = decodeTrip(shared)
if (!decoded) { router.replace('/trip/?id=broken'); return }
save({ ...decoded, importedFrom: hash })
```

У поездки из ссылки запоминается **отпечаток** ссылки (короткий хеш cyrb53). Открыли второй раз —
не создаётся копия, а открывается сохранённая. `router.replace` — длинная ссылка `?s=…` уходит из
адреса и истории.

## Что будет, если…

| Сделать | Что сломается |
| --- | --- |
| хранить объекты с ключами | ссылка в 2–3 раза длиннее, мессенджеры обрезают |
| без `try/catch` и проверок | испорченная ссылка — белый экран |
| хранить id мест | ссылка длиннее, а при импорте id могли бы совпасть с существующими |
| без отпечатка | каждое открытие ссылки — новая копия поездки |

## Проверьте себя

1. Почему даты дней не попадают в ссылку?
2. Что вернёт `decodeTrip('abc')`?

<details>
<summary>Ответы</summary>

1. Дни идут подряд: достаточно даты начала и числа дней — остальное вычисляется (`addDays`).
2. `null`: распаковка даст пустую строку или не-JSON, и проверка вернёт `null` без исключения.
</details>
