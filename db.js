import sqlite3 from 'sqlite3';
const dbName = 'users.sqlite';
// сама бд
const db = new sqlite3.Database(dbName);

db.serialize(() => {
    const sql = `
        CREATE TABLE IF NOT EXISTS users
            (id integer primary key, first_name TEXT, last_name TEXT, username TEXT, status TEXT DEFAULT 'user')
    `
    db.run(sql)
});

class User {
    static get_users(cb) {
        db.all('SELECT * FROM users', cb)
    }

    static get_user(id, cb) {
        db.get('SELECT * FROM users WHERE id = ?', id, cb)
    }

    static get_user_status(username, cb) {
        db.get('SELECT status FROM users WHERE username = ?', username, cb)
    }

    static create_user(data, cb) {
        const sql = 'INSERT INTO users(first_name, last_name, username, status) VALUES (?, ?, ?, ?)'
        db.run(sql, data.first_name, data.last_name, data.username, data.status, cb)
    }

    // static update_status(username, cb) {
    //     const sql_update = 'UPDATE users'
    // }
}

// экспорт всей бд и таблицы пользователей
// module.exports = db
// module.exports.User = User
export { db, User };

