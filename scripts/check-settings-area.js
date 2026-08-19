const fs = require('fs');
const ic = require('iconv-lite');

const buf = fs.readFileSync('d:/Studying Web/public/index.html');
const str = ic.decode(buf, 'gbk');
const lines = str.split('\n');

// Find settingsView section boundaries
let settingsStart = -1, settingsEnd = -1;
let viewCount = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id="settingsView"')) { settingsStart = i; viewCount++; }
    if (lines[i].includes('class="view"') && settingsStart >= 0 && settingsEnd < 0) {
        if (viewCount > 1) { settingsEnd = i - 1; break; }
        viewCount++;
    }
}
if (settingsStart >= 0 && settingsEnd < 0) settingsEnd = lines.length - 1;
console.log(`settingsView: lines ${settingsStart+1} to ${settingsEnd+1}`);

// Find aiqaView
let aiqaStart = -1, aiqaEnd = -1;
viewCount = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id="aiqaView"')) { aiqaStart = i; }
    if (aiqaStart >= 0 && lines[i].includes('class="view"') && i > aiqaStart) {
        aiqaEnd = i - 1; break;
    }
}
if (aiqaStart >= 0 && aiqaEnd < 0) aiqaEnd = Math.min(aiqaStart + 100, lines.length - 1);
console.log(`aiqaView: lines ${aiqaStart+1} to ${aiqaEnd+1}`);

// Print settings section (first 30 lines)
console.log('\n=== settingsView content (first 30 lines) ===');
for (let i = settingsStart; i < Math.min(settingsStart + 30, settingsEnd + 1); i++) {
    console.log(`${i+1}: ${lines[i]}`);
}

// Print AI section (first 20 lines)
console.log('\n=== aiqaView content (first 20 lines) ===');
for (let i = aiqaStart; i < Math.min(aiqaStart + 20, aiqaEnd + 1); i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
