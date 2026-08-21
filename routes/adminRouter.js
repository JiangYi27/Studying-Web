/**
 * 管理后台路由（兼容层）
 * 实际路由逻辑已拆分到 routes/admin/ 目录
 * 此文件仅作中转，保留 requireAdmin / auditAction 导出以兼容 server.js
 */
const adminRouter = require('./admin/index');

module.exports = adminRouter;
module.exports.requireAdmin = adminRouter.requireAdmin;
module.exports.auditAction = adminRouter.auditAction;
