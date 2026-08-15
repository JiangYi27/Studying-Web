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
