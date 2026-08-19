const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('node:crypto');
const session = require('express-session');
const helmet = require('helmet');
const config = require('./config');
const apiRouter = require('./routes/apiRouter');
const authRouter = require('./routes/authRouter');
const adminRouter = require('./routes/adminRouter');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// 生产构建产物（index.prod.html 由 scripts/build.js 生成，聚合了全部 CSS/JS）
const prodHtmlPath = path.join(__dirname, 'public', 'index.prod.html');
const htmlFile = fs.existsSync(prodHtmlPath) ? prodHtmlPath : path.join(__dirname, 'public', 'index.html');

// EJS 模板引擎（登录前独立页）
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== 安全响应头（Helmet） ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      // 关闭 upgrade-insecure-requests：纯 HTTP 阶段避免浏览器把资源强制升级为 https 导致加载失败；
      // 后续配置 Nginx + HTTPS 后由反向代理统一处理，无需此指令。
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false, // 允许加载跨域视频
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

// ==================== Session 配置（安全加固） ====================
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// ==================== CSRF 防护 ====================
// 自定义 session-based CSRF token（csurf 已废弃，自实现）
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfProtection(req, res, next) {
  // GET/HEAD/OPTIONS 不需要 CSRF 校验
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    return next();
  }

  // 登录、注册、登出、重置密码等接口不需要 CSRF
  // 整个 /api/admin 也豁免（admin 独立登录，不使用 CSRF token）
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register' ||
      req.path === '/api/auth/logout' ||
      req.path === '/api/auth/forgot-password' || req.path === '/api/auth/reset-password' ||
      req.path.startsWith('/api/admin')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF 验证失败' });
  }
  next();
}

// 暴露 CSRF token 给前端
app.get('/api/csrf-token', (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  res.json({ csrfToken: req.session.csrfToken });
});

app.use(csrfProtection);

// 静态文件（public 目录下的所有文件可直接访问）
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// 登录鉴权路由（须在 apiRouter 之前挂载）
app.use('/api/auth', authRouter);

// 管理后台 API 路由
app.use('/api/admin', adminRouter);

// API 路由
app.use('/api', apiRouter);

// 判断是否已登录
function isLoggedIn(req) {
  return !!(req.session && req.session.user);
}

// 登录前页面：未登录渲染独立登录页，已登录进应用
app.get(['/', '/login'], (req, res) => {
  if (isLoggedIn(req)) {
    return res.redirect('/app');
  }
  res.render('login');
});

// 密码重置页面
app.get('/reset-password', (req, res) => {
  res.render('reset-password', { token: req.query.token || '' });
});

// 应用页：未登录回登录页，已登录返回应用壳 HTML
app.get('/app', (req, res) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/');
  }
  res.sendFile(htmlFile);
});

// 其他所有非 API 请求 → 应用壳（未登录跳登录页）
app.get('*', (req, res) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/');
  }
  res.sendFile(htmlFile);
});

// ==================== 全局错误处理 ====================
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err);
  process.exit(1);
});

app.listen(config.port, () => {
  console.log(`运行在 http://localhost:${config.port}`);
});