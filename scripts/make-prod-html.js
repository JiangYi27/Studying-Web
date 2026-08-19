#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ic = require('iconv-lite');

// Read the corrupted index.html as GBK (since that's what it actually is)
// and create a clean index.prod.html with correct bundle references
const buf = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'));
const gbkStr = ic.decode(buf, 'gbk');
const lines = gbkStr.split('\n');

// Find key structural lines we need to preserve
// - Lines before the CSS bundle replacement
// - Lines after the JS bundle replacement
// We want to find where the CSS and JS sections are

let cssEndLine = -1;
let jsEndLine = -1;

for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('game.css')) cssEndLine = i;
    if (l.includes('quizgame-main.js')) jsEndLine = i;
}

console.log('CSS end line:', cssEndLine, lines[cssEndLine]?.slice(0, 60));
console.log('JS end line:', jsEndLine, lines[jsEndLine]?.slice(0, 60));

// Build the clean prod HTML
// Take everything from start to end of CSS (inclusive), then replace with bundle.css
// Then take everything after JS to end, with bundle.js replacing the JS block
const beforeCSS = lines.slice(0, cssEndLine + 1).join('\n');
const afterJS = lines.slice(jsEndLine + 1).join('\n');

// Find where the JS block starts (look for the comment before js files)
let jsBlockStart = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('工具函数') || lines[i].includes('js/game')) {
        jsBlockStart = i;
        break;
    }
}
console.log('JS block starts at:', jsBlockStart, lines[jsBlockStart]?.slice(0, 60));

// Build clean HTML
const cleanParts = [];
// Everything up to and including game.css
for (let i = 0; i <= cssEndLine; i++) cleanParts.push(lines[i]);
// Jump to JS section start - 1 (the comment line before JS)
if (jsBlockStart > cssEndLine + 1) {
    for (let i = cssEndLine + 1; i < jsBlockStart; i++) cleanParts.push(lines[i]);
}
// Skip to after JS block
for (let i = jsEndLine + 1; i < lines.length; i++) cleanParts.push(lines[i]);

let cleanHtml = cleanParts.join('\n');

// Now do the replacements
cleanHtml = cleanHtml.replace(
    /<!-- 基础 -->[\s\S]*?game\.css">/m,
    '  <link rel="stylesheet" href="/css/bundle.css">'
);
cleanHtml = cleanHtml.replace(
    /<!-- 工具函数[\s\S]*?quizgame-main\.js" defer><\/script>/m,
    '  <script src="/js/bundle.js" defer></script>'
);

const outFile = path.join(__dirname, '..', 'public', 'index.prod.html');
fs.writeFileSync(outFile, cleanHtml, 'utf8');
console.log('\n✅ Written clean index.prod.html');
console.log('Title:', cleanHtml.split('\n')[6]);
console.log('CJK count:', (cleanHtml.match(/[一-鿿]/g) || []).length);
console.log('Has bundle.css:', cleanHtml.includes('/css/bundle.css'));
console.log('Has bundle.js:', cleanHtml.includes('/js/bundle.js'));
