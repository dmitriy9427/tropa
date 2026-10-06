'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { decodeTrip, hashCode } from '@/lib/share'
import type { PlaceDraft, Trip } from '@/lib/types'
import { toast } from '@/store/toast'
import { useTrips } from '@/store/trips'
import { useHydrateTrips } from '@/store/useHydrateTrips'
import { Icon } from '../Icon'
import { Board } from './Board'
import { Discover } from './Discover'
import styles from './Planner.module.scss'
import { TripHeader } from './TripHeader'

// Карта загружается отдельным чанком и только в браузере (ssr: false):
// MapLibre обращается к window и WebGL, которых при сборке нет. Заодно
// тяжёлая библиотека не задерживает первую отрисовку списка.
const TripMap = dynamic(() => import('./TripMap').then((m) => m.TripMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading} />,
})

export type Highlight = { placeId: string | null; source: 'list' | 'map' }

export function Planner() {
  const hydrated = useHydrateTrips()
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id')
  const shared = params.get('s')
  const trip = useTrips((s) => (id ? s.trips[id] : undefined))

  // Открыли ссылку «поделиться»: сохраняем поездку себе и переходим на её id.
  // Повторное открытие той же ссылки находит уже импортированную копию.
  useEffect(() => {
    if (!hydrated || !shared) return
    const hash = hashCode(shared)
    const { trips, save } = useTrips.getState()
    const existing = Object.values(trips).find((t) => t.importedFrom === hash)
    if (existing) {
      router.replace(`/trip/?id=${existing.id}`)
      return
    }
    const decoded = decodeTrip(shared)
    if (!decoded) {
      router.replace('/trip/?id=broken')
      return
    }
    save({ ...decoded, importedFrom: hash })
    toast('Поездка по ссылке сохранена в «Мои поездки»')
    router.replace(`/trip/?id=${decoded.id}`)
  }, [hydrated, shared, router])

  if (!hydrated || shared) return <div className={styles.loading} />
  if (!trip) return <NotFound />
  return <Workspace trip={trip} />
}

function NotFound() {
  return (
    <main className={styles.notFound}>
      <h1 className="display">Поездка не найдена</h1>
      <p>Поездки хранятся в браузере, где их создали. Возможно, ссылка неполная или данные браузера очищены.</p>
      <Link href="/" className="btn btn--accent">
        Собрать новую
      </Link>
    </main>
  )
}

type Tab = 'plan' | 'discover'

function Workspace({ trip }: { trip: Trip }) {
  const [tab, setTab] = useState<Tab>('plan')
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<Highlight>({ placeId: null, source: 'list' })
  const [preview, setPreview] = useState<PlaceDraft[]>([])
  // На телефоне карта и список не помещаются рядом — переключаем кнопкой.
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  return (
    <main className={styles.workspace} data-view={mobileView}>
      <aside className={styles.panel}>
        <TripHeader trip={trip} />
        <div className={styles.tabs} role="tablist" aria-label="Разделы планировщика">
          {(
            [
              ['plan', 'Маршрут'],
              ['discover', 'Добавить места'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              className={styles.tab}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
          <span className={styles.tabIndicator} data-tab={tab} aria-hidden="true" />
        </div>
        <div className={styles.scroll}>
          <div id="panel-plan" role="tabpanel" aria-labelledby="tab-plan" hidden={tab !== 'plan'}>
            <Board
              trip={trip}
              activeDay={activeDay}
              onActiveDay={setActiveDay}
              highlight={highlight}
              onHighlight={setHighlight}
              onDiscover={() => setTab('discover')}
            />
          </div>
          {tab === 'discover' && (
            <div id="panel-discover" role="tabpanel" aria-labelledby="tab-discover">
              <Discover trip={trip} onPreview={setPreview} onHighlight={setHighlight} highlight={highlight} />
            </div>
          )}
        </div>
      </aside>

      <section className={styles.mapArea} aria-label="Карта поездки">
        <TripMap
          trip={trip}
          activeDay={activeDay}
          onActiveDay={setActiveDay}
          highlight={highlight}
          onHighlight={setHighlight}
          preview={tab === 'discover' ? preview : []}
        />
      </section>

      <button
        type="button"
        className={styles.viewToggle}
        onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
      >
        <Icon name={mobileView === 'list' ? 'map' : 'list'} />
        {mobileView === 'list' ? 'Карта' : 'Список'}
      </button>
    </main>
  )
}
