'use client'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useRef, useState } from 'react'
import { dayVar } from '@/lib/colors'
import { containerOf, dayContainer, itemsOf } from '@/lib/trip'
import type { ContainerId, Trip } from '@/lib/types'
import { useTrips } from '@/store/trips'
import { Icon } from '../Icon'
import styles from './Board.module.scss'
import { DayHeader } from './DayHeader'
import { PlaceCard, SortablePlace } from './PlaceCard'
import type { Highlight } from './Planner'

type Props = {
  trip: Trip
  activeDay: string | null
  onActiveDay: (dayId: string | null) => void
  highlight: Highlight
  onHighlight: (h: Highlight) => void
  onDiscover: () => void
}

// Перетаскивание на dnd-kit. Несколько списков («Идеи» и дни) — несколько
// SortableContext внутри одного DndContext:
//  - onDragOver: карточку тянут над другим списком → сразу переносим её туда,
//    чтобы соседние карточки раздвинулись и было видно, куда она встанет;
//  - onDragEnd: отпустили внутри списка → фиксируем новый порядок;
//  - onDragCancel (Esc): возвращаем поездку как было до начала перетаскивания.
export function Board({ trip, activeDay, onActiveDay, highlight, onHighlight, onDiscover }: Props) {
  const move = useTrips((s) => s.movePlace)
  const [dragId, setDragId] = useState<string | null>(null)
  const snapshot = useRef<Trip | null>(null)

  const sensors = useSensors(
    // Мышь: перетаскивание начинается после сдвига на 6px — обычный клик по кнопкам в карточке работает.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Палец: нужно задержать на 200 мс, иначе нельзя было бы прокрутить список.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    // Клавиатура: Пробел — взять, стрелки — двигать, Пробел — положить, Esc — отмена.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const resolve = (id: string): ContainerId | null =>
    id === 'ideas' || id.startsWith('day:') ? (id as ContainerId) : containerOf(trip, id)

  const containerName = (c: ContainerId | null) => {
    if (c === 'ideas') return '«Идеи»'
    const i = trip.days.findIndex((d) => dayContainer(d) === c)
    return i >= 0 ? `день ${i + 1}` : ''
  }
  const placeName = (id: string | number) => trip.places[String(id)]?.name ?? ''

  // Тексты для скринридера (по умолчанию dnd-kit говорит по-английски).
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Взято место «${placeName(active.id)}».`,
    onDragOver: ({ active, over }) =>
      over ? `«${placeName(active.id)}» над списком ${containerName(resolve(String(over.id)))}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `«${placeName(active.id)}» перенесено в ${containerName(resolve(String(over.id)))}.` : 'Перенос отменён.',
    onDragCancel: ({ active }) => `Перенос «${placeName(active.id)}» отменён.`,
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragId(String(active.id))
    snapshot.current = trip
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const id = String(active.id)
    const from = containerOf(trip, id)
    const to = resolve(String(over.id))
    if (!from || !to || from === to) return
    const target = itemsOf(trip, to)
    const overIndex = target.indexOf(String(over.id))
    // Ниже середины карточки-соседа → встаём после неё.
    const rect = active.rect.current.translated
    const below = rect && rect.top > over.rect.top + over.rect.height / 2
    const index = overIndex < 0 ? target.length : overIndex + (below ? 1 : 0)
    move(trip.id, id, to, index)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragId(null)
    if (!over) return
    const id = String(active.id)
    const to = resolve(String(over.id))
    if (!to || containerOf(trip, id) !== to) return
    const index = itemsOf(trip, to).indexOf(String(over.id))
    if (index >= 0 && String(over.id) !== id) move(trip.id, id, to, index)
  }

  const onDragCancel = () => {
    setDragId(null)
    if (snapshot.current) useTrips.getState().save(snapshot.current)
  }

  const dragged = dragId ? trip.places[dragId] : null
  const draggedFrom = dragId ? containerOf(trip, dragId) : null
  const draggedDay = trip.days.findIndex((d) => dayContainer(d) === draggedFrom)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Чтобы перенести место, нажмите Пробел. Стрелками выберите новое положение, Пробелом положите, Escape — отмена.',
        },
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className={styles.board}>
        <Column id="ideas" className={styles.ideas}>
          <div className={styles.ideasHead}>
            <h2>
              Идеи <span className="mono">{trip.ideaIds.length}</span>
            </h2>
            <button type="button" className="btn btn--sm btn--ghost" onClick={onDiscover}>
              <Icon name="search" size={16} />
              Найти места
            </button>
          </div>
          <SortableContext items={trip.ideaIds} strategy={verticalListSortingStrategy}>
            <ul className={styles.list}>
              {trip.ideaIds.map((id) => (
                <SortablePlace
                  key={id}
                  tripId={trip.id}
                  place={trip.places[id]}
                  number={null}
                  color={null}
                  highlighted={highlight.placeId === id}
                  scrollIntoView={highlight.source === 'map'}
                  onHighlight={onHighlight}
                />
              ))}
            </ul>
          </SortableContext>
          {!trip.ideaIds.length && (
            <p className={styles.hint}>
              Сюда попадают найденные места. Потом их можно перетащить в нужный день.
            </p>
          )}
        </Column>

        {trip.days.map((day, i) => (
          <Column
            key={day.id}
            id={dayContainer(day)}
            className={styles.day}
            style={{ '--day': dayVar(i) } as React.CSSProperties}
            active={activeDay === day.id}
          >
            <DayHeader
              trip={trip}
              day={day}
              index={i}
              active={activeDay === day.id}
              onToggle={() => onActiveDay(activeDay === day.id ? null : day.id)}
            />
            <SortableContext items={day.placeIds} strategy={verticalListSortingStrategy}>
              <ol className={styles.list}>
                {day.placeIds.map((id, n) => (
                  <SortablePlace
                    key={id}
                    tripId={trip.id}
                    place={trip.places[id]}
                    number={n + 1}
                    color={dayVar(i)}
                    highlighted={highlight.placeId === id}
                    scrollIntoView={highlight.source === 'map'}
                    onHighlight={onHighlight}
                  />
                ))}
              </ol>
            </SortableContext>
            {!day.placeIds.length && <p className={styles.drop}>Перетащите сюда места из «Идей»</p>}
          </Column>
        ))}
      </div>

      {/* Копия карточки, которая едет за курсором. Сама карточка в списке в это время — полупрозрачный «след». */}
      <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {dragged && (
          <PlaceCard
            tripId={trip.id}
            place={dragged}
            // Номер на «летящей» карточке не показываем: новое место в списке
            // известно только после того, как её отпустят.
            number={null}
            color={draggedDay >= 0 ? dayVar(draggedDay) : null}
            overlay
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

/** Список, в который можно бросить карточку, даже если он пустой. */
function Column({
  id,
  className,
  style,
  active,
  children,
}: {
  id: ContainerId
  className: string
  style?: React.CSSProperties
  active?: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section
      ref={setNodeRef}
      className={className}
      style={style}
      data-over={isOver || undefined}
      data-active={active || undefined}
    >
      {children}
    </section>
  )
}
