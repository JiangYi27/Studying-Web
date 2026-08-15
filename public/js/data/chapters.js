/* ==================== 数据定义 ==================== */
/* 章节结构、徽章定义、励志语录、常量等纯数据 */
/* 多站点：通过 setSite(key) 根据站点配置，切换 CHAPTERS / QUOTES / TARGET_DATE / theme */
'use strict';

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
    c: { chapters: C_CHAPTERS },
    grammar: {
        chapters: [
            { id: '01', title: '重塑语法认知框架', folder: '01-重塑语法认知框架', sections: ['01-简单句与五大句型', '02-句子成分与句子分类', '03-十大词类与动词总览', '04-动词的分类', '05-16种时态终极详解', '06-易混易错对比索引'], sectionTitles: ['简单句与五大句型', '句子成分与句子分类', '十大词类与动词总览', '动词的分类', '16种时态终极详解', '易混易错对比索引'], icon: '🧠' },
            { id: '02', title: '动词语气与虚拟语气', folder: '02-动词语气-虚拟语气', sections: ['01-虚拟语气', '02-非谓语动词', '03-独立主格', '04-助动词', '05-系动词', '06-使役动词', '07-不规则动词高频表', '08-情态动词专项'], sectionTitles: ['虚拟语气', '非谓语动词', '独立主格', '助动词', '系动词', '使役动词', '不规则动词高频表', '情态动词专项'], icon: '📚' },
            { id: '03', title: '从句', folder: '03-从句', sections: ['01-定语从句（形容词从句）', '02-主语从句', '03-宾语从句', '04-表语从句（主语补语从句）', '05-同位语从句', '06-宾语补语从句', '07-状语从句综述与时间状语从句', '08-地点状语从句', '09-比较状语从句', '10-条件状语从句', '11-让步状语从句', '12-方式状语从句', '13-原因目的结果状语从句'], sectionTitles: ['定语从句', '主语从句', '宾语从句', '表语从句', '同位语从句', '宾语补语从句', '状语从句综述', '地点状语从句', '比较状语从句', '条件状语从句', '让步状语从句', '方式状语从句', '原因目的结果状语从句'], icon: '🔗' },
            { id: '04', title: '词类', folder: '04-词类', sections: ['01-冠词', '02-介词', '03-名词', '04-数词', '05-形容词', '06-副词', '07-连词', '08-叹词', '09-限定词', '10-代词'], sectionTitles: ['冠词', '介词', '名词', '数词', '形容词', '副词', '连词', '叹词', '限定词', '代词'], icon: '🔤' },
            { id: '05', title: '句子成分与分类', folder: '05-句子成分与分类', sections: ['01-句子成分总览', '02-被动语态', '03-倒装句', '04-强调', '05-省略', '06-主谓一致'], sectionTitles: ['句子成分总览', '被动语态', '倒装句', '强调', '省略', '主谓一致'], icon: '🏗️' },
        ],
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
    // ========= 营地训练 =========
    { id: 'camp_rookie', name: '营地新兵', desc: '完成1次营地训练', icon: '🏕️', category: 'quiz', rarity: 'common', condition: () => state.quest && state.quest.practiceStats && state.quest.practiceStats.count >= 1 },
    { id: 'camp_veteran', name: '训练达人', desc: '完成20次营地训练', icon: '⛺', category: 'quiz', rarity: 'rare', condition: () => state.quest && state.quest.practiceStats && state.quest.practiceStats.count >= 20 },
    { id: 'camp_streak', name: '连击训练家', desc: '营地训练最佳连击10题', icon: '🎯', category: 'quiz', rarity: 'epic', condition: () => state.quest && state.quest.practiceStats && state.quest.practiceStats.bestStreak >= 10 },

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
