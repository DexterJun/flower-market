# 花卉市场图片画廊

这是一个使用 Vue 3 和 Node.js 构建的图片画廊应用。

## 项目结构

```
flower-market/
├── src/                # 前端源代码
│   ├── api/           # API 接口
│   ├── components/    # Vue 组件
│   └── views/         # 页面视图
├── server/            # 后端源代码
│   ├── src/          # 服务器代码
│   └── public/       # 静态文件
└── README.md
```

## 安装和运行

### 前端

1. 安装依赖：
```bash
yarn install
```

2. 运行开发服务器：
```bash
yarn dev
```

### 后端

1. 进入服务器目录：
```bash
cd server
```

2. 安装依赖：
```bash
yarn install
```

3. 运行服务器：
```bash
yarn dev
```

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