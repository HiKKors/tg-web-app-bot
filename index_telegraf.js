import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { db, User } from './db.js';
import express from 'express';
import bodyParser from 'body-parser';

// импорт базы данных
// const User = require('./db').User;

const token = '6839956141:AAEHaAlbHk-m5VFPFkrJDXflekn5AHR6inM';
const webAppUrl = 'https://vk.com/';

const MOVIE_API = 'W9YK7TA-SXQ4V4E-KXR6NS8-XF8K78Q';

// const MOVIE_URL_QUERY = 'https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=10&query=%D1%8F%20%D0%BB%D0%B5%D0%B3%D0%B5%D0%BD%D0%B4%D0%B0';

const test_url = 'https://my-json-server.typicode.com/typicode/demo/db';

const bot = new Telegraf(token);

function is_superuser(username) {
  let status = User.get_user_status(username);
  return status;
}

// поиск фильма по названию
bot.command('start', (ctx) => {
  ctx.reply(
    'Добро пожаловать! Нажмите на кнопку ниже, чтобы запустить приложение',
    Markup.keyboard([
      Markup.button.webApp('Отправить сообщение', `${webAppUrl}/feedback`),
    ])
  );
});

bot.command('register', async (ctx) => {
  const { id, first_name, last_name, username } = ctx.from;
    
  const userData = {
    first_name: first_name || '',
    last_name: last_name || '',
    username: username || '',
    status: 'user'
  };
  User.create_user(userData, (err, result) => {
    if (err) {
      console.error(err);
      ctx.reply('Произошла ошибка при регистрации пользователя.');
    } else {
      if (result.message === 'User already exists') {
        ctx.reply('Вы уже зарегистрированы.');
      } else {
        ctx.reply('Вы успешно зарегистрированы!');
      }
    }
  });
});

bot.command('test', async (ctx) => {
  const data = await fetch('https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=10&query=дорога+перемен',{
    headers:{
      'accept': 'application/json',
      'X-API-KEY': MOVIE_API,
    },
  });
  const respData = await data.json();
  // ctx.reply(JSON.stringify(respData.docs[0].description))
  ctx.reply(username);
});

// топ фильмов
bot.command('top', async (ctx) => {
  const data = await fetch('https://api.kinopoisk.dev/v1.4/movie?page=1&limit=1&notNullFields=top250&sortField=id&sortType=1&type=movie&lists=top250',{
    headers:{
      'accept': 'application/json',
      'X-API-KEY': MOVIE_API,
    },
  });
  const respData = await data.json();
  // let movie_info = JSON.stringify(respData.docs[0])
  let movie_info = respData.docs[0];
  let movieLength = parseInt(JSON.stringify(movie_info.movieLength));
  let string_info = `Рейтинг: ${JSON.stringify(movie_info.rating.kp)}
Название: ${JSON.stringify(movie_info.name)}
Год: ${JSON.stringify(movie_info.year)}
Жанр: ${JSON.stringify(movie_info.genres)}
Длительность: ${Math.round(movieLength / 60)} ч ${movieLength % 60} мин
Возрастная группа: ${JSON.stringify(movie_info.ageRating)}+
Описание: ${JSON.stringify(movie_info.description)}`;
  for (let i = 0; i < 5; i++){
    ctx.reply(string_info);
  }
});

bot.command('help', async (ctx) => {
  const username = ctx.from.username;

  User.get_user_status(username, (err, status) => {
    if (err) {
      console.error(err);
      ctx.reply('Произошла ошибка при получении статуса пользователя');
      return;
    }

    let info = `Список доступных команд:
    /register - Зарегистрироваться
    /top10 - Топ 10 фильмов на данный момент`;

    if (status === 'admin') {
      info += `
    /users - Выводит список всех пользователей
    /setstatus - Изменяет статус пользователя`;
    }

    ctx.reply(info);
  });
});

