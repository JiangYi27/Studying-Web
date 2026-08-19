const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const config = require('../config');
const store = require('../config/store');
const { sendResetEmail } = require('../config/mailer');

// 新注册账号默认开放全部学习站点
const REGISTER_DEFAULT_SITES = config.sites.map((s) => s.key);

// ==================== 辅助 ====================
// 实时账号表：静态（config）+ 注册（store 文件）。
// 静态账号密码已在 config/index.js 启动时 bcrypt 哈希化，统一使用 passwordHash 比对。
function liveUsers() {
  const staticUsers = config.users;
  const registeredUsers = store
    .listAccounts()
    .map((u) => ({
      username: u.username,
      displayName: u.displayName,
      allowedSites: u.allowedSites,
      passwordHash: u.passwordHash || null,
      role: u.role || '学习者',
      email: u.email || '',
    }));
  const staticNames = new Set(staticUsers.map((u) => u.username));
  return staticUsers.concat(
    registeredUsers.filter((u) => !staticNames.has(u.username))
  );
}

// 统一 bcrypt 比对（不再支持明文密码比对）
function findUser(login, password) {
  if (typeof login !== 'string' || typeof password !== 'string') return null;
  const trimmed = login.trim().toLowerCase();
  let user;

  if (trimmed.includes('@')) {
    // 通过邮箱查找
    const account = store.getAccountByEmail(trimmed);
    if (!account) return null;
    user = liveUsers().find(
      (u) => u.username && u.username.toLowerCase() === account.username.toLowerCase()
    );
  } else {
    // 通过用户名查找
    user = liveUsers().find(
      (u) => u.username && u.username.toLowerCase() === trimmed
    );
  }

  if (!user || !user.passwordHash) return null;
  try {
    return bcrypt.compareSync(password, user.passwordHash) ? user : null;
  } catch (_) {
    return null;
  }
}

// 账号是否已存在（静态或注册，实时查）
function userExists(username) {
  return liveUsers().some(
    (u) => u.username && u.username.toLowerCase() === String(username).toLowerCase()
  );
}

// 邮箱是否已被注册
function emailExists(email) {
  if (!email) return false;
  return !!store.getAccountByEmail(String(email).trim().toLowerCase());
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
      logo: s.logo,
      targetDate: s.targetDate,
    }));
}

// ==================== 登录 ====================
/* 登录成功返回该账号可访问的站点列表；前端据此展示站点选择（>1 时）或直接进入默认站 */
router.post('/login', (req, res) => {
  const { username, password, site, remember } = req.body || {};

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

    // "记住我"：延长 cookie 有效期至 30 天
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    const allowed = allowedSitesOf(user);

    // 站点选择：优先用请求中的站点（需在允许范围内），否则用唯一站点，否则为空
    let chosenSite = null;
    if (site && typeof site === 'string' && allowed.includes(site)) {
      chosenSite = site;
    } else if (allowed.length === 1) {
      chosenSite = allowed[0];
    }

    req.session.user = {
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar || null,
      role: user.role || '学习者',
      allowedSites: allowed,
    };
    req.session.site = chosenSite;

    res.json({
      success: true,
      user: { username: user.username, displayName: user.displayName, avatar: user.avatar || null, role: user.role || '学习者' },
      sites: expandSites(allowed),
      site: chosenSite,
      isAdmin: user.role === '管理员',
    });
  });
});

// ==================== 注册 ====================
/* 自助注册新账号：需要 用户名 + 邮箱 + 密码，bcrypt 哈希落盘。
   注册成功后不自动登录——必须手动登录以确保 session.site 正确设置，
   否则多站点账号会陷入 /app ↔ / 死循环重定向。 */
router.post('/register', (req, res) => {
  const { username, password, displayName, email } = req.body || {};

  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: '请输入账号' });
  }
  const uname = username.trim();

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }

  if (typeof email !== 'string' || !email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: '请输入有效的邮箱地址' });
  }
  const emailClean = email.trim().toLowerCase();

  // 校验 displayName 长度（最长 50 字符）
  const displayNameClean = (typeof displayName === 'string' && displayName.trim())
    ? displayName.trim().slice(0, 50)
    : uname;

  // 检查邮箱是否已被注册
  if (emailExists(emailClean)) {
    return res.status(400).json({ error: '注册失败，请稍后重试' });
  }

  if (userExists(uname)) {
    return res.status(400).json({ error: '注册失败，请稍后重试' });
  }

  const hash = bcrypt.hashSync(password, 10);
  let account;
  try {
    account = store.addAccount({
      username: uname,
      displayName: displayNameClean,
      passwordHash: hash,
      allowedSites: REGISTER_DEFAULT_SITES,
      email: emailClean,
    });
  } catch (err) {
    console.error('[register] 写入账号失败:', err);
    return res.status(500).json({ error: '注册失败，请稍后重试' });
  }
  if (!account) {
    return res.status(400).json({ error: '注册失败，请稍后重试' });
  }

  // 注册成功，不自动登录。让用户手动登录，确保 session.site 正确。
  res.json({ success: true, message: '注册成功，请登录' });
});

