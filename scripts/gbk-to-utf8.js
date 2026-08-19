#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ic = require('iconv-lite');

const PUBLIC = path.join(__dirname, '..', 'public');

// Files that were incorrectly saved as GBK and need to be converted back to UTF-8
// Also fix index.html and index.prod.html
const allFiles = [
    path.join(PUBLIC, 'index.html'),
    path.join(PUBLIC, 'index.prod.html'),
];

// Also convert source CSS/JS files that are GBK
const cssFiles = [
    'css/variables.css','css/base.css','css/layout.css',
    'css/components/search.css','css/components/bookmark.css','css/components/rich-content.css',
    'css/components/notes.css','css/components/bottom-nav.css','css/components/outline.css',
    'css/components/calendar.css','css/components/table.css','css/components/badge-modal.css',
    'css/components/responsive.css','css/components/login.css',
    'css/views/shared.css','css/views/home.css','css/views/course.css',
    'css/views/dashboard.css','css/views/roadmap.css','css/views/badges.css',
    'css/views/settings.css','css/views/extension.css','css/views/tasks.css',
    'css/views/responsive.css',
    'css/game.css','css/focus-mode.css',
];
const jsFiles = [
    'js/utils/helpers.js','js/data/chapters.js',
    'js/core/main.js','js/core/toast.js',
    'js/features/badges.js','js/features/study-timer.js','js/features/bookmark.js',
    'js/features/search.js','js/features/notes.js','js/features/noise.js',
    'js/features/keyboard.js','js/features/tasks.js','js/features/auth.js',
    'js/views/home.js','js/views/dashboard.js','js/views/extension.js',
    'js/views/roadmap.js',
    'js/game/quizgame-data.js','js/game/quizgame-audio.js',
    'js/game/quizgame-game.js','js/game/quizgame-main.js',
    'js/focus-mode.js',
];

for (const f of [...allFiles, ...cssFiles, ...jsFiles].map(f => path.join(PUBLIC, f))) {
    if (!fs.existsSync(f)) continue;
    const buf = fs.readFileSync(f);
    const utf8str = buf.toString('utf8');
    const gbkstr = ic.decode(buf, 'gbk');

    const utf8CJK = (utf8str.match(/[一-鿿]/g)||[]).length;
    const gbkCJK = (gbkstr.match(/[一-鿿]/g)||[]).length;

    if (gbkCJK > utf8CJK * 2) {
        // GBK is clearly better - convert
        fs.writeFileSync(f, gbkstr, 'utf8');
        console.log(`✅ GBK→UTF8: ${path.relative(PUBLIC, f)} (CJK: ${utf8CJK}→${gbkCJK})`);
    } else if (utf8CJK > 0 && gbkCJK === 0) {
        // Already UTF-8, nothing to do
    } else {
        // Unclear - prefer UTF-8 as it was the original encoding
        const verify = Buffer.from(utf8str, 'utf8').toString('utf8');
        const verifyCJK = (verify.match(/[一-鿿]/g)||[]).length;
        if (verifyCJK === utf8CJK) {
            // UTF-8 is valid, keep it
        }
    }
}

console.log('\nDone! Now rebuild with: node scripts/build.js');
