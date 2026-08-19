const http = require('http');

function post(path, data) {
    return new Promise((resolve) => {
        const body = JSON.stringify(data);
        const opts = {
            hostname: 'localhost', port: 3000,
            path, method: 'POST',
            headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)}
        };
        const req = http.request(opts, res => {
            const cookies = res.headers['set-cookie'];
            const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
            resolve({status: res.statusCode, cookie: cookieStr, location: res.headers.location});
        });
        req.write(body);
        req.end();
    });
}

function get(path, cookie) {
    return new Promise((resolve) => {
        const opts = {hostname: 'localhost', port: 3000, path, headers: cookie ? {'Cookie': cookie} : {}};
        http.get(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({status: res.statusCode, data: d}));
        });
    });
}

(async () => {
    // Login
    const r1 = await post('/api/auth/login', {username: 'admin', password: 'admin123', site: 'c'});
    console.log('Login status:', r1.status, 'Cookie:', r1.cookie ? 'YES' : 'NO');

    if (r1.cookie) {
        // Get app
        const r2 = await get('/app', r1.cookie);
        console.log('App status:', r2.status, 'Size:', r2.data.length);
        console.log('Title:', r2.data.match(/<title>([^<]*)/)?.[1]);
        console.log('Has settingsAccountCard:', r2.data.includes('settingsAccountCard'));
        console.log('Has aiqaView:', r2.data.includes('aiqaView'));
        console.log('Has bundle.js:', r2.data.includes('/js/bundle.js'));
        console.log('Has data-feature:', r2.data.includes('data-feature="home"'));
        console.log('Has ai-qa-toggle:', r2.data.includes('ai-qa-toggle'));
    }
})();
