# 统一API架构使用指南

## 🎯 解决方案概述

通过引入**共享业务逻辑层**，现在开发环境和生产环境使用完全相同的后端代码：

- ✅ **单一代码源**：所有业务逻辑都在 `lib/handlers.js`
- ✅ **开发生产一致**：Express 和 Vercel Functions 使用相同逻辑
- ✅ **简化维护**：新增接口只需写一次
- ✅ **统一错误处理**：一致的错误响应格式

## 📁 新的项目结构

```
flower-market/
├── lib/                        # 🔥 共享业务逻辑层
│   ├── handlers.js              # 所有API的业务逻辑
│   ├── vercel-adapter.js        # Vercel Functions适配器
│   └── express-adapter.js       # Express适配器
├── api/                         # Vercel Functions (生产环境)
│   ├── catalog.json            # 数据文件
│   ├── health.js               # 使用共享逻辑
│   ├── images.js               # 使用共享逻辑
│   └── ...                     # 其他API文件
├── server/                      # Express服务器 (开发环境)
│   └── src/index.js            # 使用共享逻辑
└── src/                        # Vue前端
```

## 🚀 如何添加新接口

### 1. 在共享逻辑层添加处理器

编辑 `lib/handlers.js`：

```javascript
// 新增处理器示例
const getNewDataHandler = async (params = {}) => {
  const { page = 1, category } = params;
  
  try {
    // 这里写你的业务逻辑
    const data = await yourBusinessLogic(page, category);
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    throw new Error('获取数据失败');
  }
};

// 记得导出
module.exports = {
  // ... 其他处理器
  getNewDataHandler,
};
```

### 2. 添加Vercel Function (生产环境)

创建 `api/new-data.js`：

```javascript
const { getNewDataHandler } = require('../lib/handlers');
const { createVercelHandler } = require('../lib/vercel-adapter');

module.exports = createVercelHandler(getNewDataHandler);
```

### 3. 添加Express路由 (开发环境)

编辑 `server/src/index.js`：

```javascript
const { getNewDataHandler } = require('../../lib/handlers');
const { createExpressHandler } = require('../../lib/express-adapter');

// 添加路由
app.get('/api/new-data', createExpressHandler(getNewDataHandler));
```

### 4. 完成！

现在你的新接口在开发和生产环境都可用了：
- 开发环境：`http://localhost:3000/api/new-data`
- 生产环境：`https://your-domain.vercel.app/api/new-data`

## 🔧 开发流程

### 开发环境启动

```bash
# 方式1: 使用Vercel Dev (推荐 - 与生产环境完全一致)
npm run dev

# 方式2: 仅启动Express服务器
cd server && npm start

# 方式3: 仅启动前端
npm run dev:frontend
```

### 部署流程

```bash
# 1. 提交代码
git add .
git commit -m "feat: 新增xxx接口"
git push

# 2. Vercel自动部署 - 无需额外操作！
```

## 📋 API处理器参数说明

每个处理器都接收一个 `params` 对象，包含：

```javascript
const yourHandler = async (params = {}) => {
  // params 包含所有query参数和路由参数
  const {
    page,        // 来自 ?page=1
    category,    // 来自 ?category=music
    id          // 来自路由参数 /:id
  } = params;
  
  // 你的业务逻辑...
};
```

## ⚡ 迁移现有接口

如果你有现有的Express路由需要迁移：

### 迁移前（Express）
```javascript
app.get('/api/example', async (req, res) => {
  try {
    const { query } = req.query;
    const data = await someLogic(query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 迁移后（共享逻辑）
```javascript
// lib/handlers.js
const exampleHandler = async (params = {}) => {
  const { query } = params;
  try {
    const data = await someLogic(query);
    return { success: true, data };
  } catch (error) {
    throw new Error(error.message);
  }
};

// api/example.js (Vercel)
module.exports = createVercelHandler(exampleHandler);

// server/src/index.js (Express)
app.get('/api/example', createExpressHandler(exampleHandler));
```

## 🎯 最佳实践

1. **所有业务逻辑都写在 `lib/handlers.js`**
2. **API文件只负责适配，不包含业务逻辑**
3. **错误使用 `throw new Error()` 抛出**
4. **统一的返回格式**
5. **参数验证在处理器内部进行**

## 🔍 调试技巧

### 查看健康状态
```bash
curl http://localhost:3000/api/health
# 或
curl https://your-domain.vercel.app/api/health
```

### 测试特定接口
```bash
curl "http://localhost:3000/api/search?query=test&page=1"
```

## 📈 优势总结

| 之前 | 现在 |
|------|------|
| 两套代码维护 | 一套代码，双环境复用 |
| 接口逻辑不一致 | 完全一致的业务逻辑 |
| 难以调试生产问题 | 本地问题=生产问题 |
| 部署复杂 | 自动化部署 |
| 代码重复 | DRY原则，无重复 |

现在您可以专注于业务逻辑开发，而不用担心环境差异问题！ 