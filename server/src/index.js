const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');
const OSS = require('ali-oss');
const fileUpload = require('express-fileupload');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 配置阿里云 OSS 客户端
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// 获取目录内容接口
app.get('/api/getContent', async (req, res) => {
  try {
    const catalogPath = path.join(__dirname, 'catalog.json');
    const catalogData = await fs.readFile(catalogPath, 'utf8');
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
});

// 获取图片列表（支持分页）
app.get('/api/images', async (req, res) => {
  try {
    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const marker = req.query.marker; // 用于继续上次的列表位置

    // 从 OSS 获取文件列表
    const result = await ossClient.list({
      'max-keys': pageSize,
      marker: marker, // 如果提供了 marker，从该位置继续列举
      prefix: 'hymn-image/', // 指定文件路径前缀
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

    const catalogPath = path.join(__dirname, 'catalog.json');
    const catalogData = await fs.readFile(catalogPath, 'utf8');
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
      .sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase())); // 不区分大小写的字母排序

    // 构建分页信息
    const pagination = {
      current: page,
      pageSize,
      total: result.isTruncated ? -1 : (page - 1) * pageSize + images.length, // 如果列表被截断，总数为 -1
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
});

// 搜索接口（支持分页）
app.get('/api/images/search', async (req, res) => {
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
    let totalFilesChecked = 0;

    const catalogPath = path.join(__dirname, 'catalog.json');
    const catalogData = await fs.readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogData);

    while (hasMore && batchCount < maxBatches) {
      const result = await ossClient.list({
        'max-keys': 1000,
        marker: marker,
        prefix: 'hymn-image/', // 指定文件路径前缀
        delimiter: '/'
      });

      if (result.objects) {
        totalFilesChecked += result.objects.length;

        // 立即过滤当前批次的文件
        const imageFiles = result.objects.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name));

        const batchMatches = imageFiles
          .filter(file => {
            const fileName = file.name;
            const matches = fileName.toLowerCase().includes(searchQuery);
            return matches;
          })
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
          });

        matchedImages = matchedImages.concat(batchMatches);
      }

      hasMore = result.isTruncated;
      marker = result.nextMarker;
      batchCount++;

      // 如果已经找到足够多的结果，可以提前结束
      if (matchedImages.length >= pageSize * page) {
        console.log('找到足够结果，提前结束搜索');
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
});

// 获取详情接口
app.get('/api/hymn/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: '缺少 id 参数' });
    }

    // 从 catalog 中查找数据
    const catalogPath = path.join(__dirname, 'catalog.json');
    const catalogData = await fs.readFile(catalogPath, 'utf8');
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
});

// 上传图片到 OSS
app.post('/api/images/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: '未上传图片文件' });
    }

    const file = req.files.image;
    const fileName = `${Date.now()}-${file.name}`;

    // 上传到 OSS
    const result = await ossClient.put(fileName, file.tempFilePath);

    // 删除临时文件
    await fs.unlink(file.tempFilePath);

    res.json({
      success: true,
      url: result.url,
      filename: fileName
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ error: '上传图片失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log('OSS 配置信息:', {
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ? '***' : '未设置'
  });
}); 