# 阿里云服务器部署教程（完整版）

> 适用范围：阿里云**轻量应用服务器**（Lightweight），Ubuntu 22.04，Node.js + Express 项目。
> 全程在 Windows 电脑上用 PowerShell 操作，命令可直接复制。

---

## 目录

1. [买域名](#1-买域名)
2. [买服务器](#2-买服务器)
3. [配置安全组/防火墙](#3-配置防火墙)
4. [远程连接服务器](#4-远程连接服务器)
5. [安装 Node.js](#5-安装-nodejs)
6. [拉取代码到服务器](#6-拉取代码到服务器)
7. [配置环境变量](#7-配置环境变量)
8. [安装 PM2 守护进程](#8-安装-pm2-守护进程)
9. [Nginx 反向代理](#9-nginx-反向代理)
10. [免费 HTTPS 证书](#10-免费-https-证书)
11. [域名解析](#11-域名解析)
12. [ICP 备案（最花时间）](#12-icp-备案最花时间)
13. [验证与日常维护](#13-验证与日常维护)

---

## 1. 买域名

1. 打开阿里云 → 搜"**域名注册**" → [wanwang.aliyun.com](https://wanwang.aliyun.com)。
2. 搜索你想要的域名，推荐 `.com`（首年约 30-60 元）。
3. 加入购物车购买（选 1 年即可）。
4. **实名认证**：购买后进入"域名控制台" → 点你的域名 → "实名认证"，提交身份证信息。
   认证需几小时到 1 天，**不认证域名无法解析**。

## 2. 买服务器

1. 阿里云 → 搜"**轻量应用服务器**" → 进入产品页。
2. 选套餐：
   - **地域**：离你近的（如你人在上海选华东1-上海）。
   - **系统镜像**：选 **Ubuntu 22.04**（买后也可在控制台重装系统，不影响数据盘之外）。
   - **配置**：2 核 2G 起步（个人站够用），带宽 3-5 Mbps。
   - **时长**：新用户首次优惠常见"1 年 300 元内"，买 1 年最划算。
3. 付款后进入 **轻量服务器控制台**，看到你的服务器和公网 IP。
4. **设置 root 密码**：控制台点服务器 → 找到"重置密码"（或创建时就设置），记好。
5. 控制台 → 你的服务器 → 记下 **公网 IP**（形如 `123.45.67.89`）。

## 3. 配置防火墙（安全组）

轻量服务器在控制台管理防火墙（不是安全组，那属于 ECS）。

1. 控制台 → 你的服务器 → **防火墙** 标签页 → **添加规则**。
2. 确认已有这些规则（没有就加）：
   - 端口 `22`（SSH，协议 TCP）
   - 端口 `80`（HTTP）
   - 端口 `443`（HTTPS）
3. 个人站可额外临时放行 `3000`（测试用，上线后建议删掉或只留 80/443）。

## 4. 远程连接服务器

Windows 自带 SSH，直接 PowerShell 连：

```powershell
ssh root@<你的公网IP>
```

首次会提示确认指纹，输入 `yes`，然后输 root 密码。
看到 `root@xxx:~#` 提示符即成功。

> 如果 `ssh` 连不上：确认防火墙放行了 22 端口，且用的是公网 IP。

## 5. 安装 Node.js

阿里云 Ubuntu 默认源里的 Node 版本可能偏旧，用官方源装 Node 20：

```bash
# 1) 下载并启用 NodeSource 源（安装 Node 20 LTS）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2) 安装
sudo apt-get install -y nodejs

# 3) 验证
node -v    # 应显示 v20.x
npm -v
```

## 6. 拉取代码到服务器

前提：代码已在 GitHub（前面已准备好）。

```bash
# 1) 安装 git（Ubuntu 通常自带，没有则装）
sudo apt-get install -y git

# 2) 建目录并克隆
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/<你的GitHub用户名>/<仓库名>.git c-study
cd c-study

# 3) 目录权限：让 node 进程能写（data/ 目录需要可写）
sudo chown -R $USER:$USER /var/www/c-study

# 4) 安装依赖 + 构建
npm install
npm run build        # 生成 public/index.prod.html（如果有 build 脚本）
```

> 若 GitHub 克隆慢或失败，可改用国内镜像：
> `sudo git clone https://github.com.cnpmjs.org/<用户名>/<仓库名>.git c-study`
> （或设置 `git config --global url."https://gitclone.com/github.com/".insteadOf "https://github.com/"`）

## 7. 配置环境变量

```bash
# 1) 复制示例为 .env
cp .env.example .env

# 2) 编辑（用 nano，比 vi 好上手）
nano .env
```

在文件里填好这几项（**务必改**）：
- `SESSION_SECRET`：生成一个随机串，如 `openssl rand -hex 32` 的输出。
  服务器上没有 openssl 的话，随便打一段长乱码也行，但别用默认值。
- `USER_PASSWORD_ADMIN`：改成强密码（别再用 admin123）。
- `USER_PASSWORD_TOM`：改成强密码。
- `PORT=3000`（保持，Nginx 会转发）。

保存：`Ctrl + O` 回车，再 `Ctrl + X` 退出。

## 8. 安装 PM2 守护进程

PM2 让 Node 进程崩溃自动重启、开机自启、日志管理。

```bash
# 1) 全局安装
sudo npm install -g pm2

# 2) 启动服务
pm2 start server.js --name c-study

# 3) 查看状态
pm2 status

# 4) 保存进程列表 + 配置开机自启
pm2 save
pm2 startup
# 执行后它会在屏幕输出一条带 sudo 的命令，复制那条命令再执行一次，开机自启就生效了
```

常用命令：
```bash
pm2 logs c-study     # 看日志
pm2 restart c-study  # 重启
pm2 status           # 看状态
```

**验证服务本身能跑**：在服务器上 `curl http://localhost:3000`，应返回 HTML 或至少不报错。

## 9. Nginx 反向代理

把访问 `80 端口`的请求转发给 Node（3000 端口），这样域名直接访问、不用带端口号。

```bash
# 1) 安装 Nginx
sudo apt-get install -y nginx

# 2) 写站点配置
sudo nano /etc/nginx/sites-available/c-study
```

粘贴以下内容（把 `你的域名.com` 换成你的域名）：

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    # 上传/代理超时放宽（视频等大文件）
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

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

保存退出后：

```bash
# 3) 启用站点
sudo ln -s /etc/nginx/sites-available/c-study /etc/nginx/sites-enabled/

# 4) 测试配置语法
sudo nginx -t

# 5) 重载 Nginx
sudo systemctl reload nginx
```

**验证**：此时访问 `http://<公网IP>`（不带端口），应能看到你的站点（若备案未通过，用 IP 访问 80 可能被限制，见第 12 节）。

## 10. 免费 HTTPS 证书（Let's Encrypt）

```bash
# 1) 安装 certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 2) 申请并自动配置证书
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com
```

- 按提示填邮箱、同意条款。
- 选"是否重定向 HTTP→HTTPS"：选 `2`（重定向）。
- certbot 会自动改 Nginx 配置并续期（自带定时任务）。

**验证**：浏览器访问 `https://你的域名.com`，地址栏应有小锁。

## 11. 域名解析

1. 阿里云控制台 → 搜"**域名**" → **域名控制台**。
2. 点你的域名 → **解析**（或"解析设置"）。
3. 添加两条 **A 记录**：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| A | `@` | 你的公网 IP | 默认（600） |
| A | `www` | 你的公网 IP | 默认（600） |

4. 等待 5-30 分钟生效（或 `ping 你的域名` 看是否解析到你的 IP）。

## 12. ICP 备案（最花时间，务必提前）

**未备案的域名不能解析到国内服务器的 80/443 端口。** 备案是硬门槛。

1. 阿里云控制台 → 搜"**ICP 备案**" → 进入备案系统 → **开始备案**。
2. 按向导填写：
   - **域名**：选你买的域名。
   - **网站名称**：如"XX学习站"（不能含"中国/国家/论坛"等敏感词）。
   - **网站负责人**：填你本人信息（身份证 + 手机号）。
3. **人脸核验**：用手机支付宝/阿里云 App 扫码做人脸识别。
4. 提交后进入审核：
   - 阿里云初审：约 1 个工作日。
   - 管局审核：各省 3-20 个工作日不等（通常 1-2 周）。
5. 全程在备案控制台看进度，通过后会收到短信。

**备案期间怎么用**：
- 服务器已经可以跑，但域名没法绑 80/443。
- 可用 `http://<公网IP>:3000`（若防火墙放行了 3000）临时访问测试。
- 也可先不解析域名，直接在服务器本地 `curl http://localhost:3000` 验证服务正常。
- **建议现在就先提交备案**，等备案期间把代码、配置、HTTPS 都调好，备案一通过即可解析上线。

## 13. 验证与日常维护

**上线后检查清单**：
- [ ] `https://你的域名.com` 能打开、能登录
- [ ] 刷新页面登录态保持
- [ ] 完成一个章节，进度保存成功（服务器上 `cat data/users/admin/c.json` 能看到变化）
- [ ] 关闭再重开服务器，`pm2 status` 里 c-study 是 online（自启生效）

**日常命令**（都在服务器上）：
```bash
pm2 status                    # 服务状态
pm2 logs c-study              # 看日志（排查 500 错误等）
pm2 restart c-study           # 改完代码重启
sudo systemctl status nginx   # Nginx 状态
sudo certbot renew --dry-run  # 测试证书续期是否正常
```

**更新代码**：
```bash
# 本地改完并 git push 后，在服务器上：
cd /var/www/c-study
git pull
npm install        # 如果有新依赖
npm run build      # 如果有构建
pm2 restart c-study
```

**备份用户数据**（重要，文件存储所以尤其要勤备份）：
```bash
tar czf backup-$(date +%F).tgz data/
```
把生成的 `.tgz` 下载到本地保存（可用 `scp` 或 WinSCP）。

---

## 常见问题

**Q: ssh 连不上？**
检查防火墙放行 22 端口；确认用公网 IP；确认 root 密码正确；阿里云轻量默认禁止密码登录的情况很少，若还不行到控制台"重置密码"。

**Q: npm install 报权限错误？**
确保执行了 `sudo chown -R $USER:$USER /var/www/c-study`。

**Q: 域名解析了但访问不了？**
- 备案没通过 → 未备案域名无法用国内 80/443。
- 防火墙没放行 80/443。
- Nginx 配置没生效 → `sudo nginx -t` 先测语法，`sudo systemctl reload nginx` 重载。
- `pm2 status` 看 Node 是否在跑，`pm2 logs c-study` 看有无报错。

**Q: 证书申请失败？**
先确保域名已解析到本服务器（`nslookup 你的域名` 返回你的 IP），再跑 certbot。

**Q: 要不要数据库？**
个人学习站**不需要**。文件存储足够（详见部署文档的"数据库考量"）。将来多人并发再考虑 SQLite。
