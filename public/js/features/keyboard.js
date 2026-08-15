/* ==================== 键盘快捷键 ==================== */
/* 依赖：toggleBookmark（来自 features/bookmark.js）、markCompleted（来自 roadmap.js） */
'use strict';

/**
 * 初始化全局键盘快捷键
 * Ctrl+←→ : 上一篇/下一篇
 * Ctrl+B   : 切换书签
 * Ctrl+M   : 标记完成/取消
 * Escape   : 关闭大纲/搜索面板
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevBtn = document.getElementById('prevBtn');
            if (prevBtn && !prevBtn.disabled) prevBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
            e.preventDefault();
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn && !nextBtn.disabled) nextBtn.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            toggleBookmark();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            markCompleted();
        }
        if (e.key === 'Escape') {
            const outlinePanel = document.getElementById('outlinePanel');
            if (outlinePanel) outlinePanel.classList.remove('visible');
            const searchDropdown = document.getElementById('searchDropdown');
            if (searchDropdown) searchDropdown.classList.remove('active');
        }
    });
}
