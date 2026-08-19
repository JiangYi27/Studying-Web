const http = require('http');
const fs = require('fs');
const path = require('path');

const PROD = path.join(__dirname, '..', 'public', 'index.prod.html');
const html = fs.readFileSync(PROD);

console.log('index.prod.html size:', html.length);
console.log('Has bundle.css:', html.includes('/css/bundle.css'));
console.log('Has bundle.js:', html.includes('/js/bundle.js'));
console.log('Has settingsAccountCard:', html.includes('settingsAccountCard'));
console.log('Has aiqaView:', html.includes('aiqaView'));

// Title
const i = html.indexOf('<title>');
console.log('Title:', html.substring(i, i + 80));

// Start a test server
const server = http.createServer((req, res) => {
    console.log('Serving app shell for', req.url);
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(html);
});

server.listen(3004, () => {
    console.log('\nTest server running on port 3004');
    console.log('Visit: http://localhost:3004/app');
    console.log('Note: The title will show garbled Chinese but browser should render correctly');
});
