 Cloudflare-2FA-Generator
一个功能强大、界面精美的2FA cloudflare工具

 ✨ 功能特性

 🎯 核心功能

 🔢 实时 TOTP 生成
- ✅ 支持 Google Authenticator、Microsoft Authenticator 等标准格式
- ✅ 自动识别 Base32、Hex、otpauth:// URL 多种密钥格式
- ✅ 验证码自动刷新，剩余时间实时倒计时
- ✅ 一键复制，支持 iOS/Android/Windows/macOS

 📷 智能二维码识别
- 📱 **相机扫码** - 直接使用摄像头扫描 2FA 二维码
- 🖼️ **图片上传** - 上传二维码截图快速识别
- 🖥️ **屏幕截图** - 桌面端支持截取任意区域（适合无摄像头设备）
- 🤖 **自动解析** - 智能识别 otpauth:// 格式，自动填充密钥

 🗂️ 账号保险库
- 🔒 **双重密码保护** - 登录密码 + 保险库密码
- 📋 **分类管理** - 保存常用账号的 2FA 密钥
- 🏷️ **备注标签** - 添加账号备注、发行者信息
- ⚡ **实时刷新** - 所有保存的账号验证码同步更新

 💾 数据管理

 📊 多维度记录
- 🏠 **本地历史** - 浏览器存储最近 50 条生成记录
- ☁️ **云端同步** - 登录用户自动同步到 Cloudflare D1 数据库
- 👤 **游客模式** - 无需登录即可使用基础功能
- 📍 **IP 追踪** - 记录生成 IP 和设备信息（可选）

 🔄 备份与恢复

| 备份方式 | 优点 | 适用场景 |
|:---:|:---|:---|
| 📄 **JSON 导出** | 结构化数据，易于备份 | 本地存储、版本控制 |
| 📝 **TXT 导出** | 纯文本，人类可读 | 打印、手动记录 |
| ☁️ **WebDAV 云备份** | 自动同步，多设备共享 | 坚果云、Nextcloud |


支持主流 WebDAV 服务：



 🔐 安全特性

 🛡️ 多层安全防护  


 🚀 1分钟极速部署

 方式一：Cloudflare Workers（推荐）

 步骤 1：复制代码（10秒）

将 `Workers.js` 的所有代码复制。

 步骤 2：创建 Worker（20秒）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **Workers & Pages** → **创建应用程序**
3. 选择 **创建 Worker** → 点击 **部署**
4. 点击 **编辑代码** → 粘贴代码 → **保存并部署**

 步骤 3：创建 D1 数据库（30秒）

1. 左侧菜单 → **D1 SQL 数据库** → **创建数据库**
2. 数据库名称：`2fa-database` → **创建**
3. 进入数据库 → **控制台** → 粘贴以下 SQL 并执行：

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS totp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  secret TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_accounts_user_id ON saved_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_logs_user_id ON totp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_logs_timestamp ON totp_logs(timestamp DESC);


步骤 4：绑定数据库（20秒）
回到你的 Worker → 设置 → 变量
找到 D1 数据库绑定 → 添加绑定
变量名称：DB
D1 数据库：选择 2fa-database
保存 → 部署
🎉 完成！
访问你的 Worker 域名：https://your-worker.你的账号.workers.dev


🎯 可选配置
📲 启用 Telegram 推送（1分钟）
1. 获取 Bot Token
在 Telegram 找 @BotFather
发送 /newbot 创建机器人
按提示设置名称，获得 Token（格式：123456789:ABCdef...）
2. 获取 Chat ID
在 Telegram 找 @userinfobot
发送任意消息，获得你的 ID（格式：123456789）
3. 配置 Worker
Worker → 设置 → 变量和机密
添加环境变量：
变量名	值
TELEGRAM_BOT_TOKEN	你的Bot Token
TELEGRAM_CHAT_ID	你的Chat ID
保存并部署
📬 推送效果
每次生成验证码时，你会收到这样的 TG 消息：

🔐 2FA 验证码生成

👤 用户: Alice
🔑 密钥: JBSWY3DPEHPK3PXP
🔢 验证码: 123456
⏰ 时间: 2024-12-24 20:30:45
📍 IP: 1.2.3.4



方式二：Cloudflare Pages
快速部署（推荐新手）
Fork 本仓库 到你的 GitHub
登录 Cloudflare Dashboard
Workers & Pages → 创建应用程序 → Pages → 连接到 Git
选择你 Fork 的仓库 → 开始设置
框架预设：无 → 保存并部署
按照 步骤 3-4 创建并绑定 D1 数据库
