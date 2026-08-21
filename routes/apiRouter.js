const express = require('express');
const router = express.Router();
const contentModel = require('../models/contentModel');
const extensionModel = require('../models/extensionModel');
const userModel = require('../models/userDataModel');
const quizModel = require('../models/quizModel');
const requireAuth = require('../middleware/auth');
const config = require('../config');

// 整个 API 需要登录后才能访问（/api/auth/* 独立挂载，不受影响）
router.use(requireAuth);

// 辅助：将站点配置中以“前端需要的字段”返回
function publicSite(site) {
  return {
    key: site.key,
    name: site.name,
    subtitle: site.subtitle,
    contentRoot: site.contentRoot,
    quizzes: site.quizzes,
    chaptersKey: site.chaptersKey,
    theme: site.theme,
    logoText: site.logoText,
    logo: site.logo,
    targetDate: site.targetDate,
  };
}

// ---------- 站点配置 ----------
// 返回当前站点的展示配置（标题、主题色、倒计时目标等）
router.get('/site/config', (req, res) => {
  res.json(publicSite(req.site));
});

// ---------- 内容 ----------
// 获取完整目录树（按当前站点）
router.get('/chapters', async (req, res) => {
  try {
    const chapters = await contentModel.buildStructure(req.site);
    res.json(chapters);
  } catch (err) {
    console.error('[api/chapters]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

// 获取小节内容（按章节文件夹 + 小节名称，前端使用此接口）
router.get('/content/:folder/:section', async (req, res) => {
  try {
    const { folder, section } = req.params;
    const sectionId = folder + '/' + section + '.md';
    const content = await contentModel.getSectionContent(sectionId, req.site);
    res.json(content);
  } catch (err) {
    res.status(404).json({ error: '小节未找到' });
  }
});

// 搜索（按当前站点）
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const results = await contentModel.searchContent(q, req.site);
    res.json(results);
  } catch (err) {
    console.error('[api/search]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

// ---------- 进度 ----------
router.post('/progress', async (req, res) => {
  const { sectionId, completed } = req.body;
  if (!sectionId || typeof completed !== 'boolean') {
    return res.status(400).json({ error: '参数错误' });
  }
  try {
    await userModel.toggleProgress(req.username, req.site, sectionId, completed);
    res.json({ success: true });
  } catch (err) {
    console.error('[api/progress]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const completed = await userModel.getCompletedSet(req.username, req.site);
    res.json({ completed });
  } catch (err) {
    console.error('[api/progress-get]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

// ---------- 用户数据（持久化进度、笔记等，按 用户×站点） ----------
router.get('/user-data', async (req, res) => {
  try {
    const data = await userModel.readData(req.username, req.site);
    res.json(data);
  } catch (err) {
    console.error('[api/user-data]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

router.post('/user-data', async (req, res) => {
  try {
    await userModel.writeData(req.username, req.site, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('[api/user-data-post]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

// ---------- 笔记（改用查询参数避免路径问题） ----------
router.get('/note', async (req, res) => {
    const { sectionId } = req.query;
    if (!sectionId) return res.status(400).json({ error: '缺少 sectionId' });
    try {
        const note = await userModel.getNote(req.username, req.site, sectionId);
        res.json(note);
    } catch (err) {
        console.error('[api/note-get]', err);
        res.status(500).json({ error: '服务器内部错误，请稍后重试' });
    }
});

router.post('/note', async (req, res) => {
    const { sectionId, content } = req.body;
    if (!sectionId) return res.status(400).json({ error: '缺少 sectionId' });
    try {
        await userModel.saveNote(req.username, req.site, sectionId, content);
        res.json({ success: true });
    } catch (err) {
        console.error('[api/note-post]', err);
        res.status(500).json({ error: '服务器内部错误，请稍后重试' });
    }
});

// ---------- 闯关题库（按当前站点） ----------
// 获取全部题库数据
router.get('/quizzes', async (req, res) => {
    try {
        const quizzes = await quizModel.getQuizzes(req.site);
        res.json(quizzes);
    } catch (err) {
        console.error('[api/quizzes]', err);
        res.status(500).json({ error: '服务器内部错误，请稍后重试' });
    }
});

// 获取所有题目（扁平列表，用于随机抽题）
router.get('/quizzes/all', async (req, res) => {
    try {
        const questions = await quizModel.getAllQuestions(req.site);
        res.json(questions);
    } catch (err) {
        console.error('[api/quizzes-all]', err);
        res.status(500).json({ error: '服务器内部错误，请稍后重试' });
    }
});

// ---------- 拓展知识（英语 Word 文档） ----------
// 获取拓展知识文档列表
router.get('/extension', async (req, res) => {
  try {
    const items = await extensionModel.list();
    res.json(items);
  } catch (err) {
    console.error('[api/extension]', err);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

// 获取单个拓展知识的 HTML 正文
router.get('/extension/*', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params[0]);
    const html = await extensionModel.getHtml(id);
    res.json({ id, html });
  } catch (err) {
    res.status(404).json({ error: '拓展知识未找到' });
  }
});

module.exports = router;
