#!/usr/bin/env node
/* ==================== 构建脚本 ==================== */
/* 将拆分后的 CSS/JS 文件合并打包，供生产环境使用 */
/* 用法: node scripts/build.js */

'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

// ==================== CSS 打包 ====================
const cssFiles = [
    // 基础
    'css/variables.css',
    'css/base.css',
    'css/layout.css',
    // 组件
    'css/components/search.css',
    'css/components/bookmark.css',
    'css/components/rich-content.css',
    'css/components/notes.css',
    'css/components/bottom-nav.css',
    'css/components/outline.css',
    'css/components/calendar.css',
    'css/components/table.css',
    'css/components/badge-modal.css',
    'css/components/responsive.css',
    'css/components/video-background.css',
    'css/components/login.css',
    // 视图
    'css/views/shared.css',
    'css/views/home.css',
    'css/views/course.css',
    'css/views/dashboard.css',
    'css/views/roadmap.css',
    'css/views/badges.css',
    'css/views/aiqa.css',
    'css/views/settings.css',
    'css/views/extension.css',
    'css/views/tasks.css',
    'css/views/responsive.css',
    // 游戏
    'css/game.css',
    // 专注模式
    'css/focus-mode.css',
];

function bundleCSS() {
    let bundled = '/*! C语言知识库 - 合并样式表 | 生成时间: ' + new Date().toISOString() + ' */\n\n';
    for (const file of cssFiles) {
        const filePath = path.join(PUBLIC, file);
        if (fs.existsSync(filePath)) {
            bundled += '/* --- ' + file + ' --- */\n';
            bundled += fs.readFileSync(filePath, 'utf-8').trim() + '\n\n';
        } else {
            console.warn('⚠ 缺失: ' + file);
        }
    }
    const outPath = path.join(PUBLIC, 'css', 'bundle.css');
    fs.writeFileSync(outPath, bundled, 'utf-8');
    console.log('✅ CSS 打包完成: css/bundle.css (' + (bundled.length / 1024).toFixed(1) + ' KB)');
}

// ==================== JS 打包 ====================
const jsFiles = [
    // 工具 & 数据
    'js/utils/helpers.js',
    'js/data/chapters.js',
    // 共享数据（视频配置）
    'js/data/login-videos.js',
    // 核心
    'js/core/main.js',
    'js/core/toast.js',
    // 功能特性
    'js/features/badges.js',
    'js/features/study-timer.js',
    'js/features/bookmark.js',
    'js/features/search.js',
    'js/features/course-search.js',
    'js/features/video-background.js',
    'js/features/notes.js',
    'js/features/noise.js',
    'js/features/keyboard.js',
    'js/features/tasks.js',
    // 登录鉴权（须在 roadmap.js 之前，auth.js 独占引导权）
    'js/features/auth.js',
    // 视图
    'js/views/home.js',
    'js/views/dashboard.js',
    'js/views/extension.js',
    // 核心逻辑
    'js/views/roadmap.js',
    // 实战闯关（Quiz Game 体验）
    'js/game/quizgame-data.js',
    'js/game/quizgame-audio.js',
    'js/game/quizgame-game.js',
    'js/game/quizgame-main.js',
    // 专注模式
    'js/features/focus-mode.js',
];

function bundleJS() {
    let bundled = '/*! C语言知识库 - 合并脚本 | 生成时间: ' + new Date().toISOString() + ' */\n';
    bundled += '(function(){\n"use strict";\n\n';
    for (const file of jsFiles) {
        const filePath = path.join(PUBLIC, file);
        if (fs.existsSync(filePath)) {
            bundled += '// --- ' + file + ' ---\n';
            const content = fs.readFileSync(filePath, 'utf-8');
            // 移除文件内的 'use strict' 声明（外层已有）
            const cleaned = content.replace(/^['"]use strict['"];?\s*/m, '').trim();
            bundled += cleaned + '\n\n';
        } else {
            console.warn('⚠ 缺失: ' + file);
        }
    }
    bundled += '\n})();\n';
    const outPath = path.join(PUBLIC, 'js', 'bundle.js');
    fs.writeFileSync(outPath, bundled, 'utf-8');
    console.log('✅ JS  打包完成: js/bundle.js  (' + (bundled.length / 1024).toFixed(1) + ' KB)');
}

// ==================== 生成生产环境 HTML ====================
function generateProdHTML() {
    const devPath = path.join(PUBLIC, 'index.html');
    let html = fs.readFileSync(devPath, 'utf-8');

    // 替换多个 CSS <link> 为一个 bundle.css
    html = html.replace(
        /<!-- 基础 -->[\s\S]*?<link rel="stylesheet" href="\/css\/game.css">/m,
        '  <link rel="stylesheet" href="/css/bundle.css">'
    );

    // 替换多个 JS <script> 为一个 bundle.js + stores + router.js（保留 Chart.js CDN）
    html = html.replace(
        /<!-- 工具函数[\s\S]*?<script src="\/js\/game\/quizgame-main.js" defer><\/script>/m,
        '  <script src="/js/data/login-videos.js" defer></script>\n  <script src="/js/bundle.js" defer></script>\n  <script src="/js/stores/studyStore.js" defer></script>\n  <script src="/js/stores/uiStore.js" defer></script>\n  <script src="/js/core/router.js" defer></script>'
    );

    const outPath = path.join(PUBLIC, 'index.prod.html');
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log('✅ 生产 HTML 生成: index.prod.html');
    console.log('   部署时替换 index.html 并只保留 bundle.css / bundle.js');
}

// ==================== 执行 ====================
console.log('🔨 开始构建...\n');
bundleCSS();
bundleJS();
generateProdHTML();
console.log('\n🎉 构建完成！');
console.log('   开发环境: 使用拆分文件（方便调试）');
console.log('   生产环境: 使用 bundle.css + bundle.js（只需 2 个请求）');
