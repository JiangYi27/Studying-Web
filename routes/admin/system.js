/**
 * 系统管理路由（统计、备份、审计、导出、清理）
 * 依赖：config, store, db, express
 */
const express = require('express');
const router = express.Router();
const config = require('../../config');
const store = require('../../config/store');
const db = require('../../db/database');

const fs = require('fs');
const path = require('path');

// ==================== 审计日志中间件 ====================
// auditAction 会从外层（index.js）传入，以避免循环依赖
function createAuditAction(getDb, getSession) {
  return function auditAction(action, detail) {
    try {
      const session = getSession();
      const adminUser = session?.admin || session?.user;
      getDb().addAuditLog(adminUser ? adminUser.username : 'unknown', action, detail, '');
    } catch (e) {}
  };
}

// ==================== 获取统计数据（使用 SQLite） ====================
router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({
      success: true,
      stats: {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        totalStudyTime: Math.floor(stats.totalStudyTime / 60),
        totalBadges: stats.totalBadges,
        totalExp: stats.totalExp,
        newUsersThisWeek: stats.newUsersThisWeek,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// ==================== 获取最近学习记录（使用 SQLite） ====================
router.get('/recent-records', (req, res) => {
  try {
    const rows = db.getRecentRecords(10);
    const records = rows.map(r => ({
      username: r.username,
      displayName: r.display_name || r.username,
      section: r.section.split('/').pop().replace('.md', ''),
      time: r.time_minutes,
      date: r.created_at ? r.created_at.slice(0, 10) : '未知',
    }));
    res.json({ success: true, records });
  } catch (err) {
    console.error('[admin/recent-records]', err);
    res.status(500).json({ error: '获取学习记录失败' });
  }
});

// ==================== 导出全部数据 ====================
router.get('/export', (req, res) => {
  try {
    const accounts = store.listAccounts();
    const exportData = {
      exportDate: new Date().toISOString(),
      users: accounts.map(u => ({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
      })),
      userData: {},
    };

    const dataDir = path.join(__dirname, '..', '..', 'data', 'users');
    if (fs.existsSync(dataDir)) {
      const usernames = fs.readdirSync(dataDir);
      usernames.forEach(username => {
        const userPath = path.join(dataDir, username);
        if (fs.statSync(userPath).isDirectory()) {
          const cPath = path.join(userPath, 'c.json');
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
router.post('/import', (req, res) => {
  res.status(501).json({ error: '导入功能开发中' });
});

// ==================== 清除所有数据（使用 SQLite） ====================
router.delete('/clear-data', (req, res) => {
  try {
    const accounts = store.listAccounts();
    accounts.forEach(account => {
      try {
        db.updateUserData(account.username, {
          completedSections: {},
          completedDates: {},
          sectionStudyTime: {},
          lastStudyDate: null,
          streak: 0,
          totalDays: 0,
          totalStudyTime: 0,
          exp: 0,
          totalExp: 0,
          level: 1,
          badges: [],
          dailyGoalCompleteDays: 0,
        });
      } catch (e) {}
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/clear-data]', err);
    res.status(500).json({ error: '清除数据失败' });
  }
});

// ==================== 获取趋势数据（图表用，使用 SQLite） ====================
router.get('/stats/trends', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trends = db.getStudyTrends(days);
    res.json({ success: true, trends });
  } catch (err) {
    console.error('[admin/trends]', err);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

// ==================== 获取内容列表（非 knowledge 路由） ====================
router.get('/content', (req, res) => {
  try {
    const contentDir = path.join(__dirname, '..', '..', 'knowledge');

    const content = [];
    if (fs.existsSync(contentDir)) {
      const sites = fs.readdirSync(contentDir);
      sites.forEach((siteKey) => {
        const sitePath = path.join(contentDir, siteKey);
        if (fs.statSync(sitePath).isDirectory()) {
          const siteConfig = config.siteByKey[siteKey] || { name: siteKey, key: siteKey };
          const chapters = [];

          try {
            const files = fs.readdirSync(sitePath);
            files.filter(f => f.endsWith('.json')).forEach(file => {
              const chapterData = JSON.parse(fs.readFileSync(path.join(sitePath, file), 'utf-8'));
              chapters.push({
                name: chapterData.title || file.replace('.json', ''),
                file: file,
              });
            });
          } catch (e) {}

          content.push({
            key: siteKey,
            name: siteConfig.name,
            chapters: chapters,
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

// ==================== 审计日志 ====================
router.get('/audit-log', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.getAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (err) {
    console.error('[admin/audit-log]', err);
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

// ==================== 系统状态 ====================
router.get('/system-status', (req, res) => {
  try {
    const dbPath = path.join(__dirname, '..', '..', 'data', 'study.db');
    const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
    const backups = db.listBackups();

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
router.post('/backup', (req, res) => {
  try {
    const result = db.backupDatabase();
    const adminUser = req.session?.admin || req.session?.user;
    db.addAuditLog(adminUser ? adminUser.username : 'unknown', 'backup', '创建数据库备份: ' + result.name, req.ip || '');
    res.json({ success: true, backup: result });
  } catch (err) {
    console.error('[admin/backup]', err);
    res.status(500).json({ error: '备份失败' });
  }
});

module.exports = router;
