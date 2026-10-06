'use client'

import { useEffect, useState } from 'react'
import { CATEGORIES, commonsThumb, type Category } from '@/lib/api'
import { useNearby, usePlaceSearch } from '@/lib/queries'
import { findDuplicate } from '@/lib/trip'
import type { PlaceDraft, Trip } from '@/lib/types'
import { useDebounced } from '@/lib/useDebounced'
import { toast } from '@/store/toast'
import { useTrips } from '@/store/trips'
import { Icon } from '../Icon'
import styles from './Discover.module.scss'
import { KIND_LABEL } from './PlaceCard'
import type { Highlight } from './Planner'

type Props = {
  trip: Trip
  onPreview: (places: PlaceDraft[]) => void
  highlight: Highlight
  onHighlight: (h: Highlight) => void
}

// Общий пустой массив: новый [] на каждом рендере менял бы зависимость эффекта
// ниже и зацикливал обновление превью на карте.
const NONE: PlaceDraft[] = []

/** Ключ найденного места (у черновиков ещё нет id) — по координатам. */
export const draftKey = (p: PlaceDraft) => `draft:${p.lat.toFixed(5)},${p.lon.toFixed(5)}`

export function Discover({ trip, onPreview, highlight, onHighlight }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('top')
  const debounced = useDebounced(query, 350)
  const searching = debounced.trim().length >= 3
  const search = usePlaceSearch(debounced, trip.city)
  const nearby = useNearby(category, trip.city)
  const active = searching ? search : nearby
  const results = active.data ?? NONE

  // Найденные места показываем на карте пустыми кружками.
  useEffect(() => {
    onPreview(results)
  }, [results, onPreview])
  useEffect(() => () => onPreview([]), [onPreview])

  return (
    <div className={styles.discover}>
      <label className={styles.search}>
        <Icon name="search" />
        <span className="visually-hidden">Поиск места</span>
        <input
          type="search"
          placeholder={`Музей, кафе, улица в городе ${trip.city.name}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {!searching && (
        <div className={styles.chips} role="radiogroup" aria-label="Подборка">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              className={styles.chip}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <p className={styles.caption}>
        {searching ? `Поиск «${debounced.trim()}»` : 'Популярное рядом — по числу статей в Википедии на разных языках'}
      </p>

      {active.isLoading && (
        <ul className={styles.results} aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className={styles.skeleton} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </ul>
      )}

      {active.isError && (
        <div className={styles.error}>
          <p>Сервис не ответил. Открытые API иногда перегружены.</p>
          <button type="button" className="btn btn--sm" onClick={() => active.refetch()}>
            Повторить
          </button>
        </div>
      )}

      {!active.isLoading && !active.isError && !results.length && (
        <p className={styles.empty}>Ничего не нашлось — попробуйте другое название.</p>
      )}

      <ul className={styles.results}>
        {results.map((place, i) => (
          <Result
            key={draftKey(place)}
            trip={trip}
            place={place}
            index={i}
            highlighted={highlight.placeId === draftKey(place)}
            onHighlight={onHighlight}
          />
        ))}
      </ul>
    </div>
  )
}

function Result({
  trip,
  place,
  index,
  highlighted,
  onHighlight,
}: {
  trip: Trip
  place: PlaceDraft
  index: number
  highlighted: boolean
  onHighlight: (h: Highlight) => void
}) {
  const add = useTrips((s) => s.addPlace)
  const added = !!findDuplicate(trip, place)
  const key = draftKey(place)
  return (
    <li
      className={styles.result}
      data-highlight={highlighted || undefined}
      style={{ '--i': Math.min(index, 12) } as React.CSSProperties}
      onMouseEnter={() => onHighlight({ placeId: key, source: 'list' })}
      onMouseLeave={() => onHighlight({ placeId: null, source: 'list' })}
    >
      <div className={styles.photo}>
        {place.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={commonsThumb(place.image, 240)} alt="" loading="lazy" />
        ) : (
          <Icon name={place.kind} size={24} />
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{place.name}</p>
        <p className={styles.kind}>{place.address ?? KIND_LABEL[place.kind]}</p>
      </div>
      <button
        type="button"
        className={styles.add}
        data-added={added || undefined}
        disabled={added}
        aria-label={added ? `«${place.name}» уже в поездке` : `Добавить «${place.name}» в идеи`}
        onClick={() => {
          add(trip.id, place)
          toast(`«${place.name}» — в идеях`)
        }}
      >
        <Icon name={added ? 'check' : 'plus'} size={18} />
      </button>
    </li>
  )
}
