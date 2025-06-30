// 根据环境自动切换API地址
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'  // 生产环境使用相对路径
  : 'http://localhost:3000/api';  // 开发环境使用本地服务器

export const imageApi = {
  // 获取所有图片（支持分页）
  getAllImages: async (page = 1, pageSize = 20, marker = null) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (marker) {
        params.append('marker', marker);
      }

      const response = await fetch(`${API_BASE_URL}/images?${params}`);
      if (!response.ok) throw new Error('Failed to fetch images');
      return await response.json();
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  },

  // 搜索图片（支持分页）
  searchImages: async (query, page = 1, pageSize = 20, marker = null) => {
    try {
      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (marker) {
        params.append('marker', marker);
      }

      // 根据环境使用不同的搜索路径
      const searchPath = process.env.NODE_ENV === 'production' ? '/search' : '/images/search';
      const fullUrl = `${API_BASE_URL}${searchPath}?${params}`;

      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('搜索请求失败:', errorText);
        throw new Error(`Failed to search images: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('Error searching images:', error);
      throw error;
    }
  },

  // 获取目录内容
  getContent: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getContent`);
      if (!response.ok) throw new Error('Failed to fetch content');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  },

  // 获取诗歌详情
  getHymnDetail: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hymn/detail/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch hymn detail: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching hymn detail:', error);
      throw error;
    }
  }
};