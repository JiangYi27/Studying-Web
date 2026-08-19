const { execSync } = require('child_process');
try {
    const gitExe = 'git';
    const cwd = 'd:/Studying Web';
    // Try to get the last commit hash for index.html
    const log = execSync(gitExe + ' log --oneline -5 -- public/index.html', { cwd, encoding: 'utf8' });
    console.log('Git log for index.html:');
    console.log(log);
    // Try to get the content from HEAD
    const content = execSync(gitExe + ' show HEAD:public/index.html', { cwd, encoding: 'utf8' });
    console.log('HEAD version first 200 chars:');
    console.log(content.substring(0, 200));
} catch(e) {
    console.log('Git error:', e.message);
}
