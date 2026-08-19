/* ==================== 课程目录搜索 ==================== */
/* 依赖：CHAPTERS（来自 data/chapters.js）、loadSection、switchView（来自 roadmap.js） */
'use strict';

/**
 * 初始化课程目录搜索功能
 */
function initCourseSearch() {
    const searchInput = document.getElementById('courseSearchInput');
    const searchResults = document.getElementById('courseSearchResults');
    if (!searchInput || !searchResults) return;

    // 构建搜索索引
    const searchIndex = [];
    CHAPTERS.forEach((ch, chIdx) => {
        ch.sections.forEach((sec, secIdx) => {
            searchIndex.push({
                chIdx,
                secIdx,
                chTitle: ch.title,
                secTitle: ch.sectionTitles[secIdx],
                searchText: (ch.title + ' ' + ch.sectionTitles[secIdx] + ' ' + sec).toLowerCase(),
            });
        });
    });

    // 点击搜索结果跳转
    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.course-search-item');
        if (!item) return;
        const chIdx = parseInt(item.dataset.chIdx);
        const secIdx = parseInt(item.dataset.secIdx);
        state.currentChapterIndex = chIdx;
        state.currentSectionIndex = secIdx;
        loadSection(chIdx, secIdx);
        switchView('course');
        searchResults.classList.remove('active');
        searchInput.value = '';
    });

    // 输入联想
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 1) {
            searchResults.classList.remove('active');
            return;
        }
        const results = searchIndex.filter((item) => item.searchText.includes(query)).slice(0, 10);
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="course-search-item" style="color:var(--text-muted);cursor:default">未找到结果</div>';
        } else {
            searchResults.innerHTML = results
                .map(
                    (r) => `
                <div class="course-search-item" data-ch-idx="${r.chIdx}" data-sec-idx="${r.secIdx}">
                  <span class="item-title">${r.secTitle}</span>
                  <span class="item-sub">第${chapterNo(CHAPTERS[r.chIdx])}章</span>
                </div>
              `
                )
                .join('');
        }
        searchResults.classList.add('active');
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}
