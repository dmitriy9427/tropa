'use client'

// Клиентские «обёртки» приложения. Сам layout.tsx — серверный компонент,
// а контекст React (QueryClientProvider) работает только на клиенте,
// поэтому провайдеры вынесены в отдельный файл с 'use client'.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // useState, а не константа модуля: свой QueryClient на каждый рендер дерева,
  // кеш не утекает между пререндерами страниц на этапе сборки.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
