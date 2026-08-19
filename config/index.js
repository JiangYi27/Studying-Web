require('dotenv').config();
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const usersConfig = require('./users');
const { sites } = require('./sites');
const store = require('./store');
const siteByKey = Object.fromEntries(sites.map((s) => [s.key, s]));

// 密码一律从环境变量注入（USER_PASSWORD_<用户名全大写>），
// 不要把明文密码写进仓库 —— 公开仓库里留一个明文口令等于公开了登录权限。
// 启动时将静态账号的明文密码 bcrypt 哈希化，存储在数据库中，
// 运行时不再暴露明文密码。
const staticUsers = usersConfig.users.map((u) => {
  const envPassword = process.env[`USER_PASSWORD_${u.username.toUpperCase()}`] || null;
  return {
    ...u,
    passwordHash: envPassword ? bcrypt.hashSync(envPassword, 10) : null,
    _envPassword: envPassword, // 用于首次入库/更新
  };
});

// 注册账号（自助注册，密码 bcrypt 哈希存文件），与静态账号合并成统一用户表。
// 合并后每个用户带 passwordHash（注册用户有）或 password（静态用户明文，来自环境变量），
// 由 authRouter.findUser 按类型比对。
const registeredUsers = store.listAccounts().map((u) => ({
  username: u.username,
  displayName: u.displayName,
  allowedSites: u.allowedSites,
  passwordHash: u.passwordHash || null,
}));

// 统一用户表：静态 + 注册。注册账号的 username 与静态账号冲突时以静态为准（跳过）。
const staticNames = new Set(staticUsers.map((u) => u.username));
const allUsers = staticUsers.concat(
  registeredUsers.filter((u) => !staticNames.has(u.username))
);

module.exports = {
  port: process.env.PORT || 3000,
  // 生产部署请务必在环境变量里设置固定的 SESSION_SECRET；
  // 未设置时用随机密钥，每次重启会让所有会话失效（仅适合本地开发，安全兜底）。
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  users: allUsers,
  sites,
  siteByKey,
};