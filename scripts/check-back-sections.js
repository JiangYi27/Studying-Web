const fs = require('fs');
const ic = require('iconv-lite');

const back = fs.readFileSync('d:/Studying Web/public/back.html', 'utf8');
const lines = back.split('\n');

// Find settingsView section in back.html
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('settingsView') || lines[i].includes('璁剧疆')) {
        console.log(`Line ${i+1}: ${lines[i].slice(0,80)}`);
    }
    if (lines[i].includes('aiqa') || lines[i].includes('AI') || lines[i].includes('答疑')) {
        console.log(`Line ${i+1}: ${lines[i].slice(0,80)}`);
    }
}

// Find the sidebar nav items
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('nav-item') && lines[i].includes('data-view')) {
        console.log(`Nav line ${i+1}: ${lines[i].trim().slice(0,100)}`);
    }
}
