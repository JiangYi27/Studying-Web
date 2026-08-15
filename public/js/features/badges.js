/* ==================== 徽章系统 ==================== */
/* 依赖：state（来自 main.js）、BADGE_DEFS、CHAPTERS（来自 data/chapters.js） */
'use strict';

/**
 * 记录本次会话中新解锁的徽章 ID（用于徽章视图的高亮提示）
 */
let justUnlockedBadges = [];

/**
 * 检查指定章节是否全部完成
 */
function checkChapterComplete(chapterId) {
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return false;
    return ch.sections.every((sec) => state.completedSections[getSectionKey(ch, sec)]);
}

/**
 * 检查是否所有章节均已完成
 */
function checkAllComplete() {
    let total = 0;
    let done = 0;
    CHAPTERS.forEach((ch) => {
        ch.sections.forEach((sec) => {
            total++;
            if (state.completedSections[getSectionKey(ch, sec)]) done++;
        });
    });
    return total > 0 && done >= total;
}

/**
 * 遍历所有徽章定义，自动解锁满足条件的徽章
 */
function checkBadges() {
    const unlockedIds = new Set(state.badges.map((b) => b.id));
    let newBadge = null;
    const newly = [];
    for (const def of BADGE_DEFS) {
        if (!unlockedIds.has(def.id) && def.condition()) {
            const badge = { id: def.id, name: def.name, desc: def.desc, icon: def.icon, rarity: def.rarity, category: def.category, date: new Date().toISOString() };
            state.badges.push(badge);
            newly.push(def.id);
            if (!newBadge) newBadge = badge;
        }
    }
    if (newly.length > 0) {
        justUnlockedBadges.push(...newly);
        showBadgeModal(newBadge);
        saveState();
    }
}

/**
 * 弹出徽章解锁弹窗
 */
function showBadgeModal(badge) {
    const modal = document.getElementById('badgeModal');
    if (!modal) return;
    document.getElementById('badgeName').textContent = badge.name;
    document.getElementById('badgeDesc').textContent = badge.desc;
    const animEl = modal.querySelector('.badge-animation');
    if (animEl) {
        animEl.textContent = badge.icon;
        animEl.className = 'badge-animation rarity-' + (badge.rarity || 'common');
    }
    const rarityLabel = document.getElementById('badgeRarityLabel');
    if (rarityLabel) {
        rarityLabel.textContent = RARITY_LABELS[badge.rarity] || '';
        rarityLabel.className = 'badge-rarity-label rarity-' + (badge.rarity || 'common');
    }
    // 弹窗整体辉光背景
    const modalContent = modal.querySelector('.badge-modal-content');
    if (modalContent) {
        modalContent.className = 'modal-content badge-modal-content rarity-' + (badge.rarity || 'common');
    }
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    // 弹窗关闭后刷新徽章列表（新解锁徽章高亮）
    modal.addEventListener('hidden.bs.modal', function refresh() {
        if (typeof initBadges === 'function') initBadges();
        modal.removeEventListener('hidden.bs.modal', refresh);
    });
}
