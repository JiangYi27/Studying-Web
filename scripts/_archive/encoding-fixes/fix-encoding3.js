#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ic = require('iconv-lite');

const PUBLIC = path.join(__dirname, '..', 'public');
const files = ['index.html', 'index.prod.html'];

for (const fname of files) {
    const file = path.join(PUBLIC, fname);
    if (!fs.existsSync(file)) { console.log('⚠ 跳过: ' + file); continue; }

    const buf = fs.readFileSync(file);
    const str = buf.toString('utf8');

    // Check if file has replacement chars (indicates wrong decoding)
    const hasReplacement = str.includes('�');
    const hasGarbledChars = (str.match(/[�]/g) || []).length;
    const hasCJK = (str.match(/[一-鿿]/g) || []).length;
    const hasLatinSupplement = (str.match(/[-ÿ]/g) || []).length;

    console.log(`\n${fname}:`);
    console.log(`  Size: ${buf.length}, UTF8中文字: ${hasCJK}, Latin补充: ${hasLatinSupplement}, 替换符: ${hasGarbledChars}`);

    // If file looks garbled (lots of CJK but also replacement chars), re-decode as GBK
    if (hasReplacement || (hasCJK > 100 && hasLatinSupplement > 50 && !hasReplacement)) {
        // Check if it might be GBK bytes misread as UTF-8
        // Try decoding as GBK
        const gbkDecoded = ic.decode(buf, 'gbk');
        const gbkCJK = (gbkDecoded.match(/[一-鿿]/g) || []).length;
        const gbkReplacement = gbkDecoded.includes('�');

        console.log(`  GBK解码: 中文字=${gbkCJK}, 替换符=${gbkReplacement}`);

        if (gbkCJK > hasCJK && !gbkReplacement) {
            fs.writeFileSync(file, gbkDecoded, 'utf8');
            console.log(`  ✅ 已修复 (GBK→UTF8), ${gbkCJK}个中文字`);
            continue;
        }
    }

    // If no obvious issues, just verify and report
    if (hasCJK > 100) {
        console.log(`  ✅ 文件正常 (UTF-8有效)`);
    } else {
        console.log(`  ⚠ 警告: 中文字符过少(${hasCJK})`);
    }
}

console.log('\n完成');
