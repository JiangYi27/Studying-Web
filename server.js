const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const config = require('./config');
const apiRouter = require('./routes/apiRouter');
const authRouter = require('./routes/authRouter');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// 生产构建产物（index.prod.html 由 scripts/build.js 生成，聚合了全部 CSS/JS）
// 开发调试用拆分文件（index.html），构建后自动切换，避免 39 个请求拖慢加载。
const prodHtmlPath = path.join(__dirname, 'public', 'index.prod.html');
const htmlFile = fs.existsSync(prodHtmlPath) ? prodHtmlPath : path.join(__dirname, 'public', 'index.html');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}));

// 静态文件（public 目录下的所有文件可直接访问）
// 关闭默认 index.html 自动响应：根路径交给下方 SPA 路由返回打包版 HTML
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// 登录鉴权路由（须在 apiRouter 之前挂载）
app.use('/api/auth', authRouter);

// API 路由
app.use('/api', apiRouter);

// 所有非 API 请求都返回打包后的 HTML（支持前端路由）
app.get('*', (req, res) => {
  res.sendFile(htmlFile);
});

app.listen(config.port, () => {
  console.log(`运行在 http://localhost:${config.port}`);
});