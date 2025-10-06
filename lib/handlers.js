const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');

// 配置阿里云 OSS 客户端
const createOssClient = () => {
  // 检查必要的环境变量
  const requiredEnvs = ['OSS_REGION', 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'OSS_BUCKET'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    throw new Error(`缺少必要的环境变量: ${missingEnvs.join(', ')}`);
  }

  console.log('🔑 OSS配置检查通过');
  return new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
  });
};

// 获取catalog数据
const getCatalogData = () => {
  // 智能路径检测：支持从项目根目录或server目录运行
  let catalogPath;
  const currentDir = process.cwd();

  // 如果当前在server目录下运行（开发环境）
  if (currentDir.endsWith('server') || currentDir.includes('server')) {
    catalogPath = path.join(currentDir, '..', 'api', 'catalog.json');
  } else {
    // 如果在项目根目录运行（生产环境）
    catalogPath = path.join(currentDir, 'api', 'catalog.json');
  }

  // 检查文件是否存在，如果不存在尝试其他路径
  if (!fs.existsSync(catalogPath)) {
    // 尝试基于当前文件位置的相对路径
    const relativePath = path.join(__dirname, '..', 'api', 'catalog.json');
    if (fs.existsSync(relativePath)) {
      catalogPath = relativePath;
    } else {
      throw new Error(`找不到catalog.json文件。尝试的路径: ${catalogPath}, ${relativePath}`);
    }
  }

  console.log(`📂 读取catalog文件: ${catalogPath}`);
  const catalogData = fs.readFileSync(catalogPath, 'utf8');
  return JSON.parse(catalogData);
};

// 读取JSON数据文件（支持在根目录、server目录、Vercel/Lambda目录运行）
const readJsonDataFile = (relativePathFromRoot) => {
  const tried = [];
  const candidates = [];

  const currentDir = process.cwd();
  // 1) 当前工作目录（根 or 函数目录）
  candidates.push(path.join(currentDir, relativePathFromRoot));
  // 2) 从 server 运行时回到根目录
  if (currentDir.endsWith('server') || currentDir.includes('server')) {
    candidates.push(path.join(currentDir, '..', relativePathFromRoot));
  }
  // 3) 相对当前文件（lib）向上回到项目根
  candidates.push(path.join(__dirname, '..', relativePathFromRoot));
  // 4) 无服务器环境的常见根目录
  if (process.env.LAMBDA_TASK_ROOT) {
    candidates.push(path.join(process.env.LAMBDA_TASK_ROOT, relativePathFromRoot));
  }
  if (process.env.VERCEL_DIR) {
    candidates.push(path.join(process.env.VERCEL_DIR, relativePathFromRoot));
  }

  // 逐个尝试
  for (const p of candidates) {
    tried.push(p);
    if (p && fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        // 读到文件但解析失败，直接抛错并带上路径
        const err = new Error(`读取/解析数据文件失败: ${p} - ${e.message}`);
        err.status = 500;
        throw err;
      }
    }
  }

  // 未找到，输出可观测日志，便于线上排查
  console.error('❌ 未找到数据文件。relativePathFromRoot =', relativePathFromRoot);
  console.error('🔎 已尝试路径:');
  tried.forEach((tp) => console.error('  -', tp));

  const notFound = new Error(`找不到数据文件: ${relativePathFromRoot}`);
  notFound.status = 500;
  throw notFound;
};

// 在指定目录中查找与名称匹配的对象URL（按不含扩展名的基名匹配）
const findOssObjectUrlByBasename = async (folderPrefix, baseName) => {
  if (!baseName || typeof baseName !== 'string') return null;

  // 当 OSS 环境变量未配置时，直接返回 null，以便前端或上层使用本地占位
  const requiredEnvs = ['OSS_REGION', 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'OSS_BUCKET'];
  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
  if (missingEnvs.length > 0) {
    return null;
  }

  const ossClient = createOssClient();

  let marker = null;
  let hasMore = true;
  let tries = 0;
  const maxTries = 10; // 最多翻10页，避免过多请求

  while (hasMore && tries < maxTries) {
    const result = await ossClient.list({
      'max-keys': 1000,
      marker,
      prefix: folderPrefix.endsWith('/') ? folderPrefix : `${folderPrefix}/`,
      delimiter: '/'
    });

    if (result.objects) {
      const match = result.objects.find(obj => {
        const full = obj.name; // e.g. image/xxx.jpg
        const noPrefix = full.replace(folderPrefix.endsWith('/') ? folderPrefix : `${folderPrefix}/`, '');
        const nameOnly = noPrefix.split('.')[0];
        return nameOnly === baseName;
      });

      if (match) {
        return `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${match.name}`;
      }
    }

    hasMore = result.isTruncated;
    marker = result.nextMarker || null;
    tries++;
  }

  return null;
};

