#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const indexHtml = path.join(PUBLIC, 'index.html');
const prodHtml = path.join(PUBLIC, 'index.prod.html');

// We need to fix index.html (the dev file). The issue: Chinese text is GBK-encoded bytes
// that were misinterpreted. The fix: for non-ASCII bytes, we need to re-encode properly.
//
// Strategy: Take the raw bytes, identify GBK Chinese sequences (which appear as
// valid UTF-8 CJK in the wrong interpretation), and convert them back to UTF-8.

const buf = fs.readFileSync(indexHtml);
const str = buf.toString('utf8');

// The file contains UTF-8 HTML structure + GBK Chinese content mixed together.
// We need to find the GBK sequences and convert them.
//
// Each GBK character is 2 bytes (both >= 0x81 for Chinese, or one ASCII).
// When GBK bytes are interpreted as UTF-8:
// - GBK 0x81-0xFE + 0x40-0xFE as first byte → 3-byte UTF-8 char start (E0-EF)
// - GBK 0x81-0xFE + 0x40-0xFE as second byte → continuation (80-BF)
//
// The key insight: in the garbled text, the CJK chars are valid UTF-3-byte sequences
// BUT they don't correspond to the correct Chinese characters. The replacement chars
// (U+FFFD = EF BF BD in UTF-8) indicate where UTF-8 decode failed.
//
// We take a different approach: for every byte offset, try to build a result string.
// If we see a potential UTF-8 start byte (E0-EF), try to read 3 bytes as UTF-8.
// Otherwise use the byte as-is (Latin-1 interpretation, which is safe for ASCII/HTML).

const result = [];
let i = 0;
while (i < buf.length) {
    const b = buf[i];
    // Check for 3-byte UTF-8 sequence (E0-EF xx yy where xx,yy are 80-BF)
    if (b >= 0xE0 && b <= 0xEF && i + 2 < buf.length) {
        const b2 = buf[i+1], b3 = buf[i+2];
        if (b2 >= 0x80 && b2 <= 0xBF && b3 >= 0x80 && b3 <= 0xBF) {
            // Valid UTF-8 3-byte sequence - keep it
            result.push(b, b2, b3);
            i += 3;
            continue;
        }
    }
    // Single byte - keep as-is (Latin-1, which preserves ASCII and extended Latin)
    result.push(b);
    i++;
}

const cleaned = Buffer.from(result);
const cleanedStr = cleaned.toString('utf8');
const cjkCount = (cleanedStr.match(/[一-鿿]/g) || []).length;
console.log('Cleaned file:');
console.log('  Size:', cleaned.length);
console.log('  CJK chars:', cjkCount);
console.log('  Title line:', cleanedStr.split('\n')[6]);

fs.writeFileSync(indexHtml, cleaned, 'utf8');
console.log('\n✅ index.html cleaned and written');

// Now regenerate index.prod.html from index.html
let html = cleanedStr;

// Replace multiple CSS links with bundle.css
html = html.replace(
    /<!-- 基础 -->[\s\S]*?<link rel="stylesheet" href="\/css\/game\.css">/m,
    '  <link rel="stylesheet" href="/css/bundle.css">'
);

// Replace multiple JS scripts with bundle.js
html = html.replace(
    /<!-- 工具函数[\s\S]*?<script src="\/js\/game\/quizgame-main\.js" defer><\/script>/m,
    '  <script src="/js/bundle.js" defer></script>'
);

fs.writeFileSync(prodHtml, html, 'utf8');
console.log('✅ index.prod.html regenerated');
console.log('\nDone!');
