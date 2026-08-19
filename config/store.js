/**
 * 注册账号存储（迁移到 SQLite）
 *
 * 保留原有接口，底层使用 db/database.js
 */

const db = require('../db/database');

/**
 * 读取全部注册账号
 */
function listAccounts() {
  return db.listAccounts().map(a => ({
    username: a.username,
    displayName: a.display_name,
    passwordHash: a.password_hash,
    role: a.role,
    avatar: a.avatar,
    email: a.email || '',
    allowedSites: JSON.parse(a.allowed_sites || '["c"]'),
    createdAt: a.created_at
  }));
}

/**
 * 获取单个账号
 */
function getAccount(username) {
  const a = db.getAccount(username);
  if (!a) return null;
  return {
    username: a.username,
    displayName: a.display_name,
    passwordHash: a.password_hash,
    role: a.role,
    avatar: a.avatar,
    email: a.email || '',
    resetToken: a.reset_token || null,
    resetTokenExpires: a.reset_token_expires || null,
    allowedSites: JSON.parse(a.allowed_sites || '["c"]'),
    createdAt: a.created_at
  };
}

/**
 * 新增注册账号
 */
function addAccount({ username, displayName, passwordHash, allowedSites, role, email }) {
  const account = db.addAccount({ username, displayName, passwordHash, allowedSites, role, email });
  if (!account) return null;
  return {
    username: account.username,
    displayName: account.display_name,
    passwordHash: account.password_hash,
    role: account.role,
    email: account.email || '',
    allowedSites: JSON.parse(account.allowed_sites || '["c"]'),
    createdAt: account.created_at
  };
}

/**
 * 更新注册账号
 */
function updateAccount(username, updates) {
  const account = db.updateAccount(username, updates);
  if (!account) return null;
  return {
    username: account.username,
    displayName: account.display_name,
    passwordHash: account.password_hash,
    role: account.role,
    avatar: account.avatar,
    email: account.email || '',
    allowedSites: JSON.parse(account.allowed_sites || '["c"]'),
    createdAt: account.created_at
  };
}

/**
 * 按邮箱查找账号
 */
function getAccountByEmail(email) {
  const a = db.getAccountByEmail(email);
  if (!a) return null;
  return {
    username: a.username,
    displayName: a.display_name,
    passwordHash: a.password_hash,
    role: a.role,
    avatar: a.avatar,
    email: a.email || '',
    resetToken: a.reset_token || null,
    resetTokenExpires: a.reset_token_expires || null,
    allowedSites: JSON.parse(a.allowed_sites || '["c"]'),
    createdAt: a.created_at
  };
}

/**
 * 按重置令牌查找账号
 */
function getAccountByResetToken(token) {
  const a = db.getAccountByResetToken(token);
  if (!a) return null;
  return {
    username: a.username,
    displayName: a.display_name,
    passwordHash: a.password_hash,
    role: a.role,
    avatar: a.avatar,
    email: a.email || '',
    resetToken: a.reset_token || null,
    resetTokenExpires: a.reset_token_expires || null,
    allowedSites: JSON.parse(a.allowed_sites || '["c"]'),
    createdAt: a.created_at
  };
}

/**
 * 删除账号
 */
function deleteAccount(username) {
  return db.deleteAccount(username);
}

/**
 * 迁移旧 JSON 数据到 SQLite
 */
function migrateFromJson() {
  db.migrateFromJson();
}

module.exports = {
  listAccounts,
  getAccount,
  getAccountByEmail,
  getAccountByResetToken,
  addAccount,
  updateAccount,
  deleteAccount,
  migrateFromJson,
  ACCOUNTS_FILE: null // 兼容旧代码
};
