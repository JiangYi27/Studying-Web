#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'index.prod.html');
let html = fs.readFileSync(file, 'utf8');

// Remove ALL <link href="/css/...> tags
html = html.replace(/<link[^>]*href="\/css\/[^"]*"[^>]*>/g, '');

// Insert bundle.css after bootstrap CSS (the one with cdnjs.cloudflare.com/font-awesome)
html = html.replace(
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">',
    '<link rel="stylesheet" href="/css/bundle.css">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">'
);

// Remove ALL <script src="/js/...> tags (local scripts)
html = html.replace(/<script[^>]*src="\/js\/[^"]*"[^>]*><\/script>/g, '');

// Insert bundle.js after bootstrap.bundle.min.js
html = html.replace(
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n  <script src="/js/bundle.js" defer></script>'
);

// Clean up multiple blank lines (keep at most 2)
html = html.replace(/\n{3,}/g, '\n\n');

// Verify
console.log('Has bundle.css:', html.includes('/css/bundle.css'));
console.log('Has bundle.js:', html.includes('/js/bundle.js'));
console.log('Has bootstrap CSS:', html.includes('bootstrap@5.3.0/dist/css/bootstrap.min.css'));
console.log('Has bootstrap JS:', html.includes('bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'));
console.log('Total length:', html.length);
console.log('Title:', html.match(/<title>[^<]*<\/title>/)?.[0] || 'NOT FOUND');

// Check if there are any remaining /css/ or /js/ local refs
const remainingCss = html.match(/href="\/css\/[^"]*"/g) || [];
const remainingJs = html.match(/src="\/js\/[^"]*"/g) || [];
console.log('Remaining local CSS refs:', remainingCss.length, remainingCss.slice(0,3));
console.log('Remaining local JS refs:', remainingJs.length, remainingJs.slice(0,3));

fs.writeFileSync(file, html, 'utf8');
console.log('\n✅ Written');
