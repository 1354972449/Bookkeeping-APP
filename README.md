# 💰 黑马记账 - 个人财务管家

> 一款简洁、专业、全中文的桌面个人记账应用，帮助您轻松记录每一笔消费，养成理财好习惯。

---

## ✨ 功能特性

- 📒 **快速记账**：两步完成记账（输入金额 → 选择分类），支持快捷金额一键选择
- 📂 **丰富分类**：内置 **15 大主分类 + 数十个子分类**，覆盖餐饮、交通、购物、居住、人情、育儿、宠物等生活方方面面
- 📊 **数据统计**：按月生成消费报表，饼图 + 柱状图直观展示消费分布，自动识别冠军分类并给出理财建议
- 📋 **账单管理**：按日期分组展示全部账单，支持删除记录，「今日账单」专区一目了然
- 💰 **本月概览**：首页顶部卡片实时显示「今日支出 / 本月支出 / 记账笔数」三大核心指标
- 🖥️ **全中文界面**：Electron 菜单栏、按钮文案、提示信息全部中文化，无任何英文残留
- 💽 **本地存储**：基于 SQLite（sql.js）纯本地数据库，隐私数据 100% 留在您的电脑上
- 🎨 **精美 UI**：紫蓝渐变主题色、圆角卡片阴影、脉冲悬浮按钮、丝滑过渡动画
- 🛡️ **6 层兜底保护**：数据库损坏 / 文件被占用 / 分类丢失等极端场景自动修复，永不空白

---

## 🧰 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 🖥️ 桌面容器 | **Electron 43** | 跨平台桌面应用外壳，主进程 + 渲染进程架构 |
| ⚛️ 前端框架 | **React 19 + TypeScript** | 强类型 UI 组件化开发 |
| 🎨 UI 组件库 | **Ant Design 6** | 中文企业级 UI 组件库 |
| 📈 图表 | **ECharts 6** | 饼图 + 柱状图消费统计可视化 |
| 💾 数据库 | **SQL.js (SQLite)** | 纯 JS 实现的 SQLite，无需本地安装数据库服务 |
| 📦 构建工具 | **Webpack 5** | 前端代码打包 + 开发服务器 |
| 🚀 打包发布 | **electron-builder** | 生成 Windows .exe 安装包（NSIS）+ 绿色免安装版 |
| 🆔 唯一 ID | **uuid** | 每一笔账单生成唯一主键 |
| 🗓️ 日期处理 | **dayjs** | 日期格式化 / 按月份过滤数据 |

---

## 🚀 快速开始

### 环境要求

- Node.js **≥ 18**（推荐 20+）
- npm 或 pnpm / yarn
- Windows 10 / 11 64 位

### 1. 安装依赖

```bash
cd 黑马记账App
npm install
```

### 2. 开发模式运行（推荐调试用）

```bash
npm run dev
```

> 此命令会同时启动两件事：
> - Webpack Dev Server（热更新，端口 3000）
> - Electron 桌面窗口（等待前端服务就绪后自动弹出）
>
> 修改代码保存后会自动热重载，无需重启。

### 3. 打包成 Windows 可执行文件

```bash
# 打包前端代码 + 生成 Windows 安装包
npm run build:win
```

打包完成后，产物位于项目根目录的 `release/` 文件夹：

| 文件/目录 | 说明 |
|---|---|
| `黑马记账 Setup 1.0.0.exe` | **推荐**：NSIS 图形化安装向导，支持自定义安装目录，自动创建桌面/开始菜单快捷方式 |
| `win-unpacked/黑马记账.exe` | 绿色免安装版，直接双击运行，不用安装 |

### 4. 仅构建前端代码（不打包 Electron）

```bash
npm run react:build
```

产物输出到 `dist/` 目录。

---

## 📂 项目目录结构

