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
      prefix: '', // 可选：指定前缀进行过滤
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
      .map(file => ({
        id: file.name.split('.')[0],
        filename: file.name,
        url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${file.name}`,
        lastModified: file.lastModified,
        size: file.size
      }))
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
    const marker = req.query.marker;

    // 从 OSS 获取文件列表
    const result = await ossClient.list({
      'max-keys': pageSize,
      marker: marker,
      prefix: query // 使用前缀搜索提高效率
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

    const filteredImages = result.objects
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .filter(file => file.name.toLowerCase().includes(query.toLowerCase()))
      .map(file => ({
        id: file.name.split('.')[0],
        filename: file.name,
        url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${file.name}`,
        lastModified: file.lastModified,
        size: file.size
      }));

    // 构建分页信息
    const pagination = {
      current: page,
      pageSize,
      total: result.isTruncated ? -1 : (page - 1) * pageSize + filteredImages.length,
      hasMore: result.isTruncated,
      nextMarker: result.nextMarker || null
    };

    res.json({
      images: filteredImages,
      pagination
    });
  } catch (error) {
    console.error('搜索图片失败:', error);
    res.status(500).json({ error: '搜索图片失败' });
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