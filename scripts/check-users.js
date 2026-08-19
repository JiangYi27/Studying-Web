const db = require('better-sqlite3')('d:/Studying Web/data/study.db');
const users = db.prepare('SELECT username, email, role FROM accounts').all();
console.log('Users:', JSON.stringify(users, null, 2));
