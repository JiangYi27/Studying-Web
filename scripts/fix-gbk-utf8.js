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

    // The file is GBK encoded (Chinese text stored as GBK bytes)
    // Decode as GBK, then encode as UTF-8
    const gbkStr = ic.decode(buf, 'gbk');
    const cjkCount = (gbkStr.match(/[一-鿿]/g) || []).length;
    console.log(`${fname}: GBK解码得到 ${cjkCount} 个中文字`);
    console.log('  标题: ' + gbkStr.split('\n')[6]);

    // Verify it's valid UTF-8
    const reencoded = Buffer.from(gbkStr, 'utf8');
    const verify = reencoded.toString('utf8');
    const verifyCJK = (verify.match(/[一-鿿]/g) || []).length;
    console.log('  重编码UTF-8验证: ' + verifyCJK + ' 个中文');

    if (verifyCJK === cjkCount) {
        fs.writeFileSync(file, gbkStr, 'utf8');
        console.log(`  ✅ 已写入 (UTF-8格式, GBK内容还原)`);
    } else {
        console.log(`  ⚠ 重编码验证失败, 跳过`);
    }
}

console.log('\n完成!');
