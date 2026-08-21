#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const files = ['index.html', 'index.prod.html'];

for (const fname of files) {
    const file = path.join(PUBLIC, fname);
    if (!fs.existsSync(file)) { console.log('⚠ 跳过: ' + file); continue; }

    const buf = fs.readFileSync(file);

    // 尝试 UTF-8 解码
    let utf8ok = true;
    let utf8str;
    try {
        utf8str = buf.toString('utf-8');
        // 检查是否有明显的UTF-8解码错误特征（替换字符）
        const replacementCount = (utf8str.match(/�/g) || []).length;
        if (replacementCount > 0) utf8ok = false;
    } catch (e) { utf8ok = false; }

    // 尝试 GBK 解码
    let gbkstr;
    try {
        gbkstr = Buffer.from(buf).toString('gbk');
    } catch (e) { gbkstr = null; }

    // 分析：统计合理中文字符（一级汉字范围）vs乱码比例
    function countChinese(s) {
        return (s.match(/[一-鿿]/g) || []).length;
    }
    function countGarbled(s) {
        // 统计被误判为UTF-8的Latin-1补充字符（GBK高位字节在-ÿ范围被当作单字节UTF-8）
        return (s.match(/[-ÿ]/g) || []).length;
    }

    const chineseUtf8 = utf8str ? countChinese(utf8str) : 0;
    const garbledUtf8 = utf8str ? countGarbled(utf8str) : 0;
    const chineseGbk = gbkstr ? countChinese(gbkstr) : 0;
    const garbledGbk = gbkstr ? countGarbled(gbkstr) : 0;

    console.log(`\n${fname}:`);
    console.log(`  UTF-8: 中文字=${chineseUtf8}, Latin异常=${garbledUtf8}`);
    console.log(`  GBK:   中文字=${chineseGbk}, Latin异常=${garbledGbk}`);

    let chosen = null;
    if (gbkstr) {
        // GBK明显更好：中文多得多
        if (chineseGbk > chineseUtf8 * 3 && garbledGbk < garbledUtf8) {
            chosen = gbkstr;
            console.log(`  → 选择GBK解码（中文更多）`);
        } else if (utf8ok) {
            chosen = utf8str;
            console.log(`  → 选择UTF-8（解码正常）`);
        } else if (chineseGbk > 0) {
            chosen = gbkstr;
            console.log(`  → 选择GBK（UTF-8解码失败）`);
        }
    }

    if (chosen) {
        fs.writeFileSync(file, chosen, 'utf-8');
        const finalChinese = countChinese(chosen);
        console.log(`  ✅ 已写入UTF-8，的中文字=${finalChinese}`);
    } else {
        console.log(`  ⚠ 无法确定编码`);
    }
}

console.log('\n完成！');
