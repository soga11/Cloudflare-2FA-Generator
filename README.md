<div align="center">

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
✅ 完成！
访问你的 Worker 地址（如 https://2fa-generator.your-subdomain.workers.dev）开始使用！

📱 使用说明
🎯 游客模式（无需登录）
直接输入 Base32/Hex 密钥或扫描二维码
查看实时生成的 6 位验证码
数据仅保存在浏览器本地（不同步）
🔐 账户模式（云端同步）
注册/登录 → 设置保险库密码
添加账户 → 扫码或手动输入密钥
自动同步 → 所有设备云端共享
三重备份 → 本地 + WebDAV + Telegram
💾 备份恢复
备份方式	说明	优势
📂 本地备份	导出为 JSON/TXT 文件	离线保存，完全可控
☁️ WebDAV	自动上传至坚果云/TeraCloud	跨设备恢复，永久保存
📲 Telegram	实时推送到 Bot	即时通知，防丢失
操作步骤：

导出本地备份：点击「导出为 JSON」或「导出为 TXT」
上传到 WebDAV：填写 WebDAV 配置 → 点击「测试连接」→「上传备份」
从 WebDAV 恢复：点击「从 WebDAV 恢复」→ 自动拉取最新备份
导入备份文件：点击「导入备份」→ 选择 JSON/TXT 文件
🔔 可选：Telegram 推送（1分钟配置）
1️⃣ 获取 Bot Token
Telegram 搜索 @BotFather
发送 /newbot 创建机器人
按提示设置名称和用户名
复制 Token（格式如 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11）
2️⃣ 获取 Chat ID
Telegram 搜索 @userinfobot
发送任意消息（如 /start）
Bot 会回复你的 ID（如 123456789）
3️⃣ 配置 Worker 环境变量
打开 Cloudflare Dashboard → 你的 Worker → Settings → Variables

在 Environment Variables 区域点击 Add variable

添加以下两个变量：

变量 1：

Name: TELEGRAM_BOT_TOKEN
Value: 你的 Bot Token（如 123456:ABC-DEF...）
点击 Encrypt（加密保护）
变量 2：

Name: TELEGRAM_CHAT_ID
Value: 你的 Chat ID（如 123456789）
点击 Encrypt
点击 Save and Deploy

✅ 测试推送
返回你的 2FA Generator 页面
生成一次验证码
检查 Telegram 是否收到推送消息（包含账户名、验证码、时间等）
推送消息示例：

🔐 2FA 验证码生成

📱 账户：GitHub (user@example.com)
🔑 验证码：123456
⏰ 时间：2024-12-24 12:34:56
🌐 IP：1.2.3.4
💻 设备：Chrome/Windows
❓ 常见问题
Q: 为什么显示"数据库未连接"？
解决方法：

检查 Worker Settings → Variables → D1 Database Bindings
确认绑定名称是 DB（大写）
确认绑定的数据库是 2fa-database
保存后等待 10 秒，刷新页面重试
Q: WebDAV 连接失败？
常见原因：

URL 格式错误：必须以 / 结尾，如 https://dav.jianguoyun.com/dav/
密码错误：部分服务需要使用「应用专用密码」而不是登录密码
坚果云：进入「账户信息」→「安全选项」→「添加应用」生成密码
TeraCloud：使用登录密码即可
文件夹不存在：确保文件夹名称正确（如 2FA_Backup），或留空使用根目录
支持的 WebDAV 服务：

✅ 坚果云：https://dav.jianguoyun.com/dav/
✅ TeraCloud：https://ogi.teracloud.jp/dav/
✅ Nextcloud：https://your-domain.com/remote.php/dav/files/username/
✅ ownCloud、Box、Yandex Disk 等
Q: 如何迁移到新设备？
方法一：账户自动同步

在新设备登录相同账户 → 自动同步所有保存的账户
方法二：本地备份迁移

旧设备：点击「导出为 JSON」保存文件
新设备：点击「导入备份」选择该 JSON 文件
方法三：云端恢复

新设备：点击「从 WebDAV 恢复」→ 自动拉取最新备份
Q: 忘记保险库密码怎么办？
无法找回！ 保险库密码采用 SHA-256 单向加密，开发者也无法恢复。

解决方法：

如果有本地/WebDAV 备份：删除账户重新注册 → 导入备份
如果没有备份：只能重新添加所有 2FA 账户
建议： 定期导出本地备份，或配置 WebDAV 自动备份

Q: Telegram 没有收到推送？
检查步骤：

确认 Worker 环境变量配置正确（TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID）
打开 Telegram，先给你的 Bot 发送 /start（激活对话）
Chat ID 确保是数字格式（如 123456789），不是用户名
重新部署 Worker：Save and Deploy
打开浏览器控制台（F12）查看是否有错误信息
Q: 游客模式和账户模式有什么区别？
功能	游客模式	账户模式
实时生成验证码	✅	✅
扫描二维码	✅	✅
保存账户	❌ 仅浏览器本地	✅ 云端同步
多设备同步	❌	✅
WebDAV 备份	❌	✅
Telegram 推送	✅	✅
数据加密	-	✅ 保险库密码
🛠️ 技术栈
前端	后端	存储	工具	加密
HTML/CSS/JS	Cloudflare Workers	D1 SQLite	jsQR	SHA-256
特性说明：

边缘计算：全球 300+ 节点，访问速度 < 50ms
无服务器：零运维成本，自动扩容
高可用：Cloudflare 保证 99.99% SLA
隐私保护：数据存储在你的 D1 数据库，开发者无法访问
📄 开源协议
本项目采用 MIT License 开源协议

🙏 鸣谢
Cloudflare - 提供边缘计算平台和免费 Workers/D1 服务
jsQR - 开源二维码识别库
RFC 6238 - TOTP 时间一次性密码算法标准
🔗 相关链接
Cloudflare Workers 文档
D1 数据库文档
RFC 6238 - TOTP 标准
jsQR GitHub
⚠️ 免责声明
本项目基于 Cloudflare Workers 部署，数据存储在你的个人 D1 数据库中
请妥善保管账户密码和保险库密码，开发者无法帮助找回
敏感数据均采用 SHA-256 加密，但仍建议定期备份
本项目仅供学习交流使用，请勿用于非法用途
开发者不对因使用本项目导致的任何直接或间接损失负责
💡 使用过程中遇到问题？
📮 提交 Issue | ⭐ 给个 Star

Made with ❤️ by soga11

```
