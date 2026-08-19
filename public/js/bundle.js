/*! C语言知识库 - 合并脚本 | 生成时间: 2026-08-19T11:52:00.979Z */
(function(){
"use strict";

// --- js/utils/helpers.js ---
/* ==================== 工具函数 ==================== */
/* 纯函数，无副作用，可被任何模块安全引用 */
/**
 * 基础 HTML 净化：移除 script 标签和事件处理器属性
 * 防止通过 Markdown 内容注入 XSS
 */
function sanitizeHtml(html) {
    if (!html) return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

/**
 * HTML 转义：把文本安全地嵌入 innerHTML
 * 防止题目/选项中的 < > & 被当作 HTML 标签解析
 * 例：#include <stdio.h> → #include &lt;stdio.h&gt;
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 格式化学习时间（分钟 → 可读字符串）
 */
function formatStudyTime(minutes) {
    if (minutes < 60) return minutes + '分钟';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours + '小时' + (mins > 0 ? mins + '分钟' : '');
}

/**
 * 计算指定等级所需经验值（分段曲线）
 * 前期升级快、后期升级慢，更符合"成长"节奏
 * 每级所需经验 = 基础值 × 该阶段的成长系数
 */
function getExpForLevel(lv) {
    lv = Math.max(1, lv);
    if (lv <= 5)   return 100;                    // 1-5 级：新手期，每级 100
    if (lv <= 10)  return 150;                    // 6-10 级：进阶期，每级 150
    if (lv <= 20)  return 220;                    // 11-20 级：成长爬坡，每级 220
    if (lv <= 30)  return 320;                    // 21-30 级：稳步积累，每级 320
    return 450 + Math.floor((lv - 30) * 15);      // 31 级以后：缓慢爬升，每级再 +15
}

/**
 * 按需加载外部脚本（CDN 库懒加载）。
 * 返回 Promise；同一 src 并发调用只会注入一次。
 * 用于 Chart.js / Prism 等非首屏库，避免拖慢首屏加载。
 */
function loadScript(src) {
    const existing = document.querySelector('script[src="' + src.replace(/"/g, '\\"') + '"]');
    if (existing) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error('脚本加载失败: ' + src)); };
        document.head.appendChild(s);
    });
}

// --- js/data/chapters.js ---
/* ==================== 数据定义 ==================== */
/* 章节结构、徽章定义、励志语录、常量等纯数据 */
/* 多站点：通过 setSite(key) 根据站点配置，切换 CHAPTERS / QUOTES / TARGET_DATE / theme */
// C 语言站点章节
const C_CHAPTERS = [
    { id: '01', title: 'C语言概述', folder: '01_C语言概述', sections: ['01_计算机与编程', '02_C语言历史', '03_开发环境', '04_第一个程序', '05_编程规范'], sectionTitles: ['计算机与编程', 'C语言历史', '开发环境', '第一个程序', '编程规范'], icon: '📖' },
    { id: '02', title: '核心语法基础', folder: '02_核心语法基础', sections: ['01_基本数据类型', '02_变量与常量', '03_运算符与表达式', '04_标准输入输出'], sectionTitles: ['基本数据类型', '变量与常量', '运算符与表达式', '标准输入输出'], icon: '🔤' },
    { id: '03', title: '程序流程控制', folder: '03_程序流程控制', sections: ['01_选择结构', '02_循环结构', '03_跳转语句'], sectionTitles: ['选择结构', '循环结构', '跳转语句'], icon: '🔀' },
    { id: '04', title: '数组与字符串', folder: '04_数组与字符串', sections: ['01_一维数组', '02_多维数组', '03_字符数组与字符串'], sectionTitles: ['一维数组', '多维数组', '字符数组与字符串'], icon: '📊' },
    { id: '05', title: '函数与程序结构', folder: '05_函数与程序结构', sections: ['01_函数定义与声明', '02_参数传递', '03_作用域与存储类别', '04_递归函数'], sectionTitles: ['函数定义与声明', '参数传递', '作用域与存储类别', '递归函数'], icon: '🔧' },
    { id: '06', title: '指针', folder: '06_指针', sections: ['01_指针基础', '02_指针运算', '03_指针与数组', '04_指针与字符串', '05_指针与函数', '06_高级指针'], sectionTitles: ['指针基础', '指针运算', '指针与数组', '指针与字符串', '指针与函数', '高级指针'], icon: '👉' },
    { id: '07', title: '内存管理', folder: '07_内存管理', sections: ['01_内存分区', '02_动态分配函数', '03_常见内存错误'], sectionTitles: ['内存分区', '动态分配函数', '常见内存错误'], icon: '💾' },
    { id: '08', title: '构造数据类型', folder: '08_构造数据类型', sections: ['01_结构体', '02_联合体', '03_枚举', '04_类型重定义'], sectionTitles: ['结构体', '联合体', '枚举', '类型重定义'], icon: '🏗️' },
    { id: '09', title: 'C预处理器', folder: '09_C预处理器', sections: ['01_宏定义', '02_文件包含', '03_条件编译'], sectionTitles: ['宏定义', '文件包含', '条件编译'], icon: '⚙️' },
    { id: '10', title: '标准库与系统调用', folder: '10_标准库与系统调用', sections: ['01_输入输出库', '02_数学库', '03_时间库', '04_其他库'], sectionTitles: ['输入输出库', '数学库', '时间库', '其他库'], icon: '📚' },
    { id: '11', title: '文件操作', folder: '11_文件操作', sections: ['01_文件流指针', '02_文件打开与关闭', '03_顺序读写', '04_随机读写'], sectionTitles: ['文件流指针', '文件打开与关闭', '顺序读写', '随机读写'], icon: '📁' },
    { id: '12', title: '高级与底层专题', folder: '12_高级与底层专题', sections: ['01_位运算进阶', '02_可变参数函数', '03_非局部跳转', '04_内联汇编'], sectionTitles: ['位运算进阶', '可变参数函数', '非局部跳转', '内联汇编'], icon: '⚡' },
    { id: '13', title: '数据结构与算法', folder: '13_数据结构与算法', sections: ['01_线性结构', '02_树形结构', '03_查找与排序'], sectionTitles: ['线性结构', '树形结构', '查找与排序'], icon: '🌳' },
    { id: '14', title: '工程化与调试', folder: '14_工程化与调试', sections: ['01_Makefile', '02_GDB调试', '03_静态与动态库', '04_防御式编程'], sectionTitles: ['Makefile', 'GDB调试', '静态与动态库', '防御式编程'], icon: '🛠️' },
];

// ==================== 站点分组 ====================
// 键与后端 config/sites.js 中的 chaptersKey 对应
const SITES = {
    c: { chapters: C_CHAPTERS, features: ['home', 'tasks', 'course', 'extension', 'dashboard', 'roadmap', 'ai_qa', 'badges', 'settings'] },
    grammar: {
        chapters: [
            { id: '01', title: '重塑语法认知框架', folder: '01-重塑语法认知框架', sections: ['01-简单句与五大句型', '02-句子成分与句子分类', '03-十大词类与动词总览', '04-动词的分类', '05-16种时态终极详解', '06-易混易错对比索引'], sectionTitles: ['简单句与五大句型', '句子成分与句子分类', '十大词类与动词总览', '动词的分类', '16种时态终极详解', '易混易错对比索引'], icon: '🧠' },
            { id: '02', title: '动词语气与虚拟语气', folder: '02-动词语气-虚拟语气', sections: ['01-虚拟语气', '02-非谓语动词', '03-独立主格', '04-助动词', '05-系动词', '06-使役动词', '07-不规则动词高频表', '08-情态动词专项'], sectionTitles: ['虚拟语气', '非谓语动词', '独立主格', '助动词', '系动词', '使役动词', '不规则动词高频表', '情态动词专项'], icon: '📚' },
            { id: '03', title: '从句', folder: '03-从句', sections: ['01-定语从句（形容词从句）', '02-主语从句', '03-宾语从句', '04-表语从句（主语补语从句）', '05-同位语从句', '06-宾语补语从句', '07-状语从句综述与时间状语从句', '08-地点状语从句', '09-比较状语从句', '10-条件状语从句', '11-让步状语从句', '12-方式状语从句', '13-原因目的结果状语从句'], sectionTitles: ['定语从句', '主语从句', '宾语从句', '表语从句', '同位语从句', '宾语补语从句', '状语从句综述', '地点状语从句', '比较状语从句', '条件状语从句', '让步状语从句', '方式状语从句', '原因目的结果状语从句'], icon: '🔗' },
            { id: '04', title: '词类', folder: '04-词类', sections: ['01-冠词', '02-介词', '03-名词', '04-数词', '05-形容词', '06-副词', '07-连词', '08-叹词', '09-限定词', '10-代词'], sectionTitles: ['冠词', '介词', '名词', '数词', '形容词', '副词', '连词', '叹词', '限定词', '代词'], icon: '🔤' },
            { id: '05', title: '句子成分与分类', folder: '05-句子成分与分类', sections: ['01-句子成分总览', '02-被动语态', '03-倒装句', '04-强调', '05-省略', '06-主谓一致'], sectionTitles: ['句子成分总览', '被动语态', '倒装句', '强调', '省略', '主谓一致'], icon: '🏗️' },
        ],
        features: ['home', 'tasks', 'course', 'extension', 'dashboard', 'vocabulary', 'ai_qa', 'badges', 'settings'],
    },
};

// ==================== 当前站点全局变量 ====================
// 以下变量被多个模块直接引用（CHAPTERS/QUOTES/TARGET_DATE），
// 由 setSite() 根据当前站点赋值，模块无需改动。
let CHAPTERS = SITES.c.chapters;
let QUOTES = [];
let TARGET_DATE = new Date('2027-04-17T00:00:00+08:00');
let CURRENT_SITE_KEY = 'c';
let CURRENT_SITE_NAME = 'C语言';
let CURRENT_SITE_ID = 'c';

// ==================== 励志语录（按站点） ====================
const QUOTES_BY_SITE = {
    c: [
        "学习 C 语言，就是学习如何与底层对话。",
        "永远不要害怕重写代码，那是你正在成长的证明。",
        "C 语言不会阻止你做蠢事，但会让你在做的时候明白自己有多蠢。",
        "代码是写给人看的，只是顺便给机器运行。",
        "任何足够先进的技术，都与魔法无异。",
        "简单是可靠的先决条件。",
        "过早优化是万恶之源。",
        "程序必须是为了给人阅读而写，只是顺便给机器运行。",
        "在编程中，最困难的部分是命名事物和使缓存失效。",
        "调试的难度是编写代码的两倍。",
        "学习编程的最好方法是编写程序。",
        "千里之行，始于足下。",
        "学而不思则罔，思而不学则殆。",
        "宝剑锋从磨砺出，梅花香自苦寒来。",
        "不积跬步，无以至千里；不积小流，无以成江海。",
        "今天的努力，是为了明天更好的自己。",
        "每一个不曾起舞的日子，都是对生命的辜负。",
        "种一棵树最好的时间是十年前，其次是现在。",
        "你现在的努力，是为了以后有更多的选择。",
    ],
    grammar: [
        "语言是有限的音符，语法把它们谱成了无限的音乐。",
        "掌握语法，是为了让思想的表达更精准。",
        "每一种时态，都在讲述时间的故事。",
        "点滴积累，终成流利。",
    ],
};

/**
 * 根据站点 key 切换全局数据（章节、语录、主题目标）
 * siteKey 对应后端 config/sites.js 中的 key
 * 模块内直接引用 CHAPTERS/QUOTES/TARGET_DATE 的位置无需改动。
 */
function setSite(siteKey) {
    const key = siteKey || 'c';
    CURRENT_SITE_KEY = key;
    CURRENT_SITE_NAME = key === 'grammar' ? '英语语法' : 'C语言';
    CURRENT_SITE_ID = key;
    CHAPTERS = (SITES[key] && SITES[key].chapters) || SITES.c.chapters;
    BADGE_DEFS = buildBadgeDefs(key);
    QUOTES = QUOTES_BY_SITE[key] || QUOTES_BY_SITE.c;
    const target = TARGET_DATE_BY_SITE[key] || TARGET_DATE_BY_SITE.c;
    TARGET_DATE = new Date(target + 'T00:00:00+08:00');
    updateSidebarVisibility(key);
}

// 侧边栏功能隔离：根据当前站点的 features 列表显示/隐藏菜单项
function updateSidebarVisibility(siteKey) {
    // 优先从 API 加载的站点配置读取 features（admin 后台修改后实时生效）
    let features = [];
    if (window.__currentUser && window.__currentUser.sites) {
        const site = window.__currentUser.sites.find(s => s.key === siteKey);
        features = site && site.features ? site.features : [];
    }
    if (!features.length && SITES[siteKey]) {
        features = SITES[siteKey].features || [];
    }
    document.querySelectorAll('.nav-item[data-feature]').forEach(item => {
        const feat = item.dataset.feature;
        item.style.display = features.includes(feat) ? '' : 'none';
    });
}

// 倒计时目标（按站点）
const TARGET_DATE_BY_SITE = {
    c: '2027-04-17',
    grammar: '2027-04-17',
};

// ==================== 闯关题库（由后端 API 动态加载） ====================
let QUIZZES = {};
let quizzesLoaded = false;

/**
 * 加载题库数据
 * 优先从后端 API 加载（已做字段转换），失败时降级为客户端直接加载 JSON 并自行转换
 * @returns {Promise<Object>} 格式: { "01": [{ question, options, answer, explanation }], ... }
 */
async function loadQuizzes() {
    // 尝试从后端 API 加载（quizModel 已将 correct → answer）
    try {
        const res = await fetch('/api/quizzes');
        if (res.ok) {
            QUIZZES = await res.json();
            quizzesLoaded = true;
            console.log('✅ 题库已从 API 加载 (' + Object.keys(QUIZZES).length + ' 章)');
            return QUIZZES;
        }
    } catch (err) {
        console.warn('⚠ API 题库加载失败，降级为客户端加载:', err.message);
    }

    // 降级：客户端直接读取 JSON 并自行转换字段
    try {
        const res = await fetch('/data/quizzes.json');
        if (!res.ok) throw new Error('JSON 文件加载失败');
        const chapters = await res.json();
        QUIZZES = {};
        for (const ch of chapters) {
            QUIZZES[ch.chapterId] = (ch.questions || []).map(function (q) {
                return {
                    question: q.question,
                    options: q.options,
                    answer: q.correct,       // JSON 中是 correct，前端期望 answer
                    explanation: q.explanation || '',
                    difficulty: q.difficulty || 1,
                };
            });
        }
        quizzesLoaded = true;
        console.log('✅ 题库已从 JSON 客户端加载 (' + Object.keys(QUIZZES).length + ' 章)');
        return QUIZZES;
    } catch (err) {
        console.error('❌ 题库完全加载失败:', err.message);
        quizzesLoaded = false;
        return {};
    }
}

// ==================== 稀有度颜色映射 ====================
const RARITY_COLORS = {
    common: '#94a3b8',
    uncommon: '#10b981',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#fbbf24',
};
const RARITY_LABELS = {
    common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说',
};

// ==================== 徽章分类标签 ====================
const BADGE_CATEGORY_LABELS = {
    progress: '进度', chapter: '章节', streak: '打卡', level: '等级',
    quiz: '测验', collection: '收藏', activity: '活跃', explore: '探索',
};

// ==================== 徽章定义（按站点拆分） ====================
// 徽章分为三类：
//   1. PROGRESS_BADGES —— 进度里程碑：达标“小节数”按站点不同（C 站 54 小节 / 语法站 25 小节），
//      名称/描述/阈值均按站点配置，达标条件读取 def.target（setSite 时写入）。
//   2. COMMON_BADGES —— 通用徽章：打卡/等级/测验/收藏/活跃/探索 + 百分比进度，两站共用，文案中性。
//   3. 章节徽章 —— 按站点各自定义（C 站 14 个，语法站 5 个），ID 全局唯一。
// setSite() 时通过 buildBadgeDefs() 重建全局 BADGE_DEFS，模块内直接引用 BADGE_DEFS 的位置无需改动。

// ========= 进度里程碑（按站点） =========
const PROGRESS_BADGES = {
    c: [
        { id: 'first_step', name: '初识C语言', desc: '完成第一个小节', icon: '👶', rarity: 'common', target: 1 },
        { id: 'five_done', name: '初窥门径', desc: '完成5个小节', icon: '🌱', rarity: 'common', target: 5 },
        { id: 'ten_done', name: '学海无涯', desc: '完成10个小节', icon: '📖', rarity: 'uncommon', target: 10 },
        { id: 'twenty_done', name: '枫林阅尽', desc: '完成20个小节', icon: '🌲', rarity: 'uncommon', target: 20 },
        { id: 'thirty_done', name: '小有所成', desc: '完成30个小节', icon: '🎓', rarity: 'rare', target: 30 },
        { id: 'forty_done', name: '渡阁楚霜', desc: '完成40个小节', icon: '🏛️', rarity: 'rare', target: 40 },
        { id: 'fifty_done', name: 'C语言达人', desc: '完成50个小节', icon: '🏆', rarity: 'epic', target: 50 },
    ],
    grammar: [
        { id: 'first_step', name: '初识语法', desc: '完成第一个小节', icon: '👶', rarity: 'common', target: 1 },
        { id: 'five_done', name: '初窥门径', desc: '完成5个小节', icon: '🌱', rarity: 'common', target: 5 },
        { id: 'ten_done', name: '学海无涯', desc: '完成10个小节', icon: '📖', rarity: 'uncommon', target: 10 },
        { id: 'twenty_done', name: '枫林阅尽', desc: '完成15个小节', icon: '🌲', rarity: 'uncommon', target: 15 },
        { id: 'thirty_done', name: '小有所成', desc: '完成20个小节', icon: '🎓', rarity: 'rare', target: 20 },
        { id: 'forty_done', name: '渡阁楚霜', desc: '完成25个小节', icon: '🏛️', rarity: 'rare', target: 25 },
        { id: 'fifty_done', name: '语法达人', desc: '完成全部小节', icon: '🏆', rarity: 'epic', target: 25 },
    ],
};

// ========= 通用徽章（两站共用） =========
const COMMON_BADGES = [
    // 百分比进度（按当前站点 CHAPTERS 计算，自动适配）
    { id: 'all_rounder', name: '螭龟般的耐心', desc: '完成80%的学习内容', icon: '🐢', category: 'progress', rarity: 'epic', condition: () => { const total = CHAPTERS.reduce((s, ch) => s + ch.sections.length, 0); return Object.keys(state.completedSections).length >= Math.ceil(total * 0.8); } },
    { id: 'all_done', name: '大圆满', desc: '完成所有章节', icon: '🌟', category: 'progress', rarity: 'legendary', condition: () => checkAllComplete() },
    { id: 'first_half', name: '行至半程', desc: '完成50%的学习内容', icon: '🚩', category: 'progress', rarity: 'rare', condition: () => { const total = CHAPTERS.reduce((s, ch) => s + ch.sections.length, 0); return Object.keys(state.completedSections).length >= Math.ceil(total * 0.5); } },

    // ========= 连续打卡 =========
    { id: 'streak_3', name: '坚持不懈', desc: '连续打卡3天', icon: '🔥', category: 'streak', rarity: 'common', condition: () => state.streak >= 3 },
    { id: 'streak_7', name: '一周达人', desc: '连续打卡7天', icon: '📅', category: 'streak', rarity: 'uncommon', condition: () => state.streak >= 7 },
    { id: 'streak_14', name: '半月之誓', desc: '连续打卡14天', icon: '🌓', category: 'streak', rarity: 'rare', condition: () => state.streak >= 14 },
    { id: 'streak_30', name: '月度之星', desc: '连续打卡30天', icon: '⭐', category: 'streak', rarity: 'epic', condition: () => state.streak >= 30 },
    { id: 'streak_50', name: '半载坚持', desc: '连续打卡50天', icon: '🌠', category: 'streak', rarity: 'epic', condition: () => state.streak >= 50 },
    { id: 'streak_100', name: '百日之约', desc: '连续打卡100天', icon: '💎', category: 'streak', rarity: 'legendary', condition: () => state.streak >= 100 },

    // ========= 等级成就 =========
    { id: 'level_5', name: '初露锋芒', desc: '达到LV5', icon: '⚔️', category: 'level', rarity: 'common', condition: () => state.level >= 5 },
    { id: 'level_10', name: '登峰造极', desc: '达到LV10', icon: '👑', category: 'level', rarity: 'rare', condition: () => state.level >= 10 },
    { id: 'level_15', name: '进阶行者', desc: '达到LV15', icon: '🚀', category: 'level', rarity: 'epic', condition: () => state.level >= 15 },
    { id: 'level_20', name: '学识渊博', desc: '达到LV20', icon: '📜', category: 'level', rarity: 'epic', condition: () => state.level >= 20 },
    { id: 'level_30', name: '代码宗师', desc: '达到LV30', icon: '🧙', category: 'level', rarity: 'legendary', condition: () => state.level >= 30 },

    // ========= 测验战绩 =========
    { id: 'quiz_beginner', name: '挑战者', desc: '完成第一场测验', icon: '🧪', category: 'quiz', rarity: 'common', condition: () => state.quizStats && state.quizStats.attempts >= 1 },
    { id: 'quiz_veteran', name: '试炼者', desc: '完成20场测验', icon: '⚔️', category: 'quiz', rarity: 'rare', condition: () => state.quizStats && state.quizStats.attempts >= 20 },
    { id: 'quiz_specialist', name: '完美之术', desc: '获得S等级排名', icon: '💎', category: 'quiz', rarity: 'epic', condition: () => state.quizStats && state.quizStats.bestRank === 'S' },
    { id: 'combo_king', name: '连击王', desc: '答题连击10题', icon: '🔥', category: 'quiz', rarity: 'epic', condition: () => state.quizStats && state.quizStats.bestStreak >= 10 },
    { id: 'quiz_scholar', name: '满分学霸', desc: '在一次测验中获得S级评价', icon: '🎓', category: 'quiz', rarity: 'uncommon', condition: () => state.quizStats && state.quizStats.sCount >= 1 },
    { id: 'quiz_whiz', name: '答题快手', desc: '单场测验连击30题', icon: '⚡', category: 'quiz', rarity: 'legendary', condition: () => state.quizStats && state.quizStats.bestStreak >= 30 },
    { id: 'quiz_ab', name: '稳如磐石', desc: '10次测验获得A级及以上评价', icon: '🛡️', category: 'quiz', rarity: 'epic', condition: () => state.quizStats && state.quizStats.aCount >= 10 },

    // ========= 收藏笔记 =========
    { id: 'bookmark_collector', name: '收藏家', desc: '添加5个书签', icon: '🔖', category: 'collection', rarity: 'uncommon', condition: () => state.bookmarks.length >= 5 },
    { id: 'bookmark_master', name: '典籍馆藏', desc: '添加20个书签', icon: '📚', category: 'collection', rarity: 'rare', condition: () => state.bookmarks.length >= 20 },
    { id: 'note_taker', name: '笔记达人', desc: '为10个小节添加笔记', icon: '📝', category: 'collection', rarity: 'uncommon', condition: () => Object.values(state.notes).filter(n => n && n.trim()).length >= 10 },
    { id: 'note_master', name: '笔记家', desc: '为30个小节添加笔记', icon: '📔', category: 'collection', rarity: 'epic', condition: () => Object.values(state.notes).filter(n => n && n.trim()).length >= 30 },

    // ========= 活动时段 =========
    { id: 'marathon', name: '马拉松选手', desc: '累计学习10小时', icon: '🏃', category: 'activity', rarity: 'rare', condition: () => state.totalStudyTime >= 600 },
    { id: 'centurion', name: '千小时骑士', desc: '累计学习24小时', icon: '⏳', category: 'activity', rarity: 'epic', condition: () => state.totalStudyTime >= 1440 },
    { id: 'early_bird', name: '早起的鸟儿', desc: '在早上5-7点学习', icon: '🌅', category: 'activity', rarity: 'uncommon', condition: () => state.studiedEarly },
    { id: 'night_owl', name: '夜猫子', desc: '在22点后学习', icon: '🦉', category: 'activity', rarity: 'uncommon', condition: () => state.studiedAtNight },
    { id: 'full_moon', name: '学习达人', desc: '累计学习30天', icon: '🌕', category: 'activity', rarity: 'epic', condition: () => state.totalDays >= 30 },
    { id: 'first_week', name: '七日之始', desc: '累计学习7天', icon: '📆', category: 'activity', rarity: 'uncommon', condition: () => state.totalDays >= 7 },
    { id: 'daily_champion', name: '目标达成者', desc: '完成每日学习目标7天', icon: '🎯', category: 'activity', rarity: 'rare', condition: () => {
        if (state.dailyGoalCompleteDays !== undefined) return state.dailyGoalCompleteDays >= 7;
        const today = getLocalDateKey(new Date());
        const todayCount = Object.values(state.completedDates || {}).filter(d => d === today).length;
        return todayCount >= (state.dailyGoal || 1) && state.totalDays >= 5;
    } },

    // ========= 探索与功能 =========
    { id: 'dark_knight', name: '暗夜骑士', desc: '开启深色模式', icon: '🌙', category: 'explore', rarity: 'uncommon', condition: () => state.darkMode === true },
    { id: 'focus_seeker', name: '专注探索', desc: '开启聚焦模式', icon: '🔍', category: 'explore', rarity: 'common', condition: () => state.focusMode === true },
    { id: 'style_curator', name: '审美达人', desc: '更换过主题色', icon: '🎨', category: 'explore', rarity: 'uncommon', condition: () => state.themeColor !== '#6366f1' },
    { id: 'reader', name: '阅读专家', desc: '调整过字体大小', icon: '🔠', category: 'explore', rarity: 'common', condition: () => state.fontSize !== 16 },
    { id: 'automation_master', name: '效率专家', desc: '开启自动标记完成', icon: '🤖', category: 'explore', rarity: 'uncommon', condition: () => state.autoMarkCompleted === true },
    { id: 'planner', name: '规划大师', desc: '开启学习提醒', icon: '⏰', category: 'explore', rarity: 'uncommon', condition: () => state.studyReminder === true },
];

// ========= C 站章节徽章（14 章） =========
const C_CHAPTER_BADGES = [
    { id: 'initiate', name: '初入者', desc: '通关第1章 C语言概述', icon: '📖', category: 'chapter', rarity: 'common', condition: () => checkChapterComplete('01') },
    { id: 'syntax_savant', name: '语法精修', desc: '通关第2章 核心语法基础', icon: '🔤', category: 'chapter', rarity: 'common', condition: () => checkChapterComplete('02') },
    { id: 'control_flow', name: '流程操控', desc: '通关第3章 程序流程控制', icon: '🔀', category: 'chapter', rarity: 'uncommon', condition: () => checkChapterComplete('03') },
    { id: 'array_architect', name: '数组设计师', desc: '通关第4章 数组与字符串', icon: '📊', category: 'chapter', rarity: 'uncommon', condition: () => checkChapterComplete('04') },
    { id: 'code_structurer', name: '结构之匠', desc: '通关第5章 函数与程序结构', icon: '🔧', category: 'chapter', rarity: 'uncommon', condition: () => checkChapterComplete('05') },
    { id: 'pointer_master', name: '指针大师', desc: '完成指针章节全部内容', icon: '🎯', category: 'chapter', rarity: 'rare', condition: () => checkChapterComplete('06') },
    { id: 'memory_guardian', name: '内存守卫', desc: '通关第7章 内存管理', icon: '💾', category: 'chapter', rarity: 'rare', condition: () => checkChapterComplete('07') },
    { id: 'data_structurer', name: '构造大师', desc: '通关第8章 构造数据类型', icon: '🏗️', category: 'chapter', rarity: 'rare', condition: () => checkChapterComplete('08') },
    { id: 'macro_master', name: '宏替换师', desc: '通关第9章 C预处理器', icon: '⚙️', category: 'chapter', rarity: 'epic', condition: () => checkChapterComplete('09') },
    { id: 'stdlib_explorer', name: '标准库探索', desc: '通关第10章 标准库与系统调用', icon: '📚', category: 'chapter', rarity: 'epic', condition: () => checkChapterComplete('10') },
    { id: 'file_handler', name: '文件操作匠', desc: '通关第11章 文件操作', icon: '📁', category: 'chapter', rarity: 'epic', condition: () => checkChapterComplete('11') },
    { id: 'bit_weaver', name: '位元大师', desc: '通关第12章 高级与底层专题', icon: '⚡', category: 'chapter', rarity: 'epic', condition: () => checkChapterComplete('12') },
    { id: 'algorithm_sage', name: '算法高手', desc: '通关第13章 数据结构与算法', icon: '🌳', category: 'chapter', rarity: 'legendary', condition: () => checkChapterComplete('13') },
    { id: 'build_master', name: '工程达人', desc: '通关第14章 工程化与调试', icon: '🛠️', category: 'chapter', rarity: 'legendary', condition: () => checkChapterComplete('14') },
];

// ========= 语法站章节徽章（5 章） =========
const GRAMMAR_CHAPTER_BADGES = [
    { id: 'g_lexicon', name: '词类巧匠', desc: '通关第1章 词性与词类', icon: '🔤', category: 'chapter', rarity: 'common', condition: () => checkChapterComplete('01') },
    { id: 'g_tense', name: '时态掌控', desc: '通关第2章 时态与语态', icon: '⏱️', category: 'chapter', rarity: 'common', condition: () => checkChapterComplete('02') },
    { id: 'g_syntax', name: '句法建构', desc: '通关第3章 句法结构', icon: '🏗️', category: 'chapter', rarity: 'uncommon', condition: () => checkChapterComplete('03') },
    { id: 'g_clause', name: '从句纵横', desc: '通关第4章 从句', icon: '🔗', category: 'chapter', rarity: 'uncommon', condition: () => checkChapterComplete('04') },
    { id: 'g_nonfinite', name: '非谓语行家', desc: '通关第5章 非谓语动词', icon: '✍️', category: 'chapter', rarity: 'rare', condition: () => checkChapterComplete('05') },
];

// ========= 当前站点生效的徽章（setSite 时重建） =========
let BADGE_DEFS = [];

function buildBadgeDefs(siteKey) {
    const milestones = (PROGRESS_BADGES[siteKey] || PROGRESS_BADGES.c).map(function (m) {
        const target = m.target;
        return {
            id: m.id, name: m.name, desc: m.desc, icon: m.icon,
            category: 'progress', rarity: m.rarity, target: target,
            condition: function () { return Object.keys(state.completedSections).length >= target; },
        };
    });
    const chapterBadges = siteKey === 'grammar' ? GRAMMAR_CHAPTER_BADGES : C_CHAPTER_BADGES;
    return milestones.concat(COMMON_BADGES, chapterBadges);
}

// ==================== 章节显示序号 ====================
// ch.id 是 '01'..'14' 的零填充字符串，作为 folder/quiz/节点 id/徽章 键，不能改；
// 展示时统一去掉前导零，避免各处 "第1章" 与 "第01章" 不一致。
function chapterNo(ch) {
    return parseInt(ch ? (ch.id || ch) : '0', 10) || (ch && ch.id) || '';
}

// ==================== 徽章稀有度排序权重 ====================
const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

// ==================== 常量 ====================
const CHECKIN_STORAGE_KEY = 'c_checkin_dates';
const NOISE_STORAGE_KEY = 'c_noise_settings';

// 默认站点初始化：脚本加载后即为默认 C 站点（QUOTES/CHAPTERS/TARGET_DATE 获得正确默认值）。
// 登录后 auth.js 会再次调用 setSite(当前站点) 切换到实际站点。
setSite('c');

// --- js/core/main.js ---
/* ==================== 主入口：状态管理 + 初始化 ==================== */
// ==================== DOM 引用缓存 ====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ==================== 全局错误处理 ====================
window.addEventListener('error', (event) => {
    console.error('[全局错误]', event.message, 'at', event.filename, ':', event.lineno);
});
window.addEventListener('unhandledrejection', (event) => {
    console.error('[未处理的 Promise 拒绝]', event.reason);
});

// ==================== 工具函数 ====================
function getSectionKey(ch, sec) {
    return `${ch.folder}/${sec}.md`;
}

// 站点隔离的本地存储 key（多站点各存各的，避免进度/设置串扰）
// 基于 chapters.js 的 CURRENT_SITE_KEY 生成，切换站点时读写各自数据。
function stateStorageKey() {
    const site = (typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c';
    return 'c_knowledge_base_state_' + site;
}

// 收集本地所有站点状态 key（含旧版单一 key），用于全量清理/偏好扫描
function allStateStorageKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('c_knowledge_base_state') === 0) keys.push(k);
    }
    if (keys.length === 0) keys.push(stateStorageKey());
    return keys;
}

function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==================== 全局状态 ====================
const state = {
    currentView: 'home',
    currentChapterIndex: null,
    currentSectionIndex: null,
    currentSectionKey: null,
    completedSections: {},
    completedDates: {},
    sectionStudyTime: {},
    notes: {},
    bookmarks: [],
    streak: 0,
    totalDays: 0,
    totalStudyTime: 0,
    lastStudyDate: null,
    exp: 0,
    totalExp: 0,
    level: 1,
    badges: [],
    quizStats: { attempts: 0, bestStreak: 0, bestRank: '', sCount: 0, aCount: 0 },
    quest: { completedSections: {}, exp: 0, totalExp: 0, level: 1, quizStats: { attempts: 0, bestStreak: 0, bestRank: '', sCount: 0, aCount: 0 } },
    studiedEarly: false,
    studiedAtNight: false,
    dailyGoalCompleteDays: 0,
    dailyGoalMetDate: null,
    darkMode: false,
    fontSize: 16,
    sidebarCollapsed: false,
    focusMode: false,
    themeColor: '#6366f1',
    gradientBg: 'none',
    videoBg: '',
    videoBgStatic: false,
    dailyGoal: 1,
    autoMarkCompleted: false,
    studyReminder: false,
    reminderTime: '19:00',
    reviewInterval: 3,
    sidebarAutoCollapse: false,
};

// 供实战闯关模块（quizgame-game.js）读写闯关进度
window.__appState = state;

// ==================== 状态持久化 ====================
function saveState() {
    const toSave = {
        completedSections: state.completedSections,
        completedDates: state.completedDates,
        sectionStudyTime: state.sectionStudyTime,
        notes: state.notes,
        bookmarks: state.bookmarks,
        streak: state.streak,
        totalDays: state.totalDays,
        totalStudyTime: state.totalStudyTime,
        lastStudyDate: state.lastStudyDate,
        exp: state.exp,
        totalExp: state.totalExp,
        level: state.level,
         badges: state.badges,
        quizStats: state.quizStats,
        quest: state.quest,
        studiedEarly: state.studiedEarly,
        studiedAtNight: state.studiedAtNight,
        dailyGoalCompleteDays: state.dailyGoalCompleteDays,
        dailyGoalMetDate: state.dailyGoalMetDate,
        darkMode: state.darkMode,
        fontSize: state.fontSize,
        sidebarCollapsed: state.sidebarCollapsed,
        focusMode: state.focusMode,
        themeColor: state.themeColor,
        gradientBg: state.gradientBg,
        videoBg: state.videoBg,
        videoBgStatic: state.videoBgStatic,
        dailyGoal: state.dailyGoal,
        autoMarkCompleted: state.autoMarkCompleted,
        studyReminder: state.studyReminder,
        reminderTime: state.reminderTime,
        reviewInterval: state.reviewInterval,
        sidebarAutoCollapse: state.sidebarAutoCollapse,
    };
    localStorage.setItem(stateStorageKey(), JSON.stringify(toSave));
    fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
    }).catch(() => {});
}

let saveStateDebounceTimer = null;
let settingsToastTimer = null;
function saveStateDebounced() {
    if (saveStateDebounceTimer) return;
    saveStateDebounceTimer = setTimeout(() => {
        saveState();
        saveStateDebounceTimer = null;
        // 显示设置自动保存提示
        var toast = document.getElementById('settingsSaveToast');
        if (toast) {
            if (settingsToastTimer) clearTimeout(settingsToastTimer);
            toast.classList.add('show');
            settingsToastTimer = setTimeout(function() {
                toast.classList.remove('show');
                settingsToastTimer = null;
            }, 2500);
        }
    }, 1000);
}

function loadState() {
    // 优先读当前站点 key；若为空且为 C 站，尝试从旧版单一 key 迁移（兼容历史数据）
    let saved = localStorage.getItem(stateStorageKey());
    if (!saved && (typeof CURRENT_SITE_KEY === 'undefined' || CURRENT_SITE_KEY === 'c')) {
        const legacy = localStorage.getItem('c_knowledge_base_state');
        if (legacy) {
            saved = legacy;
            try { localStorage.removeItem('c_knowledge_base_state'); } catch (e) {}
        }
    }
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        } catch (e) {
            console.warn('状态加载失败，使用默认状态');
        }
    }
    fetch('/api/user-data')
        .then((r) => {
            if (!r.ok) return null; // 未登录(401)或错误时不再合并进 state
            return r.json();
        })
        .then((data) => {
            if (!data) return;
            if (data && Object.keys(data).length > 0) {
                if (data.progress && !data.completedSections) {
                    data.completedSections = {};
                    data.completedDates = {};
                    Object.keys(data.progress).forEach((key) => {
                        if (data.progress[key]) data.completedSections[key] = true;
                    });
                }
                const merged = { ...data, ...state };
                if (data.completedSections && state.completedSections) {
                    merged.completedSections = { ...data.completedSections, ...state.completedSections };
                }
                if (data.sectionStudyTime && state.sectionStudyTime) {
                    merged.sectionStudyTime = { ...data.sectionStudyTime, ...state.sectionStudyTime };
                }
                if (data.notes && state.notes) {
                    merged.notes = { ...data.notes, ...state.notes };
                }
                if (data.bookmarks && state.bookmarks) {
                    merged.bookmarks = [...new Map([...data.bookmarks, ...state.bookmarks].map(item => bookmarkKey(item.chIdx, item.secIdx))).values()];
                }
                if (data.badges && state.badges) {
                    merged.badges = [...new Map([...data.badges, ...state.badges].map(item => [item.id, item])).values()];
                }
                if (data.quest && (!state.quest || Object.keys(state.quest.completedSections || {}).length === 0)) {
                    state.quest = data.quest;
                }
                Object.assign(state, merged);
                chapterTreeDirty = true;
                dashboardDirty = true;
                updateAllUI();
            }
        })
        .catch(() => {});
}

// --- js/core/toast.js ---
/* ==================== Toast 通知 ==================== */
/**
 * 显示一个轻量级的 Toast 通知
 * @param {string} msg - 消息文本
 * @param {number} duration - 显示时长（毫秒），默认 2000
 */
function showToast(msg, duration = 2000) {
    let toast = document.querySelector('.toast-mini');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-mini';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.classList.remove('show'); }, duration);
}

// --- js/features/badges.js ---
/* ==================== 徽章系统 ==================== */
/* 依赖：state（来自 main.js）、BADGE_DEFS、CHAPTERS（来自 data/chapters.js） */
/**
 * 记录本次会话中新解锁的徽章 ID（用于徽章视图的高亮提示）
 */
let justUnlockedBadges = [];

/**
 * 检查指定章节是否全部完成
 */
function checkChapterComplete(chapterId) {
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return false;
    return ch.sections.every((sec) => state.completedSections[getSectionKey(ch, sec)]);
}

/**
 * 检查是否所有章节均已完成
 */
function checkAllComplete() {
    let total = 0;
    let done = 0;
    CHAPTERS.forEach((ch) => {
        ch.sections.forEach((sec) => {
            total++;
            if (state.completedSections[getSectionKey(ch, sec)]) done++;
        });
    });
    return total > 0 && done >= total;
}

/**
 * 遍历所有徽章定义，自动解锁满足条件的徽章
 */
function checkBadges() {
    const unlockedIds = new Set(state.badges.map((b) => b.id));
    let newBadge = null;
    const newly = [];
    for (const def of BADGE_DEFS) {
        if (!unlockedIds.has(def.id) && def.condition()) {
            const badge = { id: def.id, name: def.name, desc: def.desc, icon: def.icon, rarity: def.rarity, category: def.category, date: new Date().toISOString() };
            state.badges.push(badge);
            newly.push(def.id);
            if (!newBadge) newBadge = badge;
        }
    }
    if (newly.length > 0) {
        justUnlockedBadges.push(...newly);
        showBadgeModal(newBadge);
        saveState();
    }
}

/**
 * 弹出徽章解锁弹窗
 */
function showBadgeModal(badge) {
    const modal = document.getElementById('badgeModal');
    if (!modal) return;
    document.getElementById('badgeName').textContent = badge.name;
    document.getElementById('badgeDesc').textContent = badge.desc;
    const animEl = modal.querySelector('.badge-animation');
    if (animEl) {
        animEl.textContent = badge.icon;
        animEl.className = 'badge-animation rarity-' + (badge.rarity || 'common');
    }
    const rarityLabel = document.getElementById('badgeRarityLabel');
    if (rarityLabel) {
        rarityLabel.textContent = RARITY_LABELS[badge.rarity] || '';
        rarityLabel.className = 'badge-rarity-label rarity-' + (badge.rarity || 'common');
    }
    // 弹窗整体辉光背景
    const modalContent = modal.querySelector('.badge-modal-content');
    if (modalContent) {
        modalContent.className = 'modal-content badge-modal-content rarity-' + (badge.rarity || 'common');
    }
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    // 弹窗关闭后刷新徽章列表（新解锁徽章高亮）
    modal.addEventListener('hidden.bs.modal', function refresh() {
        if (typeof initBadges === 'function') initBadges();
        modal.removeEventListener('hidden.bs.modal', refresh);
    });
}

// --- js/features/study-timer.js ---
/* ==================== 学习时间追踪 ==================== */
/* 依赖：state、saveStateDebounced（来自 main.js）、getLocalDateKey（来自 main.js） */
let studyTimerInterval = null;
let studyStartTime = null;

/**
 * 启动学习计时器（每分钟累加）
 */
function startStudyTimer() {
    stopStudyTimer();
    studyStartTime = Date.now();
    studyTimerInterval = setInterval(() => {
        if (studyStartTime) {
            const elapsed = Math.floor((Date.now() - studyStartTime) / 60000);
            if (elapsed > 0) {
                state.totalStudyTime += elapsed;
                if (state.currentSectionKey) {
                    state.sectionStudyTime[state.currentSectionKey] =
                        (state.sectionStudyTime[state.currentSectionKey] || 0) + elapsed;
                }
                studyStartTime = Date.now();
                saveStateDebounced();
            }
        }
    }, 60000);
}

/**
 * 停止学习计时器并结算剩余时间
 */
function stopStudyTimer() {
    if (studyTimerInterval) {
        clearInterval(studyTimerInterval);
        studyTimerInterval = null;
    }
    if (studyStartTime) {
        const elapsed = Math.floor((Date.now() - studyStartTime) / 60000);
        if (elapsed > 0) {
            state.totalStudyTime += elapsed;
            if (state.currentSectionKey) {
                state.sectionStudyTime[state.currentSectionKey] =
                    (state.sectionStudyTime[state.currentSectionKey] || 0) + elapsed;
            }
            saveStateDebounced();
        }
        studyStartTime = null;
    }
}

/**
 * 记录当日学习活动（更新连续打卡天数和本地学习记录）
 */
function recordStudy() {
    const today = new Date().toDateString();
    const todayKey = getLocalDateKey(new Date());
    if (state.lastStudyDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (state.lastStudyDate === yesterday) {
            state.streak++;
        } else {
            state.streak = 1;
        }
        state.totalDays++;
        state.lastStudyDate = today;
        // 连续打卡奖励：连续天数越多，当日学习奖励越高
        const dailyStudyExp = 10 + Math.min(20, Math.floor(state.streak / 3) * 2);
        addExp(dailyStudyExp);
        if (typeof showExpGain === 'function') showExpGain(dailyStudyExp);
        checkBadges();
    }
    const studyRecords = JSON.parse(localStorage.getItem('c_study_records') || '{}');
    studyRecords[todayKey] = (studyRecords[todayKey] || 0) + 1;
    localStorage.setItem('c_study_records', JSON.stringify(studyRecords));
    saveStateDebounced();
}

// --- js/features/bookmark.js ---
/* ==================== 书签功能 ==================== */
/* 依赖：state、CHAPTERS（来自 data/chapters.js）、showToast（来自 core/toast.js）、saveStateDebounced（来自 main.js） */
/**
 * 书签复合键（chIdx_secIdx），全站唯一格式。
 */
function bookmarkKey(chIdx, secIdx) {
    return chIdx + '_' + secIdx;
}

/**
 * 切换当前小节的书签状态
 */
function toggleBookmark() {
    if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
    const currentKey = bookmarkKey(state.currentChapterIndex, state.currentSectionIndex);
    const existingIndex = state.bookmarks.findIndex(b => bookmarkKey(b.chIdx, b.secIdx) === currentKey);
    if (existingIndex >= 0) {
        state.bookmarks.splice(existingIndex, 1);
        showToast('🔖 已移除书签');
    } else {
        state.bookmarks.push({
            chIdx: state.currentChapterIndex,
            secIdx: state.currentSectionIndex,
            date: new Date().toISOString()
        });
        showToast('🔖 已添加书签');
    }
    updateBookmarkButton();
    saveStateDebounced();
}

/**
 * 同步所有书签按钮（顶栏 + 操作栏）的高亮状态。
 */
function updateBookmarkButton() {
    if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
    const currentKey = bookmarkKey(state.currentChapterIndex, state.currentSectionIndex);
    const isBookmarked = state.bookmarks.some(b => bookmarkKey(b.chIdx, b.secIdx) === currentKey);
    document.querySelectorAll('.bookmark-toggle').forEach(function (btn) {
        if (isBookmarked) {
            btn.classList.add('active');
            if (btn.querySelector('i').className !== 'fas fa-bookmark') btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        } else {
            btn.classList.remove('active');
            if (btn.querySelector('i').className !== 'far fa-bookmark') btn.innerHTML = '<i class="far fa-bookmark"></i>';
        }
    });
}

/**
 * 获取格式化的书签列表（用于渲染）
 */
function getBookmarksList() {
    return state.bookmarks.map(b => {
        const ch = CHAPTERS[b.chIdx];
        const sec = ch.sections[b.secIdx];
        return {
            chTitle: ch.title,
            secTitle: ch.sectionTitles[b.secIdx],
            chIdx: b.chIdx,
            secIdx: b.secIdx,
            date: b.date
        };
    });
}

// --- js/features/search.js ---
/* ==================== 全局搜索 ==================== */
/* 依赖：CHAPTERS（来自 data/chapters.js）、loadSection、switchView（来自 roadmap.js） */
/**
 * 初始化全局搜索功能（Ctrl+K 快捷键 + 输入联想）
 */
function initSearch() {
    const searchInput = document.getElementById('searchGlobal');
    const searchDropdown = document.getElementById('searchDropdown');
    if (!searchInput || !searchDropdown) return;

    // 构建搜索索引
    const searchIndex = [];
    CHAPTERS.forEach((ch, chIdx) => {
        ch.sections.forEach((sec, secIdx) => {
            searchIndex.push({
                chIdx,
                secIdx,
                chTitle: ch.title,
                secTitle: ch.sectionTitles[secIdx],
                searchText: (ch.title + ' ' + ch.sectionTitles[secIdx] + ' ' + sec).toLowerCase(),
            });
        });
    });

    // 点击搜索结果跳转
    searchDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const chIdx = parseInt(item.dataset.chIdx);
        const secIdx = parseInt(item.dataset.secIdx);
        state.currentChapterIndex = chIdx;
        state.currentSectionIndex = secIdx;
        loadSection(chIdx, secIdx);
        switchView('course');
        searchDropdown.classList.remove('active');
        searchInput.value = '';
    });

    // 输入联想
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            searchDropdown.classList.remove('active');
            return;
        }
        const results = searchIndex.filter((item) => item.searchText.includes(query)).slice(0, 8);
        if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="search-result-item text-muted">未找到结果</div>';
        } else {
            searchDropdown.innerHTML = results
                .map(
                    (r) => `
                <div class="search-result-item" data-ch-idx="${r.chIdx}" data-sec-idx="${r.secIdx}">
                  <strong>${r.secTitle}</strong>
                  <div class="result-chapter">第${chapterNo(CHAPTERS[r.chIdx])}章 ${r.chTitle}</div>
                </div>
              `
                )
                .join('');
        }
        searchDropdown.classList.add('active');
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });

    // Ctrl+K 快捷聚焦
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// --- js/features/course-search.js ---
/* ==================== 课程目录搜索 ==================== */
/* 依赖：CHAPTERS（来自 data/chapters.js）、loadSection、switchView（来自 roadmap.js） */
/**
 * 初始化课程目录搜索功能
 */
function initCourseSearch() {
    const searchInput = document.getElementById('courseSearchInput');
    const searchResults = document.getElementById('courseSearchResults');
    if (!searchInput || !searchResults) return;

    // 构建搜索索引
    const searchIndex = [];
    CHAPTERS.forEach((ch, chIdx) => {
        ch.sections.forEach((sec, secIdx) => {
            searchIndex.push({
                chIdx,
                secIdx,
                chTitle: ch.title,
                secTitle: ch.sectionTitles[secIdx],
                searchText: (ch.title + ' ' + ch.sectionTitles[secIdx] + ' ' + sec).toLowerCase(),
            });
        });
    });

    // 点击搜索结果跳转
    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.course-search-item');
        if (!item) return;
        const chIdx = parseInt(item.dataset.chIdx);
        const secIdx = parseInt(item.dataset.secIdx);
        state.currentChapterIndex = chIdx;
        state.currentSectionIndex = secIdx;
        loadSection(chIdx, secIdx);
        switchView('course');
        searchResults.classList.remove('active');
        searchInput.value = '';
    });

    // 输入联想
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 1) {
            searchResults.classList.remove('active');
            return;
        }
        const results = searchIndex.filter((item) => item.searchText.includes(query)).slice(0, 10);
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="course-search-item" style="color:var(--text-muted);cursor:default">未找到结果</div>';
        } else {
            searchResults.innerHTML = results
                .map(
                    (r) => `
                <div class="course-search-item" data-ch-idx="${r.chIdx}" data-sec-idx="${r.secIdx}">
                  <span class="item-title">${r.secTitle}</span>
                  <span class="item-sub">第${chapterNo(CHAPTERS[r.chIdx])}章</span>
                </div>
              `
                )
                .join('');
        }
        searchResults.classList.add('active');
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

// --- js/features/video-background.js ---
// ==================== 视频壁纸配置 ====================
const VIDEO_BG_MAP = {
    grassland: '/video/background/grassland.mp4',
    forest:    '/video/background/forest.mp4',
    city:      '/video/background/city.mp4',
    gallery:   '/video/background/gallery.mp4',
    flower:    '/video/background/flower.mp4',
    gorge:     '/video/background/gorge.mp4',
    'green-gallery': '/video/background/green gallery.mp4',
};

function initVideoBackground() {
    // 背景模式标签页切换
    const bgModeTabs = document.querySelectorAll('.bg-mode-tab');
    const gradientArea = document.getElementById('gradientArea');
    const videoArea = document.getElementById('videoArea');

    bgModeTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            const mode = tab.dataset.bgMode;
            bgModeTabs.forEach(function (t) {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            if (mode === 'gradient') {
                if (gradientArea) gradientArea.style.display = '';
                if (videoArea) videoArea.style.display = 'none';
            } else {
                if (gradientArea) gradientArea.style.display = 'none';
                if (videoArea) videoArea.style.display = '';
            }
        });
    });

    // 视频卡片选择
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(function (card) {
        card.addEventListener('click', function () {
            const videoId = card.dataset.video;
            state.videoBg = videoId;
            state.gradientBg = 'none';
            applyGradientBg('none');
            applyVideoBackground();
            videoCards.forEach(function (c) {
                c.classList.toggle('active', c === card);
                c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
            });
            document.querySelectorAll('.gradient-option').forEach(function (opt) {
                opt.classList.toggle('active', opt.dataset.gradient === 'none');
            });
            const videoTab = document.querySelector('.bg-mode-tab[data-bg-mode="video"]');
            if (videoTab && !videoTab.classList.contains('active')) videoTab.click();
            saveStateDebounced();
        });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
        });
    });

    // 动态/静态模式切换
    const videoStaticToggle = document.getElementById('videoStaticMode');
    const videoModeLabel = document.getElementById('videoModeLabel');
    if (videoStaticToggle) {
        videoStaticToggle.checked = state.videoBgStatic;
        if (videoModeLabel) videoModeLabel.textContent = state.videoBgStatic ? '静态壁纸' : '动态播放';
        videoStaticToggle.addEventListener('change', function () {
            state.videoBgStatic = videoStaticToggle.checked;
            if (videoModeLabel) videoModeLabel.textContent = state.videoBgStatic ? '静态壁纸' : '动态播放';
            toggleVideoMode();
            saveStateDebounced();
        });
    }

    // 预览窗口 hover 时播放预览
    const previewPlayer = document.getElementById('videoPreviewPlayer');
    const previewEmpty = document.getElementById('videoPreviewEmpty');
    const previewLabel = document.getElementById('videoPreviewLabel');
    videoCards.forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            const videoId = card.dataset.video;
            const src = VIDEO_BG_MAP[videoId];
            if (!src || !previewPlayer) return;
            previewPlayer.src = src;
            previewPlayer.style.display = '';
            if (previewEmpty) previewEmpty.style.display = 'none';
            if (previewLabel) {
                previewLabel.textContent = card.querySelector('.video-card-name').textContent;
                previewLabel.style.display = '';
            }
            previewPlayer.currentTime = 0;
            previewPlayer.play().catch(function () {});
        });
        card.addEventListener('mouseleave', function () {
            if (previewPlayer) { previewPlayer.pause(); previewPlayer.src = ''; previewPlayer.style.display = 'none'; }
            if (previewEmpty) previewEmpty.style.display = '';
            if (previewLabel) previewLabel.style.display = 'none';
        });
    });

    // 恢复状态：同步UI
    if (state.videoBg) {
        const activeCard = document.querySelector('.video-card[data-video="' + state.videoBg + '"]');
        if (activeCard) {
            videoCards.forEach(function (c) {
                c.classList.toggle('active', c === activeCard);
                c.setAttribute('aria-pressed', c === activeCard ? 'true' : 'false');
            });
        }
    }
    if (state.videoBgStatic && videoStaticToggle) {
        videoStaticToggle.checked = true;
        if (videoModeLabel) videoModeLabel.textContent = '静态壁纸';
    }

    applyVideoBackground();
}

function applyVideoBackground() {
    const videoEl = document.getElementById('videoBackground');
    const overlay = document.getElementById('videoBgOverlay');
    if (!videoEl) return;

    videoEl.pause();
    videoEl.src = '';
    videoEl.classList.remove('active');

    if (state.videoBg && VIDEO_BG_MAP[state.videoBg]) {
        const src = VIDEO_BG_MAP[state.videoBg];
        videoEl.src = src;
        videoEl.load();
        if (!state.videoBgStatic) {
            videoEl.play().catch(function () {});
        } else {
            videoEl.currentTime = 0;
            videoEl.pause();
        }
        videoEl.classList.add('active');
        if (overlay) overlay.style.display = '';
        document.body.classList.add('video-bg-active');
    } else {
        if (overlay) overlay.style.display = 'none';
        document.body.classList.remove('video-bg-active');
    }
}

function toggleVideoMode() {
    const videoEl = document.getElementById('videoBackground');
    if (!videoEl || !state.videoBg) return;
    if (!state.videoBgStatic) {
        videoEl.play().catch(function () {});
    } else {
        videoEl.currentTime = 0;
        videoEl.pause();
    }
}

// --- js/features/notes.js ---
/* ==================== 笔记功能 ==================== */
/* 依赖：state、CHAPTERS、getSectionKey、saveStateDebounced（来自 main.js） */
/**
 * 初始化笔记编辑器
 */
function initNotes() {
    const noteEditor = document.getElementById('noteEditor');
    const saveStatus = document.getElementById('saveStatus');
    if (!noteEditor) return;

    let saveTimeout;
    noteEditor.addEventListener('input', () => {
        if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
        const ch = CHAPTERS[state.currentChapterIndex];
        const sec = ch.sections[state.currentSectionIndex];
        const secKey = getSectionKey(ch, sec);
        state.notes[secKey] = noteEditor.value;
        if (saveStatus) saveStatus.textContent = '保存中...';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveStateDebounced();
            if (saveStatus) saveStatus.textContent = '已保存 ✓';
            setTimeout(() => {
                if (saveStatus) saveStatus.textContent = '';
            }, 1500);
        }, 600);
    });

    // 插入代码块按钮
    document.getElementById('insertCodeBlock')?.addEventListener('click', () => {
        const start = noteEditor.selectionStart;
        const end = noteEditor.selectionEnd;
        const text = noteEditor.value;
        const selected = text.substring(start, end);
        const replacement = '\n```c\n' + (selected || '// 代码') + '\n```\n';
        noteEditor.value = text.substring(0, start) + replacement + text.substring(end);
        noteEditor.focus();
        noteEditor.dispatchEvent(new Event('input'));
    });

    // 插入粗体按钮
    document.getElementById('insertBold')?.addEventListener('click', () => {
        const start = noteEditor.selectionStart;
        const end = noteEditor.selectionEnd;
        const text = noteEditor.value;
        const selected = text.substring(start, end);
        const replacement = '**' + (selected || '粗体文字') + '**';
        noteEditor.value = text.substring(0, start) + replacement + text.substring(end);
        noteEditor.focus();
        noteEditor.dispatchEvent(new Event('input'));
    });
}

// --- js/features/noise.js ---
/* ==================== 背景音乐（BGM）系统 ==================== */
/* 依赖：NOISE_STORAGE_KEY（来自 data/chapters.js） */
const BGM_TRACKS = [
    { id: 'after-the-storm',         file: 'After the Storm.mp3',         name: 'After the Storm' },
    { id: 'apollos-triumph',         file: "Apollo's Triumph.mp3",       name: "Apollo's Triumph" },
    { id: 'memories',                file: 'Memories.mp3',                name: 'Memories' },
    { id: 'this-place-is-a-shelter', file: 'This Place is a Shelter.mp3', name: 'This Place is a Shelter' },
    { id: 'we-are-stars',            file: 'We are Stars.mp3',            name: 'We are Stars' },
];

function getBgmTrack(id) {
    return BGM_TRACKS.find(function (t) { return t.id === id; }) || null;
}

function loadNoiseSettings() {
    try {
        const saved = localStorage.getItem(NOISE_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                type: parsed.type || '',
                volume: typeof parsed.volume === 'number' ? parsed.volume : 0.3,
                muted: !!parsed.muted,
                lastVolume: typeof parsed.lastVolume === 'number' ? parsed.lastVolume : (parsed.volume || 0.3),
                playing: !!parsed.playing,
            };
        }
    } catch (e) {}
    return { type: '', volume: 0.3, muted: false, lastVolume: 0.3, playing: false };
}

function saveNoiseSettings(settings) {
    try {
        localStorage.setItem(NOISE_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
}

function initNoise() {
    const noiseQuickBtn   = document.getElementById('noiseQuickBtn');
    const noisePanel      = document.getElementById('noisePanel');
    const noiseSongList   = document.getElementById('noiseSongList');
    const noisePlayBtn    = document.getElementById('noisePlayBtn');
    const noiseStopBtn    = document.getElementById('noiseStopBtn');
    const noiseVolume     = document.getElementById('noiseVolume');
    const noiseAudio      = document.getElementById('noiseAudio');
    const noiseMuteBtn    = document.getElementById('noiseMuteBtn');
    const noiseStatus     = document.getElementById('noiseStatus');
    const noiseSelectSetting = document.getElementById('noiseSelectSetting');
    if (!noiseQuickBtn || !noisePanel || !noiseSongList || !noiseVolume || !noiseAudio) return;

    const settings = loadNoiseSettings();
    let isPlaying = false;

    function currentTrackName() {
        const track = getBgmTrack(settings.type);
        return track ? track.name : '';
    }

    function populateSelect(select) {
        if (!select) return;
        select.innerHTML = '';
        const off = document.createElement('option');
        off.value = '';
        off.textContent = '关闭';
        select.appendChild(off);
        BGM_TRACKS.forEach(function (track) {
            const opt = document.createElement('option');
            opt.value = track.id;
            opt.textContent = track.name;
            select.appendChild(opt);
        });
    }

    function closePanel() {
        if (noisePanel) noisePanel.classList.remove('active');
    }

    function renderSongList() {
        if (!noiseSongList) return;
        noiseSongList.innerHTML = '';
        const offBtn = document.createElement('button');
        offBtn.type = 'button';
        offBtn.className = 'noise-song-item off' + (settings.type === '' ? ' active' : '');
        offBtn.innerHTML = '<span class="song-state"></span><span>关闭</span>';
        offBtn.addEventListener('click', function () { stopTrack(); closePanel(); });
        noiseSongList.appendChild(offBtn);
        BGM_TRACKS.forEach(function (track) {
            const isActive = settings.type === track.id;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'noise-song-item' + (isActive ? ' active' : '');
            item.innerHTML =
                '<span class="song-state">' + (isActive && isPlaying ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' : '') + '</span>' +
                '<span>' + track.name + '</span>';
            item.addEventListener('click', function () {
                if (isActive && isPlaying) {
                    noiseAudio.pause();
                    settings.playing = false;
                    saveNoiseSettings(settings);
                    updateStatus('已暂停');
                    renderSongList();
                    return;
                }
                if (isActive && !isPlaying) {
                    playTrack(track.id);
                    return;
                }
                playTrack(track.id);
            });
            noiseSongList.appendChild(item);
        });
    }

    function updateButtonState() {
        noiseQuickBtn.classList.toggle('playing', isPlaying && !settings.muted);
    }

    function updatePlayBtn() {
        if (!noisePlayBtn) return;
        noisePlayBtn.classList.toggle('is-playing', isPlaying);
    }

    function updateStatus(text) {
        if (noiseStatus) {
            noiseStatus.textContent = text || '';
            noiseStatus.className = 'noise-status' + (isPlaying ? ' playing' : '');
        }
    }

    function syncSelects() {
        if (noiseSelectSetting) noiseSelectSetting.value = settings.type;
    }

    function playTrack(type) {
        const track = getBgmTrack(type);
        if (!track) { stopTrack(); return; }
        settings.type = type;
        noiseAudio.src = '/audio/' + encodeURIComponent(track.file);
        noiseAudio.volume = settings.muted ? 0 : settings.volume;
        noiseAudio.play().then(function () {
            saveNoiseSettings(settings);
            updateStatus('正在播放 ' + track.name);
            renderSongList();
        }).catch(function () {
            saveNoiseSettings(settings);
            updateStatus('点击页面任意位置可开始播放');
        });
        syncSelects();
        updateButtonState();
        updatePlayBtn();
    }

    function stopTrack() {
        noiseAudio.pause();
        noiseAudio.removeAttribute('src');
        noiseAudio.load();
        settings.type = '';
        settings.playing = false;
        saveNoiseSettings(settings);
        isPlaying = false;
        syncSelects();
        updateStatus('');
        updateButtonState();
        updatePlayBtn();
        renderSongList();
        var viz = document.getElementById('musicVisualizer');
        if (viz) viz.style.display = 'none';

    }

    function togglePlay() {
        if (isPlaying) {
            noiseAudio.pause();
            settings.playing = false;
            saveNoiseSettings(settings);
            updateStatus('已暂停');
            updateButtonState();
            updatePlayBtn();
        } else if (settings.type) {
            playTrack(settings.type);
        }
    }

    populateSelect(noiseSelectSetting);
    renderSongList();
    if (settings.type && noiseSelectSetting) noiseSelectSetting.value = settings.type;

    const initVolume = settings.muted ? (settings.lastVolume || 0.3) : (settings.volume ?? 0.3);
    noiseVolume.value = initVolume;
    noiseAudio.volume = settings.muted ? 0 : initVolume;

    function updateVisualizer() {
        var viz = document.getElementById('musicVisualizer');
        if (!viz) return;
        viz.style.display = (!noiseAudio.paused && !settings.muted && settings.type) ? '' : 'none';
    }

    noiseAudio.addEventListener('play', function () {
        isPlaying = true;
        settings.playing = true;
        saveNoiseSettings(settings);
        updateButtonState();
        updatePlayBtn();
        updateVisualizer();
        updateStatus('正在播放 ' + currentTrackName());
        renderSongList();
    });
    noiseAudio.addEventListener('pause', function () {
        isPlaying = false;
        updateButtonState();
        updatePlayBtn();
        updateVisualizer();
        renderSongList();
    });
    noiseAudio.addEventListener('error', function () {
        if (settings.type) {
            isPlaying = false;
            settings.playing = false;
            saveNoiseSettings(settings);
            updateStatus('音频加载失败，请检查音频文件');
            updateButtonState();
            updatePlayBtn();
        }
    });

    if (noiseSelectSetting) {
        noiseSelectSetting.addEventListener('change', function () {
            const type = noiseSelectSetting.value;
            if (type) playTrack(type);
            else stopTrack();
            renderSongList();
        });
    }

    if (noisePlayBtn) noisePlayBtn.addEventListener('click', function () { togglePlay(); });
    if (noiseStopBtn) noiseStopBtn.addEventListener('click', function () { stopTrack(); closePanel(); });

    noiseVolume.addEventListener('input', function () {
        const vol = parseFloat(noiseVolume.value);
        if (isNaN(vol)) return;
        noiseAudio.volume = settings.muted ? 0 : vol;
        settings.volume = vol;
        if (!settings.muted) settings.lastVolume = vol;
        saveNoiseSettings(settings);
    });

    noiseMuteBtn.addEventListener('click', function () {
        settings.muted = !settings.muted;
        if (settings.muted) {
            settings.lastVolume = settings.volume;
            noiseAudio.volume = 0;
        } else {
            const vol = settings.lastVolume || settings.volume || 0.3;
            noiseAudio.volume = vol;
            noiseVolume.value = vol;
            settings.volume = vol;
        }
        saveNoiseSettings(settings);
        updateButtonState();
        updatePlayBtn();
        updateVisualizer();
    });

    // 音乐图标点击：未展开则展开；已展开则收起并恢复播放/暂停语义
    noiseQuickBtn.addEventListener('click', function (e) {
        if (!noisePanel.classList.contains('active')) {
            noisePanel.classList.add('active');
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        if (isPlaying) {
            noiseAudio.pause();
            settings.playing = false;
            saveNoiseSettings(settings);
            updateStatus('已暂停');
            updateButtonState();
            updatePlayBtn();
        } else if (settings.type) {
            playTrack(settings.type);
        }
        noisePanel.classList.remove('active');
    });

    document.addEventListener('click', function (e) {
        if (!noisePanel.classList.contains('active')) return;
        if (!noisePanel.contains(e.target) && !noiseQuickBtn.contains(e.target)) {
            noisePanel.classList.remove('active');
        }
    });

    let resumeDone = false;
    function tryResume() {
        if (resumeDone) return;
        resumeDone = true;
        if (settings.type && settings.playing && !settings.muted && noiseAudio.paused) {
            playTrack(settings.type);
        }
    }
    document.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest('.noise-container')) return;
        if (e.target.tagName === 'SELECT') return;
        tryResume();
    }, { capture: true, passive: true });
    document.addEventListener('keydown', function () {
        tryResume();
    }, { capture: true, passive: true });

    if (settings.type && settings.playing && !settings.muted) {
        const track = getBgmTrack(settings.type);
        if (track) {
            noiseAudio.src = '/audio/' + encodeURIComponent(track.file);
            noiseAudio.volume = settings.volume;
            const p = noiseAudio.play();
            if (p && p.catch) p.catch(function () {});
        }
    }

    updateButtonState();
    updatePlayBtn();
    updateStatus('');
}

// --- js/features/keyboard.js ---
/* ==================== 键盘快捷键 ==================== */
/* 依赖：toggleBookmark（来自 features/bookmark.js）、markCompleted（来自 roadmap.js） */
/**
 * 初始化全局键盘快捷键
 * Ctrl+←→ : 上一篇/下一篇
 * Ctrl+B   : 切换书签
 * Ctrl+M   : 标记完成/取消
 * Escape   : 关闭大纲/搜索面板
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevBtn = document.getElementById('prevBtn');
            if (prevBtn && !prevBtn.disabled) prevBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
            e.preventDefault();
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn && !nextBtn.disabled) nextBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            toggleBookmark();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            markCompleted();
        }
        if (e.key === 'Escape') {
            const outlinePanel = document.getElementById('outlinePanel');
            if (outlinePanel) outlinePanel.classList.remove('visible');
            const searchDropdown = document.getElementById('searchDropdown');
            if (searchDropdown) searchDropdown.classList.remove('active');
        }
    });
}

// --- js/features/tasks.js ---
/* ==================== 任务清单模块 ==================== */
/* 由 task.html 精简重构：去除粒子背景 / 时钟 / 番茄钟 / 倒计时 / 名言 / 小窗 / 背景切换，
   数据按站点隔离存储（C语言站存 C 任务，英语站存英语任务），
   主页「今日任务」卡片直接引用本模块数据（见 js/views/home.js renderTaskList）。
   对外暴露 window.TasksApp：getTasks / addTask / toggleTask / escapeHtml / refresh */
(function () {
    'use strict';

    // ---- 站点隔离存储 ----
    function storageKey() {
        const site = (typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c';
        return 'task_list_' + site;
    }
    function siteName() {
        if (typeof CURRENT_SITE_NAME !== 'undefined' && CURRENT_SITE_NAME) return CURRENT_SITE_NAME;
        return ((typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c') === 'grammar' ? '英语语法' : 'C语言';
    }
    function siteKey() {
        return (typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c';
    }

    let tasks = [];
    let currentFilter = 'all';
    let searchKeyword = '';
    let undoStack = [];
    let renderPending = false;
    let editingId = null;

    // ---- 数据读写 ----
    function load() {
        try {
            const raw = localStorage.getItem(storageKey());
            if (raw) tasks = JSON.parse(raw);
        } catch (_) {}
        if (!Array.isArray(tasks)) tasks = [];
        tasks = tasks.map(function (t) {
            return {
                id: t.id,
                text: t.text || '',
                completed: !!t.completed,
                important: !!t.important,
                subject: t.subject || siteKey(),
                createdAt: t.createdAt || Date.now(),
            };
        });
    }

    function save() {
        try { localStorage.setItem(storageKey(), JSON.stringify(tasks)); } catch (_) {}
        document.dispatchEvent(new CustomEvent('tasks-changed'));
    }

    // 一次性迁移：把 task.html 旧数据（taskApp_v9_optimized）按学科拆分到对应站点存储
    function migrateLegacyTasks() {
        if (localStorage.getItem('task_list_migrated_v1')) return;
        try {
            const raw = localStorage.getItem('taskApp_v9_optimized');
            if (raw) {
                const legacy = JSON.parse(raw);
                if (Array.isArray(legacy) && legacy.length > 0) {
                    const subjectToSite = { english: 'grammar', c: 'c' };
                    legacy.forEach(function (t) {
                        const site = subjectToSite[t.subject] || 'c';
                        let list = [];
                        try { list = JSON.parse(localStorage.getItem('task_list_' + site) || '[]'); } catch (_) {}
                        if (!Array.isArray(list)) list = [];
                        if (list.some(function (x) { return x.text === t.text; })) return;
                        list.push({
                            id: t.id,
                            text: t.text,
                            completed: !!t.completed,
                            important: !!t.important,
                            subject: site,
                            createdAt: t.createdAt || Date.now(),
                        });
                        localStorage.setItem('task_list_' + site, JSON.stringify(list));
                    });
                }
            }
        } catch (_) {}
        try { localStorage.setItem('task_list_migrated_v1', '1'); } catch (_) {}
    }

    // ---- CRUD ----
    function getTasks() { return tasks; }

    function addTask(text) {
        const trimmed = String(text || '').trim();
        if (!trimmed) return false;
        tasks.push({
            id: Date.now() + Math.random(),
            text: trimmed,
            completed: false,
            important: false,
            subject: siteKey(),
            createdAt: Date.now(),
        });
        save();
        scheduleRender();
        showToast('✅ 任务已添加');
        return true;
    }

    function toggleTask(id) {
        const t = tasks.find(function (x) { return x.id === id; });
        if (!t) return;
        t.completed = !t.completed;
        save();
        scheduleRender();
        if (t.completed) showToast('✅ 「' + t.text + '」已完成');
        else showToast('↩️ 已恢复为进行中');
    }

    function setImportant(id) {
        const t = tasks.find(function (x) { return x.id === id; });
        if (!t) return;
        t.important = !t.important;
        save();
        scheduleRender();
    }

    function deleteTask(id) {
        const idx = tasks.findIndex(function (x) { return x.id === id; });
        if (idx === -1) return;
        const snapshot = tasks.slice();
        const removed = tasks[idx];
        tasks.splice(idx, 1);
        save();
        undoStack.push({ tasks: snapshot, message: '已删除「' + removed.text + '」' });
        scheduleRender();
        showUndoToast();
    }

    function undoLast() {
        const last = undoStack.pop();
        if (!last) return;
        tasks = last.tasks;
        save();
        hideUndoToast();
        scheduleRender();
        showToast('↩️ 已撤销');
    }

    function clearCompleted() {
        const completed = tasks.filter(function (t) { return t.completed; });
        if (completed.length === 0) {
            showToast('📭 没有已完成的任务');
            return;
        }
        const snapshot = tasks.slice();
        tasks = tasks.filter(function (t) { return !t.completed; });
        save();
        undoStack.push({ tasks: snapshot, message: '已清除 ' + completed.length + ' 项已完成任务' });
        scheduleRender();
        showUndoToast();
    }

    // ---- 撤销 Toast（带按钮，主站 showToast 仅文本故自建） ----
    function showUndoToast() {
        hideUndoToast();
        const msg = undoStack.length ? undoStack[undoStack.length - 1].message : '';
        const el = document.createElement('div');
        el.className = 'tasks-undo-toast';
        el.innerHTML = '<span>' + escapeHtml(msg) + '</span><button type="button">撤销</button>';
        el.querySelector('button').addEventListener('click', function () { undoLast(); });
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.classList.add('show'); });
        el._t = setTimeout(hideUndoToast, 5000);
    }
    function hideUndoToast() {
        const el = document.querySelector('.tasks-undo-toast');
        if (!el) return;
        clearTimeout(el._t);
        el.classList.remove('show');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }

    // ---- 过滤 / 统计 ----
    function getFilteredTasks() {
        let result = tasks;
        if (searchKeyword.trim()) {
            const kw = searchKeyword.trim().toLowerCase();
            result = result.filter(function (t) { return (t.text || '').toLowerCase().indexOf(kw) !== -1; });
        }
        if (currentFilter === 'active') result = result.filter(function (t) { return !t.completed; });
        else if (currentFilter === 'completed') result = result.filter(function (t) { return t.completed; });
        else if (currentFilter === 'important') result = result.filter(function (t) { return t.important; });
        return result;
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function updateStats() {
        const total = tasks.length;
        const done = tasks.filter(function (t) { return t.completed; }).length;
        const active = total - done;
        const important = tasks.filter(function (t) { return t.important; }).length;
        setText('taskStatTotal', total);
        setText('taskStatActive', active);
        setText('taskStatDone', done);
        setText('taskStatImportant', important);

        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        const ring = document.getElementById('taskRingProgress');
        if (ring) ring.style.setProperty('--p', pct);
        setText('taskRingPct', pct + '%');
        setText('taskFooterInfo', '共 ' + total + ' 项 · ' + active + ' 进行中 · ' + done + ' 已完成');
    }

    // ---- 渲染 ----
    function scheduleRender() {
        if (renderPending) return;
        renderPending = true;
        requestAnimationFrame(function () { renderPending = false; render(); });
    }

    function render() {
        if (!document.getElementById('taskItems')) return; // 视图尚未挂载（主页引用时仅调 getTasks）
        updateStats();

        const listEl = document.getElementById('taskItems');
        const emptyEl = document.getElementById('taskListEmpty');
        const filtered = getFilteredTasks();

        if (filtered.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) {
                emptyEl.hidden = false;
                let icon = 'fa-inbox', msg = '还没有任务，添加一个吧', sub = '输入内容后回车即可创建';
                if (currentFilter === 'active') { icon = 'fa-person-running'; msg = '没有进行中的任务'; sub = '完成任务或切换筛选'; }
                else if (currentFilter === 'completed') { icon = 'fa-check-circle'; msg = '没有已完成的任务'; sub = '完成任务后会出现在这里'; }
                else if (currentFilter === 'important') { icon = 'fa-star'; msg = '没有重要任务'; sub = '给任务标 ⭐ 以便聚焦'; }
                if (searchKeyword.trim()) { icon = 'fa-search'; msg = '没有匹配的任务'; sub = '换个关键词试试'; }
                emptyEl.innerHTML = '<div class="tasks-empty-state"><i class="fas ' + icon + '"></i><p>' + msg + '</p><div class="sub">' + sub + '</div></div>';
            }
            return;
        }
        if (emptyEl) emptyEl.hidden = true;

        // 排序：重要优先 + 新建优先
        const sorted = filtered.slice().sort(function (a, b) {
            if (a.important && !b.important) return -1;
            if (!a.important && b.important) return 1;
            return b.createdAt - a.createdAt;
        });

        let html = '';
        for (let i = 0; i < sorted.length; i++) {
            const t = sorted[i];
            const cls = 'task-row' + (t.completed ? ' done' : '') + (t.important ? ' important' : '');
            html +=
                '<li class="' + cls + '" data-id="' + t.id + '">' +
                '<span class="task-row-check" role="checkbox" aria-checked="' + t.completed + '" tabindex="0">' + (t.completed ? '<i class="fas fa-check"></i>' : '') + '</span>' +
                '<div class="task-row-text">' + escapeHtml(t.text) + '</div>' +
                '<span class="task-row-date">' + timeAgo(t.createdAt) + '</span>' +
                '<button class="task-row-btn' + (t.important ? ' on' : '') + '" data-action="star" title="标为重要"><i class="fas fa-star"></i></button>' +
                '<button class="task-row-btn del" data-action="delete" title="删除"><i class="fas fa-times"></i></button>' +
                '</li>';
        }
        listEl.innerHTML = html;
    }

    function timeAgo(ts) {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return mins + ' 分钟前';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + ' 小时前';
        const days = Math.floor(hours / 24);
        if (days < 7) return days + ' 天前';
        return new Date(ts).toLocaleDateString('zh-CN');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    // ---- 行内编辑 ----
    function enterEditMode(textEl, task) {
        if (editingId) return;
        editingId = task.id;
        const currentText = task.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-row-edit';
        input.value = currentText;
        textEl.textContent = '';
        textEl.appendChild(input);
        input.focus();
        input.select();
        const finish = function () {
            const newText = input.value.trim();
            if (newText && newText !== currentText) { task.text = newText; save(); }
            editingId = null;
            scheduleRender();
        };
        input.addEventListener('blur', finish);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            else if (e.key === 'Escape') { input.value = currentText; input.blur(); }
        });
    }

    // ---- 视图初始化 ----
    function init() {
        migrateLegacyTasks();
        load();

        const input = document.getElementById('taskInput');
        const addBtn = document.getElementById('taskAddBtn');
        if (addBtn) addBtn.addEventListener('click', function () {
            if (input && addTask(input.value)) input.value = '';
        });
        if (input) input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); if (addTask(input.value)) input.value = ''; }
        });

        // 快捷模板
        document.querySelectorAll('.task-quick-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (input) { input.value = this.dataset.template; input.focus(); }
            });
        });

        // 筛选
        const filterGroup = document.getElementById('taskFilterGroup');
        if (filterGroup) filterGroup.addEventListener('click', function (e) {
            const btn = e.target.closest('.task-filter');
            if (!btn) return;
            const f = btn.dataset.filter;
            if (f && f !== currentFilter) {
                currentFilter = f;
                filterGroup.querySelectorAll('.task-filter').forEach(function (b) { b.classList.toggle('active', b === btn); });
                scheduleRender();
            }
        });

        // 搜索
        const search = document.getElementById('taskSearch');
        if (search) search.addEventListener('input', function () { searchKeyword = search.value; scheduleRender(); });

        // 列表事件委托
        const listEl = document.getElementById('taskItems');
        if (listEl) {
            listEl.addEventListener('click', function (e) {
                const target = e.target.closest('.task-row-check, .task-row-btn');
                if (!target) return;
                const li = target.closest('.task-row');
                if (!li) return;
                const id = Number(li.dataset.id);
                if (isNaN(id)) return;
                e.stopPropagation();
                if (target.classList.contains('task-row-check')) { toggleTask(id); return; }
                const action = target.dataset.action;
                if (action === 'star') setImportant(id);
                else if (action === 'delete') deleteTask(id);
            });
            listEl.addEventListener('keydown', function (e) {
                if (e.key === ' ' || e.key === 'Enter') {
                    const cb = e.target.closest('.task-row-check');
                    if (cb) { e.preventDefault(); const li = cb.closest('.task-row'); if (li) toggleTask(Number(li.dataset.id)); }
                }
            });
            listEl.addEventListener('dblclick', function (e) {
                const textEl = e.target.closest('.task-row-text');
                if (!textEl) return;
                const li = textEl.closest('.task-row');
                if (!li) return;
                const id = Number(li.dataset.id);
                const task = tasks.find(function (t) { return t.id === id; });
                if (!task || task.completed) return;
                enterEditMode(textEl, task);
            });
        }

        // 清除已完成
        const clearBtn = document.getElementById('taskClearBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearCompleted);

        // 站点标签
        const siteLabel = document.getElementById('tasksSiteLabel');
        if (siteLabel) siteLabel.textContent = '当前站点 · ' + siteName() + '（任务按站点独立保存）';

        scheduleRender();
    }

    // 切换到任务清单视图时刷新
    function refresh() { scheduleRender(); }

    window.TasksApp = {
        getTasks: getTasks,
        addTask: addTask,
        toggleTask: toggleTask,
        setImportant: setImportant,
        escapeHtml: escapeHtml,
        refresh: refresh,
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('DOMContentLoaded', init);
})();

// --- js/features/auth.js ---
/* ==================== 应用侧鉴权：/app 引导 + 站点切换 + 401 拦截 + 登出 ==================== */
/* 登录前页面是独立 EJS（views/login.ejs + login-page.js），不在此文件。
   本文件只负责 /app 应用壳的引导：已登录则初始化应用；未登录/会话过期跳回登录页。
   登录/注册/选站表单逻辑在 public/js/login-page.js。 */
// ==================== 全局 401 拦截 + CSRF Token ====================
// 任何 /api 请求返回 401（且非登录接口自身）时，会话过期 → 整页跳回登录页。
// 同时自动为所有非 GET 请求附加 CSRF token。
(function intercept401() {
  var originalFetch = window.fetch;
  window.fetch = async function (...args) {
    var url = String(args[0] || '');
    var options = args[1] || {};

    // 为非 GET/HEAD/OPTIONS 请求自动附加 CSRF token
    var method = (options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      var csrfToken = sessionStorage.getItem('csrfToken');
      if (csrfToken) {
        options = Object.assign({}, options);
        options.headers = Object.assign({}, options.headers || {});
        options.headers['x-csrf-token'] = csrfToken;
      }
    }

    var res = await originalFetch.call(this, url, options);
    if (res.status === 401 && url.indexOf('/api/auth/') === -1) {
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    }
    return res;
  };
})();

// ==================== 渲染下拉用户信息块 ====================
function renderDropdownUser() {
  const me = window.__currentUser;
  const user = (me && me.user) || {};
  const nameEl = document.getElementById('dropdownUserName');
  const roleEl = document.getElementById('dropdownUserRole');
  if (nameEl) nameEl.textContent = user.displayName || user.username || '管理员';
  if (roleEl) {
    const role = user.role || '管理员';
    roleEl.innerHTML = '<i class="fas fa-crown"></i> ' + role;
  }

  // 默认头像
  const defaultAvatar = '/image/admin-avatar.png';
  const hasCustomAvatar = user.avatar && user.avatar.trim() !== '';
  const avatarSrc = hasCustomAvatar ? user.avatar : defaultAvatar;

  // 更新顶栏按钮头像
  const topAvatar = document.getElementById('topAvatar');
  if (topAvatar) {
    topAvatar.src = avatarSrc;
    // 始终显示头像（默认或自定义），fallback 仅在图片加载失败时显示
    const fallback = topAvatar.parentNode.querySelector('.user-avatar-fallback');
    if (fallback) {
      fallback.style.display = 'none'; // 默认隐藏fallback
    }
  }

  // 更新下拉菜单内头像
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownAvatarFallback = document.getElementById('dropdownAvatarFallback');
  if (dropdownAvatar) {
    if (hasCustomAvatar) {
      dropdownAvatar.src = avatarSrc;
      dropdownAvatar.style.display = '';
      if (dropdownAvatarFallback) dropdownAvatarFallback.style.display = 'none';
    } else {
      dropdownAvatar.style.display = 'none';
      if (dropdownAvatarFallback) dropdownAvatarFallback.style.display = 'flex';
    }
  }
}

// ==================== 切换站点入口（顶栏下拉） ====================
function bindSiteSwitcher() {
  const container = document.getElementById('siteSwitchDropdown');
  if (!container) return;
  container.innerHTML = '';
  const me = window.__currentUser;
  const sites = (me && me.sites) || [];
  const current = (me && me.site) || null;
  sites.forEach(function (site) {
    const key = site.key || site;
    const item = document.createElement('a');
    item.className = 'dropdown-item' + (key === current ? ' active' : '');
    item.href = '#';
    item.innerHTML = '<i class="fas fa-globe"></i> ' + (site.name || key) + (key === current ? ' <small>·当前</small>' : '');
    item.addEventListener('click', function (e) {
      e.preventDefault();
      if (key === current) return;
      selectSite(key);
    });
    container.appendChild(item);
  });
}

// ==================== 应用站点配置（标题/副标题/主题色） ====================
async function applySiteConfig(me) {
  // 优先从 /me 的 sites 中找当前站点，没有则请求 /api/site/config
  let cfg = null;
  const current = (me && me.site) || null;
  const sites = (me && me.sites) || [];
  if (current && sites.length) {
    cfg = sites.find(function (s) { return s.key === current; }) || null;
  }
  if (!cfg) {
    try {
      const r = await fetch('/api/site/config');
      if (r.ok) cfg = await r.json();
    } catch (_) {}
  }
  if (!cfg) return;
  const logoText = document.getElementById('logoText');
  if (logoText && cfg.logoText) logoText.textContent = cfg.logoText;
  // 按站点切换 logo 图片（顶栏）
  if (cfg.logo) {
    const topLogo = document.getElementById('logoImg');
    if (topLogo) topLogo.src = cfg.logo;
  }
  const welcomeSub = document.getElementById('welcomeName');
  if (welcomeSub && cfg.name) welcomeSub.textContent = cfg.name + '学习者';
  // 页面标题与任务面板标题（随站点切换）
  const siteName = (cfg && cfg.name) || '知识库';
  document.title = siteName + ' · 知识库';
  const questTitle = document.getElementById('questTitle');
  if (questTitle) questTitle.textContent = '探索' + siteName + '世界';
  // 主题色
  if (cfg.theme && cfg.theme.accent) {
    document.documentElement.style.setProperty('--accent', cfg.theme.accent);
  }
}

// ==================== 选择站点（顶栏下拉原地切换，不刷新页面） ====================
// POST /api/auth/select → 重新取 /me → setSite + applySiteConfig + init 原地重建。
async function selectSite(siteKey) {
  try {
    const res = await fetch('/api/auth/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteKey }),
    });
    if (res.ok) {
      const me = await fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null));
      if (me && me.site === siteKey) {
        window.__currentUser = me;
        applySiteConfig(me);
        if (typeof setSite === 'function') setSite(siteKey);
        // 背单词功能仅限英语语法站点（可见性由 data-feature=vocabulary 控制）
        var vocabEl = document.getElementById('vocabNavItem');
        if (vocabEl) vocabEl.href = '/vocabulary.html?site=' + siteKey;
        // 强制标记脏数据，确保切换站点后章节树和仪表盘立即重建
        if (typeof chapterTreeDirty !== 'undefined') chapterTreeDirty = true;
        if (typeof dashboardDirty !== 'undefined') dashboardDirty = true;
        // 重新初始化当前站点内容
        if (typeof init === 'function') init();
        // 更新顶栏用户信息（头像/名字/站点下拉）
        renderDropdownUser();
        bindSiteSwitcher();
        if (typeof renderBadgeButton === 'function') renderBadgeButton();
      } else {
        window.location.replace('/'); // 异常：回登录页
      }
    }
  } catch (_err) {
    // 网络错误静默
  }
}

// ==================== 退出登录 ====================
async function handleLogout(e) {
  if (e) e.preventDefault();
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (_) {}
  // 清除本地状态（所有站点的状态 key，含旧版单一 key）
  Object.keys(localStorage)
    .filter(function (k) { return k.indexOf('c_knowledge_base_state') === 0; })
    .forEach(function (k) { localStorage.removeItem(k); });
  localStorage.removeItem('c_study_records');
  localStorage.removeItem('CHECKIN_STORAGE_KEY');
  // 登出 → 回登录页
  window.location.replace('/');
}

// ==================== 账号信息填充 ====================
function populateSettingsAccountInfo(me) {
    const user = (me && me.user) || {};
    const displayNameEl = document.getElementById('settingsDisplayName');
    const usernameEl = document.getElementById('settingsAccountUsername');
    const emailEl = document.getElementById('settingsAccountEmail');
    const siteEl = document.getElementById('settingsAccountSite');
    const avatarImg = document.getElementById('settingsAccountAvatar');
    const avatarFallback = document.getElementById('settingsAccountAvatarFallback');

    if (displayNameEl) displayNameEl.textContent = user.displayName || user.username || '未知';

    if (usernameEl) {
        usernameEl.innerHTML = '<i class="fas fa-user-circle"></i> ' + (user.username || '');
    }
    if (emailEl) {
        const email = user.email || '';
        emailEl.innerHTML = '<i class="fas fa-envelope"></i> ' + email;
    }
    if (siteEl && me && me.sites) {
        const currentSite = me.sites.find(function (s) { return s.key === me.site; });
        siteEl.innerHTML = '<i class="fas fa-globe"></i> ' + (currentSite ? currentSite.name : me.site);
    }

    // 头像
    if (user.avatar && avatarImg) {
        avatarImg.src = user.avatar;
        avatarImg.style.display = '';
        if (avatarFallback) avatarFallback.style.display = 'none';
    } else if (avatarFallback) {
        avatarFallback.style.display = '';
        if (avatarImg) avatarImg.style.display = 'none';
    }

    // 快捷按钮绑定
    const openEditBtn = document.getElementById('openEditProfileBtn');
    const quickPwdBtn = document.getElementById('quickChangePwdBtn');
    const quickExportBtn = document.getElementById('quickExportBtn');
    const quickImportBtn = document.getElementById('quickImportBtn');

    if (openEditBtn) {
        openEditBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // 复用 editProfileModal
            var modal = document.getElementById('editProfileModal');
            if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                var m = new bootstrap.Modal(modal);
                m.show();
            }
        });
    }
    if (quickPwdBtn) {
        quickPwdBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var modal = document.getElementById('changePasswordModal');
            if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                var m = new bootstrap.Modal(modal);
                m.show();
            }
        });
    }
    if (quickExportBtn) {
        quickExportBtn.addEventListener('click', function () {
            var btn = document.getElementById('exportAllDataBtn');
            if (btn) btn.click();
        });
    }
    if (quickImportBtn) {
        quickImportBtn.addEventListener('click', function () {
            var btn = document.getElementById('importDataBtn');
            if (btn) btn.click();
        });
    }
}

// ==================== /app 引导 ====================
function initAuth() {
  // 应用前先应用深色偏好（扫描任意站点的状态 key，兼容旧版单一 key）
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('c_knowledge_base_state') === 0) {
        const saved = JSON.parse(localStorage.getItem(k));
        if (saved && saved.darkMode) { document.body.classList.add('dark'); break; }
      }
    }
  } catch (_) {}

  fetch('/api/auth/me')
    .then(function (res) {
      if (res.ok) {
        return res.json();
      }
      throw new Error('未登录');
    })
    .then(function (me) {
      window.__currentUser = me;
      // 下拉用户信息块
      renderDropdownUser();
      // 填充设置页账号信息
      populateSettingsAccountInfo(me);
      // 站点切换下拉绑定
      bindSiteSwitcher();
      // 获取 CSRF token
      fetch('/api/csrf-token')
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d.csrfToken) sessionStorage.setItem('csrfToken', d.csrfToken); })
        .catch(function () {});
      // 已登录但尚未选定站点（多站点账号）：服务端 /app 已允许进入（不强制选站），回登录页选站
      if (me.hasSite === false || !me.site) {
        if (me.sites && me.sites.length > 1) {
          window.location.replace('/');
          return;
        }
        // 单站点理论上服务端已自动选定，若仍未选则尝试进入
        if (me.sites && me.sites.length === 1) {
          selectSite(me.sites[0].key);
          return;
        }
      }
      // 应用站点数据（章节/语录/目标）
      if (typeof setSite === 'function') setSite(me.site || 'c');
      // 背单词功能仅限英语语法站点（可见性由 data-feature=vocabulary 控制）
      var vocabEl = document.getElementById('vocabNavItem');
      if (vocabEl) vocabEl.href = '/vocabulary.html?site=' + (me.site || 'c');
      // 应用站点标题/副标题/主题
      applySiteConfig(me);
      // 启动应用
      if (typeof init === 'function') init();
    })
    .catch(function () {
      // 未登录 / 会话过期 → 回登录页
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    });
}

// ==================== 修改密码弹窗 ====================
function initChangePassword() {
  const btn = document.getElementById('changePasswordBtn');
  const modal = document.getElementById('changePasswordModal');
  const saveBtn = document.getElementById('savePasswordBtn');
  const currentPw = document.getElementById('currentPassword');
  const newPw = document.getElementById('newPassword');
  const confirmPw = document.getElementById('confirmNewPassword');
  const errorEl = document.getElementById('changePasswordError');
  if (!modal || !btn) return;

  function openModal(e) {
    if (e) e.preventDefault();
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('show');
    currentPw.value = '';
    newPw.value = '';
    confirmPw.value = '';
    errorEl.textContent = '';
    if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const instance = bootstrap.Modal.getInstance(modal);
      if (instance) instance.show();
      else new bootstrap.Modal(modal).show();
    } else if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
  }

  if (btn) btn.addEventListener('click', openModal);

  saveBtn.addEventListener('click', async function () {
    const cur = currentPw.value;
    const ne = newPw.value;
    const conf = confirmPw.value;
    if (!cur || !ne || !conf) {
      errorEl.textContent = '请填写完整信息';
      return;
    }
    if (ne.length < 6) {
      errorEl.textContent = '新密码至少6位';
      return;
    }
    if (ne !== conf) {
      errorEl.textContent = '两次新密码不一致';
      return;
    }
    errorEl.textContent = '';
    saveBtn.disabled = true;
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: ne }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        // 关闭弹窗
        const instance = bootstrap && bootstrap.Modal && modal && bootstrap.Modal.getInstance(modal);
        if (instance) instance.hide();
        else if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }
        // 提示成功
        if (typeof showToast === 'function') showToast('密码修改成功');
      } else {
        errorEl.textContent = data.error || '修改失败';
      }
    } catch (_) {
      errorEl.textContent = '网络错误，请重试';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==================== 修改资料弹窗 ====================
function initProfileEditor() {
  const btn = document.getElementById('editProfileBtn');
  const btn2 = document.getElementById('editProfileBtn2');
  const modal = document.getElementById('editProfileModal');
  const saveBtn = document.getElementById('editProfileSaveBtn');
  const nameInput = document.getElementById('editDisplayName');
  const avatarInput = document.getElementById('editAvatarUrl');
  const avatarFile = document.getElementById('editAvatarFile');
  const avatarFileName = document.getElementById('editAvatarFileName');
  const avatarPreview = document.getElementById('editAvatarPreview');
  const errorEl = document.getElementById('editProfileError');
  if (!modal) return;

  let uploadedAvatarUrl = ''; // 存储上传后的头像URL

  // 通用打开模态框函数
  function openProfileModal(e) {
    if (e) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    // 关闭下拉菜单
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('show');
    const me = window.__currentUser;
    const user = (me && me.user) || {};
    nameInput.value = user.displayName || '';
    avatarInput.value = user.avatar || '';
    uploadedAvatarUrl = ''; // 重置上传头像
    if (avatarFileName) avatarFileName.textContent = '';
    if (avatarFile) avatarFile.value = '';
    if (user.avatar && user.avatar.trim()) {
      avatarPreview.src = user.avatar;
    } else {
      avatarPreview.src = '/image/admin-avatar.png';
    }
    errorEl.textContent = '';
    // 显示模态框
    if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.show();
      } else {
        const modalEl = new bootstrap.Modal(modal);
        modalEl.show();
      }
    } else if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
  }

  // 绑定下拉菜单的按钮
  if (btn) {
    btn.addEventListener('click', openProfileModal);
  }
  // 绑定设置页面的按钮
  if (btn2) {
    btn2.addEventListener('click', openProfileModal);
  }

  // 如果没有任何按钮，直接返回
  if (!btn && !btn2) return;

  // 头像文件选择时预览
  if (avatarFile) {
    avatarFile.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        // 显示文件名
        if (avatarFileName) avatarFileName.textContent = file.name;
        // 预览图片
        const reader = new FileReader();
        reader.onload = function (ev) {
          avatarPreview.src = ev.target.result;
          uploadedAvatarUrl = ev.target.result; // 存储base64
        };
        reader.readAsDataURL(file);
        // 清空URL输入
        if (avatarInput) avatarInput.value = '';
      }
    });
  }

  // 头像 URL 输入时实时预览
  if (avatarInput) {
    avatarInput.addEventListener('input', function () {
      const url = avatarInput.value.trim();
      if (url) {
        avatarPreview.src = url;
        uploadedAvatarUrl = ''; // URL模式下清空上传的base64
        if (avatarFileName) avatarFileName.textContent = '';
      } else {
        avatarPreview.src = '/image/admin-avatar.png';
      }
    });
  }

  saveBtn.addEventListener('click', async function () {
    const displayName = nameInput.value.trim();
    const avatarUrl = avatarInput.value.trim();
    if (!displayName) {
      errorEl.textContent = '显示名称不能为空';
      return;
    }
    errorEl.textContent = '';
    saveBtn.disabled = true;
    try {
      // 如果有上传的图片，使用base64；否则使用URL
      const avatar = uploadedAvatarUrl || avatarUrl;
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatar }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (window.__currentUser && window.__currentUser.user) {
          window.__currentUser.user.displayName = data.user.displayName;
          window.__currentUser.user.avatar = data.user.avatar;
        }
        renderDropdownUser();
        // 关闭弹窗
        const modalInstance = bootstrap && bootstrap.Modal && modal && bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        } else if (modal) {
          modal.classList.remove('show');
          modal.style.display = 'none';
        }
      } else {
        errorEl.textContent = data.error || '保存失败';
      }
    } catch (_) {
      errorEl.textContent = '网络错误，请重试';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

// ==================== 用户下拉菜单手动控制 ====================
function initUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  const btn = document.getElementById('userDropdownBtn');
  const menu = document.getElementById('userDropdownMenu');

  if (!dropdown || !btn || !menu) return;

  // 点击按钮切换下拉
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = menu.classList.contains('show');
    // 关闭所有 Bootstrap 下拉
    document.querySelectorAll('.dropdown-menu.show').forEach(function (d) {
      d.classList.remove('show');
    });
    if (!isOpen) {
      menu.classList.add('show');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // 点击其他地方关闭
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // 站点切换项使用 Bootstrap 下拉的，需要阻止冒泡
  const siteItems = menu.querySelectorAll('#siteSwitchDropdown .dropdown-item');
  siteItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });

  // 退出登录
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      handleLogout();
    });
  }
}

document.addEventListener('DOMContentLoaded', initAuth);
document.addEventListener('DOMContentLoaded', initProfileEditor);
document.addEventListener('DOMContentLoaded', initUserDropdown);
document.addEventListener('DOMContentLoaded', initChangePassword);

// --- js/views/home.js ---
/* ==================== 主页视图模块（v2） ==================== */
/* 包含：励志语录、专升本倒计时、连续打卡、今日任务、学习热力图、签到日历、学习统计、最近成就、下个徽章 */
/* 依赖：state, QUOTES, TARGET_DATE, CHECKIN_STORAGE_KEY（来自 data/chapters.js） */
/*       showToast（来自 core/toast.js）、addExp, checkBadges 等 */
// ==================== 励志语录 ====================
let currentQuoteIndex = 0;

function getTodayQuoteIndex() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now - startOfYear;
    const dayOfYear = Math.floor(diff / 86400000) + 1;
    return dayOfYear % QUOTES.length;
}

function updateQuote() {
    const quoteText = document.getElementById('quoteText');
    if (!quoteText) return;
    quoteText.textContent = QUOTES[currentQuoteIndex];
}

function initQuoteModule() {
    currentQuoteIndex = getTodayQuoteIndex();
    updateQuote();

    const refreshBtn = document.getElementById('refreshQuoteBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            currentQuoteIndex = (currentQuoteIndex + 1) % QUOTES.length;
            updateQuote();
            const icon = refreshBtn.querySelector('i');
            if (icon) {
                icon.style.transition = 'transform 0.4s ease';
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transition = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }, 400);
            }
        });
    }
}

// ==================== 专升本倒计时（圆环进度） ====================
function updateCountdown() {
    const countdownDays = document.getElementById('countdownDays');
    const ring = document.getElementById('countdownRing');
    if (!countdownDays) return;

    const now = new Date();
    const diff = TARGET_DATE - now;
    const daysLeft = Math.max(0, Math.ceil(diff / 86400000));

    countdownDays.textContent = daysLeft;

    // 圆环进度：已过时长 / 总时长（从 2024-09-01 开学算起，避免起始即 0%）
    const total = TARGET_DATE - new Date('2024-09-01T00:00:00+08:00');
    const elapsed = now - new Date('2024-09-01T00:00:00+08:00');
    const pct = total > 0 ? Math.max(0, Math.min(1, elapsed / total)) : 0;
    if (ring) ring.style.setProperty('--pct', pct);

    const motto = document.getElementById('countdownMotto');
    if (motto) {
        if (daysLeft >= 100) motto.textContent = '时间充裕，稳扎稳打';
        else if (daysLeft >= 60) motto.textContent = '黄金复习期，加油冲刺';
        else if (daysLeft >= 30) motto.textContent = '冲刺关键期，全力以赴';
        else if (daysLeft > 0) motto.textContent = '最后时刻，绝不放弃';
        else motto.textContent = '已在梦想的彼岸 🎓';
    }
}

function initCountdownModule() {
    updateCountdown();
    setInterval(updateCountdown, 60000);
}

// ==================== 连续打卡天数 ====================
function getCheckinDates() {
    try {
        return JSON.parse(localStorage.getItem(CHECKIN_STORAGE_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveCheckinDates(dates) {
    // 去重 + 升序，保证连续判定稳定
    const unique = [...new Set(dates)].sort();
    localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(unique));
}

function calculateCheckinStreak() {
    const dates = getCheckinDates();
    if (dates.length === 0) return 0;

    const uniqueSorted = [...new Set(dates)].sort().reverse();

    const today = getLocalDateKey(new Date());
    const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));

    if (uniqueSorted[0] !== today && uniqueSorted[0] !== yesterday) {
        return 0;
    }

    let streak = 1;
    let currentDate = new Date(uniqueSorted[0]);

    for (let i = 1; i < uniqueSorted.length; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = getLocalDateKey(prevDate);

        if (uniqueSorted[i] === prevDateStr) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
}

// 渲染本周 7 日打卡圆点
function renderWeekDots() {
    const container = document.getElementById('weekDots');
    if (!container) return;
    const checkinDates = getCheckinDates();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    let html = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dKey = getLocalDateKey(d);
        const todayKey = getLocalDateKey(now);
        const isToday = dKey === todayKey;
        const isFuture = d > now;
        const isDone = checkinDates.includes(dKey);
        let cls = 'week-dot';
        if (isDone) cls += ' done';
        if (isToday) cls += ' today';
        if (isFuture) cls += ' future';
        const mark = isDone ? '✓' : (isToday ? (checkinDates.includes(todayKey) ? '✓' : '今') : '');
        html += '<div class="' + cls + '"><span class="dot">' + mark + '</span><label>周' + weekDays[i] + '</label></div>';
    }
    container.innerHTML = html;
}

// ==================== 今日学习任务清单 ====================
// 数据源：任务清单模块（js/features/tasks.js，按站点独立存储）。
// 仅展示「进行中」任务，点击可跳转到任务清单视图；完成状态在任务清单里维护。
function renderTaskList() {
    const list = document.getElementById('taskList');
    if (!list) return;

    // 从任务清单模块读取当前站点的任务
    const pendingTasks = (window.TasksApp && Array.isArray(window.TasksApp.getTasks()))
        ? window.TasksApp.getTasks().filter(function (t) { return !t.completed; })
        : [];

    if (pendingTasks.length === 0) {
        list.innerHTML = '<div class="task-empty go-tasks" id="homeGoTasks">📋 今天还没有待办，去任务清单添加一个吧</div>';
        const go = document.getElementById('homeGoTasks');
        if (go) go.onclick = function () { switchView('tasks'); };
        return;
    }

    let html = '';
    const maxShow = 5;
    const showCount = Math.min(maxShow, pendingTasks.length);
    for (let i = 0; i < showCount; i++) {
        const t = pendingTasks[i];
        const esc = (window.TasksApp && window.TasksApp.escapeHtml) ? window.TasksApp.escapeHtml(t.text) : t.text;
        html += '<div class="task-item' + (t.important ? ' important' : '') + '" title="' + esc + '">' +
            '<span class="task-check"></span>' +
            '<div class="task-info"><div class="task-name">' + esc + '</div></div>' +
            '<span class="task-time">待办</span>' +
            '</div>';
    }
    if (pendingTasks.length > maxShow) {
        html += '<div class="task-empty go-tasks" id="homeGoTasks">还有 ' + (pendingTasks.length - maxShow) + ' 项任务，查看全部 →</div>';
    }
    list.innerHTML = html;

    const go = document.getElementById('homeGoTasks');
    if (go) go.onclick = function () { switchView('tasks'); };
}

// ==================== 学习热力图（近 12 周） ====================
function getDailyStudyCount() {
    try {
        return JSON.parse(localStorage.getItem('c_study_records') || '{}');
    } catch (e) {
        return {};
    }
}

function activityLevel(count) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
}

function renderHeatmap() {
    const body = document.getElementById('heatBody');
    const months = document.getElementById('heatMonths');
    if (!body) return;

    const records = getDailyStudyCount();
    const checkin = getCheckinDates();
    const todayKey = getLocalDateKey(new Date());

    // 近 12 周 = 84 天，按列（每列 7 天，从周一开始）
    const colCount = 12;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + mondayOffset - (colCount - 1) * 7);
    startDate.setHours(0, 0, 0, 0);

    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    let html = '';
    for (let c = 0; c < colCount; c++) {
        html += '<div class="heat-col">';
        for (let r = 0; r < 7; r++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + c * 7 + r);
            const dKey = getLocalDateKey(d);
            const count = records[dKey] || 0;
            const lv = activityLevel(count);
            const isToday = dKey === todayKey;
            // 单一 class 属性（重复 class 会导致后者被忽略）
            html += '<span class="heat-cell' + (isToday ? ' today' : '') + '" data-l="' + lv + '"' +
                (isToday ? ' data-today="1"' : '') +
                ' title="' + dKey + ' · ' + count + ' 小节"></span>';
        }
        html += '</div>';
    }
    body.innerHTML = html;

    // 月份标签
    if (months) {
        let moon = '';
        let lastMonth = -1;
        for (let c = 0; c < colCount; c++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + c * 7);
            const m = d.getMonth();
            if (m !== lastMonth) {
                moon += '<span class="heat-month">' + (m + 1) + '月</span>';
                lastMonth = m;
            } else {
                moon += '<span class="heat-month"></span>';
            }
        }
        months.innerHTML = moon;
    }
}

// ==================== 主页签到日历（紧凑月视图） ====================
let homeCalYear = new Date().getFullYear();
let homeCalMonth = new Date().getMonth();

function renderHomeCalendar() {
    const container = document.getElementById('homeCalendarGrid');
    const monthYearEl = document.getElementById('calendarMonthYear');
    const signinBtn = document.getElementById('homeSigninBtn');
    const signinBtnText = document.getElementById('signinBtnText');
    if (!container || !monthYearEl) return;

    const checkinDates = getCheckinDates();
    const today = new Date();
    const todayKey = getLocalDateKey(today);
    const isTodayCheckedIn = checkinDates.includes(todayKey);

    monthYearEl.textContent = homeCalYear + '年' + (homeCalMonth + 1) + '月';

    const firstDay = new Date(homeCalYear, homeCalMonth, 1).getDay();
    const daysInMonth = new Date(homeCalYear, homeCalMonth + 1, 0).getDate();

    // 周表头
    let html = '<div class="cal-week-head">';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(function (wd) {
        html += '<span class="week-day">' + wd + '</span>';
    });
    html += '</div>';

    // 上月补位
    const prevMonthDays = new Date(homeCalYear, homeCalMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const dateKey = getLocalDateKey(new Date(homeCalYear, homeCalMonth - 1, day));
        html += '<span class="cal-day other" data-date="' + dateKey + '">' + day + '</span>';
    }

    // 本月
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getLocalDateKey(new Date(homeCalYear, homeCalMonth, day));
        const isToday = dateKey === todayKey;
        const isCheckedIn = checkinDates.includes(dateKey);
        const isFuture = dateKey > todayKey;

        let classes = 'cal-day';
        if (isToday) classes += ' today';
        if (isCheckedIn) classes += ' checked-in';
        if (isFuture) classes += ' future';
        if (isToday && !isCheckedIn) classes += ' checkable';

        html += '<span class="' + classes + '" data-date="' + dateKey + '">' + day + '</span>';
    }

    // 补齐空白
    const totalCells = firstDay + daysInMonth;
    const remaining = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let day = 1; day <= remaining; day++) {
        const dateKey = getLocalDateKey(new Date(homeCalYear, homeCalMonth + 1, day));
        html += '<span class="cal-day other" data-date="' + dateKey + '">' + day + '</span>';
    }

    container.innerHTML = html;

    // 事件委托：点击可签到日
    container.onclick = function (e) {
        const dayEl = e.target.closest('.cal-day.checkable');
        if (!dayEl) return;
        const dateKey = dayEl.dataset.date;
        if (!dateKey) return;
        doCheckin(dateKey);
    };

    updateSigninButton();
}

function doCheckin(dateKey) {
    const currentDates = getCheckinDates();
    if (currentDates.includes(dateKey)) {
        showToast('📅 今日已签到');
        return;
    }
    currentDates.push(dateKey);
    saveCheckinDates(currentDates);

    // renderHomeCalendar 内部已调用 updateSigninButton；renderTaskList 与签到无关，无需重渲
    renderHomeCalendar();
    updateStreakDisplay();
    renderWeekDots();
    updateWeeklyProgress();
    showToast('✅ 签到成功！+10经验');

    addExp(10);
    checkBadges();
    saveStateDebounced();
}

function updateSigninButton() {
    const signinBtn = document.getElementById('homeSigninBtn');
    const signinBtnText = document.getElementById('signinBtnText');
    if (!signinBtn || !signinBtnText) return;

    const todayKey = getLocalDateKey(new Date());
    const checkinDates = getCheckinDates();
    const isCheckedIn = checkinDates.includes(todayKey);

    signinBtn.disabled = false;
    if (isCheckedIn) {
        signinBtn.classList.add('checked');
        signinBtnText.textContent = '今日已签到';
    } else {
        signinBtn.classList.remove('checked');
        signinBtnText.textContent = '今日签到';
    }
}

function initHomeCalendar() {
    renderHomeCalendar();

    // 签到按钮
    const signinBtn = document.getElementById('homeSigninBtn');
    if (signinBtn) {
        signinBtn.addEventListener('click', function () {
            const todayKey = getLocalDateKey(new Date());
            const checkinDates = getCheckinDates();
            if (checkinDates.includes(todayKey)) {
                showToast('📅 今日已签到');
                return;
            }
            checkinDates.push(todayKey);
            saveCheckinDates(checkinDates);

            renderHomeCalendar();
            updateStreakDisplay();
            renderTaskList();
            renderWeekDots();
            updateWeeklyProgress();
            showToast('✅ 签到成功！+10经验');

            addExp(10);
            checkBadges();
            saveStateDebounced();
        });
    }

    const prevBtn = document.getElementById('homeCalPrevMonth');
    const nextBtn = document.getElementById('homeCalNextMonth');
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            homeCalMonth--;
            if (homeCalMonth < 0) { homeCalMonth = 11; homeCalYear--; }
            renderHomeCalendar();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            homeCalMonth++;
            if (homeCalMonth > 11) { homeCalMonth = 0; homeCalYear++; }
            renderHomeCalendar();
        });
    }
}

// ==================== 学习统计 ====================
function updateHomeStatsNew() {
    const homeCompleted = document.getElementById('homeCompleted');
    const homeExp = document.getElementById('homeExp');
    const homeLevel = document.getElementById('homeLevel');
    const homeTodayStudy = document.getElementById('homeTodayStudy');

    if (homeCompleted) homeCompleted.textContent = Object.keys(state.completedSections).length;
    if (homeExp) homeExp.textContent = state.exp;
    if (homeLevel) homeLevel.textContent = 'LV' + state.level;

    if (homeTodayStudy) {
        const todayKey = getLocalDateKey(new Date());
        const studyRecords = JSON.parse(localStorage.getItem('c_study_records') || '{}');
        homeTodayStudy.textContent = studyRecords[todayKey] || 0;
    }
}

// ==================== 继续学习智能卡 ====================
function findNextSection() {
    // 优先：最近完成小节之后
    const completedKeys = Object.keys(state.completedSections || {});
    if (completedKeys.length > 0) {
        const lastKey = completedKeys[completedKeys.length - 1];
        for (let chIdx = 0; chIdx < CHAPTERS.length; chIdx++) {
            const ch = CHAPTERS[chIdx];
            for (let i = 0; i < ch.sections.length; i++) {
                if (getSectionKey(ch, ch.sections[i]) === lastKey) {
                    // 同章下一节
                    if (i + 1 < ch.sections.length) {
                        return { chIdx: chIdx, secIdx: i + 1 };
                    }
                    // 下一章第一小节
                    if (chIdx + 1 < CHAPTERS.length) {
                        return { chIdx: chIdx + 1, secIdx: 0 };
                    }
                }
            }
        }
    }
    // 无记录：从第一章第一小节开始
    return { chIdx: 0, secIdx: 0 };
}

function updateContinueCard() {
    const label = document.getElementById('continueLastLabel');
    const bar = document.getElementById('heroProgressBar');
    const pctEl = document.getElementById('heroProgressText');
    if (!label) return;

    const next = findNextSection();
    const ch = CHAPTERS[next.chIdx];
    const secName = ch.sectionTitles[next.secIdx] || ch.sections[next.secIdx].replace(/\.md$/, '');

    // 总进度
    const total = CHAPTERS.reduce(function (s, c) { return s + c.sections.length; }, 0);
    const done = Object.keys(state.completedSections || {}).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    label.textContent = (done > 0 ? '第' + chapterNo(ch) + '章 · ' + secName : '从 第' + chapterNo(ch) + '章 · ' + secName + ' 开始');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
}

// ==================== 最近成就 / 本周目标 / 下个徽章 ====================
function updateWeeklyProgress() {
    const bar = document.getElementById('weeklyProgressBar');
    const text = document.getElementById('weeklyProgressText');
    if (!bar || !text) return;

    const checkinDates = getCheckinDates();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    let weekCheckins = 0;
    for (let d = new Date(monday); d <= now; d.setDate(d.getDate() + 1)) {
        const dateKey = getLocalDateKey(d);
        if (checkinDates.includes(dateKey)) weekCheckins++;
    }

    const weekGoal = 7;
    const pct = Math.round((weekCheckins / weekGoal) * 100);
    bar.style.width = pct + '%';
    text.textContent = weekCheckins + ' / ' + weekGoal + ' 天';
}

function updateAchievementSection() {
    const recentBadges = document.getElementById('recentBadges');
    const nextBadge = document.getElementById('nextBadge');

    if (recentBadges) {
        if (state.badges.length === 0) {
            recentBadges.innerHTML = '<span class="text-muted">还没有徽章，去学习解锁</span>';
        } else {
            const recent = state.badges.slice(-5).reverse();
            recentBadges.innerHTML = recent
                .map(function (b) {
                    const def = BADGE_DEFS.find(function (d) { return d.id === b.id; });
                    const rarity = def ? def.rarity : 'common';
                    return '<div class="mini-badge unlocked rarity-' + rarity + '" title="' + b.name + '·' + RARITY_LABELS[rarity] + ': ' + b.desc + '">' + b.icon + '</div>';
                })
                .join('');
        }
    }

    // 下个徽章进度
    if (nextBadge) {
        const lockedDefs = BADGE_DEFS.filter(function (d) {
            return !state.badges.some(function (b) { return b.id === d.id; });
        });
        if (lockedDefs.length > 0) {
            // 找一个接近完成的（简化：取第一个完成了部分条件的）
            let showBadge = lockedDefs[0];
            let pct = 0;
            // 尝试评估简单条件徽章
            for (let i = 0; i < lockedDefs.length; i++) {
                const d = lockedDefs[i];
                let cur = 0, target = 1;
                const cond = estimateBadgeProgress(d);
                if (cond) { showBadge = d; cur = cond.cur; target = cond.target; pct = target > 0 ? Math.round(cur / target * 100) : 0; break; }
            }
            nextBadge.innerHTML =
                '<div><div class="next-badge-label"><span class="nb-icon">' + showBadge.icon + '</span>下一个徽章</div>' +
                '<div class="next-badge-name">' + showBadge.name + '<span class="next-badge-pct">' + pct + '%</span></div>' +
                '<div class="progress"><div class="progress-bar" style="width:' + pct + '%"></div></div></div>';
        } else {
            nextBadge.innerHTML = '';
        }
    }
}

// 估算常见徽章进度
function estimateBadgeProgress(def) {
    const completedKeys = Object.keys(state.completedSections || {});
    const completedCount = completedKeys.length;
    const total = CHAPTERS.reduce(function (s, c) { return s + c.sections.length; }, 0);
    const totalStudyTime = state.totalStudyTime || 0;

    // 进度里程碑徽章（含按站点定制的阈值 target）直接用 def.target
    if (typeof def.target === 'number') {
        return { cur: completedCount, target: def.target };
    }

    switch (def.id) {
        case 'first_step': return { cur: completedCount, target: 1 };
        case 'five_done': return { cur: completedCount, target: 5 };
        case 'ten_done': return { cur: completedCount, target: 10 };
        case 'twenty_done': return { cur: completedCount, target: 20 };
        case 'thirty_done': return { cur: completedCount, target: 30 };
        case 'forty_done': return { cur: completedCount, target: 40 };
        case 'fifty_done': return { cur: completedCount, target: 50 };
        case 'first_half': return { cur: completedCount, target: Math.ceil(total * 0.5) };
        case 'all_rounder': return { cur: completedCount, target: Math.ceil(total * 0.8) };
        case 'streak_3': return { cur: calculateCheckinStreak(), target: 3 };
        case 'streak_7': return { cur: calculateCheckinStreak(), target: 7 };
        case 'streak_14': return { cur: calculateCheckinStreak(), target: 14 };
        case 'streak_30': return { cur: calculateCheckinStreak(), target: 30 };
        case 'level_5': return { cur: state.level, target: 5 };
        case 'level_10': return { cur: state.level, target: 10 };
        case 'level_15': return { cur: state.level, target: 15 };
        case 'level_20': return { cur: state.level, target: 20 };
        case 'level_30': return { cur: state.level, target: 30 };
        case 'marathon': return { cur: Math.floor(totalStudyTime / 60), target: 10 };
        case 'centurion': return { cur: Math.floor(totalStudyTime / 60), target: 24 };
        default: return null;
    }
}

// ==================== 主页整体更新 ====================
function updateHomeNew() {
    updateWelcomeSection();
    updateQuote();
    updateCountdown();
    updateStreakDisplay();
    renderHomeCalendar();
    updateHomeStatsNew();
    updateAchievementSection();
    renderTaskList();
    renderHeatmap();
    renderWeekDots();
    updateContinueCard();
    updateWeeklyProgress();
}

// 任务清单模块数据变化时自动刷新主页今日任务卡片
document.addEventListener('tasks-changed', function () { renderTaskList(); });

function updateStreakDisplay() {
    const streakNumber = document.getElementById('streakNumber');
    if (streakNumber) {
        streakNumber.textContent = calculateCheckinStreak();
    }
}

function updateWelcomeSection() {
    const welcomeGreeting = document.getElementById('welcomeGreeting');
    const welcomeLevelChip = document.getElementById('welcomeLevelChip');

    if (welcomeGreeting) {
        const hour = new Date().getHours();
        let greeting = '欢迎回来';
        if (hour < 6) greeting = '夜深了，早点休息';
        else if (hour < 12) greeting = '早上好';
        else if (hour < 14) greeting = '中午好';
        else if (hour < 18) greeting = '下午好';
        else if (hour < 22) greeting = '晚上好';
        else greeting = '夜深了，早点休息';
        welcomeGreeting.textContent = greeting;
    }
    if (welcomeLevelChip) welcomeLevelChip.textContent = 'LV' + state.level;
}

// ==================== 快捷操作（保留原有事件，移除冗余） ====================
function initStatsActions() {
    const continueBtn = document.getElementById('continueLastBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function () {
            const next = findNextSection();
            state.currentChapterIndex = next.chIdx;
            state.currentSectionIndex = next.secIdx;
            loadSection(next.chIdx, next.secIdx);
            switchView('course');
        });
    }

    const randomBtn = document.getElementById('randomChallengeBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', function () {
            const allSections = [];
            CHAPTERS.forEach(function (ch, chIdx) {
                ch.sections.forEach(function (sec, secIdx) {
                    allSections.push({ chIdx: chIdx, secIdx: secIdx });
                });
            });
            const pick = allSections[Math.floor(Math.random() * allSections.length)];
            state.currentChapterIndex = pick.chIdx;
            state.currentSectionIndex = pick.secIdx;
            loadSection(pick.chIdx, pick.secIdx);
            switchView('course');
            showToast('🎲 随机跳转！');
        });
    }

    const roadmapBtn = document.getElementById('viewRoadmapBtn');
    if (roadmapBtn) {
        roadmapBtn.addEventListener('click', function () {
            switchView('roadmap');
        });
    }

    const goBadgesBtn = document.getElementById('goBadgesBtn');
    if (goBadgesBtn) {
        goBadgesBtn.addEventListener('click', function () {
            switchView('badges');
        });
    }

    const goTasksBtn = document.getElementById('goTasksBtn');
    if (goTasksBtn) {
        goTasksBtn.addEventListener('click', function () {
            switchView('tasks');
        });
    }
}

// --- js/views/dashboard.js ---
/* ==================== 仪表盘视图模块 ==================== */
/* 包含：统计卡片、进度环、学习趋势图、活动热力图、待复习列表、书签列表、学习记录表 */
/* 依赖：state, CHAPTERS, BADGE_DEFS（来自 data/chapters.js）、formatStudyTime（来自 utils/helpers.js） */
// ==================== 仪表盘状态标志 ====================
let dashboardInitialized = false;
let dashboardDirty = true;
let calendarCurrentDate = new Date();
let lastRingPercent = -1;
let weeklyChartInstance = null;
let tableSortState = { column: null, direction: 'asc' };
let tableCurrentPage = 1;
let tablePageSize = 20;
let tableSearchQuery = '';
let tableStatusFilter = '';
let dashTimeRange = 'week';
let chartType = 'bar';

// ==================== 仪表盘主入口 ====================
function initDashboard() {
    const dashStreak = document.getElementById('dashStreak');
    const dashCompleted = document.getElementById('dashCompleted');
    const dashStudyTime = document.getElementById('dashStudyTime');
    const dashStudyTimeDetail = document.getElementById('dashStudyTimeDetail');
    if (dashStreak) dashStreak.textContent = state.streak;
    if (dashCompleted) dashCompleted.textContent = Object.keys(state.completedSections).length;
    if (dashStudyTime) dashStudyTime.textContent = formatStudyTime(state.totalStudyTime);
    if (dashStudyTimeDetail) {
        const avgTime = state.totalDays > 0 ? Math.round(state.totalStudyTime / state.totalDays) : 0;
        dashStudyTimeDetail.textContent = '日均 ' + formatStudyTime(avgTime);
    }
    updateExpUI();
    updateProgressBar();
    updateTrends();
    initOverallRing();
    updateWeeklyChart();
    initReviewList();
    initBookmarkList();
    initRecentBadges();
    initActivityCalendar();
    initLearningTable();
    updateLevelBar();
    updatePanelCounts();
    initDashFilters();
    initChartTabs();
    dashboardInitialized = true;
}

// ==================== 动态趋势计算 ====================
function updateTrends() {
    const studyRecords = JSON.parse(localStorage.getItem('c_study_records') || '{}');
    const streakTrend = document.getElementById('dashStreakTrend');
    const completedTrend = document.getElementById('dashCompletedTrend');
    const studyTimeDetail = document.getElementById('dashStudyTimeDetail');

    // 本周 vs 上周学习天数对比
    let thisWeek = 0, lastWeek = 0;
    for (let i = 0; i < 7; i++) {
        const thisDay = getLocalDateKey(new Date(Date.now() - i * 86400000));
        const lastDay = getLocalDateKey(new Date(Date.now() - (i + 7) * 86400000));
        if (studyRecords[thisDay]) thisWeek++;
        if (studyRecords[lastDay]) lastWeek++;
    }
    if (streakTrend) {
        if (thisWeek > lastWeek) {
            streakTrend.innerHTML = '<i class="fas fa-arrow-up"></i> 本周 ' + thisWeek + ' 天';
            streakTrend.className = 'stat-trend stat-trend-up';
        } else if (thisWeek < lastWeek) {
            streakTrend.innerHTML = '<i class="fas fa-arrow-down"></i> 本周 ' + thisWeek + ' 天';
            streakTrend.className = 'stat-trend';
            streakTrend.style.color = 'var(--danger)';
        } else {
            streakTrend.textContent = '本周 ' + thisWeek + ' 天 · 持平';
            streakTrend.className = 'stat-trend';
        }
    }

    // 最近完成日期
    if (completedTrend) {
        const dates = Object.values(state.completedDates || {}).filter(Boolean).sort();
        if (dates.length > 0) {
            const lastDate = new Date(dates[dates.length - 1]);
            const diffDays = Math.floor((Date.now() - lastDate) / 86400000);
            completedTrend.textContent = diffDays === 0 ? '今天有学习' : diffDays === 1 ? '昨天完成过' : diffDays + '天前完成过';
        } else {
            completedTrend.textContent = '暂无记录';
        }
    }

    // 学习时长日均
    if (studyTimeDetail) {
        const avgTime = state.totalDays > 0 ? Math.round(state.totalStudyTime / state.totalDays) : 0;
        studyTimeDetail.textContent = '日均 ' + formatStudyTime(avgTime);
    }
}

// ==================== 等级进度条 ====================
function updateLevelBar() {
    const levelBar = document.getElementById('dashLevelBar');
    if (!levelBar) return;
    const need = getExpForLevel(state.level);
    const pct = Math.min(100, (state.exp / need) * 100);
    levelBar.style.width = pct + '%';
}

function updatePanelCounts() {
    const reviewCount = document.getElementById('reviewCount');
    const bookmarkCount = document.getElementById('bookmarkCount');
    const badgeCount = document.getElementById('badgeCount');
    if (reviewCount) {
        let count = 0;
        CHAPTERS.forEach(function (ch) {
            ch.sections.forEach(function (sec) {
                if (state.completedSections[getSectionKey(ch, sec)]) count++;
            });
        });
        reviewCount.textContent = count;
    }
    if (bookmarkCount) bookmarkCount.textContent = state.bookmarks ? state.bookmarks.length : 0;
    if (badgeCount) badgeCount.textContent = state.badges ? state.badges.length : 0;
}

// ==================== 仪表盘过滤器 ====================
function initDashFilters() {
    const timeFilter = document.getElementById('dashTimeFilter');
    if (timeFilter) {
        timeFilter.querySelectorAll('.time-filter-btn').forEach(function (btn) {
            btn.onclick = function () {
                timeFilter.querySelectorAll('.time-filter-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                dashTimeRange = btn.dataset.range;
                updateWeeklyChart();
                updateTrends();
            };
        });
    }
    const refreshBtn = document.getElementById('dashRefreshBtn');
    if (refreshBtn) {
        refreshBtn.onclick = function () {
            refreshBtn.querySelector('i').style.animation = 'spin 0.6s ease';
            setTimeout(function () { refreshBtn.querySelector('i').style.animation = ''; }, 600);
            initDashboard();
            // 刷新反馈
            var liveText = document.querySelector('.live-text');
            if (liveText) { liveText.textContent = '✓'; setTimeout(function () { liveText.textContent = '已同步'; }, 1500); }
        };
    }
}

function initChartTabs() {
    const chartTabs = document.getElementById('chartTabs');
    if (chartTabs) {
        chartTabs.querySelectorAll('.chart-tab').forEach(function (tab) {
            tab.onclick = function () {
                chartTabs.querySelectorAll('.chart-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                chartType = tab.dataset.chart;
                if (weeklyChartInstance) {
                    weeklyChartInstance.destroy();
                    weeklyChartInstance = null;
                }
                updateWeeklyChart();
            };
        });
    }
}

// ==================== 进度环 ====================
function initOverallRing() {
    const canvas = document.getElementById('overallProgressRing');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = Math.min(canvas.width, canvas.height);
    const centerX = size / 2, centerY = size / 2;
    const lineWidth = 8;
    const radius = size / 2 - lineWidth / 2;
    const startAngle = -Math.PI / 2;
    const totalSections = CHAPTERS.reduce(function (sum, ch) { return sum + ch.sections.length; }, 0);
    const completedCount = Object.keys(state.completedSections).length;
    const pct = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;
    if (pct === lastRingPercent) return;
    lastRingPercent = pct;

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#e2e8f0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#818cf8');

    const ringPercentNum = document.getElementById('ringPercentNum');
    const ringPercent = document.getElementById('ringPercent');
    const duration = 1200;
    const startTime = performance.now();
    function animateRing(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const currentPct = Math.round(progress * pct);
        const endAngle = startAngle + (Math.PI * 2 * currentPct) / 100;
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#e2e8f0';
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        if (ringPercentNum) ringPercentNum.textContent = currentPct + '%';
        if (ringPercent) ringPercent.textContent = currentPct + '%';
        if (progress < 1) {
            requestAnimationFrame(animateRing);
        } else {
            if (ringPercentNum) ringPercentNum.textContent = pct + '%';
            if (ringPercent) ringPercent.textContent = pct + '%';
        }
    }
    requestAnimationFrame(animateRing);

    const chapterBars = document.getElementById('chapterBars');
    if (chapterBars) {
        chapterBars.innerHTML = '';
        CHAPTERS.forEach(function (ch) {
            const done = ch.sections.filter(function (s) { return state.completedSections[getSectionKey(ch, s)]; }).length;
            const pctCh = ch.sections.length > 0 ? Math.round((done / ch.sections.length) * 100) : 0;
            const isCompleted = pctCh === 100;
            const row = document.createElement('div');
            row.className = 'chapter-bar-row';
            row.innerHTML = '<span class="bar-label" title="' + ch.title + '">' + ch.title + '</span><div class="bar-track"><div class="bar-fill ' + (isCompleted ? 'completed' : '') + '" style="width:' + pctCh + '%"></div></div><span class="bar-pct ' + (isCompleted ? 'completed' : '') + '">' + pctCh + '%</span>';
            chapterBars.appendChild(row);
        });
    }
}

// ==================== 按需加载 Chart.js ====================
// 仅当进入仪表盘视图并首次绘制趋势图时才加载，避免首屏无谓下载 ~200KB。
let _chartJsPromise = null;
function ensureChartJs() {
    if (typeof Chart !== 'undefined') return Promise.resolve();
    if (_chartJsPromise) return _chartJsPromise;
    _chartJsPromise = loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
    return _chartJsPromise;
}

// ==================== 学习趋势图 ====================
async function updateWeeklyChart() {
    // 确保 Chart.js 已加载（懒加载）；失败时静默降级，不阻塞其他面板
    try {
        await ensureChartJs();
    } catch (e) {
        console.warn('Chart.js 加载失败，趋势图不可用:', e);
        return;
    }
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const labels = [];
    const data = [];
    const studyRecords = JSON.parse(localStorage.getItem('c_study_records') || '{}');

    let daysToShow = 7;
    if (dashTimeRange === 'month') daysToShow = 30;
    if (dashTimeRange === 'all') daysToShow = 90;

    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dayOfWeek = (d.getDay() + 7) % 7;
        const dateKey = getLocalDateKey(d);
        labels.push(dashTimeRange === 'week' || dashTimeRange === 'month' ? '周' + days[dayOfWeek] : dateKey);
        data.push(studyRecords[dateKey] || 0);
    }
    if (weeklyChartInstance) {
        weeklyChartInstance.data.labels = labels;
        weeklyChartInstance.data.datasets[0].data = data;
        weeklyChartInstance.update();
    } else {
        const ctx = canvas.getContext('2d');
        const isDark = document.body.classList.contains('dark');
        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, 'rgba(99,102,241,0.7)');
        gradient.addColorStop(1, 'rgba(99,102,241,0.2)');

        weeklyChartInstance = new Chart(canvas, {
            type: chartType === 'line' ? 'line' : 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '学习小节数',
                    data: data,
                    backgroundColor: gradient,
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: chartType === 'line' ? 4 : 0,
                    pointHoverRadius: 6,
                    tension: 0.3,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
                        titleColor: isDark ? '#e2e8f0' : '#1e293b',
                        bodyColor: isDark ? '#94a3b8' : '#64748b',
                        borderColor: isDark ? 'rgba(129,140,248,0.2)' : 'rgba(226,232,240,0.5)',
                        borderWidth: 1, padding: 8, cornerRadius: 8, displayColors: false,
                        callbacks: { label: function (c) { return c.parsed.y + ' 小节'; } },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, weight: 500 }, padding: 4 },
                        grid: { color: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)', drawBorder: false },
                        border: { display: false },
                    },
                    x: {
                        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10, weight: 500 }, maxRotation: 0, minRotation: 0 },
                        grid: { display: false },
                    },
                },
            },
        });
    }
}

// ==================== 待复习列表 ====================
function initReviewList() {
    const reviewList = document.getElementById('reviewList');
    if (!reviewList) return;
    const intervalDays = state.reviewInterval || 3;
    const now = Date.now();
    const items = [];
    CHAPTERS.forEach(function (ch, chIdx) {
        ch.sections.forEach(function (sec, secIdx) {
            const key = getSectionKey(ch, sec);
            if (state.completedSections[key] && state.completedDates[key]) {
                const completedDate = new Date(state.completedDates[key]);
                const daysSince = Math.floor((now - completedDate.getTime()) / 86400000);
                if (daysSince >= intervalDays) {
                    items.push({
                        chTitle: ch.title, secTitle: ch.sectionTitles[secIdx],
                        key: key, daysSince: daysSince,
                        chIdx: chIdx, secIdx: secIdx
                    });
                }
            }
        });
    });
    if (items.length === 0) {
        reviewList.innerHTML = '<div class="review-empty"><div class="review-empty-icon">🎉</div><div class="review-empty-text">暂无需要复习的内容</div><div class="review-empty-sub">完成章节 ' + intervalDays + ' 天后会在这里提醒</div></div>';
        return;
    }
    items.sort(function (a, b) { return b.daysSince - a.daysSince; });
    var display = items.slice(0, 8);
    reviewList.innerHTML = display.map(function (item) {
        var daysText = item.daysSince + '天前';
        return '<div class="review-item" data-ch-idx="' + item.chIdx + '" data-sec-idx="' + item.secIdx + '"><span>' + item.chTitle + ' · ' + item.secTitle + '</span><span class="review-days">' + daysText + '</span></div>';
    }).join('');
    // 点击跳转到对应小节
    reviewList.querySelectorAll('.review-item').forEach(function (item) {
        item.addEventListener('click', function () {
            state.currentChapterIndex = parseInt(item.dataset.chIdx);
            state.currentSectionIndex = parseInt(item.dataset.secIdx);
            loadSection(state.currentChapterIndex, state.currentSectionIndex);
            switchView('course');
        });
    });
}

// ==================== 仪表盘书签列表 ====================
function initBookmarkList() {
    const container = document.getElementById('bookmarkList');
    if (!container) return;
    const bookmarks = getBookmarksList();
    if (bookmarks.length === 0) {
        container.innerHTML = '<div class="review-empty"><div class="review-empty-icon">🔖</div><div class="review-empty-text">暂无书签</div><div class="review-empty-sub">收藏感兴趣的章节后会在这里显示</div></div>';
        return;
    }
    container.innerHTML = bookmarks.map(function (b, i) {
        return '<div class="bookmark-item" data-ch-idx="' + b.chIdx + '" data-sec-idx="' + b.secIdx + '"><span>' + b.chTitle + ' · ' + b.secTitle + '</span><button class="btn btn-sm btn-link remove-bookmark" data-index="' + i + '" title="移除书签"><i class="fas fa-times"></i></button></div>';
    }).join('');
    container.querySelectorAll('.bookmark-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
            if (e.target.closest('.remove-bookmark')) return;
            state.currentChapterIndex = parseInt(item.dataset.chIdx);
            state.currentSectionIndex = parseInt(item.dataset.secIdx);
            loadSection(state.currentChapterIndex, state.currentSectionIndex);
            switchView('course');
        });
    });
    container.querySelectorAll('.remove-bookmark').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            state.bookmarks.splice(index, 1);
            saveState();
            initBookmarkList();
            showToast('🔖 书签已移除');
        });
    });
}

// ==================== 仪表盘最近徽章 ====================
function initRecentBadges() {
    const container = document.getElementById('dashRecentBadges');
    if (!container) return;
    if (state.badges.length === 0) {
        container.innerHTML = '<div class="review-empty" style="flex-direction:row;gap:8px;padding:16px;"><span class="review-empty-icon" style="font-size:28px;margin-bottom:0;">🏅</span><div style="text-align:left;"><div class="review-empty-text">还没有获得徽章</div><div class="review-empty-sub">完成学习任务即可解锁</div></div></div>';
        return;
    }
    const recent = state.badges.slice(-6).reverse();
    container.innerHTML = recent.map(function (b) {
        const def = BADGE_DEFS.find(function (d) { return d.id === b.id; });
        const rarity = def ? def.rarity : 'common';
        return '<div class="mini-badge unlocked rarity-' + rarity + '" title="' + b.name + '·' + RARITY_LABELS[rarity] + ': ' + b.desc + '">' + b.icon + '</div>';
    }).join('');
}

// ==================== 学习活动热力图 ====================
function findSectionInfo(secKey) {
    for (const ch of CHAPTERS) {
        for (let i = 0; i < ch.sections.length; i++) {
            if (getSectionKey(ch, ch.sections[i]) === secKey) return { chTitle: ch.title, secTitle: ch.sectionTitles[i] };
        }
    }
    return null;
}

function initActivityCalendar() {
    const container = document.getElementById('activityCalendar');
    if (!container) return;

    const studyRecords = JSON.parse(localStorage.getItem('c_study_records') || '{}');
    const activityMap = {};
    const eventMap = {};

    Object.keys(studyRecords).forEach(function (dateKey) {
        activityMap[dateKey] = (activityMap[dateKey] || 0) + studyRecords[dateKey];
    });
    Object.keys(state.completedDates).forEach(function (secKey) {
        const dateStr = state.completedDates[secKey];
        if (dateStr) {
            activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
            const info = findSectionInfo(secKey);
            if (info) {
                if (!eventMap[dateStr]) eventMap[dateStr] = [];
                eventMap[dateStr].push(info);
            }
        }
    });

    function getActivityLevel(count) {
        if (count === 0) return 0;
        if (count === 1) return 1;
        if (count <= 3) return 2;
        if (count <= 6) return 3;
        return 4;
    }

    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    const monthYearEl = document.getElementById('dashCalendarMonthYear');
    if (monthYearEl) monthYearEl.textContent = year + '年' + (month + 1) + '月';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayKey = getLocalDateKey(today);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    let html = '<div class="calendar-week-header">';
    weekDays.forEach(function (d) { html += '<div class="calendar-week-day">' + d + '</div>'; });
    html += '</div><div class="calendar-grid">';

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        html += '<div class="calendar-day other-month" data-date="' + getLocalDateKey(new Date(year, month - 1, day)) + '"><span class="day-num">' + day + '</span></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getLocalDateKey(new Date(year, month, day));
        const count = activityMap[dateKey] || 0;
        const level = getActivityLevel(count);
        const isToday = dateKey === todayKey;
        const hasEvents = eventMap[dateKey] && eventMap[dateKey].length > 0;
        let classes = 'calendar-day level-' + level;
        if (isToday) classes += ' today';
        if (hasEvents) classes += ' has-events';
        html += '<div class="' + classes + '" data-date="' + dateKey + '" data-events=\'' + JSON.stringify(eventMap[dateKey] || []) + '\'><span class="day-num">' + day + '</span>' + (hasEvents ? '<span class="event-dot" title="有学习记录"></span>' : '') + '</div>';
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        html += '<div class="calendar-day other-month" data-date="' + getLocalDateKey(new Date(year, month + 1, day)) + '"><span class="day-num">' + day + '</span></div>';
    }

    html += '</div>';
    container.innerHTML = html;

    container.onclick = function (e) {
        const dayEl = e.target.closest('.calendar-day');
        if (!dayEl) return;
        showDateDetail(dayEl.dataset.date, JSON.parse(dayEl.dataset.events || '[]'));
    };
}

function showDateDetail(dateKey, events) {
    const modalDate = document.getElementById('calendarModalDate');
    const modalContent = document.getElementById('calendarModalContent');
    const modal = document.getElementById('calendarDetailModal');
    if (!modalDate || !modalContent || !modal) return;

    const date = new Date(dateKey);
    modalDate.textContent = date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';

    if (events.length === 0) {
        modalContent.innerHTML = '<div class="detail-empty">该日期暂无学习记录</div>';
    } else {
        modalContent.innerHTML = events.map(function (e) {
            return '<div class="detail-event-item"><span class="detail-event-dot"></span><span class="detail-event-text"><strong>' + e.chTitle + '</strong> · ' + e.secTitle + '</span></div>';
        }).join('');
    }

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// ==================== 学习记录表 ====================
function buildLearningTableData() {
    const data = [];
    CHAPTERS.forEach(function (ch) {
        ch.sections.forEach(function (sec, secIdx) {
            const key = getSectionKey(ch, sec);
            data.push({
                chapter: ch.title, chapterId: ch.id,
                section: ch.sectionTitles[secIdx],
                date: state.completedDates[key] || '',
                studyTime: state.sectionStudyTime[key] || 0,
                status: state.completedSections[key] ? 'completed' : 'not-started',
                key: key,
            });
        });
    });
    return data;
}

function sortTableData(data, column, direction) {
    return data.sort(function (a, b) {
        let aVal = a[column], bVal = b[column];
        if (aVal === '' || aVal === null) aVal = '';
        if (bVal === '' || bVal === null) bVal = '';
        if (column === 'studyTime') {
            aVal = parseInt(aVal) || 0; bVal = parseInt(bVal) || 0;
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (column === 'date') {
            if (!aVal) return direction === 'asc' ? 1 : -1;
            if (!bVal) return direction === 'asc' ? -1 : 1;
            return direction === 'asc' ? new Date(aVal) - new Date(bVal) : new Date(bVal) - new Date(aVal);
        }
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * 生成紧凑分页页码：当前页前后各 2 页，超出部分用省略号折叠
 * 避免小节数多时分页按钮泛滥成行
 */
function buildPageNumbers(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, function (_, i) { return i + 1; });
    }
    const pages = new Set([1, total, current - 2, current - 1, current, current + 1, current + 2].filter(function (p) { return p >= 1 && p <= total; }));
    const sorted = Array.from(pages).sort(function (a, b) { return a - b; });
    const result = [];
    let prev = 0;
    sorted.forEach(function (p) {
        if (prev && p - prev > 1) result.push('…');
        result.push(p);
        prev = p;
    });
    return result;
}

function initLearningTable() {
    const tbody = document.getElementById('learningTableBody');
    const pagination = document.getElementById('tablePagination');
    if (!tbody || !pagination) return;

    let data = buildLearningTableData();

    if (tableSearchQuery) {
        const query = tableSearchQuery.toLowerCase();
        data = data.filter(function (item) { return item.chapter.toLowerCase().includes(query) || item.section.toLowerCase().includes(query); });
    }
    if (tableStatusFilter) {
        data = data.filter(function (item) { return item.status === tableStatusFilter; });
    }
    if (tableSortState.column) {
        data = sortTableData(data, tableSortState.column, tableSortState.direction);
    }

    // 更新表头排序指示器
    document.querySelectorAll('.learning-count-table th.sortable').forEach(function (th) {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === tableSortState.column) {
            th.classList.add(tableSortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / tablePageSize) || 1;
    if (tableCurrentPage > totalPages) tableCurrentPage = totalPages;

    const startIndex = (tableCurrentPage - 1) * tablePageSize;
    const endIndex = Math.min(startIndex + tablePageSize, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map(function (item) {
        return '<tr><td>' + item.chapter + '</td><td>' + item.section + '</td><td>' + (item.date || '-') + '</td><td>' + (item.studyTime > 0 ? formatStudyTime(item.studyTime) : '-') + '</td><td><span class="table-status-badge ' + item.status + '">' + (item.status === 'completed' ? '已完成' : '未开始') + '</span></td></tr>';
    }).join('');

    const start = totalItems > 0 ? startIndex + 1 : 0;
    const pageBtns = buildPageNumbers(tableCurrentPage, totalPages).map(function (page) {
        return page === '…'
            ? '<span class="pagination-ellipsis">…</span>'
            : '<button class="pagination-btn ' + (page === tableCurrentPage ? 'active' : '') + '" data-page="' + page + '">' + page + '</button>';
    }).join('');
    pagination.innerHTML = '<div class="pagination-info">显示 ' + start + '-' + endIndex + ' 条，共 ' + totalItems + ' 条</div><div class="pagination-controls"><button class="pagination-btn" id="prevPage" ' + (tableCurrentPage === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>' + pageBtns + '<button class="pagination-btn" id="nextPage" ' + (tableCurrentPage === totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button></div>';

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) { prevBtn.onclick = function () { if (tableCurrentPage > 1) { tableCurrentPage--; initLearningTable(); } }; }
    if (nextBtn) { nextBtn.onclick = function () { if (tableCurrentPage < totalPages) { tableCurrentPage++; initLearningTable(); } }; }
    pagination.querySelectorAll('[data-page]').forEach(function (btn) {
        btn.onclick = function () { tableCurrentPage = parseInt(btn.dataset.page); initLearningTable(); };
    });
}

// ==================== 徽章视图 ====================
let badgeActiveCategory = 'all';
let badgeActiveRarity = 'all';

// 章节徽章 → 章节ID 映射（用于锁定进度条；含 C 站与语法站章节徽章）
const BADGE_CHAPTER_IDS = {
    initiate: '01', syntax_savant: '02', control_flow: '03', array_architect: '04',
    code_structurer: '05', pointer_master: '06', memory_guardian: '07', data_structurer: '08',
    macro_master: '09', stdlib_explorer: '10', file_handler: '11', bit_weaver: '12',
    algorithm_sage: '13', build_master: '14',
    // 语法站章节徽章
    g_lexicon: '01', g_tense: '02', g_syntax: '03', g_clause: '04', g_nonfinite: '05',
};

function initBadges() {
    const badgeList = document.getElementById('badgeList');
    const unlockedBadgeCount = document.getElementById('unlockedBadgeCount');
    const totalBadgeCount = document.getElementById('totalBadgeCount');
    const badgeProgressBar = document.getElementById('badgeProgressBar');
    const categoryFilters = document.getElementById('badgeCategoryFilters');
    const rarityLegend = document.getElementById('badgeRarityLegend');
    if (!badgeList) return;

    const unlockedIds = new Set(state.badges.map(function (b) { return b.id; }));
    if (totalBadgeCount) totalBadgeCount.textContent = BADGE_DEFS.length;
    if (unlockedBadgeCount) unlockedBadgeCount.textContent = state.badges.length;
    if (badgeProgressBar) badgeProgressBar.style.width = BADGE_DEFS.length > 0 ? Math.round((state.badges.length / BADGE_DEFS.length) * 100) + '%' : '0%';

    if (categoryFilters) {
        const categories = [
            { key: 'all', label: '全部', icon: '🔍' },
            { key: 'progress', label: '进度', icon: '📈' },
            { key: 'chapter', label: '章节', icon: '📖' },
            { key: 'streak', label: '打卡', icon: '🔥' },
            { key: 'level', label: '等级', icon: '⭐' },
            { key: 'quiz', label: '测验', icon: '🧪' },
            { key: 'collection', label: '收藏', icon: '🔖' },
            { key: 'activity', label: '活跃', icon: '🏃' },
            { key: 'explore', label: '探索', icon: '🎨' },
        ];
        categoryFilters.innerHTML = categories.map(function (cat) {
            return '<button class="badge-category-btn ' + (cat.key === badgeActiveCategory ? 'active' : '') + '" data-category="' + cat.key + '" aria-pressed="' + (cat.key === badgeActiveCategory) + '">' + cat.icon + ' ' + cat.label + '</button>';
        }).join('');
        categoryFilters.querySelectorAll('.badge-category-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                categoryFilters.querySelectorAll('.badge-category-btn').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                badgeActiveCategory = btn.dataset.category;
                renderBadgeList(badgeActiveCategory, unlockedIds);
            });
        });
    }

    if (rarityLegend) {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        rarityLegend.innerHTML = rarities.map(function (r) {
            const totalInRarity = BADGE_DEFS.filter(function (d) { return d.rarity === r; }).length;
            const unlockedInRarity = totalInRarity > 0 ? BADGE_DEFS.filter(function (d) { return d.rarity === r && unlockedIds.has(d.id); }).length : 0;
            const active = badgeActiveRarity === r ? ' active' : '';
            return '<div class="rarity-stat rarity-' + r + active + '" data-rarity="' + r + '" tabindex="0" role="button" aria-pressed="' + (badgeActiveRarity === r) + '" title="点击筛选' + RARITY_LABELS[r] + '徽章">' +
                '<span class="rarity-dot"></span>' + RARITY_LABELS[r] + ' <strong>' + unlockedInRarity + '/' + totalInRarity + '</strong></div>';
        }).join('');
        rarityLegend.querySelectorAll('.rarity-stat').forEach(function (el) {
            const toggle = function () {
                badgeActiveRarity = badgeActiveRarity === el.dataset.rarity ? 'all' : el.dataset.rarity;
                initBadges();
            };
            el.addEventListener('click', toggle);
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        });
    }

    renderBadgeList(badgeActiveCategory, unlockedIds);
}

function renderBadgeList(category, unlockedIds) {
    const badgeList = document.getElementById('badgeList');
    if (!badgeList) return;
    let defs = category === 'all' ? BADGE_DEFS.slice() : BADGE_DEFS.filter(function (d) { return d.category === category; });
    if (badgeActiveRarity !== 'all') defs = defs.filter(function (d) { return (d.rarity || 'common') === badgeActiveRarity; });

    // 排序：已解锁在前（按稀有度降序），未解锁在后（按稀有度升序）
    defs.sort(function (a, b) {
        const ua = unlockedIds.has(a.id) ? 1 : 0, ub = unlockedIds.has(b.id) ? 1 : 0;
        if (ua !== ub) return ub - ua;
        const ra = RARITY_ORDER[a.rarity || 'common'] || 0;
        const rb = RARITY_ORDER[b.rarity || 'common'] || 0;
        return ua ? rb - ra : ra - rb;
    });

    // 空状态
    if (defs.length === 0) {
        badgeList.innerHTML = '<div class="badge-list-empty">' +
            '<div class="empty-icon">🏅</div>' +
            '<div class="empty-title">暂无徽章</div>' +
            '<div class="empty-desc">当前筛选条件下没有徽章，去完成学习任务解锁吧！</div>' +
            '<button class="badge-clear-filter" id="badgeClearFilter">查看全部徽章</button>' +
            '</div>';
        const clearBtn = document.getElementById('badgeClearFilter');
        if (clearBtn) clearBtn.addEventListener('click', function () {
            badgeActiveCategory = 'all';
            badgeActiveRarity = 'all';
            initBadges();
        });
        return;
    }

    badgeList.innerHTML = defs.map(function (def) {
        const unlocked = unlockedIds.has(def.id);
        const badgeData = state.badges.find(function (b) { return b.id === def.id; });
        const rarityClass = def.rarity || 'common';
        const unlockedClass = unlocked ? 'unlocked' : 'locked';
        const highlight = unlocked && (typeof justUnlockedBadges !== 'undefined') && justUnlockedBadges.includes(def.id) ? ' just-unlocked' : '';
        // 锁定徽章进度条（可量化条件）
        let progressHTML = '';
        if (!unlocked) {
            const p = getBadgeProgress(def);
            if (p) {
                const pct = p.target > 0 ? Math.min(100, Math.round((p.current / p.target) * 100)) : 0;
                progressHTML = '<div class="badge-progress">' +
                    '<div class="badge-progress-track"><div class="badge-progress-fill rarity-' + rarityClass + '" style="width:' + pct + '%"></div></div>' +
                    '<span class="badge-progress-text">' + p.current + ' / ' + p.target + '</span>' +
                    '</div>';
            }
        }
        return '<div class="badge-card ' + unlockedClass + ' rarity-' + rarityClass + highlight + '" data-category="' + def.category + '" data-rarity="' + rarityClass + '" data-badge-id="' + def.id + '" tabindex="0" role="button" aria-pressed="false" title="点击查看详情">' +
            '<div class="badge-rarity-tick ' + rarityClass + '">' + RARITY_LABELS[rarityClass] + '</div>' +
            '<span class="badge-icon ' + rarityClass + ' ' + unlockedClass + '">' + def.icon + '</span>' +
            '<div class="badge-name">' + def.name + '</div>' +
            '<div class="badge-desc">' + def.desc + '</div>' +
            (unlocked && badgeData ? '<div class="badge-date">' + new Date(badgeData.date).toLocaleDateString('zh-CN') + '</div>' : '<div class="badge-date">🔒 未解锁</div>') +
            progressHTML +
            '</div>';
    }).join('');

    // 点击 / 回车查看详情
    badgeList.querySelectorAll('.badge-card').forEach(function (card) {
        const badgeId = card.dataset.badgeId;
        const open = function () { showBadgeDetail(badgeId); };
        card.addEventListener('click', open);
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });
}

/**
 * 计算可量化徽章的解锁进度 {current, target}，不可量化返回 null
 */
function getBadgeProgress(def) {
    const s = state;
    const sectionsDone = Object.keys(s.completedSections || {}).length;
    // 进度里程碑徽章（含按站点定制的阈值 target）直接用 def.target
    if (typeof def.target === 'number') {
        return { current: sectionsDone, target: def.target };
    }
    const chapterId = BADGE_CHAPTER_IDS[def.id];
    if (chapterId) {
        const ch = CHAPTERS.find(function (c) { return c.id === chapterId; });
        if (ch) {
            const done = ch.sections.filter(function (sec) { return s.completedSections[getSectionKey(ch, sec)]; }).length;
            return { current: done, target: ch.sections.length };
        }
        return null;
    }
    switch (def.id) {
        case 'first_step': return { current: sectionsDone, target: 1 };
        case 'five_done': return { current: sectionsDone, target: 5 };
        case 'ten_done': return { current: sectionsDone, target: 10 };
        case 'twenty_done': return { current: sectionsDone, target: 20 };
        case 'thirty_done': return { current: sectionsDone, target: 30 };
        case 'forty_done': return { current: sectionsDone, target: 40 };
        case 'fifty_done': return { current: sectionsDone, target: 50 };
        case 'all_rounder': {
            const total = CHAPTERS.reduce(function (sum, ch) { return sum + ch.sections.length; }, 0);
            return { current: sectionsDone, target: Math.ceil(total * 0.8) };
        }
        case 'first_half': {
            const total = CHAPTERS.reduce(function (sum, ch) { return sum + ch.sections.length; }, 0);
            return { current: sectionsDone, target: Math.ceil(total * 0.5) };
        }
        case 'streak_3': return { current: s.streak, target: 3 };
        case 'streak_7': return { current: s.streak, target: 7 };
        case 'streak_14': return { current: s.streak, target: 14 };
        case 'streak_30': return { current: s.streak, target: 30 };
        case 'streak_50': return { current: s.streak, target: 50 };
        case 'streak_100': return { current: s.streak, target: 100 };
        case 'level_5': return { current: s.level, target: 5 };
        case 'level_10': return { current: s.level, target: 10 };
        case 'level_15': return { current: s.level, target: 15 };
        case 'level_20': return { current: s.level, target: 20 };
        case 'level_30': return { current: s.level, target: 30 };
        case 'quiz_beginner': return { current: (s.quizStats && s.quizStats.attempts) || 0, target: 1 };
        case 'quiz_veteran': return { current: (s.quizStats && s.quizStats.attempts) || 0, target: 20 };
        case 'combo_king': return { current: (s.quizStats && s.quizStats.bestStreak) || 0, target: 10 };
        case 'quiz_whiz': return { current: (s.quizStats && s.quizStats.bestStreak) || 0, target: 30 };
        case 'quiz_ab': return { current: (s.quizStats && s.quizStats.aCount) || 0, target: 10 };
        case 'bookmark_collector': return { current: (s.bookmarks || []).length, target: 5 };
        case 'bookmark_master': return { current: (s.bookmarks || []).length, target: 20 };
        case 'note_taker': return { current: Object.values(s.notes || {}).filter(function (n) { return n && n.trim(); }).length, target: 10 };
        case 'note_master': return { current: Object.values(s.notes || {}).filter(function (n) { return n && n.trim(); }).length, target: 30 };
        case 'marathon': return { current: s.totalStudyTime || 0, target: 600 };
        case 'centurion': return { current: s.totalStudyTime || 0, target: 1440 };
        case 'full_moon': return { current: s.totalDays || 0, target: 30 };
        case 'first_week': return { current: s.totalDays || 0, target: 7 };
        case 'daily_champion': return { current: s.dailyGoalCompleteDays !== undefined ? s.dailyGoalCompleteDays : 0, target: 7 };
        default: return null;
    }
}

/**
 * 展示徽章详情弹窗
 */
function showBadgeDetail(badgeId) {
    const def = BADGE_DEFS.find(function (d) { return d.id === badgeId; });
    if (!def) return;
    const modal = document.getElementById('badgeDetailModal');
    if (!modal) return;
    const unlocked = state.badges.some(function (b) { return b.id === badgeId; });
    const badgeData = state.badges.find(function (b) { return b.id === badgeId; });
    const rarityClass = def.rarity || 'common';

    const iconEl = document.getElementById('detailBadgeIcon');
    if (iconEl) {
        iconEl.textContent = def.icon;
        iconEl.className = 'badge-icon rarity-' + rarityClass + ' ' + (unlocked ? 'unlocked' : 'locked');
    }
    document.getElementById('detailBadgeName').textContent = def.name;
    document.getElementById('detailBadgeDesc').textContent = def.desc;
    const rarityEl = document.getElementById('detailBadgeRarity');
    if (rarityEl) {
        rarityEl.textContent = RARITY_LABELS[rarityClass] || rarityClass;
        rarityEl.style.color = (RARITY_COLORS && RARITY_COLORS[rarityClass]) || '';
    }
    const catEl = document.getElementById('detailBadgeCategory');
    if (catEl) catEl.textContent = BADGE_CATEGORY_LABELS[def.category] || def.category;

    const dateRow = document.getElementById('detailBadgeDateRow');
    const dateEl = document.getElementById('detailBadgeDate');
    if (dateRow && dateEl) {
        if (unlocked && badgeData) {
            dateEl.textContent = new Date(badgeData.date).toLocaleString('zh-CN');
            dateRow.style.display = 'flex';
        } else {
            dateEl.textContent = '尚未解锁';
            dateRow.style.display = 'flex';
        }
    }
    const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
    bsModal.show();
}

// --- js/views/extension.js ---
/* ==================== 拓展知识视图 ==================== */
/* 负责：在拓展知识视图中渲染顶部选项卡、加载对应 Word 文档 HTML */
/* 依赖：main.js（CURRENT_SITE_KEY 全局来自 data/chapters.js）*/

let extensionItems = [];
let currentExtensionId = null;

// 判断当前站点是否启用拓展知识（目前仅英语语法站点挂载 6 个 Word）
function extensionEnabledForSite() {
    const key = (typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c';
    return key === 'grammar';
}

// 拉取某站点可用的拓展知识列表
async function fetchExtensions() {
    if (!extensionEnabledForSite()) return [];
    try {
        const res = await fetch('/api/extension');
        if (!res.ok) throw new Error('加载失败');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('[拓展知识] 列表加载失败', e);
        return [];
    }
}

// 渲染顶部选项卡
function renderTabs(items) {
    const tabs = document.getElementById('extensionTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    items.forEach(function (item, idx) {
        const btn = document.createElement('button');
        btn.className = 'extension-tab' + (idx === 0 ? ' active' : '');
        btn.textContent = item.title;
        btn.dataset.id = item.id;
        btn.addEventListener('click', function () {
            // 激活样式切换
            tabs.querySelectorAll('.extension-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentExtensionId = item.id;
            loadExtensionContent(item.id);
        });
        tabs.appendChild(btn);
    });
}

// 加载单个拓展知识正文
async function loadExtensionContent(id) {
    const body = document.getElementById('extensionBody');
    if (!body) return;
    body.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">加载中...</p></div>';
    try {
        const res = await fetch('/api/extension/' + encodeURIComponent(id));
        if (!res.ok) throw new Error('内容加载失败');
        const data = await res.json();
        body.innerHTML = sanitizeHtml(data.html || '<p>暂无内容</p>');
        setExtensionEmptyVisible(false);
    } catch (e) {
        body.innerHTML = '<p class="text-danger">内容加载失败，请检查网络连接。</p>';
    }
}

function updateExtensionCount(count) {
    const el = document.getElementById('extensionCount');
    if (!el) return;
    if (!count || count <= 0) {
        el.textContent = '';
        el.style.display = 'none';
        return;
    }
    el.textContent = count + ' 篇资料';
    el.style.display = 'inline-flex';
}

function setExtensionEmptyVisible(visible) {
    const empty = document.getElementById('extensionEmpty');
    const tabs = document.getElementById('extensionTabs');
    const body = document.getElementById('extensionBody');
    if (empty) empty.style.display = visible ? 'block' : 'none';
    if (tabs) tabs.style.display = visible ? 'none' : '';
    if (body) body.style.display = visible ? 'none' : '';
}

// 初始化拓展知识视图（每次进入时调用）
async function initExtension() {
    const tabs = document.getElementById('extensionTabs');
    if (!tabs) return;
    if (!extensionEnabledForSite()) {
        tabs.innerHTML = '';
        currentExtensionId = null;
        updateExtensionCount(0);
        setExtensionEmptyVisible(true);
        const body = document.getElementById('extensionBody');
        if (body) body.innerHTML = '';
        return;
    }
    // 若尚未拉取过列表，则拉取
    if (extensionItems.length === 0) {
        extensionItems = await fetchExtensions();
    }
    if (extensionItems.length === 0) {
        tabs.innerHTML = '';
        updateExtensionCount(0);
        setExtensionEmptyVisible(true);
        return;
    }
    updateExtensionCount(extensionItems.length);
    setExtensionEmptyVisible(false);
    renderTabs(extensionItems);
    // 默认展示第一个（若无已选中项）
    if (!currentExtensionId || !extensionItems.some(function (i) { return i.id === currentExtensionId; })) {
        currentExtensionId = extensionItems[0].id;
    }
    // 设置对应 tab 为 active
    tabs.querySelectorAll('.extension-tab').forEach(function (b) {
        b.classList.toggle('active', b.dataset.id === currentExtensionId);
    });
    loadExtensionContent(currentExtensionId);
}

// --- js/views/roadmap.js ---
/* ==================== 核心应用逻辑 ==================== */
/* 负责：视图切换、课程树、内容加载、标记完成、设置、事件绑定、应用初始化 */
/* 依赖：main.js（state, $, $$, getSectionKey, getLocalDateKey, saveState 等）*/
/*       data/chapters.js（CHAPTERS, QUIZZES, BADGE_DEFS, QUOTES 等）*/
/*       utils/helpers.js（sanitizeHtml, formatStudyTime, getExpForLevel）*/
/*       core/toast.js（showToast）*/
/*       各 features/*.js 和 views/*.js 模块 */
// ==================== 模块级标志 ====================
let chapterTreeDirty = true;

// ==================== 经验值与等级 ====================
/**
 * 经验飞字（全局，供所有经验来源使用）
 */
function showExpGain(amount, anchor) {
    if (!amount || amount <= 0) return;
    const el = document.createElement('div');
    el.className = 'xp-fly';
    el.textContent = '+' + amount + ' EXP';
    if (anchor && anchor.getBoundingClientRect) {
        const rect = anchor.getBoundingClientRect();
        el.style.left = (rect.left + rect.width / 2 - 30) + 'px';
        el.style.top = (rect.top + 8) + 'px';
    } else {
        el.style.left = '50%';
        el.style.top = '30%';
        el.style.transform = 'translateX(-50%)';
    }
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1600);
}

/**
 * 增加经验并处理升级
 * 升级时：等级+1、经验回滚当前级溢出、触发徽章检查与升级动画
 */
function addExp(amount) {
    if (!amount || amount <= 0) return;
    state.exp += amount;
    state.totalExp = (state.totalExp || 0) + amount;
    let leveledUp = false;
    while (state.exp >= getExpForLevel(state.level)) {
        state.exp -= getExpForLevel(state.level);
        state.level++;
        leveledUp = true;
    }
    if (leveledUp) {
        showToast('🎉 升级了！达到 LV' + state.level);
        checkBadges();
        triggerLevelUpFx();
    }
    updateExpUI();
    saveStateDebounced();
}

/**
 * 升级视觉反馈：顶栏徽章脉冲
 */
function triggerLevelUpFx() {
    const lvBadge = document.getElementById('lvBadge');
    if (!lvBadge) return;
    lvBadge.classList.remove('level-up-pulse');
    void lvBadge.offsetWidth;
    lvBadge.classList.add('level-up-pulse');
    setTimeout(function () { lvBadge.classList.remove('level-up-pulse'); }, 1000);
}

function updateExpUI() {
    const lvBadge = document.getElementById('lvBadge');
    const expFillMini = document.getElementById('expFillMini');
    const expPoints = document.getElementById('expPoints');
    if (lvBadge) lvBadge.textContent = 'LV' + state.level;
    if (expFillMini) {
        const pct = Math.min(100, (state.exp / getExpForLevel(state.level)) * 100);
        expFillMini.style.width = pct + '%';
    }
    if (expPoints) expPoints.textContent = state.exp + ' / ' + getExpForLevel(state.level);
    const homeLevel = document.getElementById('homeLevel');
    const homeExp = document.getElementById('homeExp');
    if (homeLevel) homeLevel.textContent = 'LV' + state.level;
    if (homeExp) homeExp.textContent = state.exp + ' / ' + getExpForLevel(state.level) + ' EXP';
    const dashLevel = document.getElementById('dashLevel');
    const dashExp = document.getElementById('dashExp');
    if (dashLevel) dashLevel.textContent = 'LV' + state.level;
    if (dashExp) dashExp.textContent = state.exp + ' / ' + getExpForLevel(state.level);
}

// ==================== 视图切换 ====================
function switchView(viewName) {
    if (state.currentView === 'course' && viewName !== 'course') {
        stopStudyTimer();
    }
    state.currentView = viewName;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('view-active'); });
    const viewEl = document.getElementById(viewName + 'View');
    if (viewEl) viewEl.classList.add('view-active');
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    const navItem = document.querySelector('.nav-item[data-view="' + viewName + '"]');
    if (navItem) navItem.classList.add('active');

    if (viewName === 'dashboard') {
        lastRingPercent = -1;
        initDashboard();
    }
    if (viewName === 'roadmap') {
        stopStudyTimer();
        // 游戏模式：侧栏自动折叠为图标，顶栏保持可见，地图撑满内容区
        document.body.classList.add('game-mode');
        const roadmapView = document.getElementById('roadmapView');
        if (roadmapView) roadmapView.classList.add('active-game-layout');
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
        if (window.QuizGameMain && window.QuizGameMain.enter) {
            window.QuizGameMain.enter();
        } else {
            const container = document.getElementById('mapContainer');
            if (container) container.innerHTML = '<div class="text-center py-5 text-muted">实战闯关加载中，请刷新页面...</div>';
            console.warn('QuizGameMain 未加载，请检查 quizgame-*.js 是否正常执行。');
        }
    } else {
        document.body.classList.remove('game-mode');
        const roadmapView = document.getElementById('roadmapView');
        if (roadmapView) roadmapView.classList.remove('active-game-layout');
        // 恢复侧栏展开状态（除非用户手动折叠了）
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.remove('collapsed');
        if (window.QuizGameMain && window.QuizGameMain.exit) window.QuizGameMain.exit();
    }
    if (viewName === 'badges') initBadges();
    if (viewName === 'settings') initSettings();
    if (viewName === 'extension') initExtension();
    if (viewName === 'tasks' && window.TasksApp) window.TasksApp.refresh();
    if (viewName === 'home') updateHomeNew();
    if (viewName === 'course') {
        document.getElementById('coursePanel').classList.remove('hidden');
        document.getElementById('navPanel').classList.add('hidden');
        initCourseSearch();
        if (state.currentChapterIndex === null && CHAPTERS.length > 0) {
            loadSection(0, 0);
        }
    } else {
        document.getElementById('coursePanel').classList.add('hidden');
        document.getElementById('navPanel').classList.remove('hidden');
    }
    document.getElementById('mainContent').scrollTop = 0;
}

// ==================== 课程树构建 ====================
// 小节行 HTML（章节树 & 大纲共用）：序号 + 标题 + 完成打勾
function sectionRowHtml(ch, idx, title, completed) {
    const check = completed ? '<span class="section-check">✓</span>' : '';
    return '<span class="section-label"><span class="section-num">' + chapterNo(ch) + '.' + (idx + 1) + '</span> ' + title + '</span>' + check;
}

function buildChapterTree() {
    const tree = document.getElementById('chapterTree');
    if (!tree) return;
    tree.innerHTML = '';
    CHAPTERS.forEach(function (ch, chIdx) {
        const chCompleted = ch.sections.every(function (sec) { return state.completedSections[getSectionKey(ch, sec)]; });
        const chDiv = document.createElement('div');
        chDiv.className = 'chapter-tree-item' + (chCompleted ? ' completed' : '');
        if (state.currentChapterIndex === chIdx) chDiv.classList.add('active');
        chDiv.innerHTML = '<span class="chapter-icon">' + ch.icon + '</span> 第' + chapterNo(ch) + '章 ' + ch.title;
        chDiv.addEventListener('click', function () {
            state.currentChapterIndex = chIdx;
            state.currentSectionIndex = 0;
            loadSection(chIdx, 0);
            switchView('course');
        });
        tree.appendChild(chDiv);
        const subDiv = document.createElement('div');
        subDiv.className = 'sub-sections';
        ch.sections.forEach(function (sec, secIdx) {
            const secKey = getSectionKey(ch, sec);
            const secCompleted = state.completedSections[secKey];
            const secItem = document.createElement('div');
            secItem.className = 'sub-section-item' + (secCompleted ? ' completed' : '');
            const secTitle = (ch.sectionTitles[secIdx] || sec.replace(/_/g, ' ').replace(/^\d+_/, ''));
            secItem.innerHTML = sectionRowHtml(ch, secIdx, secTitle, secCompleted);
            secItem.addEventListener('click', function (e) {
                e.stopPropagation();
                state.currentChapterIndex = chIdx;
                state.currentSectionIndex = secIdx;
                loadSection(chIdx, secIdx);
                switchView('course');
            });
            subDiv.appendChild(secItem);
        });
        tree.appendChild(subDiv);
    });
}

// ==================== 按需加载 Prism（代码高亮） ====================
// 首次遇到代码块时才加载，避免首屏无谓下载 ~180KB CDN 资源。
let _prismPromise = null;
function ensurePrism() {
    if (typeof Prism !== 'undefined') return Promise.resolve();
    if (_prismPromise) return _prismPromise;
    _prismPromise = (async function () {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js');
    })();
    return _prismPromise;
}

// ==================== 加载章节内容 ====================
async function loadSection(chIdx, secIdx) {
    state.currentChapterIndex = chIdx;
    state.currentSectionIndex = secIdx;
    const hour = new Date().getHours();
    if (!state.studiedEarly && hour >= 5 && hour < 7) state.studiedEarly = true;
    if (!state.studiedAtNight && (hour >= 22 || hour < 5)) state.studiedAtNight = true;
    if (state.studiedEarly || state.studiedAtNight) checkBadges();
    const ch = CHAPTERS[chIdx];
    const sec = ch.sections[secIdx];
    const secKey = getSectionKey(ch, sec);
    state.currentSectionKey = secKey;
    const contentBody = document.getElementById('contentBody');
    const mainTitle = document.getElementById('mainTitle');
    const progressBtn = document.getElementById('progressBtn');
    const navCounter = document.getElementById('navCounter');

    if (mainTitle) mainTitle.textContent = '第' + chapterNo(ch) + '章 ' + ch.title + ' · ' + ch.sectionTitles[secIdx];
    if (navCounter) navCounter.textContent = (secIdx + 1) + ' / ' + ch.sections.length;
    if (progressBtn) {
        if (state.completedSections[secKey]) {
            progressBtn.classList.add('marked');
            progressBtn.innerHTML = '<i class="fas fa-check-circle"></i> 已学完';
        } else {
            progressBtn.classList.remove('marked');
            progressBtn.innerHTML = '<i class="far fa-circle"></i> 标记已学';
        }
        progressBtn.disabled = false;
    }
    if (contentBody) {
        contentBody.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">加载中...</p></div>';
    }
    try {
        const folder = ch.folder;
        const res = await fetch('/api/content/' + encodeURIComponent(folder) + '/' + encodeURIComponent(sec));
        if (!res.ok) throw new Error('内容加载失败');
        const data = await res.json();
        if (contentBody) {
            contentBody.innerHTML = sanitizeHtml(data.html || data.content || '<p>暂无内容</p>');
            // 内容含代码块时才按需加载 Prism（避免首屏无谓下载）
            if (contentBody.querySelector('pre code')) {
                try {
                    await ensurePrism();
                } catch (e) { /* Prism 加载失败不影响内容展示 */ }
            }
            if (typeof Prism !== 'undefined') {
                contentBody.querySelectorAll('pre code').forEach(function (block) {
                    Prism.highlightElement(block);
                });
            }
        }
    } catch (err) {
        if (contentBody) contentBody.innerHTML = '<p class="text-danger">内容加载失败，请检查网络连接。</p>';
    }
    const noteEditor = document.getElementById('noteEditor');
    if (noteEditor) noteEditor.value = state.notes[secKey] || '';
    updateBottomNav(chIdx, secIdx);
    buildOutline(chIdx, secIdx);
    chapterTreeDirty = true;
    recordStudy();
    startStudyTimer();
    updateAllUI();
    saveStateDebounced();
}

function updateBottomNav(chIdx, secIdx) {
    const ch = CHAPTERS[chIdx];
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const navCounter = document.getElementById('navCounter');
    if (navCounter) navCounter.textContent = (secIdx + 1) + ' / ' + ch.sections.length;
    if (prevBtn) {
        prevBtn.disabled = false;
        prevBtn.style.visibility = 'visible';
        if (secIdx > 0) {
            prevBtn.onclick = function () { loadSection(chIdx, secIdx - 1); };
        } else if (chIdx > 0) {
            const prevCh = CHAPTERS[chIdx - 1];
            prevBtn.onclick = function () { loadSection(chIdx - 1, prevCh.sections.length - 1); };
        } else {
            prevBtn.style.visibility = 'hidden';
        }
    }
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.style.visibility = 'visible';
        if (secIdx < ch.sections.length - 1) {
            nextBtn.onclick = function () { loadSection(chIdx, secIdx + 1); };
        } else if (chIdx < CHAPTERS.length - 1) {
            nextBtn.onclick = function () { loadSection(chIdx + 1, 0); };
        } else {
            nextBtn.style.visibility = 'hidden';
        }
    }
}

function buildOutline(chIdx, secIdx) {
    const outlineBody = document.getElementById('outlineBody');
    if (!outlineBody) return;
    const ch = CHAPTERS[chIdx];
    let html = '<strong>本章目录</strong><br>';
    ch.sections.forEach(function (sec, i) {
        const secKey = getSectionKey(ch, sec);
        const completed = Boolean(state.completedSections[secKey]);
        const active = i === secIdx ? 'style="color:var(--accent);font-weight:600;"' : '';
        html += '<a href="#" ' + active + ' data-sec-idx="' + i + '">' + sectionRowHtml(ch, i, ch.sectionTitles[i], completed) + '</a>';
    });
    outlineBody.innerHTML = html;
    outlineBody.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            loadSection(chIdx, parseInt(a.dataset.secIdx));
        });
    });
}

// ==================== 标记完成 ====================
function markCompleted() {
    if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
    const ch = CHAPTERS[state.currentChapterIndex];
    const sec = ch.sections[state.currentSectionIndex];
    const secKey = getSectionKey(ch, sec);
    if (!state.completedSections[secKey]) {
        state.completedSections[secKey] = true;
        state.completedDates[secKey] = getLocalDateKey(new Date());
        addExp(25);
        showExpGain(25, document.querySelector('.course-panel') || null);
        showToast('✅ 已标记完成！+25经验');
        checkBadges();
        const todayKey = getLocalDateKey(new Date());
        const todayCount = Object.values(state.completedDates || {}).filter(d => d === todayKey).length;
        if (todayCount >= (state.dailyGoal || 1) && state.dailyGoalMetDate !== todayKey) {
            state.dailyGoalCompleteDays++;
            state.dailyGoalMetDate = todayKey;
        }
    } else {
        state.completedSections[secKey] = false;
        delete state.completedDates[secKey];
        showToast('已取消标记');
    }
    loadSection(state.currentChapterIndex, state.currentSectionIndex);
    chapterTreeDirty = true;
    updateAllUI();
    saveStateDebounced();
}

// ==================== 更新所有UI ====================
function updateAllUI() {
    updateExpUI();
    updateHomeStats();
    updateHomeNew();
    updateProgressBar();
    if (chapterTreeDirty) {
        buildChapterTree();
        chapterTreeDirty = false;
    }
    updateBookmarkButton();
    dashboardDirty = true;
    if (state.currentView === 'dashboard' && dashboardDirty) {
        updateDashboardStats();
        initDashboard();
        dashboardDirty = false;
    }
}

function updateHomeStats() {
    const homeStreak = document.getElementById('homeStreak');
    const homeCompleted = document.getElementById('homeCompleted');
    const homeReview = document.getElementById('homeReview');
    const homeStudyTime = document.getElementById('homeStudyTime');
    if (homeStreak) homeStreak.textContent = state.streak + '天';
    if (homeCompleted) homeCompleted.textContent = Object.keys(state.completedSections).length;
    const completedKeys = Object.keys(state.completedSections);
    const reviewCount = completedKeys.length > 0 ? Math.max(0, Math.floor(completedKeys.length * 0.15)) : 0;
    if (homeReview) homeReview.textContent = reviewCount;
    if (homeStudyTime) homeStudyTime.textContent = formatStudyTime(state.totalStudyTime);
}

function updateProgressBar() {
    const totalSections = CHAPTERS.reduce(function (sum, ch) { return sum + ch.sections.length; }, 0);
    const completedCount = Object.keys(state.completedSections).length;
    const pct = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressBar');
    if (progressPercent) progressPercent.textContent = pct + '%';
    if (progressBar) progressBar.style.width = pct + '%';
    const roadmapCompleted = document.getElementById('roadmapCompleted');
    const roadmapTotal = document.getElementById('roadmapTotal');
    const roadmapProgressBar = document.getElementById('roadmapProgressBar');
    const roadmapPercent = document.getElementById('roadmapPercent');
    if (roadmapCompleted) roadmapCompleted.textContent = completedCount;
    if (roadmapTotal) roadmapTotal.textContent = totalSections;
    if (roadmapProgressBar) roadmapProgressBar.style.width = pct + '%';
    if (roadmapPercent) roadmapPercent.textContent = pct + '%';
}

// ==================== 实战闯关退出（委托给 quizgame-main.js） ====================
function closeQuizModal() {
    if (window.QuizGameMain && window.QuizGameMain.exit) window.QuizGameMain.exit();
}

// ==================== 深色模式 ====================
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function (e) {
            e.preventDefault();
            state.darkMode = !state.darkMode;
            applyDarkMode();
            saveStateDebounced();
        });
    }
    applyDarkMode();
}

function applyDarkMode() {
    if (state.darkMode) {
        document.body.classList.add('dark');
        const icon = document.querySelector('#darkModeToggle i');
        if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    } else {
        document.body.classList.remove('dark');
        const icon = document.querySelector('#darkModeToggle i');
        if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    }
    const darkModeSetting = document.getElementById('darkModeSetting');
    if (darkModeSetting) darkModeSetting.checked = state.darkMode;
}

// ==================== 聚焦模式 ====================
function applyFocusMode() {
    if (state.focusMode) {
        document.body.classList.add('focus-mode');
        const aiToggle = document.getElementById('aiQaToggle');
        const aiDropdown = document.getElementById('aiDropdown');
        if (aiToggle && aiDropdown) { aiToggle.classList.remove('open'); aiDropdown.classList.remove('show'); }
    } else {
        document.body.classList.remove('focus-mode');
    }
    const focusModeSetting = document.getElementById('focusModeSetting');
    if (focusModeSetting) focusModeSetting.checked = state.focusMode;
}

// ==================== 字体大小 ====================
function applyFontSize() {
    const richContent = document.getElementById('contentBody');
    const fontSizeSetting = document.getElementById('fontSizeSetting');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (richContent) richContent.style.fontSize = state.fontSize + 'px';
    if (fontSizeSetting) fontSizeSetting.value = state.fontSize;
    if (fontSizeValue) fontSizeValue.textContent = state.fontSize;
}

function initFontSize() {
    applyFontSize();
    document.getElementById('fontSizeUp')?.addEventListener('click', function () {
        state.fontSize = Math.min(24, state.fontSize + 1);
        applyFontSize();
        saveStateDebounced();
    });
    document.getElementById('fontSizeDown')?.addEventListener('click', function () {
        state.fontSize = Math.max(12, state.fontSize - 1);
        applyFontSize();
        saveStateDebounced();
    });
    document.getElementById('fontSizeSetting')?.addEventListener('input', function () {
        state.fontSize = parseInt(this.value);
        applyFontSize();
        saveStateDebounced();
    });
}

// ==================== 设置视图 ====================
function initSettings() {
    // 设置导航切换
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            const target = item.dataset.section;
            navItems.forEach(function (n) {
                n.classList.remove('active');
                n.setAttribute('aria-selected', 'false');
            });
            sections.forEach(function (s) { s.classList.remove('active'); });
            item.classList.add('active');
            item.setAttribute('aria-selected', 'true');
            document.getElementById('section-' + target)?.classList.add('active');
        });
    });

    const darkModeSetting = document.getElementById('darkModeSetting');
    if (darkModeSetting) {
        darkModeSetting.checked = state.darkMode;
        darkModeSetting.setAttribute('aria-checked', state.darkMode);
        darkModeSetting.onchange = function () {
            state.darkMode = darkModeSetting.checked;
            darkModeSetting.setAttribute('aria-checked', state.darkMode);
            applyDarkMode();
            saveStateDebounced();
        };
    }

    const themeColorOptions = document.querySelectorAll('.theme-color-option');
    themeColorOptions.forEach(function (opt) {
        opt.classList.toggle('active', opt.dataset.color === state.themeColor);
        opt.onclick = function () {
            state.themeColor = opt.dataset.color;
            applyThemeColor(state.themeColor);
            themeColorOptions.forEach(function (o) { o.classList.toggle('active', o === opt); });
            saveStateDebounced();
        };
    });
    const themeColorCustom = document.getElementById('themeColorCustom');
    if (themeColorCustom) {
        themeColorCustom.oninput = function () {
            state.themeColor = themeColorCustom.value;
            applyThemeColor(state.themeColor);
            themeColorOptions.forEach(function (o) { o.classList.remove('active'); });
            saveStateDebounced();
        };
    }

    const fontSizeSetting = document.getElementById('fontSizeSetting');
    if (fontSizeSetting) {
        fontSizeSetting.value = state.fontSize;
        applyFontSize();
        fontSizeSetting.oninput = function () { state.fontSize = parseInt(fontSizeSetting.value); applyFontSize(); saveStateDebounced(); };
    }

    const focusModeSetting = document.getElementById('focusModeSetting');
    if (focusModeSetting) { focusModeSetting.checked = state.focusMode; focusModeSetting.onchange = function () { state.focusMode = focusModeSetting.checked; applyFocusMode(); saveStateDebounced(); }; }

    const sidebarAutoCollapseSetting = document.getElementById('sidebarAutoCollapseSetting');
    if (sidebarAutoCollapseSetting) { sidebarAutoCollapseSetting.checked = state.sidebarAutoCollapse; sidebarAutoCollapseSetting.onchange = function () { state.sidebarAutoCollapse = sidebarAutoCollapseSetting.checked; saveStateDebounced(); }; }

    // 渐变背景选择器
    const gradientOptions = document.querySelectorAll('.gradient-option');
    gradientOptions.forEach(function (opt) {
        opt.classList.toggle('active', (opt.dataset.gradient || 'none') === (state.gradientBg || 'none'));
        opt.addEventListener('click', function () {
            const grad = opt.dataset.gradient || 'none';
            state.gradientBg = grad;
            applyGradientBg(grad);
            gradientOptions.forEach(function (o) { o.classList.toggle('active', o === opt); });
            document.querySelectorAll('.video-card').forEach(function (c) {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            });
            state.videoBg = '';
            const gradientTab = document.querySelector('.bg-mode-tab[data-bg-mode="gradient"]');
            if (gradientTab) gradientTab.click();
            saveStateDebounced();
        });
    });

    const dailyGoalSetting = document.getElementById('dailyGoalSetting');
    if (dailyGoalSetting) { dailyGoalSetting.value = state.dailyGoal; dailyGoalSetting.onchange = function () { state.dailyGoal = parseInt(dailyGoalSetting.value) || 1; saveStateDebounced(); }; }

    const autoMarkSetting = document.getElementById('autoMarkSetting');
    if (autoMarkSetting) { autoMarkSetting.checked = state.autoMarkCompleted; autoMarkSetting.onchange = function () { state.autoMarkCompleted = autoMarkSetting.checked; saveStateDebounced(); checkBadges(); }; }

    const studyReminderSetting = document.getElementById('studyReminderSetting');
    if (studyReminderSetting) { studyReminderSetting.checked = state.studyReminder; studyReminderSetting.onchange = function () { state.studyReminder = studyReminderSetting.checked; saveStateDebounced(); checkBadges(); }; }
    const reminderTimeSetting = document.getElementById('reminderTimeSetting');
    if (reminderTimeSetting) { reminderTimeSetting.value = state.reminderTime; reminderTimeSetting.onchange = function () { state.reminderTime = reminderTimeSetting.value; saveStateDebounced(); }; }

    const reviewIntervalSetting = document.getElementById('reviewIntervalSetting');
    if (reviewIntervalSetting) { reviewIntervalSetting.value = state.reviewInterval; reviewIntervalSetting.onchange = function () { state.reviewInterval = parseInt(reviewIntervalSetting.value) || 3; saveStateDebounced(); }; }

    document.getElementById('exportAllDataBtn')?.addEventListener('click', exportAllData);
    document.getElementById('importDataBtn')?.addEventListener('click', function () { document.getElementById('importDataFile')?.click(); });
    document.getElementById('importDataFile')?.addEventListener('change', importData);
    document.getElementById('dataStatsBtn')?.addEventListener('click', showDataStats);
    document.getElementById('clearNotesBtn')?.addEventListener('click', clearNotes);

    // 视频壁纸初始化
    if (typeof initVideoBackground === 'function') initVideoBackground();
}

// ==================== 深色模式 ====================
function applyDarkMode() {
    if (state.darkMode) {
        document.body.classList.add('dark');
        var icon = document.querySelector('#darkModeToggle i');
        if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    } else {
        document.body.classList.remove('dark');
        var icon = document.querySelector('#darkModeToggle i');
        if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    }
    var darkModeSetting = document.getElementById('darkModeSetting');
    if (darkModeSetting) {
        darkModeSetting.checked = state.darkMode;
        darkModeSetting.setAttribute('aria-checked', state.darkMode);
    }
}

// ==================== 渐变背景 ====================
function applyGradientBg(type) {
    var body = document.body;
    body.className = body.className.replace(/gradient-\S+/g, '').trim();
    if (type && type !== 'none') {
        body.classList.add('gradient-' + type);
    }
    // 选择渐变时自动关闭视频壁纸
    if (type && type !== 'none' && state.videoBg) {
        state.videoBg = '';
        applyVideoBackground();
    }
}

// ==================== 主题色 ====================
function applyThemeColor(color) {
    const root = document.documentElement;
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-light', adjustColor(color, 30));
    root.style.setProperty('--accent-dark', adjustColor(color, -30));
    // 同步输出 RGB 分量，供 rgba(var(--accent-rgb), a) 引用。
    // 这样硬编码的透明强调色（阴影/光晕/边框）也会随主题色联动，避免切色后残留旧紫。
    const num = parseInt(color.replace('#', ''), 16);
    const r = (num >> 16) & 0xFF, g = (num >> 8) & 0xFF, b = num & 0xFF;
    root.style.setProperty('--accent-rgb', r + ', ' + g + ', ' + b);
}

function adjustColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) + percent;
    const g = (num >> 8 & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    const newR = Math.max(0, Math.min(255, r));
    const newG = Math.max(0, Math.min(255, g));
    const newB = Math.max(0, Math.min(255, b));
    return '#' + ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
}

// ==================== 数据管理 ====================
function exportAllData() {
    const exportData = { ...state, exportDate: new Date().toISOString(), version: '1.0.0' };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'c-study-backup_' + getLocalDateKey(new Date()) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 全部数据已导出');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            if (typeof data !== 'object' || data === null || Array.isArray(data)) { showToast('❌ 数据格式错误：需要对象类型'); return; }
            const allowedKeys = Object.keys(state);
            for (const key of allowedKeys) { if (!(key in data)) { showToast('❌ 数据缺少必要字段: ' + key); return; } }
            if (confirm('确定要导入数据吗？这将覆盖当前所有学习进度、笔记、书签等数据！')) {
                allowedKeys.forEach(function (key) { state[key] = data[key]; });
                localStorage.setItem(stateStorageKey(), JSON.stringify(state));
                saveState();
                updateAllUI();
                showToast('📤 数据导入成功！');
            }
        } catch (err) { showToast('❌ 数据格式错误，无法导入'); }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function showDataStats() {
    const totalSections = CHAPTERS.reduce(function (sum, ch) { return sum + ch.sections.length; }, 0);
    const completedCount = Object.keys(state.completedSections).length;
    const notesCount = Object.keys(state.notes).filter(function (k) { return state.notes[k] && state.notes[k].trim(); }).length;
    const totalNotesChars = Object.values(state.notes).reduce(function (sum, n) { return sum + (n || '').length; }, 0);

    const statsHtml = '<div class="data-stats">' +
        '<div class="stat-row"><span>总小节数</span><strong>' + totalSections + '</strong></div>' +
        '<div class="stat-row"><span>已完成</span><strong>' + completedCount + '</strong><span class="stat-sub">(' + (totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0) + '%)</span></div>' +
        '<div class="stat-row"><span>笔记数量</span><strong>' + notesCount + '</strong></div>' +
        '<div class="stat-row"><span>笔记字数</span><strong>' + totalNotesChars + '</strong></div>' +
        '<div class="stat-row"><span>书签数量</span><strong>' + state.bookmarks.length + '</strong></div>' +
        '<div class="stat-row"><span>徽章数量</span><strong>' + state.badges.length + '</strong></div>' +
        '<div class="stat-row"><span>学习等级</span><strong>LV' + state.level + '</strong></div>' +
        '<div class="stat-row"><span>总经验</span><strong>' + state.exp + '</strong></div>' +
        '<div class="stat-row"><span>连续天数</span><strong>' + state.streak + '</strong></div>' +
        '<div class="stat-row"><span>总学习时长</span><strong>' + formatStudyTime(state.totalStudyTime) + '</strong></div></div>';

    const modalEl = document.getElementById('dataStatsModal');
    const modalBody = document.getElementById('dataStatsModalBody');
    if (modalEl && modalBody) { modalBody.innerHTML = statsHtml; new bootstrap.Modal(modalEl).show(); }
    else { alert('数据统计:\n总小节数: ' + totalSections + '\n已完成: ' + completedCount + '\n笔记数量: ' + notesCount + '\n书签数量: ' + state.bookmarks.length + '\n徽章数量: ' + state.badges.length + '\n学习等级: LV' + state.level + '\n总经验: ' + state.exp + '\n连续天数: ' + state.streak + '\n总学习时长: ' + formatStudyTime(state.totalStudyTime)); }
}

function clearNotes() {
    if (confirm('确定要清除所有笔记吗？此操作不可撤销！')) { state.notes = {}; saveState(); showToast('🗑️ 所有笔记已清除'); }
}

// ==================== 事件绑定 ====================
function bindEvents() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.addEventListener('click', function () { const view = item.dataset.view; if (view) switchView(view); });
    });

    const aiToggle = document.getElementById('aiQaToggle');
    const aiDropdown = document.getElementById('aiDropdown');
    if (aiToggle && aiDropdown) {
        aiToggle.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); aiToggle.classList.toggle('open'); aiDropdown.classList.toggle('show'); });
    }
    document.addEventListener('click', function (e) {
        if (aiDropdown && aiDropdown.classList.contains('show')) {
            if (!aiToggle.contains(e.target) && !aiDropdown.contains(e.target)) { aiToggle.classList.remove('open'); aiDropdown.classList.remove('show'); }
        }
    });

    document.getElementById('backToMenu')?.addEventListener('click', function () { switchView('home'); });

    document.getElementById('sidebarToggle')?.addEventListener('click', function () {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) { sidebar.classList.toggle('collapsed', state.sidebarCollapsed); }
        const icon = document.querySelector('#sidebarToggle i');
        if (icon) { icon.classList.toggle('fa-chevron-left', !state.sidebarCollapsed); icon.classList.toggle('fa-chevron-right', state.sidebarCollapsed); }
        saveStateDebounced();
    });

    document.getElementById('progressBtn')?.addEventListener('click', markCompleted);
    document.getElementById('bookmarkBtn')?.addEventListener('click', toggleBookmark);
    document.getElementById('bookmarkBtnInline')?.addEventListener('click', toggleBookmark);

    document.getElementById('outlineBtn')?.addEventListener('click', function () { document.getElementById('outlinePanel')?.classList.toggle('visible'); });
    document.getElementById('closeOutline')?.addEventListener('click', function () { document.getElementById('outlinePanel')?.classList.remove('visible'); });

    document.getElementById('focusModeBtn')?.addEventListener('click', function () {
        // 课程页面按钮：打开全屏专注时钟（与主页按钮行为一致）
        if (window.FocusMode) {
            window.FocusMode.open();
        }
    });

    document.getElementById('randomSectionBtn')?.addEventListener('click', function () {
        const allSections = [];
        CHAPTERS.forEach(function (ch, chIdx) { ch.sections.forEach(function (sec, secIdx) { allSections.push({ chIdx: chIdx, secIdx: secIdx }); }); });
        const pick = allSections[Math.floor(Math.random() * allSections.length)];
        state.currentChapterIndex = pick.chIdx;
        state.currentSectionIndex = pick.secIdx;
        loadSection(pick.chIdx, pick.secIdx);
        switchView('course');
        showToast('🎲 随机跳转！');
    });

    document.getElementById('calendarPrevMonth')?.addEventListener('click', function () { calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1); initActivityCalendar(); });
    document.getElementById('calendarNextMonth')?.addEventListener('click', function () { calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1); initActivityCalendar(); });

    // 表格排序
    document.querySelectorAll('.learning-count-table thead th.sortable').forEach(function (header) {
        header.addEventListener('click', function () {
            const column = header.dataset.sort;
            if (tableSortState.column === column) { tableSortState.direction = tableSortState.direction === 'asc' ? 'desc' : 'asc'; }
            else { tableSortState.column = column; tableSortState.direction = 'asc'; }
            tableCurrentPage = 1;
            initLearningTable();
        });
    });

    let tableSearchTimer;
    document.getElementById('tableSearch')?.addEventListener('input', function () {
        clearTimeout(tableSearchTimer);
        var val = this.value.trim();
        tableSearchTimer = setTimeout(function () { tableSearchQuery = val; tableCurrentPage = 1; initLearningTable(); }, 300);
    });
    document.getElementById('tablePageSize')?.addEventListener('change', function () { tablePageSize = parseInt(this.value); tableCurrentPage = 1; initLearningTable(); });
    document.getElementById('tableStatusFilter')?.addEventListener('change', function () { tableStatusFilter = this.value; tableCurrentPage = 1; initLearningTable(); });

    document.getElementById('resetProgressBtn')?.addEventListener('click', resetProgress);
    document.getElementById('resetProgressBtn2')?.addEventListener('click', resetProgress);
    document.getElementById('exportNotesBtn')?.addEventListener('click', exportNotes);
    document.getElementById('exportNotesBtn2')?.addEventListener('click', exportNotes);

    // 初始化各功能模块
    initDarkMode();
    initFontSize();
    initSearch();
    initNotes();
    initNoise();
    initKeyboardShortcuts();

    // 游戏模式返回按钮
    document.getElementById('gameBackBtn')?.addEventListener('click', function () {
        switchView('home');
    });

    // 测验关闭事件由 game.js 的 bindQuizEvents() 统一处理
}

// ==================== 重置与导出 ====================
function resetProgress() {
    if (confirm('确定要重置所有学习进度吗？此操作不可撤销！')) {
        state.completedSections = {};
        state.completedDates = {};
        state.sectionStudyTime = {};
        state.notes = {};
        state.bookmarks = [];
        state.streak = 0;
        state.totalDays = 0;
        state.totalStudyTime = 0;
        state.lastStudyDate = null;
        // 保留成长等级：总经验、当前经验、等级不重置
        const LEVEL_BADGES = ['level_5', 'level_10', 'level_15', 'level_20', 'level_30'];
        state.badges = (state.badges || []).filter(function (b) { return LEVEL_BADGES.includes(b.id); });
        state.quizStats = { attempts: 0, bestStreak: 0, bestRank: '', sCount: 0, aCount: 0 };
        state.studiedEarly = false;
        state.studiedAtNight = false;
        state.dailyGoalCompleteDays = 0;
        state.dailyGoalMetDate = null;
        localStorage.removeItem('c_study_records');
        localStorage.removeItem(CHECKIN_STORAGE_KEY);
        saveState();
        updateAllUI();
        updateHomeNew();
        applyDarkMode();
        applyFontSize();
        applyFocusMode();
        applyThemeColor(state.themeColor);
        if (state.currentView === 'course' && state.currentChapterIndex !== null) {
            loadSection(state.currentChapterIndex, state.currentSectionIndex || 0);
        }
        updateExpUI();
        showToast('🔄 学习进度已重置，成长等级已保留');
    }
}

function exportNotes() {
    let exportText = '# ' + (CURRENT_SITE_NAME || '知识库') + '学习笔记\n\n';
    let hasNotes = false;
    CHAPTERS.forEach(function (ch) {
        let chHasNotes = false;
        let chText = '';
        ch.sections.forEach(function (sec, secIdx) {
            const key = getSectionKey(ch, sec);
            if (state.notes[key] && state.notes[key].trim()) {
                chText += '## ' + ch.sectionTitles[secIdx] + '\n\n' + state.notes[key] + '\n\n---\n\n';
                chHasNotes = true;
                hasNotes = true;
            }
        });
        if (chHasNotes) exportText += '# 第' + chapterNo(ch) + '章 ' + ch.title + '\n\n' + chText;
    });
    if (!hasNotes) { showToast('📝 暂无笔记可导出'); return; }
    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (CURRENT_SITE_NAME || '知识库') + '学习笔记_' + getLocalDateKey(new Date()) + '.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 笔记导出成功！');
}

// ==================== 应用初始化 ====================
async function init() {
    loadState();
    applyGradientBg(state.gradientBg);
    applyVideoBackground();
    // 等待题库加载完成再初始化 UI，确保游戏节点点击时题库已可用
    await loadQuizzes();
    chapterTreeDirty = true;
    dashboardDirty = true;
    updateAllUI();
    bindEvents();
    initQuoteModule();
    initCountdownModule();
    initHomeCalendar();
    initStatsActions();
    updateHomeNew();
    switchView('home');
    if (state.sidebarCollapsed) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
        const icon = document.querySelector('#sidebarToggle i');
        if (icon) { icon.classList.remove('fa-chevron-left'); icon.classList.add('fa-chevron-right'); }
    }
    if (state.focusMode) document.body.classList.add('focus-mode');
    applyThemeColor(state.themeColor);
    // 登录/选站后停留在主页（不再自动跳入「实战闯关」，登录过渡动画由 auth.js 的 loader 承担）
    console.log('🚀 ' + (CURRENT_SITE_NAME || '知识库') + '已就绪');
    console.log('   LV' + state.level + ' | 已完成' + Object.keys(state.completedSections).length + '小节 | 连续' + state.streak + '天');
    console.log('   📚 题库: ' + Object.keys(QUIZZES).length + ' 章已加载');
}

// 启动：由 auth.js 登录通过后调用 init()（auth.js 独占引导权，避免重复初始化）

// --- js/game/quizgame-data.js ---
/* =============================================================
 * quizgame-data.js —— 实战闯关游戏配置（接入主站后适配版）
 *
 * 说明：章节(CHAPTERS)与题库(QUIZZES)由主站 chapters.js 提供
 * （按站点切换、从 /api/quizzes 加载）；本文件提供游戏常量与
 * 14 重试炼的关卡元数据（名称 / 图标 / 寓意）。
 * ============================================================= */
(function(){
  'use strict';

  const CONFIG = {
    EXP_PER_LEVEL: 100,        // 每级所需经验 = 等级 × 100
    BATTLE_SECONDS: 25,        // 每题限时
    QUIZ_COUNT: 8,             // 每章随机抽取题目数
    PASS_RATE: 0.6,            // 通关及格线（答对比例 ≥ 0.6 → 60%）
    XP_PER_CORRECT: 10,        // 每题基础经验分
    SCROLL_SENSITIVITY: 0.0014,
    MIN_SCALE: 0.6,            // 兜底下限（实际使用 Game.minScale() 动态下限）
    MAX_SCALE: 2.5,
  };

  /* ===================== 关卡秘典 · 14 重试炼命名 =====================
   * 与主站 CHAPTERS 一一对应（C 语言站 14 章）。
   * name  关卡名；emoji 图标；motto 寓意（提示/详情展示）。
   */
  const LEVEL_META = [
    { name: '初心木屋', emoji: '🏠', motto: '远征的起点，求知最初的温暖与安定。' },
    { name: '幽谷飞瀑', emoji: '💧', motto: '基础如流水般持续渗透，入门试炼。' },
    { name: '智慧古树', emoji: '🌳', motto: '知识的根系深扎于此，第一阶段的扎根考验。' },
    { name: '翠绿迷阵', emoji: '🧩', motto: '路径曲折而复杂，逻辑推理的初级试炼。' },
    { name: '巨石峰峦', emoji: '🪨', motto: '前进路上的第一座高山，需要扎实功底突破。' },
    { name: '荒兽领地', emoji: '🦏', motto: '具象化的难题，需要调用所学知识应对。' },
    { name: '霜晶守卫', emoji: '❄️', motto: '冰冷的逻辑考验，绝对理性的第一道关卡。' },
    { name: '深渊熔炉', emoji: '💀', motto: '复杂知识的深潭，压力与淬炼并存。' },
    { name: '玄冰王座', emoji: '🔷', motto: '冰冷结构的极致，系统性与结构的巅峰。' },
    { name: '紫晶圣域', emoji: '🔮', motto: '神秘深邃的魔法领域，与紫水晶圣域呼应。' },
    { name: '黄金沙塔', emoji: '🏜️', motto: '需要耐心与时间破解的古老遗迹。' },
    { name: '赤焰熔炉', emoji: '🔥', motto: '炽热的考验，需要知识、专注与冷静。' },
    { name: '深邃之眼', emoji: '🌪️', motto: '打破思维惯性，跨越维度的创新挑战。' },
    { name: '终焉古颅', emoji: '💀', motto: '知识远征的终点，跨越高度的综合挑战！' },
  ];

  window.CONFIG = CONFIG;
  window.LEVEL_META = LEVEL_META;
})();

// --- js/game/quizgame-audio.js ---
/* =============================================================
 * audio.js —— Web Audio 合成音效（无音频文件依赖）
 * 用 OscillatorNode + GainNode 实时合成各类游戏音效。
 * ============================================================= */
(function(){
  'use strict';

  let ctx = null;
  let masterGain = null;
  let enabled = true;

  // 从 localStorage 读取开关
  try {
    enabled = localStorage.getItem('c_sound_enabled') !== '0';
  } catch (e) {}

  function ensure(){
    if (ctx) return true;
    if (!enabled) return false;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  // 需在用户手势中调用以解锁 AudioContext
  function unlock(){
    if (!enabled) return;
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{});
  }

  // 核心：播放一串音调
  function tone(freq, dur, type, vol, delay){
    if (!ensure() || !ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  // 频率滑音
  function glide(f0, f1, dur, type, vol, delay){
    if (!ensure() || !ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // 音效表
  const SOUNDS = {
    click(){ tone(200, 0.05, 'square', 0.2); glide(200, 80, 0.08, 'square', 0.15); },
    correct(){ glide(523, 784, 0.12, 'sine', 0.3); },
    wrong(){ glide(196, 98, 0.3, 'sawtooth', 0.3); },
    combo(){ glide(600, 1200, 0.2, 'triangle', 0.3); },
    levelup(){ glide(330, 880, 0.4, 'sawtooth', 0.35); tone(880, 0.3, 'triangle', 0.25, 0.05); },
    victory(){
      const seq = [523, 659, 784, 1047];
      seq.forEach((f,i)=> tone(f, 0.35, 'triangle', 0.35, i*0.18));
    },
    wave(){ glide(300, 600, 0.25, 'triangle', 0.3); },
    lock(){ tone(180, 0.15, 'square', 0.2); tone(120, 0.25, 'square', 0.2, 0.12); },
    kill(){ glide(500, 120, 0.25, 'sawtooth', 0.3); },
    heart(){ glide(400, 700, 0.15, 'sine', 0.3); },
    fail(){ [240, 200, 160, 120].forEach((f,i)=> tone(f, 0.3, 'sawtooth', 0.3, i*0.2)); },
    hover(){ tone(600, 0.03, 'sine', 0.12); },
  };

  window.Sound = {
    play(name){
      if (!enabled) return;
      if (!ensure()) return;
      const fn = SOUNDS[name];
      if (fn) {
        try { fn(); } catch(e){}
      }
    },
    unlock, ensure,
    isEnabled(){ return enabled; },
    toggle(){
      enabled = !enabled;
      try { localStorage.setItem('c_sound_enabled', enabled ? '1' : '0'); } catch(e){}
      return enabled;
    }
  };

})();

// --- js/game/quizgame-game.js ---
/* =============================================================
 * game.js —— 闯关地图核心（地图渲染 / 相机 / 章节答题测验）
 *
 * 本模块不直接绑定 UI 事件（见 main.js），仅暴露操作接口：
 *   Game.init()          初始化
 *   Game.openQuiz(i)     对第 i 章（0-based）发起随机 N 题测验
 *   Game.addExp(n)       加经验（自动升级）
 *   Game.openKnowledge(i) 跳转主站章节正文（营地节点）
 *   Game.state           当前状态
 * ============================================================= */
(function(){
  'use strict';

  /* ===================== 工具 ===================== */
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ===================== 状态 ===================== */
  const state = {
    completedSections: {},   // quest clear map (kept in main-site state.quest)
    exp: 0,
    totalExp: 0,
    level: 1,
    quizStats: { attempts: 0, bestStreak: 0, bestRank: "", sCount: 0, aCount: 0 },
  };

  // ===== progress bridge (integrated into main site) =====
  // Quest progress lives in main-site window.__appState.quest (per user x site,
  // persisted by main site localStorage + /api/user-data). It is independent of
  // the main site course progress (state.completedSections).
  function questHost(){
    const host = (typeof window !== "undefined" && window.__appState) ? window.__appState : null;
    if (!host) return null;
    if (!host.quest){
      host.quest = {
        completedSections: {},
        exp: 0,
        totalExp: 0,
        level: 1,
        quizStats: { attempts: 0, bestStreak: 0, bestRank: "", sCount: 0, aCount: 0 },
      };
    }
    return host;
  }
  function loadState(){
    const host = questHost();
    if (host && host.quest) Object.assign(state, host.quest);
  }
  function saveState(){
    const host = questHost();
    if (host){
      host.quest = {
        completedSections: state.completedSections,
        exp: state.exp,
        totalExp: state.totalExp,
        level: state.level,
        quizStats: state.quizStats,
      };
      if (host.quizStats) host.quizStats = state.quizStats;
    }
    if (typeof saveStateDebounced === "function") saveStateDebounced();
  }

  function getSectionKey(ch, sec){ return `${ch.folder}/${sec}.md`; }
  function chapterCleared(ch){
    // 语法站：每章固定 2 关，解锁条件只看前 2 个小节
    if (CURRENT_SITE_KEY === 'grammar' && ch.sections.length >= 2) {
      return ch.sections.slice(0, 2).every(s => !!state.completedSections[getSectionKey(ch, s)]);
    }
    return ch.sections.every(s => !!state.completedSections[getSectionKey(ch, s)]);
  }
  function isChapterUnlocked(idx){
    if (idx <= 0) return true;
    const prev = CHAPTERS[idx - 1];
    return prev ? chapterCleared(prev) : true;
  }
  function clearedChapterCount(){
    return CHAPTERS.reduce((n, ch) => n + (chapterCleared(ch) ? 1 : 0), 0);
  }

  /* 经验 / 等级 */
  function expNeeded(level){ return (level || 1) * CONFIG.EXP_PER_LEVEL; }
  function addExp(n){
    if (n <= 0) return { leveled: false, newLevel: state.level };
    state.exp += n;
    state.totalExp += n;
    let leveled = false;
    while (state.exp >= expNeeded(state.level)){
      state.exp -= expNeeded(state.level);
      state.level++;
      leveled = true;
    }
    saveState();
    return { leveled, newLevel: state.level };
  }

  /* ===================== 节点与位置 ===================== */
  // 语法站：每章固定 2 关（主干城堡 + 1 个营地）
  const GRAMMAR_LAND_NAMES = ['词性与词类', '时态与语态', '句法结构', '从句', '非谓语动词'];
  const GRAMMAR_ICONS = ['🔤', '⏱️', '🏗️', '🔗', '✍️'];

  // 语法站城堡固定位置（沿道路分布，5 个点）
  const GRAMMAR_ROAD_POSITIONS = [
    { x: 220,  y: 2050 },
    { x: 860,  y: 1780 },
    { x: 1660, y: 1680 },
    { x: 2600, y: 1480 },
    { x: 3850, y: 1180 },
  ];

  function generateNodes(){
    // 语法站：每章 2 关（1 主城堡 + 1 营地）
    if (CURRENT_SITE_KEY === 'grammar') {
      return CHAPTERS.map((ch, chIdx) => {
        const main = {
          id: `${ch.id}.1`, chapter: chIdx + 1, section: 1,
          name: ch.title, icon: GRAMMAR_ICONS[chIdx] || ch.icon,
          isMain: true, isStart: chIdx === 0, isEnd: chIdx === CHAPTERS.length - 1, chIdx,
        };
        // 营地：用章节前两个小节标题
        const campSecIdx = 1;
        const camp = ch.sections[1] != null ? {
          id: `${ch.id}.2`, chapter: chIdx + 1, section: 2,
          name: ch.sectionTitles[1] || ch.sections[1], icon: GRAMMAR_ICONS[chIdx] || ch.icon,
          isMain: false, chIdx,
        } : null;
        return camp ? [main, camp] : [main];
      }).flat();
    }

    // C 语言站：原始逻辑，每章多关
    const nodes = [];
    CHAPTERS.forEach((ch, chIdx) => {
      nodes.push({
        id: `${ch.id}.1`, chapter: chIdx + 1, section: 1,
        name: ch.sectionTitles[0] || ch.title, icon: ch.icon,
        isMain: true, isStart: chIdx === 0, isEnd: chIdx === CHAPTERS.length - 1, chIdx,
      });
      for (let i = 1; i < ch.sections.length; i++){
        nodes.push({
          id: `${ch.id}.${i + 1}`, chapter: chIdx + 1, section: i + 1,
          name: ch.sectionTitles[i] || ch.sections[i], icon: ch.icon,
          isMain: false, chIdx,
        });
      }
    });
    return nodes;
  }

  // 王国之路关键点（viewBox 0~4508 x 0~2400）
  const ROAD_POINTS = [
    { x: 160,  y: 2050 }, { x: 480,  y: 1850 }, { x: 860,  y: 2050 },
    { x: 1240, y: 1650 }, { x: 1720, y: 1880 }, { x: 2180, y: 1380 },
    { x: 2660, y: 1680 }, { x: 3180, y: 1200 }, { x: 3760, y: 1500 },
    { x: 4080, y: 1080 },
  ];

  // 采样道路为点列，预计算累计弧长
  function buildRoadSamples(){
    const samples = [];
    const pts = ROAD_POINTS;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++){
      const dx = pts[i+1].x - pts[i].x, dy = pts[i+1].y - pts[i].y;
      const seg = Math.hypot(dx, dy);
      const steps = Math.max(8, Math.round(seg / 40));
      for (let s = 0; s < steps; s++){
        const t = s / steps;
        samples.push({
          x: lerp(pts[i].x, pts[i+1].x, t),
          y: lerp(pts[i].y, pts[i+1].y, t),
          len: total + seg * t,
          ang: Math.atan2(dy, dx),
        });
      }
      total += seg;
    }
    samples.push({ x: pts[pts.length-1].x, y: pts[pts.length-1].y, len: total, ang: samples[samples.length-1].ang });
    return { samples, total };
  }
  const ROAD = buildRoadSamples();

  // 沿路等距取点（t in 0..1），lateral 为垂直偏移
  function roadPosAt(t, lateral){
    const target = ROAD.total * clamp(t, 0, 1);
    const s = ROAD.samples;
    let lo = 0, hi = s.length - 1;
    while (lo < hi){
      const mid = (lo + hi) >> 1;
      if (s[mid].len < target) lo = mid + 1; else hi = mid;
    }
    const p = s[lo];
    const ang = p.ang + Math.PI / 2; // 垂直于道路
    return {
      x: p.x + Math.cos(ang) * (lateral || 0),
      y: p.y + Math.sin(ang) * (lateral || 0),
      ang: p.ang,
    };
  }

  function generatePositions(nodes){
    const nodeMap = {};
    const mainByCh = {};
    const N = CHAPTERS.length;

    // 语法站：使用固定位置
    if (CURRENT_SITE_KEY === 'grammar') {
      CHAPTERS.forEach((ch, c) => {
        const pos = GRAMMAR_ROAD_POSITIONS[c] || { x: 1000, y: 1500 };
        const node = nodes.find(n => n.id === `${ch.id}.1`);
        if (node) {
          nodeMap[node.id] = { x: pos.x, y: pos.y, ang: 0 };
          mainByCh[c] = { x: pos.x, y: pos.y };
        }
      });
      // 语法站营地：围绕城堡分布，每章只有 1 个营地
      const camps = nodes.filter(n => !n.isMain);
      camps.forEach((camp) => {
        const c = camp.chIdx;
        const main = mainByCh[c];
        if (!main) return;
        const baseAngle = -Math.PI / 3 + c * 0.3;
        const radius = 160;
        nodeMap[camp.id] = {
          x: clamp(main.x + Math.cos(baseAngle) * radius, 110, 4090),
          y: clamp(main.y + Math.sin(baseAngle) * radius, 120, 2260),
          ang: 0,
        };
      });
      return nodeMap;
    }

    // C 语言站：原始逻辑，每章多关
    // 主干城堡沿路分布
    for (let c = 0; c < N; c++){
      let pos;
      if (c === 0) pos = { x: 180, y: 2050, ang: 0 };
      else if (c === N - 1) pos = { x: 4020, y: 1180, ang: 0 };
      else {
        const t = 0.06 + (0.94 - 0.06) * (c / (N - 1));
        const lateral = (c % 2 === 0 ? -1 : 1) * (90 + 22 * Math.sin(c * 1.7));
        pos = roadPosAt(t, lateral);
      }
      const node = nodes.find(n => n.id === `${CHAPTERS[c].id}.1`);
      if (node){
        nodeMap[node.id] = { x: pos.x, y: pos.y, ang: pos.ang || 0 };
        mainByCh[c] = { x: pos.x, y: pos.y };
      }
    }

    // 营地围绕所属城堡散开
    const camps = nodes.filter(n => !n.isMain);
    for (const camp of camps){
      const c = camp.chIdx;
      const main = mainByCh[c];
      if (!main) continue;
      // 收集同章营地序号
      const siblings = nodes.filter(n => n.chIdx === c && !n.isMain);
      const b = siblings.indexOf(camp);
      const count = Math.max(1, siblings.length);
      const baseAngle = (b / count) * Math.PI * 1.7 + 0.35 + c * 0.35;
      const radius = 150 + 30 * Math.sin(c * 2.1 + b * 0.7);
      nodeMap[camp.id] = {
        x: clamp(main.x + Math.cos(baseAngle) * radius, 110, 4090),
        y: clamp(main.y + Math.sin(baseAngle) * radius, 120, 2260),
        ang: 0,
      };
    }
    return nodeMap;
  }

  /* ===================== 状态判定 ===================== */
  function mainStatus(chIdx){
    const ch = CHAPTERS[chIdx];
    const cleared = chapterCleared(ch);
    const unlocked = isChapterUnlocked(chIdx);
    return { isLocked: !unlocked, isCompleted: cleared, isUnlocked: unlocked };
  }
  function branchStatus(node){
    const ch = CHAPTERS[node.chIdx];
    const key = getSectionKey(ch, ch.sections[node.section - 1]);
    const done = !!state.completedSections[key];
    const unlocked = isChapterUnlocked(node.chIdx) ||
      (chapterCleared(ch) /* 本章已通，全解锁 */);
    return { isLocked: !unlocked, isCompleted: done, isUnlocked: unlocked };
  }
  function getNodeStatus(node){
    return node.isMain ? mainStatus(node.chIdx) : branchStatus(node);
  }

  /* ===================== SVG 绘制 ===================== */
  const CLS = {
    terrain: '#terrain-container',
    links: '#links-container',
    nodes: '#nodes-container',
    mapG: '#map-group',
  };

  // 收敛的 accent 色板：5 色暖系循环，替代 14 种彩虹色，融入羊皮纸世界
  const ACCENT_PALETTE = ['#7a9e5a','#c9a24a','#b0653a','#8a6f9e','#5a8f8a'];
  function getAccent(chIdx){
    return ACCENT_PALETTE[chIdx % ACCENT_PALETTE.length];
  }
  const LAND_NAMES = ['新手村','语法平原','流程河谷','字符串镇','数组林地','函数城堡','指针迷宫','结构要塞','内存矿井','文件图书馆','预处理工坊','算法圣地','工程王城','龙之领域'];
  function getLand(chIdx){
    if (CURRENT_SITE_KEY === 'grammar') {
      return GRAMMAR_LAND_NAMES[chIdx] || ('章节 ' + (chIdx + 1));
    }
    return LAND_NAMES[chIdx] || ('地域 ' + (chIdx + 1));
  }
  function getDesc(chIdx){
    const ch = CHAPTERS[chIdx];
    return ch ? ch.title : '';
  }
  // 关卡秘典元数据（quizgame-data.js -> window.LEVEL_META）
  function levelMeta(chIdx){
    if (typeof window === 'undefined' || !window.LEVEL_META) return null;
    // 站点章节数与 14 关秘典不一致时不套用（如语法 5 章）
    if (CHAPTERS.length !== window.LEVEL_META.length) return null;
    return window.LEVEL_META[chIdx] || null;
  }
  function levelNameFor(chIdx){
    const ch = CHAPTERS[chIdx];
    if (!ch) return '第' + (chIdx + 1) + '章';
    // 语法站用固定名称
    if (CURRENT_SITE_KEY === 'grammar') {
      return (GRAMMAR_ICONS[chIdx] || ch.icon || '') + ' ' + ch.title;
    }
    const m = levelMeta(chIdx);
    if (m) return (m.emoji ? m.emoji + ' ' : '') + m.name;
    return ch.title;
  }
  function levelMotto(chIdx){
    if (CURRENT_SITE_KEY === 'grammar') return '';
    const m = levelMeta(chIdx);
    return (m && m.motto) ? m.motto : '';
  }

    /* =============================================================
   * 关卡背景图配置：14 章主节点 -> image/level/level_N.png
   * 顺序(第1~14关): 001,003,002,004,005,007,012,006,013,011,008,010,009,014
   * 坐标来自 tools/editor.html 摆放结果，已是 viewBox(4508x2400) 坐标；x,y=中心，w,h=尺寸
   * 数据从 data/level_layout.json 加载（tools/editor.html 导出）
   * ============================================================= */
  let LEVEL_IMG_CFG = {
    BG_SRC: 'image/background/background_main.webp',
    LEVELS: [{"sprite":1,"z":72,"x":350,"y":335,"w":286,"h":304},{"sprite":2,"z":67,"x":248,"y":903,"w":680,"h":481},{"sprite":3,"z":365,"x":381,"y":1346,"w":371,"h":382},{"sprite":4,"z":232,"x":1087,"y":1658,"w":336,"h":261},{"sprite":5,"z":275,"x":297,"y":1975,"w":280,"h":236},{"sprite":6,"z":73,"x":1648,"y":1949,"w":350,"h":340},{"sprite":7,"z":74,"x":2127,"y":1734,"w":329,"h":400},{"sprite":8,"z":427,"x":2015,"y":1108,"w":384,"h":264},{"sprite":9,"z":75,"x":3086,"y":1240,"w":307,"h":245},{"sprite":10,"z":470,"x":4020,"y":739,"w":330,"h":320},{"sprite":11,"z":76,"x":1579,"y":130,"w":273,"h":259},{"sprite":12,"z":77,"x":2609,"y":246,"w":454,"h":484},{"sprite":13,"z":35,"x":3295,"y":500,"w":553,"h":436},{"sprite":14,"z":78,"x":3847,"y":1342,"w":420,"h":386}],
  };
  let CAMP_IMG_CFG = {
    CAMP_SRC: 'image/camp/camp',
    CAMPS: [{"sprite":9,"z":34,"x":3237,"y":1194,"w":106,"h":105,"ch":8},{"sprite":13,"z":36,"x":2877,"y":575,"w":89,"h":62,"ch":11},{"sprite":5,"z":42,"x":618,"y":1870,"w":109,"h":114,"ch":4},{"sprite":5,"z":43,"x":739,"y":1972,"w":107,"h":111,"ch":4},{"sprite":3,"z":44,"x":715,"y":1261,"w":58,"h":47,"ch":2},{"sprite":3,"z":45,"x":470,"y":1405,"w":80,"h":65,"ch":2},{"sprite":3,"z":46,"x":333,"y":1543,"w":69,"h":55,"ch":2},{"sprite":2,"z":47,"x":653,"y":1028,"w":57,"h":59,"ch":2},{"sprite":1,"z":68,"x":37,"y":300,"w":43,"h":45,"ch":0},{"sprite":1,"z":79,"x":539,"y":529,"w":42,"h":44,"ch":0},{"sprite":1,"z":80,"x":722,"y":609,"w":43,"h":45,"ch":0},{"sprite":1,"z":81,"x":982,"y":720,"w":49,"h":51,"ch":0},{"sprite":1,"z":82,"x":753,"y":748,"w":51,"h":53,"ch":1},{"sprite":1,"z":83,"x":1279,"y":601,"w":53,"h":55,"ch":10},{"sprite":1,"z":84,"x":1025,"y":277,"w":62,"h":64,"ch":10},{"sprite":1,"z":85,"x":404,"y":560,"w":42,"h":44,"ch":0},{"sprite":3,"z":86,"x":620,"y":1484,"w":60,"h":48,"ch":2},{"sprite":3,"z":87,"x":792,"y":1327,"w":86,"h":69,"ch":2},{"sprite":3,"z":88,"x":677,"y":1593,"w":70,"h":56,"ch":2},{"sprite":5,"z":89,"x":160,"y":2114,"w":70,"h":73,"ch":4},{"sprite":5,"z":90,"x":910,"y":2047,"w":139,"h":145,"ch":3},{"sprite":5,"z":91,"x":392,"y":2181,"w":128,"h":133,"ch":4},{"sprite":4,"z":92,"x":1559,"y":1456,"w":189,"h":204,"ch":5},{"sprite":4,"z":93,"x":1487,"y":860,"w":172,"h":186,"ch":7},{"sprite":4,"z":94,"x":1503,"y":1040,"w":100,"h":108,"ch":7},{"sprite":4,"z":95,"x":1447,"y":1179,"w":73,"h":79,"ch":7},{"sprite":6,"z":96,"x":1298,"y":2082,"w":61,"h":56,"ch":5},{"sprite":6,"z":97,"x":1769,"y":2226,"w":59,"h":53,"ch":5},{"sprite":6,"z":98,"x":1759,"y":2329,"w":54,"h":49,"ch":5},{"sprite":6,"z":99,"x":1640,"y":1696,"w":63,"h":58,"ch":5},{"sprite":6,"z":100,"x":1788,"y":1791,"w":43,"h":39,"ch":5},{"sprite":6,"z":101,"x":1387,"y":1928,"w":68,"h":62,"ch":5},{"sprite":8,"z":102,"x":2269,"y":1168,"w":62,"h":70,"ch":7},{"sprite":8,"z":103,"x":2720,"y":686,"w":86,"h":98,"ch":11},{"sprite":9,"z":104,"x":2958,"y":976,"w":77,"h":76,"ch":8},{"sprite":9,"z":105,"x":2823,"y":1006,"w":74,"h":73,"ch":8},{"sprite":9,"z":106,"x":3029,"y":1545,"w":93,"h":91,"ch":8},{"sprite":9,"z":107,"x":3006,"y":1109,"w":83,"h":81,"ch":8},{"sprite":10,"z":108,"x":4354,"y":481,"w":68,"h":111,"ch":9},{"sprite":10,"z":109,"x":3971,"y":502,"w":68,"h":110,"ch":9},{"sprite":11,"z":110,"x":1412,"y":294,"w":57,"h":88,"ch":10},{"sprite":11,"z":111,"x":1405,"y":420,"w":55,"h":84,"ch":10},{"sprite":11,"z":112,"x":1445,"y":571,"w":57,"h":86,"ch":10},{"sprite":11,"z":113,"x":1915,"y":180,"w":52,"h":80,"ch":10},{"sprite":11,"z":114,"x":1618,"y":640,"w":81,"h":124,"ch":10},{"sprite":11,"z":115,"x":1985,"y":448,"w":79,"h":120,"ch":10},{"sprite":12,"z":116,"x":2302,"y":166,"w":69,"h":55,"ch":11},{"sprite":12,"z":117,"x":2164,"y":289,"w":58,"h":47,"ch":11},{"sprite":12,"z":118,"x":2274,"y":481,"w":66,"h":53,"ch":11},{"sprite":12,"z":119,"x":2068,"y":212,"w":60,"h":49,"ch":10},{"sprite":12,"z":120,"x":2379,"y":582,"w":77,"h":62,"ch":11},{"sprite":12,"z":121,"x":2913,"y":225,"w":78,"h":63,"ch":11},{"sprite":12,"z":122,"x":2199,"y":609,"w":87,"h":70,"ch":7},{"sprite":12,"z":123,"x":2025,"y":779,"w":79,"h":64,"ch":7},{"sprite":12,"z":124,"x":2665,"y":505,"w":83,"h":67,"ch":11},{"sprite":13,"z":125,"x":2885,"y":704,"w":73,"h":51,"ch":12},{"sprite":13,"z":126,"x":3336,"y":806,"w":93,"h":65,"ch":12},{"sprite":13,"z":127,"x":3727,"y":518,"w":68,"h":48,"ch":9},{"sprite":13,"z":128,"x":3660,"y":415,"w":81,"h":57,"ch":12},{"sprite":4,"z":181,"x":1231,"y":1018,"w":92,"h":100,"ch":3},{"sprite":4,"z":189,"x":956,"y":1140,"w":122,"h":132,"ch":3},{"sprite":4,"z":213,"x":1285,"y":1325,"w":142,"h":153,"ch":3},{"sprite":3,"z":253,"x":212,"y":1468,"w":64,"h":52,"ch":2},{"sprite":5,"z":260,"x":469,"y":1800,"w":155,"h":162,"ch":4},{"sprite":5,"z":261,"x":232,"y":1744,"w":109,"h":114,"ch":4},{"sprite":5,"z":279,"x":123,"y":2350,"w":160,"h":167,"ch":4},{"sprite":5,"z":295,"x":663,"y":2283,"w":147,"h":153,"ch":4},{"sprite":11,"z":338,"x":1532,"y":419,"w":53,"h":82,"ch":10},{"sprite":11,"z":344,"x":1751,"y":379,"w":59,"h":91,"ch":10},{"sprite":11,"z":349,"x":1919,"y":345,"w":61,"h":93,"ch":10},{"sprite":2,"z":367,"x":31,"y":754,"w":58,"h":60,"ch":1},{"sprite":2,"z":368,"x":137,"y":791,"w":58,"h":60,"ch":1},{"sprite":2,"z":369,"x":350,"y":858,"w":53,"h":55,"ch":1},{"sprite":2,"z":370,"x":289,"y":975,"w":56,"h":58,"ch":1},{"sprite":2,"z":371,"x":497,"y":928,"w":50,"h":52,"ch":1},{"sprite":2,"z":372,"x":290,"y":814,"w":55,"h":57,"ch":1},{"sprite":3,"z":373,"x":575,"y":1389,"w":66,"h":53,"ch":2},{"sprite":3,"z":374,"x":661,"y":1342,"w":58,"h":47,"ch":2},{"sprite":6,"z":375,"x":1864,"y":1997,"w":52,"h":47,"ch":5},{"sprite":6,"z":376,"x":1184,"y":1984,"w":56,"h":51,"ch":3},{"sprite":14,"z":404,"x":3518,"y":1400,"w":51,"h":53,"ch":13},{"sprite":14,"z":405,"x":3662,"y":1567,"w":43,"h":44,"ch":13},{"sprite":14,"z":406,"x":3971,"y":1593,"w":56,"h":59,"ch":13},{"sprite":14,"z":407,"x":4184,"y":1292,"w":50,"h":53,"ch":13},{"sprite":14,"z":408,"x":3882,"y":1798,"w":56,"h":58,"ch":13},{"sprite":14,"z":409,"x":3266,"y":2039,"w":57,"h":60,"ch":8},{"sprite":14,"z":410,"x":3131,"y":1636,"w":59,"h":61,"ch":8},{"sprite":14,"z":411,"x":3314,"y":1697,"w":52,"h":55,"ch":8},{"sprite":14,"z":412,"x":4146,"y":1664,"w":84,"h":88,"ch":13},{"sprite":8,"z":421,"x":2395,"y":850,"w":81,"h":92,"ch":7},{"sprite":8,"z":422,"x":2232,"y":926,"w":72,"h":81,"ch":7},{"sprite":8,"z":426,"x":2571,"y":819,"w":63,"h":71,"ch":11},{"sprite":8,"z":428,"x":1836,"y":1015,"w":58,"h":66,"ch":7},{"sprite":8,"z":429,"x":2135,"y":1211,"w":62,"h":70,"ch":7},{"sprite":13,"z":436,"x":3136,"y":860,"w":83,"h":58,"ch":8},{"sprite":13,"z":454,"x":3590,"y":860,"w":86,"h":60,"ch":9},{"sprite":10,"z":464,"x":3852,"y":753,"w":87,"h":141,"ch":9},{"sprite":10,"z":467,"x":4218,"y":633,"w":76,"h":124,"ch":9},{"sprite":10,"z":472,"x":3925,"y":963,"w":68,"h":110,"ch":9},{"sprite":10,"z":484,"x":4328,"y":807,"w":76,"h":123,"ch":9},{"sprite":10,"z":486,"x":3811,"y":439,"w":66,"h":107,"ch":9},{"sprite":10,"z":490,"x":4205,"y":954,"w":67,"h":109,"ch":9},{"sprite":9,"z":511,"x":2834,"y":876,"w":86,"h":85,"ch":8},{"sprite":9,"z":512,"x":2855,"y":1894,"w":75,"h":74,"ch":8},{"sprite":9,"z":517,"x":3130,"y":1430,"w":100,"h":99,"ch":8},{"sprite":7,"z":562,"x":1776,"y":1476,"w":56,"h":86,"ch":6},{"sprite":7,"z":563,"x":1833,"y":1570,"w":56,"h":86,"ch":6},{"sprite":7,"z":564,"x":2000,"y":1519,"w":56,"h":86,"ch":6},{"sprite":7,"z":565,"x":1921,"y":2115,"w":56,"h":86,"ch":5},{"sprite":7,"z":566,"x":2380,"y":1586,"w":56,"h":86,"ch":6},{"sprite":7,"z":567,"x":2464,"y":2066,"w":56,"h":86,"ch":6},{"sprite":7,"z":570,"x":2682,"y":1838,"w":56,"h":86,"ch":6},{"sprite":8,"z":579,"x":2469,"y":1193,"w":89,"h":100,"ch":7},{"sprite":7,"z":592,"x":2353,"y":1834,"w":56,"h":86,"ch":6}],
  };
  let DECOR_IMG_CFG = {
    DECOR_SRC: 'image/decor/',
    DECORS: [{"sprite":8,"z":0,"x":3717,"y":1499,"w":24,"h":17},{"sprite":8,"z":1,"x":3859,"y":1846,"w":24,"h":17},{"sprite":8,"z":2,"x":3747,"y":1993,"w":24,"h":17},{"sprite":8,"z":3,"x":3931,"y":1654,"w":24,"h":17},{"sprite":8,"z":4,"x":3795,"y":1923,"w":24,"h":17},{"sprite":8,"z":5,"x":3259,"y":2105,"w":24,"h":17},{"sprite":8,"z":6,"x":1980,"y":332,"w":24,"h":17},{"sprite":8,"z":7,"x":1843,"y":353,"w":24,"h":17},{"sprite":8,"z":8,"x":1800,"y":373,"w":24,"h":17},{"sprite":8,"z":9,"x":1748,"y":297,"w":22,"h":16},{"sprite":8,"z":10,"x":1686,"y":281,"w":24,"h":17},{"sprite":8,"z":11,"x":3886,"y":878,"w":24,"h":17},{"sprite":8,"z":12,"x":3823,"y":899,"w":24,"h":17},{"sprite":8,"z":13,"x":3755,"y":925,"w":24,"h":17},{"sprite":8,"z":14,"x":3642,"y":931,"w":24,"h":17},{"sprite":8,"z":15,"x":3525,"y":920,"w":24,"h":17},{"sprite":8,"z":16,"x":3428,"y":940,"w":24,"h":17},{"sprite":8,"z":17,"x":3344,"y":970,"w":24,"h":17},{"sprite":8,"z":18,"x":3211,"y":1095,"w":24,"h":17},{"sprite":8,"z":19,"x":2928,"y":1291,"w":24,"h":17},{"sprite":8,"z":20,"x":2802,"y":1327,"w":24,"h":17},{"sprite":8,"z":21,"x":2268,"y":1362,"w":24,"h":17},{"sprite":8,"z":22,"x":2182,"y":1618,"w":24,"h":17},{"sprite":8,"z":23,"x":1441,"y":2014,"w":24,"h":17},{"sprite":8,"z":24,"x":806,"y":673,"w":24,"h":17},{"sprite":8,"z":25,"x":801,"y":579,"w":24,"h":17},{"sprite":8,"z":26,"x":433,"y":1950,"w":24,"h":17},{"sprite":8,"z":27,"x":512,"y":1887,"w":24,"h":17},{"sprite":8,"z":28,"x":474,"y":1528,"w":24,"h":17},{"sprite":8,"z":29,"x":425,"y":1411,"w":24,"h":17},{"sprite":8,"z":30,"x":666,"y":1147,"w":24,"h":17},{"sprite":8,"z":31,"x":678,"y":1064,"w":24,"h":17},{"sprite":2,"z":32,"x":2567,"y":1838,"w":175,"h":155},{"sprite":2,"z":33,"x":2306,"y":1670,"w":153,"h":136},{"sprite":3,"z":37,"x":2795,"y":635,"w":197,"h":170},{"sprite":3,"z":38,"x":2649,"y":640,"w":150,"h":130},{"sprite":37,"z":39,"x":3426,"y":1566,"w":190,"h":183},{"sprite":35,"z":40,"x":3531,"y":1725,"w":100,"h":214},{"sprite":37,"z":41,"x":3885,"y":1877,"w":190,"h":183},{"sprite":21,"z":48,"x":658,"y":691,"w":144,"h":166},{"sprite":21,"z":49,"x":558,"y":721,"w":196,"h":226},{"sprite":21,"z":50,"x":633,"y":797,"w":179,"h":206},{"sprite":21,"z":51,"x":545,"y":777,"w":162,"h":187},{"sprite":21,"z":52,"x":432,"y":687,"w":173,"h":199},{"sprite":21,"z":53,"x":319,"y":661,"w":174,"h":200},{"sprite":21,"z":54,"x":237,"y":538,"w":140,"h":161},{"sprite":21,"z":55,"x":226,"y":631,"w":154,"h":178},{"sprite":21,"z":56,"x":160,"y":447,"w":147,"h":170},{"sprite":21,"z":57,"x":58,"y":454,"w":162,"h":187},{"sprite":21,"z":58,"x":34,"y":581,"w":198,"h":228},{"sprite":21,"z":59,"x":148,"y":558,"w":146,"h":169},{"sprite":21,"z":60,"x":100,"y":672,"w":167,"h":193},{"sprite":21,"z":61,"x":105,"y":667,"w":194,"h":223},{"sprite":21,"z":62,"x":413,"y":783,"w":174,"h":200},{"sprite":21,"z":63,"x":481,"y":859,"w":232,"h":267},{"sprite":21,"z":64,"x":291,"y":752,"w":147,"h":169},{"sprite":21,"z":65,"x":205,"y":704,"w":171,"h":197},{"sprite":21,"z":66,"x":19,"y":670,"w":157,"h":181},{"sprite":7,"z":69,"x":1074,"y":419,"w":47,"h":42},{"sprite":7,"z":70,"x":681,"y":1180,"w":165,"h":148},{"sprite":7,"z":71,"x":146,"y":602,"w":47,"h":42},{"sprite":1,"z":129,"x":528,"y":426,"w":42,"h":27},{"sprite":5,"z":130,"x":1221,"y":690,"w":60,"h":81},{"sprite":24,"z":131,"x":848,"y":309,"w":50,"h":57},{"sprite":27,"z":132,"x":695,"y":158,"w":40,"h":47},{"sprite":29,"z":133,"x":900,"y":142,"w":75,"h":52},{"sprite":27,"z":134,"x":787,"y":170,"w":27,"h":32},{"sprite":28,"z":135,"x":680,"y":253,"w":39,"h":32},{"sprite":8,"z":136,"x":101,"y":299,"w":45,"h":32},{"sprite":8,"z":137,"x":153,"y":309,"w":37,"h":26},{"sprite":8,"z":138,"x":202,"y":338,"w":43,"h":31},{"sprite":21,"z":139,"x":832,"y":841,"w":159,"h":183},{"sprite":21,"z":140,"x":872,"y":882,"w":141,"h":162},{"sprite":21,"z":141,"x":1021,"y":362,"w":132,"h":152},{"sprite":21,"z":142,"x":1105,"y":362,"w":135,"h":156},{"sprite":7,"z":143,"x":1045,"y":376,"w":64,"h":57},{"sprite":7,"z":144,"x":960,"y":466,"w":47,"h":42},{"sprite":7,"z":145,"x":1055,"y":492,"w":47,"h":42},{"sprite":21,"z":146,"x":1013,"y":461,"w":153,"h":176},{"sprite":21,"z":147,"x":961,"y":483,"w":140,"h":162},{"sprite":21,"z":148,"x":872,"y":502,"w":111,"h":128},{"sprite":21,"z":149,"x":853,"y":559,"w":111,"h":128},{"sprite":21,"z":150,"x":962,"y":536,"w":111,"h":128},{"sprite":21,"z":151,"x":959,"y":583,"w":147,"h":170},{"sprite":9,"z":152,"x":835,"y":606,"w":41,"h":35},{"sprite":21,"z":153,"x":1027,"y":572,"w":138,"h":159},{"sprite":21,"z":154,"x":864,"y":620,"w":111,"h":128},{"sprite":21,"z":155,"x":951,"y":617,"w":116,"h":133},{"sprite":21,"z":156,"x":1128,"y":425,"w":140,"h":161},{"sprite":21,"z":157,"x":1134,"y":489,"w":128,"h":147},{"sprite":21,"z":158,"x":1112,"y":575,"w":160,"h":184},{"sprite":21,"z":159,"x":593,"y":1093,"w":152,"h":175},{"sprite":21,"z":160,"x":63,"y":1171,"w":316,"h":363},{"sprite":21,"z":161,"x":192,"y":1171,"w":264,"h":304},{"sprite":21,"z":162,"x":55,"y":1283,"w":186,"h":214},{"sprite":21,"z":163,"x":208,"y":1248,"w":247,"h":284},{"sprite":21,"z":164,"x":384,"y":1225,"w":261,"h":301},{"sprite":21,"z":165,"x":230,"y":1323,"w":205,"h":236},{"sprite":21,"z":166,"x":73,"y":1407,"w":210,"h":242},{"sprite":21,"z":167,"x":543,"y":1207,"w":226,"h":260},{"sprite":21,"z":168,"x":657,"y":1129,"w":156,"h":180},{"sprite":21,"z":169,"x":385,"y":1335,"w":147,"h":169},{"sprite":21,"z":170,"x":624,"y":1239,"w":185,"h":212},{"sprite":7,"z":171,"x":1196,"y":888,"w":168,"h":150},{"sprite":7,"z":172,"x":1314,"y":907,"w":186,"h":167},{"sprite":7,"z":173,"x":1250,"y":962,"w":147,"h":132},{"sprite":7,"z":174,"x":1130,"y":970,"w":173,"h":156},{"sprite":7,"z":175,"x":1034,"y":1022,"w":151,"h":136},{"sprite":7,"z":176,"x":1385,"y":1016,"w":150,"h":135},{"sprite":7,"z":177,"x":1332,"y":1006,"w":116,"h":105},{"sprite":7,"z":178,"x":936,"y":1065,"w":159,"h":143},{"sprite":7,"z":179,"x":1057,"y":1110,"w":178,"h":160},{"sprite":8,"z":180,"x":1423,"y":1081,"w":51,"h":36},{"sprite":7,"z":182,"x":1306,"y":1071,"w":149,"h":133},{"sprite":7,"z":183,"x":1206,"y":1115,"w":153,"h":137},{"sprite":7,"z":184,"x":838,"y":1088,"w":146,"h":131},{"sprite":7,"z":185,"x":764,"y":1122,"w":89,"h":80},{"sprite":7,"z":186,"x":816,"y":1186,"w":166,"h":149},{"sprite":7,"z":187,"x":720,"y":1173,"w":66,"h":60},{"sprite":21,"z":188,"x":534,"y":1299,"w":166,"h":192},{"sprite":7,"z":190,"x":1142,"y":1049,"w":147,"h":132},{"sprite":7,"z":191,"x":901,"y":1226,"w":132,"h":119},{"sprite":7,"z":192,"x":985,"y":1225,"w":112,"h":100},{"sprite":7,"z":193,"x":1076,"y":1176,"w":180,"h":161},{"sprite":7,"z":194,"x":1004,"y":1301,"w":157,"h":141},{"sprite":7,"z":195,"x":897,"y":1292,"w":150,"h":135},{"sprite":7,"z":196,"x":883,"y":1387,"w":167,"h":150},{"sprite":7,"z":197,"x":990,"y":1384,"w":166,"h":149},{"sprite":7,"z":198,"x":1244,"y":1179,"w":167,"h":150},{"sprite":7,"z":199,"x":1361,"y":1145,"w":140,"h":125},{"sprite":7,"z":200,"x":795,"y":1456,"w":148,"h":133},{"sprite":7,"z":201,"x":733,"y":1485,"w":135,"h":121},{"sprite":7,"z":202,"x":770,"y":1561,"w":147,"h":132},{"sprite":7,"z":203,"x":752,"y":1653,"w":141,"h":127},{"sprite":7,"z":204,"x":864,"y":1522,"w":143,"h":129},{"sprite":7,"z":205,"x":931,"y":1461,"w":158,"h":141},{"sprite":7,"z":206,"x":956,"y":1566,"w":152,"h":136},{"sprite":7,"z":207,"x":1118,"y":1276,"w":159,"h":143},{"sprite":7,"z":208,"x":1389,"y":1232,"w":140,"h":126},{"sprite":7,"z":209,"x":1438,"y":1287,"w":140,"h":126},{"sprite":7,"z":210,"x":1213,"y":1274,"w":140,"h":126},{"sprite":7,"z":211,"x":1308,"y":1235,"w":126,"h":113},{"sprite":7,"z":212,"x":1344,"y":1296,"w":122,"h":109},{"sprite":7,"z":214,"x":1072,"y":1351,"w":140,"h":126},{"sprite":7,"z":215,"x":1166,"y":1357,"w":140,"h":126},{"sprite":7,"z":216,"x":1049,"y":1454,"w":140,"h":126},{"sprite":7,"z":217,"x":1018,"y":1514,"w":140,"h":126},{"sprite":7,"z":218,"x":1128,"y":1434,"w":140,"h":126},{"sprite":7,"z":219,"x":1233,"y":1436,"w":140,"h":126},{"sprite":7,"z":220,"x":1116,"y":1510,"w":140,"h":126},{"sprite":7,"z":221,"x":1318,"y":1434,"w":140,"h":126},{"sprite":7,"z":222,"x":1389,"y":1360,"w":140,"h":126},{"sprite":7,"z":223,"x":1458,"y":1349,"w":140,"h":126},{"sprite":7,"z":224,"x":1424,"y":1446,"w":140,"h":126},{"sprite":7,"z":225,"x":1231,"y":1483,"w":140,"h":126},{"sprite":7,"z":226,"x":1346,"y":1497,"w":140,"h":126},{"sprite":7,"z":227,"x":1228,"y":1544,"w":140,"h":126},{"sprite":7,"z":228,"x":834,"y":1585,"w":140,"h":126},{"sprite":7,"z":229,"x":799,"y":1712,"w":173,"h":155},{"sprite":5,"z":230,"x":787,"y":1835,"w":64,"h":85},{"sprite":7,"z":231,"x":1312,"y":1609,"w":140,"h":126},{"sprite":7,"z":233,"x":918,"y":1670,"w":140,"h":126},{"sprite":7,"z":234,"x":1114,"y":1814,"w":140,"h":126},{"sprite":7,"z":235,"x":1194,"y":1799,"w":140,"h":125},{"sprite":7,"z":236,"x":1323,"y":1701,"w":140,"h":126},{"sprite":7,"z":237,"x":1268,"y":1757,"w":140,"h":126},{"sprite":7,"z":238,"x":1442,"y":1527,"w":140,"h":126},{"sprite":7,"z":239,"x":1423,"y":1602,"w":140,"h":126},{"sprite":7,"z":240,"x":1405,"y":1667,"w":140,"h":126},{"sprite":7,"z":241,"x":1072,"y":1885,"w":140,"h":126},{"sprite":7,"z":242,"x":1179,"y":1917,"w":140,"h":126},{"sprite":7,"z":243,"x":1236,"y":1866,"w":140,"h":126},{"sprite":7,"z":244,"x":1524,"y":1592,"w":140,"h":126},{"sprite":7,"z":245,"x":1331,"y":1835,"w":140,"h":126},{"sprite":7,"z":246,"x":1417,"y":1728,"w":126,"h":113},{"sprite":7,"z":247,"x":1525,"y":1686,"w":168,"h":151},{"sprite":7,"z":248,"x":1427,"y":1800,"w":140,"h":126},{"sprite":7,"z":249,"x":53,"y":1493,"w":217,"h":195},{"sprite":7,"z":250,"x":235,"y":1386,"w":140,"h":126},{"sprite":21,"z":251,"x":176,"y":1624,"w":246,"h":283},{"sprite":21,"z":252,"x":56,"y":1658,"w":222,"h":256},{"sprite":21,"z":254,"x":297,"y":1684,"w":222,"h":256},{"sprite":21,"z":255,"x":110,"y":1757,"w":222,"h":256},{"sprite":21,"z":256,"x":-4,"y":1879,"w":222,"h":256},{"sprite":21,"z":257,"x":473,"y":1641,"w":222,"h":256},{"sprite":21,"z":258,"x":345,"y":1774,"w":222,"h":256},{"sprite":21,"z":259,"x":442,"y":1765,"w":222,"h":256},{"sprite":21,"z":262,"x":3,"y":2022,"w":222,"h":256},{"sprite":7,"z":263,"x":117,"y":1820,"w":139,"h":125},{"sprite":7,"z":264,"x":93,"y":1913,"w":94,"h":84},{"sprite":7,"z":265,"x":163,"y":1878,"w":94,"h":84},{"sprite":7,"z":266,"x":214,"y":1812,"w":94,"h":84},{"sprite":7,"z":267,"x":59,"y":2204,"w":148,"h":132},{"sprite":7,"z":268,"x":198,"y":1931,"w":136,"h":122},{"sprite":7,"z":269,"x":259,"y":1860,"w":94,"h":84},{"sprite":7,"z":270,"x":341,"y":1831,"w":133,"h":120},{"sprite":7,"z":271,"x":397,"y":1875,"w":120,"h":108},{"sprite":7,"z":272,"x":62,"y":2059,"w":94,"h":84},{"sprite":7,"z":273,"x":-4,"y":2111,"w":165,"h":148},{"sprite":7,"z":274,"x":435,"y":1923,"w":94,"h":84},{"sprite":7,"z":276,"x":240,"y":2260,"w":176,"h":158},{"sprite":7,"z":277,"x":33,"y":2304,"w":138,"h":124},{"sprite":7,"z":278,"x":126,"y":2254,"w":134,"h":120},{"sprite":7,"z":280,"x":229,"y":2382,"w":152,"h":136},{"sprite":7,"z":281,"x":42,"y":2407,"w":149,"h":133},{"sprite":7,"z":282,"x":409,"y":2295,"w":205,"h":184},{"sprite":7,"z":283,"x":358,"y":2386,"w":173,"h":155},{"sprite":7,"z":284,"x":520,"y":1892,"w":140,"h":125},{"sprite":7,"z":285,"x":607,"y":1960,"w":163,"h":146},{"sprite":7,"z":286,"x":684,"y":2063,"w":222,"h":200},{"sprite":7,"z":287,"x":794,"y":2105,"w":170,"h":153},{"sprite":7,"z":288,"x":667,"y":2152,"w":183,"h":164},{"sprite":7,"z":289,"x":580,"y":2196,"w":143,"h":128},{"sprite":7,"z":290,"x":539,"y":2274,"w":154,"h":139},{"sprite":7,"z":291,"x":493,"y":2358,"w":162,"h":145},{"sprite":7,"z":292,"x":773,"y":2210,"w":165,"h":148},{"sprite":7,"z":293,"x":773,"y":2291,"w":140,"h":126},{"sprite":7,"z":294,"x":824,"y":2353,"w":127,"h":114},{"sprite":7,"z":296,"x":600,"y":2376,"w":178,"h":160},{"sprite":7,"z":297,"x":727,"y":2371,"w":118,"h":106},{"sprite":7,"z":298,"x":890,"y":2145,"w":151,"h":136},{"sprite":7,"z":299,"x":881,"y":2244,"w":168,"h":151},{"sprite":7,"z":300,"x":998,"y":2124,"w":131,"h":117},{"sprite":7,"z":301,"x":971,"y":2209,"w":148,"h":133},{"sprite":7,"z":302,"x":908,"y":2351,"w":129,"h":116},{"sprite":7,"z":303,"x":999,"y":2297,"w":129,"h":116},{"sprite":7,"z":304,"x":1095,"y":2156,"w":150,"h":135},{"sprite":7,"z":305,"x":1187,"y":2157,"w":129,"h":116},{"sprite":7,"z":306,"x":1286,"y":2153,"w":129,"h":116},{"sprite":7,"z":307,"x":1375,"y":2116,"w":129,"h":116},{"sprite":7,"z":308,"x":1098,"y":2257,"w":129,"h":116},{"sprite":7,"z":309,"x":1010,"y":2377,"w":129,"h":116},{"sprite":7,"z":310,"x":1111,"y":2341,"w":129,"h":116},{"sprite":7,"z":311,"x":1194,"y":2233,"w":129,"h":116},{"sprite":7,"z":312,"x":1219,"y":2326,"w":129,"h":116},{"sprite":7,"z":313,"x":1195,"y":2396,"w":129,"h":116},{"sprite":7,"z":314,"x":1297,"y":2239,"w":129,"h":116},{"sprite":7,"z":315,"x":1386,"y":2192,"w":129,"h":116},{"sprite":7,"z":316,"x":1500,"y":2155,"w":129,"h":116},{"sprite":7,"z":317,"x":1471,"y":2220,"w":129,"h":116},{"sprite":7,"z":318,"x":1595,"y":2161,"w":129,"h":116},{"sprite":7,"z":319,"x":1568,"y":2226,"w":129,"h":116},{"sprite":7,"z":320,"x":1365,"y":2271,"w":129,"h":116},{"sprite":7,"z":321,"x":1312,"y":2326,"w":129,"h":116},{"sprite":7,"z":322,"x":1416,"y":2345,"w":129,"h":116},{"sprite":7,"z":323,"x":1491,"y":2282,"w":129,"h":116},{"sprite":7,"z":324,"x":1658,"y":2221,"w":129,"h":116},{"sprite":7,"z":325,"x":1613,"y":2329,"w":152,"h":137},{"sprite":7,"z":326,"x":1506,"y":2377,"w":129,"h":116},{"sprite":7,"z":327,"x":1691,"y":2357,"w":127,"h":114},{"sprite":21,"z":328,"x":1048,"y":624,"w":147,"h":169},{"sprite":7,"z":329,"x":231,"y":442,"w":82,"h":74},{"sprite":21,"z":330,"x":683,"y":843,"w":155,"h":178},{"sprite":21,"z":331,"x":697,"y":934,"w":111,"h":128},{"sprite":21,"z":332,"x":763,"y":900,"w":111,"h":128},{"sprite":6,"z":333,"x":1602,"y":312,"w":160,"h":133},{"sprite":6,"z":334,"x":1809,"y":223,"w":137,"h":114},{"sprite":6,"z":335,"x":1717,"y":273,"w":155,"h":129},{"sprite":6,"z":336,"x":1567,"y":369,"w":135,"h":112},{"sprite":6,"z":337,"x":1609,"y":421,"w":135,"h":112},{"sprite":6,"z":339,"x":1556,"y":490,"w":147,"h":122},{"sprite":6,"z":340,"x":1558,"y":531,"w":130,"h":108},{"sprite":6,"z":341,"x":1683,"y":370,"w":135,"h":112},{"sprite":6,"z":342,"x":1630,"y":469,"w":135,"h":112},{"sprite":6,"z":343,"x":1787,"y":336,"w":135,"h":112},{"sprite":6,"z":345,"x":1695,"y":423,"w":101,"h":83},{"sprite":6,"z":346,"x":1843,"y":276,"w":135,"h":112},{"sprite":6,"z":347,"x":1956,"y":286,"w":152,"h":126},{"sprite":6,"z":348,"x":1848,"y":333,"w":135,"h":112},{"sprite":6,"z":350,"x":2014,"y":325,"w":135,"h":112},{"sprite":6,"z":351,"x":1643,"y":701,"w":135,"h":112},{"sprite":6,"z":352,"x":1718,"y":641,"w":135,"h":112},{"sprite":6,"z":353,"x":1908,"y":560,"w":181,"h":150},{"sprite":6,"z":354,"x":1692,"y":733,"w":135,"h":112},{"sprite":6,"z":355,"x":1808,"y":593,"w":159,"h":131},{"sprite":6,"z":356,"x":1774,"y":699,"w":135,"h":112},{"sprite":6,"z":357,"x":1844,"y":756,"w":135,"h":112},{"sprite":6,"z":358,"x":2006,"y":542,"w":135,"h":112},{"sprite":6,"z":359,"x":2108,"y":514,"w":143,"h":118},{"sprite":6,"z":360,"x":1867,"y":653,"w":135,"h":112},{"sprite":6,"z":361,"x":1968,"y":619,"w":135,"h":112},{"sprite":6,"z":362,"x":1927,"y":715,"w":135,"h":112},{"sprite":6,"z":363,"x":2070,"y":588,"w":135,"h":112},{"sprite":6,"z":364,"x":2010,"y":672,"w":135,"h":112},{"sprite":21,"z":366,"x":610,"y":908,"w":156,"h":179},{"sprite":26,"z":377,"x":3069,"y":441,"w":68,"h":56},{"sprite":26,"z":378,"x":3051,"y":477,"w":62,"h":51},{"sprite":25,"z":379,"x":3010,"y":507,"w":77,"h":64},{"sprite":25,"z":380,"x":2998,"y":538,"w":73,"h":61},{"sprite":26,"z":381,"x":3042,"y":499,"w":74,"h":62},{"sprite":26,"z":382,"x":2982,"y":589,"w":74,"h":62},{"sprite":26,"z":383,"x":3012,"y":608,"w":74,"h":62},{"sprite":26,"z":384,"x":3023,"y":567,"w":74,"h":62},{"sprite":26,"z":385,"x":3051,"y":541,"w":74,"h":62},{"sprite":26,"z":386,"x":3057,"y":621,"w":74,"h":62},{"sprite":26,"z":387,"x":3058,"y":585,"w":74,"h":62},{"sprite":34,"z":388,"x":3119,"y":1703,"w":118,"h":134},{"sprite":38,"z":389,"x":3259,"y":2106,"w":96,"h":133},{"sprite":35,"z":390,"x":3441,"y":1703,"w":100,"h":214},{"sprite":35,"z":391,"x":4144,"y":1765,"w":100,"h":214},{"sprite":36,"z":392,"x":3812,"y":1959,"w":161,"h":197},{"sprite":37,"z":393,"x":3513,"y":1482,"w":190,"h":183},{"sprite":38,"z":394,"x":3954,"y":1641,"w":96,"h":133},{"sprite":36,"z":395,"x":4215,"y":1368,"w":161,"h":197},{"sprite":34,"z":396,"x":3652,"y":1626,"w":118,"h":134},{"sprite":37,"z":397,"x":3916,"y":1990,"w":190,"h":183},{"sprite":34,"z":398,"x":3926,"y":2056,"w":118,"h":134},{"sprite":35,"z":399,"x":3401,"y":1717,"w":100,"h":214},{"sprite":35,"z":400,"x":3443,"y":1768,"w":100,"h":214},{"sprite":38,"z":401,"x":3987,"y":1663,"w":96,"h":133},{"sprite":38,"z":402,"x":3953,"y":1661,"w":100,"h":138},{"sprite":39,"z":403,"x":3344,"y":1774,"w":128,"h":148},{"sprite":3,"z":413,"x":1906,"y":977,"w":164,"h":142},{"sprite":3,"z":414,"x":2006,"y":940,"w":171,"h":148},{"sprite":3,"z":415,"x":2218,"y":838,"w":176,"h":152},{"sprite":3,"z":416,"x":2127,"y":881,"w":161,"h":139},{"sprite":3,"z":417,"x":2113,"y":971,"w":159,"h":137},{"sprite":3,"z":418,"x":2419,"y":720,"w":150,"h":130},{"sprite":3,"z":419,"x":2295,"y":743,"w":151,"h":131},{"sprite":3,"z":420,"x":2360,"y":799,"w":150,"h":130},{"sprite":3,"z":423,"x":2520,"y":680,"w":150,"h":130},{"sprite":3,"z":424,"x":2483,"y":784,"w":150,"h":130},{"sprite":3,"z":425,"x":2606,"y":728,"w":176,"h":152},{"sprite":3,"z":430,"x":2823,"y":758,"w":178,"h":154},{"sprite":3,"z":431,"x":2697,"y":788,"w":159,"h":137},{"sprite":2,"z":432,"x":2965,"y":749,"w":150,"h":133},{"sprite":2,"z":433,"x":2900,"y":818,"w":163,"h":144},{"sprite":2,"z":434,"x":3067,"y":816,"w":158,"h":140},{"sprite":2,"z":435,"x":3223,"y":805,"w":165,"h":147},{"sprite":2,"z":437,"x":2994,"y":888,"w":150,"h":133},{"sprite":2,"z":438,"x":3095,"y":924,"w":150,"h":133},{"sprite":2,"z":439,"x":3040,"y":1014,"w":163,"h":145},{"sprite":2,"z":440,"x":3203,"y":911,"w":150,"h":133},{"sprite":2,"z":441,"x":3145,"y":1009,"w":167,"h":148},{"sprite":2,"z":442,"x":3302,"y":878,"w":150,"h":133},{"sprite":2,"z":443,"x":3285,"y":992,"w":150,"h":133},{"sprite":2,"z":444,"x":3283,"y":1096,"w":150,"h":133},{"sprite":2,"z":445,"x":3164,"y":1080,"w":150,"h":133},{"sprite":4,"z":446,"x":3430,"y":835,"w":144,"h":131},{"sprite":4,"z":447,"x":3400,"y":928,"w":162,"h":147},{"sprite":4,"z":448,"x":3408,"y":1032,"w":152,"h":138},{"sprite":4,"z":449,"x":3514,"y":778,"w":144,"h":131},{"sprite":4,"z":450,"x":3589,"y":697,"w":144,"h":131},{"sprite":4,"z":451,"x":3686,"y":677,"w":144,"h":131},{"sprite":4,"z":452,"x":3631,"y":779,"w":144,"h":131},{"sprite":4,"z":453,"x":3707,"y":821,"w":144,"h":131},{"sprite":4,"z":455,"x":3536,"y":1023,"w":158,"h":143},{"sprite":4,"z":456,"x":3641,"y":996,"w":164,"h":149},{"sprite":4,"z":457,"x":3753,"y":991,"w":147,"h":133},{"sprite":4,"z":458,"x":3839,"y":942,"w":144,"h":131},{"sprite":4,"z":459,"x":3771,"y":610,"w":157,"h":142},{"sprite":4,"z":460,"x":3891,"y":577,"w":144,"h":131},{"sprite":4,"z":461,"x":4014,"y":586,"w":144,"h":131},{"sprite":4,"z":462,"x":3775,"y":736,"w":141,"h":129},{"sprite":4,"z":463,"x":3900,"y":675,"w":158,"h":143},{"sprite":4,"z":465,"x":4130,"y":571,"w":144,"h":131},{"sprite":4,"z":466,"x":4245,"y":587,"w":147,"h":133},{"sprite":4,"z":468,"x":4125,"y":673,"w":153,"h":139},{"sprite":4,"z":469,"x":4201,"y":762,"w":182,"h":165},{"sprite":4,"z":471,"x":3942,"y":882,"w":144,"h":131},{"sprite":4,"z":473,"x":3871,"y":1035,"w":144,"h":131},{"sprite":4,"z":474,"x":4013,"y":1001,"w":144,"h":131},{"sprite":4,"z":475,"x":4304,"y":692,"w":167,"h":151},{"sprite":4,"z":476,"x":4363,"y":585,"w":144,"h":131},{"sprite":4,"z":477,"x":4450,"y":660,"w":210,"h":190},{"sprite":4,"z":478,"x":4415,"y":769,"w":197,"h":179},{"sprite":4,"z":479,"x":4055,"y":871,"w":165,"h":150},{"sprite":4,"z":480,"x":4197,"y":857,"w":184,"h":167},{"sprite":4,"z":481,"x":4119,"y":955,"w":144,"h":131},{"sprite":4,"z":482,"x":4117,"y":1062,"w":144,"h":131},{"sprite":4,"z":483,"x":4144,"y":1137,"w":144,"h":131},{"sprite":4,"z":485,"x":4293,"y":901,"w":144,"h":131},{"sprite":4,"z":487,"x":4429,"y":878,"w":151,"h":137},{"sprite":4,"z":488,"x":4379,"y":972,"w":144,"h":131},{"sprite":4,"z":489,"x":4300,"y":979,"w":144,"h":131},{"sprite":4,"z":491,"x":4241,"y":1065,"w":164,"h":149},{"sprite":4,"z":492,"x":4356,"y":1059,"w":144,"h":131},{"sprite":4,"z":493,"x":4477,"y":986,"w":185,"h":168},{"sprite":4,"z":494,"x":4431,"y":1119,"w":190,"h":173},{"sprite":4,"z":495,"x":4457,"y":1227,"w":144,"h":131},{"sprite":4,"z":496,"x":4475,"y":1309,"w":148,"h":134},{"sprite":4,"z":497,"x":4475,"y":1408,"w":144,"h":131},{"sprite":4,"z":498,"x":4514,"y":1545,"w":199,"h":180},{"sprite":34,"z":499,"x":3979,"y":1067,"w":135,"h":153},{"sprite":35,"z":500,"x":4284,"y":1105,"w":88,"h":188},{"sprite":37,"z":501,"x":3441,"y":1067,"w":183,"h":176},{"sprite":34,"z":502,"x":3602,"y":1055,"w":159,"h":180},{"sprite":39,"z":503,"x":3734,"y":1022,"w":113,"h":130},{"sprite":35,"z":504,"x":3864,"y":1048,"w":65,"h":139},{"sprite":36,"z":505,"x":4088,"y":1162,"w":131,"h":159},{"sprite":23,"z":506,"x":4166,"y":1187,"w":65,"h":57},{"sprite":12,"z":507,"x":2190,"y":1493,"w":112,"h":98},{"sprite":12,"z":508,"x":2283,"y":1432,"w":126,"h":110},{"sprite":12,"z":509,"x":2253,"y":1487,"w":112,"h":98},{"sprite":3,"z":510,"x":2063,"y":1260,"w":147,"h":127},{"sprite":3,"z":513,"x":2219,"y":1879,"w":167,"h":145},{"sprite":3,"z":514,"x":2110,"y":1951,"w":181,"h":156},{"sprite":3,"z":515,"x":2199,"y":2020,"w":184,"h":159},{"sprite":3,"z":516,"x":2051,"y":2108,"w":183,"h":158},{"sprite":34,"z":518,"x":3255,"y":1306,"w":158,"h":178},{"sprite":3,"z":519,"x":2344,"y":1966,"w":210,"h":181},{"sprite":3,"z":520,"x":2479,"y":1963,"w":211,"h":182},{"sprite":3,"z":521,"x":2083,"y":2258,"w":198,"h":171},{"sprite":3,"z":522,"x":2329,"y":2105,"w":195,"h":168},{"sprite":3,"z":523,"x":2197,"y":2196,"w":216,"h":186},{"sprite":3,"z":524,"x":2176,"y":2339,"w":214,"h":185},{"sprite":3,"z":525,"x":2616,"y":1971,"w":194,"h":168},{"sprite":3,"z":526,"x":2707,"y":1964,"w":180,"h":155},{"sprite":3,"z":527,"x":2596,"y":2077,"w":165,"h":143},{"sprite":3,"z":528,"x":2754,"y":2097,"w":200,"h":173},{"sprite":20,"z":529,"x":3338,"y":2029,"w":36,"h":40},{"sprite":20,"z":530,"x":3403,"y":2014,"w":35,"h":39},{"sprite":20,"z":531,"x":3466,"y":1998,"w":35,"h":39},{"sprite":20,"z":532,"x":3530,"y":1979,"w":33,"h":37},{"sprite":20,"z":533,"x":3588,"y":1962,"w":32,"h":36},{"sprite":20,"z":534,"x":3652,"y":1931,"w":32,"h":36},{"sprite":20,"z":535,"x":3699,"y":1905,"w":30,"h":33},{"sprite":20,"z":536,"x":3735,"y":1877,"w":30,"h":33},{"sprite":20,"z":537,"x":3760,"y":1833,"w":30,"h":33},{"sprite":20,"z":538,"x":3775,"y":1790,"w":29,"h":32},{"sprite":20,"z":539,"x":3794,"y":1732,"w":28,"h":31},{"sprite":20,"z":540,"x":3801,"y":1657,"w":25,"h":29},{"sprite":20,"z":541,"x":3775,"y":1598,"w":24,"h":27},{"sprite":20,"z":542,"x":3735,"y":1552,"w":23,"h":26},{"sprite":33,"z":543,"x":3716,"y":1502,"w":38,"h":39},{"sprite":23,"z":544,"x":4102,"y":1510,"w":116,"h":102},{"sprite":29,"z":545,"x":670,"y":298,"w":87,"h":60},{"sprite":28,"z":546,"x":575,"y":341,"w":28,"h":23},{"sprite":28,"z":547,"x":686,"y":385,"w":28,"h":23},{"sprite":22,"z":548,"x":526,"y":236,"w":37,"h":45},{"sprite":22,"z":549,"x":263,"y":134,"w":28,"h":34},{"sprite":29,"z":550,"x":116,"y":168,"w":87,"h":60},{"sprite":22,"z":551,"x":2001,"y":69,"w":68,"h":82},{"sprite":24,"z":552,"x":4243,"y":471,"w":31,"h":35},{"sprite":24,"z":553,"x":3357,"y":270,"w":31,"h":35},{"sprite":27,"z":554,"x":3918,"y":422,"w":25,"h":30},{"sprite":27,"z":555,"x":3281,"y":187,"w":25,"h":30},{"sprite":22,"z":556,"x":4338,"y":414,"w":41,"h":50},{"sprite":29,"z":557,"x":3604,"y":343,"w":87,"h":60},{"sprite":29,"z":558,"x":3091,"y":338,"w":128,"h":88},{"sprite":28,"z":559,"x":2899,"y":170,"w":28,"h":23},{"sprite":24,"z":560,"x":3828,"y":339,"w":31,"h":35},{"sprite":29,"z":561,"x":4013,"y":419,"w":87,"h":60},{"sprite":3,"z":568,"x":2446,"y":2178,"w":168,"h":145},{"sprite":3,"z":569,"x":2360,"y":2286,"w":212,"h":183},{"sprite":3,"z":571,"x":2107,"y":1330,"w":173,"h":149},{"sprite":3,"z":572,"x":2201,"y":1332,"w":150,"h":130},{"sprite":3,"z":573,"x":2110,"y":1433,"w":189,"h":163},{"sprite":3,"z":574,"x":2335,"y":1259,"w":206,"h":178},{"sprite":2,"z":575,"x":2475,"y":987,"w":176,"h":157},{"sprite":2,"z":576,"x":2371,"y":1067,"w":206,"h":183},{"sprite":2,"z":577,"x":2593,"y":966,"w":170,"h":151},{"sprite":2,"z":578,"x":2491,"y":1092,"w":183,"h":162},{"sprite":2,"z":580,"x":2469,"y":1298,"w":179,"h":159},{"sprite":2,"z":581,"x":2610,"y":1290,"w":150,"h":133},{"sprite":2,"z":582,"x":2729,"y":984,"w":150,"h":133},{"sprite":2,"z":583,"x":2633,"y":1058,"w":181,"h":161},{"sprite":2,"z":584,"x":2594,"y":1183,"w":172,"h":153},{"sprite":2,"z":585,"x":2732,"y":1142,"w":150,"h":133},{"sprite":2,"z":586,"x":2796,"y":1081,"w":150,"h":133},{"sprite":2,"z":587,"x":2738,"y":1250,"w":162,"h":144},{"sprite":2,"z":588,"x":2849,"y":1180,"w":150,"h":133},{"sprite":2,"z":589,"x":2316,"y":1789,"w":150,"h":133},{"sprite":2,"z":590,"x":2444,"y":1706,"w":211,"h":187},{"sprite":2,"z":591,"x":2436,"y":1812,"w":150,"h":133},{"sprite":2,"z":593,"x":2553,"y":1592,"w":175,"h":155},{"sprite":2,"z":594,"x":2659,"y":1536,"w":175,"h":155},{"sprite":2,"z":595,"x":2745,"y":1332,"w":175,"h":155},{"sprite":2,"z":596,"x":2731,"y":1438,"w":175,"h":155},{"sprite":2,"z":597,"x":2606,"y":1722,"w":175,"h":155},{"sprite":2,"z":598,"x":2713,"y":1632,"w":175,"h":155},{"sprite":2,"z":599,"x":2855,"y":1577,"w":175,"h":155},{"sprite":2,"z":600,"x":2877,"y":1458,"w":175,"h":155},{"sprite":2,"z":601,"x":2871,"y":1285,"w":175,"h":155},{"sprite":2,"z":602,"x":2759,"y":1768,"w":175,"h":155},{"sprite":2,"z":603,"x":2865,"y":1709,"w":175,"h":155},{"sprite":8,"z":604,"x":448,"y":465,"w":38,"h":27},{"sprite":8,"z":605,"x":325,"y":505,"w":38,"h":27},{"sprite":9,"z":606,"x":514,"y":595,"w":33,"h":28},{"sprite":8,"z":607,"x":712,"y":539,"w":38,"h":27},{"sprite":8,"z":608,"x":597,"y":594,"w":38,"h":27},{"sprite":8,"z":609,"x":1065,"y":755,"w":38,"h":27},{"sprite":8,"z":610,"x":850,"y":716,"w":38,"h":27},{"sprite":8,"z":611,"x":734,"y":695,"w":38,"h":27},{"sprite":8,"z":612,"x":1054,"y":837,"w":38,"h":27},{"sprite":8,"z":613,"x":968,"y":887,"w":42,"h":30},{"sprite":14,"z":614,"x":1024,"y":810,"w":29,"h":37},{"sprite":8,"z":615,"x":733,"y":993,"w":31,"h":22},{"sprite":8,"z":616,"x":762,"y":985,"w":23,"h":16},{"sprite":8,"z":617,"x":812,"y":970,"w":24,"h":17},{"sprite":8,"z":618,"x":869,"y":973,"w":24,"h":17},{"sprite":8,"z":619,"x":918,"y":962,"w":24,"h":17},{"sprite":8,"z":620,"x":943,"y":938,"w":24,"h":17},{"sprite":8,"z":621,"x":1018,"y":870,"w":24,"h":17},{"sprite":8,"z":622,"x":932,"y":784,"w":24,"h":17},{"sprite":8,"z":623,"x":1173,"y":729,"w":24,"h":17},{"sprite":8,"z":624,"x":1147,"y":816,"w":24,"h":17},{"sprite":8,"z":625,"x":675,"y":1257,"w":24,"h":17},{"sprite":8,"z":626,"x":626,"y":1387,"w":24,"h":17},{"sprite":8,"z":627,"x":522,"y":1417,"w":24,"h":17},{"sprite":8,"z":628,"x":567,"y":1682,"w":24,"h":17},{"sprite":8,"z":629,"x":562,"y":1799,"w":24,"h":17},{"sprite":8,"z":630,"x":709,"y":1831,"w":24,"h":17},{"sprite":8,"z":631,"x":663,"y":1796,"w":24,"h":17},{"sprite":8,"z":632,"x":748,"y":1859,"w":24,"h":17},{"sprite":8,"z":633,"x":824,"y":1856,"w":24,"h":17},{"sprite":8,"z":634,"x":858,"y":1835,"w":24,"h":17},{"sprite":8,"z":635,"x":880,"y":1813,"w":24,"h":17},{"sprite":8,"z":636,"x":897,"y":1775,"w":24,"h":17},{"sprite":8,"z":637,"x":926,"y":1756,"w":24,"h":17},{"sprite":8,"z":638,"x":950,"y":1744,"w":24,"h":17},{"sprite":8,"z":639,"x":977,"y":1718,"w":24,"h":17},{"sprite":8,"z":640,"x":365,"y":528,"w":24,"h":17},{"sprite":8,"z":641,"x":475,"y":515,"w":24,"h":17},{"sprite":8,"z":642,"x":453,"y":575,"w":24,"h":17},{"sprite":8,"z":643,"x":592,"y":534,"w":24,"h":17},{"sprite":8,"z":644,"x":646,"y":529,"w":24,"h":17},{"sprite":8,"z":645,"x":681,"y":1914,"w":24,"h":17},{"sprite":8,"z":646,"x":794,"y":1959,"w":24,"h":17},{"sprite":8,"z":647,"x":831,"y":1975,"w":24,"h":17},{"sprite":8,"z":648,"x":983,"y":2041,"w":24,"h":17},{"sprite":8,"z":649,"x":1023,"y":2061,"w":24,"h":17},{"sprite":8,"z":650,"x":1084,"y":2086,"w":24,"h":17},{"sprite":8,"z":651,"x":1191,"y":2089,"w":24,"h":17},{"sprite":8,"z":652,"x":1381,"y":2042,"w":24,"h":17},{"sprite":8,"z":653,"x":1473,"y":2013,"w":24,"h":17},{"sprite":8,"z":654,"x":1735,"y":1797,"w":24,"h":17},{"sprite":8,"z":655,"x":1893,"y":1699,"w":24,"h":17},{"sprite":8,"z":656,"x":1921,"y":1674,"w":24,"h":17},{"sprite":8,"z":657,"x":1951,"y":1652,"w":24,"h":17},{"sprite":8,"z":658,"x":1989,"y":1638,"w":24,"h":17},{"sprite":8,"z":659,"x":2427,"y":1529,"w":24,"h":17},{"sprite":8,"z":660,"x":2468,"y":1497,"w":24,"h":17},{"sprite":8,"z":661,"x":2525,"y":1493,"w":24,"h":17},{"sprite":8,"z":662,"x":2136,"y":1157,"w":24,"h":17},{"sprite":8,"z":663,"x":2181,"y":1262,"w":24,"h":17},{"sprite":8,"z":664,"x":2347,"y":1464,"w":24,"h":17},{"sprite":8,"z":665,"x":2577,"y":1482,"w":24,"h":17},{"sprite":8,"z":666,"x":2644,"y":1454,"w":24,"h":17},{"sprite":8,"z":667,"x":2669,"y":1378,"w":24,"h":17},{"sprite":8,"z":668,"x":3566,"y":952,"w":24,"h":17},{"sprite":8,"z":669,"x":1511,"y":599,"w":24,"h":17},{"sprite":8,"z":670,"x":1635,"y":534,"w":24,"h":17},{"sprite":8,"z":671,"x":1691,"y":499,"w":24,"h":17},{"sprite":8,"z":672,"x":1729,"y":460,"w":24,"h":17},{"sprite":8,"z":673,"x":2264,"y":303,"w":24,"h":17},{"sprite":8,"z":674,"x":2281,"y":372,"w":24,"h":17},{"sprite":8,"z":675,"x":2878,"y":406,"w":24,"h":17},{"sprite":8,"z":676,"x":2948,"y":483,"w":24,"h":17}],
  };

  // 地图数据：内联为离线回退；优先尝试 data/*.json（http 服务器场景）
  function loadMapData(){
    return loadLayoutFromInline();
  }
  function applyLayout(data){
    if (Array.isArray(data.level) && data.level.length){
      LEVEL_IMG_CFG.LEVELS = data.level.slice().sort((a, b) => (a.sprite || 0) - (b.sprite || 0));
    }
    if (Array.isArray(data.camp)) CAMP_IMG_CFG.CAMPS = data.camp;
    if (Array.isArray(data.decor)) DECOR_IMG_CFG.DECORS = data.decor;
  }
  // 离线回退：尝试 fetch data/*.json（http 服务器场景），否则保持内联数据
  function loadLayoutFromInline(){
    return Promise.all([
      fetch('./data/level_layout.json').then(r => r.json()).catch(() => null),
      fetch('./data/camp_layout.json').then(r => r.json()).catch(() => null),
      fetch('./data/decor_layout.json').then(r => r.json()).catch(() => null),
    ]).then(([levels, camps, decors]) => {
      if (Array.isArray(levels) && levels.length){
        LEVEL_IMG_CFG.LEVELS = levels.sort((a, b) => (a.sprite || 0) - (b.sprite || 0));
      }
      if (Array.isArray(camps)) CAMP_IMG_CFG.CAMPS = camps;
      if (Array.isArray(decors)) DECOR_IMG_CFG.DECORS = decors;
    });
  }
  function levelImgByChapter(chIdx){
    // 章节数与手绘地图不匹配时（如语法站 5 章 vs C站 14 关），不使用 level 图片
    if (!hasHandLayout()) return null;
    const c = LEVEL_IMG_CFG.LEVELS[chIdx];
    if (!c) return null;
    return { sprite: c.sprite, x: c.x, y: c.y, w: c.w, h: c.h,
             src: 'image/level/level_' + (chIdx + 1) + '.webp' };
  }

  /* ===================== 地形 =====================
   * 仅背景底图；精灵层由 renderSpriteLayer 按 z 排序统一渲染
   */
  function renderTerrain(){
    const g = $(CLS.terrain);
    g.innerHTML = '';
    const SVGNS = 'http://www.w3.org/2000/svg';
    function add(tag, attrs){
      const el = document.createElementNS(SVGNS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      g.appendChild(el);
    }
    add('image', { x: 0, y: 0, width: 4508, height: 2400,
                   href: LEVEL_IMG_CFG.BG_SRC, preserveAspectRatio: 'none' });
  }

  /* ===================== 精灵层（全局 z 排序） =====================
   * 把 tools/editor.html 摆放的全部精灵（装饰/城堡/营地）按 z 升序渲染进 nodes-container，
   * 以保留导出时的遮挡关系。装饰不可点击；城堡/营地可点击。
   */
  // 城堡章节索引缓存：chIdx -> node（O(1) 查找，替代每次 find）
  let mainByChIdx = new Map();
  function buildMainIndex(nodes){
    mainByChIdx = new Map();
    (nodes || []).forEach(function(n){ if (n.isMain) mainByChIdx.set(n.chIdx, n); });
  }
  function mainNodeOf(chIdx){ return mainByChIdx.get(chIdx) || null; }

  function renderSpriteLayer(){
    const g = $(CLS.nodes);
    if (!g) return;
    g.innerHTML = '';
    if (!hasHandLayout()){
      // auto layout: render castles along the road, skip hand-placed decors/camps
      (nodesRef || []).forEach(function(n){
        if (!n.isMain) return;
        const p = nodeMapRef && nodeMapRef[n.id];
        if (!p) return;
        const accent = getAccent(n.chIdx);
        g.insertAdjacentHTML('beforeend', castleSVG(n, p.x, p.y, accent, mainStatus(n.chIdx)));
      });
      return;
    }
    const SVGNS = 'http://www.w3.org/2000/svg';

    // 收集所有精灵，统一按 z 升序（z 越大越靠上）
    const items = [];
    DECOR_IMG_CFG.DECORS.forEach(function(d){
      items.push({ z: d.z, kind: 'decor', d: d });
    });
    LEVEL_IMG_CFG.LEVELS.forEach(function(d){
      items.push({ z: d.z, kind: 'level', d: d });
    });
    CAMP_IMG_CFG.CAMPS.forEach(function(d){
      items.push({ z: d.z, kind: 'camp', d: d });
    });
    items.sort(function(a, b){ return (a.z||0) - (b.z||0); });

    // 一次性拼接全部精灵为字符串，避免逐个 insertAdjacentHTML 的 DOM 开销
    let html = '';
    items.forEach(function(it){
      const d = it.d;
      const halfW = d.w/2, halfH = d.h/2;
      if (it.kind === 'decor'){
        // 纯装饰：不可点击
        html += '<image href="' + DECOR_IMG_CFG.DECOR_SRC + d.sprite + '.png" x="' + (d.x - halfW) + '" y="' + (d.y - halfH) + '" width="' + d.w + '" height="' + d.h + '" class="decor-img" pointer-events="none"/>';
      } else if (it.kind === 'level'){
        // 城堡：保留可点击状态（完成旗/锁）——用节点分组包裹
        const node = mainNodeOf(d.sprite - 1);   // O(1)
        if (!node) return;   // 城堡节点缺失则跳过
        const accent = getAccent(d.sprite - 1);
        html += castleSVG(node, d.x, d.y, accent, mainStatus(d.sprite - 1));
      } else {
        // 营地：可点击（跳转知识区域）
        const c = { ...d, src: CAMP_IMG_CFG.CAMP_SRC + String(d.sprite).padStart(2, '0') + '.png' };
        html += campSprSVG(c, getAccent(c.ch));
      }
    });
    g.innerHTML = html;
  }

  /* 通关后增量补丁：不重建 578 节点，只重建对应城堡节点（完成旗/锁定态变化） */
  function patchCastleState(chIdx){
    const g = $(CLS.nodes);
    if (!g) return;
    if (!hasHandLayout()){ renderSpriteLayer(); return; }
    const el = g.querySelector('.level-node[data-ch="' + chIdx + '"]');
    if (!el) return;
    const rep = renderSpriteLayerCastle(chIdx);
    if (rep) el.outerHTML = rep;
  }
  function renderSpriteLayerCastle(chIdx){
    const d = LEVEL_IMG_CFG.LEVELS[chIdx];
    if (!d) return null;
    const node = mainNodeOf(chIdx);
    if (!node) return null;
    return castleSVG(node, d.x, d.y, getAccent(chIdx), mainStatus(chIdx));
  }

  /* 预加载精灵图：启动后分批次 warm 浏览器缓存，避免滚动时白图闪烁 */
  function preloadSpriteImages(){
    if (!hasHandLayout()) return;
    // 收集所有图片 URL（装饰/城堡/营地），去重
    const urls = new Set();
    DECOR_IMG_CFG.DECORS.forEach(d => urls.add(DECOR_IMG_CFG.DECOR_SRC + d.sprite + '.png'));
    LEVEL_IMG_CFG.LEVELS.forEach(d => urls.add('image/level/level_' + d.sprite + '.webp'));
    CAMP_IMG_CFG.CAMPS.forEach(d => urls.add(CAMP_IMG_CFG.CAMP_SRC + String(d.sprite).padStart(2, '0') + '.png'));
    const arr = Array.from(urls);
    // 分小批（每批 8 张），用 requestIdleCallback 不阻塞首屏
    let i = 0;
    const BATCH = 8;
    function scheduleNext(){
      // requestIdleCallback 与 setTimeout 参数不兼容，分开处理
      if (typeof window.requestIdleCallback === 'function'){
        window.requestIdleCallback(nextBatch, { timeout: 150 });
      } else {
        setTimeout(nextBatch, 120);
      }
    }
    function nextBatch(){
      const end = Math.min(i + BATCH, arr.length);
      for (; i < end; i++){
        const img = new Image();
        img.decoding = 'async';
        img.src = arr[i];
      }
      if (i < arr.length) scheduleNext();
    }
    nextBatch();
  }



  // 贝塞尔连线
  function buildCurvePath(x1, y1, x2, y2){
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const bend = Math.sin(ang) * 40 + (Math.random() - 0.5) * 60;
    const c1x = midX + Math.cos(ang + Math.PI/2) * bend;
    const c1y = midY + Math.sin(ang + Math.PI/2) * bend;
    const c2x = midX - Math.cos(ang + Math.PI/2) * bend;
    const c2y = midY - Math.sin(ang + Math.PI/2) * bend;
    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  }

    function renderLinks(nodeMap, nodes){
    const g = $(CLS.links);
    g.innerHTML = '';
  }


  /* ---- 城堡（主干节点） ---- */
    function castleSVG(node, x, y, accent, kind){
    const id = node.id.replace('.', '-');
    const status = getNodeStatus(node);
    const dataLocked = status.isLocked ? 'locked' : (status.isCompleted ? 'completed' : 'open');
    const lvl = levelImgByChapter(node.chIdx);
    if (lvl){
      return (
        '<g id="node-' + id + '" class="node castle-node level-node ' + (node.isStart ? 'node-start' : '') + ' ' + (node.isEnd ? 'node-end' : '') + '"' +
        ' data-ch="' + node.chIdx + '" data-locked="' + dataLocked + '" data-completed="' + status.isCompleted + '"' +
        ' role="button" tabindex="0" aria-label="' + esc(node.name) + '"' +
        ' transform="translate(' + lvl.x + ', ' + lvl.y + ')">' +
        '<image href="' + lvl.src + '" x="' + (-lvl.w/2) + '" y="' + (-lvl.h/2) + '" width="' + lvl.w + '" height="' + lvl.h + '" class="level-img"/>' +
        '<rect x="' + (-lvl.w/2) + '" y="' + (-lvl.h/2) + '" width="' + lvl.w + '" height="' + lvl.h + '" rx="14" fill="transparent" class="castle-hit"/>' +
        (status.isLocked ? '<text x="0" y="0" text-anchor="middle" font-size="60">🔒</text>' : '') +
        (status.isCompleted ? '<g class="node-flag"><path d="M0 ' + (-lvl.h/2) + ' L0 ' + (lvl.h/2) + '" stroke="#e74c3c" stroke-width="10"/><path d="M0 ' + (-lvl.h/2) + ' L40 ' + (-lvl.h/2 + 60) + ' L0 ' + (-lvl.h/2 + 120) + ' Z" fill="#e74c3c"/></g>' : '') +
        '<text x="' + (-lvl.w/2 + 30) + '" y="' + (-lvl.h/2 + 40) + '" font-size="30" font-weight="bold" fill="#5a4630">' + node.chapter + '</text>' +
        '<text x="0" y="' + (lvl.h/2 + 34) + '" text-anchor="middle" font-size="23" font-weight="bold" fill="#5a4630" class="node-name" paint-order="stroke" stroke="#f6e9c8" stroke-width="5" stroke-linejoin="round">' + esc(levelNameFor(node.chIdx)) + '</text>' +
        '</g>'
      );
    }
    return (
      '<g id="node-' + id + '" class="node castle-node ' + (node.isStart ? 'node-start' : '') + ' ' + (node.isEnd ? 'node-end' : '') + '"' +
      ' data-ch="' + node.chIdx + '" data-locked="' + dataLocked + '" data-completed="' + status.isCompleted + '"' +
      ' role="button" tabindex="0" aria-label="' + esc(node.name) + '"' +
      ' transform="translate(' + x + ', ' + y + ')">' +
      '<ellipse cx="0" cy="58" rx="78" ry="18" fill="rgba(0,0,0,0.15)"/>' +
      '<path d="M-58 -10 L-58 40 Q-58 52 -45 50 L45 50 Q58 52 58 40 L58 -10 Z" fill="#faf6ee" stroke="#d9cfc0" stroke-width="2"/>' +
      '<rect x="-70" y="-70" width="140" height="160" rx="14" fill="transparent" class="castle-hit"/>' +
      '<text x="0" y="-30" text-anchor="middle" font-size="26" font-weight="bold" fill="#5a4630">' + node.chapter + '</text>' +
      (status.isCompleted ? '<g class="node-flag"><path d="M0 -40 L0 58" stroke="#8a6a3a" stroke-width="2.5"/><path d="M0 -40 L26 -32 L0 -24 Z" fill="#e74c3c"/></g>' : '') +
      (status.isLocked ? '<text x="0" y="-6" text-anchor="middle" font-size="28">🔒</text>' : '') +
      '<text x="0" y="90" text-anchor="middle" font-size="20" font-weight="bold" class="node-name">' + esc(levelNameFor(node.chIdx)) + '</text>' +
      '<text x="0" y="112" text-anchor="middle" font-size="14" fill="#8a7a5a" class="node-land"></text>' +
      '</g>'
    );
  }


  /* ---- 营地（分支节点）----
   * 用 tools/editor.html 摆放的营地精灵图渲染，附加半透明点击热区
   */
  function campSprSVG(camp, accent){
    const w = camp.w, h = camp.h;
    return `
      <g class="node camp-node camp-spr" data-camp="1"
         data-ch="${camp.ch}" data-locked="open" data-completed="false"
         role="button" tabindex="0" aria-label="知识区域"
         title="${esc(CHAPTERS[camp.ch] ? CHAPTERS[camp.ch].title + ' 知识区域 · 点击查看本章内容' : '知识区域')}"
         transform="translate(${camp.x}, ${camp.y})">
        <image href="${camp.src}" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" class="camp-img" pointer-events="none"/>
        <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="6" fill="transparent" class="camp-hit"/>
      </g>`;
  }

    function renderNodes(nodeMap, nodes){
    // 全部精灵（装饰/城堡/营地）按 z 排序统一渲染，保留遮挡关系
    renderSpriteLayer();
  }


  /* ===================== 题目抽取 =====================
   * 从某章随机抽固定题数（章节内部随机，混合难度）。
   * 该章题库为空时用全库兜底。
   */
  function quizPoolFor(chapterId){
    return (QUIZZES[chapterId] && QUIZZES[chapterId].length)
      ? QUIZZES[chapterId]
      : Object.values(QUIZZES).flat();
  }
  function pickQuestions(pool, n){
    if (!pool.length) return [];
    return shuffle(pool).slice(0, n);
  }

  /* ===================== 粒子特效 ===================== */
  // 触屏/窄屏下粒子减半，减轻低端设备连续答题时的 DOM 抖动
  let isSmallScreen = (typeof matchMedia === 'function' && matchMedia('(max-width:768px)').matches);
  function burstParticles(x, y, colors, count){
    const host = $('#particleHost') || $('#fxLayer');
    if (!host) return;
    let n = count || 20;
    if (isSmallScreen) n = Math.max(4, n >> 1);
    for (let i = 0; i < n; i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--px', (Math.random()*160-80) + 'px');
      p.style.setProperty('--py', (Math.random()*-140-20) + 'px');
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      host.appendChild(p);
      const r = Math.random()*500 + 400;
      setTimeout(() => p.remove(), r);
    }
  }
  function flyText(x, y, text, cls){
    const host = $('#fxLayer');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'fly-text ' + (cls || '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    host.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
  function shakeMap(mag){
    const world = $('#mapContainer');
    if (!world) return;
    world.classList.remove('shake');
    void world.offsetWidth;
    world.style.setProperty('--shake-mag', (mag || 10) + 'px');
    world.classList.add('shake');
    setTimeout(() => world.classList.remove('shake'), 350);
  }
  function chapterClearBanner(text){
    const world = $('#mapContainer');
    if (!world) return;
    const el = document.createElement('div');
    el.className = 'clear-banner';
    el.textContent = text;
    world.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  /* ===================== HUD ===================== */
  function updateHUD(){
    $('#hudLevel').textContent = 'LV.' + state.level;
    $('#hudTitle').textContent = titleForLevel(state.level);
    const need = expNeeded(state.level);
    const pct = clamp(state.exp / need * 100, 0, 100);
    // 经验条：用 transform:scaleX 驱动（与 CSS 的 scaleX(0) 初始态配套，避免 width 布局抖动）
    $('#hudExpBar').style.transform = 'scaleX(' + (pct / 100) + ')';
    $('#hudExpBar').style.width = '100%';
    $('#hudExpNums').textContent = state.exp + ' / ' + need;
    $('#hudProgress').textContent = clearedChapterCount() + '/' + CHAPTERS.length;
    $('#hudSoundBtn').textContent = Sound.isEnabled() ? '🔊' : '🔇';
  }
  function titleForLevel(level){
    const t = ['学徒','进阶者','冒险家','勇者','骑士','圣骑士','领主','王者','传奇','帝皇','混沌'];
    return t[Math.min(level - 1, t.length - 1)] || '传说';
  }

  /* ===================== 章节轻提示（替代任务面板） =====================
   * 点击节点后，在 HUD 下方冒出一句简短章节信息，2s 自动淡出。
   * 信息并入 HUD/轻量浮窗，不再占用常驻角落面板。
   */
  let selectedChapterIdx = null;
  let questTimer = null;
  function updateQuest(chIdx){
    selectedChapterIdx = (chIdx == null) ? null : chIdx;
    const el = $('#mapHint');
    if (!el) return;
    if (chIdx == null){
      flashHint('点击地图上的城堡，开始答题闯关', 2500);
      return;
    }
    const ch = CHAPTERS[chIdx];
    const st = mainStatus(chIdx);
    const total = ch.sections.length;
    const cleard = ch.sections.filter(s => state.completedSections[getSectionKey(ch, s)]).length;
    const lname = levelNameFor(chIdx);
    let msg;
    if (st.isLocked){
      msg = `🔒 ${lname} · 需先通关上一章`;
    } else if (st.isCompleted){
      msg = `🏆 ${lname}（${ch.title}）· 已通关，可再战`;
    } else {
      msg = `📝 ${lname}（${ch.title}）· 小节 ${cleard}/${total}`;
    }
    flashHint(msg, 2000);
    const nodeEl = document.querySelector('.castle-node[data-ch="' + chIdx + '"]');
    if (nodeEl && levelMotto(chIdx)) nodeEl.setAttribute('title', levelMotto(chIdx));
  }

  /* ===================== 相机系统 ===================== */
  const S = {
    svg: $('#skill-tree-svg'), world: $('#mapContainer'), mapG: CLS.mapG,
    currentX: 0, currentY: 0, scale: 1, fit: 1,
    dragging: false, moved: false, lastX: 0, lastY: 0,
    anim: null, targetX: 0, targetY: 0, targetScale: 1,
    rect: { left: 0, top: 0, w: 0, h: 0 },   // 缓存的视口矩形（resize 时刷新）
  };
  Object.assign(S, { reset: _resetCamera, easeTo: easeCameraTo, getView: _getView });

  function applyTransform(){
    const el = $(CLS.mapG);
    if (!el) return;
    el.setAttribute('transform', `translate(${S.currentX}, ${S.currentY}) scale(${S.scale})`);
  }
  // fit 缓存：避免每帧 getBoundingClientRect（强制同步布局）。
  // 窗口尺寸变化时通过 resize 监听标记 dirty，否则用缓存值。
  let fitDirty = true;
  function computeFit(){
    if (fitDirty){
      const r = S.world.getBoundingClientRect();
      // 容器隐藏（display:none）时尺寸为 0：保留上一次 fit，避免 0/0=NaN
      if (r.width > 0 && r.height > 0){
        S.fit = Math.min(r.width / 4508, r.height / 2400);
        S.rect.left = r.left; S.rect.top = r.top; S.rect.w = r.width; S.rect.h = r.height;
        fitDirty = false;
      }
      return { left: S.rect.left, top: S.rect.top, width: S.rect.w, height: S.rect.h };
    }
    return { left: S.rect.left, top: S.rect.top, width: S.rect.w, height: S.rect.h };
  }
  function markFitDirty(){ fitDirty = true; }
  window.addEventListener('resize', markFitDirty);
  window.addEventListener('orientationchange', markFitDirty);
  // 最小缩放：让地图恰好铺满屏幕，不留 CSS 背景间隙。
  // SVG 用 preserveAspectRatio="xMidYMid meet"，长边方向会留 letterbox。
  // 若只按 1.0，横向视口下地图比视口略窄，两侧各露约 1% 背景。
  // 取 max(fitX/fit, fitY/fit, 1)：
  //  - 横向视口（桌面）：fitX>fitY → 下限≈1.016，地图铺满宽度，零间隙
  //  - 竖向视口（手机）：fitY>fitX → 下限会很大，但保留 1 避免过度放大，
  //    让玩家看到全图（竖向本就应全图纵览）
  function minScale(){
    computeFit();
    const r = S.rect;
    const fitX = r.w / 4508, fitY = r.h / 2400;
    const fit = S.fit;   // = min(fitX, fitY)
    if (fitX >= fitY){
      // 横向视口：横向铺满 → 下限 = fitX/fit（略大于 1）
      return Math.max(fitX / fit, 1);
    } else {
      // 竖向视口：保留全图纵览，下限 = 1
      return 1;
    }
  }
  function clampScale(v){
    const lo = minScale();
    const loSafe = isFinite(lo) ? lo : 1;
    return clamp(isFinite(v) ? v : loSafe, loSafe, CONFIG.MAX_SCALE);
  }
  function _resetCamera(){
    computeFit();
    S.currentX = 0; S.currentY = 0; S.scale = 1;
    applyTransform();
  }
  // meet 适配的留白（屏幕像素）
  function letterbox(){
    const r = computeFit();
    return {
      x: (r.width  - 4508 * S.fit) / 2,
      y: (r.height - 2400 * S.fit) / 2,
      w: r.width, h: r.height,
    };
  }
  // 屏幕点 -> viewBox
  function screenToVB(sx, sy){
    computeFit();
    const lb = letterbox();
    return {
      x: ((sx - S.rect.left - lb.x) / S.fit - S.currentX) / S.scale,
      y: ((sy - S.rect.top  - lb.y) / S.fit - S.currentY) / S.scale,
    };
  }
  // viewBox -> 屏幕
  function vbToScreen(vx, vy){
    computeFit();
    const lb = letterbox();
    return {
      x: S.rect.left + lb.x + (S.currentX + vx * S.scale) * S.fit,
      y: S.rect.top  + lb.y + (S.currentY + vy * S.scale) * S.fit,
    };
  }
  // 边界约束：确保屏幕上不露出地图之外的空白（草地背景）。
  // #map-group transform 后，地图点 vx 的屏幕坐标 = (currentX + vx*scale)*fit + lbx
  // 地图左边缘(vx=0) = currentX*fit + lbx；右边缘(vx=4508) = (currentX+4508*scale)*fit + lbx
  // 当放大后地图比视口大：左右贴边 → currentX ∈ [(W-lbx)/fit - 4508s, -lbx/fit]
  // 当地图比视口小：整体居中 → currentX = (W-2lbx)/(2fit) - 2254s
  function clampPosition(){
    computeFit();
    const lb = letterbox();           // lbx, lby, w, h
    const s = S.scale;
    // 地图渲染后屏幕尺寸
    const mapW = 4508 * s * S.fit;    // 地图宽（屏 px）
    const mapH = 2400 * s * S.fit;    // 地图高
    let cx, cy;
    if (mapW >= lb.w){
      // 地图横向 ≥ 视口：可平移，左右贴边不露空白
      const lo = (lb.w - lb.x) / S.fit - 4508 * s;
      const hi = -lb.x / S.fit;
      cx = clamp(S.currentX, Math.min(lo, hi), Math.max(lo, hi));
    } else {
      // 地图横向 < 视口：整体居中
      cx = (lb.w - 2 * lb.x) / (2 * S.fit) - 2254 * s;
    }
    if (mapH >= lb.h){
      const lo = (lb.h - lb.y) / S.fit - 2400 * s;
      const hi = -lb.y / S.fit;
      cy = clamp(S.currentY, Math.min(lo, hi), Math.max(lo, hi));
    } else {
      cy = (lb.h - 2 * lb.y) / (2 * S.fit) - 1200 * s;
    }
    S.currentX = cx;
    S.currentY = cy;
  }
  function easeCameraTo(vx, vy, factor, ms){
    const r = computeFit();
    // factor 为空 → 保持当前缩放级别（小地图点击：只平移不缩放）
    S.targetScale = clampScale(factor == null ? S.scale : factor);
    // 使 vx,vy 位于视口中心（用户单位：地图中心 2254,1200）
    const ok = isFinite(vx) && isFinite(vy);
    S.targetX = ok ? 2254 - vx * S.targetScale : 2254;
    S.targetY = ok ? 1200 - vy * S.targetScale : 1200;
    if (S.anim) cancelAnimationFrame(S.anim);
    const fromX = S.currentX, fromY = S.currentY, fromS = S.scale;
    const dur = ms || 600, t0 = performance.now();
    function step(now){
      const t = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      S.currentX = lerp(fromX, S.targetX, e);
      S.currentY = lerp(fromY, S.targetY, e);
      S.scale = lerp(fromS, S.targetScale, e);
      clampPosition();
      applyTransform();
      drawMinimap();
      if (t < 1) S.anim = requestAnimationFrame(step);
    }
    S.anim = requestAnimationFrame(step);
  }

  // 瞬时至 (vx, vy) 视口中心，保持当前缩放（小地图拖拽实时跟随用）
  function panTo(vx, vy){
    if (!isFinite(vx) || !isFinite(vy)) return;
    if (S.anim) cancelAnimationFrame(S.anim);
    S.currentX = 2254 - vx * S.scale;
    S.currentY = 1200 - vy * S.scale;
    clampPosition();      // 内部有 computeFit
    applyTransform();
    scheduleMinimap();    // rAF 合并重绘，避免每事件全量重画 canvas
  }

  /* ===================== 小地图（分层优化版） =====================
   * 静态层（背景图 + 节点）画一次离屏缓存，仅状态/尺寸变化时重绘；
   * 视口框用 DOM 元素移动（CSS transform），拖动/缩放零 canvas 重绘。
   */
  const MM = { canvas: null, ctx: null, W: 0, H: 0, bgImg: null, bgReady: false,
              staticReady: false, viewport: null, container: null };
  function initMinimap(){
    MM.canvas = $('#minimapCanvas');
    if (!MM.canvas) return;
    MM.canvas.width = 220; MM.canvas.height = 117;
    MM.ctx = MM.canvas.getContext('2d');
    MM.W = MM.canvas.width; MM.H = MM.canvas.height;
    MM.container = $('#minimapContainer');
    MM.viewport = $('#minimapViewport');
    // 预加载真实地图背景图（加载完成后必须强制重绘静态层，否则背景不显示）
    MM.bgImg = new Image();
    MM.bgImg.onload = function(){
      MM.bgReady = true;
      MM.staticReady = false;   // 强制下次 drawMinimap 重画静态层（含背景）
      drawMinimap();
    };
    MM.bgImg.src = LEVEL_IMG_CFG.BG_SRC;
  }

  // 绘制静态层（背景 + 城堡 + 营地点）——只在数据/状态变化或尺寸变化时调用
  function drawMinimapStatic(){
    if (!MM.ctx || !nodeMapRef) return;
    const c = MM.ctx, W = MM.W, H = MM.H;
    const sx = W / 4508, sy = H / 2400;
    c.clearRect(0, 0, W, H);
    // 背景
    if (MM.bgReady && MM.bgImg){
      c.drawImage(MM.bgImg, 0, 0, W, H);
      c.fillStyle = 'rgba(20,30,20,0.35)';
      c.fillRect(0, 0, W, H);
    } else {
      c.fillStyle = 'rgba(20,30,20,0.88)';
      c.fillRect(0, 0, W, H);
    }
    // 城堡
    for (const n of nodes()){
      if (!n.isMain) continue;
      const p = nodeMapRef[n.id]; if (!p) continue;
      const st = getNodeStatus(n);
      let col = '#8899aa';
      if (n.isStart) col = '#fbbf24';
      else if (n.isEnd) col = '#a855f7';
      else if (st.isCompleted) col = '#10b981';
      else if (st.isLocked) col = '#556';
      else col = '#4f8ff5';
      c.fillStyle = col;
      c.beginPath(); c.arc(p.x*sx, p.y*sy, 5, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(p.x*sx, p.y*sy, 5, 0, 7); c.stroke();
    }
    // 营地
    CAMP_IMG_CFG.CAMPS.forEach(camp => {
      c.fillStyle = 'rgba(201,162,74,0.6)';
      c.beginPath(); c.arc(camp.x*sx, camp.y*sy, 1.5, 0, 7); c.fill();
    });
    MM.staticReady = true;
  }

  // 更新视口框（DOM 移动，零重绘）
  function updateMinimapViewport(){
    if (!MM.viewport || !S.svg || !MM.container) return;
    computeFit();
    const cw = MM.container.clientWidth, ch = MM.container.clientHeight;
    const scale = S.scale;
    const rw = S.rect.w / (scale * S.fit);
    const rh = S.rect.h / (scale * S.fit);
    const rx = -S.currentX / scale;
    const ry = -S.currentY / scale;
    const bx = clamp(rx, 0, 4508 - rw);
    const by = clamp(ry, 0, 2400 - rh);
    const bw = clamp(rw, 0, 4508);
    const bh = clamp(rh, 0, 2400);
    const vp = MM.viewport.style;
    // 用 transform 平移（合成器，零布局），宽高直接设
    vp.left = '0px'; vp.top = '0px';
    vp.width  = (bw / 4508 * cw) + 'px';
    vp.height = (bh / 2400 * ch) + 'px';
    vp.transform = 'translate(' + (bx/4508*cw) + 'px,' + (by/2400*ch) + 'px)';
  }

  // 主入口：首次确保静态层已画，然后更新视口框
  function drawMinimap(){
    if (!MM.ctx || !nodeMapRef) return;
    if (!MM.staticReady) drawMinimapStatic();
    updateMinimapViewport();
  }
  let mmRaf = null;
  function scheduleMinimap(){
    if (mmRaf) return;
    mmRaf = requestAnimationFrame(function(){
      mmRaf = null;
      drawMinimap();
    });
  }
  let nodeMapRef = null;
  let nodesRef = null;
  function nodes(){ return nodesRef || []; }

  /* ===================== 地图背景音乐（background.mp3，可开关） ===================== */
  let mapMusicOn = true;
  try { mapMusicOn = localStorage.getItem('c_music_enabled') !== '0'; } catch (e) {}
  function mapAudioEl(){ return document.getElementById('mapAudio'); }
  function playMapMusic(){
    const a = mapAudioEl();
    if (!a || !mapMusicOn) return;
    a.volume = 1;
    a.play().catch(() => {});
  }
  function stopMapMusic(){
    const a = mapAudioEl();
    if (a) a.pause();
  }
  function toggleMapMusic(){
    mapMusicOn = !mapMusicOn;
    try { localStorage.setItem('c_music_enabled', mapMusicOn ? '1' : '0'); } catch (e) {}
    if (mapMusicOn) playMapMusic(); else stopMapMusic();
    return mapMusicOn;
  }

  /* ===================== 章节答题测验 ===================== */
  const battle = {
    active: false, practice: false, chapterIdx: -1, chapterId: '',
    questions: [], qIdx: 0, q: null,
    correct: 0, total: 0,
    locked: false, pendingTimeout: null,
    timer: null, timeLeft: 0, returnFocusEl: null,
  };

  function openQuiz(chIdx){
    const ch = CHAPTERS[chIdx];
    // 未完全通关上一章则锁定
    if (!isChapterUnlocked(chIdx)){
      Sound.play('lock');
      flashHint('🔒 需先通关上一章', 1800);
      return;
    }
    // 累计测验次数（驱动主站成就统计）
    state.quizStats.attempts = (state.quizStats.attempts || 0) + 1;
    // 从本章随机抽固定题数（章节内随机、混合难度）
    const pool = quizPoolFor(ch.id);
    const questions = pickQuestions(pool, CONFIG.QUIZ_COUNT || 8);
    Object.assign(battle, {
      active: true, practice: false, chapterIdx: chIdx, chapterId: ch.id,
      questions: questions, qIdx: 0, q: null,
      correct: 0, total: 0, locked: false, pendingTimeout: null,
      timer: null, timeLeft: 0,
    });
    if (!battle.questions.length){
      $('#battleFeedback').textContent = '题库为空，请先在 data.js 填充题目';
      return;
    }
    // 显示答题面板
    const panel = $('#battlePanel');
    panel.hidden = false;
    $('#battleSummary').hidden = true;
    const box = $('#battleSummaryBox');
    if (box) box.hidden = true;
    const wait = $('#battleSummaryWait');
    if (wait) wait.hidden = false;
    $('#battleFeedback').textContent = '';
    $('#battleTitle').textContent = '📝 ' + levelNameFor(chIdx) + ' · 随机' + battle.questions.length + '题';
    $('#battleClose').style.opacity = 1;
    // 重置进度条与时限条
    renderProgressSegs();
    const bar = $('#battleTimeBar');
    if (bar){ bar.style.transform = 'scaleX(1)'; bar.classList.remove('low'); }
    // 记录触发来源，关闭后把焦点还给触发者（键盘可达）
    battle.returnFocusEl = (document.activeElement && document.activeElement.closest('.node')) || null;
    // 焦点移入对话框：面板标题（HTML 已带 tabindex=-1）
    $('#battleTitle').focus({ preventScroll: true });
    // 绑定答题键盘快捷键（1-4 / A-D），答题期间生效
    bindBattleKeys();
    showQuizQuestion();
    Sound.play('wave');
  }

  // 闯关前 · 关卡秘典过渡页：展示关卡名/寓意/进度，确认后开战
  let introChIdx = -1;
  function openLevelIntro(chIdx){
    const ch = CHAPTERS[chIdx];
    if (!ch) return;
    const overlay = $('#levelIntro');
    if (!overlay){ openQuiz(chIdx); return; }
    const st = mainStatus(chIdx);
    const total = ch.sections.length;
    const cleard = ch.sections.filter(s => state.completedSections[getSectionKey(ch, s)]).length;
    const m = levelMeta(chIdx) || {};
    introChIdx = chIdx;
    const noEl = $('#levelIntroNo'); if (noEl) noEl.textContent = '第 ' + (chIdx + 1) + ' 关';
    const em = $('#levelIntroEmoji'); if (em) em.textContent = m.emoji || '⚔️';
    const nm = $('#levelIntroName'); if (nm) nm.textContent = m.name || ch.title;
    const cp = $('#levelIntroChapter'); if (cp) cp.textContent = ch.title;
    const mo = $('#levelIntroMotto'); if (mo) mo.textContent = m.motto || '';
    const pr = $('#levelIntroProgress'); if (pr) pr.textContent = st.isCompleted ? '已通关 · 可再战' : ('小节 ' + cleard + '/' + total);
    const lock = $('#levelIntroLock'); if (lock) lock.hidden = !st.isLocked;
    const btn = $('#levelIntroStart');
    if (btn){
      btn.disabled = st.isLocked;
      btn.textContent = st.isLocked ? '🔒 需先通关上一章' : '📝 开始答题';
      btn.focus({ preventScroll: true });
    }
    overlay.hidden = false;
    Sound.play('click');
  }
  function closeLevelIntro(){
    const overlay = $('#levelIntro');
    if (overlay) overlay.hidden = true;
  }

  // 营地节点：跳转到主站对应章节的正文知识点（第一章小节，用户可翻页浏览全部）
  function openKnowledge(chIdx){
    const ch = CHAPTERS[chIdx];
    if (!ch) return;
    if (!isChapterUnlocked(chIdx)){
      Sound.play('lock');
      flashHint('🔒 需先通关上一章，才能查看本章知识', 1800);
      return;
    }
    Sound.play('click');
    // 关闭闯关地图，回到主站课程视图并加载本章第一个小节
    if (typeof switchView === 'function') switchView('course');
    if (typeof loadSection === 'function') loadSection(chIdx, 0);
    flashHint('📖 已进入「' + ch.title + '」知识区域', 2200);
  }

  // 答题键盘：1-4 / A-D 快速选选项（仅战斗激活时）
  let battleKeysBound = false;
  function bindBattleKeys(){
    if (battleKeysBound) return;
    battleKeysBound = true;
    document.addEventListener('keydown', function(ev){
      if (!battle.active || battle.locked || battle.q == null) return;
      const k = ev.key;
      let idx = -1;
      if (/^[1-6]$/.test(k)) idx = parseInt(k, 10) - 1;
      else if (/^[a-fA-F]$/.test(k)) idx = k.toLowerCase().charCodeAt(0) - 97;
      if (idx >= 0){
        const optBtns = $('#battleOptions').children;
        if (idx < optBtns.length){
          ev.preventDefault();
          chooseBattleOption(idx);
        }
      }
    });
  }
  function closeBattle(){
    stopBattleTimer();
    if (battle.pendingTimeout){ clearTimeout(battle.pendingTimeout); battle.pendingTimeout = null; }
    if (resultRevealTimer){ clearTimeout(resultRevealTimer); resultRevealTimer = null; }
    battle.active = false;
    $('#battlePanel').hidden = true;
    // 重置答题相关 UI
    $('#battleExplain').hidden = true;
    $('#battleFeedback').textContent = '';
    $('#battleFeedback').className = 'battle-feedback';
    const rv = $('#battleResultVideo');
    if (rv){ rv.onended = null; try{ rv.pause(); }catch(e){} }
    // 焦点还给打开前的触发节点（键盘可达）
    const back = battle.returnFocusEl;
    battle.returnFocusEl = null;
    if (back && back.isConnected && back.hasAttribute && back.hasAttribute('tabindex')){
      back.focus({ preventScroll: true });
    }
  }
  // 出题：顺序推进本章抽出的题目
  function renderProgressSegs(){
    const wrap = $('#battleSegs');
    if (!wrap) return;
    const total = battle.questions.length || 0;
    let html = '';
    for (let i = 0; i < total; i++){
      const cls = (i < battle.qIdx) ? 'done' : (i === battle.qIdx ? 'now' : '');
      html += '<i class="' + cls + '"></i>';
    }
    wrap.innerHTML = html;
  }
  function showQuizQuestion(){
    if (!battle.active) return;               // 关闭后残留 setTimeout 不再复活答题
    const q = battle.questions[battle.qIdx];
    if (!q){ quizFinish(); return; }
    battle.q = q;
    battle.total++;
    // 题目
    $('#battleQtag').textContent = '第 ' + (battle.qIdx + 1) + ' / ' + battle.questions.length + ' 题 · 已答对 ' + battle.correct;
    renderProgressSegs();
    $('#battleQuestion').innerHTML = esc(q.question);
    $('#battleExplain').hidden = true;   // 新题先隐藏上次解析
    renderBattleOptions(q);
    $('#battleFeedback').textContent = '';
    $('#battleFeedback').className = 'battle-feedback';
    // 重置答题状态
    battle.locked = false;
    startBattleTimer();   // 每题限时（CONFIG.BATTLE_SECONDS）
  }
  function renderBattleOptions(q){
    const wrap = $('#battleOptions');
    wrap.innerHTML = '';
    const LETTERS = ['A','B','C','D','E','F'];
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'battle-opt';
      btn.innerHTML = '<span class="battle-opt-key">' + LETTERS[i] + '</span>' +
                      '<span class="battle-opt-text">' + esc(opt) + '</span>';
      btn.title = LETTERS[i] + '：' + opt;
      btn.onclick = () => chooseBattleOption(i);
      wrap.appendChild(btn);
    });
  }
  function chooseBattleOption(i){
    const q = battle.q;
    if (battle.locked || battle.q == null) return;
    stopBattleTimer();   // 已作答，取消倒计时
    battle.locked = true;
    // 锁定所有选项，防重复点击
    const optBtns = $('#battleOptions').children;
    for (let b = 0; b < optBtns.length; b++) optBtns[b].disabled = true;
    if (i === q.answer){
      // 高亮正确选项
      if (optBtns[i]) optBtns[i].classList.add('correct-hl');
      correctAnswer();
    } else {
      // 标记错误选项 + 揭示正确项
      if (optBtns[i]) optBtns[i].classList.add('wrong');
      if (optBtns[q.answer]) optBtns[q.answer].classList.add('correct-hl');
      wrongAnswer(q, i);
    }
  }
  // 答对：记分 + 展示解析，然后短暂停留后出下一题
  function correctAnswer(){
    sound('correct');
    battle.correct++;
    const q = battle.q;
    $('#battleFeedback').textContent = '✔ 回答正确';
    $('#battleFeedback').className = 'battle-feedback good';
    // 展示解析
    if (q && q.explanation){
      const ex = $('#battleExplain');
      ex.hidden = false;
      ex.innerHTML = '<span class="explain-tag">💡 解析</span> ' + esc(q.explanation);
    }
    // fly text（锚点回退到题目面板）
    const anchor = $('.battle-qna');
    if (anchor){
      const r = anchor.getBoundingClientRect();
      const hostR = $('#fxLayer').getBoundingClientRect();
      flyText(r.left - hostR.left + r.width/2, r.top - hostR.top, '+1', 'xp');
      burstParticles(r.left - hostR.left + r.width/2, r.top - hostR.top + 40, ['#34d399','#10b981','#6ee7b7'], 14);
    }
    // 留出读解析的时间再推进
    battle.pendingTimeout = setTimeout(() => {
      battle.pendingTimeout = null;
      battle.qIdx++;
      showQuizQuestion();
    }, 1700);
  }
  // 答错：标红 + 展示解析 + 揭示正确答案，然后继续（无生命概念，答错不中断）
  function wrongAnswer(q, i, reason){
    if (battle.q == null) return;
    sound('wrong');
    const qq = battle.q;
    $('#battleFeedback').textContent = reason === 'timeout' ? '⏰ 时间到' : '✘ 回答错误';
    $('#battleFeedback').className = 'battle-feedback bad';
    // 展示解析
    if (qq && qq.explanation){
      const ex = $('#battleExplain');
      ex.hidden = false;
      ex.innerHTML = '<span class="explain-tag">💡 解析</span> ' + esc(qq.explanation);
    }
    // 继续下一题（无生命概念）
    battle.pendingTimeout = setTimeout(() => {
      battle.pendingTimeout = null;
      battle.qIdx++;
      showQuizQuestion();
    }, 2000);
  }

  /* ---- 每题限时：倒计时 + 超时判错 ---- */
  function stopBattleTimer(){
    if (battle.timer){ clearInterval(battle.timer); battle.timer = null; }
  }
  function updateTimerUI(){
    const num = $('#battleTimerNum');
    if (num) num.textContent = Math.max(0, Math.ceil(battle.timeLeft));
    const box = $('#battleTimer');
    if (box) box.classList.toggle('low', battle.timeLeft <= 3);
    // 时限条：随剩余比例递减（scaleX 驱动，合成器友好）
    const bar = $('#battleTimeBar');
    if (bar){
      const total = CONFIG.BATTLE_SECONDS || 25;
      const pct = clamp(battle.timeLeft / total * 100, 0, 100);
      bar.style.transform = 'scaleX(' + (pct / 100) + ')';
      bar.classList.toggle('low', battle.timeLeft <= 3);
    }
  }
  function startBattleTimer(){
    stopBattleTimer();
    battle.timeLeft = CONFIG.BATTLE_SECONDS || 25;
    updateTimerUI();
    battle.timer = setInterval(() => {
      battle.timeLeft -= 0.2;
      if (battle.timeLeft <= 0){
        stopBattleTimer();
        battleTimeout();
      } else {
        updateTimerUI();
      }
    }, 200);
  }
  function battleTimeout(){
    if (!battle.active || battle.locked || battle.q == null) return;
    battle.locked = true;
    const q = battle.q;
    const optBtns = $('#battleOptions').children;
    for (let b = 0; b < optBtns.length; b++) optBtns[b].disabled = true;
    if (optBtns[q.answer]) optBtns[q.answer].classList.add('correct-hl');
    wrongAnswer(q, null, 'timeout');
  }

  // 结算视频：胜利 / 失败。播完才揭示「再来一次 / 返回地图」按钮面板
  let resultRevealTimer = null;
  function revealResultBox(){
    if (resultRevealTimer){ clearTimeout(resultRevealTimer); resultRevealTimer = null; }
    const box = $('#battleSummaryBox');
    if (box) box.hidden = false;
    const wait = $('#battleSummaryWait');
    if (wait) wait.hidden = true;
  }
  function playResultVideo(src){
    const v = $('#battleResultVideo');
    if (!v) return;
    // 单次揭示：onended + 兜底计时器都只会揭示一次
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      revealResultBox();
    };
    v.onended = reveal;
    if (resultRevealTimer) clearTimeout(resultRevealTimer);
    try {
      if (v.getAttribute('src') !== src) v.setAttribute('src', src);
      v.currentTime = 0;
      v.muted = false;                 // 带声音播放一遍
      v.loop = false;
      const p = v.play();
      if (p && typeof p.catch === 'function'){
        p.catch(() => {
          // 浏览器自动播放策略拦截时兜底：静音播放
          v.muted = true;
          v.play().catch(() => {});
          // 静音也可能失败：直接揭示，避免卡住
          setTimeout(reveal, 300);
        });
      }
      // 兜底：视频卡住/时长不可知时，到时强制揭示
      const dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 8;
      resultRevealTimer = setTimeout(reveal, dur * 1000 + 1500);
    } catch (e){ reveal(); }
  }

  // 全部题目作答完毕：按及格线判定通关 / 未通过
  function quizFinish(){
    stopBattleTimer();
    const ch = CHAPTERS[battle.chapterIdx];
    const total = battle.total || 0;
    const correct = battle.correct || 0;
    const acc = total ? correct / total : 0;
    const pass = acc >= (CONFIG.PASS_RATE || 0.6);
    $('#battleOptions').innerHTML = '';

    if (pass){
      sound('victory');
      // 记录 S/A 评级（驱动主站徽章）
      const accPct = Math.round(acc * 100);
      if (accPct >= 90){
        state.quizStats.sCount = (state.quizStats.sCount || 0) + 1;
        state.quizStats.bestRank = 'S';
      } else if (accPct >= 80){
        state.quizStats.aCount = (state.quizStats.aCount || 0) + 1;
        if (state.quizStats.bestRank !== 'S') state.quizStats.bestRank = 'A';
      }
      // 结算经验：按正确率给分（每题 10 EXP × 正确率，向下取整，至少 1）
      const xp = Math.max(1, Math.round(CONFIG.XP_PER_CORRECT * acc));
      const res = addExp(xp);
      // 标记章节通关（本章全部小节完成 → 解锁下一章）
      ch.sections.forEach(s => { state.completedSections[getSectionKey(ch, s)] = true; });
      saveState();
      $('#battleSummaryKind').textContent = '🏆 通关 ' + ch.title + '！';
      $('#battleSummaryStats').innerHTML =
        `正确 ${correct}/${total}（${accPct}%）· 达标 ${Math.round((CONFIG.PASS_RATE || 0.6) * 100)}% 以上` +
        `<br>获得经验 <b>+${xp}</b>`
        + (res.leveled ? `<br><b style="color:#fbbf24">🎉 升至 LV.${res.newLevel}！</b>` : '');
      $('#battleSummary').hidden = false;
      const box = $('#battleSummaryBox'); if (box) box.hidden = true;
      const wait = $('#battleSummaryWait'); if (wait) wait.hidden = false;
      playResultVideo('video/victory.mp4');
      updateHUD();
      // 通关：仅重建该章城堡节点（完成旗），不重建整个精灵层
      patchCastleState(battle.chapterIdx);
      chapterClearBanner('🏆 ' + ch.title + ' 通关！');
      if (res.leveled) sound('levelup');
    } else {
      sound('fail');
      const accPct = Math.round(acc * 100);
      $('#battleSummaryKind').textContent = '💔 未通关 · ' + ch.title;
      $('#battleSummaryStats').innerHTML =
        `正确 ${correct}/${total}（${accPct}%）· 需答对 ${Math.ceil((CONFIG.PASS_RATE || 0.6) * total)} 题以上才能通关，再试一次吧`;
      $('#battleSummary').hidden = false;
      const box = $('#battleSummaryBox'); if (box) box.hidden = true;
      const wait = $('#battleSummaryWait'); if (wait) wait.hidden = false;
      playResultVideo('video/defeat.mp4');
      updateHUD();
    }
    battle.active = false;
    if (typeof checkBadges === 'function') checkBadges();
  }



  // 用关卡图坐标覆盖主节点位置
  function applyLevelNodePositions(nodeMap, nodes){
    nodes.forEach(function(node){
      if (!node.isMain) return;
      const lvl = levelImgByChapter(node.chIdx);
      if (!lvl) return;
      if (nodeMap[node.id]) {
        nodeMap[node.id].x = lvl.x;
        nodeMap[node.id].y = lvl.y;
        nodeMap[node.id].ang = 0;
      }
    });
  }

  /* ===================== 交互（点击节点） =====================
   * 事件委托：只绑一次，避免随 renderAll 无限累积导致弹窗叠开。
   * 城堡 → 章节答题测验；营地 → 跳转主站章节正文知识点。
   */
  function bindNodeClick(){
    const nodesG = $(CLS.nodes);
    if (!nodesG) return;
    // 容器内节点由 renderAll 重建（innerHTML 清空），监听挂在容器上不受影响
    function activate(el){
      if (!el) return;
      const isCamp = el.hasAttribute('data-camp');
      const chIdx = parseInt(el.getAttribute('data-ch'), 10);
      if (isNaN(chIdx)) return;
      // 营地精灵：跳转主站对应章节的知识区域
      if (isCamp){
        openKnowledge(chIdx);
        return;
      }
      const st = getNodeStatus(mainNodeOf(chIdx) || { isMain:true, chIdx });
      if (st.isLocked){ Sound.play('lock'); shakeMap(6); flashHint('🔒 需先通关上一章'); return; }
      Sound.play('click');
      updateQuest(chIdx);   // 轻量章节提示（showHint 浮窗）
      openLevelIntro(chIdx);
    }
    nodesG.addEventListener('click', (e) => {
      activate(e.target.closest('.node'));
    });
    // 键盘可达：Enter / 空格 触发已聚焦的城堡/营地
    nodesG.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        const el = e.target.closest('.node');
        if (!el) return;
        e.preventDefault();
        activate(el);
      }
    });
  }
  // 锁定/状态轻提示：HUD 下方冒出一句，2s 后淡出
  let hintTimer = null;
  function flashHint(msg, ms){
    const el = $('#mapHint');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => el.classList.remove('show'), ms || 2000);
  }

  /* 进入地图后自动聚焦第一个未通关章节（放大到最大） */
  function focusFirstUncleared(){
    if (!nodeMapRef) return;
    let focus = 0;
    for (let i = 0; i < CHAPTERS.length; i++){
      if (!chapterCleared(CHAPTERS[i])){ focus = i; break; }
    }
    const p = nodeMapRef[`${CHAPTERS[focus].id}.1`];
    if (p && isFinite(p.x) && isFinite(p.y)){
      easeCameraTo(p.x, p.y, CONFIG.MAX_SCALE, 1600);   // 缓慢推近到章节
    }
  }

  /* ===================== 渲染入口 ===================== */
  // hand-placed 14-level map is used only when chapter count matches;
  // other sites (e.g. grammar 5 chapters) auto-generate the layout
  function hasHandLayout(){
    return LEVEL_IMG_CFG.LEVELS.length === (typeof CHAPTERS !== 'undefined' ? CHAPTERS.length : 0);
  }
  let loadMapPromise = null;
  function renderAll(){
    const nodeArr = generateNodes();
    nodesRef = nodeArr;
    buildMainIndex(nodeArr);
    nodeMapRef = generatePositions(nodeArr);
    if (hasHandLayout()) applyLevelNodePositions(nodeMapRef, nodeArr);
    renderTerrain();
    renderLinks(nodeMapRef, nodeArr);
    renderNodes(nodeMapRef, nodeArr);
    // bindNodeClick 在 init 只绑一次（事件委托，节点重建不影响）
    updateHUD();
    drawMinimap();
  }

   function init(){
    loadState();
    initMinimap();
    computeFit();
    _resetCamera();
    // 先加载 tools/editor.html 摆放的地图数据（城堡/营地/装饰），再渲染
    loadMapPromise = loadMapData().then(function(){
      renderAll();
      bindNodeClick();   // 事件委托：整个会话只绑一次
      // 首次自动聚焦第一个未通关章节（地图隐藏时只计算不落 NaN）
      focusFirstUncleared();
      // 分批次预加载精灵图（不阻塞首屏）
      preloadSpriteImages();
      // 音效按钮
      $('#hudSoundBtn').onclick = () => {
        Sound.toggle();
        toggleMapMusic();
        $('#hudSoundBtn').textContent = mapMusicOn ? '🎵' : '🔇';
        updateHUD();
        Sound.play('click');
      };
      // 关卡秘典过渡页
      $('#levelIntroStart').onclick = () => {
        const ci = introChIdx >= 0 ? introChIdx : 0;
        closeLevelIntro();
        openQuiz(ci);
      };
      const introClose = $('#levelIntroClose');
      if (introClose) introClose.onclick = closeLevelIntro;
      const introOv = $('#levelIntro');
      if (introOv) introOv.addEventListener('click', (ev) => { if (ev.target === introOv) closeLevelIntro(); });
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeLevelIntro(); });
      // 关闭答题面板
      $('#battleClose').onclick = closeBattle;
      $('#battleAgainBtn').onclick = () => {
        const ci = battle.chapterIdx >= 0 ? battle.chapterIdx : 0;
        openQuiz(ci);
      };
      $('#battleBackMapBtn').onclick = closeBattle;
      $('#zoomIn').onclick = () => e.setZoom(S.scale * 1.3);
      $('#zoomOut').onclick = () => e.setZoom(S.scale / 1.3);
      $('#zoomHome').onclick = () => e.resetCamera();
      saveState();
      updateHUD();
    });
  }

  // 占位：让 main.js 复用相机
  const e = {};
  e.setZoom = (ns) => {
    S.scale = clampScale(ns);
    clampPosition();
    applyTransform();
    drawMinimap();
  };
  e.getS = () => S;
  e.state = state;
  e.init = init;
  e.openQuiz = openQuiz;
  e.openKnowledge = openKnowledge;
  e.addExp = addExp;
  e.updateHUD = updateHUD;
  e.renderAll = renderAll;
  e.getNodeStatus = getNodeStatus;
  e.getNodePos = (id) => (nodeMapRef && nodeMapRef[id]) ? nodeMapRef[id] : null;
  e.easeTo = easeCameraTo;
  e.panTo = panTo;
  e.resetCamera = _resetCamera;
  e.drawMinimap = drawMinimap;
  e.scheduleMinimap = scheduleMinimap;
  e.updateQuest = updateQuest;
  e.screenToVB = screenToVB;
  e.vbToScreen = vbToScreen;
  e.S = S;
  e.computeFit = computeFit;
  e.markFitDirty = markFitDirty;
  e.onResume = onResume;
  e.minScale = minScale;
  e.playMapMusic = playMapMusic;
  e.stopMapMusic = stopMapMusic;
  e.toggleMapMusic = toggleMapMusic;
  e.mapMusicOn = () => mapMusicOn;
  e.clampPos = clampPosition;

  function onResume(){
    const doResume = () => {
      markFitDirty();
      computeFit();
      _resetCamera();
      focusFirstUncleared();   // 地图可见后自动放大到第一个未通关章节
      if (nodeMapRef && nodeMapRef.length){
        // 已渲染过：不整层重渲，只应用相机变换 + 刷新小地图（进入/切回更快）
        applyTransform();
      } else {
        renderTerrain();
        renderLinks(nodeMapRef, nodesRef);
        renderNodes(nodeMapRef, nodesRef);
        applyTransform();
      }
      drawMinimap();
      updateHUD();
      playMapMusic();   // 进入地图：启动背景音乐（可开关）
    };
    if (loadMapPromise){
      loadMapPromise.then(doResume);
    } else {
      doResume();
    }
  }

  function sound(name){ Sound.play(name); }

  function _getView(){ }

  window.Game = e;

})();

// --- js/game/quizgame-main.js ---
/* =============================================================
 * main.js —— 启动 / 入口视频 / 地图交互（拖拽·滚轮·键盘·小地图）
 * ============================================================= */
(function(){
  'use strict';
  const G = window.Game;

  // ===== main-site integration: enter/exit driven by roadmap.js switchView =====
  let gameInited = false;
  let startScreenInited = false;
  let mapInteractionBound = false;

  function enter(){
    Sound.unlock();
    if (!gameInited && G && G.init){ G.init(); gameInited = true; }
    if (!startScreenInited){ initStartScreen(); startScreenInited = true; }
    if (!mapInteractionBound){ initMapInteraction(); mapInteractionBound = true; }
    // full intro plays on every entry (user decision 5B)
    const startView = document.getElementById('startView');
    const loadingView = document.getElementById('loadingView');
    const mapView = document.getElementById('qgMapView');
    if (startView) startView.classList.add('active');
    if (loadingView) loadingView.classList.remove('active');
    if (mapView) mapView.classList.remove('active');
    if (window.__startAPI) window.__startAPI.reset();
    if (G && G.stopMapMusic) G.stopMapMusic();
  }

  function exit(){
    if (G && G.stopMapMusic) G.stopMapMusic();
    const startView = document.getElementById('startView');
    const loadingView = document.getElementById('loadingView');
    const mapView = document.getElementById('qgMapView');
    if (startView) startView.classList.remove('active');
    if (loadingView) loadingView.classList.remove('active');
    if (mapView) mapView.classList.remove('active');
    const loopVideo = document.getElementById('startLoopVideo');
    const gameVideo = document.getElementById('startGameVideo');
    const loopAudio = document.getElementById('startLoopAudio');
    if (loopVideo){ try{ loopVideo.pause(); loopVideo.hidden = true; }catch(e){} }
    if (gameVideo){ try{ gameVideo.pause(); gameVideo.hidden = true; }catch(e){} }
    if (loopAudio){ try{ loopAudio.pause(); }catch(e){} }
  }

  window.QuizGameMain = { enter: enter, exit: exit };

  /* ===================== 开场（一次性）：loop 视频 → 开门动画 =====================
   * 已移除静态标题页（「开始闯关」按钮页）。进入后直接播放 loop.mp4
   * 并常显「点击进入」提示；点击 → enter.mp4（开门动画）→ 加载 → 地图。
   */
  function initStartScreen(){
    const startView = document.getElementById('startView');
    const mapView = document.getElementById('qgMapView');
    const loadingView = document.getElementById('loadingView');
    const loopVideo = document.getElementById('startLoopVideo');
    const gameVideo = document.getElementById('startGameVideo');
    const loopAudio = document.getElementById('startLoopAudio');
    const loopHint = document.getElementById('loopHint');
    const skipBtn = document.getElementById('skipIntroBtn');
    if (!startView || !mapView || !loopVideo || !gameVideo) return;

    let phase = 'loop';           // loop → enter（一次性开场）
    let startTimer = null;        // enter 视频兜底定时器
    let loopStallTimer = null;    // loop 视频卡住兜底
    const CENTER_W = 400, CENTER_H = 600;   // 点击中央区域判定（约 400×600）

    // 供「← 返回」回到开场时重置（重播 loop）
    window.__startAPI = {
      reset(){
        phase = 'loop';
        if (startTimer){ clearTimeout(startTimer); startTimer = null; }
        if (loopStallTimer){ clearTimeout(loopStallTimer); loopStallTimer = null; }
        if (skipBtn) skipBtn.hidden = false;
        if (loopHint) loopHint.hidden = false;
        showLoopPhase();
      },
    };

    // 标题页 / loop 视频共用 loop.mp3
    function tryPlayMusic(){
      if (!loopAudio) return;
      loopAudio.play().then(() => {}).catch(() => {});
    }
    // 开门动画自带音乐：彻底停掉 loop.mp3
    function stopMusic(){
      if (!loopAudio) return;
      try {
        loopAudio.pause();
        loopAudio.currentTime = 0;
        loopAudio.volume = 1;
      } catch (e) {}
    }
    // 淡出并停止 loop 音乐（进入地图时调用）
    function fadeOutLoopAudio(){
      if (!loopAudio) return;
      try {
        const vol = loopAudio.volume;
        const step = () => {
          loopAudio.volume = Math.max(0, loopAudio.volume - 0.1);
          if (loopAudio.volume > 0){
            setTimeout(step, 50);
          } else {
            loopAudio.pause();
            loopAudio.volume = vol;
          }
        };
        step();
      } catch (e) { loopAudio.pause(); }
    }

    // loop 阶段：播放 loop 视频 + 音乐，常显「点击进入」提示
    function showLoopPhase(){
      if (phase !== 'loop') return;
      stopMusic();
      tryPlayMusic();            // 背景音乐
      loopVideo.loop = true;
      loopVideo.muted = true;
      loopVideo.hidden = false;
      loopVideo.classList.remove('show');
      loopVideo.currentTime = 0;
      loopVideo.play().catch(() => {});
      requestAnimationFrame(() => requestAnimationFrame(() => loopVideo.classList.add('show')));
      if (loopHint){ loopHint.hidden = false; }
      if (skipBtn) skipBtn.hidden = false;
      // loop 视频卡住（8 秒未开始播放）→ 自动跳过，避免黑屏
      if (loopStallTimer) clearTimeout(loopStallTimer);
      loopStallTimer = setTimeout(() => {
        loopStallTimer = null;
        if (phase === 'loop' && loopVideo.paused && loopVideo.currentTime === 0){
          skipToMap();
        }
      }, 8000);
    }

    // loop 视频：仅中央区域点击进入开门动画
    function onLoopClick(e){
      if (phase !== 'loop') return;
      const rect = startView.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (Math.abs(x - rect.width / 2) <= CENTER_W / 2 && Math.abs(y - rect.height / 2) <= CENTER_H / 2){
        startOpeningVideo();
      }
    }

    function startOpeningVideo(){
      if (phase !== 'loop') return;
      phase = 'enter';
      stopMusic();               // 开门动画自带音乐，停掉 loop.mp3
      loopVideo.pause(); loopVideo.hidden = true; loopVideo.classList.remove('show');
      if (loopHint) loopHint.hidden = true;
      if (skipBtn) skipBtn.hidden = false;
      gameVideo.muted = false;   // 播放开门动画自带音轨
      gameVideo.hidden = false;
      gameVideo.classList.remove('show');
      gameVideo.currentTime = 0;
      gameVideo.play().catch(() => {});
      requestAnimationFrame(() => requestAnimationFrame(() => gameVideo.classList.add('show')));

      gameVideo.onended = () => {
        gameVideo.hidden = true;
        if (skipBtn) skipBtn.hidden = true;
        startView.classList.remove('active');
        if (loadingView){
          loadingView.classList.add('active');
          // 加载动画 2.6s 后：淡出加载 → 淡入地图 + 慢速相机移动
          setTimeout(() => {
            if (loadingView.classList.contains('active')){
              loadingView.classList.add('fade-out');
              setTimeout(() => {
                loadingView.classList.remove('active');
                loadingView.classList.remove('fade-out');
                mapView.classList.add('active');
                mapView.classList.add('fade-in');
                fadeOutLoopAudio();
                G.onResume && G.onResume();     // 内部启动地图背景音乐 + 慢速推近
                setTimeout(() => mapView.classList.remove('fade-in'), 1400);
              }, 550);
            }
          }, 3000);
        } else {
          mapView.classList.add('active');
          mapView.classList.add('fade-in');
          fadeOutLoopAudio();
          G.onResume && G.onResume();
          setTimeout(() => mapView.classList.remove('fade-in'), 1400);
        }
      };

      // 兜底：仅当开门视频卡住（播完 +2s 仍未结束）时强制进入下一段
      const setFallback = () => {
        if (startTimer) clearTimeout(startTimer);
        const dur = isFinite(gameVideo.duration) ? gameVideo.duration : 6.7;
        startTimer = setTimeout(() => {
          if (startView.classList.contains('active') && !gameVideo.ended && (gameVideo.paused || gameVideo.readyState < 2)){
            gameVideo.onended && gameVideo.onended();
          }
        }, dur * 1000 + 2000);
      };
      if (gameVideo.readyState >= 1) setFallback();
      else gameVideo.addEventListener('loadedmetadata', setFallback, { once: true });
    }

    // 跳过开场：loop/开门阶段直接进入地图
    function skipToMap(){
      if (phase !== 'loop' && phase !== 'enter') return;
      if (startTimer){ clearTimeout(startTimer); startTimer = null; }
      if (loopStallTimer){ clearTimeout(loopStallTimer); loopStallTimer = null; }
      loopVideo.pause(); loopVideo.hidden = true; loopVideo.classList.remove('show');
      gameVideo.pause(); gameVideo.hidden = true; gameVideo.classList.remove('show');
      startView.classList.remove('active');
      if (loadingView) loadingView.classList.remove('active');
      mapView.classList.add('active');
      mapView.classList.add('fade-in');
      fadeOutLoopAudio();
      G.onResume && G.onResume();
      if (skipBtn) skipBtn.hidden = true;
      setTimeout(() => mapView.classList.remove('fade-in'), 1400);
    }
    if (skipBtn) skipBtn.addEventListener('click', skipToMap);

    showLoopPhase();   // 直接进入 loop 阶段（无标题页按钮）
    startView.addEventListener('click', onLoopClick);
    startView.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      onLoopClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });
    document.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && startView.classList.contains('active')){
        if (phase === 'loop') startOpeningVideo();
      }
    });
  }

  /* ===================== 地图交互：拖拽平移 / 滚轮缩放 / 键盘 / 小地图导航 ===================== */
  function initMapInteraction(){
    const world = document.getElementById('mapContainer');
    const minimap = document.getElementById('minimapContainer');
    const dragHint = document.getElementById('dragHint');
    if (!world || !G || !G.getS) return;

    const drag = { active:false, moved:false, px:0, py:0 };
    const pointers = new Map();
    const pinch = { active:false, d0:1, scale0:1 };
    let suppressClick = false;

    // 交互控件上不启动地图拖拽
    function isUi(e){
      return !!(e.target && e.target.closest &&
        e.target.closest('button, .battle-panel, .minimap-container, .zoom-controls, .game-hud, .game-back-btn, .map-hint'));
    }
    // 安全刷新：防 NaN + clamp + 应用变换 + 重绘小地图
    function refresh(){
      const s = G.getS();
      s.currentX = isFinite(s.currentX) ? s.currentX : 0;
      s.currentY = isFinite(s.currentY) ? s.currentY : 0;
      G.clampPos();
      G.setZoom(s.scale);
    }

    world.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (isUi(e)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2){
        const [a, b] = [...pointers.values()];
        pinch.d0 = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        pinch.scale0 = G.getS().scale;
        pinch.active = true;
        drag.active = false;
        return;
      }
      drag.active = true;
      drag.moved = false;
      drag.px = e.clientX;
      drag.py = e.clientY;
      world.classList.add('grabbing');
    });

    window.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // 双指捏合缩放
      if (pinch.active && pointers.size >= 2){
        const [a, b] = [...pointers.values()];
        const d = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        G.setZoom(pinch.scale0 * d / pinch.d0);
        e.preventDefault();
        return;
      }
      if (!drag.active) return;
      const dx = e.clientX - drag.px;
      const dy = e.clientY - drag.py;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;   // 5px 内视为点击
      drag.moved = true;
      drag.px = e.clientX;
      drag.py = e.clientY;
      const s = G.getS();
      s.currentX += dx / (s.fit * s.scale);
      s.currentY += dy / (s.fit * s.scale);
      refresh();
    });

    function endPointer(e){
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch.active = false;
      if (pointers.size === 0){
        if (drag.active){
          drag.active = false;
          world.classList.remove('grabbing');
          if (drag.moved){
            suppressClick = true;      // 拖拽结束不触发城堡点击
            if (dragHint) dragHint.classList.add('fade-out');
          }
          drag.moved = false;
        }
      } else if (drag.active && pointers.size === 1){
        const [a] = [...pointers.values()];
        drag.px = a.x; drag.py = a.y;
      }
    }
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    // 拖拽后抑制随后的 click（捕获阶段先于节点处理）
    world.addEventListener('click', (e) => {
      if (suppressClick){
        suppressClick = false;
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // 滚轮缩放（以光标为中心）—— rAF 节流合并：累积滚轮步数，每帧只应用一次
    let wheelSteps = 0;
    let wheelAnchor = { x: 0, y: 0 };
    let wheelRaf = null;
    const onWheelApply = () => {
      wheelRaf = null;
      const steps = wheelSteps;
      wheelSteps = 0;
      if (steps === 0) return;
      const factor = Math.pow(1.2, steps);
      const s = G.getS();
      const before = G.screenToVB(wheelAnchor.x, wheelAnchor.y);
      G.setZoom(s.scale * factor);
      const after = G.vbToScreen(before.x, before.y);
      s.currentX += (wheelAnchor.x - after.x) / (s.fit * s.scale);
      s.currentY += (wheelAnchor.y - after.y) / (s.fit * s.scale);
      G.clampPos();
      G.setZoom(s.scale);
    };
    world.addEventListener('wheel', (e) => {
      e.preventDefault();
      wheelSteps += e.deltaY < 0 ? 1 : -1;
      wheelAnchor.x = e.clientX; wheelAnchor.y = e.clientY;
      if (wheelRaf) return;
      wheelRaf = requestAnimationFrame(onWheelApply);
    }, { passive: false });

    // 键盘平移 / 缩放
    document.addEventListener('keydown', (e) => {
      if (e.target && /^(input|textarea|select|button)$/i.test(e.target.tagName)) return;
      const panel = document.getElementById('battlePanel');
      if (panel && !panel.hidden) return;   // 战斗快捷键优先
      const startView = document.getElementById('startView');
      if (startView && startView.classList.contains('active')) return;
      const s = G.getS();
      const step = 120 / s.scale;
      let dx = 0, dy = 0;
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') dx = -step;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') dx = step;
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') dy = -step;
      else if (k === 'ArrowDown' || k === 's' || k === 'S') dy = step;
      else if (k === '+' || k === '='){ G.setZoom(s.scale * 1.2); return; }
      else if (k === '-' || k === '_'){ G.setZoom(s.scale / 1.2); return; }
      else if (k === '0'){ G.resetCamera(); return; }
      else return;
      e.preventDefault();
      s.currentX += dx;
      s.currentY += dy;
      G.clampPos();
      G.setZoom(s.scale);
    });

    // 「← 返回」：回到开始界面（关闭战斗、重播 loop 视频与音乐）
    const backBtn = document.getElementById('gameBackBtn');
    if (backBtn){
      backBtn.addEventListener('click', () => {
        const panel = document.getElementById('battlePanel');
        const closeBtn = document.getElementById('battleClose');
        if (panel && !panel.hidden && closeBtn) closeBtn.click();
        if (G && G.stopMapMusic) G.stopMapMusic();
        if (typeof switchView === 'function') switchView('home');
        else if (window.QuizGameMain) window.QuizGameMain.exit();
      });
    }

    // 小地图：点击 / 拖拽跳转
    if (minimap){
      let mmDrag = false;
      function mmPoint(e){
        const r = minimap.getBoundingClientRect();
        return {
          vx: (e.clientX - r.left) / Math.max(1, r.width) * 4508,
          vy: (e.clientY - r.top) / Math.max(1, r.height) * 2400,
        };
      }
      minimap.addEventListener('pointerdown', (e) => {
        mmDrag = true;
        const p = mmPoint(e);
        G.panTo(p.vx, p.vy);
        e.stopPropagation();
      });
      minimap.addEventListener('pointermove', (e) => {
        if (!mmDrag) return;
        const p = mmPoint(e);
        G.panTo(p.vx, p.vy);
      });
      minimap.addEventListener('pointerup', () => { mmDrag = false; });
      minimap.addEventListener('pointercancel', () => { mmDrag = false; });
    }
  }

})();

// --- js/focus-mode.js ---
/* ==================== 专注模式 — loc.html 视觉 · 纯JS实现 ==================== */
(function () {
  'use strict';

  var overlay, timerInterval, countdownSeconds = 25 * 60, isRunning = false;
  var clockInterval = null;
  var prevDigits = { h: '--', m: '--', s: '--' };

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'focus-overlay';
    overlay.innerHTML =
      '<div class="focus-home-btn" id="focusHomeBtn" title="返回主页"><i class="fas fa-home"></i></div>' +
      '<div class="container">' +
        '<div class="main-title">⏳ 专注时钟</div>' +
        '<div class="clock-scale"><div class="focus-flip-clock" id="focusClock"></div></div>' +
        '<div class="quote">"<em>专注当下，成就未来</em>"</div>' +
        '<div class="control-panel">' +
          '<div class="countdown-display" id="countdownDisplay">25:00 <span class="unit">分钟</span></div>' +
          '<div class="control-group">' +
            '<button class="btn btn-icon" id="btnMinus">−</button>' +
            '<input type="number" class="control-input" id="minutesInput" value="25" min="1" max="60" />' +
            '<button class="btn btn-icon" id="btnPlus">+</button>' +
            '<span class="control-label" style="margin-left:4px;">分钟</span>' +
          '</div>' +
          '<div class="control-group">' +
            '<button class="btn btn-primary" id="btnStartPause">开始</button>' +
            '<button class="btn btn-danger" id="btnReset">重置</button>' +
          '</div>' +
        '</div>' +
        '<div class="fullscreen-wrap">' +
          '<button class="btn-fullscreen" id="fullscreenButton">⛶ 全屏</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // 事件绑定
    document.getElementById('btnStartPause').addEventListener('click', toggleTimer);
    document.getElementById('btnReset').addEventListener('click', resetTimer);
    document.getElementById('btnMinus').addEventListener('click', minusTimer);
    document.getElementById('btnPlus').addEventListener('click', plusTimer);
    document.getElementById('minutesInput').addEventListener('change', syncFromInput);
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);

    // 返回主页
    var homeBtn = document.getElementById('focusHomeBtn');
    if (homeBtn) homeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // 直接跳转，不先 close()，避免跳转前原页面闪现
      window.location.href = '/';
    });

    // 注意：不绑定"点击空白退出"——避免误触退出专注模式

    // ESC关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });

    updateCountdownDisplay(countdownSeconds);
  }

  // ===== 翻页时钟（自研，上/下半切分同一数字，仅变化时翻页） =====
  function digitHtml(d) {
    return '<div class="focus-digit" data-d="' + d + '">' +
      '<div class="focus-half top"><span class="focus-num">' + d + '</span></div>' +
      '<div class="focus-half bottom"><span class="focus-num">' + d + '</span></div>' +
      '</div>';
  }

  function colonHtml() {
    return '<span class="focus-colon"></span>';
  }

  function pairHtml(str) {
    return '<span class="focus-flip-group">' + digitHtml(str[0]) + digitHtml(str[1]) + '</span>';
  }

  function renderClockFace() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    var wrap = document.getElementById('focusClock');
    if (!wrap) return;
    wrap.innerHTML = pairHtml(h) + colonHtml() + pairHtml(m) + colonHtml() + pairHtml(s);
    prevDigits = { h: h, m: m, s: s };
  }

  // 仅当数字变化时，在对应位子上生成翻页动画层（标准FlipClock双翻页层）
  function animateFlip(pos, newVal) {
    var wrap = document.getElementById('focusClock');
    if (!wrap) return;
    var digits = wrap.querySelectorAll('.focus-digit');
    if (!digits[pos]) return;
    var digit = digits[pos];

    var halfTop = digit.querySelector('.focus-half.top .focus-num');
    var halfBottom = digit.querySelector('.focus-half.bottom .focus-num');
    var oldVal = digit.dataset.d;

    // 上半翻页层：旧值（0° → -90°），立即翻下
    var flapTop = document.createElement('div');
    flapTop.className = 'focus-flap top flipping-top';
    flapTop.innerHTML = '<span class="focus-num">' + oldVal + '</span>';
    digit.appendChild(flapTop);

    // 下半翻页层：新值（90° → 0°，延迟 0.25s 等上半翻完）
    var flapBottom = document.createElement('div');
    flapBottom.className = 'focus-flap bottom flipping-bottom';
    flapBottom.innerHTML = '<span class="focus-num">' + newVal + '</span>';
    digit.appendChild(flapBottom);

    // 动画一开始就把上半静态格更新为新值：
    // 上半翻页层（旧值）会覆盖它，翻页层翻走后露出的即新值，无缝衔接
    if (halfTop) halfTop.textContent = newVal;

    // 动画结束（0.5s）后：下半静态格更新为新值、清理翻页层
    setTimeout(function() {
      if (halfBottom) halfBottom.textContent = newVal;
      if (flapTop.parentNode) flapTop.parentNode.removeChild(flapTop);
      if (flapBottom.parentNode) flapBottom.parentNode.removeChild(flapBottom);
      digit.dataset.d = newVal;
    }, 600);
  }

  function updateClock() {
    var wrap = document.getElementById('focusClock');
    if (!wrap) return;
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');

    // 秒位（4,5）
    if (s[0] !== prevDigits.s[0]) animateFlip(4, s[0]);
    if (s[1] !== prevDigits.s[1]) animateFlip(5, s[1]);
    // 分位（2,3）
    if (m[0] !== prevDigits.m[0]) animateFlip(2, m[0]);
    if (m[1] !== prevDigits.m[1]) animateFlip(3, m[1]);
    // 时位（0,1）
    if (h[0] !== prevDigits.h[0]) animateFlip(0, h[0]);
    if (h[1] !== prevDigits.h[1]) animateFlip(1, h[1]);

    prevDigits = { h: h, m: m, s: s };
  }

  function startClock() {
    renderClockFace();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
  }

  function stopClock() {
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  }

  // ===== 打开/关闭 =====
  function open() {
    createOverlay();
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    startClock();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('show');
    stopClock();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    document.body.style.overflow = '';
  }

  function toggle() {
    if (overlay && overlay.classList.contains('show')) close();
    else open();
  }

  // ===== 倒计时 =====
  function toggleTimer() {
    var btn = document.getElementById('btnStartPause');
    if (!isRunning) {
      syncFromInput();
      if (countdownSeconds <= 0) return;
      isRunning = true;
      btn.textContent = '暂停';
      btn.classList.add('btn-primary');
      document.getElementById('minutesInput').disabled = true;
      document.getElementById('btnMinus').disabled = true;
      document.getElementById('btnPlus').disabled = true;
      timerInterval = setInterval(function() {
        countdownSeconds--;
        updateCountdownDisplay(countdownSeconds);
        if (countdownSeconds <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          isRunning = false;
          btn.textContent = '完成';
          btn.disabled = true;
          document.getElementById('minutesInput').disabled = false;
          document.getElementById('btnMinus').disabled = false;
          document.getElementById('btnPlus').disabled = false;
          playSound();
        }
      }, 1000);
    } else {
      pauseTimer();
    }
  }

  function pauseTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    var btn = document.getElementById('btnStartPause');
    btn.textContent = '继续';
    document.getElementById('minutesInput').disabled = false;
    document.getElementById('btnMinus').disabled = false;
    document.getElementById('btnPlus').disabled = false;
  }

  function resetTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isRunning = false;
    var btn = document.getElementById('btnStartPause');
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.min(Math.max(val, 1), 60);
    input.value = val;
    countdownSeconds = val * 60;
    updateCountdownDisplay(countdownSeconds);
    btn.textContent = '开始';
    btn.disabled = false;
    btn.classList.remove('btn-primary');
    input.disabled = false;
    document.getElementById('btnMinus').disabled = false;
    document.getElementById('btnPlus').disabled = false;
  }

  function minusTimer() {
    if (isRunning) return;
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.max(val - 1, 1);
    input.value = val;
    countdownSeconds = val * 60;
    updateCountdownDisplay(countdownSeconds);
  }

  function plusTimer() {
    if (isRunning) return;
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.min(val + 1, 60);
    input.value = val;
    countdownSeconds = val * 60;
    updateCountdownDisplay(countdownSeconds);
  }

  function syncFromInput() {
    var input = document.getElementById('minutesInput');
    var val = parseInt(input.value) || 25;
    val = Math.min(Math.max(val, 1), 60);
    input.value = val;
    if (!isRunning && !timerInterval) {
      countdownSeconds = val * 60;
      updateCountdownDisplay(countdownSeconds);
    }
  }

  function updateCountdownDisplay(seconds) {
    var display = document.getElementById('countdownDisplay');
    if (!display) return;
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    display.innerHTML = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0') + ' <span class="unit">分钟</span>';
  }

  function playSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1100].forEach(function(freq, i) {
        setTimeout(function() {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq; o.type = 'sine'; g.gain.value = 0.3;
          o.start(); o.stop(ctx.currentTime + 0.3);
        }, i * 400);
      });
    } catch (e) {}
    setTimeout(function() { close(); }, 3000);
  }

  function toggleFullscreen() {
    var btn = document.getElementById('fullscreenButton');
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        btn.textContent = '⛶ 退出全屏';
      } else {
        document.exitFullscreen();
        btn.textContent = '⛶ 全屏';
      }
    } catch (e) {}
  }
  document.addEventListener('fullscreenchange', function() {
    var btn = document.getElementById('fullscreenButton');
    if (btn) btn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
  });

  function bindButton() {
    var btn = document.getElementById('focusClockBtn');
    if (btn) btn.addEventListener('click', function(e) { e.preventDefault(); toggle(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButton);
  } else {
    bindButton();
  }

  window.FocusMode = { open: open, close: close, toggle: toggle };
})();


})();
