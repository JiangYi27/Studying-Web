/**
 * SQLite 数据库初始化与管理
 * 使用 better-sqlite3 进行数据持久化
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'study.db');

// 确保 data 目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    initTables();
  }
  return db;
}

/**
 * 迁移外键约束：检测旧表是否缺少 CASCADE，若缺少则重建表。
 * SQLite 不支持 ALTER TABLE 修改外键，只能查 SQL 后重建。
 */
function migrateForeignKey(tableName, createSql) {
  const database = db;
  try {
    const row = database.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);
    if (!row || !row.sql) return;
    // 如果建表 SQL 中已包含 ON DELETE CASCADE，跳过迁移
    if (/ON\s+DELETE\s+CASCADE/i.test(row.sql)) return;
    console.log('[DB] 迁移外键约束:', tableName);
    // 备份旧数据 → 删旧表 → 建新表 → 恢复数据
    const oldData = database.prepare(`SELECT * FROM ${tableName}`).all();
    database.exec(`DROP TABLE ${tableName}`);
    database.exec(createSql);
    if (oldData.length > 0) {
      const cols = Object.keys(oldData[0]);
      const placeholders = cols.map(() => '?').join(', ');
      const insert = database.prepare(
        `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`
      );
      const insertMany = database.transaction((rows) => {
        for (const row of rows) {
          insert.run(...cols.map((c) => row[c]));
        }
      });
      insertMany(oldData);
    }
    console.log('[DB] 外键迁移完成:', tableName, '→', oldData.length, '条数据');
  } catch (e) {
    console.error('[DB] 外键迁移失败:', tableName, e.message);
  }
}

function initTables() {
  const database = db;

  // 用户账号表
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT DEFAULT '',
      password_hash TEXT,
      role TEXT DEFAULT '学习者',
      avatar TEXT,
      allowed_sites TEXT DEFAULT '["c"]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户学习数据表（ON DELETE CASCADE：删除账号时自动清理学习数据）
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      completed_sections TEXT DEFAULT '{}',
      completed_dates TEXT DEFAULT '{}',
      section_study_time TEXT DEFAULT '{}',
      notes TEXT DEFAULT '{}',
      bookmarks TEXT DEFAULT '[]',
      streak INTEGER DEFAULT 0,
      total_days INTEGER DEFAULT 0,
      total_study_time INTEGER DEFAULT 0,
      last_study_date TEXT,
      exp INTEGER DEFAULT 0,
      total_exp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      badges TEXT DEFAULT '[]',
      quiz_stats TEXT DEFAULT '{"attempts":0,"bestStreak":0}',
      studied_early INTEGER DEFAULT 0,
      studied_at_night INTEGER DEFAULT 0,
      daily_goal_complete_days INTEGER DEFAULT 0,
      daily_goal_met_date TEXT,
      dark_mode INTEGER DEFAULT 0,
      font_size INTEGER DEFAULT 16,
      sidebar_collapsed INTEGER DEFAULT 0,
      focus_mode INTEGER DEFAULT 0,
      theme_color TEXT DEFAULT '#3b82f6',
      daily_goal INTEGER DEFAULT 1,
      auto_mark INTEGER DEFAULT 0,
      reminder_time TEXT DEFAULT '19:00',
      review_interval INTEGER DEFAULT 3,
      background_music TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
    )
  `);

  // 学习记录表（ON DELETE CASCADE：删除账号时自动清理学习记录）
  database.exec(`
    CREATE TABLE IF NOT EXISTS study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      section TEXT NOT NULL,
      time_minutes INTEGER DEFAULT 0,
      study_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
    )
  `);

  // 迁移：为 accounts 表添加 email 和密码重置字段（如果不存在）
  try { database.exec('ALTER TABLE accounts ADD COLUMN email TEXT DEFAULT \'\''); } catch (e) { /* 已存在 */ }
  try { database.exec('ALTER TABLE accounts ADD COLUMN reset_token TEXT'); } catch (e) { /* 已存在 */ }
  try { database.exec('ALTER TABLE accounts ADD COLUMN reset_token_expires TEXT'); } catch (e) { /* 已存在 */ }

  // 迁移：重建 user_data 表以添加 ON DELETE CASCADE（如果旧表缺少此约束）
  migrateForeignKey('user_data', `
    CREATE TABLE user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      completed_sections TEXT DEFAULT '{}',
      completed_dates TEXT DEFAULT '{}',
      section_study_time TEXT DEFAULT '{}',
      notes TEXT DEFAULT '{}',
      bookmarks TEXT DEFAULT '[]',
      streak INTEGER DEFAULT 0,
      total_days INTEGER DEFAULT 0,
      total_study_time INTEGER DEFAULT 0,
      last_study_date TEXT,
      exp INTEGER DEFAULT 0,
      total_exp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      badges TEXT DEFAULT '[]',
      quiz_stats TEXT DEFAULT '{"attempts":0,"bestStreak":0}',
      studied_early INTEGER DEFAULT 0,
      studied_at_night INTEGER DEFAULT 0,
      daily_goal_complete_days INTEGER DEFAULT 0,
      daily_goal_met_date TEXT,
      dark_mode INTEGER DEFAULT 0,
      font_size INTEGER DEFAULT 16,
      sidebar_collapsed INTEGER DEFAULT 0,
      focus_mode INTEGER DEFAULT 0,
      theme_color TEXT DEFAULT '#3b82f6',
      daily_goal INTEGER DEFAULT 1,
      auto_mark INTEGER DEFAULT 0,
      reminder_time TEXT DEFAULT '19:00',
      review_interval INTEGER DEFAULT 3,
      background_music TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
    )
  `);

  // 迁移：重建 study_records 表以添加 ON DELETE CASCADE（如果旧表缺少此约束）
  migrateForeignKey('study_records', `
    CREATE TABLE study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      section TEXT NOT NULL,
      time_minutes INTEGER DEFAULT 0,
      study_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (username) REFERENCES accounts(username) ON DELETE CASCADE
    )
  `);

  // 审计日志表
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_data_username ON user_data(username);
    CREATE INDEX IF NOT EXISTS idx_study_records_username ON study_records(username);
    CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(study_date);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
  `);

  console.log('[DB] 数据库初始化完成:', DB_PATH);
}

