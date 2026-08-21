const http = require('http');
const fs = require('fs');

// Start a simple server on port 3002 that serves index.prod.html
const buf = fs.readFileSync('d:/Studying Web/public/index.prod.html');
console.log('index.prod.html bytes:', buf.length);
console.log('First 50 bytes hex:', buf.slice(0, 50).toString('hex'));

const server = http.createServer((req, res) => {
    console.log('Request:', req.url);
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Content-Length': buf.length});
    res.end(buf);
});

server.listen(3002, () => console.log('Server on 3002'));
