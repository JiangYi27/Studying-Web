/* ==================== 仪表盘视图模块 ==================== */
/* 包含：统计卡片、进度环、学习趋势图、活动热力图、待复习列表、书签列表、学习记录表 */
/* 依赖：state, CHAPTERS, BADGE_DEFS（来自 data/chapters.js）、formatStudyTime（来自 utils/helpers.js） */
'use strict';

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
