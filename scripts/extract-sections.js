const fs = require('fs');
const ic = require('iconv-lite');

// The garbled index.html - treat its raw bytes as GBK and decode
const buf = fs.readFileSync('d:/Studying Web/public/index.html');
const str = ic.decode(buf, 'gbk');

// Find the key new sections
const targets = [
    'settingsAccountCard', 'settings-quick-actions', 'quickChangePwdBtn',
    'openEditProfileBtn', 'aiqaView', 'aiqa-header', 'aiqa-grid',
    'settingsView'
];

for (const t of targets) {
    const idx = str.indexOf(t);
    if (idx >= 0) {
        // Show 200 chars around the match
        const start = Math.max(0, idx - 50);
        const end = Math.min(str.length, idx + 150);
        console.log(`\n${t} found at ${idx}:`);
        console.log('Context:', str.slice(start, end).replace(/\n/g, ' ').slice(0, 150));
    } else {
        console.log(`\n${t}: NOT FOUND`);
    }
}
