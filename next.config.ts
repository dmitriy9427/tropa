import type { NextConfig } from 'next'

// На GitHub Pages сайт живёт в подпапке /tropa/ — её передаёт сборка в Actions.
// Локально BASE_PATH пустой, сайт открывается с корня.
const basePath = process.env.BASE_PATH ?? ''

const nextConfig: NextConfig = {
  // Статический экспорт: `next build` кладёт готовые HTML/CSS/JS в out/.
  // Сервер Next не нужен — подойдёт любой хостинг статики.
  output: 'export',
  basePath,
  // /trip → /trip/index.html: так GitHub Pages находит страницу без настроек сервера.
  trailingSlash: true,
  // Оптимизации картинок нужен сервер, в статике её нет — отдаём файлы как есть.
  images: { unoptimized: true },
  // Доступно в коде как process.env.NEXT_PUBLIC_BASE_PATH (для ссылок «поделиться»).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

export default nextConfig
