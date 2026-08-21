const fs = require('fs');
const ic = require('iconv-lite');

// Check if bundles are clean
const bundleJs = fs.readFileSync('d:/Studying Web/public/js/bundle.js');
const bundleCss = fs.readFileSync('d:/Studying Web/public/css/bundle.css');

console.log('bundle.js size:', bundleJs.length);
console.log('bundle.js CJK (UTF-8):', (bundleJs.toString('utf8').match(/[一-鿿]/g)||[]).length);
try {
    const gbkJs = ic.decode(bundleJs, 'gbk');
    console.log('bundle.js CJK (GBK):', (gbkJs.match(/[一-鿿]/g)||[]).length);
} catch(e) { console.log('GBK decode error:', e.message); }

console.log('\nbundle.css size:', bundleCss.length);
console.log('bundle.css CJK (UTF-8):', (bundleCss.toString('utf8').match(/[一-鿿]/g)||[]).length);
try {
    const gbkCss = ic.decode(bundleCss, 'gbk');
    console.log('bundle.css CJK (GBK):', (gbkCss.match(/[一-鿿]/g)||[]).length);
} catch(e) { console.log('GBK decode error:', e.message); }

// Check if CSS bundle has the settings-account-card class
const cssUtf8 = bundleCss.toString('utf8');
console.log('\nbundle.css has .settings-account-card:', cssUtf8.includes('.settings-account-card'));
console.log('bundle.css has .settings-quick-actions:', cssUtf8.includes('.settings-quick-actions'));

// Check if JS bundle has settings functions
const jsUtf8 = bundleJs.toString('utf8');
console.log('bundle.js has populateSettingsAccountInfo:', jsUtf8.includes('populateSettingsAccountInfo'));
console.log('bundle.js has initAuth:', jsUtf8.includes('function initAuth'));
