'use client'

import { useId, useState } from 'react'
import { useCitySearch } from '@/lib/queries'
import type { City } from '@/lib/types'
import { useDebounced } from '@/lib/useDebounced'
import styles from './CityCombobox.module.scss'

type Props = {
  value: City | null
  onChange: (city: City | null) => void
}

// Поле с подсказками по шаблону WAI-ARIA «combobox»: фокус остаётся в поле,
// а активный пункт списка объявляется через aria-activedescendant —
// скринридер читает его, стрелки ↑↓ двигают выбор, Enter выбирает, Esc закрывает.
export function CityCombobox({ value, onChange }: Props) {
  const id = useId()
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounced = useDebounced(query, 250)
  const { data = [], isFetching, isError } = useCitySearch(debounced)
  const showList = open && query.trim().length >= 2

  const pick = (city: City) => {
    onChange(city)
    setQuery(city.name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, data.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && showList && data[active]) {
      e.preventDefault()
      pick(data[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={styles.box}>
      <label htmlFor={`${id}-input`} className={styles.label}>
        Куда едем
      </label>
      <input
        id={`${id}-input`}
        className={styles.input}
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={showList && data[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        placeholder="Город, например Казань"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
          if (value) onChange(null)
        }}
        onFocus={() => setOpen(true)}
        // Задержка: клик по пункту списка успевает сработать до закрытия.
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <span className={styles.coords} aria-hidden="true">
          {value.lat.toFixed(2)}° {value.lon.toFixed(2)}°
        </span>
      )}
      <ul id={`${id}-list`} role="listbox" className={styles.list} hidden={!showList} aria-label="Найденные города">
        {data.map((city, i) => (
          <li
            key={`${city.lat},${city.lon}`}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            className={styles.option}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(city)}
            onMouseEnter={() => setActive(i)}
          >
            <b>{city.name}</b>
            <span>{[city.region, city.country].filter(Boolean).join(', ')}</span>
          </li>
        ))}
        {!data.length && (
          <li className={styles.empty} role="presentation">
            {isError ? 'Не удалось связаться с сервисом поиска' : isFetching ? 'Ищем…' : 'Ничего не нашлось'}
          </li>
        )}
      </ul>
    </div>
  )
}
