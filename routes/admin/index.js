/**
 * 管理后台路由汇总入口
 * 挂载子路由，并导出 requireAdmin 中间件供 server.js 使用
 */
const express = require('express');
const router = express.Router();

// 子路由
const usersRouter = require('./users');
const contentRouter = require('./content');
const quizzesRouter = require('./quizzes');
const sitesRouter = require('./sites');
const extensionsRouter = require('./extensions');
const systemRouter = require('./system');

// 挂载路径对照：
// /admin/login, /admin/logout, /admin/status, /admin/users, /admin/users/:username, /admin/users/:username/detail
router.use(usersRouter);

// /admin/knowledge/:siteKey 及子路由
router.use('/knowledge', contentRouter);

// /admin/quizzes/:siteKey 及子路由
router.use('/quizzes', quizzesRouter);

// /admin/sites 及子路由
router.use('/sites', sitesRouter);

// /admin/extension/upload, /admin/extension/:fileName, /admin/extension/preview/:fileName
router.use('/extension', extensionsRouter);

// /admin/stats, /admin/stats/trends, /admin/export, /admin/import, /admin/clear-data,
// /admin/content, /admin/audit-log, /admin/system-status, /admin/backup, /admin/recent-records
router.use(systemRouter);

// ==================== 导出给 server.js 使用的中间件 ====================
function requireAdmin(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ error: '未登录或无权限' });
  }
  if (req.session.admin || (req.session.user && req.session.user.role === '管理员')) {
    return next();
  }
  return res.status(401).json({ error: '未登录或无权限' });
}

function auditAction(req, action, detail) {
  try {
    const db = require('../../db/database');
    const adminUser = req.session.admin || req.session.user;
    db.addAuditLog(adminUser ? adminUser.username : 'unknown', action, detail, req.ip || '');
  } catch (e) {}
}

module.exports = router;
module.exports.requireAdmin = requireAdmin;
module.exports.auditAction = auditAction;
