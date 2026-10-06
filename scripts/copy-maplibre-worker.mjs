// MapLibre 6 считает тайлы в Web Worker'е — отдельном JS-файле, который
// библиотека грузит по адресу рядом с собой (new URL(..., import.meta.url)).
// Сборщик Next.js такой «вычисляемый» адрес не видит и файл не копирует,
// поэтому кладём воркер (и общий с ним модуль) в public/maplibre/ сами,
// а в коде указываем путь через setWorkerUrl (см. TripMap.tsx).
// Запускается автоматически перед `npm run dev` и `npm run build`.

import { copyFileSync, mkdirSync } from 'node:fs'

const from = new URL('../node_modules/maplibre-gl/dist/', import.meta.url)
const to = new URL('../public/maplibre/', import.meta.url)
mkdirSync(to, { recursive: true })
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(new URL(file, from), new URL(file, to))
}
