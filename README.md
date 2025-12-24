<div align="center">

# 🔐 Cloudflare 2FA Generator

**基于 Cloudflare Workers 的双因素验证码生成器**

✨ 一键部署 | 🔒 端到端加密 | ☁️ 云端同步 | 📱 多设备支持

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/soga11/Cloudflare-2FA-Generator)

</div>

---

## 🚀 三步快速部署（3分钟完成）

### 第一步：创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. 点击 **Create Application** → **Create Worker**
3. 命名为 `2fa-generator` → 点击 **Deploy**
4. 点击 **Edit Code**，删除所有代码，粘贴 [`worker.js`](./worker.js) 的内容
5. 点击 **Save and Deploy**

---

### 第二步：创建数据库

1. 返回 Dashboard → 左侧 **Storage & Databases** → **D1 SQL Database**
2. 点击 **Create** → 命名为 `2fa-database` → **Create**
3. 进入数据库 → 点击 **Console** 标签
4. 复制下面的 SQL 代码，粘贴到控制台，点击 **Execute**

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 账户表
CREATE TABLE saved_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 日志表
CREATE TABLE totp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  secret TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_saved_accounts_user_id ON saved_accounts(user_id);
CREATE INDEX idx_totp_logs_user_id ON totp_logs(user_id);
CREATE INDEX idx_totp_logs_timestamp ON totp_logs(timestamp DESC);
第三步：绑定数据库
回到你的 Worker → Settings → Variables
找到 D1 Database Bindings → 点击 Add binding
填写：
Variable name: DB（必须大写）
D1 database: 选择 2fa-database
点击 Save
✅ 部署完成！
访问你的 Worker 地址开始使用：

https://2fa-generator.你的用户名.workers.dev
