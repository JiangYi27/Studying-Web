#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ic = require('iconv-lite');

const PUBLIC = path.join(__dirname, '..', 'public');

// Use iconv-lite's GBK decoder to get the raw GBK bytes interpreted as UTF-8
// The file on disk appears to be: UTF-8 HTML structure + GBK Chinese content
// We need to reconstruct the proper UTF-8

const file = path.join(PUBLIC, 'index.html');
const buf = fs.readFileSync(file);

// The file bytes: ASCII/UTF-8 HTML tags + GBK Chinese
// Strategy: decode the whole thing as GBK first to get the Chinese right,
// then only fix the ASCII parts that would be wrong in GBK
const gbkAll = ic.decode(buf, 'gbk');
const gbkCJK = (gbkAll.match(/[一-鿿]/g) || []).length;
console.log('GBK decode CJK:', gbkCJK);

// Now compare with UTF-8 decode
const utf8All = buf.toString('utf8');
const utf8CJK = (utf8All.match(/[一-鿿]/g) || []).length;
console.log('UTF8 decode CJK:', utf8CJK);

// The title in GBK: should be 研习室 · 知识库
// Let's find the GBK bytes for that
const targetTitle = '研习室 · 知识库';
const targetBytes = Buffer.from(targetTitle, 'utf8');
console.log('Target title UTF-8 bytes:', targetBytes.toString('hex'));

// The GBK title bytes would be:
// 研 = D1D8, 习 = CF B0, 室 = CA A7, · = A1A3 (GBK)
// Let me search for these byte patterns in the raw file
const rawBytes = buf;
const patterns = [
    Buffer.from('D1D8CFB0CAA7', 'hex'), // 研习室 in GBK
    Buffer.from('D1D8CFB0', 'hex'), // 研习
];

for (const pat of patterns) {
    let found = -1;
    for (let i = 0; i < rawBytes.length - pat.length; i++) {
        let match = true;
        for (let j = 0; j < pat.length; j++) {
            if (rawBytes[i + j] !== pat[j]) { match = false; break; }
        }
        if (match) { found = i; break; }
    }
    console.log('Pattern', pat.toString('hex'), 'found at byte offset:', found);
}

// Also search for the correct UTF-8 title bytes
const utf8TitleBytes = Buffer.from('研习室 · 知识库', 'utf8');
let found2 = -1;
for (let i = 0; i < rawBytes.length - utf8TitleBytes.length; i++) {
    let match = true;
    for (let j = 0; j < utf8TitleBytes.length; j++) {
        if (rawBytes[i + j] !== utf8TitleBytes[j]) { match = false; break; }
    }
    if (match) { found2 = i; break; }
}
console.log('Correct UTF-8 title bytes found at:', found2);
console.log('UTF-8 title bytes:', utf8TitleBytes.toString('hex'));
