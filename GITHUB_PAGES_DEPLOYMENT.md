# Инструкции по деплою на GitHub Pages

## 🚀 Быстрый старт

### 1. Подготовка репозитория

1. Создайте новый репозиторий на GitHub
2. Склонируйте его локально:
   ```bash
   git clone https://github.com/yourusername/uutki.git
   cd uutki
   ```

### 2. Настройка GitHub Pages

1. Перейдите в Settings → Pages
2. В разделе "Source" выберите "Deploy from a branch"
3. Выберите "main" branch и папку "/docs"
4. Сохраните настройки

### 3. Первый деплой

```bash
# Добавьте все файлы
git add .

# Сделайте коммит
git commit -m "Initial commit: Conference App optimized for GitHub Pages"

# Отправьте в репозиторий
git push origin main
```

### 4. Проверка деплоя

- GitHub Actions автоматически соберет и задеплоит приложение
- Проверьте статус в разделе "Actions" вашего репозитория
- После успешного деплоя приложение будет доступно по адресу:
  `https://yourusername.github.io/uutki/`

## 🔧 Локальная разработка

### Установка зависимостей

```bash
# Установка pnpm (если не установлен)
npm install -g pnpm

# Установка зависимостей проекта
pnpm install
```

### Запуск в режиме разработки

```bash
# Обычный режим разработки
pnpm dev

# Режим разработки с GitHub Pages базовым путем
pnpm dev --mode github-pages
```

### Сборка для продакшена

```bash
# Обычная сборка
pnpm build

# Сборка для GitHub Pages
pnpm build:github-pages

# Предварительный просмотр
pnpm preview
```

## 📁 Структура файлов после деплоя

```
docs/
├── index.html
├── index-[hash].js
├── index-[hash].css
├── vendor-[hash].js
├── ui-[hash].js
├── utils-[hash].js
├── icons-[hash].js
└── goose.png
```

## ⚙️ Настройки окружения

### Переменные окружения

Создайте файл `.env.local` для локальной разработки:

```env
VITE_APP_TITLE=Conference App
VITE_API_URL=http://localhost:3000
```

### Настройки Vite

Основные настройки в `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/uutki/' : '/',
  build: {
    outDir: 'dist/public',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          icons: ['lucide-react'],
          utils: ['wouter', 'sonner'],
        },
      },
    },
  },
}));
```

## 🔍 Отладка проблем

### Проблема: Приложение не загружается

**Решение:**
1. Проверьте правильность базового пути в `vite.config.ts`
2. Убедитесь, что в `package.json` правильно настроен скрипт `build:github-pages`
3. Проверьте логи в GitHub Actions

### Проблема: Статические ресурсы не загружаются

**Решение:**
1. Убедитесь, что все ресурсы находятся в папке `client/public/`
2. Проверьте пути к ресурсам в коде (они должны начинаться с `/`)
3. Проверьте настройки `publicDir` в конфигурации Vite

### Проблема: Медленная загрузка

**Решение:**
1. Проверьте настройки `manualChunks` в `rollupOptions`
2. Убедитесь, что включена минификация
3. Проверьте размер бандла командой `pnpm build:github-pages`

## 📊 Мониторинг производительности

### Анализ бандла

```bash
# Установка анализатора бандла
pnpm add -D rollup-plugin-visualizer

# Добавьте в vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... другие плагины
    visualizer({
      filename: 'dist/stats.html',
      open: true,
    }),
  ],
});
```

### Проверка Lighthouse

1. Откройте приложение в браузере
2. Откройте DevTools → Lighthouse
3. Запустите аудит Performance
4. Проверьте показатели:
   - First Contentful Paint
   - Largest Contentful Paint
   - Cumulative Layout Shift

## 🚀 Оптимизации

### 1. Код-сплиттинг

```typescript
// Ленивая загрузка компонентов
const LazyComponent = lazy(() => import('./LazyComponent'));

// Использование в JSX
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

### 2. Оптимизация изображений

```typescript
// Использование WebP формата
const imageSrc = useMemo(() => {
  const isWebPSupported = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;
  
  return isWebPSupported ? '/image.webp' : '/image.jpg';
}, []);
```

### 3. Кэширование

```typescript
// Service Worker для кэширования
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 📱 Мобильная оптимизация

### Viewport настройки

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
```

### Touch события

```typescript
// Оптимизация для мобильных устройств
const handleTouchStart = useCallback((e: TouchEvent) => {
  // Обработка touch событий
}, []);
```

## 🔒 Безопасность

### CSP заголовки

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### Валидация данных

```typescript
// Использование Zod для валидации
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const validateUser = (data: unknown) => {
  return userSchema.parse(data);
};
```

## 📈 Аналитика

### Google Analytics

```typescript
// Добавьте в index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🎯 SEO оптимизация

### Мета-теги

```html
<meta name="description" content="Бесплатное приложение для видеоконференций">
<meta name="keywords" content="видеоконференции, онлайн встречи, бесплатно">
<meta property="og:title" content="Conference App">
<meta property="og:description" content="Бесплатные видеоконференции">
<meta property="og:image" content="/og-image.jpg">
```

### Структурированные данные

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Conference App",
  "description": "Бесплатное приложение для видеоконференций",
  "url": "https://yourusername.github.io/uutki/",
  "applicationCategory": "BusinessApplication"
}
</script>
```
