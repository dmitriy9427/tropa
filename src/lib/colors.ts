// Цвета дней — те же, что $day-colors в globals.scss. В CSS они доступны как
// var(--day-N), а карте (MapLibre рисует в WebGL, CSS-переменных не знает)
// нужны настоящие значения — отсюда.
export const DAY_COLORS = ['#e4572e', '#2f7fd8', '#2a9d6f', '#c9378a', '#d9a21b', '#7a5cd6', '#1aa3a3', '#8a6a4a']

export const dayColor = (index: number) => DAY_COLORS[index % DAY_COLORS.length]
export const dayVar = (index: number) => `var(--day-${index % DAY_COLORS.length})`
