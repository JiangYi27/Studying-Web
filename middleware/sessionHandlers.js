/**
 * Session 处理共享中间件
 * 提供 logout 等通用 session 操作，供 authRouter 和 adminRouter 共用
 */

/**
 * 统一登出处理：销毁 session 并清除 cookie
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '退出失败，请重试' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
}

module.exports = { logout };
