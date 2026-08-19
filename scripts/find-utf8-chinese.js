const fs = require('fs');
const b = fs.readFileSync('d:/Studying Web/public/index.html');

// Search for the correct UTF-8 bytes of '研习室'
// 研 = E7A094, 习 = E4B9A0, 室 = E5AEA4
const TARGET = Buffer.from('研习室', 'utf8');
console.log('Target UTF-8 bytes for 研习室:', TARGET.toString('hex'));

// Search in raw bytes
let offset = -1;
for (let i = 0; i <= b.length - TARGET.length; i++) {
    let match = true;
    for (let j = 0; j < TARGET.length; j++) {
        if (b[i+j] !== TARGET[j]) { match = false; break; }
    }
    if (match) { offset = i; console.log('Found at byte offset:', offset); break; }
}
if (offset === -1) console.log('研习室 NOT found as UTF-8 bytes');

// Search for 知识库
const TARGET2 = Buffer.from('知识库', 'utf8');
console.log('Target for 知识库:', TARGET2.toString('hex'));
for (let i = 0; i <= b.length - TARGET2.length; i++) {
    let match = true;
    for (let j = 0; j < TARGET2.length; j++) {
        if (b[i+j] !== TARGET2[j]) { match = false; break; }
    }
    if (match) { console.log('知识库 found at:', i); break; }
}

// Also search for "C语言知识库" title
const TARGET3 = Buffer.from('C语言知识库', 'utf8');
console.log('Target for C语言知识库:', TARGET3.toString('hex'));
for (let i = 0; i <= b.length - TARGET3.length; i++) {
    let match = true;
    for (let j = 0; j < TARGET3.length; j++) {
        if (b[i+j] !== TARGET3[j]) { match = false; break; }
    }
    if (match) { console.log('C语言知识库 found at:', i); break; }
}

// Check the beginning of the file to understand the structure
console.log('\nFirst 200 bytes as UTF-8:');
console.log(b.slice(0, 200).toString('utf8').slice(0, 150));
console.log('\nFirst 200 bytes as hex:');
console.log(b.slice(0, 200).toString('hex'));
