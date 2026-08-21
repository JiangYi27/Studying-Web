/**
 * uiStore —— UI 偏好 store
 * 管理：主题、字体大小、侧边栏、视频背景、专注模式、学习提醒等
 */
'use strict';

/* ==================== 默认值 ==================== */
function defaultUIState() {
    return {
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
        dailyGoalCompleteDays: 0,
        dailyGoalMetDate: null,
    };
}

/* ==================== Store 主体 ==================== */
const uiStore = Object.assign({}, defaultUIState());

// 暴露到全局
window.uiStore = uiStore;

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
        Object.keys(defaultUIState()).forEach(k => {
            if (data[k] !== undefined) uiStore[k] = data[k];
        });
    } catch (e) {
        console.error('[uiStore] 加载失败', e);
    }
}

/* ==================== 保存（到 localStorage） ==================== */
function save(siteKey) {
    try {
        const data = {};
        Object.keys(defaultUIState()).forEach(k => { data[k] = uiStore[k]; });
        localStorage.setItem(storageKey(siteKey), JSON.stringify(data));
    } catch (e) {
        console.error('[uiStore] 保存失败', e);
    }
}

/* ==================== 重置 ==================== */
function reset() {
    Object.assign(uiStore, defaultUIState());
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { uiStore, load, save, reset };
}
