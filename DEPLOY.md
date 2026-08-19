# 部署指南（轻量服务器 + 域名 + HTTPS）

## 架构

```
用户浏览器 → 域名(已备案) → Nginx(80/443) → Node.js(:3000) → SQLite(data/study.db)
```

## 0. 前置条件

- 一台轻量服务器（Ubuntu/Debian，至少 2G 内存）
- 一个已备案的域名，DNS A 记录已指向服务器 IP
- GitHub 仓库：`https://github.com/JiangYi27/Studying-Web.git`

## 1. 服务器初始化（一次性）

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS + 编译工具（better-sqlite3 需要本地编译）+ git + nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git nginx

# PM2 进程守护
sudo npm install -g pm2
```

## 2. 拉代码 + 安装依赖

```bash
cd /var/www
git clone https://github.com/JiangYi27/Studying-Web.git
cd Studying-Web

# 生产模式安装依赖
npm install --omit=dev

# 创建并修改环境变量
cp .env.example .env
nano .env
```

`.env` 必须修改：

```ini
PORT=3000
# 至少 32 位随机字符串，否则每次重启会话失效
SESSION_SECRET=改成一大串随机字符
# config/users.js 里的账号 admin 的密码
USER_PASSWORD_ADMIN=你的管理员密码
```

> `.env` 已被 `.gitignore` 忽略，不会提交到仓库。

## 3. 启动 + 开机自启

```bash
cd /var/www/Studying-Web
pm2 start server.js --name study
pm2 save
pm2 startup    # 会输出一行命令，复制执行即可

# 验证
curl http://localhost:3000
```

## 4. Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/study
```

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/study /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. HTTPS（免费证书）

> 前提：域名已完成备案，DNS 指向服务器。

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com

# 验证自动续期
sudo certbot renew --dry-run
```

## 6. 部署后检查

- [ ] 用 `admin` + 设置的密码能登录
- [ ] `data/study.db` 自动创建
- [ ] 背单词 `/vocabulary.html?site=grammar` 可访问
- [ ] C 站点 / 英语站点切换正常
- [ ] `https://你的域名.com` 有锁

## 7. 更新代码

```bash
cd /var/www/Studying-Web
git pull
npm install --omit=dev   # 有新增依赖时才需要
pm2 restart study
```

## 8. 数据备份

```bash
crontab -e
# 每天凌晨3点备份数据库
0 3 * * * cp /var/www/Studying-Web/data/study.db /root/backup/study_$(date +\%F).db
```

## 注意事项

1. **备案期间**：国内服务器在备案完成前，80/443 端口会被拦截。可先用 `IP:3000` 临时测试，备案通过后再绑域名。
2. **安全组**：云厂商控制台放行 80、443；**3000 端口不要对外开放**。
3. **better-sqlite3 编译失败**：确认已装 `build-essential`，或升级 Node 版本。
