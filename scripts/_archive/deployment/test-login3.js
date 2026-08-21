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
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({status: res.statusCode, data: d, cookies: res.headers['set-cookie']}));
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
    // Register a test user
    const r1 = await post('/api/auth/register', {
        username: 'testuser',
        password: 'test123',
        email: 'test@test.com',
        displayName: '测试用户'
    });
    console.log('Register status:', r1.status, r1.data.slice(0, 200));

    if (r1.status === 200 || r1.status === 201) {
        // Login
        const r2 = await post('/api/auth/login', {username: 'testuser', password: 'test123', site: 'c'});
        console.log('Login status:', r2.status, 'Cookie:', r2.cookies ? 'YES' : 'NO');

        if (r2.cookies && r2.cookies[0]) {
            const cookieStr = r2.cookies.map(c => c.split(';')[0]).join('; ');
            const r3 = await get('/app', cookieStr);
            console.log('App status:', r3.status, 'Size:', r3.data.length);
            console.log('Title:', r3.data.match(/<title>([^<]*)/)?.[1]);
            console.log('Has settingsAccountCard:', r3.data.includes('settingsAccountCard'));
            console.log('Has aiqaView:', r3.data.includes('aiqaView'));
            console.log('Has bundle.js:', r3.data.includes('/js/bundle.js'));
        }
    }
})();
