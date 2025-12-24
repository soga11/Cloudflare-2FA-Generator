# 🔐 Cloudflare 2FA Generator

**基于 Cloudflare Workers 的 2FA/TOTP 验证码生成器**  
✨ 一键部署 | 🔒 安全加密 | ☁️ 云端同步 | 📱 智能识别

[🚀 立即部署](#-1分钟快速部署) | [📖 详细文档](#-使用说明) | [💬 反馈问题](https://github.com/soga11/Cloudflare-2FA-Generator/issues)

---

### ⚡ 核心特性

| 🎯 智能生成 | 🛡️ 三重备份 | 🔐 安全特性 |
|:---:|:---:|:---:|
| 实时 TOTP 验证码 | 本地浏览器存储 | SHA-256 加密 |
| 多格式识别（Base32/Hex/otpauth） | WebDAV 云端备份 | 2小时自动登出 |
| 摄像头/图片/截图扫码 | Telegram 推送通知 | 保险库二次验证 |
| 账户分组管理 | JSON/TXT 导入导出 | 边缘计算零延迟 |

</div>

---

## 🚀 1分钟快速部署

### 步骤 1️⃣：准备代码（10秒）
复制 [`worker.js`](./worker.js) 的完整代码

### 步骤 2️⃣：创建 Worker（20秒）
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → 点击 **Create Application**
3. 选择 **Create Worker** → 命名（如 `2fa-generator`）
4. 点击 **Deploy** → 进入编辑器 → **粘贴代码** → **Save and Deploy**

### 步骤 3️⃣：创建数据库（20秒）
1. 回到 Dashboard → 左侧菜单 **Storage & Databases** → **D1 SQL Database**
2. 点击 **Create** → 命名为 `2fa-database` → **Create**
3. 点击你创建的数据库 → 顶部 **Console** 标签 → **执行以下 SQL**：

<details>
<summary>📊 <b>点击展开完整 SQL 代码（直接复制到 D1 Console 执行）</b></summary>

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

步骤 4️⃣：绑定数据库（10秒）
回到你的 Worker → Settings → Variables
找到 D1 Database Bindings → 点击 Add binding
填写：
Variable name: DB
D1 database: 选择 2fa-database
点击 Save
