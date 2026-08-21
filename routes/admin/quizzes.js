/**
 * 题库管理路由（quizzes.json CRUD）
 * 依赖：express, fs, path, config, quizModel
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../../config');

const quizDir = path.join(__dirname, '..', '..', 'public', 'data');

function quizFilePath(siteKey) {
  const site = config.siteByKey[siteKey] || { quizzes: 'quizzes' };
  return path.join(quizDir, (site.quizzes || 'quizzes') + '.json');
}

router.get('/:siteKey', (req, res) => {
  try {
    const file = quizFilePath(req.params.siteKey);
    if (!fs.existsSync(file)) return res.json({ success: true, chapters: [] });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    res.json({ success: true, chapters: data });
  } catch (e) {
    console.error('[admin/quizzes]', e);
    res.status(500).json({ error: '获取题库失败' });
  }
});

router.post('/:siteKey', (req, res) => {
  try {
    const file = quizFilePath(req.params.siteKey);
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
    try { require('../../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/quizzes/add]', e);
    res.status(500).json({ error: '添加题目失败' });
  }
});

router.put('/:siteKey/:chapterId/:questionIndex', (req, res) => {
  try {
    const file = quizFilePath(req.params.siteKey);
    const { question } = req.body || {};
    if (!fs.existsSync(file)) return res.status(404).json({ error: '题库不存在' });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const chapter = data.find(c => c.chapterId === req.params.chapterId);
    if (!chapter || !chapter.questions[req.params.questionIndex]) return res.status(404).json({ error: '题目不存在' });
    chapter.questions[req.params.questionIndex] = question;
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/quizzes/update]', e);
    res.status(500).json({ error: '更新题目失败' });
  }
});

router.delete('/:siteKey/:chapterId/:questionIndex', (req, res) => {
  try {
    const file = quizFilePath(req.params.siteKey);
    if (!fs.existsSync(file)) return res.status(404).json({ error: '题库不存在' });
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const chapter = data.find(c => c.chapterId === req.params.chapterId);
    if (!chapter) return res.status(404).json({ error: '章节不存在' });
    chapter.questions.splice(req.params.questionIndex, 1);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/quizzes/delete]', e);
    res.status(500).json({ error: '删除题目失败' });
  }
});

router.post('/:siteKey/chapter', (req, res) => {
  try {
    const file = quizFilePath(req.params.siteKey);
    const { chapterId, title } = req.body || {};
    if (!chapterId) return res.status(400).json({ error: '章节ID不能为空' });
    let data = [];
    if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (data.find(c => c.chapterId === chapterId)) return res.status(409).json({ error: '章节已存在' });
    data.push({ chapterId, title: title || chapterId, questions: [] });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/quizzes/chapter]', e);
    res.status(500).json({ error: '创建章节失败' });
  }
});

router.delete('/:siteKey/:chapterId', (req, res) => {
  try {
    const file = quizFilePath(req.params.siteKey);
    if (!fs.existsSync(file)) return res.status(404).json({ error: '题库不存在' });
    let data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const idx = data.findIndex(c => c.chapterId === req.params.chapterId);
    if (idx === -1) return res.status(404).json({ error: '章节不存在' });
    data.splice(idx, 1);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    try { require('../../models/quizModel').clearCache(); } catch (e) {}
    res.json({ success: true });
  } catch (e) {
    console.error('[admin/quizzes/chapter-delete]', e);
    res.status(500).json({ error: '删除章节失败' });
  }
});

module.exports = router;
