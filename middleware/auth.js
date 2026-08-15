/**
 * 登录鉴权中间件
 * 验证 session 中是否存在用户信息，未登录则返回 401。
 * 若已登录，则把当前站点解析到 req.site（包含站点配置），供下游使用。
 * 站点缺失时（未选站）返回 400，前端应引导先选站。
 */
const config = require('../config');

function resolveSite(req) {
  if (!req.session || !req.session.user) return null;
  const key = req.session.site;
  if (!key) return null;
  const site = config.siteByKey[key];
  if (!site) return null;
  // 越权保护：站点必须在账号可访问列表内
  const allowed = req.session.user.allowedSites || [];
  if (!allowed.includes(key)) return null;
  return site;
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const site = resolveSite(req);
  if (!site) {
    // 已登录但未选定站点：用 400 区分于“未登录”，避免前端 401 拦截误判为会话过期
    return res.status(400).json({ error: '请先选择站点' });
  }
  req.site = site;
  req.username = req.session.user.username;
  next();
}

requireAuth.resolveSite = resolveSite;
module.exports = requireAuth;