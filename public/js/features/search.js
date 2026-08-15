/* ==================== 全局搜索 ==================== */
/* 依赖：CHAPTERS（来自 data/chapters.js）、loadSection、switchView（来自 roadmap.js） */
'use strict';

/**
 * 初始化全局搜索功能（Ctrl+K 快捷键 + 输入联想）
 */
function initSearch() {
    const searchInput = document.getElementById('searchGlobal');
    const searchDropdown = document.getElementById('searchDropdown');
    if (!searchInput || !searchDropdown) return;

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
    searchDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const chIdx = parseInt(item.dataset.chIdx);
        const secIdx = parseInt(item.dataset.secIdx);
        state.currentChapterIndex = chIdx;
        state.currentSectionIndex = secIdx;
        loadSection(chIdx, secIdx);
        switchView('course');
        searchDropdown.classList.remove('active');
        searchInput.value = '';
    });

    // 输入联想
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            searchDropdown.classList.remove('active');
            return;
        }
        const results = searchIndex.filter((item) => item.searchText.includes(query)).slice(0, 8);
        if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="search-result-item text-muted">未找到结果</div>';
        } else {
            searchDropdown.innerHTML = results
                .map(
                    (r) => `
                <div class="search-result-item" data-ch-idx="${r.chIdx}" data-sec-idx="${r.secIdx}">
                  <strong>${r.secTitle}</strong>
                  <div class="result-chapter">第${chapterNo(CHAPTERS[r.chIdx])}章 ${r.chTitle}</div>
                </div>
              `
                )
                .join('');
        }
        searchDropdown.classList.add('active');
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });

    // Ctrl+K 快捷聚焦
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}
