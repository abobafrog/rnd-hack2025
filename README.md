# Conference App - Бесплатные видеоконференции

Современное приложение для видеоконференций с высоким качеством, оптимизированное для GitHub Pages.

## 🚀 Демо

Приложение доступно на GitHub Pages: [https://username.github.io/uutki/](https://username.github.io/uutki/)

## ✨ Особенности

- 🎥 Высокое качество видеозвонков
- 🔐 Безопасная аутентификация
- 👤 Гостевой режим без регистрации
- 📱 Адаптивный дизайн
- ⚡ Быстрая загрузка
- 🎨 Современный UI/UX

## 🛠 Технологии

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **Routing**: Wouter
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## 📦 Установка и запуск

### Локальная разработка

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm dev

# Сборка для продакшена
pnpm build

# Предварительный просмотр сборки
pnpm preview
```

### Деплой на GitHub Pages

1. Форкните репозиторий
2. В настройках репозитория включите GitHub Pages
3. Выберите источник "Deploy from a branch" → "main" → "/docs"
4. При пуше в main ветку автоматически запустится деплой

## 🏗 Структура проекта

```
├── client/                 # Frontend приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   │   ├── auth/       # Компоненты аутентификации
│   │   │   ├── layout/     # Компоненты макета
│   │   │   ├── meeting/    # Компоненты встреч
│   │   │   └── ui/         # UI компоненты
│   │   ├── lib/           # Утилиты и хелперы
│   │   ├── pages/         # Страницы приложения
│   │   └── contexts/      # React контексты
│   └── public/            # Статические файлы
├── server/                # Backend сервер
├── shared/               # Общие типы и утилиты
└── .github/workflows/     # GitHub Actions
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

## 🎯 Оптимизации для GitHub Pages

- **Code Splitting**: Разделение кода на чанки для быстрой загрузки
- **Tree Shaking**: Удаление неиспользуемого кода
- **Minification**: Сжатие JavaScript и CSS
- **Asset Optimization**: Оптимизация изображений и шрифтов
- **Caching**: Настройка кэширования для статических ресурсов
- **SEO**: Мета-теги и Open Graph для социальных сетей

## 🔧 Конфигурация

### Vite конфигурация

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/uutki/' : '/',
  build: {
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

### Скрипты сборки

```json
{
  "scripts": {
    "build:github-pages": "cross-env NODE_ENV=production vite build --mode github-pages",
    "preview": "vite preview"
  }
}
```

## 📱 Адаптивность

Приложение полностью адаптивно и работает на:
- 📱 Мобильных устройствах
- 💻 Планшетах  
- 🖥 Десктопах
- 📺 Больших экранах

## 🔒 Безопасность

- Локальное хранение данных пользователей
- Валидация форм
- Защита от XSS атак
- Безопасная обработка пользовательского ввода

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🙏 Благодарности

- [React](https://reactjs.org/) - UI библиотека
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI компоненты
- [Lucide](https://lucide.dev/) - Иконки
