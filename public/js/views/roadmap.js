/* ==================== 核心应用逻辑 ==================== */
/* 负责：视图切换、课程树、内容加载、标记完成、设置、事件绑定、应用初始化 */
/* 依赖：main.js（state, $, $$, getSectionKey, getLocalDateKey, saveState 等）*/
/*       data/chapters.js（CHAPTERS, QUIZZES, BADGE_DEFS, QUOTES 等）*/
/*       utils/helpers.js（sanitizeHtml, formatStudyTime, getExpForLevel）*/
/*       core/toast.js（showToast）*/
/*       各 features/*.js 和 views/*.js 模块 */
'use strict';

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

    const themeColorOptions = document.querySelectorAll('.theme-dot');
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
    const gradientOptions = document.querySelectorAll('.gradient-swatch');
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
