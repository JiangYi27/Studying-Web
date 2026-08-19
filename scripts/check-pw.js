const db = require('better-sqlite3')('d:/Studying Web/data/study.db');
const users = db.prepare('SELECT username, password_hash FROM accounts').all();
console.log(JSON.stringify(users, null, 2));
