const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    console.log(req.url, req.headers.cookie ? 'has cookie' : 'no cookie');
    const buf = fs.readFileSync('d:/Studying Web/public/index.prod.html');
    console.log('Sending', buf.length, 'bytes, ETag:', buf.slice(0,50).toString('hex').slice(0,20));
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'ETag': 'W/"' + buf.length + '-local"'});
    res.end(buf);
});

server.listen(3001, () => console.log('Test server on 3001'));

setTimeout(() => {
    http.get('http://localhost:3001', (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => {
            console.log('Response size:', d.length);
            const i = d.indexOf('<title>');
            console.log('Title:', d.substring(i, i + 80));
            server.close();
            process.exit();
        });
    });
}, 1000);
