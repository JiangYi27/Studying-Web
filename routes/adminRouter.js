const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('../config');
const store = require('../config/store');

// ==================== 中间件：管理员鉴权 ====================
function requireAdmin(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ error: '未登录或无权限' });
  }
  // 允许 admin session 或 user session 中 role=管理员
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

  // 查找管理员账号
  const adminUser = config.users.find(
    (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!adminUser) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  // 验证密码（支持明文环境变量密码或 bcrypt 哈希）
  let valid = false;
  if (adminUser.passwordHash) {
    valid = bcrypt.compareSync(password, adminUser.passwordHash);
  } else {
    valid = adminUser.password === password;
  }

  if (!valid) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  // 创建管理员会话
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
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '退出失败，请重试' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

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
router.get('/users', requireAdmin, (req, res) => {
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
router.get('/users/:username', requireAdmin, (req, res) => {
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
router.post('/users', requireAdmin, (req, res) => {
  const { username, password, displayName, role } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }

  // 检查是否已存在
  const exists = store.getAccount(username);
  if (exists) {
    return res.status(409).json({ error: '用户已存在' });
  }

  // 检查是否与静态账号冲突
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

  auditAction(req, 'create_user', '创建用户: ' + account.username, req.ip);

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
router.put('/users/:username', requireAdmin, (req, res) => {
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

  auditAction(req, 'update_user', '更新用户: ' + username, req.ip);

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
router.delete('/users/:username', requireAdmin, (req, res) => {
  const { username } = req.params;

  // 不允许删除静态账号
  const isStatic = config.users.some(
    (u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (isStatic) {
    return res.status(403).json({ error: '无法删除静态账号（定义在 config/users.js 中）' });
  }

  // 先检查用户是否存在
  const account = store.getAccount(username);
  if (!account) {
    return res.status(404).json({ error: '用户不存在' });
  }

  try {
    const deleted = store.deleteAccount(username);
    if (!deleted) {
      return res.status(500).json({ error: '删除失败：数据库操作未生效' });
    }
    auditAction(req, 'delete_user', '删除用户: ' + username, req.ip);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/delete-user]', err);
    res.status(500).json({ error: '删除失败：' + (err.message || '未知错误') });
  }
});

// ==================== 重置用户密码 ====================
router.post('/users/:username/reset-password', requireAdmin, (req, res) => {
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

  auditAction(req, 'reset_password', '重置密码: ' + username, req.ip);

  res.json({ success: true, message: '密码重置成功' });
});

// ==================== 获取统计数据 ====================
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const accounts = store.listAccounts();

    // 读取所有用户的学习数据
    let totalStudyTime = 0;
    let totalBadges = 0;
    let totalExp = 0;
    let activeUsers = 0;
    let newUsersThisWeek = 0;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    accounts.forEach((account) => {
      try {
        // 统计本周新注册用户
        if (account.createdAt && new Date(account.createdAt) >= weekAgo) {
          newUsersThisWeek++;
        }

        const userDataPath = require('path').join(
          __dirname,
          '..',
          'data',
          'users',
          account.username,
          'c.json'
        );
        const fs = require('fs');
        if (fs.existsSync(userDataPath)) {
          const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
          totalStudyTime += userData.totalStudyTime || 0;
          totalBadges += (userData.badges && userData.badges.length) || 0;
          totalExp += userData.totalExp || userData.exp || 0;
          if (userData.lastStudyDate) {
            const lastDate = new Date(userData.lastStudyDate);
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) activeUsers++;
          }
        }
      } catch (e) {
        // 忽略单个用户数据读取错误
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers: accounts.length,
        activeUsers: activeUsers,
        totalStudyTime: Math.floor(totalStudyTime / 60), // 转换为分钟
        totalBadges: totalBadges,
        totalExp: totalExp,
        newUsersThisWeek: newUsersThisWeek,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// ==================== 获取最近学习记录 ====================
router.get('/recent-records', requireAdmin, (req, res) => {
  try {
    const accounts = store.listAccounts();
    const records = [];

    accounts.forEach((account) => {
      try {
        const userDataPath = require('path').join(
          __dirname,
          '..',
          'data',
          'users',
          account.username,
          'c.json'
        );
        const fs = require('fs');
        if (fs.existsSync(userDataPath)) {
          const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
          if (userData.sectionStudyTime) {
            Object.entries(userData.sectionStudyTime).forEach(([section, time]) => {
              records.push({
                username: account.username,
                displayName: account.displayName || account.username,
                section: section.split('/').pop().replace('.md', ''),
                time: time,
                date: userData.lastStudyDate || '未知',
              });
            });
          }
        }
      } catch (e) {
        // 忽略
      }
    });

    // 按时间排序，取最近10条
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, records: records.slice(0, 10) });
  } catch (err) {
    console.error('[admin/recent-records]', err);
    res.status(500).json({ error: '获取学习记录失败' });
  }
});

// ==================== 获取内容列表 ====================
router.get('/content', requireAdmin, (req, res) => {
  try {
    const contentDir = require('path').join(__dirname, '..', 'data', 'content');
    const fs = require('fs');
    const content = [];

    if (fs.existsSync(contentDir)) {
      const sites = fs.readdirSync(contentDir);
      sites.forEach((siteKey) => {
        const sitePath = require('path').join(contentDir, siteKey);
        if (fs.statSync(sitePath).isDirectory()) {
          const siteConfig = config.siteByKey[siteKey] || { name: siteKey, key: siteKey };
          const chapters = [];

          try {
            const files = fs.readdirSync(sitePath);
            files.filter(f => f.endsWith('.json')).forEach(file => {
              const chapterData = JSON.parse(fs.readFileSync(require('path').join(sitePath, file), 'utf-8'));
              chapters.push({
                name: chapterData.title || file.replace('.json', ''),
                file: file
              });
            });
          } catch (e) {}

          content.push({
            key: siteKey,
            name: siteConfig.name,
            chapters: chapters
          });
        }
      });
    }

    res.json({ success: true, content });
  } catch (err) {
    console.error('[admin/content]', err);
    res.status(500).json({ error: '获取内容列表失败' });
  }
});

// ==================== 获取站点列表 ====================
router.get('/sites', requireAdmin, (req, res) => {
  try {
    const sites = (config.sites || []).map(s => ({
      key: s.key,
      name: s.name,
      subtitle: s.subtitle,
      theme: s.theme ? s.theme.accent : '#6366f1',
      targetDate: s.targetDate || null
    }));
    res.json({ success: true, sites });
  } catch (err) {
    res.status(500).json({ error: '获取站点列表失败' });
  }
});

// ==================== 获取单个站点 ====================
router.get('/sites/:key', requireAdmin, (req, res) => {
  const site = config.siteByKey[req.params.key];
  if (!site) return res.status(404).json({ error: '站点不存在' });
  res.json({
    success: true,
    site: {
      key: site.key,
      name: site.name,
      subtitle: site.subtitle,
      theme: site.theme ? site.theme.accent : '#6366f1'
    }
  });
});

// ==================== 创建/更新站点 ====================
router.post('/sites', requireAdmin, (req, res) => {
  // 站点配置需要手动修改 config.js，此接口预留
  res.status(501).json({ error: '请手动修改 config.js 配置站点' });
});

router.put('/sites/:key', requireAdmin, (req, res) => {
  res.status(501).json({ error: '请手动修改 config.js 配置站点' });
});

// ==================== 导出全部数据 ====================
router.get('/export', requireAdmin, (req, res) => {
  try {
    const accounts = store.listAccounts();
    const exportData = {
      exportDate: new Date().toISOString(),
      users: accounts.map(u => ({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt
      })),
      userData: {}
    };

    const dataDir = require('path').join(__dirname, '..', 'data', 'users');
    const fs = require('fs');
    if (fs.existsSync(dataDir)) {
      const usernames = fs.readdirSync(dataDir);
      usernames.forEach(username => {
        const userPath = require('path').join(dataDir, username);
        if (fs.statSync(userPath).isDirectory()) {
          const cPath = require('path').join(userPath, 'c.json');
          if (fs.existsSync(cPath)) {
            exportData.userData[username] = JSON.parse(fs.readFileSync(cPath, 'utf-8'));
          }
        }
      });
    }

    res.json({ success: true, ...exportData });
  } catch (err) {
    console.error('[admin/export]', err);
    res.status(500).json({ error: '导出失败' });
  }
});

// ==================== 导入数据 ====================
router.post('/import', requireAdmin, (req, res) => {
  res.status(501).json({ error: '导入功能开发中' });
});

// ==================== 清除所有数据 ====================
router.delete('/clear-data', requireAdmin, (req, res) => {
  try {
    const dataDir = require('path').join(__dirname, '..', 'data', 'users');
    const fs = require('fs');

    if (fs.existsSync(dataDir)) {
      const usernames = fs.readdirSync(dataDir);
      usernames.forEach(username => {
        const userPath = require('path').join(dataDir, username);
        if (fs.statSync(userPath).isDirectory()) {
          const cPath = require('path').join(userPath, 'c.json');
          if (fs.existsSync(cPath)) {
            const userData = JSON.parse(fs.readFileSync(cPath, 'utf-8'));
            // 重置进度但保留配置
            userData.completedSections = {};
            userData.completedDates = {};
            userData.sectionStudyTime = {};
            userData.lastStudyDate = null;
            userData.streak = 0;
            userData.totalDays = 0;
            userData.totalStudyTime = 0;
            userData.exp = 0;
            userData.totalExp = 0;
            userData.level = 1;
            userData.badges = [];
            userData.dailyGoalCompleteDays = 0;
            fs.writeFileSync(cPath, JSON.stringify(userData, null, 2));
          }
        }
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[admin/clear-data]', err);
    res.status(500).json({ error: '清除数据失败' });
  }
});

// ==================== 获取趋势数据（图表用） ====================
router.get('/stats/trends', requireAdmin, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const fs = require('fs');
    const path = require('path');
    const accounts = store.listAccounts();
    const now = new Date();
    const dailyData = {};

    // 初始化日期
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyData[key] = { date: key, activeUsers: 0, studyTime: 0, newUsers: 0 };
    }

    accounts.forEach(account => {
      // 统计新用户
      if (account.createdAt) {
        const createdKey = new Date(account.createdAt).toISOString().slice(0, 10);
        if (dailyData[createdKey]) dailyData[createdKey].newUsers++;
      }
      // 统计学习数据
      try {
        const userDataPath = path.join(__dirname, '..', 'data', 'users', account.username, 'c.json');
        if (fs.existsSync(userDataPath)) {
          const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
          if (userData.lastStudyDate) {
            const studyKey = new Date(userData.lastStudyDate).toISOString().slice(0, 10);
            if (dailyData[studyKey]) {
              dailyData[studyKey].activeUsers++;
              dailyData[studyKey].studyTime += Math.floor((userData.totalStudyTime || 0) / 60);
            }
          }
        }
      } catch (e) {}
    });

    res.json({ success: true, trends: Object.values(dailyData) });
  } catch (err) {
    console.error('[admin/trends]', err);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

// ==================== 获取用户详情 ====================
router.get('/users/:username/detail', requireAdmin, (req, res) => {
  try {
    const { username } = req.params;
    const account = store.getAccount(username);
    if (!account) return res.status(404).json({ error: '用户不存在' });

    const fs = require('fs');
    const path = require('path');
    const userDataPath = path.join(__dirname, '..', 'data', 'users', username, 'c.json');
    let userData = {};
    if (fs.existsSync(userDataPath)) {
      userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
    }

    // 计算章节完成数
    const completedSections = userData.completedSections || {};
    const completedCount = Object.values(completedSections).filter(v => v).length;
    const totalSections = 58; // approximate total from knowledge/c/

    // 最近活动
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

// ==================== 审计日志 ====================
router.get('/audit-log', requireAdmin, (req, res) => {
  try {
    const db = require('../db/database');
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.getAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (err) {
    console.error('[admin/audit-log]', err);
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

// ==================== 系统状态 ====================
router.get('/system-status', requireAdmin, (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '..', 'data', 'study.db');
    const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    const backups = require('../db/database').listBackups();

    res.json({
      success: true,
      status: {
        dbSize: Math.round(dbSize / 1024),
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        platform: process.platform,
        backups: backups,
      },
    });
  } catch (err) {
    console.error('[admin/system-status]', err);
    res.status(500).json({ error: '获取系统状态失败' });
  }
});

// ==================== 数据库备份 ====================
router.post('/backup', requireAdmin, (req, res) => {
  try {
    const db = require('../db/database');
    const result = db.backupDatabase();
    const adminUser = req.session.admin || req.session.user;
    db.addAuditLog(adminUser ? adminUser.username : 'unknown', 'backup', '创建数据库备份: ' + result.name, req.ip);
    res.json({ success: true, backup: result });
  } catch (err) {
    console.error('[admin/backup]', err);
    res.status(500).json({ error: '备份失败' });
  }
});

// ==================== 站点 CRUD（通过写 config/sites.js） ====================
router.post('/sites', requireAdmin, (req, res) => {
  try {
    const { name, key, subtitle, theme } = req.body || {};
    if (!name || !key) return res.status(400).json({ error: '站点名称和Key不能为空' });

    const fs = require('fs');
    const path = require('path');
    const sitesFile = path.join(__dirname, '..', 'config', 'sites.js');

    // 读取现有站点配置
    const sitesConfig = require('../config/sites');
    const existing = sitesConfig.sites || [];

    if (existing.find(s => s.key === key)) {
      return res.status(409).json({ error: '站点Key已存在' });
    }

    const newSite = {
      key: key,
      name: name,
      subtitle: subtitle || '',
      contentRoot: 'knowledge/' + key,
      quizzes: key,
      chaptersKey: key,
      theme: { accent: theme || '#6366f1' },
      logoText: 'lab研习室',
      logo: '/image/logo.png',
      targetDate: null,
    };
    existing.push(newSite);

    // 写回文件
    const newContent = `/**
 * 站点注册表
 */
module.exports = {
  sites: ${JSON.stringify(existing, null, 2)},
};`;
    fs.writeFileSync(sitesFile, newContent, 'utf-8');

    // 清除 require 缓存
    delete require.cache[require.resolve('../config/sites')];
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../config/index')];

    res.json({ success: true, site: newSite });
  } catch (err) {
    console.error('[admin/sites-create]', err);
    res.status(500).json({ error: '创建站点失败' });
  }
});

router.put('/sites/:key', requireAdmin, (req, res) => {
  try {
    const { key } = req.params;
    const { name, subtitle, theme } = req.body || {};

    const fs = require('fs');
    const path = require('path');
    const sitesFile = path.join(__dirname, '..', 'config', 'sites.js');
    const sitesConfig = require('../config/sites');
    const existing = sitesConfig.sites || [];

    const idx = existing.findIndex(s => s.key === key);
    if (idx === -1) return res.status(404).json({ error: '站点不存在' });

    if (name) existing[idx].name = name;
    if (subtitle !== undefined) existing[idx].subtitle = subtitle;
    if (theme) existing[idx].theme = { accent: theme };

    const newContent = `/**
 * 站点注册表
 */
module.exports = {
  sites: ${JSON.stringify(existing, null, 2)},
};`;
    fs.writeFileSync(sitesFile, newContent, 'utf-8');

    delete require.cache[require.resolve('../config/sites')];
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../config/index')];

    res.json({ success: true, site: existing[idx] });
  } catch (err) {
    console.error('[admin/sites-update]', err);
    res.status(500).json({ error: '更新站点失败' });
  }
});

router.delete('/sites/:key', requireAdmin, (req, res) => {
  try {
    const { key } = req.params;
    const fs = require('fs');
    const path = require('path');
    const sitesFile = path.join(__dirname, '..', 'config', 'sites.js');
    const sitesConfig = require('../config/sites');
    const existing = sitesConfig.sites || [];

    const idx = existing.findIndex(s => s.key === key);
    if (idx === -1) return res.status(404).json({ error: '站点不存在' });

    existing.splice(idx, 1);

    const newContent = `/**
 * 站点注册表
 */
module.exports = {
  sites: ${JSON.stringify(existing, null, 2)},
};`;
    fs.writeFileSync(sitesFile, newContent, 'utf-8');

    delete require.cache[require.resolve('../config/sites')];
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../config/index')];

    res.json({ success: true });
  } catch (err) {
    console.error('[admin/sites-delete]', err);
    res.status(500).json({ error: '删除站点失败' });
  }
});

// ==================== 审计日志中间件（记录管理员操作） ====================
function auditAction(req, action, detail) {
  try {
    const db = require('../db/database');
    const adminUser = req.session.admin || req.session.user;
    db.addAuditLog(adminUser ? adminUser.username : 'unknown', action, detail, req.ip);
  } catch (e) {}
}

// ==================== 知识内容 CRUD ====================
const contentBase = require('path').join(__dirname, '..', 'knowledge');

// 获取某站点的全部章节和文件（含文件内容）
router.get('/knowledge/:siteKey', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const siteDir = path.join(contentBase, req.params.siteKey);
    if (!fs.existsSync(siteDir)) return res.json({ success: true, chapters: [] });
    const entries = fs.readdirSync(siteDir, { withFileTypes: true });
    const chapters = [];
    entries.filter(e => e.isDirectory()).sort((a,b) => a.name.localeCompare(b.name)).forEach(dir => {
      const files = fs.readdirSync(path.join(siteDir, dir.name)).filter(f => f.endsWith('.md')).sort((a,b) => a.localeCompare(b));
      const sections = files.map(f => ({ name: f, title: f.replace(/^\d+[-_]*/, '').replace('.md', '') }));
      chapters.push({ name: dir.name, title: dir.name.replace(/^\d+[-_]*/, ''), sections });
    });
    res.json({ success: true, chapters });
  } catch (e) { res.status(500).json({ error: '获取知识内容失败' }); }
});

// 获取单个 markdown 文件内容
router.get('/knowledge/:siteKey/:chapterName/:fileName', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, content, fileName: req.params.fileName });
  } catch (e) { res.status(500).json({ error: '读取文件失败' }); }
});

// 更新 markdown 文件内容
router.put('/knowledge/:siteKey/:chapterName/:fileName', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const { content } = req.body || {};
    if (typeof content !== 'string') return res.status(400).json({ error: '内容不能为空' });
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    fs.writeFileSync(filePath, content, 'utf-8');
    // 清除内容缓存
    try { require('../models/contentModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '保存文件失败' }); }
});

// 创建新 markdown 文件
router.post('/knowledge/:siteKey/:chapterName', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const { fileName, content } = req.body || {};
    if (!fileName || typeof fileName !== 'string') return res.status(400).json({ error: '文件名不能为空' });
    const safeName = fileName.replace(/\.md$/i, '') + '.md';
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, safeName);
    if (fs.existsSync(filePath)) return res.status(409).json({ error: '文件已存在' });
    fs.writeFileSync(filePath, content || '# ' + safeName.replace('.md', '') + '\n\n', 'utf-8');
    try { require('../models/contentModel').clearCache(); } catch (e) {}
    res.json({ success: true, fileName: safeName });
  } catch (e) { res.status(500).json({ error: '创建文件失败' }); }
});

// 删除 markdown 文件
router.delete('/knowledge/:siteKey/:chapterName/:fileName', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    fs.unlinkSync(filePath);
    try { require('../models/contentModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '删除文件失败' }); }
});

// 创建新章节文件夹
router.post('/knowledge/:siteKey', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const { chapterName } = req.body || {};
    if (!chapterName || typeof chapterName !== 'string') return res.status(400).json({ error: '章节名不能为空' });
    const safeName = chapterName.replace(/[\/\\:*?"<>|]/g, '-');
    const dirPath = path.join(contentBase, req.params.siteKey, safeName);
    if (fs.existsSync(dirPath)) return res.status(409).json({ error: '章节已存在' });
    fs.mkdirSync(dirPath, { recursive: true });
    res.json({ success: true, chapterName: safeName });
  } catch (e) { res.status(500).json({ error: '创建章节失败' }); }
});

// ==================== 拓展文档管理 ====================
const multer = require('multer');
const extDir = require('path').join(__dirname, '..', 'knowledge', 'extension');
const extStorage = multer.diskStorage({
  destination: extDir,
  filename: (req, file, cb) => {
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = require('path').basename(original).replace(/[\/\\:*?"<>|]/g, '-');
    cb(null, safeName);
  }
});
const extUpload = multer({ storage: extStorage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/extension/upload', requireAdmin, extUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  const ext = require('path').extname(req.file.originalname).toLowerCase();
  if (!['.docx', '.doc'].includes(ext)) {
    require('fs').unlinkSync(req.file.path);
    return res.status(400).json({ error: '仅支持 .docx 和 .doc 文件' });
  }
  res.json({ success: true, fileName: req.file.filename });
});

router.delete('/extension/:fileName', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const path = require('path');
    const filePath = path.join(extDir, path.basename(req.params.fileName));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '删除文件失败' }); }
});

router.get('/extension/preview/:fileName', requireAdmin, (req, res) => {
  try {
    const extModel = require('../models/extensionModel');
    extModel.getHtml(decodeURIComponent(req.params.fileName)).then(html => {
      res.json({ success: true, html });
    }).catch(() => res.status(404).json({ error: '预览失败' }));
  } catch (e) { res.status(500).json({ error: '预览失败' }); }
});

// ==================== 题库管理 ====================
const quizDir = require('path').join(__dirname, '..', 'public', 'data');

function quizFilePath(siteKey) {
  const site = config.siteByKey[siteKey] || { quizzes: 'quizzes' };
  return require('path').join(quizDir, (site.quizzes || 'quizzes') + '.json');
}

router.get('/quizzes/:siteKey', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const file = quizFilePath(req.params.siteKey);
    if (!fs.existsSync(file)) return res.json({ success: true, chapters: [] });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    res.json({ success: true, chapters: data });
  } catch (e) { res.status(500).json({ error: '获取题库失败' }); }
});

router.post('/quizzes/:siteKey', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const file = quizFilePath(req.params.siteKey);
    const { chapterId, question } = req.body || {};
    if (!chapterId || !question || !question.question || !question.options) {
      return res.status(400).json({ error: '参数不完整' });
    }
    let data = [];
    if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    let chapter = data.find(c => c.chapterId === chapterId);
    if (!chapter) {
      chapter = { chapterId, title: chapterId, questions: [] };
      data.push(chapter);
    }
    chapter.questions.push(question);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '添加题目失败' }); }
});

router.put('/quizzes/:siteKey/:chapterId/:questionIndex', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const file = quizFilePath(req.params.siteKey);
    const { question } = req.body || {};
    if (!fs.existsSync(file)) return res.status(404).json({ error: '题库不存在' });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const chapter = data.find(c => c.chapterId === req.params.chapterId);
    if (!chapter || !chapter.questions[req.params.questionIndex]) return res.status(404).json({ error: '题目不存在' });
    chapter.questions[req.params.questionIndex] = question;
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '更新题目失败' }); }
});

