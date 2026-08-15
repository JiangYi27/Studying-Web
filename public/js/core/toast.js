/* ==================== Toast 通知 ==================== */
'use strict';

/**
 * 显示一个轻量级的 Toast 通知
 * @param {string} msg - 消息文本
 * @param {number} duration - 显示时长（毫秒），默认 2000
 */
function showToast(msg, duration = 2000) {
    let toast = document.querySelector('.toast-mini');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-mini';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.classList.remove('show'); }, duration);
}
