require('dotenv').config();
const crypto = require('node:crypto');

const usersConfig = require('./users');
const { sites } = require('./sites');
const siteByKey = Object.fromEntries(sites.map((s) => [s.key, s]));

// 密码一律从环境变量注入（USER_PASSWORD_<用户名全大写>），
// 不要把明文密码写进仓库 —— 公开仓库里留一个明文口令等于公开了登录权限。
// 未配置的用户 password 为 null，登录时无法匹配（找不到密码即登录失败）。
const usersWithPasswords = usersConfig.users.map((u) => ({
  ...u,
  password: process.env[`USER_PASSWORD_${u.username.toUpperCase()}`] || null,
}));

module.exports = {
  port: process.env.PORT || 3000,
  // 生产部署请务必在环境变量里设置固定的 SESSION_SECRET；
  // 未设置时用随机密钥，每次重启会让所有会话失效（仅适合本地开发，安全兜底）。
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  users: usersWithPasswords,
  sites,
  siteByKey,
};