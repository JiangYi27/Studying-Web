const fs = require('fs');
const ic = require('iconv-lite');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const back = path.join(PUBLIC, 'back.html');
const indexHtml = path.join(PUBLIC, 'index.html');
const prodHtml = path.join(PUBLIC, 'index.prod.html');

const backBuf = fs.readFileSync(back);
const backUtf8 = backBuf.toString('utf8');
const backGbk = ic.decode(backBuf, 'gbk');

const backUtf8Cjk = (backUtf8.match(/[一-鿿]/g)||[]).length;
const backGbkCjk = (backGbk.match(/[一-鿿]/g)||[]).length;

console.log('back.html:');
console.log('  UTF-8 CJK:', backUtf8Cjk);
console.log('  GBK CJK:', backGbkCjk);
console.log('  Title (UTF-8):', backUtf8.split('\n')[6]);

// Also check current index.html for comparison
const idxBuf = fs.readFileSync(indexHtml);
const idxUtf8 = idxBuf.toString('utf8');
const idxGbk = ic.decode(idxBuf, 'gbk');
const idxUtf8Cjk = (idxUtf8.match(/[一-鿿]/g)||[]).length;
const idxGbkCjk = (idxGbk.match(/[一-鿿]/g)||[]).length;
console.log('\nindex.html (current, corrupted):');
console.log('  UTF-8 CJK:', idxUtf8Cjk);
console.log('  GBK CJK:', idxGbkCjk);

// Use back.html as the clean source
// But first verify back.html is actually valid UTF-8
const replCount = (backUtf8.match(/�/g)||[]).length;
console.log('\nback.html replacement chars (U+FFFD):', replCount);

// If back.html looks better, use it to restore
if (backUtf8Cjk > idxUtf8Cjk || replCount < 10) {
    console.log('\n✅ Using back.html to restore index.html');

    // Also restore index.prod.html by replacing the HTML structure
    // Keep the CSS/JS bundle references from current index.prod.html
    const currentProd = fs.readFileSync(prodHtml, 'utf8');
    const backLines = backUtf8.split('\n');

    // Find the CSS/JS bundle refs in current prod
    const hasBundleCss = currentProd.includes('/css/bundle.css');
    const hasBundleJs = currentProd.includes('/js/bundle.js');
    console.log('Current prod has bundle.css:', hasBundleCss, 'bundle.js:', hasBundleJs);

    // Strategy: use back.html as base, find the CSS and JS section boundaries
    // and insert bundle refs there

    let html = backUtf8;

    // Replace CSS links with bundle.css
    html = html.replace(/<link[^>]*href="\/css\/[^"]*"[^>]*>/g, '');
    // Keep CDN links
    html = html.replace(
        /<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome[^"]*"[^>]*>/,
        '<link rel="stylesheet" href="/css/bundle.css">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">'
    );

    // Replace JS scripts with bundle.js
    html = html.replace(/<script[^>]*src="\/js\/[^"]*"[^>]*><\/script>/g, '');
    html = html.replace(
        /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap[^"]*"><\/script>/,
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n  <script src="/js/bundle.js" defer></script>'
    );

    console.log('Restored HTML CJK:', (html.match(/[一-鿿]/g)||[]).length);
    console.log('Has bundle.css:', html.includes('/css/bundle.css'));
    console.log('Has bundle.js:', html.includes('/js/bundle.js'));

    fs.writeFileSync(indexHtml, html, 'utf8');
    console.log('\n✅ index.html restored from back.html with bundles');

    // Also update prod html
    fs.writeFileSync(prodHtml, html, 'utf8');
    console.log('✅ index.prod.html updated');
} else {
    console.log('back.html does not appear to be cleaner, skipping');
}
