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
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    if (!query) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    // 获取所有文件进行模糊搜索
    let allObjects = [];
    let marker = null;
    let hasMore = true;
    let batchCount = 0;
    const maxBatches = 10; // 限制最大批次，避免超时

    // 分批获取文件，同时进行搜索以提高效率
    const searchQuery = query.toLowerCase();
    let matchedImages = [];

    while (hasMore && batchCount < maxBatches) {
      const result = await ossClient.list({
        'max-keys': 1000,
        marker: marker,
        prefix: 'hymn-image/',
        delimiter: '/'
      });

      if (result.objects) {
        // 立即过滤当前批次的文件
        const batchMatches = result.objects
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
          .filter(file => {
            const fileName = file.name.replace('hymn-image/', '');
            return fileName.toLowerCase().includes(searchQuery);
          })
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
          });

        matchedImages = matchedImages.concat(batchMatches);
      }

      hasMore = result.isTruncated;
      marker = result.nextMarker;
      batchCount++;

      // 如果已经找到足够多的结果，可以提前结束
      if (matchedImages.length >= pageSize * page) {
        break;
      }
    }

    // 排序搜索结果
    matchedImages.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));

    // 实现分页
    const total = matchedImages.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedImages = matchedImages.slice(startIndex, endIndex);

    // 构建分页信息
    const pagination = {
      current: page,
      pageSize,
      total: hasMore ? -1 : total, // 如果还有更多数据未检索，total设为-1表示未知
      hasMore: endIndex < total || hasMore,
      nextMarker: null
    };

    res.json({
      images: paginatedImages,
      pagination
    });
  } catch (error) {
    console.error('搜索图片失败:', error);
    res.status(500).json({ error: '搜索图片失败' });
  }
}; 