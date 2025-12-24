# 🔐 Cloudflare 2FA Generator

<div align="center">

一个功能强大、界面精美的 **双因素认证 (2FA)** 验证码生成与管理工具

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![GitHub Stars](https://img.shields.io/github/stars/soga11/Cloudflare-2FA-Generator?style=social)](https://github.com/soga11/Cloudflare-2FA-Generator)

**⏱️ 1 分钟极速部署 | 📱 三重备份保障 | 🔐 军事级加密**

</div>

---

## 📸 应用截图

<div align="center">

| 🔑 生成器 | 🔐 保险库 | 📷 扫码 | 💾 备份 |
|:---:|:---:|:---:|:---:|
| 实时生成验证码 | 保存常用账号 | 三合一识别 | 三重备份 |

</div>

---

## ✨ 核心功能

### 🎯 智能生成
- ✅ 支持 **Base32** / **Hex** / **otpauth://** 多格式自动识别
- ✅ **相机扫码** + **图片上传** + **屏幕截图** 三合一识别
- ✅ 验证码自动刷新，剩余时间实时倒计时
- ✅ 一键复制，完美支持所有平台

### 💾 三重备份保障

<table>
<tr>
<td width="33%" align="center">

### 📄 本地备份
**JSON/TXT 导出**
- 一键导出所有账号
- 支持导入恢复
- 离线安全存储
- **永久保存**

</td>
<td width="33%" align="center">

### ☁️ WebDAV 云备份
**自动同步多设备**
- 坚果云/Nextcloud
- 自动测试连接
- 一键上传/恢复
- **跨设备同步**

</td>
<td width="33%" align="center">

### 📲 Telegram 推送
**实时通知备份**
- 每次生成自动推送
- TG 历史可查
- 远程实时提醒
- **永不丢失**

</td>
</tr>
</table>

### 🔐 安全特性
- 🛡️ **SHA-256 加密** - 密码哈希存储，不存明文
- 🔒 **双重验证** - 登录密码 + 保险库密码
- ⏱️ **2小时会话** - 自动过期，刷新保持登录
- 🌐 **边缘计算** - 部署在 Cloudflare 全球 300+ 节点

---

## 🚀 1分钟极速部署

### 步骤 1：复制代码（10秒）

点击打开 → [`worker.js`](https://github.com/soga11/Cloudflare-2FA-Generator/blob/main/worker.js)

按 `Ctrl + A` 全选，`Ctrl + C` 复制所有代码。

---

### 步骤 2：创建 Worker（20秒）

1. 登录 → [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **Workers & Pages**
3. 点击 **创建应用程序** → **创建 Worker**
4. 点击 **部署**
5. 点击 **编辑代码**
6. 删除默认代码，粘贴刚才复制的代码
7. 点击 **保存并部署**

---

### 步骤 3：创建数据库（30秒）

1. 左侧菜单 → **D1 SQL 数据库**
2. 点击 **创建数据库**
3. 数据库名称输入：`2fa-database`
4. 点击 **创建**
5. 进入数据库 → 点击 **控制台**
6. 复制下面的 SQL 代码，粘贴到控制台并执行：

<details>
<summary><b>点击展开 SQL 代码</b></summary>

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
或直接使用 → 
schema.sql

步骤 4：绑定数据库（20秒）
回到你的 Worker 页面
点击 设置 选项卡
找到 变量 → 滚动到 D1 数据库绑定
点击 添加绑定
填写：
变量名称：DB
D1 数据库：选择 2fa-database
点击 部署
🎉 完成！
访问你的 Worker 域名：

https://你的worker名称.你的账号.workers.dev
⏱️ 总耗时：约 80 秒

📲 可选：启用 Telegram 推送（1分钟）
点击展开配置步骤
💡 快速使用
🔰 游客模式（无需注册）
打开网站
输入密钥或扫描二维码
自动生成验证码并复制
粘贴使用
🔐 账号模式（完整功能）
注册账号 - 右上角点击"登录/注册"，设置用户名和密码（至少 6 位）
设置保险库 - 进入"常用账号"，设置保险库密码（至少 8 位）
添加账号 - 点击"➕ 添加账号"，填写账号名称和密钥
备份数据 - 点击"💾 备份管理"，选择备份方式：
📄 本地备份
点击 导出 JSON 或 导出 TXT
妥善保管文件（包含明文密钥）
需要恢复时点击 选择文件导入
☁️ WebDAV 云备份
坚果云配置示例：

服务器地址: https://dav.jianguoyun.com/dav/
账户: your@email.com
密码: [应用密码]  ← 坚果云网页版 → 安全选项 → 添加应用
文件夹: 2FA_Backup
操作：

填写配置 → 点击 测试连接
连接成功 → 点击 上传到 WebDAV
需要恢复 → 点击 从 WebDAV 恢复
❓ 常见问题
Q: 完全免费吗？有使用限制吗？
Q: 数据存在哪里？安全吗？
Q: 忘记密码怎么办？
Q: 相机扫码不工作？
Q: WebDAV 连接失败？
Q: Telegram 推送不工作？
Q: 可以多设备同步吗？
🛠️ 技术栈
🎨 前端	⚡ 后端	🗄️ 数据库	📷 二维码	🔐 加密
原生 JS	Workers	D1 SQLite	jsQR	SHA-256
📄 开源协议
本项目采用 MIT License 开源。

你可以：

✅ 自由使用、修改、分发
✅ 用于个人或商业项目
🙏 致谢
Cloudflare - 强大的边缘计算平台
jsQR - 优秀的二维码识别库
RFC 6238 - TOTP 标准协议
🔗 相关链接
🐛 问题反馈
💬 讨论区
📖 Cloudflare Workers 文档
⚠️ 免责声明
本项目仅供学习和个人使用。请妥善保管 2FA 密钥和备份文件。

安全建议：

🔐 使用强密码保护账号
💾 定期导出备份到安全位置
🚫 不要在公共设备上使用
📲 建议启用 Telegram 推送作为额外备份
⭐ 如果这个项目对你有帮助，请给个 Star！

Star History Chart

Made with ❤️ by soga11

```
🎯 主要改进
✅ 1. 首页直接显示部署步骤
删除了导航链接
部署步骤在第一屏就能看到
每个步骤都有明确的时间估算
✅ 2. 强调三重备份
表格形式并列展示
每种备份方式的优势清晰
本地 + WebDAV + Telegram 三重保障
✅ 3. 简化结构
删除了冗余的导航
合并了重复的内容
只保留核心功能说明
✅ 4. 更直观的视觉效果
表格布局更清晰
步骤编号更明显
可折叠的详细内容
