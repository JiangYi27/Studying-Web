/* ==================== 前端路由：视图切换 ==================== */
/* 依赖：window.switchView 已由 index.html 在加载此文件前通过 main.js 暴露
 *       state, initDashboard, initBadges, initSettings, initExtension,
 *       window.TasksApp, updateHomeNew, initCourseSearch, loadSection
 *       stopStudyTimer, initCourseSearch
 */
'use strict';

/* =========================================================
 * switchView —— 视图切换入口（从 main.js 拆分出来）
 * ========================================================= */
function switchView(viewName) {
    if (state.currentView === 'course' && viewName !== 'course') {
        stopStudyTimer();
    }
    state.currentView = viewName;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('view-active'); });
    var viewEl = document.getElementById(viewName + 'View');
    if (viewEl) viewEl.classList.add('view-active');
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    var navItem = document.querySelector('.nav-item[data-view="' + viewName + '"]');
    if (navItem) navItem.classList.add('active');

    if (viewName === 'dashboard') {
        lastRingPercent = -1;
        initDashboard();
    }
    if (viewName === 'roadmap') {
        stopStudyTimer();
        document.body.classList.add('game-mode');
        var roadmapView = document.getElementById('roadmapView');
        if (roadmapView) roadmapView.classList.add('active-game-layout');
        var sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
        if (window.QuizGameMain && window.QuizGameMain.enter) {
            window.QuizGameMain.enter();
        } else {
            var container = document.getElementById('mapContainer');
            if (container) container.innerHTML = '<div class="text-center py-5 text-muted">实战闯关加载中，请刷新页面...</div>';
            console.warn('QuizGameMain 未加载，请检查 quizgame-*.js 是否正常执行。');
        }
    } else {
        document.body.classList.remove('game-mode');
        var roadmapView2 = document.getElementById('roadmapView');
        if (roadmapView2) roadmapView2.classList.remove('active-game-layout');
        var sidebar2 = document.querySelector('.app-sidebar');
        if (sidebar2) sidebar2.classList.remove('collapsed');
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

/* =========================================================
 * navigateToSection —— 跳转到指定章节小节（用于营地跳转）
 * ========================================================= */
function navigateToSection(folder, section) {
    switchView('course');
    for (var c = 0; c < CHAPTERS.length; c++) {
        if (CHAPTERS[c].folder !== folder) continue;
        for (var s = 0; s < CHAPTERS[c].sections.length; s++) {
            var secKey = CHAPTERS[c].sections[s];
            if (secKey === section + '.md' || secKey === section) {
                loadSection(c, s);
                return;
            }
        }
    }
    console.warn('[导航] 未找到小节:', folder, section);
}

/* 暴露给全局，供 HTML onclick 等直接调用 */
window.switchView = switchView;
window.navigateToSection = navigateToSection;
