<div align="center">

# 🔐 Cloudflare 2FA Generator

**基于 Cloudflare Workers 的 2FA / TOTP 验证码生成器**  
✨ 一键部署 | 🔒 安全加密 | ☁️ 云端同步 | 📱 智能识别

[🚀 立即部署](#-1分钟快速部署) | [📖 使用说明](#-使用说明) | [💬 问题反馈](https://github.com/soga11/Cloudflare-2FA-Generator/issues)

</div>

---

## ⚡ 核心特性

| 🎯 智能生成 | 🛡️ 三重备份 | 🔐 安全特性 |
|:---:|:---:|:---:|
| 实时 TOTP 验证码 | 本地浏览器存储 | SHA-256 加密 |
| Base32 / Hex / otpauth | WebDAV 云端备份 | 2 小时自动登出 |
| 摄像头 / 图片 / 截图扫码 | Telegram 推送 | 保险库二次验证 |
| 账户分组管理 | JSON / TXT 导入导出 | Workers 边缘计算 |

---

## 🚀 1 分钟快速部署

### 步骤 1️⃣：准备代码（10 秒）
复制 [`worker.js`](./worker.js) 的完整代码

---

### 步骤 2️⃣：创建 Worker（20 秒）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create Application**
3. 选择 **Create Worker** → 命名（如 `2fa-generator`）
4. 点击 **Deploy** → 进入编辑器 → **粘贴代码**
5. 点击 **Save and Deploy**

---

### 步骤 3️⃣：创建数据库（20 秒）

1. Dashboard → **Storage & Databases** → **D1 SQL Database**
2. 点击 **Create** → 命名为 `2fa-database`
3. 进入数据库 → **Console**
4. **执行以下 SQL**

<details>
<summary>📊 <b>点击展开完整 SQL（直接复制到 D1 Console 执行）</b></summary>

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 保存的账户表
CREATE TABLE IF NOT EXISTS saved_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TOTP 日志表
CREATE TABLE IF NOT EXISTS totp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  secret TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_saved_accounts_user_id ON saved_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_logs_user_id ON totp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_logs_timestamp ON totp_logs(timestamp DESC);
</details>
步骤 4️⃣：绑定数据库（10 秒）
打开你的 Worker → Settings → Variables

在 D1 Database Bindings 中点击 Add binding

填写：

Variable name：DB

D1 database：2fa-database

点击 Save

✅ 完成！
访问：
https://2fa-generator.your-subdomain.workers.dev

📱 使用说明
🎯 游客模式（无需登录）
输入 Base32 / Hex 密钥或扫码

实时生成 6 位验证码

数据仅保存在浏览器本地

🔐 账户模式（云端同步）
注册 / 登录

设置保险库密码

多设备自动同步

数据端到端加密

💾 备份与恢复
方式	说明
📂 本地	JSON / TXT
☁️ WebDAV	坚果云 / TeraCloud
📲 Telegram	实时推送

🔔 Telegram 推送（可选）
1️⃣ 获取 Bot Token
搜索 @BotFather

/newbot 创建

保存 Token

2️⃣ 获取 Chat ID
搜索 @userinfobot

发送 /start

3️⃣ 配置 Worker 变量
Name	Value
TELEGRAM_BOT_TOKEN	Bot Token
TELEGRAM_CHAT_ID	Chat ID

勾选 Encrypt

