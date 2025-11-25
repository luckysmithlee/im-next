# 简单在线聊天系统

一个具有多种前端实现和 Socket.IO 后端的实时聊天应用。

## 功能特性

- **实时消息传输**（Socket.IO）
- **在线用户状态跟踪**
- **私聊功能**
- **消息持久化**（开发默认文件存储），顶部滚动自动按需加载历史
- **智能滚动行为**：在底部时不强制滚动；不在底部时渲染后自动滚到底部
- **干净的聊天头部**：仅在选中会话时渲染
- **多种前端实现**：Vite + React + TypeScript、Next.js
- **响应式设计**（Tailwind CSS）
- **模拟认证**（便于测试）

## 项目结构

本项目包含多种实现方式：

```
im-next/
├── frontend/          # Next.js 实现 (端口 3000/3001)
├── backend/           # Socket.IO 服务器 (端口 4000)
├── src/              # Vite + React + TypeScript 实现 (端口 3002)
└── docker-compose.yml # 所有服务的 Docker 配置
```

## 快速开始

### 方案 1：Docker Compose（推荐）

1. **启动所有服务：**
   ```bash
   docker compose build
   docker compose up -d
   ```

2. **创建测试用户：**
   ```bash
   chmod +x setup-test-users.sh
   ./setup-test-users.sh
   ```

3. **访问应用：**
   - Next.js 前端: http://localhost:3000
   - Vite 前端: http://localhost:5173
   - 后端 API/WebSocket: http://localhost:4000

### 方案 2：手动开发环境搭建

#### 后端设置
```bash
cd backend
npm install
npm run dev  # 运行在端口 4000
```

#### Vite 前端设置
```bash
npm install
npm run dev  # 运行在端口 3002
```

#### Next.js 前端设置
```bash
cd frontend
npm install
npm run dev  # 运行在端口 3001（构建后在 3000）
```

## 测试账户

所有实现都使用相同的模拟认证：
- test1@example.com / 123456
- test2@example.com / 123456
- test3@example.com / 123456

## 系统架构

### 后端（Node.js + Express + Socket.IO）
- **端口**: 4000
- **功能**: WebSocket 连接管理、在线用户跟踪、私聊消息、REST 历史接口
- **持久化**: 默认文件型 JSON（开发环境），可升级切换到 PostgreSQL/Supabase
- **依赖**: express, socket.io, cors, node-fetch

### Vite 前端（主要实现）
- **端口**: 3002
- **技术栈**: React 18 + TypeScript + Vite + Tailwind CSS
- **功能**: 现代 React Hooks、响应式设计、实时消息
- **依赖**: React, TypeScript, Socket.IO 客户端, Tailwind CSS, Lucide React

### Next.js 前端（替代实现）
- **端口**: 3000/3001
- **技术栈**: Next.js 16 + React 19 + Tailwind CSS
- **功能**: 服务端渲染支持、相同的消息功能
- **依赖**: Next.js, React, Socket.IO 客户端, Tailwind CSS

## 开发指南

### Vite 前端开发
```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 运行 ESLint
npm run check    # TypeScript 类型检查
```

### Next.js 前端开发
```bash
cd frontend
npm install
npm run dev      # 在端口 3001 启动开发服务器
npm run build    # 构建生产版本（在端口 3000 运行）
```

### 后端开发
```bash
cd backend
npm install
npm run dev      # 使用 nodemon 开发
npm start        # 生产环境启动
```

## 核心组件

### 消息输入区域
消息输入组件特性：
- **响应式布局**：移动端垂直堆叠，桌面端并排显示
- **自动聚焦**：选择用户后自动聚焦到消息输入框
- **智能占位符**：根据收信人选择更新占位符文本
- **键盘支持**：回车键发送消息

### 用户选择
- **侧边栏**：显示在线用户及实时状态
- **手动输入**：可在收信人字段手动输入用户 ID
- **视觉反馈**：选中的用户用主色调高亮显示

## WebSocket 事件

### 客户端到服务器
- `private_message`: 向特定用户发送私聊消息

### 服务器到客户端
- `online_users`: 更新的在线用户列表
- `private_message`: 接收私聊消息
- `user_online`: 用户上线通知
- `user_offline`: 用户下线通知

## REST 接口

- `GET /health`: 服务健康检查
- `GET /api/me`: 当前用户信息（需 `Authorization: Bearer <token>`，支持 mock token `mock_jwt_<userId>_<ts>`）
- `GET /api/messages/:peer?limit=<n>&before=<timestamp>`: 分页查询历史（严格早于 `before`），默认 20 条
- `POST /api/messages/:peer` JSON `{ content: string }`: 将当前用户的消息写入到会话

## 环境配置

项目默认使用模拟认证。如需使用真实认证部署生产环境，请配置：

```bash
# 后端 .env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOTRUE_JWT_SECRET=your_jwt_secret

# 前端 .env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Docker 服务

- `backend`: API + Socket.IO 服务（4000）
- `nextjs-frontend`: Next.js 应用（3000）
- `vite-frontend`: Vite React TypeScript 应用（5173）
- `postgres/redis/minio/nginx`: 生产栈（`docker-compose.prod.yml`）

## 测试

运行端到端测试：
```bash
cd frontend
npm test
```

## 说明

- 默认持久化使用 `backend/data/messages.json`，适合本地/开发。生产建议切换到 PostgreSQL/Supabase，并替换存储层实现。
- 历史按需加载：消息列表滚到顶部时自动加载上一页，加载后保持当前视口位置。
- 底部行为：若已在底部，新消息不强制滚动；若不在底部，渲染完成后平滑滚到底部。

## 最近更新

- ✅ 修复了消息输入区域的布局问题
- ✅ 优化了响应式设计，确保在小屏幕上正常显示
- ✅ 改进了用户选择逻辑，提供更好的交互体验
- ✅ 添加了自动聚焦功能，提升用户体验

## 技术亮点

### 响应式设计
- 移动端优先的设计理念
- 灵活的网格和弹性布局
- 适配各种屏幕尺寸

### 实时通信
- WebSocket 双向通信
- 自动重连机制
- 事件驱动的架构

### 用户体验
- 直观的界面设计
- 流畅的交互反馈
- 键盘快捷键支持
