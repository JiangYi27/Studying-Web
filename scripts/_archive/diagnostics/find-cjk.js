const fs = require('fs');
const b = fs.readFileSync('d:/Studying Web/public/index.html');
const s = b.toString('utf8');
const good = (s.match(/[一-鿿]/g) || []);
console.log('Valid CJK chars:', good.length);
// Sample first 20
console.log('Sample:', good.slice(0, 20).join(''));
// Check if '研' exists
const yanIdx = s.indexOf('研');
console.log('研 index:', yanIdx);
if (yanIdx >= 0) console.log('Context:', s.slice(yanIdx - 5, yanIdx + 10));
// Check for replacement chars
const repl = (s.match(/\uFFFD/g) || []).length;
console.log('Replacement chars (U+FFFD):', repl);
