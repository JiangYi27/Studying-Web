const fs = require('fs');
const b = fs.readFileSync('d:/Studying Web/public/index.html');

// Print exact hex of first 500 bytes
console.log('First 500 bytes hex:');
console.log(b.slice(0, 500).toString('hex'));

// Find where Chinese content starts (look for bytes >= 0x80)
let chineseStart = -1;
for (let i = 0; i < Math.min(b.length, 500); i++) {
    if (b[i] >= 0x80) { chineseStart = i; break; }
}
console.log('\nFirst non-ASCII byte at offset:', chineseStart);
if (chineseStart >= 0) {
    console.log('Context (20 bytes around):', b.slice(chineseStart - 5, chineseStart + 25).toString('hex'));
}

// Also check: what encoding does the terminal suggest?
// Look for UTF-8 BOM
console.log('\nHas UTF-8 BOM (EF BB BF):', b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF);

// Check the title area more precisely
// The title tag starts at some offset - search for 'title' in bytes
for (let i = 0; i < b.length - 5; i++) {
    if (b[i] === 0x3c && b[i+1] === 0x74 && b[i+2] === 0x69 && b[i+3] === 0x74 && b[i+4] === 0x6c && b[i+5] === 0x65) {
        console.log('\n<title> tag found at offset:', i);
        console.log('Next 100 bytes from title tag:');
        console.log(b.slice(i, i + 100).toString('hex'));
        console.log('As latin1:', b.slice(i, i + 100).toString('latin1'));
        break;
    }
}
