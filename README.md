🚀 Cloudflare 2FA Generator — 快速安装指南（新手版）

一个部署在 Cloudflare Workers 上的 2FA / TOTP 验证码生成器
无服务器 · 免费 · 云端同步

⏱️ 安装前准备（30 秒）

你需要：

一个 Cloudflare 账号

能访问 Cloudflare Dashboard

🧩 第 1 步：创建 Worker（1 分钟）

登录 👉 https://dash.cloudflare.com

左侧进入 Workers & Pages

点击 Create Application

选择 Create Worker

Worker 名称随便填（如 2fa-generator）

点击 Deploy

进入编辑器

把 worker.js 的完整代码全部粘进去

点击 Save and Deploy

✅ 到这里，Worker 已创建完成

🗄️ 第 2 步：创建数据库（1 分钟）

回到 Cloudflare Dashboard

左侧点击 Storage & Databases

进入 D1 SQL Database

点击 Create

数据库名称填写：

2fa-database


创建完成后，点击进入数据库

打开顶部的 Console

复制并执行下面这段 SQL（全部一起执行）

📄 数据库初始化 SQL（直接复制）
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 保存的账户
CREATE TABLE IF NOT EXISTS saved_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 验证码日志
CREATE TABLE IF NOT EXISTS totp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  secret TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_saved_accounts_user_id
ON saved_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_totp_logs_user_id
ON totp_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_totp_logs_timestamp
ON totp_logs(timestamp DESC);


✅ 如果没有报错，数据库初始化完成

🔗 第 3 步：绑定数据库到 Worker（30 秒）

打开你的 Worker

进入 Settings → Variables

找到 D1 Database Bindings

点击 Add binding

填写：

项目	内容
Variable name	DB
D1 database	2fa-database

点击 Save

再点一次 Save and Deploy

✅ 第 4 步：访问并使用

打开你的 Worker 地址，例如：

https://2fa-generator.your-name.workers.dev


如果页面能正常打开，说明部署成功 🎉

❓ 常见问题（给小白看的）
Q：页面提示「数据库未连接」？

请检查：

绑定名是否是 大写 DB

数据库是否选择的是 2fa-database

保存后等 5–10 秒再刷新

Q：这是免费的吗？

是的：

Cloudflare Workers 免费额度够个人使用

D1 数据库也有免费额度

Q：数据安全吗？

密码使用 SHA-256

数据只存在 你自己的 Cloudflare 账号

开发者无法访问你的数据
