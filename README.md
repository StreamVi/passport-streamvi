# Passport StreamVi

Стратегия Passport для подключения проекта StreamVi через OAuth. Результат подключения содержит API-токен проекта. Для API-запросов используйте SDK Axios, SDK Fetch или HTTP-клиент.

## Установка

Установите актуальный код из GitHub. Git-установка собирает пакет через `prepare`:

```bash
npm install passport git+https://github.com/StreamVi/passport-streamvi.git
```

Опубликованный в npm выпуск `1.0.6` не включает исправления проверки `state` и PKCE из этой ветки. До обновления npm используйте установку из GitHub. Изменения выпусков перечислены в [CHANGELOG](CHANGELOG.md).

## Подключение в Express

Пример требует `express` и `express-session`. Создайте OAuth-приложение StreamVi и задайте разрешённый адрес возврата. Передайте в окружение `STREAMVI_CLIENT_ID`, `STREAMVI_CLIENT_SECRET`, `CALLBACK_URL` и случайный `SESSION_SECRET`. Настройте доступ `project:read` для примера.

```js
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { StreamViStrategy } from 'passport-streamvi';

const { STREAMVI_CLIENT_ID, STREAMVI_CLIENT_SECRET, CALLBACK_URL, SESSION_SECRET } = process.env;
if (!STREAMVI_CLIENT_ID || !STREAMVI_CLIENT_SECRET || !CALLBACK_URL || !SESSION_SECRET) {
  throw new Error('OAuth configuration missing');
}

const app = express();
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));
app.use(passport.initialize());

passport.use(new StreamViStrategy({
  clientID: STREAMVI_CLIENT_ID,
  clientSecret: STREAMVI_CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
  state: true,
  pkce: true,
}));

app.get('/auth/streamvi', passport.authenticate('streamvi', { scope: ['project:read'] }));
app.get('/auth/streamvi/callback',
  passport.authenticate('streamvi', { session: false, failureRedirect: '/connection-error' }),
  (req, res) => {
    req.session.streamvi = req.user;
    res.redirect('/');
  },
);
app.get('/', (req, res) => res.json({ connected: Boolean(req.session.streamvi) }));
app.get('/connection-error', (req, res) => res.status(400).send('Connection failed'));
app.use((error, req, res, next) => res.status(400).send('Connection failed'));
app.listen(3000);
```

Серверная сессия хранит одноразовый `state` и PKCE verifier между перенаправлениями. Подключите её до Passport. `session: false` в обработчике возврата отключает только автоматическую сериализацию пользователя Passport; сессия OAuth остаётся необходимой. Для production настройте постоянное хранилище сессий и HTTPS-cookie.

Не передавайте собственный строковый `state` в `passport.authenticate`: при `state: true` его создаёт и проверяет хранилище Passport. После отказа или повторного callback обмен кода не выполняется. Асинхронные хранилища состояния также поддерживаются.

## Результат подключения

После успешного обмена в `req.user` находятся:

- `accessToken`: API-токен выбранного проекта.
- `projectId`: внутренний ID проекта. Проверьте и преобразуйте его в число перед передачей числовому параметру SDK.
- `projectExternalId`: внешний ID проекта.

Поля `req.accessToken` нет. Профиль аккаунта не загружается, `refreshToken` не возвращается. Не выводите токен в страницу, URL или лог. Сохраните подключение на сервере и свяжите с пользователем своего приложения.

Необязательный callback конструктора сохранён для совместимости, но успешный обмен передаёт `StreamViUser` напрямую в Passport. Обрабатывайте результат после `passport.authenticate` или в его пользовательском callback.

## Разработка

```bash
npm ci
npm run build
npm test
```

Проверки охватывают успешный PKCE S256, отклонённый и повторный `state`, отсутствие сессии, ошибки и асинхронную работу хранилища. Они не обращаются к production StreamVi.