router.delete('/quizzes/:siteKey/:chapterId/:questionIndex', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const file = quizFilePath(req.params.siteKey);
    if (!fs.existsSync(file)) return res.status(404).json({ error: '题库不存在' });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const chapter = data.find(c => c.chapterId === req.params.chapterId);
    if (!chapter) return res.status(404).json({ error: '章节不存在' });
    chapter.questions.splice(req.params.questionIndex, 1);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '删除题目失败' }); }
});

router.post('/quizzes/:siteKey/chapter', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const file = quizFilePath(req.params.siteKey);
    const { chapterId, title } = req.body || {};
    if (!chapterId) return res.status(400).json({ error: '章节ID不能为空' });
    let data = [];
    if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (data.find(c => c.chapterId === chapterId)) return res.status(409).json({ error: '章节已存在' });
    data.push({ chapterId, title: title || chapterId, questions: [] });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '创建章节失败' }); }
});

router.delete('/quizzes/:siteKey/:chapterId', requireAdmin, (req, res) => {
  try {
    const fs = require('fs'); const file = quizFilePath(req.params.siteKey);
    if (!fs.existsSync(file)) return res.status(404).json({ error: '题库不存在' });
    let data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const idx = data.findIndex(c => c.chapterId === req.params.chapterId);
    if (idx === -1) return res.status(404).json({ error: '章节不存在' });
    data.splice(idx, 1);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: '删除章节失败' }); }
});

module.exports = router;
