# Passport-StreamVi Strategy Library
![Tests workflow](https://github.com/StreamVi/passport-streamvi/actions/workflows/test.yml/badge.svg)
![Build status](https://github.com/StreamVi/passport-streamvi/actions/workflows/publish.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/passport-senler.svg?style=flat-square)](https://www.npmjs.org/package/passport-streamvi)
[![npm downloads](https://img.shields.io/npm/dm/passport-senler.svg?style=flat-square)](https://npm-stat.com/charts.html?package=passport-streamvi)
[![install size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=passport-senler&query=$.install.pretty&label=install%20size&style=flat-square)](https://packagephobia.now.sh/result?p=passport-streamvi)

Библиотека предоставляет стратегию аутентификации для интеграции **StreamVi** с вашим Express приложением через **Passport.js**.

Используется только для получения токена авторизации, продолжать работу рекомендуем с библиотекой **senler-sdk**.

## Установка

Сначала установите необходимые пакеты:

```bash
npm install passport-streamvi
```

## Использование
В примере будет использоваться express (passport устанавливается как зависимость passport-senler)

Вот как можно интегрировать эту библиотеку в ваше **Express.js** приложение, используя **Passport** для аутентификации через Senler:

### Пример:

```javascript
import express from 'express';
import passport from 'passport';
import { StreamViStrategy } from 'passport-streamvi';

passport.use(
  new StreamViStrategy({
    clientID: 'ВАШ_STREAMVI_CLIENT_ID',
    clientSecret: 'ВАШ_STREAMVI_CLIENT_SECRET',
    callbackURL: 'https://yourapp.com/auth/streamvi/callback',
  })
);

const app = express();

// Инициализация маршрута аутентификации через StreamVi
app.get('/auth/streamvi', passport.authenticate('streamvi'));

// Обработчик обратного вызова для StreamVi
app.get(
  '/auth/streamvi/callback',
  passport.authenticate('streamvi', {
    failureRedirect: '/auth/streamvi/error',
    session: false, // Отключите сессии, так как библиотека passport-streamvi не работает с сессиями
  }),
  (req, res) => {
    // Если аутентификация успешна, токен доступен через req.accessToken
    res.json(req.accessToken);
  }
);

// Запуск сервера
app.listen(3000, () => {
  console.log('Приложение запущено на порту 3000');
});
```

### Объяснение:

1. **Конфигурация стратегии StreamVi**:
    - `clientID`: Ваш идентификатор клиента приложения **StreamVi**.
    - `clientSecret`: Ваш секретный ключ клиента приложения **StreamVi**.
    - `callbackURL`: URL, на который **StreamVi** перенаправит после авторизации пользователя. Домен должен быть опубликованным

2. **Маршруты**:
    - `/auth/streamvi`: Перенаправляет пользователей на **StreamVi** для аутентификации.
    - `/auth/streamvi/callback`: Обрабатывает обратный вызов от **StreamVi** после аутентификации. Если аутентификация успешна, объект пользователя будет доступен через `req.user`.

3. **Обработка ошибок**:
    - В случае неудачной аутентификации пользователи будут перенаправлены на `/auth/streamvi/error`.

4. **Отключение сессий**:
    - Опция `session: false` предотвращает сериализацию пользователя в сессии, её функционал бесполезен в данном контексте и включение будет приводить к ошибке

# Используйте streamvi-sdk
passport-streamvi не предоставляет API для работы с StreamVi. используйте в связке с **streamvi-sdk**

## Конфигурация

Необходимо заменить следующие значения на ваши:

- `clientID`: Получите его в панели разработчика **StreamVi**.
- `clientSecret`: Также доступен в настройках вашего приложения **StreamVi**.
- `callbackURL`: Это должен быть публичный URL, на который **StreamVi** перенаправит пользователей после аутентификации.
