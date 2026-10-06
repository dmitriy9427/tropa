'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo, useEffect, useRef, useState } from 'react'
import { commonsThumb } from '@/lib/api'
import { formatMinutes } from '@/lib/geo'
import type { Place } from '@/lib/types'
import { useTrips } from '@/store/trips'
import { Icon } from '../Icon'
import styles from './PlaceCard.module.scss'
import type { Highlight } from './Planner'

export const KIND_LABEL: Record<Place['kind'], string> = {
  sight: 'Достопримечательность',
  museum: 'Музей',
  view: 'Смотровая',
  park: 'Парк',
  food: 'Кафе',
  other: 'Место',
}

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240]

type CardProps = {
  tripId: string
  place: Place
  number: number | null
  color: string | null
  highlighted?: boolean
  overlay?: boolean
  onHighlight?: (h: Highlight) => void
}

// Клавиши внутри кнопок карточки не должны запускать перетаскивание
// (Пробел на кнопке — это нажатие кнопки, а не «взять карточку»).
const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation()

export const PlaceCard = memo(function PlaceCard({ tripId, place, number, color, highlighted, overlay, onHighlight }: CardProps) {
  const update = useTrips((s) => s.updatePlace)
  const remove = useTrips((s) => s.removePlace)
  const [editing, setEditing] = useState(false)

  return (
    <div
      className={styles.card}
      data-highlight={highlighted || undefined}
      data-overlay={overlay || undefined}
      style={color ? ({ '--color': color } as React.CSSProperties) : undefined}
      onMouseEnter={() => onHighlight?.({ placeId: place.id, source: 'list' })}
      onMouseLeave={() => onHighlight?.({ placeId: null, source: 'list' })}
    >
      {number !== null && (
        <span className={styles.marker} aria-hidden="true">
          {number}
        </span>
      )}
      <div className={styles.thumb} aria-hidden="true">
        {place.image ? (
          // Обычный <img>: next/image без сервера оптимизации ничего не даёт,
          // а Commons сам отдаёт превью нужной ширины (?width=).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={commonsThumb(place.image, 160)} alt="" loading="lazy" draggable={false} />
        ) : (
          <Icon name={place.kind} size={22} />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.name}>{place.name}</p>
        <p className={styles.meta}>
          <span>{KIND_LABEL[place.kind]}</span>
          <label className={styles.duration} onKeyDown={stopKeys} onPointerDown={(e) => e.stopPropagation()}>
            <span className="visually-hidden">Сколько времени на место</span>
            <select
              value={place.durationMin}
              onChange={(e) => update(tripId, place.id, { durationMin: Number(e.target.value) })}
            >
              {[...new Set([...DURATIONS, place.durationMin])]
                .sort((a, b) => a - b)
                .map((m) => (
                  <option key={m} value={m}>
                    {formatMinutes(m)}
                  </option>
                ))}
            </select>
          </label>
        </p>
        {editing ? (
          <NoteEditor
            initial={place.note ?? ''}
            onDone={(note) => {
              update(tripId, place.id, { note: note.trim() || undefined })
              setEditing(false)
            }}
          />
        ) : (
          place.note && <p className={styles.note}>{place.note}</p>
        )}
      </div>
      <div className={styles.tools} onKeyDown={stopKeys} onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" aria-label={`Заметка к «${place.name}»`} onClick={() => setEditing(true)}>
          <Icon name="note" size={16} />
        </button>
        <button type="button" aria-label={`Убрать «${place.name}»`} onClick={() => remove(tripId, place.id)}>
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  )
})

function NoteEditor({ initial, onDone }: { initial: string; onDone: (note: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <textarea
      className={styles.noteInput}
      value={value}
      placeholder="Заметка: билеты, часы работы…"
      rows={2}
      maxLength={500}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          onDone(value)
        }
        if (e.key === 'Escape') onDone(initial)
      }}
      onPointerDown={(e) => e.stopPropagation()}
    />
  )
}

type SortableProps = Omit<CardProps, 'overlay'> & { scrollIntoView: boolean }

/** Карточка в списке: useSortable даёт ей обработчики перетаскивания и сдвиг при сортировке. */
export function SortablePlace({ scrollIntoView, ...props }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.place.id })
  const ref = useRef<HTMLLIElement | null>(null)

  // Навели на точку на карте → прокручиваем список к карточке.
  useEffect(() => {
    if (props.highlighted && scrollIntoView) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [props.highlighted, scrollIntoView])

  return (
    <li
      ref={(node) => {
        setNodeRef(node)
        ref.current = node
      }}
      className={styles.item}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      aria-roledescription="перетаскиваемое место"
      {...listeners}
    >
      <PlaceCard {...props} />
    </li>
  )
}