// ==================== 忘记密码 ====================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: '请输入邮箱地址' });
  }

  const account = store.getAccountByEmail(email.trim().toLowerCase());
  // 无论邮箱是否存在，都返回相同提示，防止用户枚举
  if (!account) {
    return res.json({ success: true, message: '如果该邮箱已注册，重置链接将发送到您的邮箱' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 小时

  store.updateAccount(account.username, {
    resetToken: token,
    resetTokenExpires: expires,
  });

  const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
  try {
    await sendResetEmail(account.email || email.trim().toLowerCase(), resetLink);
  } catch (err) {
    console.error('[forgot-password] 发送邮件失败:', err);
    // 仍然返回成功，避免泄露信息
  }

  res.json({ success: true, message: '如果该邮箱已注册，重置链接将发送到您的邮箱' });
});

// ==================== 重置密码 ====================
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: '缺少重置令牌' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' });
  }

  const account = store.getAccountByResetToken(token);
  if (!account) {
    return res.status(400).json({ error: '重置链接无效或已过期' });
  }

  const expires = new Date(account.resetTokenExpires);
  if (isNaN(expires.getTime()) || expires < new Date()) {
    return res.status(400).json({ error: '重置链接已过期，请重新申请' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  store.updateAccount(account.username, {
    passwordHash: hash,
    resetToken: null,
    resetTokenExpires: null,
  });

  res.json({ success: true, message: '密码重置成功，请使用新密码登录' });
});

// ==================== 验证重置令牌 ====================
router.get('/verify-reset-token', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: '缺少令牌' });

  const account = store.getAccountByResetToken(token);
  if (!account) return res.status(400).json({ error: '无效的重置链接' });

  const expires = new Date(account.resetTokenExpires);
  if (isNaN(expires.getTime()) || expires < new Date()) {
    return res.status(400).json({ error: '重置链接已过期' });
  }

  res.json({ success: true });
});

// ==================== 选择站点 ====================
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

// ==================== 修改密码 ====================
router.post('/change-password', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const { currentPassword, newPassword } = req.body || {};
  const username = req.session.user.username;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6位' });
  }

  // 查找用户
  const user = liveUsers().find(
    (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!user) {
    return res.status(400).json({ error: '操作失败' });
  }

  // 验证当前密码（统一使用 bcrypt）
  let valid = false;
  if (user.passwordHash) {
    try {
      valid = bcrypt.compareSync(currentPassword, user.passwordHash);
    } catch (_) {
      valid = false;
    }
  }
  if (!valid) {
    return res.status(400).json({ error: '操作失败' });
  }

  // 更新密码
  const hash = bcrypt.hashSync(newPassword, 10);
  const updated = store.updateAccount(username, { passwordHash: hash });
  if (!updated) {
    return res.status(500).json({ error: '密码修改失败' });
  }

  res.json({ success: true, message: '密码修改成功' });
});

// ==================== 更新个人资料（头像/昵称）====================
router.patch('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const { displayName, avatar } = req.body || {};
  const username = req.session.user.username;

  const updates = {};
  if (typeof displayName === 'string' && displayName.trim()) {
    updates.displayName = displayName.trim();
  }
  if (typeof avatar === 'string' && avatar.trim()) {
    updates.avatar = avatar.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: '没有有效的更新字段' });
  }

  const updated = store.updateAccount(username, updates);
  if (!updated) {
    return res.status(400).json({ error: '操作失败' });
  }

  // 更新会话中的字段
  if (updates.displayName) req.session.user.displayName = updates.displayName;
  if (updates.avatar) req.session.user.avatar = updates.avatar;

  res.json({ success: true, user: { username, displayName: updated.displayName, avatar: updated.avatar } });
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
        avatar: req.session.user.avatar || null,
        role: req.session.user.role || '管理员',
      },
      sites: expandSites(allowedSitesOf(req.session.user)),
      site: req.session.site || null,
      hasSite: hasSite,
    });
  }
  return res.status(401).json({ error: '未登录' });
});

module.exports = router;