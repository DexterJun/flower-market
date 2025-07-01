/**
 * Express 适配器
 * 将共享的业务逻辑处理器转换为 Express 中间件格式
 */

// 通用的Express中间件包装器
const createExpressHandler = (handler) => {
  return async (req, res) => {
    try {
      // 提取参数（支持query参数和路由参数）
      const params = { ...req.query, ...req.params };

      // 调用处理器
      const result = await handler(params);

      // 返回结果
      res.json(result);
    } catch (error) {
      console.error('API处理失败:', error);

      const status = error.status || 500;
      const message = error.message || 'Internal Server Error';

      res.status(status).json({ error: message });
    }
  };
};

// CORS中间件
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  createExpressHandler,
  corsMiddleware
};