const fs = require('fs');
const ic = require('iconv-lite');

// Read raw bytes
const buf = fs.readFileSync('d:/Studying Web/public/index.html');

// Show the <title> content bytes precisely
// offset 144 = '<title>', offset 151 = first content byte
const titleContentStart = 151;
const titleContentBytes = buf.slice(titleContentStart, titleContentStart + 60);
console.log('Raw title content bytes:', titleContentBytes.toString('hex'));
console.log('As latin1:', titleContentBytes.toString('latin1'));

// Decode as GBK
const gbkDecoded = ic.decode(buf, 'gbk');
const gbkLines = gbkDecoded.split('\n');
console.log('\nAs GBK title:', gbkLines[6]);

// Decode as UTF-8
const utf8Decoded = buf.toString('utf8');
const utf8Lines = utf8Decoded.split('\n');
console.log('As UTF-8 title:', utf8Lines[6]);

// The correct title should be: 研习室 · 知识库
// GBK for 研习室: D1D8CFB0CAA7
// Let's check if those bytes exist near offset 151
const gbkBytes = Buffer.from('研习室', 'gbk');
console.log('\nGBK bytes for 研习室:', gbkBytes.toString('hex'));
// Search for D1D8CFB0CAA7 in raw buf
for (let i = titleContentStart - 10; i < titleContentStart + 100; i++) {
    let match = true;
    for (let j = 0; j < gbkBytes.length; j++) {
        if (buf[i+j] !== gbkBytes[j]) { match = false; break; }
    }
    if (match) console.log('GBK 研习室 found at offset', i);
}

// Also check the title tag itself to see where the title text starts
console.log('\nTitle tag analysis:');
for (let i = titleContentStart; i < titleContentStart + 30; i++) {
    const byte = buf[i];
    const isGBKLead = byte >= 0x81 && byte <= 0xFE;
    const isGBKTrail = byte >= 0x40 && byte <= 0xFE;
    console.log(`  offset ${i}: 0x${byte.toString(16).padStart(2,'0')} - GBKlead=${isGBKLead} GBKtrail=${isGBKTrail} latin=${String.fromCharCode(byte)}`);
}
