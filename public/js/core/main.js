/* ==================== 主入口：状态管理 + 初始化 ==================== */
'use strict';

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
