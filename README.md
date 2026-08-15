# 🏰 C 语言学习 Web 应用（C Study）

一个把 C 语言课程做成 **RPG 技能树闯关游戏** 的学习网站。学 C 语言的同时"打怪升级"，用波次战斗 + 章节城堡的形式驱动学习进度。

## ✨ 功能

- **RPG 技能树地图**：14 座章节城堡沿"王国之路"蜿蜒分布，未通关的下一章自动锁定 🔒
- **波次战斗答题**：每章 3 波 + BOSS（史莱姆 → 哥布林 → 兽人 → 魔龙），答对扣怪血、连击加分、超时扣生命
- **经验 / 等级系统**：通关章节、连击、满血通关都有经验奖励，升级动画 + 音效
- **小地图 + 相机系统**：拖拽平移、滚轮缩放、WASD / 快捷键（1-9 跳章、F 聚焦、空格开打）
- **多站点支持**：C 语言 + 英语语法两个知识库，账号按站点授权访问
- **纯前端构建**：SVG 渲染 + Web Audio 合成音效（无音频文件依赖）

## 🧱 技术栈

- **后端**：Node.js + Express + EJS（`server.js`）
- **前端**：原生 JavaScript（SVG 地图、Canvas 小地图）+ CSS 动画
- **数据**：Markdown 章节内容（`gray-matter` / `marked`）+ 题库 JSON
- **构建**：`scripts/build.js` 聚合全部 CSS/JS 为 `public/index.prod.html`，避免开发期 39 个请求拖慢加载

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制示例并填写真实值）
cp .env.example .env

# 3. 启动
npm start        # 或开发模式：npm run dev
```

打开 `http://localhost:3000`（端口由 `.env` 的 `PORT` 控制，默认 3000）。

## ⚙️ 环境变量

| 变量 | 说明 |
|---|---|
| `PORT` | 服务端口（默认 3000） |
| `SESSION_SECRET` | 会话密钥，请改成足够长的随机字符串 |
| `USER_PASSWORD_<用户名全大写>` | 每个账号的密码，如 `USER_PASSWORD_ADMIN`。未配置则无法登录 |

账号在 `config/users.js` 里维护（用户名 + 可访问站点），密码**不写入仓库**，全部从环境变量注入。

## 📁 目录结构

```
├── config/          # 站点注册表 / 账号表 / 端口会话配置
├── content/         # C 语言章节内容（Markdown）
├── content-grammar/ # 英语语法章节内容（Markdown）
├── data/            # 用户学习数据（已被 .gitignore 排除，不公开）
├── middleware/      # 登录鉴权 / 请求日志
├── public/          # 前端页面 + 构建产物（index.prod.html）
├── routes/          # API / 登录鉴权路由
├── scripts/         # 构建脚本
└── server.js        # Express 入口
```

## 📜 许可证

[MIT](./LICENSE)
