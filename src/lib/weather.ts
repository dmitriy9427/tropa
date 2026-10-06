// Коды погоды WMO (их отдаёт Open-Meteo) → подпись и тип иконки.
// Таблица кодов: https://open-meteo.com/en/docs (раздел «WMO Weather interpretation codes»).

export type WeatherIcon = 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm'

export function describeWeather(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: 'Ясно', icon: 'sun' }
  if (code <= 2) return { label: 'Переменная облачность', icon: 'partly' }
  if (code === 3) return { label: 'Пасмурно', icon: 'cloud' }
  if (code === 45 || code === 48) return { label: 'Туман', icon: 'fog' }
  if (code >= 51 && code <= 57) return { label: 'Морось', icon: 'rain' }
  if (code >= 61 && code <= 67) return { label: 'Дождь', icon: 'rain' }
  if (code >= 71 && code <= 77) return { label: 'Снег', icon: 'snow' }
  if (code >= 80 && code <= 82) return { label: 'Ливень', icon: 'rain' }
  if (code === 85 || code === 86) return { label: 'Снегопад', icon: 'snow' }
  if (code >= 95) return { label: 'Гроза', icon: 'storm' }
  return { label: 'Облачно', icon: 'cloud' }
}

/** Плохая погода для прогулок — подсветим день и подскажем взять музеи. */
export function isBadWeather(code: number, rainChance: number): boolean {
  return rainChance >= 60 || code >= 61
}
