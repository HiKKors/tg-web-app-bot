import { Telegraf, Markup } from 'telegraf'
import { message } from 'telegraf/filters'
import { db, User } from './db.js';


// импорт базы данных
// const User = require('./db').User;

const token = '6839956141:AAEHaAlbHk-m5VFPFkrJDXflekn5AHR6inM'
const webAppUrl = 'https://vk.com/'

const MOVIE_API = 'W9YK7TA-SXQ4V4E-KXR6NS8-XF8K78Q'

// const MOVIE_URL_QUERY = 'https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=10&query=%D1%8F%20%D0%BB%D0%B5%D0%B3%D0%B5%D0%BD%D0%B4%D0%B0'

const test_url = 'https://my-json-server.typicode.com/typicode/demo/db'

const bot = new Telegraf(token)



function is_superuser(username) {
  let status = User.get_user_status(username)
  return status
}
// поиск фильма по названию
bot.command('start', (ctx) => {
  ctx.reply(
    'Добро пожаловать! Нажмите на кнопку ниже, чтобы запустить приложение',
    Markup.keyboard([
      Markup.button.webApp('Отправить сообщение', `${webAppUrl}/feedback`),
    ])
  )
})

bot.command('register',async (ctx) => {
  const { id, first_name, last_name, username } = ctx.from;
    
  const userData = {
    first_name: first_name || '',
    last_name: last_name || '',
    username: username || '',
    status: 'user'
  };
  User.create_user(userData, (err) => {
    if (err) {
        console.error(err);
        ctx.reply('Произошла ошибка при регистрации пользователя.');
    } else {
        ctx.reply('Вы успешно зарегистрированы!');
    }
  })
})

bot.command('test', async (ctx) => {
  const data = await fetch('https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=10&query=дорога+перемен',{
    headers:{
      'accept': 'application/json',
      'X-API-KEY': MOVIE_API,
    },
  });
  const respData = await data.json();
  // ctx.reply(JSON.stringify(respData.docs[0].description))
  ctx.reply(username)
})

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
  let movieLength = parseInt(JSON.stringify(movie_info.movieLength))
  let string_info = `Рейтинг: ${JSON.stringify(movie_info.rating.kp)}
Название: ${JSON.stringify(movie_info.name)}
Год: ${JSON.stringify(movie_info.year)}
Жанр: ${JSON.stringify(movie_info.genres)}
Длительность: ${Math.round(movieLength / 60)} ч ${movieLength % 60} мин
Возрастная группа: ${JSON.stringify(movie_info.ageRating)}+
Описание: ${JSON.stringify(movie_info.description)}`
  for (let i = 0; i < 5; i++){
    ctx.reply(string_info)
  }
})

bot.command('help', async (ctx) => {
  const username = ctx.from.username
  
  let info = `Список доступных команд:
  /register - Зарегистрироваться
  /top10 - Топ 10 фильмов на данный момент`

  if (User.get_user_status(username) == 'admin') {
    let info = `Список доступных команд:
    /register - Зарегистрироваться
    /top10 - Топ 10 фильмов на данный момент
    /users - Выводит список всех пользователей`
  }
  ctx.reply(info)
})

bot.command('users', async (ctx) => {
  const username = ctx.from.username

  if (User.get_user_status(username) == 'admin'){

  }
  else {
    ctx.reply('Вы не имеете доступ к данной команде')
  }
})

bot.launch()