bot.command('users', async (ctx) => {
  const username = ctx.from.username;

  User.get_user_status(username, (err, status) => {
    if (err) {
      console.error(err);
      ctx.reply('Произошла ошибка при получении статуса пользователя');
      return;
    }

    if (status === 'admin') {
      // Получаем список всех пользователей
      db.all('SELECT username, status FROM users', (err, rows) => {
        if (err) {
          console.error(err);
          ctx.reply('Произошла ошибка при получении списка пользователей');
          return;
        }

        // Формируем сообщение с информацией о пользователях
        let message = 'Список пользователей:\n\n';
        rows.forEach((row) => {
          message += `Имя: ${row.username}\nСтатус: ${row.status}\n\n`;
        });

        ctx.reply(message);
      });
    } else {
      ctx.reply('Вы не имеете доступ к данной команде');
    }
  });
});

bot.command('setstatus', async (ctx) => {
  const username = ctx.from.username;

  User.get_user_status(username, (err, status) => {
    if (err) {
      console.error(err);
      ctx.reply('Произошла ошибка при получении статуса пользователя');
      return;
    }

    if (status === 'admin') {
      // Получаем список всех пользователей
      db.all('SELECT username, status FROM users', (err, rows) => {
        if (err) {
          console.error(err);
          ctx.reply('Произошла ошибка при получении списка пользователей');
          return;
        }

        // Формируем сообщение с информацией о пользователях
        let message = 'Список пользователей:\n\n';
        rows.forEach((row) => {
          message += `Имя: ${row.username}\nСтатус: ${row.status}\n\n`;
        });

        ctx.reply(message, Markup.inlineKeyboard([
          Markup.button.callback('Изменить статус', 'change_status')
        ]));
      });
    } else {
      ctx.reply('Вы не имеете доступ к данной команде');
    }
  });
});

bot.action('change_status', async (ctx) => {
  const username = ctx.from.username;

  // Получаем список пользователей
  db.all('SELECT username, status FROM users', (err, rows) => {
    if (err) {
      console.error(err);
      ctx.reply('Произошла ошибка при получении списка пользователей');
      return;
    }

    // Формируем сообщение с вариантами статусов
    let message = 'Выберите пользователя для изменения статуса:\n\n';
    const buttons = [];
    rows.forEach((row) => {
      if (row.username !== username) {
        buttons.push(Markup.button.callback(`${row.username} (${row.status})`, `set_status_${row.username}`));
      }
    });

    ctx.reply(message, Markup.inlineKeyboard(buttons));
  });
});

bot.action(/set_status_(.+)/, async (ctx) => {
  const username = ctx.match[1];

  // Получаем текущий статус пользователя
  User.get_user_status(username, (err, currentStatus) => {
    if (err) {
      console.error(err);
      ctx.reply('Произошла ошибка при получении статуса пользователя');
      return;
    }

    // Определяем новый статус
    let newStatus;
    if (currentStatus === 'admin') {
      newStatus = 'user';
    } else {
      newStatus = 'admin';
    }

    // Изменяем статус пользователя
    User.set_user_status(username, newStatus, (err, result) => {
      if (err) {
        console.error(err);
        ctx.reply('Произошла ошибка при изменении статуса пользователя');
        return;
      }

      ctx.reply(`Статус пользователя ${username} изменен на '${newStatus}'`);
    });
  });
});

// Создание сервера Express для приема данных из веб-приложения
const app = express();
app.use(bodyParser.json());

app.post('/sendMovie', async (req, res) => {
  const movie = req.body;

  const chatId = 'YOUR_CHAT_ID'; // Замените на реальный chat ID или динамически получайте его

  const message = `
Название: ${movie.nameRu || movie.nameEn}
Рейтинг: ${movie.rating || movie.ratingKinopoisk || movie.ratingImdb}
Жанр: ${movie.genres.map(genre => genre.genre).join(', ')}
Год: ${movie.year}
Описание: ${movie.description}
Время: ${movie.filmLength || 'Не указано'} минут
Сайт: ${movie.webUrl || 'Не указан'}
`;

  try {
    await bot.telegram.sendPhoto(chatId, { url: movie.posterUrl }, { caption: message });
    res.status(200).send('Message sent');
  } catch (error) {
    console.error('Error sending message to Telegram', error);
    res.status(500).send('Failed to send message');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

bot.launch();
