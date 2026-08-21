#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'index.prod.html');
let html = fs.readFileSync(file, 'utf8');

// 1. Replace ALL individual CSS links (from <link href="/css/ to .css">) with bundle.css
// Keep the bootstrap, font-awesome, and google-fonts links (CDN)
html = html.replace(/<link[^>]*href="\/css\/[^"]*"[^>]*>/g, '');

// Insert bundle.css after bootstrap link
html = html.replace(
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">',
    '<link rel="stylesheet" href="/css/bundle.css">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">'
);

// 2. Remove the Prism comment (it's garbled and roadmap.js has its own Prism)
html = html.replace(/<!-- Prism[^\n]*\n\s*<!--[^\n]*\n\s*/g, '');

// 3. Replace ALL individual JS script tags (from <script src="/js/ to .js>) with bundle.js
// But keep bootstrap.bundle and login-page.js
html = html.replace(/<script[^>]*src="\/js\/[^"]*"[^>]*><\/script>/g, '');

// Insert bundle.js after bootstrap bundle
html = html.replace(
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script>',
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n  <script src="/js/bundle.js" defer></script>'
);

// 4. Clean up multiple blank lines
html = html.replace(/\n{3,}/g, '\n\n');

// Verify
const cjkCount = (html.match(/[一-鿿]/g) || []).length;
console.log('CJK chars:', cjkCount);
console.log('Has bundle.css:', html.includes('/css/bundle.css'));
console.log('Has bundle.js:', html.includes('/js/bundle.js'));
console.log('Has bootstrap:', html.includes('bootstrap@5.3.0'));
console.log('Has font-awesome:', html.includes('font-awesome'));
console.log('Total length:', html.length);

// Check title
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<title>')) {
        console.log('Title line:', lines[i].trim());
        break;
    }
}

fs.writeFileSync(file, html, 'utf8');
console.log('\n✅ index.prod.html rewritten');
