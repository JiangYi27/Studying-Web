const fs = require('fs');
const ic = require('iconv-lite');

// Check the SOURCE CSS file for settings
const settingsCss = fs.readFileSync('d:/Studying Web/public/css/views/settings.css');
console.log('settings.css UTF8 CJK:', (settingsCss.toString('utf8').match(/[一-鿿]/g)||[]).length);
try {
    const gbk = ic.decode(settingsCss, 'gbk');
    console.log('settings.css GBK CJK:', (gbk.match(/[一-鿿]/g)||[]).length);
    console.log('settings.css GBK first 200:', gbk.slice(0, 200).toString());
} catch(e) { console.log('GBK error:', e.message); }

// Check settings view HTML in index.html
const idxBuf = fs.readFileSync('d:/Studying Web/public/index.html');
const idxGbk = ic.decode(idxBuf, 'gbk');
const idxLines = idxGbk.split('\n');
// Find settings section
for (let i = 0; i < idxLines.length; i++) {
    if (idxLines[i].includes('settings') && idxLines[i].includes('view')) {
        console.log('\nindex.html line', i+1, ':', idxLines[i].slice(0, 80));
    }
}

// Now the key question: are the JS source files clean?
const authJs = fs.readFileSync('d:/Studying Web/public/js/features/auth.js');
console.log('\nauth.js UTF8 CJK:', (authJs.toString('utf8').match(/[一-鿿]/g)||[]).length);
try {
    const gbk = ic.decode(authJs, 'gbk');
    console.log('auth.js GBK CJK:', (gbk.match(/[一-鿿]/g)||[]).length);
    console.log('auth.js GBK first 200:', gbk.slice(0, 200).toString());
} catch(e) {}

// Check if auth.js has the correct function
const authUtf8 = authJs.toString('utf8');
console.log('Has populateSettingsAccountInfo:', authUtf8.includes('populateSettingsAccountInfo'));
