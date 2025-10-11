# 花卉市场项目

> 🎯 **全新统一架构**：开发和生产环境现在使用完全相同的后端代码！
> 
> 📖 **详细文档**：查看 [docs/unified-api.md](docs/unified-api.md) 了解新架构使用方法

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 环境变量配置
创建 `.env.local` 文件（开发环境）或在Vercel中配置以下环境变量：

```bash
# 阿里云OSS配置
OSS_REGION=oss-cn-beijing
OSS_BUCKET=your-bucket-name
ALIBABA_CLOUD_ACCESS_KEY_ID=your-access-key-id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-access-key-secret
```

### 3. 开发环境运行

#### 🎯 推荐：统一开发环境（使用Vercel Dev）
```bash
npm run dev
```
这会同时启动前端和后端API，与生产环境完全一致！

#### 📱 仅前端开发
```bash
npm run dev:frontend
```

#### 🖥️ 仅Express服务器开发
```bash
npm run dev:express
```

### 4. 构建和部署
```bash
npm run build
```

## 📋 项目结构

```
flower-market/
├── lib/                        # 🔥 共享业务逻辑层
│   ├── handlers.js              # 所有API的业务逻辑
│   ├── vercel-adapter.js        # Vercel Functions适配器
│   └── express-adapter.js       # Express适配器
├── api/                         # Vercel Functions (开发&生产统一)
│   ├── hymnData/
│   │   └── hymnList.json        # 数据文件
│   ├── images.js               # 获取图片列表
│   ├── search.js               # 搜索功能
│   ├── getContent.js           # 获取目录
│   └── hymn/detail/[id].js     # 详情页API
├── src/                        # Vue前端代码
├── server/                     # Express服务器（可选）
├── public/                     # 静态资源
└── vercel.json                 # Vercel配置
```

## ✨ 统一开发环境优势

- ✅ **开发和生产完全一致**：使用相同的API代码
- ✅ **单一数据源**：只需维护 `api/hymnData/hymnList.json`
- ✅ **简化部署**：无需额外配置
- ✅ **错误排查简单**：开发环境问题=生产环境问题
- ✅ **新增接口简单**：一次编写，两环境通用

## 🔧 开发说明

### 修改数据
直接编辑 `api/hymnData/hymnList.json` 文件，开发和生产环境会自动同步。

### 添加新API
1. 在 `lib/handlers.js` 中编写业务逻辑
2. 在 `api/` 下创建对应的Vercel Function文件
3. 可选：在Express服务器中添加路由

详细说明请查看 [docs/unified-api.md](docs/unified-api.md)

### 本地调试
使用 `npm run dev` 后：
- 前端：http://localhost:3000
- API：http://localhost:3000/api/*

### API健康检查
```bash
npm run test:api
# 或访问 http://localhost:3000/api/health
```

## 🚀 部署

推送到GitHub后，Vercel会自动部署。

## 功能特性

- 响应式瀑布流布局
- 图片搜索功能
- 图片预览
- 抽屉式目录
- 移动端适配

## API 接口

### 获取所有图片
```
GET /api/images
```

### 搜索图片
```
GET /api/images/search?query=关键词
```

## 注意事项

1. 确保后端服务器在 `http://localhost:3000` 运行
2. 图片文件需要放在 `server/public/images` 目录下
3. 支持的图片格式：jpg、jpeg、png、gif 