# Utkiuuu - Бесплатные видеоконференции

Современное приложение для видеоконференций с высоким качеством.

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
- **Build Tool**: Vite
- **Backend**: Node.js, TypeScript, tRPC, Socket.IO
- **Database**: PostgreSQL, Drizzle ORM
- **Real-time**: WebRTC, WebSockets

## 🌐 Поддержка браузеров

Приложение работает во всех современных браузерах:

- ✅ Chrome/Edge 
- ✅ Firefox 
- ✅ Safari 
- ✅ Opera 

**Требования:**
- WebRTC поддержка
- WebSocket поддержка
- ES2020+ поддержка

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
│   ├── _core/
│   │   ├── context.ts     # tRPC контекст
│   │   ├── trpc.ts        # Конфигурация tRPC
│   │   ├── socket.ts      # WebSocket обработчики
│   │   └── db.ts          # База данных
│   └── routers.ts         # tRPC роутеры
├── shared/               # Общие типы и утилиты
├── drizzle/              # Схема базы данных
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



## 📱 Адаптивность

Приложение полностью адаптивно и работает на:

- 📱 Мобильных устройствах
- 💻 Планшетах
- 🖥 Десктопах
- 📺 Больших экранах











- [React](https://reactjs.org/) - UI библиотека

**Сделано с ❤️ для хакатона**
