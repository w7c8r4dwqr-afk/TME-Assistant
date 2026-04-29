# 🧩 TME Assistant

> CN Training Team 专属效率工具 — 一站式浮窗助手

[![Version](https://img.shields.io/badge/version-v2.2-blue)]()
[![Platform](https://img.shields.io/badge/platform-Tampermonkey-green)]()
[![Browser](https://img.shields.io/badge/browser-Firefox%20%7C%20Chrome-orange)]()

## 📥 一键安装

> **前提：** 浏览器需先安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展

**👉 [点击这里安装 TME Assistant](https://github.com/w7c8r4dwqr-afk/TME-Assistant/raw/main/TME-Assistant.user.js)**

## ✨ 功能一览

| 模块 | 功能 | 说明 |
|------|------|------|
| 🤖 **AI Hub** | AI 工具集合 | Quick Suite、Party Rock、Kobzar、Amazon Nova 等 9 个 AI 工具快捷入口 |
| ⛽ **Rookie Gas Station** | 萌新加油站 | Andon Cord、Chat Tips、M@/FBA/IIDP/Feeds/FFT/ILAC 视频教程 |
| 📚 **Knowki** | 知识分享平台 | 一键跳转 NH 知识分享平台 |
| 🥟 **Baozipu** | 资源中心 | 一键跳转 Baozipu 资源页 |
| 🔍 **Search Hub** | 统一搜索中心 | 支持 Case / Blurb / SOP / Wiki / Ticket 搜索，支持 CTI 搜索 |
| ⚡ **Case Quick Jump** | Case 快速跳转 | 单个/批量 Case ID 跳转，自动去重 |
| 🧮 **Calculator Tools** | 计算器工具 | 时区转换、日期计算、文本处理 |
| 🍪 **Cookie Cleaner** | Cookie 清理 | 一键清除 Cookie，自动检测 400 错误 |

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Alt + S` | 打开 Search Hub |
| `Ctrl + Alt + J` | 打开 Case Quick Jump |
| `Ctrl + Alt + C` | 打开 Calculator Tools |
| `Ctrl + Alt + B` | 打开 Baozipu |
| `Ctrl + Alt + K` | 打开 Knowki |
| `Ctrl + Alt + Q` | 打开 Amazon Quick Suite |
| `Ctrl + Alt + H` | 快捷键帮助面板 |

## 🔍 Search Hub 搜索模式

**Paragon 搜索（Case / Blurb / SOP）**
- 支持 NA / EU / FE 三个 OU
- 记住上次选择的 OU 和搜索类型

**Wiki 搜索**
- 直接搜索 w.amazon.com

**SIM Ticket 搜索（4 种模式）**
- Ticket ID 直接跳转
- 关键词搜索
- CTI 搜索（Category / Type / Item）
- 关键词 + CTI 组合搜索

## 🧮 Calculator Tools

- **时区转换** — UTC、北京、洛杉矶、墨西哥城、柏林、伦敦、东京
- **日期计算** — 日期间隔计算、日期加减运算
- **文本处理** — 格式转换（空格/逗号/换行）、去重、字数统计

## 📝 更新日志

### v2.2（最新版）
- 🆕 SIM Ticket 搜索增强 — 新增「关键词 + CTI 组合搜索」模式
- 🆕 CTI 搜索输入框 — 支持 Category / Type / Item 精确搜索
- 🆕 Search Hub 动态标签 — 根据搜索类型自动切换提示
- 🔧 CTI 搜索精确匹配 — 双引号包裹提升搜索准确度
- 🔧 SIM 搜索 URL 格式升级
- 🔒 新增 escapeHTML() 防止 XSS 注入
- 🔒 fetch Proxy 添加 try-catch 异常保护
- 🔧 修复 Cookie 清理空值计数 bug
- 🔧 魔法数字提取为 CONFIG 常量
- ✨ 新增 5 个通用工具函数（$id、onEnter、showResult、manualLink）
- ✨ 文本分隔符识别增强（支持中文标点、Tab 等）
- ✨ initCalculator / openAIPanel 代码重构
- 🌐 新增域名匹配：*.corp.amazon.com、*.amazon.work

### v1.5
- ✨ 8 大功能模块完整上线
- ✨ 全局快捷键系统
- ✨ 搜索/跳转历史记录
- ✨ 拖拽浮窗 + 位置记忆
- ✨ 用户偏好持久化存储

## 🛠️ 技术栈

- **运行环境：** Tampermonkey / Greasemonkey
- **语言：** JavaScript (ES6+)
- **存储：** GM_setValue / GM_getValue
- **兼容域名：** *.amazon.com、*.amazonaws.com、*.a2z.com、*.amazon.dev、*.amazon.sharepoint.com、*.amazon.awsapps.com、*.corp.amazon.com、*.amazon.work

## 👩‍💻 作者

**Hazel** — CNKR Training Team

---

> 💡 遇到问题？请联系 Hazel