```
黑马记账App/
├── public/                    # 静态资源
│   ├── icon.png              # APP 图标（桌面快捷方式 & 安装包图标）
│   └── index.html            # Webpack HTML 入口模板
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── main.js           # 主进程入口（创建窗口、注册中文菜单、IPC Handler）
│   │   ├── database.js       # SQLite 数据库操作（建表、CRUD、分类初始化）
│   │   └── preload.js        # 预加载脚本（contextBridge 安全暴露 electronAPI）
│   └── renderer/             # 前端渲染进程
│       ├── index.tsx         # React 挂载入口
│       ├── App.tsx           # 应用主组件（Tab 导航 + 首页账单 + 头部统计卡片）
│       ├── types.ts          # TypeScript 类型定义
│       ├── styles.css        # 全局样式（主题色、卡片、按钮、动画）
│       ├── components/
│       │   └── AddRecordModal.tsx   # 记账弹窗（金额输入 → 分类选择两步式）
│       ├── pages/
│       │   └── StatPage.tsx         # 统计页（月度总览 + 饼图 + 排行榜 + 消费建议）
│       └── utils/
│           └── database.ts          # 前端 IPC 调用封装（含分类兜底数据）
├── dist/                     # Webpack 构建产物（自动生成）
├── release/                  # electron-builder 打包产物（自动生成）
├── webpack.config.js         # Webpack 打包配置
├── package.json              # 项目依赖 + 脚本 + electron-builder 打包配置
└── README.md                 # 👉 本文件
```

---

## 📂 内置消费分类（共 15 大类）

| 主分类 | 图标 | 典型子分类 |
|---|---|---|
| 🍜 餐饮美食 | 🍜 | 早餐 / 午餐 / 晚餐 / 夜宵 / 外卖 / 水果 / 零食 / 奶茶饮品 / 聚餐宴请 |
| 🚗 交通出行 | 🚗 | 公交地铁 / 打车网约车 / 共享单车 / 火车高铁 / 机票船票 / 加油充电 / 停车过路费 / 维修保养 |
| 🛒 购物消费 | 🛒 | 日用百货 / 服装鞋帽 / 数码电器 / 美妆护肤 / 奢侈品 / 家居饰品 / 母婴用品 / 宠物用品 |
| 🏠 居住生活 | 🏠 | 房租房贷 / 水电燃气 / 物业费 / 网费话费 / 家居维修 / 搬家费用 / 家政服务 |
| 💬 通讯社交 | 💬 | 话费充值 / 流量套餐 / 宽带网络 / 会员充值 / 社交礼物 |
| 🎮 娱乐休闲 | 🎮 | 游戏充值 / 电影演出 / 运动健身 / KTV聚会 / 酒吧夜店 / 旅游度假 / 酒店住宿 |
| 🏥 医疗健康 | 🏥 | 门诊看病 / 药品费用 / 体检 / 保健品 / 牙科眼科 / 医疗保险 |
| 📚 学习教育 | 📚 | 书籍购买 / 在线课程 / 线下培训 / 文具用品 / 考试报名 / 资料打印 |
| 🎁 人情往来 | 🎁 | 红包礼金 / 请客送礼 / 份子钱 / 节日礼物 |
| 🚙 爱车养车 | 🚙 | 车辆保险 / 加油充电 / 停车费用 / 维修保养 / 洗车美容 / 违章罚款 |
| 👶 宝宝育儿 | 👶 | 奶粉辅食 / 尿布用品 / 童装玩具 / 早教启蒙 / 医疗疫苗 / 幼儿园学费 |
| 💼 金融保险 | 💼 | 银行手续费 / 信用卡利息 / 保险费用 / 贷款还款 / 投资亏损 / 其他费用 |
| 💇 美容美发 | 💇 | 剪发烫染 / 美容SPA / 美甲美睫 / 护肤化妆品 / 健身减肥 |
| 🐕 宠物生活 | 🐕 | 宠物粮食 / 医疗驱虫 / 美容洗澡 / 玩具用品 / 寄养服务 |
| 📦 其他支出 | 📦 | 丢失赔偿 / 公益捐赠 / 杂项支出 / 无法归类 |

> 提示：如果遇到分类丢失问题，请参考下方「常见问题」中的数据库重置方法。

---

## 💾 数据库文件位置

