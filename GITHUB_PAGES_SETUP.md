# Настройка GitHub Pages для проекта uutki

## 🚀 Быстрая настройка

### 1. Включение GitHub Pages

1. Перейдите в **Settings** вашего репозитория
2. Найдите раздел **Pages** в левом меню
3. В разделе **Source** выберите **Deploy from a branch**
4. Выберите:
   - **Branch**: `main`
   - **Folder**: `/docs`
5. Нажмите **Save**

### 2. Первый деплой

```bash
# Соберите проект для GitHub Pages
pnpm run build:github-pages

# Добавьте файлы в git
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### 3. Проверка

После деплоя ваше приложение будет доступно по адресу:
`https://yourusername.github.io/uutki/`

## 📁 Структура файлов

```
docs/                          # Папка для GitHub Pages
├── index.html                 # Главная страница
├── index-[hash].js           # Основной JavaScript
├── index-[hash].css          # Основные стили
├── vendor-[hash].js          # Vendor библиотеки
├── ui-[hash].js              # UI компоненты
├── utils-[hash].js           # Утилиты
├── icons-[hash].js           # Иконки
└── goose.png                 # Изображения
```

## ⚙️ Автоматический деплой

При каждом пуше в ветку `main` GitHub Actions автоматически:
1. Соберет проект командой `pnpm run build:github-pages`
2. Задеплоит содержимое папки `docs/` на GitHub Pages

## 🔧 Локальная разработка

```bash
# Обычная разработка
pnpm dev

# Предварительный просмотр сборки
pnpm run build:github-pages
pnpm preview
```

## 📝 Важные моменты

- ✅ Папка `docs/` добавлена в `.gitignore` - она генерируется автоматически
- ✅ CSS и JS файлы находятся в корне папки `docs/`
- ✅ Базовый путь настроен как `/uutki/` для GitHub Pages
- ✅ Все ресурсы имеют правильные пути для GitHub Pages

## 🐛 Решение проблем

### Проблема: Страница не загружается
**Решение**: Проверьте, что в настройках GitHub Pages выбран источник "Deploy from a branch" и папка "/docs"

### Проблема: Ресурсы не загружаются
**Решение**: Убедитесь, что базовый путь в `vite.config.ts` настроен как `/uutki/`

### Проблема: Медленная загрузка
**Решение**: Проверьте, что включена минификация и code splitting в конфигурации Vite
