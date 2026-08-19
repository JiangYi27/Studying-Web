#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(__dirname, '..', 'public', 'index.prod.html')
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');

    // Remove all individual CSS links (local /css/)
    html = html.replace(/<link[^>]*href="\/css\/[^"]*"[^>]*>/g, '');

    // Insert bundle.css after font-awesome
    html = html.replace(
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">',
        '<link rel="stylesheet" href="/css/bundle.css">\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">'
    );

    // Remove all individual JS script tags (local /js/)
    html = html.replace(/<script[^>]*src="\/js\/[^"]*"[^>]*><\/script>/g, '');

    // Insert bundle.js after bootstrap.bundle.min.js
    html = html.replace(
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>',
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n  <script src="/js/bundle.js" defer></script>'
    );

    // Clean up multiple blank lines
    html = html.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(file, html, 'utf8');

    const hasCss = html.includes('/css/bundle.css');
    const hasJs = html.includes('/js/bundle.js');
    const title = html.match(/<title>([^<]*)/)?.[1];
    console.log(`${path.basename(file)}: title="${title}", bundle.css=${hasCss}, bundle.js=${hasJs}, size=${html.length}`);
}

console.log('\nDone!');