所有账单和分类数据都保存在本地 SQLite 数据库文件中：

```
%APPDATA%\hei-ma-zhang-ji\data\heimazhangji.db
```

即 Windows 下实际路径：

```
C:\Users\你的用户名\AppData\Roaming\hei-ma-zhang-ji\data\heimazhangji.db
```

**如何快速打开：** 按 `Win + R` 粘贴下面内容回车即可直达：
```
%APPDATA%\hei-ma-zhang-ji\data
```

---

## ❓ 常见问题

### 1. 启动后分类空白 / 选择不了分类

**原因：** 旧版本数据库结构损坏或分类表不兼容。
**解决：** 关闭 APP → 删除 `heimazhangji.db` 文件 → 重新启动 APP，会自动重建 15 大完整分类。

### 2. 端口 3000 被占用，`npm run dev` 启动失败

解决方法二选一：
- 关闭占用 3000 端口的程序（任务管理器 → 详细信息 → 结束 node.exe）
- 或修改 `webpack.config.js` 中的 `devServer.port` 换一个端口（同时注意 `package.json` 里 `dev:electron` 脚本中的 `wait-on http://localhost:3000` 也要同步修改）

### 3. `npm` 命令找不到

请先安装 Node.js（LTS 版，官网下载），安装完成后**重启终端**再试。

### 4. 安装包 / 打包时报图标错误

确认 `public/icon.png` 文件存在且为 PNG 格式（不能改后缀名）。

### 5. 打包后打开提示数据库 / WASM 加载失败

已在 `package.json` 的 `build.asarUnpack` 和 `extraResources` 中配置了 `sql-wasm.wasm` 的释放路径，请使用 `npm run build:win` 重新打包；开发模式下直接读取 `node_modules/sql.js/dist/sql-wasm.wasm`。

---

## 📦 打包配置说明

`package.json` → `build` 节点中的关键配置：

```json
{
  "appId": "com.heima.zhangji",
  "productName": "黑马记账",
  "asar": true,
  "asarUnpack": ["dist/sql-wasm.wasm"],
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }],
    "icon": "public/icon.png"
  },
  "nsis": {
    "language": "2052",          // 2052 = 简体中文
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "黑马记账",
    "allowToChangeInstallationDirectory": true
  }
}
```

---

## 🛡️ 6 层分类兜底机制

为彻底解决「分类丢失无法记账」的问题，代码中内置全链路兜底：

| 层级 | 位置 | 作用 |
|---|---|---|
| 第 1 层 | `database.js` → `initDatabase` | 打开 .db 文件失败自动备份 + 新建空库；建表/初始化分类失败自动重建 |
| 第 2 层 | `database.js` → `saveDatabase` | 写盘 EPERM 被占用 → 写 tmp 文件再 rename 替换，绝不写空 |
| 第 3 层 | `database.js` → `getAllCategories` | db 未初始化 / 查询异常 / 大类为空 / 子类全空 → 返回内置 15 大类静态数据 + 尝试重写数据库 |
| 第 4 层 | `database.js` → `addRecord` | 写记录前校验：分类表空 OR 分类 ID 不存在 → 立即重建分类表再写入 |
| 第 5 层 | `renderer/utils/database.ts` | electronAPI 不存在 / IPC 抛错 / 返回空 / 无 children → 前端内置 15 大类兜底显示 |
| 第 6 层 | 全代码 SQL 访问 | 所有 `result?.[0]?.values?.[0]?.[0]` 加可选链，防止 undefined 导致白屏 |

---

## 📝 更新日志

### v1.0.0
- 🎉 首个正式版本发布
- ✅ Electron 桌面应用 + React 前端 + SQLite 数据库
- ✅ 15 大主分类 + 数十个子分类
- ✅ 中文菜单 + 全中文界面
- ✅ 紫蓝渐变主题 + 动画美化
- ✅ 月度消费统计 + ECharts 图表
- ✅ 6 层分类兜底保护机制

---

## 📄 许可证

本项目仅供个人学习与使用。  
© 2026 黑马记账 - 个人财务管家
