// Тема: 'light' | 'dark' в localStorage, иначе — системная настройка.
// Скрипт THEME_SCRIPT выполняется в <head> до первой отрисовки, поэтому
// страница сразу открывается в нужной теме, без вспышки светлого фона.

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'tropa:theme'

export const THEME_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

/** Текущая тема с учётом системной настройки. */
export function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme
  if (explicit === 'light' || explicit === 'dark') return explicit
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
  window.dispatchEvent(new Event('themechange'))
}

/** Подписка для useSyncExternalStore: смена темы кнопкой или в системе. */
export function subscribeTheme(callback: () => void): () => void {
  const media = matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', callback)
  window.addEventListener('themechange', callback)
  return () => {
    media.removeEventListener('change', callback)
    window.removeEventListener('themechange', callback)
  }
}
