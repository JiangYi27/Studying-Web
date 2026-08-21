/**
 * studyStore —— 学习进度 store
 * 管理：完成状态、学习时间、连续打卡、经验值、等级、徽章等
 */
'use strict';

/* ==================== 默认值 ==================== */
function defaultStudyState() {
    return {
        completedSections: {},    // { sectionId: true }
        completedDates: {},      // { dateString: true }
        sectionStudyTime: {},    // { sectionId: minutes }
        streak: 0,
        totalDays: 0,
        totalStudyTime: 0,       // 分钟
        lastStudyDate: null,     // ISO date string
        exp: 0,
        totalExp: 0,
        level: 1,
        badges: [],              // [{ id, name, desc, icon, rarity, category, date }]
        quizStats: {
            attempts: 0,
            bestStreak: 0,
            bestRank: '',
            sCount: 0,
            aCount: 0,
        },
        studiedEarly: false,
        studiedAtNight: false,
    };
}

/* ==================== Store 主体 ==================== */
const studyStore = defaultStudyState();

// 暴露到全局，供其他模块直接读写
window.studyStore = studyStore;

/* ==================== 持久化 key（复用 main.js 的 stateStorageKey） ==================== */
function storageKey(siteKey) {
    const site = siteKey || (typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c';
    return 'c_knowledge_base_state_' + site;
}

/* ==================== 加载（从 localStorage） ==================== */
function load(siteKey) {
    try {
        const raw = localStorage.getItem(storageKey(siteKey));
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.assign(studyStore, data);
    } catch (e) {
        console.error('[studyStore] 加载失败', e);
    }
}

/* ==================== 保存（到 localStorage） ==================== */
function save(siteKey) {
    try {
        const data = {
            completedSections: studyStore.completedSections,
            completedDates: studyStore.completedDates,
            sectionStudyTime: studyStore.sectionStudyTime,
            streak: studyStore.streak,
            totalDays: studyStore.totalDays,
            totalStudyTime: studyStore.totalStudyTime,
            lastStudyDate: studyStore.lastStudyDate,
            exp: studyStore.exp,
            totalExp: studyStore.totalExp,
            level: studyStore.level,
            badges: studyStore.badges,
            quizStats: studyStore.quizStats,
            studiedEarly: studyStore.studiedEarly,
            studiedAtNight: studyStore.studiedAtNight,
        };
        localStorage.setItem(storageKey(siteKey), JSON.stringify(data));
    } catch (e) {
        console.error('[studyStore] 保存失败', e);
    }
}

/* ==================== 重置 ==================== */
function reset() {
    const keys = ['completedSections', 'completedDates', 'sectionStudyTime',
        'streak', 'totalDays', 'totalStudyTime', 'lastStudyDate',
        'exp', 'totalExp', 'level', 'badges',
        'studiedEarly', 'studiedAtNight'];
    keys.forEach(k => { studyStore[k] = defaultStudyState()[k]; });
    studyStore.quizStats = { attempts: 0, bestStreak: 0, bestRank: '', sCount: 0, aCount: 0 };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { studyStore, load, save, reset };
}
