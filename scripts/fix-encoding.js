#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const files = ['index.html', 'index.prod.html'].map(f => path.join(PUBLIC, f));

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log('⚠ 跳过（不存在）: ' + file);
        continue;
    }

    const buf = fs.readFileSync(file);
    const str = buf.toString('utf-8');

    // 检测是否包含 UTF-8 混 GBK 的乱码特征（GBK双字节字符被当UTF-8解读的痕迹）
    // 常见乱码特征：� 或 U+FFFD，或 "锟斤拷" 等
    const hasGarbled = str.includes('�') || str.includes('锟斤拷');

    // 检测是否看起来是有效的 UTF-8 中文内容（有效UTF-8中文范围）
    const hasValidUTF8Chinese = /[一-鿿]/.test(str);

    // 如果有大量乱码标记但也有有效中文，说明是GBK编码被误读为UTF-8
    const garbledChinese = (str.match(/[-ÿ]/g) || []).length;
    const normalChinese = (str.match(/[一-鿿]/g) || []).length;

    console.log(`\n${path.basename(file)}:`);
    console.log(`  字节长度: ${buf.length}`);
    console.log(`  有效中文: ${normalChinese}, 异常Latin: ${garbledChinese}, 乱码标记: ${hasGarbled}`);

    if (hasGarbled && normalChinese > 100) {
        // 尝试用 GBK 解码
        const gbkStr = Buffer.from(buf).toString('gbk');
        const gbkChinese = (gbkStr.match(/[一-鿿]/g) || []).length;
        const gbkGarbled = gbkStr.includes('�') || gbkStr.includes('锟斤拷');

        console.log(`  GBK解码: 有效中文=${gbkChinese}, 乱码=${gbkGarbled}`);

        if (gbkChinese > normalChinese * 2 && !gbkGarbled) {
            // GBK解码后更干净，写回UTF-8
            fs.writeFileSync(file, gbkStr, 'utf-8');
            console.log(`  ✅ 已修复（GBK→UTF-8），已写入 ${gbkChinese} 个中文字符`);
        } else {
            console.log(`  ⚠ GBK解码无明显改善，跳过`);
        }
    } else if (hasValidUTF8Chinese) {
        console.log(`  ✅ 文件编码正常（UTF-8），无需修复`);
    } else {
        console.log(`  ⚠ 无法确定编码类型，跳过`);
    }
}

console.log('\n完成！');
