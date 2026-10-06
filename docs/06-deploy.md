# 06. Деплой

Сайт — статический, хостинг — GitHub Pages:
https://dmitriy9427.github.io/tropa/

## Как устроено

`.github/workflows/pages.yml` на каждый пуш в `main`:

1. `npm ci` — установка зависимостей по lock-файлу;
2. `npm test` — если тесты упали, деплоя не будет;
3. `npm run build` с `BASE_PATH=/tropa` — сайт живёт в подпапке;
4. `touch out/.nojekyll` — иначе Pages (Jekyll) спрячет папку `_next`;
5. загрузка `out/` и публикация.

## Локальная проверка

```bash
npm run check
```

Линтер, типы, тесты и сборка — то же, что проверит CI. Посмотреть собранный
сайт: `npm run build && npx serve out`.

## basePath

Локально сайт открывается с корня (`/`), на Pages — из `/tropa/`.
Next добавляет префикс к ссылкам `<Link>`, `router.push`, файлам `_next`.
Вручную префикс нужен в двух местах — они берут его из
`process.env.NEXT_PUBLIC_BASE_PATH`:

- ссылка «поделиться» (`lib/share.ts`);
- адрес воркера карты (`TripMap.tsx`).
