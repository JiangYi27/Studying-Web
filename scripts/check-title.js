const fs = require('fs');
const b = fs.readFileSync('d:/Studying Web/public/index.html');
const s = b.toString('utf8');
const lines = s.split('\n');
const line6b = Buffer.from(lines[6], 'utf8');
console.log('line7 hex:', line6b.slice(7, 60).toString('hex'));
console.log('line7 text:', lines[6].slice(0, 80));
// Check how many valid 3-byte UTF-8 sequences
let valid3 = 0, invalid3 = 0;
for (let i = 0; i < line6b.length - 2; i++) {
    if (line6b[i] >= 0xE0 && line6b[i] <= 0xEF &&
        line6b[i+1] >= 0x80 && line6b[i+1] <= 0xBF &&
        line6b[i+2] >= 0x80 && line6b[i+2] <= 0xBF) {
        valid3++;
        i += 2;
    }
}
console.log('Valid 3-byte UTF-8 seqs in title:', valid3);
