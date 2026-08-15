/* ==================== 工具函数 ==================== */
/* 纯函数，无副作用，可被任何模块安全引用 */
'use strict';

/**
 * 基础 HTML 净化：移除 script 标签和事件处理器属性
 * 防止通过 Markdown 内容注入 XSS
 */
function sanitizeHtml(html) {
    if (!html) return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

/**
 * HTML 转义：把文本安全地嵌入 innerHTML
 * 防止题目/选项中的 < > & 被当作 HTML 标签解析
 * 例：#include <stdio.h> → #include &lt;stdio.h&gt;
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 格式化学习时间（分钟 → 可读字符串）
 */
function formatStudyTime(minutes) {
    if (minutes < 60) return minutes + '分钟';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours + '小时' + (mins > 0 ? mins + '分钟' : '');
}

/**
 * 计算指定等级所需经验值（分段曲线）
 * 前期升级快、后期升级慢，更符合"成长"节奏
 * 每级所需经验 = 基础值 × 该阶段的成长系数
 */
function getExpForLevel(lv) {
    lv = Math.max(1, lv);
    if (lv <= 5)   return 100;                    // 1-5 级：新手期，每级 100
    if (lv <= 10)  return 150;                    // 6-10 级：进阶期，每级 150
    if (lv <= 20)  return 220;                    // 11-20 级：成长爬坡，每级 220
    if (lv <= 30)  return 320;                    // 21-30 级：稳步积累，每级 320
    return 450 + Math.floor((lv - 30) * 15);      // 31 级以后：缓慢爬升，每级再 +15
}

/**
 * 按需加载外部脚本（CDN 库懒加载）。
 * 返回 Promise；同一 src 并发调用只会注入一次。
 * 用于 Chart.js / Prism 等非首屏库，避免拖慢首屏加载。
 */
function loadScript(src) {
    const existing = document.querySelector('script[src="' + src.replace(/"/g, '\\"') + '"]');
    if (existing) return Promise.resolve();
    return new Promise(function (resolve, reject) {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error('脚本加载失败: ' + src)); };
        document.head.appendChild(s);
    });
}
