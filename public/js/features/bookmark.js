/* ==================== 书签功能 ==================== */
/* 依赖：state、CHAPTERS（来自 data/chapters.js）、showToast（来自 core/toast.js）、saveStateDebounced（来自 main.js） */
'use strict';

/**
 * 书签复合键（chIdx_secIdx），全站唯一格式。
 */
function bookmarkKey(chIdx, secIdx) {
    return chIdx + '_' + secIdx;
}

/**
 * 切换当前小节的书签状态
 */
function toggleBookmark() {
    if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
    const currentKey = bookmarkKey(state.currentChapterIndex, state.currentSectionIndex);
    const existingIndex = state.bookmarks.findIndex(b => bookmarkKey(b.chIdx, b.secIdx) === currentKey);
    if (existingIndex >= 0) {
        state.bookmarks.splice(existingIndex, 1);
        showToast('🔖 已移除书签');
    } else {
        state.bookmarks.push({
            chIdx: state.currentChapterIndex,
            secIdx: state.currentSectionIndex,
            date: new Date().toISOString()
        });
        showToast('🔖 已添加书签');
    }
    updateBookmarkButton();
    saveStateDebounced();
}

/**
 * 同步所有书签按钮（顶栏 + 操作栏）的高亮状态。
 */
function updateBookmarkButton() {
    if (state.currentChapterIndex === null || state.currentSectionIndex === null) return;
    const currentKey = bookmarkKey(state.currentChapterIndex, state.currentSectionIndex);
    const isBookmarked = state.bookmarks.some(b => bookmarkKey(b.chIdx, b.secIdx) === currentKey);
    document.querySelectorAll('.bookmark-toggle').forEach(function (btn) {
        if (isBookmarked) {
            btn.classList.add('active');
            if (btn.querySelector('i').className !== 'fas fa-bookmark') btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        } else {
            btn.classList.remove('active');
            if (btn.querySelector('i').className !== 'far fa-bookmark') btn.innerHTML = '<i class="far fa-bookmark"></i>';
        }
    });
}

/**
 * 获取格式化的书签列表（用于渲染）
 */
function getBookmarksList() {
    return state.bookmarks.map(b => {
        const ch = CHAPTERS[b.chIdx];
        const sec = ch.sections[b.secIdx];
        return {
            chTitle: ch.title,
            secTitle: ch.sectionTitles[b.secIdx],
            chIdx: b.chIdx,
            secIdx: b.secIdx,
            date: b.date
        };
    });
}
