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
    const utf8str = buf.toString('utf8');
    const gbkstr = ic.decode(buf, 'gbk');

    const utf8CJK = (utf8str.match(/[一-鿿]/g) || []).length;
    const gbkCJK = (gbkstr.match(/[一-鿿]/g) || []).length;

    console.log(`\n${fname}: UTF8中文字=${utf8CJK}, GBK中文字=${gbkCJK}`);

    if (gbkCJK > utf8CJK * 2) {
        // Strategy: treat entire file as GBK, but need to produce valid UTF-8
        // The HTML structure (tags, attributes like "charset=UTF-8") are ASCII-safe in both encodings
        // We need to figure out which parts are actual Chinese content vs ASCII

        // Since the file was originally valid UTF-8 HTML, the GBK interpretation
        // of ASCII parts will be mostly OK (ASCII bytes = same in both)
        // But we need to find GBK multi-byte sequences that represent Chinese
        // and encode them properly as UTF-8

        // Use a different strategy: find sequences in utf8str that look garbled
        // (appear as CJK in UTF8 but with weird Latin chars nearby) and fix them
        let fixed = utf8str;

        // Strategy: treat the file as UTF-8 with GBK-encoded Chinese characters
        // When GBK bytes are interpreted as UTF-8, each GBK char becomes:
        // - A CJK char (from the correct high byte) + some Latin-1 supplement chars
        // We can detect these patterns and convert back

        // Actually the simplest fix: read as GBK, but the HTML tags will be garbled
        // Solution: for each line, if it's mostly ASCII, keep UTF-8; if it has Chinese, use GBK

        const utf8Lines = utf8str.split('\n');
        const gbkLines = gbkstr.split('\n');

        const result = [];
        for (let i = 0; i < Math.max(utf8Lines.length, gbkLines.length); i++) {
            const uLine = utf8Lines[i] || '';
            const gLine = gbkLines[i] || '';

            const uCJK = (uLine.match(/[一-鿿]/g) || []).length;
            const uGarbled = (uLine.match(/[À-ÿ]/g) || []).length; // Latin-1 supplement
            const gCJK = (gLine.match(/[一-鿿]/g) || []).length;

            // If line has significantly more CJK in GBK interpretation, use GBK
            if (gCJK > uCJK * 2 && gCJK > 5) {
                // This line is GBK-encoded Chinese
                result.push(gLine);
            } else {
                // Use UTF-8 (original)
                result.push(uLine);
            }
        }

        const resultStr = result.join('\n');
        const finalCJK = (resultStr.match(/[一-鿿]/g) || []).length;
        console.log(`  修复后中文字=${finalCJK}`);

        fs.writeFileSync(file, resultStr, 'utf8');
        console.log(`  ✅ 已写入 ${fname}`);
    } else {
        console.log(`  无需修复`);
    }
}

console.log('\n完成！');
