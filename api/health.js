const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不被允许' });
  }

  try {
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apis: {
        images: {
          endpoint: '/api/images',
          description: '获取图片列表（支持分页）',
          status: 'available'
        },
        search: {
          endpoint: '/api/search',
          description: '搜索图片',
          status: 'available'
        },
        getContent: {
          endpoint: '/api/getContent',
          description: '获取目录内容',
          status: 'available'
        },
        hymnDetail: {
          endpoint: '/api/hymn/detail/[id]',
          description: '获取诗歌详情',
          status: 'available'
        }
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ossConfigured: !!(process.env.OSS_REGION && process.env.OSS_BUCKET),
      }
    };

    // 检查catalog.json是否存在
    try {
      const catalogPath = path.join(process.cwd(), 'server', 'src', 'catalog.json');
      const catalogExists = fs.existsSync(catalogPath);
      healthInfo.files = {
        catalogJson: catalogExists ? 'found' : 'missing'
      };
    } catch (error) {
      healthInfo.files = {
        catalogJson: 'error checking'
      };
    }

    res.json(healthInfo);
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}; 