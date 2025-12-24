# 🔐 Cloudflare 2FA Generator

<div align="center">

一个功能强大、界面精美的 **双因素认证 (2FA)** 验证码生成与管理工具

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![GitHub](https://img.shields.io/github/stars/soga11/Cloudflare-2FA-Generator?style=social)](https://github.com/soga11/Cloudflare-2FA-Generator)

[功能特性](#-功能特性) • [1分钟部署](#-1分钟极速部署) • [使用说明](#-使用说明) • [常见问题](#-常见问题)

</div>

---

## 📸 应用截图

<div align="center">

| 🔑 生成器界面 | 🔐 账号管理 |
|:---:|:---:|
| 实时生成 TOTP 验证码 | 保存常用账号密钥 |

| 📷 扫码识别 | 💾 云端备份 |
|:---:|:---:|
| 相机/图片/截图三合一 | WebDAV + TG 双重备份 |

</div>

---

## ✨ 功能特性

### 🎯 核心功能

#### 🔢 实时 TOTP 生成
- ✅ 支持 **Google Authenticator**、**Microsoft Authenticator** 等标准格式
- ✅ 自动识别 **Base32**、**Hex**、**otpauth://** 多种密钥格式
- ✅ 验证码自动刷新，剩余时间实时倒计时
- ✅ 一键复制，完美支持 iOS/Android/Windows/macOS

#### 📷 智能二维码识别（三合一）
- 📱 **相机扫码** - 使用摄像头直接扫描 2FA 二维码
- 🖼️ **图片上传** - 支持截图、照片快速识别
- 🖥️ **屏幕截图** - 桌面端截取任意区域（无摄像头也能用）

#### 🗂️ 账号保险库
- 🔒 **双重密码保护** - 登录密码 + 保险库密码
- 📋 **分类管理** - 保存常用账号的 2FA 密钥
- 🏷️ **备注标签** - 添加账号备注、发行者信息
- ⚡ **实时刷新** - 所有账号验证码同步更新

### 💾 数据管理与备份

#### 📊 四维度数据记录

<table>
<tr>
<td align="center">🏠</td>
<td><b>本地历史</b></td>
<td>浏览器存储最近 50 条生成记录</td>
</tr>
<tr>
<td align="center">☁️</td>
<td><b>云端同步</b></td>
<td>登录后自动同步到 Cloudflare D1 数据库</td>
</tr>
<tr>
<td align="center">📲</td>
<td><b>Telegram 推送</b></td>
<td>每次生成实时发送到 TG，历史可查</td>
</tr>
<tr>
<td align="center">👤</td>
<td><b>游客模式</b></td>
<td>无需登录即可使用基础功能</td>
</tr>
</table>

#### 🔄 三种备份方式

<table>
<tr>
<td width="33%" align="center">

### 📄 本地备份
**JSON / TXT 导出**
- 一键导出所有账号
- 支持导入恢复
- 离线安全存储

</td>
<td width="33%" align="center">

### ☁️ WebDAV 云备份
**自动同步多设备**
- 坚果云、Nextcloud
- 自动测试连接
- 一键上传/恢复

</td>
<td width="33%" align="center">

### 📲 Telegram 推送
**实时通知备份**
- 每次生成自动推送
- TG 历史记录可查
- 远程实时提醒

</td>
</tr>
</table>

### 🔐 安全特性

