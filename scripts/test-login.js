const http = require('http');

const loginData = JSON.stringify({username: 'test', password: 'test123', site: 'c'});
const opts = {
    hostname: 'localhost', port: 3000,
    path: '/api/auth/login', method: 'POST',
    headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData)}
};

const req = http.request(opts, res => {
    const cookies = res.headers['set-cookie'];
    console.log('Login status:', res.statusCode, 'Cookies:', cookies ? cookies.length : 0);
    if (cookies && cookies[0]) {
        const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
        const appReq = http.get({hostname: 'localhost', port: 3000, path: '/app', headers: {'Cookie': cookieStr}}, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => {
                console.log('App size:', d.length, 'Title:', d.match(/<title>([^<]*)/)?.[1]);
                console.log('Has settingsAccountCard:', d.includes('settingsAccountCard'));
                console.log('Has aiqaView:', d.includes('aiqaView'));
                console.log('Has bundle.js:', d.includes('/js/bundle.js'));
                console.log('Has data-feature home:', d.includes('data-feature="home"'));
                console.log('Has ai-qa-toggle:', d.includes('ai-qa-toggle'));
            });
        });
    }
});
req.write(loginData);
req.end();
