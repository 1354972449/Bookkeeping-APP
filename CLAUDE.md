# 黑马记账 App 项目文档

## 📋 项目概述

**产品名称**：黑马记账  
**目标用户**：不懂编程的个人用户（开发者本人为编程小白）  
**目标平台**：Windows 和 Mac 电脑  
**核心功能**：记录个人日常消费支出（人民币），支持二级分类管理

---

## 🚨 重要项目约定（开发者须知）

> **开发者声明**：本项目开发过程中，用户（项目提出者）是编程小白，无法提供具体的技术细节要求。  
> **项目规则**：
> 1. 所有技术相关的决策（技术栈选型、架构设计、第三方库选择、开发工具等）**必须由开发者主动列出多个可行方案**，并向用户解释各方案的优劣势
> 2. 用户在了解各方案后做出最终选择，开发者不得擅自决定
> 3. 当遇到任何需要技术判断的决策点时，开发者应主动提出方案供选择
> 4. 本约定贯穿整个项目开发周期，始终有效

---

## ✅ 技术栈选型结果

**选定方案**：Electron + React + TypeScript + Ant Design + SQL.js + ECharts

| 选型 | 用途 |
|------|------|
| Electron | 跨平台桌面应用容器，一套代码运行Windows/Mac |
| React + TypeScript | 前端UI框架，类型安全 |
| Ant Design | 饿了么团队的中文本土化UI组件库 |
| SQL.js (SQLite) | 纯JavaScript实现的SQLite，数据本地存储无需安装任何额外软件 |
| ECharts | Apache开源图表库，用于统计页面 |
| electron-builder | 打包工具，生成Windows安装包(.exe)和Mac安装包(.dmg) |

---

## 📝 产品功能规格

### 1. 已实现功能

#### 1.1 记账功能（记录花销）
- ✅ 用户可以记录每一笔消费（人民币：元/角/分）
- ✅ 每次记录包含：金额、分类（二级）、日期时间、备注
- ✅ 金额支持精确到分（0.01元）
- ✅ 三步快速记账：输入金额 → 选择分类（大类→小类）→ 保存

#### 1.2 分类体系（二级分类）

| 一级大类 | 二级小类 |
|---------|---------|
| 🍜 **餐饮美食** | 三餐主食、外卖、水果零食、饮品奶茶、聚餐宴请 |
| 🚗 **交通出行** | 公交地铁、打车、火车/飞机、加油/停车、维修保养 |
| 🛒 **购物消费** | 日用百货、服装鞋帽、数码电器、美妆护肤 |
| 🏠 **居住生活** | 房租/房贷、水电燃气、物业费、家居维修 |
| 🎮 **娱乐休闲** | 游戏充值、电影/演出、运动健身、旅游度假 |
| 🏥 **医疗健康** | 看病/药费、体检、保健品 |
| 📚 **学习教育** | 书籍购买、课程培训、文具用品 |
| 📦 **其他** | 红包礼金、公益捐赠、其他支出 |

#### 1.3 数据展示
- ✅ 最近消费记录列表（按日期分组、时间倒序）
- ✅ 月度统计图表（饼图分布 + 分类排行柱状图）
- ✅ 按分类查看消费汇总
- ✅ 按月切换查看历史统计

#### 1.4 数据管理
- ✅ 数据本地SQLite存储（用户数据不上传云端）
- ✅ 支持删除记录

### 2. UI/UX
- ✅ 简洁清晰的界面，中文为主
- ✅ 记账操作流程3步完成
- ✅ 底部导航栏（记录 / 记账 / 统计）

---

## 📁 项目目录结构

```
hei-ma-zhang-ji/
├── src/
│   ├── main/                  # Electron主进程
│   │   ├── main.js            # Electron 窗口管理
│   │   └── database.js        # SQLite 数据库（建表、CRUD、分类数据）
│   └── renderer/              # React渲染进程
│       ├── index.tsx           # React入口
│       ├── App.tsx             # 主应用组件（路由/导航）
│       ├── styles.css          # 全局样式
│       ├── types.ts            # TypeScript 类型定义
│       ├── components/
│       │   └── AddRecordModal.tsx  # 记账弹出窗口（金额→选分类→保存）
│       ├── pages/
│       │   └── StatPage.tsx    # 统计页面（排行榜+饼图）
│       └── utils/
│           └── database.ts     # 数据库桥接层（渲染进程调主进程）
├── public/
│   └── index.html              # HTML模板
├── package.json                # 项目配置与依赖
├── tsconfig.json               # TypeScript配置
├── webpack.config.js           # Webpack打包配置
└── CLAUDE.md                   # 本文件（项目文档）

---

## 🚀 开发指南

### 环境要求
- Node.js >= 18（当前环境 Node.js v24.16.0 ✅）
- npm >= 9（当前环境 npm 11.13.0 ✅）
- 操作系统：Windows 10+ / macOS 10.13+

### 首次运行

由于网络限制，如果 Electron 二进制文件下载失败，需要设置镜像：

```bash
# Windows PowerShell：
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npx electron --version

