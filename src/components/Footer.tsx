import styles from './Footer.module.scss'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        Тропа — пет-проект{' '}
        <a href="https://github.com/dmitriy9427" target="_blank" rel="noreferrer">
          Дмитрия Рябова
        </a>
        . Код на{' '}
        <a href="https://github.com/dmitriy9427/tropa" target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
      <p className={styles.credits}>
        Данные: © <a href="https://www.openstreetmap.org/copyright">участники OpenStreetMap</a>,{' '}
        <a href="https://www.wikidata.org">Wikidata</a>, <a href="https://commons.wikimedia.org">Wikimedia Commons</a>. Погода —{' '}
        <a href="https://open-meteo.com">Open-Meteo</a>. Карта — <a href="https://openfreemap.org">OpenFreeMap</a>.
      </p>
    </footer>
  )
}