// 健康检查处理器
const healthHandler = async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'API is running',
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
      }
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ossConfigured: !!(process.env.OSS_REGION && process.env.OSS_BUCKET),
    },
    sharedLogic: true,
    version: '2.0.0 - Unified Architecture'
  };
};

// 获取内容处理器
const getContentHandler = async () => {
  try {
    console.log('🔍 开始获取目录内容...');
    const catalog = getCatalogData();
    console.log(`✅ 成功读取catalog，包含 ${catalog.length} 个项目`);
    return {
      success: true,
      data: catalog
    };
  } catch (error) {
    console.error('❌ 获取目录内容失败:', error.message);
    console.error('📍 当前工作目录:', process.cwd());
    console.error('📍 当前文件目录:', __dirname);
    throw new Error(`获取目录内容失败: ${error.message}`);
  }
};

// 获取图片列表处理器（带超时与本地catalog回退）
const getImagesHandler = async (params = {}) => {
  const { page = 1, pageSize = 20, marker, dir = 'hymn-image' } = params;

  // 基于 catalog 构造返回结果（用于回退）
  const buildFromCatalog = () => {
    const catalog = getCatalogData();
    const total = catalog.length;
    const start = Math.max(0, (Number(page) - 1) * Number(pageSize));
    const end = Math.min(total, start + Number(pageSize));

    const items = catalog
      .slice(start, end)
      .map((item) => {
        const filename = item.filename;
        const index = item.index;
        const type = item.type || 'jpg';
        const objectKey = `${dir.endsWith('/') ? dir : dir + '/'}` + `${String(index).padStart(3, '0')}.${filename}.${type}`;
        return {
          id: item.id,
          index: String(index),
          filename,
          url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${objectKey}`,
          lastModified: '',
          size: 0
        };
      })
      .sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));

    return {
      images: items,
      pagination: {
        current: Number(page),
        pageSize: Number(pageSize),
        total,
        hasMore: end < total,
        nextMarker: null
      }
    };
  };

  // 当缺少 OSS 环境变量时直接使用回退
  const requiredEnvs = ['OSS_REGION', 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'OSS_BUCKET'];
  const missingEnvs = requiredEnvs.filter((e) => !process.env[e]);
  if (missingEnvs.length > 0) {
    return buildFromCatalog();
  }

  // 尝试从 OSS 读取，但设置超时，超时则回退
  try {
    const ossClient = createOssClient();

    const basePrefix = `${dir.endsWith('/') ? dir : dir + '/'}`;

    const listPromise = ossClient.list({
      'max-keys': Number(pageSize),
      marker: marker,
      prefix: basePrefix,
      delimiter: '/'
    });

    // Vercel 免费层默认 10s，这里 8s 超时后回退
    const withTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('oss_list_timeout')), 8000);
    });

    const result = await Promise.race([listPromise, withTimeout]);

    // 如果触发超时，直接走回退
    if (result === undefined) {
      return buildFromCatalog();
    }

    if (!result.objects) {
      return {
        images: [],
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total: 0,
          hasMore: false,
          nextMarker: null
        }
      };
    }

    const catalog = getCatalogData();

    const images = result.objects
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
      .map((file) => {
        const nameWithoutPrefix = file.name.replace(basePrefix, '');
        const parts = nameWithoutPrefix.split('.');
        const indexStr = parts[0];
        const filename = parts[1];
        const catalogItem = catalog.find((c) => c.filename === filename);
        return {
          id: catalogItem?.id,
          index: indexStr,
          filename,
          url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${file.name}`,
          lastModified: file.lastModified,
          size: file.size
        };
      })
      .sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));

    const pagination = {
      current: Number(page),
      pageSize: Number(pageSize),
      total: result.isTruncated ? -1 : (Number(page) - 1) * Number(pageSize) + images.length,
      hasMore: result.isTruncated,
      nextMarker: result.nextMarker || null
    };

    return { images, pagination };
  } catch (error) {
    // 任何错误均回退到本地 catalog，避免 504
    return buildFromCatalog();
  }
};

