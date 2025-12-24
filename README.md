<div align="center">

# 🔐 Cloudflare 2FA Generator

**基于 Cloudflare Workers 的双因素验证码生成器**

✨ 一键部署 · 🔒 端到端加密 · ☁️ 云端同步 · 📱 多设备支持

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](
https://deploy.workers.cloudflare.com/?url=https://github.com/soga11/Cloudflare-2FA-Generator
)

</div>

---

## 🚀 三步快速部署（3 分钟完成）

---

## 第一步：创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create Application → Create Worker**
4. 命名为 `2fa-generator` → 点击 **Deploy**
5. 点击 **Edit Code**
6. 删除默认代码，粘贴 [`worker.js`](./worker.js)
7. 点击 **Save and Deploy**

---

## 第二步：创建数据库（D1）

1. Dashboard → **Storage & Databases → D1 SQL Database**
2. 点击 **Create**
3. 命名为 `2fa-database`
4. 进入数据库 → **Console**
5. 复制下面 SQL → 粘贴 → **Execute**

### 📄 初始化 SQL

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 已保存账户
CREATE TABLE saved_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TOTP 日志
CREATE TABLE totp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  secret TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_saved_accounts_user_id ON saved_accounts(user_id);
CREATE INDEX idx_totp_logs_user_id ON totp_logs(user_id);
CREATE INDEX idx_totp_logs_timestamp ON totp_logs(timestamp DESC);
```

### 第三步：绑定数据库到 Worker
进入 Workers & Pages

点击你的 Worker：2fa-generator

打开 Settings → Variables

找到 D1 Database Bindings

点击 Add binding

填写如下内容：

项目	值
Variable name	DB（必须大写）
D1 database	2fa-database

点击 Save

再点击一次 Save and Deploy

✅ 部署完成
访问你的 Worker 地址，例如：

cpp
复制代码
https://2fa-generator.你的用户名.workers.dev
页面能正常打开即部署成功 🎉

### 📱 核心功能
功能	说明
🔑 实时 TOTP	6 位动态验证码
📸 扫码识别	摄像头 / 截图 / 图片
💾 三重备份	本地 + WebDAV + Telegram
🔐 安全加密	SHA-256 + 保险库密码
☁️ 云端同步	多设备同步（需登录）
⚡ 全球加速	Cloudflare 边缘节点

### 🎯 使用指南
游客模式（无需登录）
打开页面

输入密钥或扫描二维码

立即生成验证码

数据仅保存在浏览器本地

账户模式（推荐）
注册账号

设置保险库密码

添加账户（扫码 / 手动）

多设备自动同步

### 🔔 可选：Telegram 推送
1️⃣ 创建机器人
搜索 @BotFather

发送 /newbot

获取 Bot Token

2️⃣ 获取 Chat ID
搜索 @userinfobot

发送任意消息

获取数字 ID

3️⃣ 配置环境变量
Worker → Settings → Variables → Add variable

名称	值
TELEGRAM_BOT_TOKEN	你的 Bot Token
TELEGRAM_CHAT_ID	你的 Chat ID
点击 Encrypt → Save and Deploy


🛠 技术栈
前端：HTML / CSS / JavaScript

后端：Cloudflare Workers

数据库：Cloudflare D1（SQLite）

加密：Web Crypto API（SHA-256）

QR 识别：jsQR
