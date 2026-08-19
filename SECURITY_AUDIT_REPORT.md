# 🔒 Web 应用安全审计报告

**项目**: C语言学习Web应用 (c-study)  
**技术栈**: Node.js + Express + SQLite (better-sqlite3) + EJS  
**审计日期**: 2026-08-18  
**审计方法**: 静态代码审计 + 逻辑分析  

---

## 1. 总体评价

项目整体代码结构清晰，模块化程度较好，使用了 `better-sqlite3`（同步 API + 参数化查询）来避免 SQL 注入，密码使用 bcrypt 哈希存储，会话管理使用了 `express-session`。**但存在若干中等严重程度的安全问题，特别是缺少 CSRF 防护、Session Cookie 安全属性缺失、用户枚举、缺少速率限制、以及 admin 密码明文硬编码等**。未发现可远程直接获取系统权限的严重漏洞，但在生产环境部署前必须修复标记为 **高** 和 **中** 等级的问题。

**最严重的问题**：
1. `.env` 文件中包含弱密码明文（`admin123`、`tom123`）
2. Session Cookie 缺少 `httpOnly`、`secure`、`sameSite` 属性
3. 所有修改类接口缺少 CSRF 防护
4. 无任何速率限制，登录/注册接口可被暴力破解
5. 注册接口可被用于用户枚举

---

## 2. 安全漏洞列表

### 🔴 高风险

#### 2.1 弱密码 + .env 文件泄露风险

