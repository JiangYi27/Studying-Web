const express = require('express');
const router = express.Router();
const config = require('../config');

// ==================== 辅助 ====================
// 账号比对：遍历用户表（明文密码，规划阶段）
function findUser(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  return (
    config.users.find(
      (u) =>
        u.username === username.trim() &&
        u.password === password
    ) || null
  );
}

// 会话中的可访问站点（始终以账号配置为准，防止越权）
function allowedSitesOf(user) {
  return (user && user.allowedSites) || [];
}

// 把站点 key 展开为对象（含 name / icon 等展示信息）
function expandSites(keys) {
  const keysArr = Array.isArray(keys) ? keys : [];
  return keysArr
    .map((k) => config.siteByKey[k])
    .filter(Boolean)
    .map((s) => ({
      key: s.key,
      name: s.name,
      subtitle: s.subtitle,
      theme: s.theme,
      logoText: s.logoText,
      targetDate: s.targetDate,
    }));
}

// ==================== 登录 ====================
/* 登录成功返回该账号可访问的站点列表；前端据此展示站点选择（>1 时）或直接进入默认站 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  // 校验参数存在
  if (typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password.trim()) {
    return res.status(400).json({ error: '请输入账号和密码' });
  }

  const user = findUser(username, password);
  if (!user) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  // 防会话固定：重新生成 session id
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: '登录失败，请重试' });

    req.session.user = {
      username: user.username,
      displayName: user.displayName,
      allowedSites: allowedSitesOf(user),
    };

    // 站点选择：若账号仅有一个可访问站点，直接进入该站
    if (allowedSitesOf(user).length === 1) {
      req.session.site = allowedSitesOf(user)[0];
    }

    res.json({
      success: true,
      user: { username: user.username, displayName: user.displayName },
      sites: expandSites(allowedSitesOf(user)),
      site: req.session.site || null,
    });
  });
});

// ==================== 选择站点 ====================
// 已登录用户在可访问站点之间切换（不影响登录态）
router.post('/select', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const { site } = req.body || {};
  if (typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: '缺少站点参数' });
  }
  if (!allowedSitesOf(req.session.user).includes(site)) {
    return res.status(403).json({ error: '无权访问该站点' });
  }
  req.session.site = site;
  res.json({ success: true, site });
});

// ==================== 退出登录 ====================
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '退出失败，请重试' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ==================== 当前登录状态 ====================
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    const hasSite = !!req.session.site;
    return res.json({
      user: {
        username: req.session.user.username,
        displayName: req.session.user.displayName,
      },
      sites: expandSites(allowedSitesOf(req.session.user)),
      site: req.session.site || null,
      hasSite: hasSite,
    });
  }
  return res.status(401).json({ error: '未登录' });
});

module.exports = router;