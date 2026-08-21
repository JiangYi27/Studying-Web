/**
 * 知识内容管理路由（markdown 文件 CRUD）
 * 依赖：express, fs, path, contentModel
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../../config');

const contentBase = path.join(__dirname, '..', '..', 'knowledge');

// 获取某站点的全部章节和文件（含文件内容）
router.get('/:siteKey', (req, res) => {
  try {
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
  } catch (e) {
    console.error('[admin/knowledge]', e);
    res.status(500).json({ error: '获取知识内容失败' });
  }
});

// 获取单个 markdown 文件内容
router.get('/:siteKey/:chapterName/:fileName', (req, res) => {
  try {
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, content, fileName: req.params.fileName });
  } catch (e) {
    console.error('[admin/knowledge/read]', e);
    res.status(500).json({ error: '读取文件失败' });
  }
});

// 更新 markdown 文件内容
router.put('/:siteKey/:chapterName/:fileName', (req, res) => {
  try {
    const { content } = req.body || {};
    if (typeof content !== 'string') return res.status(400).json({ error: '内容不能为空' });
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    fs.writeFileSync(filePath, content, 'utf-8');
    try { require('../../models/contentModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/knowledge/write]', e);
    res.status(500).json({ error: '保存文件失败' });
  }
});

// 创建新 markdown 文件
router.post('/:siteKey/:chapterName', (req, res) => {
  try {
    const { fileName, content } = req.body || {};
    if (!fileName || typeof fileName !== 'string') return res.status(400).json({ error: '文件名不能为空' });
    const safeName = fileName.replace(/\.md$/i, '') + '.md';
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, safeName);
    if (fs.existsSync(filePath)) return res.status(409).json({ error: '文件已存在' });
    fs.writeFileSync(filePath, content || '# ' + safeName.replace('.md', '') + '\n\n', 'utf-8');
    try { require('../../models/contentModel').clearCache(); } catch (e) {}
    res.json({ success: true, fileName: safeName });
  } catch (e) {
    console.error('[admin/knowledge/create]', e);
    res.status(500).json({ error: '创建文件失败' });
  }
});

// 删除 markdown 文件
router.delete('/:siteKey/:chapterName/:fileName', (req, res) => {
  try {
    const filePath = path.join(contentBase, req.params.siteKey, req.params.chapterName, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    fs.unlinkSync(filePath);
    try { require('../../models/contentModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/knowledge/delete]', e);
    res.status(500).json({ error: '删除文件失败' });
  }
});

// 创建新章节文件夹
router.post('/:siteKey', (req, res) => {
  try {
    const { chapterName } = req.body || {};
    if (!chapterName || typeof chapterName !== 'string') return res.status(400).json({ error: '章节名不能为空' });
    const safeName = chapterName.replace(/[\/\\:*?"<>|]/g, '-');
    const dirPath = path.join(contentBase, req.params.siteKey, safeName);
    if (fs.existsSync(dirPath)) return res.status(409).json({ error: '章节已存在' });
    fs.mkdirSync(dirPath, { recursive: true });
    res.json({ success: true, chapterName: safeName });
  } catch (e) {
    console.error('[admin/knowledge/chapter]', e);
    res.status(500).json({ error: '创建章节失败' });
  }
});

module.exports = router;
