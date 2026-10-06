// Корневой layout: общая обёртка для всех страниц (html, шрифты, шапка).
// Серверный компонент — выполняется на этапе сборки, в браузер уходит готовый HTML.

import type { Metadata, Viewport } from 'next'
import { Golos_Text, JetBrains_Mono, Unbounded } from 'next/font/google'
import { Header } from '@/components/Header'
import { Providers } from '@/components/Providers'
import { THEME_SCRIPT } from '@/lib/theme'
import '@/styles/globals.scss'

// next/font скачивает шрифты при сборке и раздаёт их с нашего же домена:
// нет запроса к Google в браузере и нет «прыжка» текста при подгрузке шрифта.
// variable — имя CSS-переменной, через неё шрифты подключаются в стилях.
const display = Unbounded({ subsets: ['latin', 'cyrillic'], variable: '--font-display', weight: ['500', '700'] })
const body = Golos_Text({ subsets: ['latin', 'cyrillic'], variable: '--font-body' })
const mono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-mono', weight: ['400', '600'] })

const SITE = 'https://dmitriy9427.github.io/tropa/'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Тропа — планировщик путешествий', template: '%s · Тропа' },
  description: 'Собери поездку по дням: места на карте, маршрут, прогноз погоды и ссылка для попутчиков.',
  openGraph: {
    title: 'Тропа — планировщик путешествий',
    description: 'Места по дням, карта маршрута и погода в одном окне.',
    url: SITE,
    siteName: 'Тропа',
    locale: 'ru_RU',
    type: 'website',
    images: ['og.png'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4efe6' },
    { media: '(prefers-color-scheme: dark)', color: '#111613' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: скрипт темы меняет data-theme у <html> до гидратации,
    // и React не должен считать это ошибкой.
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
