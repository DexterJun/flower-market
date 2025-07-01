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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少 id 参数' });
    }

    // 从 catalog 中查找数据
    const catalogPath = path.join(process.cwd(), 'api', 'catalog.json');
    const catalogData = fs.readFileSync(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogData);

    const catalogItem = catalog.find(item => item.id === id);

    if (!catalogItem) {
      return res.status(404).json({ error: '未找到指定的诗歌' });
    }

    // 构建基础响应数据
    const responseData = {
      id: catalogItem.id,
      filename: catalogItem.filename,
      index: catalogItem.index,
      type: catalogItem.type,
      tag: catalogItem.tag,
      url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/hymn-image/${catalogItem.index}.${catalogItem.filename}.${catalogItem.type}`,
      detail: catalogItem.detail || {}
    };

    // 如果存在 video_file，查询阿里云视频文件
    if (catalogItem.detail && catalogItem.detail.video_file) {
      try {
        // 在 /video/ 路径下查找视频文件
        const videoFileName = catalogItem.detail.video_file;

        // 尝试查找不同格式的视频文件
        const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv'];
        let videoUrl = null;

        for (const ext of videoExtensions) {
          const videoPath = `video/${videoFileName}.${ext}`;
          try {
            // 检查文件是否存在
            const exists = await ossClient.head(videoPath);
            if (exists) {
              videoUrl = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${videoPath}`;
              break;
            }
          } catch (error) {
            // 文件不存在，继续尝试下一个格式
            continue;
          }
        }

        // 替换 video_file 的值
        responseData.detail = {
          ...responseData.detail,
          video_file: videoUrl || catalogItem.detail.video_file // 如果找不到文件，保持原值
        };

      } catch (error) {
        console.error('查询视频文件失败:', error);
        // 查询失败时保持原值
      }
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('获取详情失败:', error);
    res.status(500).json({ error: '获取详情失败' });
  }
}; 