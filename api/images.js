const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');

// 配置阿里云 OSS 客户端
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
});

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
    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const marker = req.query.marker;

    // 从 OSS 获取文件列表
    const result = await ossClient.list({
      'max-keys': pageSize,
      marker: marker,
      prefix: 'hymn-image/',
      delimiter: '/'
    });

    if (!result.objects) {
      return res.json({
        images: [],
        pagination: {
          current: page,
          pageSize,
          total: 0,
          hasMore: false,
          nextMarker: null
        }
      });
    }

    // 加载 catalog.json
    const catalogPath = path.join(process.cwd(), 'api', 'catalog.json');
    const catalogData = fs.readFileSync(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogData);

    const images = result.objects
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .map(file => {
        const filename = file.name.replace('hymn-image/', '').split('.')[1];
        const catalogItem = catalog.find(item => item.filename === filename);
        const resObj = {
          id: catalogItem?.id,
          index: file.name.replace('hymn-image/', '').split('.')[0],
          filename,
          url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${file.name}`,
          lastModified: file.lastModified,
          size: file.size
        }
        if (catalogItem?.tag) {
          resObj.tag = catalogItem.tag;
        }
        return resObj
      })
      .sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));

    // 构建分页信息
    const pagination = {
      current: page,
      pageSize,
      total: result.isTruncated ? -1 : (page - 1) * pageSize + images.length,
      hasMore: result.isTruncated,
      nextMarker: result.nextMarker || null
    };

    res.json({
      images,
      pagination
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ error: '获取图片列表失败' });
  }
}; 