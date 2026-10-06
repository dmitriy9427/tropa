import Link from 'next/link'
import styles from './Header.module.scss'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

// Серверный компонент: в нём нет состояния. Интерактивная только кнопка
// темы — она отдельный клиентский компонент («островок» интерактивности).
export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Тропа — на главную">
        <Logo />
        <span className="display">Тропа</span>
      </Link>
      <nav className={styles.nav} aria-label="Основная навигация">
        <Link href="/#trips">Мои поездки</Link>
        <ThemeToggle />
      </nav>
    </header>
  )
}
