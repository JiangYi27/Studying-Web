const http = require('http');
const fs = require('fs');
const path = require('path');

const PROD = path.join(__dirname, '..', 'public', 'index.prod.html');
const buf = fs.readFileFileSync(PROD);
console.log('File size:', buf.length);

const server = http.createServer((req, res) => {
    if (req.url === '/test') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('OK');
        return;
    }
    const html = fs.readFileSync(PROD);
    console.log('Serving', html.length, 'bytes');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(html);
});

server.listen(3003, () => console.log('Diag server on 3003'));

setTimeout(() => {
    http.get('http://localhost:3003/test', r => {
        console.log('Test response:', r.statusCode);
        http.get('http://localhost:3003', r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => {
                console.log('HTML size:', d.length);
                const i = d.indexOf('<title>');
                console.log('Title:', d.substring(i, i + 80));
                const bundleJs = d.includes('/js/bundle.js');
                const bundleCss = d.includes('/css/bundle.css');
                console.log('Has bundle.js:', bundleJs, 'Has bundle.css:', bundleCss);
                server.close();
                process.exit();
            });
        });
    });
}, 1000);
