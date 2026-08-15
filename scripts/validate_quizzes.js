'use strict';
// 题库完整性校验脚本
const d = require('../public/data/quizzes.json');
let total = 0, seen = new Set(), bad = [];
const diffCount = { 1: 0, 2: 0, 3: 0 };
for (const ch of d) {
    for (const q of ch.questions) {
        total++;
        if (typeof q.question !== 'string' || !q.question.trim()) bad.push('题干为空');
        if (!Array.isArray(q.options) || q.options.length !== 4) bad.push('选项数错误: ' + q.question.slice(0, 20));
        if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) bad.push('correct越界: ' + q.question.slice(0, 20));
        if (typeof q.explanation !== 'string' || !q.explanation.trim()) bad.push('缺解析: ' + q.question.slice(0, 20));
        if (![1, 2, 3].includes(q.difficulty)) bad.push('难度非法: ' + q.question.slice(0, 20));
        else diffCount[q.difficulty]++;
        if (seen.has(q.question)) bad.push('重复题干: ' + q.question.slice(0, 30));
        seen.add(q.question);
    }
}
console.log('总题数:', total);
console.log('每章:', d.map(c => c.chapterId + '=' + c.questions.length).join(', '));
console.log('难度分布 基础/中等/困难:', diffCount[1], '/', diffCount[2], '/', diffCount[3]);
console.log('问题数:', bad.length);
if (bad.length) bad.slice(0, 20).forEach(b => console.log('  - ' + b));
process.exit(bad.length ? 1 : 0);