- **严重等级**: 高
- **漏洞位置**: [.env](.env#L5-L6)
- **描述**: `.env` 文件中 `USER_PASSWORD_ADMIN=admin123`、`USER_PASSWORD_TOM=tom123` 均为弱密码。虽然 `.env` 已在 `.gitignore` 中，但若因配置错误被提交到仓库或被部署工具泄露，攻击者可直接通过弱密码登录管理员账号。
- **触发条件**: `.env` 文件意外泄露 + 弱密码
- **复现步骤**:
  1. 获取 `.env` 文件内容（通过错误配置、备份文件、或 `.env.example` 泄露）
  2. 使用 `admin / admin123` 登录 `/api/auth/login`
  3. 获得管理员权限
- **修复建议**:
  ```
  # 使用强随机密码，至少 16 位，包含大小写字母、数字、特殊字符
  USER_PASSWORD_ADMIN=Kj9#mP2$vL7@xR4!qW8
  USER_PASSWORD_TOM=Nc5&bH3^jM6*eS1!pA9
  ```

#### 2.2 Session Cookie 缺少安全属性

- **严重等级**: 高
- **漏洞位置**: [server.js:25-29](server.js#L25-L29)
- **描述**: `express-session` 配置未设置 cookie 的 `httpOnly`、`secure`、`sameSite` 属性，使用默认值。默认情况下 `httpOnly` 为 `true`（安全），但 `secure` 为 `false`（自动检测），`sameSite` 未设置。这可能导致 Cookie 被 JavaScript 读取（XSS 后可窃取 Session）或在跨站请求中被发送。
- **触发条件**: 存在 XSS 漏洞时，攻击者可读取 Cookie；或通过 CSRF 攻击利用 Session
- **复现步骤**:
  1. 在存在 XSS 的页面注入 `document.cookie`
  2. 获取 `connect.sid` 值
  3. 使用该 Cookie 冒充受害者
- **修复建议**:
  ```javascript
  app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
  }));
  ```

#### 2.3 缺少 CSRF 防护

- **严重等级**: 高
- **漏洞位置**: 所有修改类路由（[authRouter.js](routes/authRouter.js), [adminRouter.js](routes/adminRouter.js), [apiRouter.js](routes/apiRouter.js)）
- **描述**: 应用使用 Session 进行身份认证，但所有 POST/PUT/PATCH/DELETE 接口均未校验 CSRF Token。攻击者可以构造恶意页面，诱导已登录用户触发非预期的状态修改操作。
- **触发条件**: 用户已登录，访问攻击者控制的页面
- **复现步骤**:
  1. 攻击者构造一个恶意页面，包含自动提交的表单
  2. 表单 action 指向 `https://目标站/api/auth/change-password`
  3. 诱导已登录用户访问该页面
  4. 用户密码被修改为攻击者指定的值
- **修复建议**:
  ```javascript
  const csrf = require('csurf');
  const csrfProtection = csrf({ cookie: false }); // 使用 session 存储 token
  
  // 为所有修改类路由添加 CSRF 保护
  router.post('/change-password', csrfProtection, (req, res) => { ... });
  
  // 前端需要在请求头中携带 CSRF Token
  fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify({ ... })
  });
  ```

#### 2.4 缺少速率限制（暴力破解风险）

- **严重等级**: 高
- **漏洞位置**: [authRouter.js](routes/authRouter.js) 所有路由
- **描述**: 登录、注册、修改密码等接口均无速率限制。攻击者可以无限次尝试登录，暴力破解用户密码。
- **触发条件**: 攻击者编写脚本对登录接口发起大量请求
- **复现步骤**:
  1. 使用 Burp Suite / Hydra 等工具
  2. 对 `/api/auth/login` 发起 POST 请求，尝试常见密码字典
  3. 无任何限制，可持续尝试直到破解成功
- **修复建议**:
  ```javascript
  const rateLimit = require('express-rate-limit');
  
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 最多10次尝试
    message: { error: '登录尝试过于频繁，请15分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  router.post('/login', loginLimiter, (req, res) => { ... });
  ```

---

### 🟡 中风险

#### 2.5 用户枚举漏洞

- **严重等级**: 中
- **漏洞位置**: [authRouter.js:140-142](routes/authRouter.js#L140-L142)
- **描述**: 注册接口 `/api/auth/register` 在用户名已存在时返回 `"该账号已存在，请直接登录"`，攻击者可以通过批量注册尝试来枚举已存在的用户账号。
- **触发条件**: 攻击者提交已存在的用户名进行注册
- **复现步骤**:
  1. 向 `/api/auth/register` 发送 POST 请求
  2. 尝试常见用户名列表（admin, root, test, tom...）
  3. 根据返回信息判断哪些账号已存在
  4. 对已知存在的账号进行密码暴力破解
- **修复建议**:
  ```javascript
  // 不要在注册接口中区分"用户已存在"——统一返回需要邮箱验证的提示
  if (userExists(uname)) {
    // 仍然返回成功，但发送邮件提示"如该账号已存在，请登录"
    // 或者使用延时响应来模糊化判断
    return res.json({ 
      success: true, 
      message: '如果账号有效，我们将发送验证邮件' 
    });
  }
  ```

#### 2.6 错误信息泄露内部细节

- **严重等级**: 中
- **漏洞位置**: [apiRouter.js](routes/apiRouter.js) 多处，例如 `res.status(500).json({ error: err.message })`
- **描述**: 多个 API 接口在发生错误时直接返回 `err.message`，可能泄露文件路径、数据库结构等内部信息。
- **触发条件**: 触发异常情况（如文件不存在、JSON 解析错误等）
- **复现步骤**:
  1. 向 `/api/chapters` 发送请求，触发异常
  2. 观察响应中是否包含文件路径等敏感信息
- **修复建议**:
  ```javascript
  } catch (err) {
    console.error('[api/chapters]', err); // 仅在服务端记录详细错误
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
  ```

#### 2.7 admin 用户明文密码 + 静态密码比对

- **严重等级**: 中
- **漏洞位置**: [authRouter.js:44-45](routes/authRouter.js#L44-L45), [config/index.js:12-15](config/index.js#L12-L15)
- **描述**: 静态账号（admin, tom）的密码从环境变量以明文加载，登录时做明文比对（`user.password === password`）。如果 `.env` 泄露，密码直接暴露。且明文比对不是恒定时间比较（虽然 bcryptjs 的 compareSync 也不是恒定时间的，但 bcrypt 哈希本身提供了一层保护）。
- **触发条件**: `.env` 文件泄露或环境变量泄露
- **复现步骤**: 同上 2.1
- **修复建议**:
  ```javascript
  // 启动时将所有静态账号的密码也 bcrypt 哈希化
  const staticUsers = usersConfig.users.map((u) => ({
    ...u,
    passwordHash: process.env[`USER_PASSWORD_${u.username.toUpperCase()}`] 
      ? bcrypt.hashSync(process.env[`USER_PASSWORD_${u.username.toUpperCase()}`], 10)
      : null,
  }));
  // 登录时统一使用 bcrypt.compareSync
  ```

#### 2.8 缺少安全响应头

- **严重等级**: 中
- **漏洞位置**: [server.js](server.js) 全局
- **描述**: 应用未设置任何安全相关的 HTTP 响应头，如 `X-Content-Type-Options`、`X-Frame-Options`、`X-XSS-Protection`、`Content-Security-Policy`、`Strict-Transport-Security` 等。
- **触发条件**: 所有 HTTP 响应
- **复现步骤**: 访问任意页面，查看响应头
- **修复建议**:
  ```javascript
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'"],
        connectSrc: ["'self'"],
      }
    }
  }));
  ```

#### 2.9 Session 密钥回退为随机值

- **严重等级**: 中
- **漏洞位置**: [config/index.js:37](config/index.js#L37)
- **描述**: 当 `SESSION_SECRET` 环境变量未设置时，使用 `crypto.randomBytes(32).toString('hex')` 生成随机密钥。这意味着每次服务重启都会生成新密钥，所有已登录用户的 Session 都会失效。虽然这是安全的兜底策略，但如果在生产环境中忘记设置该变量，会导致用户体验问题，且可能被利用进行 DoS（反复触发重启）。
- **触发条件**: 生产环境未设置 `SESSION_SECRET` 环境变量
- **复现步骤**:
  1. 不设置 SESSION_SECRET 启动应用
  2. 用户登录
  3. 重启应用
  4. 用户 Session 失效，需重新登录
- **修复建议**:
  ```javascript
  // 启动时检查并警告
  if (!process.env.SESSION_SECRET) {
    console.warn('[WARNING] SESSION_SECRET 未设置，使用随机密钥（每次重启会话失效）');
    if (process.env.NODE_ENV === 'production') {
      console.error('[FATAL] 生产环境必须设置 SESSION_SECRET');
      process.exit(1);
    }
  }
  ```

#### 2.10 saveUninitialized: true 导致 Session 膨胀

- **严重等级**: 中
- **漏洞位置**: [server.js:28](server.js#L28)
- **描述**: `saveUninitialized: true` 意味着即使未登录的访客也会创建 Session。这可能导致内存中存储大量无意义的 Session 对象，且为 Session 固定攻击提供了更多目标。
- **触发条件**: 任何未登录用户访问应用
- **复现步骤**: 使用无痕浏览器访问应用 → 被分配 Session → 即使不登录也占用资源
- **修复建议**:
  ```javascript
  app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false, // 改为 false
    cookie: { httpOnly: true, secure: false, sameSite: 'lax' }
  }));
  ```

---

### 🟢 低风险

#### 2.11 头像 URL 可注入任意链接

- **严重等级**: 低
- **漏洞位置**: [authRouter.js:253-282](routes/authRouter.js#L253-L282)
- **描述**: `PATCH /api/auth/me` 接口的 `avatar` 字段接受任意字符串，前端直接将其赋值给 `<img src="...">`。虽然这不会直接导致 XSS（img src 中的 JavaScript URL 在现代浏览器中不可执行），但可用于 SSRF 探测（服务器不会请求该 URL，但可被用于用户追踪，如通过引用外部图片 URL 记录用户 IP）。
- **触发条件**: 用户提交恶意 avatar URL
- **复现步骤**:
  1. 修改个人资料，设置 avatar 为 `https://attacker.com/track.gif`
  2. 其他管理员查看用户列表时，浏览器会请求该图片
  3. 攻击者获取查看者的 IP 和 User-Agent
- **修复建议**:
  ```javascript
  // 服务端校验 avatar URL 格式
  if (typeof avatar === 'string' && avatar.trim()) {
    try {
      const url = new URL(avatar.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({ error: '头像地址无效' });
      }
      // 可选：限制允许的域名白名单
      updates.avatar = avatar.trim();
    } catch {
      return res.status(400).json({ error: '头像地址格式错误' });
    }
  }
  ```

#### 2.12 前端 base64 头像无大小限制

- **严重等级**: 低
- **漏洞位置**: [public/js/features/auth.js:369-384](public/js/features/auth.js#L369-L384)
- **描述**: 前端上传头像时使用 `FileReader.readAsDataURL()` 将图片转为 base64，然后通过 JSON 提交。如果用户上传超大图片，base64 字符串可能非常大，结合 `express.json({ limit: '10mb' })` 的限制，最大为 10MB，但 10MB 的 JSON 请求仍然可能导致内存压力。
- **触发条件**: 用户上传超大图片作为头像
- **复现步骤**: 选择一个 8MB 的图片上传 → base64 编码后约 10.6MB → 可能达到 10MB 限制
- **修复建议**: 前端限制图片大小（如 2MB），且后端添加头像文件上传接口（而非 base64 in JSON）

#### 2.13 管理员登出不清除 Session

- **严重等级**: 低
- **漏洞位置**: [adminRouter.js:66-71](routes/adminRouter.js#L66-L71)
- **描述**: 管理员登出接口仅删除 `req.session.admin` 和 `req.session.user` 属性，而不调用 `req.session.destroy()`。与普通用户登出（`authRouter.js:285-291`）使用 `destroy()` 的行为不一致。如果 Session 中还有其他属性，将不会被清除。
- **触发条件**: 管理员登出
- **复现步骤**: 管理员登录后登出 → Session 对象仍存在（只是少了 admin/user 属性）
- **修复建议**:
  ```javascript
  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: '退出失败，请重试' });
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
  ```

#### 2.14 JSON body 限制 10MB 偏大

- **严重等级**: 低
- **漏洞位置**: [server.js:22](server.js#L22)
- **描述**: `express.json({ limit: '10mb' })` 允许 10MB 的 JSON 请求体。对于普通 API 请求来说过大，可能被利用进行内存耗尽攻击。
- **触发条件**: 攻击者发送超大 JSON 请求
- **复现步骤**: 发送 10MB 的 JSON 到任意 API 端点 → 服务器解析消耗大量内存
- **修复建议**: 将 limit 降低到 `1mb`，仅为需要大请求体的路由设置更大的限制

#### 2.15 缺少审计日志

- **严重等级**: 低
- **漏洞位置**: [middleware/requestLogger.js](middleware/requestLogger.js) 全局
- **描述**: 当前只有控制台日志，没有持久化的审计日志。对于管理员操作（创建/删除用户、清除数据等）没有记录。发生安全事件后无法追溯。
- **触发条件**: 管理员执行敏感操作
- **复现步骤**: 攻击者获取管理员权限后删除用户 → 无日志记录，无法追溯
- **修复建议**: 为所有管理员操作添加持久化日志（文件或数据库），记录操作者、操作时间、操作内容、IP 地址

---

## 3. 功能测试用例清单

### 3.1 用户注册模块

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-01 | 正常注册 | 填写用户名、密码、确认密码，提交注册 | username: `testuser`, password: `pass123`, confirm: `pass123` | 注册成功，自动登录，返回站点列表 |
| TC-02 | 用户名已存在 | 使用已注册的用户名注册 | username: `admin`, password: `pass123` | 返回 409，提示"该账号已存在" |
| TC-03 | 密码过短 | 提交少于 6 位的密码 | username: `newuser`, password: `12345` | 返回 400，提示"密码至少 6 位" |
| TC-04 | 用户名为空 | 不填写用户名提交 | username: ``, password: `pass123` | 返回 400，提示"请输入账号" |
| TC-05 | 密码为空 | 不填写密码提交 | username: `testuser`, password: `` | 返回 400 |
| TC-06 | 用户名含特殊字符 | 注册含特殊字符的用户名 | username: `test<script>`, password: `pass123` | 注册成功但用户名中的特殊字符可能引发问题 |
| TC-07 | 用户名含中文 | 注册中文用户名 | username: `测试用户`, password: `pass123` | 注册成功 |
| TC-08 | 用户名含空格 | 注册含前后空格用户名 | username: `  testuser  `, password: `pass123` | 用户名被 trim，注册成功 |
| TC-09 | 用户名大小写 | 注册后用小写变体再注册 | 第一次: `TestUser`, 第二次: `testuser` | 第二次返回 409（大小写不敏感） |
| TC-10 | 显示名称含特殊字符 | 注册时设置 displayName | displayName: `<img src=x onerror=alert(1)>` | 注册成功，但存储了 XSS payload |
| TC-11 | 密码为纯数字 | 注册纯数字密码 | password: `123456` | 注册成功 |
| TC-12 | 密码与用户名相同 | 注册密码与用户名相同 | username: `test123`, password: `test123` | 注册成功（无密码强度策略） |
| TC-13 | 并发重复注册 | 同时发送两个相同用户名的注册请求 | 两个请求同时到达 | 一个成功，一个返回 409 |

### 3.2 用户登录模块

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-14 | 正常登录 | 使用正确凭据登录 | username: `admin`, password: `admin123` | 登录成功，返回用户信息和站点列表 |
| TC-15 | 错误密码 | 使用错误密码登录 | username: `admin`, password: `wrongpass` | 返回 401，提示"账号或密码错误" |
| TC-16 | 不存在的用户 | 使用不存在的用户名登录 | username: `nonexistent`, password: `pass123` | 返回 401，提示"账号或密码错误" |
| TC-17 | 空用户名 | 不填用户名 | username: ``, password: `pass123` | 返回 400 |
| TC-18 | 空密码 | 不填密码 | username: `admin`, password: `` | 返回 400 |
| TC-19 | 用户名大小写 | 使用不同大小写登录 | username: `Admin`, password: `admin123` | 登录成功（大小写不敏感） |
| TC-20 | 指定站点登录 | 登录时指定 site 参数 | username: `admin`, password: `admin123`, site: `grammar` | 登录成功，session.site 设为 `grammar` |
| TC-21 | 指定无权站点 | 登录时指定无权访问的站点 | username: `tom`, password: `tom123`, site: `grammar` | 登录成功但 site 设为 null（tom 只能访问 c） |
| TC-22 | 登录后 Session 再生 | 登录成功后检查 Session ID | 登录前后对比 Cookie | Session ID 发生变化（防固定） |
| TC-23 | 登录后访问受限页面 | 登录后访问 /app | 直接访问 /app | 可正常访问应用页 |
| TC-24 | 未登录访问受限页面 | 未登录直接访问 /app | 直接访问 /app | 重定向到 /login |
| TC-25 | SQL 注入测试 | 用户名输入 SQL 注入 payload | username: `admin' OR '1'='1`, password: `anything` | 登录失败，不会绕过认证 |

### 3.3 站点选择与切换

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-26 | 切换站点 | 已登录用户切换到其他站点 | POST /api/auth/select, site: `grammar` | 成功，session.site 更新 |
| TC-27 | 切换到无权站点 | 切换到无权限的站点 | POST /api/auth/select, site: `grammar`（tom 用户） | 返回 403 |
| TC-28 | 未登录切换站点 | 未登录直接调用 | POST /api/auth/select, site: `c` | 返回 401 |
| TC-29 | 空站点参数 | 不传 site 参数 | POST /api/auth/select, site: `` | 返回 400 |

### 3.4 修改密码

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-30 | 正常修改密码 | 输入正确当前密码和新密码 | currentPassword: `admin123`, newPassword: `newpass123` | 修改成功 |
| TC-31 | 当前密码错误 | 输入错误的当前密码 | currentPassword: `wrongpass`, newPassword: `newpass123` | 返回 400，提示"当前密码错误" |
| TC-32 | 新密码过短 | 新密码少于 6 位 | currentPassword: `admin123`, newPassword: `12345` | 返回 400 |
| TC-33 | 未登录修改密码 | 不带 Session 调用 | 无 Cookie | 返回 401 |
| TC-34 | 修改后原密码失效 | 修改密码后用旧密码登录 | 旧密码登录 | 登录失败 |

### 3.5 课程内容浏览

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-35 | 获取章节列表 | 登录后请求 /api/chapters | GET /api/chapters | 返回完整的章节树（按站点） |
| TC-36 | 获取小节内容 | 请求具体章节内容 | GET /api/content/01_C语言概述/01_计算机与编程 | 返回 HTML 内容和代码示例 |
| TC-37 | 请求不存在的小节 | 请求不存在的章节 | GET /api/content/nonexistent/section | 返回 404 |
| TC-38 | 路径穿越测试 | 尝试路径穿越 | GET /api/content/../../../etc/passwd | 返回 404（基于章节树查找，不会读取任意文件） |
| TC-39 | 搜索内容 | 搜索关键词 | GET /api/search?q=指针 | 返回匹配的章节列表 |
| TC-40 | 空搜索 | 不传搜索关键词 | GET /api/search?q= | 返回空数组 |
| TC-41 | 特殊字符搜索 | 搜索含特殊字符 | GET /api/search?q=<script> | 返回空结果（正常） |
| TC-42 | 未登录访问课程 | 不带 Session | GET /api/chapters | 返回 401 |

### 3.6 学习进度管理

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-43 | 标记完成 | 标记某个小节为已完成 | POST /api/progress, sectionId: `01_C语言概述/01_计算机与编程.md`, completed: true | 成功 |
| TC-44 | 标记未完成 | 取消标记 | POST /api/progress, sectionId: `01_C语言概述/01_计算机与编程.md`, completed: false | 成功 |
| TC-45 | 缺少参数 | 不传 sectionId | POST /api/progress, completed: true | 返回 400 |
| TC-46 | 获取进度 | 获取已完成的章节列表 | GET /api/progress | 返回已完成列表 |

### 3.7 笔记功能

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-47 | 保存笔记 | 为某小节保存笔记 | POST /api/note, sectionId: `01_...`, content: `这是笔记内容` | 保存成功 |
| TC-48 | 获取笔记 | 获取已保存的笔记 | GET /api/note?sectionId=01_... | 返回笔记内容 |
| TC-49 | 缺少 sectionId | 不传 sectionId | POST /api/note, content: `test` | 返回 400 |
| TC-50 | 笔记含 HTML | 保存含 HTML 的笔记 | content: `<script>alert(1)</script>` | 保存成功（存储型 XSS 风险） |
| TC-51 | 超大笔记 | 保存超长笔记内容 | content: 100KB 的文本 | 应能正常保存或返回错误 |

### 3.8 拓展知识（Word 文档）

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-52 | 获取文档列表 | 请求拓展知识列表 | GET /api/extension | 返回 Word 文档列表 |
| TC-53 | 获取文档内容 | 查看某个文档的 HTML | GET /api/extension/写作调料.docx | 返回转换后的 HTML |
| TC-54 | 路径穿越测试 | 尝试读取上级目录文件 | GET /api/extension/../../../etc/passwd | 返回 404（path.basename 防护） |
| TC-55 | 不存在的文档 | 请求不存在的文档 | GET /api/extension/nonexistent.docx | 返回 404 |

### 3.9 题库功能

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-56 | 获取题库 | 按章节获取题库 | GET /api/quizzes | 返回按章节组织的题库 |
| TC-57 | 获取全部题目 | 获取扁平化题目列表 | GET /api/quizzes/all | 返回所有题目数组 |
| TC-58 | 题库文件不存在 | 站点题库文件缺失 | 无对应 JSON 文件 | 返回空对象 {} |

### 3.10 管理员功能

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-59 | 管理员登录 | 使用管理员账号登录 | POST /api/admin/login, username: `admin`, password: `admin123` | 登录成功，返回 admin session |
| TC-60 | 非管理员登录 | 普通用户尝试管理员登录 | POST /api/admin/login, username: `tom`, password: `tom123` | 返回 401（tom 不是管理员） |
| TC-61 | 获取用户列表 | 管理员查看所有用户 | GET /api/admin/users | 返回用户列表 |
| TC-62 | 创建用户 | 管理员创建新用户 | POST /api/admin/users, username: `newuser`, password: `pass123` | 创建成功 |
| TC-63 | 创建重复用户 | 创建已存在的用户名 | POST /api/admin/users, username: `admin`, password: `pass123` | 返回 409 |
| TC-64 | 更新用户 | 修改用户信息 | PUT /api/admin/users/tom, displayName: `Tommy` | 更新成功 |
| TC-65 | 删除用户 | 删除注册用户 | DELETE /api/admin/users/newuser | 删除成功 |
| TC-66 | 删除静态用户 | 尝试删除静态配置用户 | DELETE /api/admin/users/admin | 返回 403 |
| TC-67 | 重置密码 | 管理员重置用户密码 | POST /api/admin/users/tom/reset-password, newPassword: `newpass123` | 重置成功 |
| TC-68 | 普通用户越权 | 普通用户调用管理接口 | tom 用户调用 GET /api/admin/users | 返回 401 |
| TC-69 | 未登录调用管理接口 | 不带 Session | GET /api/admin/users | 返回 401 |
| TC-70 | 导出数据 | 管理员导出全部数据 | GET /api/admin/export | 返回 JSON 数据 |
| TC-71 | 清除数据 | 管理员清除所有学习数据 | DELETE /api/admin/clear-data | 成功，学习数据被重置 |
| TC-72 | 获取统计数据 | 查看统计面板 | GET /api/admin/stats | 返回用户数、活跃度等统计 |

### 3.11 权限控制

| 编号 | 测试点 | 操作步骤 | 输入数据 | 预期结果 |
|------|--------|----------|----------|----------|
| TC-73 | 修改他人进度 | 尝试修改其他用户的进度 | 修改请求中的 sectionId 为自己无权限的 | 只能修改自己的进度（通过 session 绑定） |
| TC-74 | 跨站点访问 | tom 用户访问 grammar 站点内容 | GET /api/chapters（site=grammar） | 返回 400 或 401（tom 只有 c 站点权限） |
| TC-75 | Session 伪造 | 尝试伪造 Session 中的 role | 修改 Cookie 中的 session 数据 | 无法伪造（签名保护） |

---

## 4. SQLite 专项问题与建议

### 4.1 优点 ✅

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 参数化查询 | ✅ 通过 | 所有 SQL 查询使用 `better-sqlite3` 的 `?` 占位符参数化查询，无字符串拼接 SQL |
| WAL 模式 | ✅ 已开启 | [db/database.js:23](db/database.js#L23) `db.pragma('journal_mode = WAL')` |
| 外键约束 | ✅ 已开启 | [db/database.js:24](db/database.js#L24) `db.pragma('foreign_keys = ON')` |
| 数据库索引 | ✅ 已创建 | user_data.username、study_records.username、study_records.study_date 均有索引 |
| 数据库不在公开目录 | ✅ 安全 | `data/study.db` 不在 `public/` 目录下，不可通过 HTTP 直接下载 |
| 连接管理 | ✅ 合理 | 使用单例模式，`better-sqlite3` 同步 API 无需连接池 |

### 4.2 问题与建议 ⚠️

#### 4.2.1 未设置 busy_timeout

- **位置**: [db/database.js:22-24](db/database.js#L22-L24)
- **问题**: 未设置 `busy_timeout`，高并发写入时可能遇到 `SQLITE_BUSY` 错误
- **建议**:
  ```javascript
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000'); // 添加：等待 5 秒
  ```

#### 4.2.2 未使用事务处理批量操作

- **位置**: [db/database.js](db/database.js) 多个方法
- **问题**: `updateUserData` 等方法在更新多个字段时未使用事务。如果更新过程中发生错误，可能导致数据不一致
- **建议**:
  ```javascript
  function updateUserData(username, updates) {
    const database = getDb();
    const transaction = database.transaction(() => {
      initUserData(username);
      // ... 执行更新
    });
    return transaction();
  }
  ```

#### 4.2.3 缺少数据库备份机制

- **位置**: 全局
- **问题**: 没有自动备份机制，数据库文件损坏或误操作后无法恢复
- **建议**: 添加定期备份脚本（使用 `sqlite3` 的 `.backup` 或 VACUUM INTO）
  ```javascript
  // 定期备份（可通过 cron 或定时任务触发）
  function backupDatabase() {
    const db = getDb();
    const backupPath = DB_PATH + '.' + new Date().toISOString().replace(/[:.]/g, '-');
    db.backup(backupPath);
  }
  ```

#### 4.2.4 WAL 文件未定期 checkpoint

- **位置**: [db/database.js:23](db/database.js#L23)
- **问题**: WAL 模式会产生 `-wal` 和 `-shm` 文件，如果不定期 checkpoint，WAL 文件会越来越大
- **建议**: 添加定期 checkpoint
  ```javascript
  // 在应用启动时设置自动 checkpoint
  db.pragma('wal_autocheckpoint = 1000'); // 每 1000 页自动 checkpoint
  ```

#### 4.2.5 数据库文件未被 .gitignore 忽略

- **位置**: [data/study.db](data/study.db), [.gitignore](.gitignore)
- **问题**: `.gitignore` 中没有明确忽略 `data/study.db`、`data/study.db-wal`、`data/study.db-shm`。虽然 `data/users/` 被忽略了，但数据库文件本身可能被意外提交
- **建议**: 在 `.gitignore` 中添加：
  ```
  data/study.db
  data/study.db-wal
  data/study.db-shm
  ```

#### 4.2.6 admin stats 使用 JSON 文件而非 SQLite 查询

- **位置**: [adminRouter.js:266-315](routes/adminRouter.js#L266-L315)
- **问题**: 统计接口和最近记录接口仍然直接读取 JSON 文件（`data/users/<name>/c.json`），而不是使用 SQLite 数据库。虽然数据库有 `user_data` 表和 `study_records` 表，但统计接口没有使用它们。这导致数据源不一致
- **建议**: 统一使用 SQLite 数据库查询统计数据

---

## 5. 上传下载专项问题与建议

### 5.1 观察

此项目**没有传统意义上的文件上传/下载功能**。具体分析：

- **头像**: 前端使用 `FileReader.readAsDataURL()` 将图片转为 base64 字符串，通过 JSON API (`PATCH /api/auth/me`) 提交。这不是文件上传，是 JSON 字符串存储。
- **课程内容**: 从 `knowledge/` 目录读取 Markdown 文件，通过 API 返回 HTML 内容。这是内容读取，不是文件下载。
- **拓展知识**: 从 `knowledge/extension/` 目录读取 Word 文档，通过 `mammoth`/`word-extractor` 转换为 HTML 返回。这也是内容读取。

### 5.2 头像上传（base64 方式）问题

| 问题 | 说明 | 建议 |
|------|------|------|
| 无文件类型校验 | base64 字符串未校验是否为图片格式 | 前端解析 base64 时校验 MIME 类型；后端存储前校验 base64 头部 |
| 无大小限制 | 前端未限制图片大小，后端 JSON 限制为 10MB | 前端限制图片 ≤ 2MB；后端校验 base64 解码后大小 |
| 无图片内容校验 | 未校验图片是否包含恶意代码（图片马） | 如果将来改为文件上传，需校验 magic number |
| 存储为纯文本 | avatar 作为 URL 字符串存储在 SQLite 中 | 如果将来改为文件存储，需限制存储目录的执行权限 |

### 5.3 拓展知识文档读取

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 路径穿越防护 | ✅ 安全 | [extensionModel.js:60](models/extensionModel.js#L60) 使用 `path.basename(id)` 防止目录穿越 |
| 文件类型限制 | ✅ 安全 | 仅处理 `.docx` 和 `.doc` 文件 |
| 文件大小限制 | ⚠️ 缺失 | 未限制 Word 文件大小，大文件可能消耗大量内存 |
| 错误处理 | ✅ 安全 | 解析失败返回友好错误信息，不暴露内部路径 |

### 5.4 课程内容读取

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 路径穿越防护 | ✅ 安全 | [contentModel.js](models/contentModel.js) 通过章节树查找，不会直接拼接用户输入到文件路径 |
| 任意文件读取 | ✅ 安全 | 只读取 `knowledge/` 目录下的 `.md` 文件 |

### 5.5 建议

如果将来添加文件上传功能，需要实现以下安全措施：

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads', 'avatars'),
  filename: (req, file, cb) => {
    // 使用随机文件名防止路径穿越和覆盖
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('不支持的文件类型'));
    }
    cb(null, true);
  }
});

// 在 uploads 目录下放置 .htaccess 或 nginx 配置禁止脚本执行
// 或使用 node 脚本确保上传目录不可执行
```

---

## 6. 代码质量与稳定性问题

### 6.1 错误处理

| 问题 | 位置 | 严重度 | 建议 |
|------|------|--------|------|
| 错误信息直接返回给客户端 | [apiRouter.js](routes/apiRouter.js) 多处 | 中 | 使用通用错误消息，详细错误仅记录在服务端 |
| 部分 catch 块静默吞掉错误 | [adminRouter.js:297-299](routes/adminRouter.js#L297-L299) | 低 | 至少记录到日志 |
| 未捕获的 Promise rejection | 全局 | 中 | 添加 `process.on('unhandledRejection')` 处理 |
| 未捕获的异常 | 全局 | 中 | 添加 `process.on('uncaughtException')` 处理 |

**建议添加全局错误处理**:
```javascript
// server.js
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  // 不退出进程，但记录日志
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // 对于严重错误，优雅退出并让进程管理器重启
  process.exit(1);
});
```

### 6.2 输入校验

| 问题 | 位置 | 严重度 | 建议 |
|------|------|--------|------|
| 无输入长度限制 | 多处 | 低 | 添加最大长度限制（如用户名 ≤ 30 字符，displayName ≤ 50 字符） |
| 无字符白名单 | 多处 | 低 | 对用户名等字段限制允许的字符集 |
| 无类型校验 | 多处 | 低 | 使用 JSON Schema 或 Joi 进行严格的输入校验 |
| 笔记内容无长度限制 | [apiRouter.js:124-133](routes/apiRouter.js#L124-L133) | 低 | 限制笔记最大长度 |

### 6.3 日志记录

| 问题 | 位置 | 严重度 | 建议 |
|------|------|--------|------|
| 仅控制台输出 | [middleware/requestLogger.js](middleware/requestLogger.js) | 低 | 添加文件日志或使用日志库（如 winston） |
| 无管理员操作审计日志 | [adminRouter.js](routes/adminRouter.js) | 中 | 记录所有管理员敏感操作 |
| 日志中可能包含敏感信息 | 多处 | 低 | 确保日志中不记录密码、token 等敏感信息 |

### 6.4 性能问题

| 问题 | 位置 | 严重度 | 建议 |
|------|------|--------|------|
| 全量搜索无分页 | [contentModel.js:109-126](models/contentModel.js#L109-L126) | 低 | 全文搜索使用内存 includes，在内容量大时可能变慢 |
| 用户列表无分页 | [adminRouter.js:91-106](routes/adminRouter.js#L91-L106) | 低 | 添加分页支持 |
| 统计接口遍历所有文件 | [adminRouter.js:266-315](routes/adminRouter.js#L266-L315) | 中 | 使用 SQLite 查询替代文件遍历 |
| 章节树缓存未失效 | [contentModel.js:7-8](models/contentModel.js#L7-L8) | 低 | 添加缓存失效机制（如检测文件修改时间） |
| 搜索索引缓存全量内存 | [contentModel.js:86](models/contentModel.js#L86) | 低 | 内容量持续增长时需考虑内存使用 |

### 6.5 依赖安全

| 检查项 | 建议 |
|--------|------|
| npm audit | 建议运行 `npm audit` 检查已知漏洞 |
| 过时依赖 | 建议运行 `npm outdated` 检查版本更新 |
| 依赖数量 | 项目依赖较少，风险可控。主要依赖：express 4.22.2, better-sqlite3 13.0.3, bcryptjs 3.0.3, ejs 3.1.9 |

### 6.6 代码结构问题

| 问题 | 位置 | 建议 |
|------|------|------|
| admin 统计使用同步文件读取 | [adminRouter.js:266-315](routes/adminRouter.js#L266-L315) | 使用 SQLite 查询替代 |
| require 写在路由处理函数内 | [adminRouter.js](routes/adminRouter.js) 多处 | 将 `require` 移到文件顶部 |
| 重复的 `require('fs')` 和 `require('path')` | [adminRouter.js](routes/adminRouter.js) | 在文件顶部统一引入 |
| 魔法数字 | [authRouter.js:136](routes/authRouter.js#L136) `password.length < 6` | 提取为常量 `MIN_PASSWORD_LENGTH` |

---

## 7. 修复优先级建议

### P0 — 必须立即修复（生产部署前）

| 序号 | 问题 | 预计工时 |
|------|------|----------|
| 1 | 更换弱密码（.env 中的 admin123 / tom123） | 5 分钟 |
| 2 | Session Cookie 添加安全属性（httpOnly, secure, sameSite） | 15 分钟 |
| 3 | 添加 CSRF 防护（所有修改类接口） | 2 小时 |
| 4 | 添加速率限制（登录/注册接口） | 30 分钟 |
| 5 | 添加 Helmet.js 安全响应头 | 30 分钟 |

### P1 — 重要（尽快修复）

| 序号 | 问题 | 预计工时 |
|------|------|----------|
| 6 | 修复用户枚举漏洞（注册接口） | 1 小时 |
| 7 | 错误信息脱敏（不返回 err.message 到客户端） | 1 小时 |
| 8 | 静态账号密码也使用 bcrypt 哈希 | 1 小时 |
| 9 | saveUninitialized 改为 false | 5 分钟 |
| 10 | 添加全局异常处理（unhandledRejection, uncaughtException） | 30 分钟 |
| 11 | 设置 busy_timeout 和 wal_autocheckpoint | 5 分钟 |
| 12 | 添加 .gitignore 忽略数据库文件 | 5 分钟 |
| 13 | 管理员登出改为 destroy session | 10 分钟 |

### P2 — 建议优化（有时间时处理）

| 序号 | 问题 | 预计工时 |
|------|------|----------|
| 14 | 输入校验增强（长度限制、字符白名单、JSON Schema） | 3 小时 |
| 15 | 添加数据库备份机制 | 2 小时 |
| 16 | 统一统计接口使用 SQLite 查询 | 2 小时 |
| 17 | 添加管理员操作审计日志 | 3 小时 |
| 18 | 添加分页支持（用户列表、搜索等） | 2 小时 |
| 19 | 头像 URL 校验 | 30 分钟 |
| 20 | JSON body limit 调低到 1MB | 5 分钟 |
| 21 | 代码整理：require 移到文件顶部、提取常量 | 1 小时 |
| 22 | 运行 npm audit 并修复依赖漏洞 | 1 小时 |
| 23 | 添加内容缓存失效机制 | 2 小时 |
| 24 | 添加 CSP 头配置 | 1 小时 |

---

## 附录 A：快速修复代码参考

### A.1 增强的 Session 配置

```javascript
// server.js
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

### A.2 速率限制 + CSRF 示例

```javascript
// server.js
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '登录尝试过于频繁，请15分钟后再试' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/', apiLimiter);
```

### A.3 全局错误处理

```javascript
// server.js
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
```

---

**报告结束**

*本报告由代码静态审计生成，建议结合动态测试（渗透测试）进行验证。所有修复建议均需在测试环境验证后再部署到生产环境。*