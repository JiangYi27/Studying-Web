/**
 * 站点配置管理路由（sites.js CRUD）
 * 依赖：express, fs, path, config
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../../config');

const sitesFile = path.join(__dirname, '..', '..', 'config', 'sites.js');

// 获取站点列表
router.get('/', (req, res) => {
  try {
    const sites = (config.sites || []).map(s => ({
      key: s.key,
      name: s.name,
      subtitle: s.subtitle,
      theme: s.theme ? s.theme.accent : '#6366f1',
      targetDate: s.targetDate || null,
      features: s.features || [],
    }));
    res.json({ success: true, sites });
  } catch (err) {
    res.status(500).json({ error: '获取站点列表失败' });
  }
});

// 获取单个站点
router.get('/:key', (req, res) => {
  const site = config.siteByKey[req.params.key];
  if (!site) return res.status(404).json({ error: '站点不存在' });
  res.json({
    success: true,
    site: {
      key: site.key,
      name: site.name,
      subtitle: site.subtitle,
      theme: site.theme ? site.theme.accent : '#6366f1',
      features: site.features || [],
    },
  });
});

// 创建站点
router.post('/', (req, res) => {
  try {
    const { name, key, subtitle, theme, features } = req.body || {};
    if (!name || !key) return res.status(400).json({ error: '站点名称和Key不能为空' });

    const sitesConfig = require('../../config/sites');
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
      features: features || [],
    };
    existing.push(newSite);

    const newContent = `/**
 * 站点注册表
 */
module.exports = {
  sites: ${JSON.stringify(existing, null, 2)},
};`;
    fs.writeFileSync(sitesFile, newContent, 'utf-8');

    // 清除 require 缓存
    delete require.cache[require.resolve('../../config/sites')];
    delete require.cache[require.resolve('../../config')];
    delete require.cache[require.resolve('../../config/index')];

    res.json({ success: true, site: newSite });
  } catch (err) {
    console.error('[admin/sites-create]', err);
    res.status(500).json({ error: '创建站点失败' });
  }
});

// 更新站点
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { name, subtitle, theme, features } = req.body || {};

    const sitesConfig = require('../../config/sites');
    const existing = sitesConfig.sites || [];

    const idx = existing.findIndex(s => s.key === key);
    if (idx === -1) return res.status(404).json({ error: '站点不存在' });

    if (name) existing[idx].name = name;
    if (subtitle !== undefined) existing[idx].subtitle = subtitle;
    if (theme) existing[idx].theme = { accent: theme };
    if (Array.isArray(features)) existing[idx].features = features;

    const newContent = `/**
 * 站点注册表
 */
module.exports = {
  sites: ${JSON.stringify(existing, null, 2)},
};`;
    fs.writeFileSync(sitesFile, newContent, 'utf-8');

    delete require.cache[require.resolve('../../config/sites')];
    delete require.cache[require.resolve('../../config')];
    delete require.cache[require.resolve('../../config/index')];

    res.json({ success: true, site: existing[idx] });
  } catch (err) {
    console.error('[admin/sites-update]', err);
    res.status(500).json({ error: '更新站点失败' });
  }
});

// 删除站点
router.delete('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const sitesConfig = require('../../config/sites');
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

    delete require.cache[require.resolve('../../config/sites')];
    delete require.cache[require.resolve('../../config')];
    delete require.cache[require.resolve('../../config/index')];

    res.json({ success: true });
  } catch (err) {
    console.error('[admin/sites-delete]', err);
    res.status(500).json({ error: '删除站点失败' });
  }
});

module.exports = router;
