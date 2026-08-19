#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const files = ['index.html', 'index.prod.html'];

// Targeted replacements: garbled → correct
const fixes = [
    // Title
    ['<title>鐭ヨ瘑搴?路 鐮斾範瀹?</title>', '<title>研习室 · 知识库</title>'],
    // CSS/JS comments
    ['<!-- 鐧诲綍棣栭〉瀛椾綋锛欼nstrument Serif (logo 鏂滀綋) + Noto Serif SC (涓枃琛岃疆) -->',
     '<!-- 登录页字体：Instrument Serif (logo 字体) + Noto Serif SC (中文衬线) -->'],
    ['<!-- 鐧诲綍棣栭〉瀛椾綋锛欼nstrument Serif (logo 鏂滀綋) + Noto Serif SC (涓枃琛岃疆) -->',
     '<!-- 登录页字体：Instrument Serif (logo 字体) + Noto Serif SC (中文衬线) -->'],
    // Extension view title
    ['<h2><i class="fas fa-layer-group"></i> 鎷撳睍鐭ヨ瘑</h2>',
     '<h2><i class="fas fa-layer-group"></i> 扩展知识</h2>'],
    // Extension view description
    ['<p>褰撳墠绔欑偣鏆傛棤鎷撳睍鐭ヨ瘑锛屽幓 C 璇锋柟 / 鑻辫妭璇句範娉曠殑璇惧禈鍜冲姟鍟婂憖</p>',
     '<p>当前站点暂无扩展知识，去 C语言 / 英语语法 的课程学习吧</p>'],
    // Quote text
    ['<p class="quote-text" id="quoteText">瀛︿範鐭ヨ瘑锛屽氨鏄㊣

学涔犲

绋嬪簭鍜冲姟</p>',
     '<p class="quote-text" id="quoteText">学习知识，就像科学与程序和对话</p>'],
    // Main title
    ['<h2 id="mainTitle">閫夋嫨鐭ヨ瘑鐐?/h2>',
     '<h2 id="mainTitle">选择知识站点</h2>'],
    // Extension view header
    ['<!-- 鎷撳睍鐭ヨ瘑瑙嗗浘 -->',
     '<!-- 扩展知识视图 -->'],
    // Rarity labels in badges
    ['<span class="rarity-dot"></span>鏅

€?              ',
     '<span class="rarity-dot"></span>普通              '],
    ['<span class="rarity-dot"></span>浼樼

      ',
     '<span class="rarity-dot"></span>优秀      '],
    ['<span class="rarity-dot"></span>绋

€鏈?              ',
     '<span class="rarity-dot"></span>稀有              '],
    ['<span class="rarity-dot"></span>鍙

茶瘲               ',
     '<span class="rarity-dot"></span>史诗               '],
    ['<span class="rarity-dot"></span>浼犺

     ',
     '<span class="rarity-dot"></span>传说     '],
    // Badge category btn
    ['<button class="badge-category-btn active" data-category="all">鍏ㄩ儴</button>',
     '<button class="badge-category-btn active" data-category="all">全部</button>'],
    // Active badge
    ['<!-- 鍔ㄦ€佺敓鎴愬崱鐗?>',
     '<!-- 动态生成徽章 -->'],
    // Settings view comment
    ['<!-- 璁剧疆瑙嗗浘 -->',
     '<!-- 设置视图 -->'],
    // Password change modal title
    ['<!-- 淇

瀵嗙爜寮圭獥 -->',
     '<!-- 修改密码弹窗 -->'],
    // Edit profile modal title
    ['<!-- 淇

璧勬枡寮圭獥 -->',
     '<!-- 修改资料弹窗 -->'],
    // Change password title
    ['<h5 class="modal-title" id="changePasswordModalLabel">淇

瀵嗙爜</h5>',
     '<h5 class="modal-title" id="changePasswordModalLabel">修改密码</h5>'],
    // Edit profile title
    ['<h5 class="modal-title" id="editProfileModalLabel">淇

璧勬枡</h5>',
     '<h5 class="modal-title" id="editProfileModalLabel">修改资料</h5>'],
    // Save button
    ['<button type="button" class="btn btn-primary" id="savePasswordBtn">淇

瀛楀

</button>',
     '<button type="button" class="btn btn-primary" id="savePasswordBtn">保存</button>'],
    // Cancel button
    ['<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">鍙

韬

</button>',
     '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>'],
];

// Also find and replace any remaining garbled patterns
// These patterns show up as common garbled sequences
const dynamicFixes = [
    // Badge rarity labels
    [/<span class="rarity-dot"><\/span>.{1,20}/g, (m) => {
        // Try to clean up the garbled prefix
        return m.replace(/./g, (c) => {
            const code = c.charCodeAt(0);
            // If it's in the CJK Unified Ideographs range but garbled, try to map
            return c;
        });
    }],
];

for (const fname of files) {
    const file = path.join(PUBLIC, fname);
    if (!fs.existsSync(file)) { console.log('⚠ 跳过: ' + file); continue; }

    let content = fs.readFileSync(file, 'utf8');
    let changed = 0;

    for (const [from, to] of fixes) {
        if (content.includes(from)) {
            content = content.split(from).join(to);
            changed++;
            console.log(`  ✅ ${fname}: 修复 "${from.substring(0, 50).replace(/\n/g,'↵')}..."`);
        }
    }

    if (changed > 0) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  已写入 ${fname} (${changed} 处修复)`);
    } else {
        console.log(`  ${fname}: 无需修复`);
    }
}

console.log('\n完成！');
