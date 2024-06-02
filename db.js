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

    static get_user_status(username, cb) {
        db.get('SELECT status FROM users WHERE username = ? AND status = ?', [username, 'admin'], (err, row) => {
          if (err) {
            return cb(err);
          }
      
          if (row) {
            cb(null, row.status);
          } else {
            cb(null, null);
          }
        });
      }

    static create_user(data, cb) {
        // Проверяем, существует ли пользователь с таким же username
        db.get('SELECT * FROM users WHERE username = ?', data.username, (err, row) => {
            if (err) {
                return cb(err);
            }
            
            if (row) {
                // Если пользователь уже существует, вызываем callback с сообщением
                return cb(null, { message: 'User already exists' });
            }
            
            // Если пользователь не существует, создаем нового пользователя
            const sql = 'INSERT INTO users(first_name, last_name, username, status) VALUES (?, ?, ?, ?)';
            db.run(sql, data.first_name, data.last_name, data.username, data.status, (err) => {
                if (err) {
                    return cb(err);
                }
                
                // Вызываем callback с сообщением об успешном создании пользователя
                cb(null, { message: 'User created successfully' });
            });
        });
    }
    static set_user_status(username, newStatus, callback) {
        db.run(
          "UPDATE users SET status = ? WHERE username = ?",
          [newStatus, username],
          function(err) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, { message: "User status updated" });
            }
          }
        );
      }
    }
    
export { db, User };