# EduRAG Frontend

Фронтенд приложение для общения с образовательным RAG-агентом EduRAG.

## Технологии

- **React** 19+ с TypeScript
- **Vite** - быстрая сборка
- **Tailwind CSS** - стилизация
- **Framer Motion** - анимации
- **Zustand** - управление состоянием
- **Lucide React** - иконки

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` и укажите URL API:
```bash
VITE_API_URL=http://localhost:8000
```

3. Запустите dev сервер:
```bash
npm run dev
```

4. Откройте браузер по адресу `http://localhost:5173`

## Сборка для production

```bash
npm run build
```

## Функции

- ✅ Чат с агентом EduRAG
- ✅ Поддержка трёх типов запросов: вопросы, квизы, задания
- ✅ Сохранение контекста диалога по типу запроса
- ✅ Тёмная тема
- ✅ Адаптивный дизайн
- ✅ Анимации сообщений
- ✅ Typing индикатор

## Структура проекта

```
src/
├── components/     # React компоненты
├── store/         # Zustand store
├── api/           # API клиент
├── types/         # TypeScript типы
└── App.tsx        # Главный компонент
```