// ==================== 账号操作 ====================
function listAccounts() {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM accounts ORDER BY created_at DESC');
  return stmt.all();
}

function getAccount(username) {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM accounts WHERE LOWER(username) = LOWER(?)');
  return stmt.get(username) || null;
}

function addAccount({ username, displayName, passwordHash, role, allowedSites, email }) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO accounts (username, display_name, password_hash, role, allowed_sites, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  try {
    const result = stmt.run(
      username,
      displayName || username,
      passwordHash,
      role || '学习者',
      JSON.stringify(allowedSites || ['c']),
      email || ''
    );
    return getAccount(username);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return null;
    throw err;
  }
}

function updateAccount(username, updates) {
  const database = getDb();
  const account = getAccount(username);
  if (!account) return null;

  const fields = [];
  const values = [];

  if (updates.displayName !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.displayName);
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(updates.avatar);
  }
  if (updates.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    values.push(updates.passwordHash);
  }
  if (updates.role !== undefined) {
    fields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.allowedSites !== undefined) {
    fields.push('allowed_sites = ?');
    values.push(JSON.stringify(updates.allowedSites));
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.resetToken !== undefined) {
    fields.push('reset_token = ?');
    values.push(updates.resetToken);
  }
  if (updates.resetTokenExpires !== undefined) {
    fields.push('reset_token_expires = ?');
    values.push(updates.resetTokenExpires);
  }

  if (fields.length === 0) return account;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(username);

  const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE LOWER(username) = LOWER(?)`;
  database.prepare(sql).run(...values);
  return getAccount(username);
}

function deleteAccount(username) {
  const database = getDb();
  // 先手动清理子表数据（即使有 ON DELETE CASCADE，也显式清理以兼容旧表）
  database.prepare('DELETE FROM user_data WHERE LOWER(username) = LOWER(?)').run(username);
  database.prepare('DELETE FROM study_records WHERE LOWER(username) = LOWER(?)').run(username);
  // 删除 accounts 主记录
  const stmt = database.prepare('DELETE FROM accounts WHERE LOWER(username) = LOWER(?)');
  const result = stmt.run(username);
  // 清理文件系统中的用户数据目录
  try {
    const fs = require('fs');
    const userDir = require('path').join(__dirname, '..', 'data', 'users', username);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('[DB] 清理用户数据目录失败:', username, e.message);
  }
  return result.changes > 0;
}

function getAccountByEmail(email) {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM accounts WHERE LOWER(email) = LOWER(?)');
  return stmt.get(email) || null;
}

function getAccountByResetToken(token) {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM accounts WHERE reset_token = ?');
  return stmt.get(token) || null;
}

// ==================== 用户学习数据操作 ====================
function getUserData(username) {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM user_data WHERE username = ?');
  const row = stmt.get(username);
  if (!row) return null;
  return parseUserData(row);
}

function initUserData(username) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO user_data (username) VALUES (?)
  `);
  stmt.run(username);
  return getUserData(username);
}

