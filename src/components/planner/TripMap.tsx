'use client'

import {
  LngLatBounds,
  Map as MapLibre,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { dayColor } from '@/lib/colors'
import { dayPlaces } from '@/lib/trip'
import type { Place, PlaceDraft, Trip } from '@/lib/types'
import { currentTheme } from '@/lib/theme'
import { useTheme } from '@/lib/useTheme'
import { draftKey } from './Discover'
import type { Highlight } from './Planner'
import styles from './TripMap.module.scss'

// Карта на MapLibre GL — открытой библиотеке векторных карт (WebGL).
// Подложка — бесплатные тайлы OpenFreeMap, у светлой и тёмной темы свой стиль.
//
// React и MapLibre живут по-разному: React перерисовывает разметку из
// состояния, а карта — императивный объект со своим состоянием. Поэтому
// карта создаётся один раз (useRef), а эффекты ниже «синхронизируют» её
// с пропсами: обновляют данные линий, метки, камеру.

// Воркер MapLibre лежит в public/maplibre/ (см. scripts/copy-maplibre-worker.mjs).
setWorkerUrl(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/maplibre/maplibre-gl-worker.mjs`)

const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

type Props = {
  trip: Trip
  activeDay: string | null
  onActiveDay: (dayId: string | null) => void
  highlight: Highlight
  onHighlight: (h: Highlight) => void
  preview: PlaceDraft[]
}

type Pin = {
  key: string
  lng: number
  lat: number
  label: string
  color: string | null
  day: string | null
  title: string
  kind: 'day' | 'idea' | 'preview'
}

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export function TripMap({ trip, activeDay, onActiveDay, highlight, onHighlight, preview }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibre | null>(null)
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLElement }>())
  const [ready, setReady] = useState(0)
  const theme = useTheme() ?? 'light'
  // Последние значения колбэков для обработчиков, созданных один раз.
  const handlers = useRef({ onHighlight, onActiveDay })
  useEffect(() => {
    handlers.current = { onHighlight, onActiveDay }
  })

  // --- создание карты (один раз) ---------------------------------------------------
  useEffect(() => {
    if (!container.current) return
    const map = new MapLibre({
      container: container.current,
      style: STYLES[currentTheme()],
      center: [trip.city.lon, trip.city.lat],
      zoom: 12,
      attributionControl: { compact: true },
      // Наклон карты двумя пальцами путал бы с прокруткой на телефоне.
      pitchWithRotate: false,
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    // После загрузки стиля (и после каждой смены темы) заново добавляем свои слои:
    // setStyle заменяет всё содержимое карты.
    map.on('style.load', () => {
      addRouteLayers(map, currentTheme())
      setReady((n) => n + 1)
    })
    mapRef.current = map
    // ResizeObserver: панель на телефоне показывают/прячут — канвас должен подстроиться.
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container.current)
    const pins = markers.current
    return () => {
      ro.disconnect()
      pins.clear()
      map.remove()
      mapRef.current = null
    }
    // Карту создаём один раз; центр города дальше меняет эффект камеры.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- смена темы -----------------------------------------------------------------
  const firstTheme = useRef(true)
  useEffect(() => {
    if (firstTheme.current) {
      firstTheme.current = false
      return
    }
    mapRef.current?.setStyle(STYLES[theme])
  }, [theme])

  // --- линии маршрута -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const features: GeoJSON.Feature[] = trip.days
      .map((day, i) => ({ day, i, places: dayPlaces(trip, day) }))
      .filter(({ places }) => places.length > 1)
      .map(({ day, i, places }) => ({
        type: 'Feature',
        properties: { day: day.id, color: dayColor(i), active: activeDay === null || activeDay === day.id },
        geometry: { type: 'LineString', coordinates: places.map((p) => [p.lon, p.lat]) },
      }))
    ;(map.getSource('routes') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features })
  }, [trip, activeDay, ready])

  // --- прорисовка маршрута выбранного дня ---------------------------------------------
  // Линия «рисуется» от первой точки к последней: line-gradient со ступенькой
  // по line-progress (0…1 вдоль линии), ступеньку двигаем каждый кадр.
  const activeKey = activeDay ? JSON.stringify(trip.days.find((d) => d.id === activeDay)?.placeIds) : ''
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const index = trip.days.findIndex((d) => d.id === activeDay)
    const places = index >= 0 ? dayPlaces(trip, trip.days[index]) : []
    const source = map.getSource('active-route') as GeoJSONSource | undefined
    if (!source) return
    if (places.length < 2) {
      source.setData(EMPTY)
      return
    }
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: places.map((p) => [p.lon, p.lat]) },
    })
    const color = dayColor(index)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min((now - started) / 1100, 1)
      const eased = 1 - (1 - t) ** 3
      if (!map.getLayer('active-route')) return
      map.setPaintProperty('active-route', 'line-gradient', [
        'step',
        ['line-progress'],
        color,
        Math.max(eased, 0.0001),
        'rgba(0,0,0,0)',
      ])
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // activeKey — порядок мест дня: при перестановке линия прорисуется заново.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, activeKey, ready])

  // --- метки ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const pins: Pin[] = []
    trip.days.forEach((day, i) =>
      dayPlaces(trip, day).forEach((p, n) => pins.push(pinFor(p, String(n + 1), dayColor(i), day.id, 'day'))),
    )
    trip.ideaIds.forEach((id) => trip.places[id] && pins.push(pinFor(trip.places[id], '', null, null, 'idea')))
    preview.forEach((p) => {
      // Найденное место, которое уже есть в поездке, второй раз не рисуем.
      if (!pins.some((pin) => Math.abs(pin.lat - p.lat) < 1e-5 && Math.abs(pin.lng - p.lon) < 1e-5)) {
        pins.push({ key: draftKey(p), lng: p.lon, lat: p.lat, label: '', color: null, day: null, title: p.name, kind: 'preview' })
      }
    })

    const seen = new Set<string>()
    for (const pin of pins) {
      seen.add(pin.key)
      let entry = markers.current.get(pin.key)
      if (!entry) {
        // Внешний элемент двигает MapLibre (пишет ему transform и opacity),
        // поэтому увеличение и прозрачность задаём внутреннему <span>.
        const el = document.createElement('button')
        el.type = 'button'
        el.className = styles.pin
        el.append(document.createElement('span'))
        el.addEventListener('mouseenter', () => handlers.current.onHighlight({ placeId: el.dataset.key!, source: 'map' }))
        el.addEventListener('mouseleave', () => handlers.current.onHighlight({ placeId: null, source: 'map' }))
        el.addEventListener('click', () => {
          handlers.current.onHighlight({ placeId: el.dataset.key!, source: 'map' })
          if (el.dataset.day) handlers.current.onActiveDay(el.dataset.day)
        })
        const marker = new Marker({ element: el, anchor: 'center' }).setLngLat([pin.lng, pin.lat]).addTo(map)
        entry = { marker, el }
        markers.current.set(pin.key, entry)
      }
      const { el, marker } = entry
      marker.setLngLat([pin.lng, pin.lat])
      el.dataset.key = pin.key
      el.dataset.kind = pin.kind
      if (pin.day) el.dataset.day = pin.day
      else delete el.dataset.day
      el.firstElementChild!.textContent = pin.label
      el.title = pin.title
      el.setAttribute('aria-label', pin.label ? `${pin.label}. ${pin.title}` : pin.title)
      el.style.setProperty('--color', pin.color ?? '')
      el.toggleAttribute('data-dim', activeDay !== null && pin.kind === 'day' && pin.day !== activeDay)
    }
    for (const [key, { marker }] of markers.current) {
      if (!seen.has(key)) {
        marker.remove()
        markers.current.delete(key)
      }
    }
  }, [trip, preview, activeDay])

  // Подсветка метки при наведении на карточку в списке.
  useEffect(() => {
    for (const [key, { el }] of markers.current) el.toggleAttribute('data-highlight', key === highlight.placeId)
    // Из списка навели на место, которое за краем карты, — плавно подвинуть карту.
    const map = mapRef.current
    const entry = highlight.placeId && highlight.source === 'list' ? markers.current.get(highlight.placeId) : null
    if (map && entry && !map.getBounds().contains(entry.marker.getLngLat())) {
      map.easeTo({ center: entry.marker.getLngLat(), duration: 600 })
    }
  }, [highlight, trip, preview])

  // --- камера ---------------------------------------------------------------------
  // Выбрали день → «перелёт» к его точкам; сняли выбор → показать всю поездку.
  const cameraKey = `${activeDay}|${trip.id}`
  const lastCamera = useRef('')
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const first = lastCamera.current === ''
    if (lastCamera.current === cameraKey) return
    lastCamera.current = cameraKey
    const day = trip.days.find((d) => d.id === activeDay)
    const points = day ? dayPlaces(trip, day) : Object.values(trip.places)
    const padding = { top: 70, bottom: 70, left: 60, right: 60 }
    if (points.length === 0) {
      map.flyTo({ center: [trip.city.lon, trip.city.lat], zoom: 12, duration: first ? 0 : 1200 })
      return
    }
    const bounds = new LngLatBounds()
    points.forEach((p) => bounds.extend([p.lon, p.lat]))
    map.fitBounds(bounds, { padding, maxZoom: 15, duration: first ? 0 : 1400, essential: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraKey, ready])

  return (
    <div className={styles.wrap}>
      <div ref={container} className={styles.map} />
      {activeDay && (
        <button type="button" className={`${styles.all} btn btn--sm`} onClick={() => onActiveDay(null)}>
          Все дни
        </button>
      )}
    </div>
  )
}

function pinFor(p: Place, label: string, color: string | null, day: string | null, kind: Pin['kind']): Pin {
  return { key: p.id, lng: p.lon, lat: p.lat, label, color, day, title: p.name, kind }
}

/** Источники и слои линий маршрута. Вызывается после каждой загрузки стиля. */
function addRouteLayers(map: MapLibre, theme: 'light' | 'dark') {
  map.addSource('routes', { type: 'geojson', data: EMPTY })
  // lineMetrics: true — без этого у линии нет line-progress и градиент недоступен.
  map.addSource('active-route', { type: 'geojson', data: EMPTY, lineMetrics: true })
  map.addLayer({
    id: 'routes-casing',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      // Подложка под линией — цвета фона карты, чтобы маршрут читался поверх улиц.
      'line-color': theme === 'dark' ? '#111613' : '#ffffff',
      'line-width': 7,
      'line-opacity': ['case', ['get', 'active'], 0.85, 0.25],
    },
  })
  map.addLayer({
    id: 'routes',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 3.5,
      'line-opacity': ['case', ['get', 'active'], 0.9, 0.18],
      'line-dasharray': [0.1, 2],
    },
  })
  map.addLayer({
    id: 'active-route',
    type: 'line',
    source: 'active-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-width': 5, 'line-gradient': ['step', ['line-progress'], 'rgba(0,0,0,0)', 0.5, 'rgba(0,0,0,0)'] },
  })
}
