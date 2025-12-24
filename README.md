<div align="center">

# 🔐 Cloudflare 2FA Generator

**基于 Cloudflare Workers 的双因素（2FA / TOTP）验证码生成器**

✨ 一键部署 · 🔒 端到端加密 · ☁️ 云端同步 · 📱 多设备支持

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/soga11/Cloudflare-2FA-Generator)

</div>

---

## 🚀 三步快速部署（约 3 分钟）

---

## 第一步：创建 Worker

1. 登录 Cloudflare Dashboard  
   https://dash.cloudflare.com
2. 进入 **Workers & Pages**
3. 点击 **Create Application** → **Create Worker**
4. Worker 名称填写：`2fa-generator`
5. 点击 **Deploy**
6. 点击 **Edit Code**
7. 删除编辑器中的所有代码
8. 粘贴 [`worker.js`](./worker.js) 的完整内容
9. 点击 **Save and Deploy**

---

## 第二步：创建数据库（D1）

1. 回到 Dashboard
2. 左侧进入 **Storage & Databases**
3. 点击 **D1 SQL Database**
4. 点击 **Create**
5. 数据库名称填写：

2fa-database

pgsql
复制代码

6. 创建完成后，点击进入数据库
7. 打开顶部的 **Console**
8. 复制并执行下面的 SQL（一次性执行）

---

### 数据库初始化 SQL

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 保存的 2FA 账户
CREATE TABLE saved_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TOTP 生成日志
CREATE TABLE totp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  secret TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_saved_accounts_user_id
ON saved_accounts(user_id);

CREATE INDEX idx_totp_logs_user_id
ON totp_logs(user_id);

CREATE INDEX idx_totp_logs_timestamp
ON totp_logs(timestamp DESC);
第三步：绑定数据库到 Worker
打开 Workers & Pages

点击你的 Worker（2fa-generator）

进入 Settings → Variables

找到 D1 Database Bindings

点击 Add binding

填写以下内容：

项目	内容
Variable name	DB
D1 database	2fa-database

点击 Save

再点击一次 Save and Deploy

✅ 部署完成
访问你的 Worker 地址，例如：

cpp
复制代码
https://2fa-generator.your-name.workers.dev
页面可以正常打开，即表示部署成功 🎉

📌 功能简介
实时生成 6 位 TOTP 验证码

支持 Base32 / otpauth 密钥

支持多账户管理

数据存储在你自己的 Cloudflare D1 数据库

无服务器、零运维成本

