import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Planner } from '@/components/planner/Planner'
import { Toasts } from '@/components/Toasts'
import styles from './page.module.scss'

export const metadata: Metadata = { title: 'Поездка' }

// Одна страница на все поездки: какая именно — решает адрес (?id=… или ?s=…).
// Динамический сегмент /trip/[id] не подходит: при статическом экспорте все
// страницы собираются заранее, а id поездок появляются уже у пользователя.
//
// Planner читает адрес через useSearchParams. При сборке адреса ещё нет,
// поэтому компонент обёрнут в Suspense: в HTML попадает fallback, а сам
// планировщик рисуется в браузере.
export default function TripPage() {
  return (
    <>
      <Suspense fallback={<div className={styles.loading} aria-label="Загрузка" />}>
        <Planner />
      </Suspense>
      <Toasts />
    </>
  )
}
