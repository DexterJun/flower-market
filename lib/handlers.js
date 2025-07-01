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

// 获取图片列表处理器
const getImagesHandler = async (params = {}) => {
  const { page = 1, pageSize = 20, marker } = params;

  try {
    const ossClient = createOssClient();

    const result = await ossClient.list({
      'max-keys': pageSize,
      marker: marker,
      prefix: 'hymn-image/',
      delimiter: '/'
    });

    if (!result.objects) {
      return {
        images: [],
        pagination: {
          current: page,
          pageSize,
          total: 0,
          hasMore: false,
          nextMarker: null
        }
      };
    }

    const catalog = getCatalogData();

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

    const pagination = {
      current: page,
      pageSize,
      total: result.isTruncated ? -1 : (page - 1) * pageSize + images.length,
      hasMore: result.isTruncated,
      nextMarker: result.nextMarker || null
    };

    return {
      images,
      pagination
    };
  } catch (error) {
    throw new Error('获取图片列表失败');
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
        prefix: 'hymn-image/',
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

// 获取诗歌详情处理器
const getHymnDetailHandler = async (params = {}) => {
  const { id, fast = false } = params; // 添加fast参数，用于跳过耗时的视频查询

  if (!id) {
    throw new Error('缺少 id 参数');
  }

  try {
    const catalog = getCatalogData();
    const catalogItem = catalog.find(item => item.id === id);

    if (!catalogItem) {
      const error = new Error('未找到指定的诗歌');
      error.status = 404;
      throw error;
    }

    // 创建响应数据对象，先复制基本信息
    const responseData = {
      id: catalogItem.id,
      filename: catalogItem.filename,
      index: catalogItem.index,
      type: catalogItem.type,
      tag: catalogItem.tag,
      url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/hymn-image/${catalogItem.index}.${catalogItem.filename}.${catalogItem.type}`,
      detail: {} // 先创建空的detail对象，避免直接引用原始数据
    };

    // 复制原始detail数据到responseData.detail
    if (catalogItem.detail) {
      responseData.detail = { ...catalogItem.detail };
    }

    // 如果启用快速模式或在生产环境，跳过视频文件查询
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const skipVideoQuery = fast || isProduction;

    console.log('🔍 DEBUG getHymnDetailHandler:');
    console.log('  - fast:', fast);
    console.log('  - isProduction:', isProduction);
    console.log('  - skipVideoQuery:', skipVideoQuery);
    console.log('  - OSS_BUCKET:', process.env.OSS_BUCKET);
    console.log('  - OSS_REGION:', process.env.OSS_REGION);

    // 处理新的events数据结构 - 保持原有格式，只添加video_urls字段
    if (catalogItem.detail && catalogItem.detail.events) {
      console.log('🔍 DEBUG: 处理events数据，原始events:', catalogItem.detail.events);
      const processedEvents = [];

      for (const event of catalogItem.detail.events) {
        const processedEvent = { ...event };

        if (event.videos && Array.isArray(event.videos)) {
          // 保持原有的videos数组不变
          processedEvent.videos = [...event.videos];

          // 无论什么情况，都要添加video_urls字段
          console.log('🔍 DEBUG: 处理视频URLs，videos:', event.videos);
          processedEvent.video_urls = event.videos.map(videoName => {
            // 检查视频文件名是否已经包含扩展名，避免重复添加
            const hasExtension = videoName.includes('.mp4') || videoName.includes('.mov') || videoName.includes('.avi');
            const url = hasExtension
              ? `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/video/${videoName}`
              : `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/video/${videoName}.mp4`;
            console.log(`  - 生成URL: ${videoName} -> ${url}`);
            return url;
          });
          console.log('🔍 DEBUG: 最终video_urls:', processedEvent.video_urls);
        }

        processedEvents.push(processedEvent);
      }

      responseData.detail = {
        ...responseData.detail,
        events: processedEvents
      };
    }

    // 兼容旧的video_file结构（向后兼容）
    if (!skipVideoQuery && catalogItem.detail && catalogItem.detail.video_file) {
      // 视频文件查询逻辑（仅在开发环境或明确要求时执行）
      try {
        const ossClient = createOssClient();
        const videoFileName = catalogItem.detail.video_file;

        // 优先检查常见格式，减少查询次数
        const videoExtensions = ['mp4', 'mov']; // 只检查最常见的格式
        let videoUrl = null;

        // 使用Promise.allSettled进行并发查询，设置超时
        const checkPromises = videoExtensions.map(async (ext) => {
          const videoPath = `video/${videoFileName}.${ext}`;
          try {
            // 设置较短的超时时间
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 2000); // 缩短到2秒超时
            });

            const headPromise = ossClient.head(videoPath);
            await Promise.race([headPromise, timeoutPromise]);

            return {
              success: true,
              url: `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${videoPath}`,
              extension: ext
            };
          } catch (error) {
            return { success: false, extension: ext };
          }
        });

        const results = await Promise.allSettled(checkPromises);

        // 找到第一个成功的结果
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.success) {
            videoUrl = result.value.url;
            break;
          }
        }

        responseData.detail = {
          ...responseData.detail,
          video_file: videoUrl || catalogItem.detail.video_file
        };

      } catch (error) {
        console.error('查询视频文件失败:', error);
        // 即使视频查询失败，也继续返回其他数据
        responseData.detail = {
          ...responseData.detail,
          video_file: catalogItem.detail.video_file // 保留原始值
        };
      }
    } else if (catalogItem.detail && catalogItem.detail.video_file) {
      // 生产环境或快速模式：直接构造视频URL，不进行存在性检查
      const videoFileName = catalogItem.detail.video_file;
      const assumedVideoUrl = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/video/${videoFileName}.mp4`;

      responseData.detail = {
        ...responseData.detail,
        video_file: assumedVideoUrl,
        video_file_note: '生产环境快速模式，未验证文件存在性'
      };
    }

    // 最后处理音频文件 - 将audio字段从文件名转换为完整的阿里云链接
    if (responseData.detail && responseData.detail.audio) {
      const audioFileName = responseData.detail.audio;
      const audioUrl = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/audio/${audioFileName}`;

      responseData.detail.audio = audioUrl;

      console.log('🔍 DEBUG: 处理音频文件，原始文件名:', audioFileName, '-> 完整URL:', audioUrl);
    } else {
      console.log('🔍 DEBUG: 没有找到音频文件，responseData.detail:', responseData.detail);
    }

    return {
      success: true,
      data: responseData,
      fast_mode: skipVideoQuery
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  healthHandler,
  getContentHandler,
  getImagesHandler,
  searchImagesHandler,
  getHymnDetailHandler
};