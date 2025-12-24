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
6. 复制 [`schema.sql`](https://github.com/soga11/Cloudflare-2FA-Generator/blob/main/schema.sql) 的内容，粘贴到控制台并执行

<details>
<summary><b>💡 点击查看 SQL 代码（如果 schema.sql 打不开）</b></summary>

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  vault_password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 保存的账号表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_saved_accounts_user_id ON saved_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_logs_user_id ON totp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_logs_timestamp ON totp_logs(timestamp DESC);
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
点击展开详细步骤