# 或在 Git Bash / Terminal 中：
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npx electron --version
```

### 开发模式运行
```bash
# 启动开发服务器（同时启动webpack-dev-server + Electron）
# 注意：需要在 Git Bash 中运行，首次需要设置 Electron 镜像
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm run dev
```

### 生产构建
```bash
# 构建 Windows 安装包
npm run build:win

# 构建 Mac 安装包（需要在Mac系统上执行）
npm run build:mac
```

### 项目命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式启动（热更新） |
| `npm run dev:react` | 仅启动webpack开发服务器（浏览器预览） |
| `npm run build:win` | 打包Windows安装包（.exe） |
| `npm run build:mac` | 打包Mac安装包（.dmg） |
| `npm run react:build` | 仅编译前端代码 |

---

## 📁 项目目录结构

```
hei-ma-zhang-ji/
├── src/
│   ├── main/
│   │   ├── main.js              # Electron 窗口管理（创建窗口、生命周期）
│   │   └── database.js          # SQLite 数据库（初始化建表、8个一级分类+二级分类CRUD）
│   └── renderer/
│       ├── index.tsx             # React 入口
│       ├── App.tsx               # 主应用（路由切换、记账列表、统计）
│       ├── styles.css            # 全局样式（记录卡片、统计页、模态框、分类网格等）
│       ├── types.ts              # TypeScript 类型定义（Category, RecordItem, MonthlyStat）
│       ├── global.d.ts           # CSS 模块类型声明
│       ├── components/
│       │   └── AddRecordModal.tsx  # 记账弹窗组件（两步：输入金额→选择分类+备注）
│       ├── pages/
│       │   └── StatPage.tsx       # 月度统计页面（分类柱状排行 + ECharts饼图）
│       └── utils/
│           └── database.ts       # 数据库桥接层（渲染进程调用主进程数据库API）
├── public/
│   └── index.html                # HTML 模板
├── package.json                  # 项目配置与依赖
├── tsconfig.json                 # TypeScript 编译配置
├── webpack.config.js             # Webpack 打包配置（支持热更新开发）
└── CLAUDE.md                     # 项目文档（本文件）

---

## 📦 技术架构说明

```
用户操作界面 (React + Ant Design)
        ↕
记账页面 → AddRecordModal组件 → 渲染进程(database.ts桥接)
        ↕                         ↓
记录列表                     Electron主进程
        ↕                         ↓
统计页面 → ECharts图表       SQLite数据库文件
                            (data/heimazhangji.db)
```

**数据流**：
1. 用户在界面操作 → React组件调用 database.ts 的工具函数
2. database.ts 直接 require 主进程的 database.js（mode: electron-renderer）
3. database.js 使用 sql.js 操作 SQLite 文件（存储在用户应用数据目录）
4. 每次写操作后自动保存数据库文件到磁盘

---

## 📁 项目目录结构

```
hei-ma-zhang-ji/
├── src/
│   ├── main/
│   │   ├── main.js              # Electron 窗口管理（创建窗口、生命周期、IPC）
│   │   └── database.js          # SQLite 数据库（初始化建表、8个一级分类+二级分类、CRUD操作）
│   └── renderer/
│       ├── index.tsx             # React 渲染入口
│       ├── App.tsx               # 主组件（三Tab导航：记录/记账/统计）
│       ├── styles.css            # 全局样式（卡片、网格、统计页、动画）
│       ├── types.ts              # TypeScript 类型定义
│       ├── global.d.ts           # CSS模块声明
│       ├── components/
│       │   └── AddRecordModal.tsx  # 记账弹窗（金额输入→分类选择→保存）
│       ├── pages/
│       │   └── StatPage.tsx       # 月度统计（分类排行榜 + ECharts饼图）
│       └── utils/
│           └── database.ts       # 数据库渲染进程桥接层
├── public/
│   └── index.html                # HTML 模板
├── package.json                  # 项目配置和依赖
├── tsconfig.json                 # TypeScript 编译配置
├── webpack.config.js             # Webpack 打包配置
├── dist/                         # 编译输出目录（首次构建后生成）
└── CLAUDE.md                     # 项目文档（本文件）
```

---

## ⏭️ 下一步

当前项目已开发完成，所有核心功能均可用。如需新增功能或修改，请提出需求。