// 搜索图片处理器
const searchImagesHandler = async (params = {}) => {
  const { query, page = 1, pageSize = 20 } = params;

  if (!query) {
    throw new Error('搜索关键词不能为空');
  }

  try {
    const ossClient = createOssClient();
    const catalog = getCatalogData();

    let matchedImages = [];
    let marker = null;
    let hasMore = true;
    let batchCount = 0;
    const maxBatches = 10;
    const searchQuery = query.toLowerCase();

    while (hasMore && batchCount < maxBatches) {
      const result = await ossClient.list({
        'max-keys': 1000,
        marker: marker,
        prefix: `${'hymn-image/'.endsWith('/') ? 'hymn-image/' : 'hymn-image/'}`,
        delimiter: '/'
      });

      if (result.objects) {
        const batchMatches = result.objects
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
          .filter(file => {
            const fileName = file.name.replace('hymn-image/', '');
            return fileName.toLowerCase().includes(searchQuery);
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
            return resObj
          });

        matchedImages = matchedImages.concat(batchMatches);
      }

      hasMore = result.isTruncated;
      marker = result.nextMarker;
      batchCount++;

      if (matchedImages.length >= pageSize * page) {
        break;
      }
    }

    matchedImages.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));

    const total = matchedImages.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedImages = matchedImages.slice(startIndex, endIndex);

    const pagination = {
      current: page,
      pageSize,
      total: hasMore ? -1 : total,
      hasMore: endIndex < total || hasMore,
      nextMarker: null
    };

    return {
      images: paginatedImages,
      pagination
    };
  } catch (error) {
    throw new Error('搜索图片失败');
  }
};

// 获取活动列表（替换封面为OSS URL）
const getActivityListHandler = async () => {
  try {
    const list = readJsonDataFile('api/activityData/activityList.json');

    const enhanced = await Promise.all(
      list.map(async (item) => {
        if (item && item.image) {
          const url = await findOssObjectUrlByBasename('image', item.image);
          if (url) {
            return { ...item, image: url };
          }
        }
        return item;
      })
    );

    return enhanced;
  } catch (e) {
    const err = new Error(`获取活动列表失败: ${e && e.message ? e.message : '未知错误'}`);
    err.status = e && e.status ? e.status : 500;
    err.cause = e;
    throw err;
  }
};

// 获取活动详情（根据activityId匹配，替换图片与视频URL）
const getActivityDetailHandler = async (params = {}) => {
  const { id } = params;
  if (!id) {
    const err = new Error('缺少活动ID');
    err.status = 400;
    throw err;
  }

  try {
    const details = readJsonDataFile('api/activityData/activityDetail.json');
    const match = details.find(d => d.activityId === id);
    if (!match) {
      const notFound = new Error('未找到活动详情');
      notFound.status = 404;
      throw notFound;
    }

    const images = Array.isArray(match.image) ? match.image : [];
    const videos = Array.isArray(match.video) ? match.video : [];

    const resolvedImages = await Promise.all(
      images.map(async (name) => (await findOssObjectUrlByBasename('image', name)) || name)
    );

    const resolvedVideos = await Promise.all(
      videos.map(async (name) => (await findOssObjectUrlByBasename('video', name)) || name)
    );

    return {
      ...match,
      image: resolvedImages,
      video: resolvedVideos
    };
  } catch (e) {
    if (e.status) throw e;
    const err = new Error(`获取活动详情失败: ${e && e.message ? e.message : '未知错误'}`);
    err.status = 500;
    err.cause = e;
    throw err;
  }
};

// 获取聚会主题列表
const getTopicListHandler = async () => {
  try {
    const list = readJsonDataFile('api/meetingData/topicList.json');
    return list;
  } catch (e) {
    const err = new Error(`获取聚会主题列表失败: ${e && e.message ? e.message : '未知错误'}`);
    err.status = e && e.status ? e.status : 500;
    err.cause = e;
    throw err;
  }
};

// 获取聚会主题详情
const getTopicDetailHandler = async () => {
  try {
    const detail = readJsonDataFile('api/meetingData/topicDetail.json');
    return detail;
  } catch (e) {
    const err = new Error(`获取聚会主题详情失败: ${e && e.message ? e.message : '未知错误'}`);
    err.status = e && e.status ? e.status : 500;
    err.cause = e;
    throw err;
  }
};


module.exports = {
  healthHandler,
  getContentHandler,
  getImagesHandler,
  searchImagesHandler,
  getActivityListHandler,
  getActivityDetailHandler,
  getTopicListHandler,
  getTopicDetailHandler
};