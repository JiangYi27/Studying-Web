/* ==================== 学习时间追踪 ==================== */
/* 依赖：state、saveStateDebounced（来自 main.js）、getLocalDateKey（来自 main.js） */
'use strict';

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
