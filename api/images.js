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

// 加载 catalog.json
let catalogData = null;
try {
  const catalogPath = path.join(process.cwd(), 'server', 'src', 'catalog.json');
  catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (error) {
  console.error('加载 catalog.json 失败:', error);
}

// 根据文件名匹配 catalog 中的数据
function enrichImageWithCatalogData(image) {
  if (!catalogData) return image;

  const catalogItem = catalogData.find(item => item.filename === image.filename);
  if (catalogItem && catalogItem.tags) {
    return {
      ...image,
      tags: catalogItem.tags
    };
  }
  return image;
}

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

    const images = result.objects
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .map(file => {
        const baseImage = {
          id: file.name.replace('hymn-image/', '').split('.')[0],
          filename: file.name.replace('hymn-image/', '').split('.')[1],
          url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${file.name}`,
          lastModified: file.lastModified,
          size: file.size
        };

        // 使用 catalog 数据丰富图片信息
        return enrichImageWithCatalogData(baseImage);
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