function updateUserData(username, updates) {
  const database = getDb();
  initUserData(username);

  const fields = [];
  const values = [];

  const jsonFields = [
    'completed_sections', 'completed_dates', 'section_study_time',
    'notes', 'badges', 'quiz_stats'
  ];

  Object.entries(updates).forEach(([key, value]) => {
    const dbKey = camelToSnake(key);
    if (value === undefined) return; // 跳过 undefined
    if (jsonFields.includes(dbKey)) {
      fields.push(`${dbKey} = ?`);
      values.push(JSON.stringify(value));
    } else if (typeof value === 'boolean') {
      fields.push(`${dbKey} = ?`);
      values.push(value ? 1 : 0);
    } else {
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return getUserData(username);

  // username 作为 WHERE 条件
  const sql = `UPDATE user_data SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE username = ?`;
  try {
    database.prepare(sql).run(...values, username);
  } catch (err) {
    console.error('[DB] updateUserData error:', err.message);
  }
  return getUserData(username);
}

function parseUserData(row) {
  return {
    username: row.username,
    completedSections: JSON.parse(row.completed_sections || '{}'),
    completedDates: JSON.parse(row.completed_dates || '{}'),
    sectionStudyTime: JSON.parse(row.section_study_time || '{}'),
    notes: JSON.parse(row.notes || '{}'),
    bookmarks: JSON.parse(row.bookmarks || '[]'),
    streak: row.streak || 0,
    totalDays: row.total_days || 0,
    totalStudyTime: row.total_study_time || 0,
    lastStudyDate: row.last_study_date || null,
    exp: row.exp || 0,
    totalExp: row.total_exp || 0,
    level: row.level || 1,
    badges: JSON.parse(row.badges || '[]'),
    quizStats: JSON.parse(row.quiz_stats || '{}'),
    studiedEarly: !!row.studied_early,
    studiedAtNight: !!row.studied_at_night,
    dailyGoalCompleteDays: row.daily_goal_complete_days || 0,
    dailyGoalMetDate: row.daily_goal_met_date || null,
    darkMode: !!row.dark_mode,
    fontSize: row.font_size || 16,
    sidebarCollapsed: !!row.sidebar_collapsed,
    focusMode: !!row.focus_mode,
    themeColor: row.theme_color || '#3b82f6',
    dailyGoal: row.daily_goal || 1,
    autoMark: !!row.auto_mark,
    reminderTime: row.reminder_time || '19:00',
    reviewInterval: row.review_interval || 3,
    backgroundMusic: row.background_music || ''
  };
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// ==================== 统计数据 ====================
function getStats() {
  const database = getDb();

  const totalUsers = database.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
  const activeUsers = database.prepare(`
    SELECT COUNT(DISTINCT username) as count FROM study_records
    WHERE study_date >= date('now', '-7 days')
  `).get().count;
  const totalStudyTime = database.prepare('SELECT COALESCE(SUM(time_minutes), 0) as total FROM study_records').get().total;
  const totalBadges = database.prepare('SELECT SUM(json_array_length(badges)) as total FROM user_data').get().total || 0;

  return { totalUsers, activeUsers, totalStudyTime, totalBadges };
}

function getRecentRecords(limit = 10) {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT sr.*, a.display_name
    FROM study_records sr
    LEFT JOIN accounts a ON sr.username = a.username
    ORDER BY sr.created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function addStudyRecord(username, section, timeMinutes) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO study_records (username, section, time_minutes, study_date)
    VALUES (?, ?, ?, date('now'))
  `);
  stmt.run(username, section, timeMinutes);
}

// ==================== 迁移旧数据 ====================
function migrateFromJson() {
  const fs = require('fs');
  const config = require('../config');

  // 确保静态账号也存在于数据库
  config.users.forEach(user => {
    if (!getAccount(user.username)) {
      try {
        // 静态账号不设置密码hash（通过环境变量验证）
        addAccount({
          username: user.username,
          displayName: user.displayName || user.username,
          passwordHash: null,
          role: user.role || '管理员',
          allowedSites: user.allowedSites || ['c']
        });
        console.log('[DB] 迁移静态账号:', user.username);
      } catch (e) {
        console.error('[DB] 迁移静态账号失败:', user.username, e.message);
      }
    }
  });

  // 迁移注册账号
  const accountsPath = path.join(__dirname, '..', 'data', 'users', 'accounts.json');
  if (fs.existsSync(accountsPath)) {
    try {
      const jsonData = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
      const users = jsonData.users || [];
      users.forEach(user => {
        if (!getAccount(user.username)) {
          addAccount({
            username: user.username,
            displayName: user.displayName,
            passwordHash: user.passwordHash,
            role: user.role || '学习者',
            allowedSites: user.allowedSites || ['c']
          });
          console.log('[DB] 迁移用户:', user.username);
        }
      });
    } catch (e) {
      console.error('[DB] 迁移账号失败:', e.message);
    }
  }

  // 迁移学习数据
  const dataDir = path.join(__dirname, '..', 'data', 'users');
  try {
    if (fs.existsSync(dataDir)) {
      const usernames = fs.readdirSync(dataDir);

      usernames.forEach(username => {
        const userPath = path.join(dataDir, username);
        if (fs.statSync(userPath).isDirectory()) {
          const cPath = path.join(userPath, 'c.json');
          if (fs.existsSync(cPath)) {
            try {
              const cData = JSON.parse(fs.readFileSync(cPath, 'utf-8'));
              // 只迁移已知字段
              const knownFields = {
                completedSections: cData.completedSections,
                completedDates: cData.completedDates,
                sectionStudyTime: cData.sectionStudyTime,
                notes: cData.notes,
                bookmarks: cData.bookmarks,
                streak: cData.streak,
                totalDays: cData.totalDays,
                totalStudyTime: cData.totalStudyTime,
                lastStudyDate: cData.lastStudyDate,
                exp: cData.exp,
                totalExp: cData.totalExp,
                level: cData.level,
                badges: cData.badges,
                quizStats: cData.quizStats,
                darkMode: cData.darkMode,
                fontSize: cData.fontSize,
                themeColor: cData.themeColor,
                dailyGoal: cData.dailyGoal
              };
              updateUserData(username, knownFields);
              console.log('[DB] 迁移学习数据:', username);
            } catch (e) {
              console.error('[DB] 迁移学习数据失败:', username, e.message);
            }
          }
        }
      });
    }
  } catch (e) {
    console.error('[DB] 迁移学习数据目录失败:', e.message);
  }

  console.log('[DB] 迁移完成');
}

// ==================== 审计日志 ====================
function addAuditLog(username, action, detail, ip) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO audit_log (username, action, detail, ip)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(username, action, detail || '', ip || '');
}

function getAuditLogs(limit) {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?
  `);
  return stmt.all(limit || 50);
}

// ==================== 数据库备份 ====================
function backupDatabase() {
  const fs = require('fs');
  const backupDir = require('path').join(__dirname, '..', 'data', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = require('path').join(backupDir, 'backup-' + timestamp + '.db');
  const database = getDb();
  database.backup(backupPath);
  return { path: backupPath, name: 'backup-' + timestamp + '.db' };
}

function listBackups() {
  const fs = require('fs');
  const backupDir = require('path').join(__dirname, '..', 'data', 'backups');
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stat = fs.statSync(require('path').join(backupDir, f));
      return { name: f, size: stat.size, date: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  getDb,
  listAccounts,
  getAccount,
  getAccountByEmail,
  getAccountByResetToken,
  addAccount,
  updateAccount,
  deleteAccount,
  getUserData,
  initUserData,
  updateUserData,
  getStats,
  getRecentRecords,
  addStudyRecord,
  addAuditLog,
  getAuditLogs,
  backupDatabase,
  listBackups,
  migrateFromJson
};
