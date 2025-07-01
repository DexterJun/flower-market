/**
 * Vercel Functions 适配器
 * 将共享的业务逻辑处理器转换为 Vercel Functions 格式
 */

// 设置CORS头
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

// 通用的Vercel Function包装器
const createVercelHandler = (handler) => {
  return async (req, res) => {
    // 设置CORS
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: '方法不被允许' });
    }

    try {
      // 提取参数
      const params = { ...req.query };

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

module.exports = {
  createVercelHandler,
  setCorsHeaders
};