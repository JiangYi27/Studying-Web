#!/bin/bash
# ============================================================
# 一键部署脚本（在服务器上运行）
# 用法：bash deploy.sh <你的域名> [管理员密码]
# 示例：bash deploy.sh study.example.com mypassword123
# ============================================================
set -e

REPO_URL="https://github.com/JiangYi27/Studying-Web.git"
APP_DIR="/var/www/Studying-Web"
DOMAIN="${1:-}"
ADMIN_PASS="${2:-}"
PORT=3000

if [ -z "$DOMAIN" ]; then
  echo "❌ 用法: bash deploy.sh <域名> [管理员密码]"
  echo "   例如: bash deploy.sh study.example.com"
  exit 1
fi

echo "========================================="
echo "🚀 部署 Studying-Web"
echo "   域名: $DOMAIN"
echo "========================================="

# ---------- 1. 系统更新 + 安装依赖 ----------
echo ""
echo "📦 [1/7] 安装系统依赖..."
sudo apt update -y
sudo apt install -y git nginx build-essential curl

# ---------- 2. 安装 Node.js 20 ----------
echo ""
echo "🟢 [2/7] 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "   Node 版本: $(node -v)"

# ---------- 3. 安装 PM2 ----------
echo ""
echo "⚙️  [3/7] 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# ---------- 4. 拉取代码 ----------
echo ""
echo "📥 [4/7] 拉取代码..."
if [ ! -d "$APP_DIR/.git" ]; then
  sudo git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  sudo git pull
fi

# ---------- 5. 安装依赖 ----------
echo ""
echo "📚 [5/7] 安装 npm 依赖（生产模式）..."
cd "$APP_DIR"
sudo npm install --omit=dev

# ---------- 6. 配置 .env ----------
echo ""
echo "🔐 [6/7] 配置 .env..."
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  # 生成随机 SESSION_SECRET
  RAND_SECRET=$(openssl rand -hex 32)
  if [ -z "$ADMIN_PASS" ]; then
    ADMIN_PASS="change_me_admin_password"
    echo "⚠️  未提供管理员密码，默认使用 change_me_admin_password，请部署后立即修改 .env！"
  fi
  sudo tee "$ENV_FILE" > /dev/null <<EOF
PORT=$PORT
SESSION_SECRET=$RAND_SECRET
USER_PASSWORD_ADMIN=$ADMIN_PASS
EOF
  echo "   .env 已生成"
else
  echo "   .env 已存在，跳过"
fi

# 确保 data 目录可写
sudo mkdir -p "$APP_DIR/data"
sudo chown -R "$(whoami)" "$APP_DIR/data"

# ---------- 7. 启动应用 ----------
echo ""
echo "▶️  [7/7] 启动应用..."
cd "$APP_DIR"
pm2 start server.js --name study || pm2 restart study
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$(whoami)" --hp "/home/$(whoami)" 2>/dev/null || true

# ---------- Nginx ----------
echo ""
echo "🌐 配置 Nginx 反向代理..."
sudo tee /etc/nginx/sites-available/study > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/study /etc/nginx/sites-enabled/study
sudo nginx -t && sudo systemctl reload nginx

# ---------- HTTPS ----------
echo ""
echo "🔒 申请 HTTPS 证书..."
if command -v certbot &> /dev/null; then
  sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --redirect 2>/dev/null \
    || echo "   certbot 自动配置失败，可手动运行: sudo certbot --nginx -d $DOMAIN"
else
  echo "   未安装 certbot。可稍后运行:"
  echo "   sudo apt install -y certbot python3-certbot-nginx"
  echo "   sudo certbot --nginx -d $DOMAIN"
fi

echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "   访问: http://$DOMAIN"
echo "   管理员账号: admin"
echo "========================================="
echo "⚠️  后续更新代码："
echo "   cd $APP_DIR && git pull && npm install --omit=dev && pm2 restart study"
