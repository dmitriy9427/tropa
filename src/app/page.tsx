// Главная страница. Серверный компонент: статичная разметка рендерится при
// сборке, а интерактивные части (форма, список поездок) — клиентские
// компоненты, которые «оживают» в браузере после загрузки JS.

import { Footer } from '@/components/Footer'
import { HeroPreview } from '@/components/HeroPreview'
import { NewTripForm } from '@/components/NewTripForm'
import { SavedTrips } from '@/components/SavedTrips'
import { Topo } from '@/components/Topo'
import styles from './page.module.scss'

const STEPS = [
  {
    title: 'Выбери город',
    text: 'Даты и количество дней. Регистрация не нужна — поездки хранятся прямо в браузере.',
  },
  {
    title: 'Собери идеи',
    text: 'Подборка главных мест города с фото из Википедии, поиск по названию и кафе поблизости.',
  },
  {
    title: 'Разложи по дням',
    text: 'Перетаскивай места между днями. Маршрут, километраж и прогноз погоды пересчитываются сразу.',
  },
]

const FEATURES = [
  ['Карта маршрута', 'Каждый день — своим цветом, номера точек совпадают со списком.'],
  ['Погода на 16 дней', 'Если обещают дождь, день подсветится — самое время для музеев.'],
  ['Ссылка попутчикам', 'Вся поездка сжимается в адрес страницы. Сервер не нужен.'],
  ['Экспорт в календарь', 'Файл .ics для Google, Apple или Outlook.'],
]

export default function Home() {
  return (
    <>
      <main>
        <section className={styles.hero}>
          <Topo className={styles.topo} />
          <div className={styles.copy}>
            <p className={styles.eyebrow}>
              <span className={styles.pulse} aria-hidden="true" />
              Планировщик путешествий
            </p>
            <h1 className={`${styles.title} display`}>
              Поездка, <em>разложенная</em> по&nbsp;дням
            </h1>
            <p className={styles.lead}>
              Собери места на карте, расставь их по дням и узнай, сколько идти пешком и какая будет погода. Всё в
              одном окне.
            </p>
            <NewTripForm />
          </div>
          <HeroPreview className={styles.preview} />
        </section>

        <section className={styles.how} aria-labelledby="how-title">
          <h2 id="how-title" className={`${styles.h2} display`}>
            Три шага до маршрута
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <span className={`${styles.stepNum} mono`}>0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <ul className={styles.features}>
            {FEATURES.map(([title, text]) => (
              <li key={title}>
                <b>{title}</b>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="trips" className={styles.trips} aria-labelledby="trips-title">
          <h2 id="trips-title" className={`${styles.h2} display`}>
            Мои поездки
          </h2>
          <SavedTrips />
        </section>
      </main>
      <Footer />
    </>
  )
}
