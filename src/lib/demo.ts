// Пример поездки для кнопки «Посмотреть пример»: три дня в Казани.
// Координаты и фото — из Wikidata и OpenStreetMap (те же источники, что
// и в подборке мест), так что пример выглядит как настоящая поездка.

import { addDays, today } from './dates'
import { addPlace, createTrip } from './trip'
import type { City, PlaceDraft, Trip } from './types'

export const KAZAN: City = {
  name: 'Казань',
  country: 'Россия',
  region: 'Татарстан',
  lat: 55.78874,
  lon: 49.12214,
  timezone: 'Europe/Moscow',
}

/** day — номер дня (с нуля) или null, если место лежит в «Идеях». */
type Seed = PlaceDraft & { day: number | null }

const PLACES: Seed[] = [
  { day: 0, name: 'Казанский кремль', kind: 'sight', lat: 55.79744, lon: 49.10724, image: 'Казанский кремль. Панорама с колеса обозрения.jpg', wikipedia: 'ru:Казанский кремль', durationMin: 120 },
  { day: 0, name: 'Кул-Шариф', kind: 'sight', lat: 55.7983, lon: 49.1052, image: 'Kazan Kremlin Qolsharif Mosque 08-2016 img2.jpg', wikipedia: 'ru:Кул-Шариф', note: 'Вход бесплатный, бахилы на входе' },
  { day: 0, name: 'Башня Сююмбике', kind: 'sight', lat: 55.80053, lon: 49.10519, image: 'Kazan Kremlin Soyembika Tower 08-2016 img1.jpg', wikipedia: 'ru:Башня Сююмбике', durationMin: 20 },
  { day: 0, name: 'Национальный музей Республики Татарстан', kind: 'museum', lat: 55.79556, lon: 49.11016, image: 'Национальный музей Республики Татарстан.JPG', wikipedia: 'ru:Национальный музей Республики Татарстан' },
  { day: 0, name: 'Улица Баумана', kind: 'other', lat: 55.78887, lon: 49.11859, note: 'Вечерняя прогулка, ужин где-нибудь по пути', durationMin: 90 },
  { day: 1, name: 'Старо-Татарская слобода', kind: 'sight', lat: 55.77811, lon: 49.11776, durationMin: 90 },
  { day: 1, name: 'Мечеть аль-Марджани', kind: 'sight', lat: 55.77972, lon: 49.1175, image: 'Old Tatar Sloboda in Kazan (April 2025) - 0 4.jpg', wikipedia: 'ru:Мечеть аль-Марджани', durationMin: 30 },
  { day: 1, name: 'Музей чак-чака', kind: 'museum', lat: 55.78206, lon: 49.11255, note: 'Чаепитие с дегустацией — бронировать заранее', durationMin: 75 },
  { day: 1, name: 'Петропавловский собор', kind: 'sight', lat: 55.79361, lon: 49.11321, image: 'Петрапаўлаўскі сабор у Казані.jpg', wikipedia: 'ru:Петропавловский собор (Казань)', durationMin: 30 },
  { day: 1, name: 'Театр оперы и балета имени Мусы Джалиля', kind: 'sight', lat: 55.79556, lon: 49.12472, image: 'Театр оперы и балета. Казань.JPG', wikipedia: 'ru:Татарский театр оперы и балета имени Мусы Джалиля', note: 'Билеты на вечер', durationMin: 150 },
  { day: 2, name: 'Казанский зооботанический сад', kind: 'park', lat: 55.76583, lon: 49.13444, image: 'Kazan zoo-botanical garden (entrance).jpg', wikipedia: 'ru:Казанский зооботанический сад' },
  { day: 2, name: 'Дом Кекина', kind: 'sight', lat: 55.79393, lon: 49.12848, image: 'Kazan Kekin Building 08-2016.jpg', wikipedia: 'ru:Дом Кекина', durationMin: 15 },
  { day: 2, name: 'Фуксовский сад', kind: 'park', lat: 55.79973, lon: 49.12991, image: 'Fuks Garden4.JPG', wikipedia: 'ru:Фуксовский сад', durationMin: 30 },
  { day: 2, name: 'Мост Миллениум', kind: 'view', lat: 55.80611, lon: 49.14444, image: 'Views from the high floors of the Korston Hotel (April 2025) - 0 4.jpg', wikipedia: 'ru:Мост Миллениум (Казань)', note: 'Закат над Казанкой', durationMin: 30 },
  { day: null, name: 'Зилантов Успенский монастырь', kind: 'sight', lat: 55.80796, lon: 49.05847, image: 'Зилантов Успенский монастырь 02.jpg', wikipedia: 'ru:Зилантов Успенский монастырь' },
  { day: null, name: 'Парк Победы', kind: 'park', lat: 55.83001, lon: 49.10753, image: 'Victory park (Kazan) (262-1).jpg', wikipedia: 'ru:Парк Победы (Казань)' },
  { day: null, name: 'Хазинэ', kind: 'museum', lat: 55.7986, lon: 49.106, image: '4preobraznensky cadet school.jpg', wikipedia: 'ru:Хазинэ' },
]

/** Демо-поездка: стартует через неделю, чтобы попасть в прогноз погоды. */
export function demoTrip(now = new Date()): Trip {
  let trip = createTrip(KAZAN, addDays(today(now), 7), 3)
  trip = { ...trip, title: 'Выходные в Казани' }
  for (const { day, ...draft } of PLACES) {
    trip = addPlace(trip, draft, day === null ? 'ideas' : `day:${trip.days[day].id}`)
  }
  return trip
}
