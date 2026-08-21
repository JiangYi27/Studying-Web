/* ==================== 主页视图模块（v2） ==================== */
/* 包含：励志语录、专升本倒计时、连续打卡、今日任务、学习热力图、签到日历、学习统计、最近成就、下个徽章 */
/* 依赖：state, QUOTES, TARGET_DATE, CHECKIN_STORAGE_KEY（来自 data/chapters.js） */
/*       showToast（来自 core/toast.js）、addExp, checkBadges 等 */
'use strict';

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

    // 快速操作栏按钮（同一功能，复制一份监听）
    const goTasksBtn2 = document.getElementById('goTasksBtn2');
    if (goTasksBtn2) {
        goTasksBtn2.addEventListener('click', function () { switchView('tasks'); });
    }
    const randomChallengeBtn2 = document.getElementById('randomChallengeBtn2');
    if (randomChallengeBtn2) {
        randomChallengeBtn2.addEventListener('click', function () {
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
    const viewRoadmapBtn2 = document.getElementById('viewRoadmapBtn2');
    if (viewRoadmapBtn2) {
        viewRoadmapBtn2.addEventListener('click', function () { switchView('roadmap'); });
    }
    const goBadgesBtn2 = document.getElementById('goBadgesBtn2');
    if (goBadgesBtn2) {
        goBadgesBtn2.addEventListener('click', function () { switchView('badges'); });
    }
}