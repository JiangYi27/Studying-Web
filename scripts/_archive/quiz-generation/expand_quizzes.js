#!/usr/bin/env node
/* ============================================================
 * 题库扩展脚本：合并新题 + 为现有题标注难度 + 校验
 * 用法: node scripts/expand_quizzes.js
 * 运行前先确认 newq_1.js ~ newq_4.js 存在
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const QUIZ_PATH = path.join(__dirname, '..', 'public', 'data', 'quizzes.json');

// 读取新题数据
const newQuestions = {};
for (const f of ['newq_1.js', 'newq_2.js', 'newq_3.js', 'newq_4.js']) {
    const mod = require(path.join(__dirname, f));
    for (const ch of Object.keys(mod)) {
        if (!newQuestions[ch]) newQuestions[ch] = [];
        newQuestions[ch] = newQuestions[ch].concat(mod[ch]);
    }
}

// ==================== 为现有题目智能标注难度 ====================
// 规则：含代码/指针/位运算/未定义行为等关键词判为较高难度；纯概念题判为基础
function inferDifficulty(q) {
    const text = (q.question + (q.explanation || '') + q.options.join(' '));
    const hard = ['未定义', '段错误', '退化为', '悬空', '越界', '提升', '优先级', '结合', '溢出', '位域', '对齐', '填充', '联合', 'va_arg', 'va_start', 'longjmp', 'setjmp', '宏', 'strtok', '悬挂', '野指针', 'double free', 'realloc', 'memcpy', 'strncpy', '内联', '__LINE__', 'volatile', 'extern', 'static', 'struct', 'union', 'enum', '指针', '取模', '短', '求值顺序', '副作用', '多级指针', '函数指针', 'const'];
    let score = 0;
    for (const k of hard) {
        if (text.includes(k)) score++;
    }
    // 含具体代码片段倾向更难
    if (/\b(if|for|while|int|char|printf|sizeof|return)\b/.test(q.question)) score += 1;
    if (score >= 3) return 3;
    if (score >= 1) return 2;
    return 1;
}

// ==================== 合并 ====================
const chapters = JSON.parse(fs.readFileSync(QUIZ_PATH, 'utf-8'));
const seenQuestions = new Set(); // 去重：按题干

for (const ch of chapters) {
    // 1) 为现有题标注难度（若尚未有 difficulty）
    for (const q of ch.questions) {
        if (!q.difficulty) q.difficulty = inferDifficulty(q);
        seenQuestions.add(q.question);
    }
    // 2) 追加新题
    const newList = newQuestions[ch.chapterId] || [];
    let added = 0;
    for (const nq of newList) {
        if (seenQuestions.has(nq.question)) continue; // 去重
        seenQuestions.add(nq.question);
        ch.questions.push(nq);
        added++;
    }
    console.log(`章 ${ch.chapterId} ${ch.title}: 原有 ${20} + 新增 ${added} = ${ch.questions.length}`);
}

// ==================== 校验 ====================
function validate() {
    const errors = [];
    let total = 0;
    const seen = new Set();
    for (const ch of chapters) {
        const qs = ch.questions;
        for (const q of qs) {
            total++;
            if (typeof q.question !== 'string' || q.question.trim() === '') errors.push('题干为空');
            if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`选项数错误: ${q.question.slice(0,20)}`);
            if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) errors.push(`correct越界: ${q.question.slice(0,20)}`);
            if (typeof q.explanation !== 'string' || q.explanation.trim() === '') errors.push(`缺少解析: ${q.question.slice(0,20)}`);
            if (![1, 2, 3].includes(q.difficulty)) errors.push(`difficulty非法: ${q.question.slice(0,20)}`);
            if (seen.has(q.question)) errors.push(`重复题干: ${q.question.slice(0,30)}`);
            seen.add(q.question);
        }
    }
    return { errors, total };
}

const { errors, total } = validate();
if (errors.length > 0) {
    console.error('\n❌ 校验失败:');
    errors.slice(0, 30).forEach(e => console.error('  - ' + e));
    console.error(`共 ${errors.length} 个问题，不写入文件。`);
    process.exit(1);
}

// ==================== 写回 ====================
fs.writeFileSync(QUIZ_PATH, JSON.stringify(chapters, null, 2) + '\n', 'utf-8');
console.log(`\n✅ 写入成功！总题数: ${total}`);
console.log('难度分布: 1=' + chapters.flatMap(c => c.questions).filter(q => q.difficulty === 1).length +
            ', 2=' + chapters.flatMap(c => c.questions).filter(q => q.difficulty === 2).length +
            ', 3=' + chapters.flatMap(c => c.questions).filter(q => q.difficulty === 3).length);
