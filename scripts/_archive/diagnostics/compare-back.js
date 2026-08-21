const fs = require('fs');
const ic = require('iconv-lite');

const back = fs.readFileSync('d:/Studying Web/public/back.html', 'utf8');
const idx = ic.decode(fs.readFileSync('d:/Studying Web/public/index.html'), 'gbk');

console.log('back.html CJK:', (back.match(/[一-鿿]/g)||[]).length);
console.log('index.html (GBK) CJK:', (idx.match(/[一-鿿]/g)||[]).length);

// Check what sections back.html has
const sections = [
    'settingsView', 'settingsAccountCard', 'aiqaView', 'quickChangePwdBtn',
    'openEditProfileBtn', 'sidebar', 'nav-item', 'data-feature'
];
for (const s of sections) {
    console.log(`back.html has ${s}:`, back.includes(s));
}
