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
    const catalogPath = path.join(process.cwd(), 'server', 'src', 'catalog.json');
    const catalogData = fs.readFileSync(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogData);

    res.json({
      success: true,
      data: catalog
    });
  } catch (error) {
    console.error('获取目录内容失败:', error);
    res.status(500).json({
      success: false,
      error: '获取目录内容失败'
    });
  }
}; 