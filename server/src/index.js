const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量 - 修复路径和文件名
const envPath = path.join(__dirname, '..', '..', '.env.local');
console.log('🔧 尝试加载环境变量文件:', envPath);
dotenv.config({ path: envPath });

// 如果.env.local不存在，尝试加载.env
if (!require('fs').existsSync(envPath)) {
  const fallbackEnvPath = path.join(__dirname, '..', '..', '.env');
  console.log('🔧 .env.local不存在，尝试加载.env:', fallbackEnvPath);
  dotenv.config({ path: fallbackEnvPath });
}

// 检查关键环境变量
console.log('🔍 环境变量检查:');
console.log('  OSS_REGION:', process.env.OSS_REGION ? '✅' : '❌');
console.log('  OSS_BUCKET:', process.env.OSS_BUCKET ? '✅' : '❌');
console.log('  ACCESS_KEY_ID:', process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ? '✅' : '❌');
console.log('  ACCESS_KEY_SECRET:', process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ? '✅' : '❌');

// 导入共享的业务逻辑处理器和适配器
const {
  healthHandler,
  getContentHandler,
  getImagesHandler,
  searchImagesHandler,
  getHymnDetailHandler
} = require('../../lib/handlers');
const { createExpressHandler, corsMiddleware } = require('../../lib/express-adapter');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(corsMiddleware);

app.get('/api/health', createExpressHandler(healthHandler));
app.get('/api/getContent', createExpressHandler(getContentHandler));
app.get('/api/images', createExpressHandler(getImagesHandler));
app.get('/api/search', createExpressHandler(searchImagesHandler));
app.get('/api/hymn/detail/:id', createExpressHandler(getHymnDetailHandler));

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '花卉市场 API 服务器',
    status: 'running',
    version: '1.0.0',
    endpoints: [
      'GET /api/health - 健康检查',
      'GET /api/getContent - 获取目录内容',
      'GET /api/images - 获取图片列表',
      'GET /api/search - 搜索图片',
      'GET /api/hymn/detail/:id - 获取诗歌详情'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 API文档: http://localhost:${PORT}/api/health`);
  console.log('✅ 使用统一的共享业务逻辑');
});