<div align="center">

# 🔐 Cloudflare 2FA Generator

**基于 Cloudflare Workers 的双因素验证码生成器**

✨ 一键部署 | 🔒 端到端加密 | ☁️ 云端同步 | 📱 多设备支持

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
4. **复制下面的 SQL 代码，粘贴到控制台，点击 Execute**

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
📱 核心功能
功能	说明
🔑 实时生成验证码	支持 Base32/Hex/otpauth:// 格式
📸 智能扫码	支持摄像头/截图/图片上传
💾 三重备份	本地存储 + WebDAV 云备份 + Telegram 推送
🔐 安全加密	SHA-256 加密 + 保险库二次验证
☁️ 云端同步	多设备自动同步（需登录）
⚡ 零延迟	Cloudflare 全球边缘节点
🎯 使用指南
游客模式（无需登录）
打开应用 → 输入密钥或扫描二维码
立即获取 6 位验证码
数据保存在浏览器本地
账户模式（推荐）
注册账户 → 设置保险库密码
添加账户 → 扫码或手动输入
自动同步 → 所有设备共享数据
🔔 可选配置：Telegram 推送
1️⃣ 获取 Bot Token
Telegram 搜索 @BotFather
发送 /newbot 创建机器人
复制 Token（如 123456:ABC-DEF...）
2️⃣ 获取 Chat ID
Telegram 搜索 @userinfobot
发送任意消息获取你的 ID（如 123456789）
3️⃣ 配置环境变量
Worker → Settings → Variables → Add variable
添加两个变量：
TELEGRAM_BOT_TOKEN = 你的 Bot Token
TELEGRAM_CHAT_ID = 你的 Chat ID
点击 Encrypt → Save and Deploy
推送效果：每次生成验证码时，自动发送到你的 Telegram

❓ 常见问题
Q: 显示"数据库未连接"？
→ 检查 Worker Settings → Variables → D1 绑定名称是否为 DB（大写）

Q: WebDAV 连接失败？
→ 确保 URL 以 / 结尾，使用应用专用密码（坚果云需要在「安全选项」生成）

Q: 忘记保险库密码？
→ 无法找回（SHA-256 加密），建议用备份文件重新导入

Q: 如何备份数据？
→ 点击「导出为 JSON」或配置 WebDAV 自动备份

🛠️ 技术栈
前端: HTML + CSS + JavaScript
后端: Cloudflare Workers（Serverless）
数据库: Cloudflare D1（SQLite）
加密: SHA-256 + Web Crypto API
QR 识别: jsQR
