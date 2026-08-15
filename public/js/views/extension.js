'use strict';

/* ==================== 拓展知识视图 ==================== */
/* 负责：在拓展知识视图中渲染顶部选项卡、加载对应 Word 文档 HTML */
/* 依赖：main.js（CURRENT_SITE_KEY 全局来自 data/chapters.js）*/

let extensionItems = [];
let currentExtensionId = null;

// 判断当前站点是否启用拓展知识（目前仅英语语法站点挂载 6 个 Word）
function extensionEnabledForSite() {
    const key = (typeof CURRENT_SITE_KEY !== 'undefined' && CURRENT_SITE_KEY) || 'c';
    return key === 'grammar';
}

// 拉取某站点可用的拓展知识列表
async function fetchExtensions() {
    if (!extensionEnabledForSite()) return [];
    try {
        const res = await fetch('/api/extension');
        if (!res.ok) throw new Error('加载失败');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('[拓展知识] 列表加载失败', e);
        return [];
    }
}

// 渲染顶部选项卡
function renderTabs(items) {
    const tabs = document.getElementById('extensionTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    items.forEach(function (item, idx) {
        const btn = document.createElement('button');
        btn.className = 'extension-tab' + (idx === 0 ? ' active' : '');
        btn.textContent = item.title;
        btn.dataset.id = item.id;
        btn.addEventListener('click', function () {
            // 激活样式切换
            tabs.querySelectorAll('.extension-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentExtensionId = item.id;
            loadExtensionContent(item.id);
        });
        tabs.appendChild(btn);
    });
}

// 加载单个拓展知识正文
async function loadExtensionContent(id) {
    const body = document.getElementById('extensionBody');
    if (!body) return;
    body.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">加载中...</p></div>';
    try {
        const res = await fetch('/api/extension/' + encodeURIComponent(id));
        if (!res.ok) throw new Error('内容加载失败');
        const data = await res.json();
        body.innerHTML = sanitizeHtml(data.html || '<p>暂无内容</p>');
        setExtensionEmptyVisible(false);
    } catch (e) {
        body.innerHTML = '<p class="text-danger">内容加载失败，请检查网络连接。</p>';
    }
}

function updateExtensionCount(count) {
    const el = document.getElementById('extensionCount');
    if (!el) return;
    if (!count || count <= 0) {
        el.textContent = '';
        el.style.display = 'none';
        return;
    }
    el.textContent = count + ' 篇资料';
    el.style.display = 'inline-flex';
}

function setExtensionEmptyVisible(visible) {
    const empty = document.getElementById('extensionEmpty');
    const tabs = document.getElementById('extensionTabs');
    const body = document.getElementById('extensionBody');
    if (empty) empty.style.display = visible ? 'block' : 'none';
    if (tabs) tabs.style.display = visible ? 'none' : '';
    if (body) body.style.display = visible ? 'none' : '';
}

// 初始化拓展知识视图（每次进入时调用）
async function initExtension() {
    const tabs = document.getElementById('extensionTabs');
    if (!tabs) return;
    if (!extensionEnabledForSite()) {
        tabs.innerHTML = '';
        currentExtensionId = null;
        updateExtensionCount(0);
        setExtensionEmptyVisible(true);
        const body = document.getElementById('extensionBody');
        if (body) body.innerHTML = '';
        return;
    }
    // 若尚未拉取过列表，则拉取
    if (extensionItems.length === 0) {
        extensionItems = await fetchExtensions();
    }
    if (extensionItems.length === 0) {
        tabs.innerHTML = '';
        updateExtensionCount(0);
        setExtensionEmptyVisible(true);
        return;
    }
    updateExtensionCount(extensionItems.length);
    setExtensionEmptyVisible(false);
    renderTabs(extensionItems);
    // 默认展示第一个（若无已选中项）
    if (!currentExtensionId || !extensionItems.some(function (i) { return i.id === currentExtensionId; })) {
        currentExtensionId = extensionItems[0].id;
    }
    // 设置对应 tab 为 active
    tabs.querySelectorAll('.extension-tab').forEach(function (b) {
        b.classList.toggle('active', b.dataset.id === currentExtensionId);
    });
    loadExtensionContent(currentExtensionId);
}
