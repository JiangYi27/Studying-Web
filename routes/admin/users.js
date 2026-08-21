/**
 * 用户管理路由（用户 CRUD + admin 自身登录登出）
 * 依赖：bcrypt, config, store, staticUsersConfig
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const store = require('../../config/store');
const staticUsersConfig = require('../../config/users');
const { logout } = require('../../middleware/sessionHandlers');

// ==================== 中间件：管理员鉴权 ====================
function requireAdmin(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ error: '未登录或无权限' });
  }
  if (req.session.admin || (req.session.user && req.session.user.role === '管理员')) {
    return next();
  }
  return res.status(401).json({ error: '未登录或无权限' });
}

// ==================== 管理员登录 ====================
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '请输入账号和密码' });
  }

  const adminUser = config.users.find(
    (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!adminUser) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  let valid = false;
  if (adminUser.passwordHash) {
    valid = bcrypt.compareSync(password, adminUser.passwordHash);
  } else {
    valid = adminUser.password === password;
  }

  if (!valid) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  req.session.admin = {
    username: adminUser.username,
    displayName: adminUser.displayName || adminUser.username,
    role: '管理员',
  };

  res.json({
    success: true,
    admin: {
      username: adminUser.username,
      displayName: adminUser.displayName || adminUser.username,
      role: '管理员',
    },
  });
});

// ==================== 退出管理员 ====================
router.post('/logout', logout);

// ==================== 获取管理员状态 ====================
router.get('/status', (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({
      loggedIn: true,
      admin: req.session.admin,
    });
  }
  if (req.session && req.session.user && req.session.user.role === '管理员') {
    return res.json({
      loggedIn: true,
      admin: req.session.user,
    });
  }
  res.json({ loggedIn: false });
});

// ==================== 获取所有用户 ====================
router.get('/', requireAdmin, (req, res) => {
  try {
    const accounts = store.listAccounts();
    const users = accounts.map((u) => ({
      username: u.username,
      displayName: u.displayName || u.username,
      role: u.role || '学习者',
      createdAt: u.createdAt,
      allowedSites: u.allowedSites || [],
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// ==================== 获取单个用户 ====================
router.get('/:username', requireAdmin, (req, res) => {
  const { username } = req.params;
  const account = store.getAccount(username);
  if (!account) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({
    success: true,
    user: {
      username: account.username,
      displayName: account.displayName || account.username,
      role: account.role || '学习者',
      createdAt: account.createdAt,
      allowedSites: account.allowedSites || [],
      avatar: account.avatar || null,
    },
  });
});

// ==================== 创建用户 ====================
router.post('/', requireAdmin, (req, res) => {
  const { username, password, displayName, role } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }

  const exists = store.getAccount(username);
  if (exists) {
    return res.status(409).json({ error: '用户已存在' });
  }

  const staticExists = config.users.some(
    (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (staticExists) {
    return res.status(409).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const account = store.addAccount({
    username: username.trim(),
    displayName: displayName && displayName.trim() ? displayName.trim() : username.trim(),
    passwordHash: hash,
    role: role || '学习者',
    allowedSites: config.sites ? config.sites.map((s) => s.key) : ['c'],
  });

  if (!account) {
    return res.status(500).json({ error: '创建用户失败' });
  }

  res.json({
    success: true,
    user: {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      createdAt: account.createdAt,
    },
  });
});

// ==================== 更新用户 ====================
router.put('/:username', requireAdmin, (req, res) => {
  const { username } = req.params;
  const { displayName, password, role } = req.body || {};

  const account = store.getAccount(username);
  if (!account) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const updates = {};

  if (displayName !== undefined && displayName.trim()) {
    updates.displayName = displayName.trim();
  }

  if (role !== undefined) {
    updates.role = role;
  }

  if (password && password.length >= 6) {
    updates.passwordHash = bcrypt.hashSync(password, 10);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: '没有有效的更新字段' });
  }

  const updated = store.updateAccount(username, updates);
  if (!updated) {
    return res.status(500).json({ error: '更新用户失败' });
  }

  res.json({
    success: true,
    user: {
      username: updated.username,
      displayName: updated.displayName,
      role: updated.role,
    },
  });
});

// ==================== 删除用户 ====================
router.delete('/:username', requireAdmin, (req, res) => {
  const { username } = req.params;

  const isStatic = staticUsersConfig.users.some(
    (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (isStatic) {
    return res.status(403).json({ error: '无法删除静态账号（定义在 config/users.js 中）' });
  }

  const account = store.getAccount(username);
  if (!account) {
    return res.status(404).json({ error: '用户不存在' });
  }

  try {
    const deleted = store.deleteAccount(username);
    if (!deleted) {
      return res.status(500).json({ error: '删除失败：数据库操作未生效' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/delete-user]', err);
    res.status(500).json({ error: '删除失败：' + (err.message || '未知错误') });
  }
});

// ==================== 重置用户密码 ====================
router.post('/:username/reset-password', requireAdmin, (req, res) => {
  const { username } = req.params;
  const { newPassword } = req.body || {};

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }

  const account = store.getAccount(username);
  if (!account) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  const updated = store.updateAccount(username, { passwordHash: hash });

  if (!updated) {
    return res.status(500).json({ error: '重置密码失败' });
  }

  res.json({ success: true, message: '密码重置成功' });
});

// ==================== 获取用户详情 ====================
router.get('/:username/detail', requireAdmin, (req, res) => {
  try {
    const { username } = req.params;
    const account = store.getAccount(username);
    if (!account) return res.status(404).json({ error: '用户不存在' });

    const userDataPath = path.join(__dirname, '..', '..', 'data', 'users', username, 'c.json');
    let userData = {};
    if (fs.existsSync(userDataPath)) {
      userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
    }

    const completedSections = userData.completedSections || {};
    const completedCount = Object.values(completedSections).filter(v => v).length;
    const totalSections = 58;

    const recentActivity = [];
    if (userData.sectionStudyTime) {
      Object.entries(userData.sectionStudyTime).slice(-5).reverse().forEach(([section, time]) => {
        recentActivity.push({ section: section.split('/').pop().replace('.md', ''), time });
      });
    }

    res.json({
      success: true,
      detail: {
        username: account.username,
        displayName: account.displayName || account.username,
        email: account.email || '',
        role: account.role || '学习者',
        createdAt: account.createdAt,
        allowedSites: account.allowedSites || [],
        avatar: account.avatar || null,
        stats: {
          completedSections: completedCount,
          totalSections: totalSections,
          completionRate: totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0,
          totalStudyTime: Math.floor((userData.totalStudyTime || 0) / 60),
          streak: userData.streak || 0,
          totalDays: userData.totalDays || 0,
          exp: userData.totalExp || userData.exp || 0,
          level: userData.level || 1,
          lastStudyDate: userData.lastStudyDate || null,
        },
        badges: userData.badges || [],
        recentActivity: recentActivity,
      },
    });
  } catch (err) {
    console.error('[admin/user-detail]', err);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

module.exports = router;
