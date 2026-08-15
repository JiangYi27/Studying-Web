const fs = require('fs').promises;
const path = require('path');

const quizzesDir = path.join(__dirname, '../public/data');
let cachedQuizzes = null;
let cachedFile = null;

// 站点化：根据站点 key 解析题库 json 文件
// 默认 quizzes.json；站点化了用 quizzes-<key>.json（如 quizzes-grammar.json）
// site.quizzes 已含站点标识（如 'grammar'），直接作为文件名前缀
function quizzesFileFor(site) {
  const prefix = (site && site.quizzes) ? site.quizzes : 'quizzes';
  const file = prefix + '.json';
  return path.join(quizzesDir, file);
}

// 读取 quizzes json 并转换数据格式
// quizzes.json 使用 correct 字段，前端使用 answer 字段
async function getQuizzes(site) {
  const file = quizzesFileFor(site);
  if (cachedFile === file && cachedQuizzes) return cachedQuizzes;
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const chapters = JSON.parse(raw);
    const result = {};
    for (const ch of chapters) {
      // 跳过没有题目的条目，防止空数组覆盖已有数据
      if (!ch.questions || ch.questions.length === 0) continue;
      const questions = ch.questions.map((q) => ({
          question: q.question,
          options: q.options,
          answer: q.correct,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 1,
      }));
      result[ch.chapterId] = questions;
    }
    cachedQuizzes = result;
    cachedFile = file;
    return result;
  } catch (err) {
    console.error('读取题库失败:', file, err.message);
    return {};
  }
}

// 清除缓存（用于热加载）
function clearCache() {
    cachedQuizzes = null;
    cachedFile = null;
}

// 获取所有题目的扁平列表（用于随机抽题）
async function getAllQuestions(site) {
    const file = quizzesFileFor(site);
    const raw = await fs.readFile(file, 'utf-8');
    const chapters = JSON.parse(raw);
    const all = [];
    for (const ch of chapters) {
        const chapterId = ch.chapterId;
        const chapterTitle = ch.title || '';
        for (const q of (ch.questions || [])) {
            all.push({
                chapterId,
                chapterTitle,
                question: q.question,
                options: q.options,
                answer: q.correct,
                explanation: q.explanation || '',
                difficulty: q.difficulty || 1,
            });
        }
    }
    return all;
}

module.exports = { getQuizzes, clearCache, getAllQuestions };
