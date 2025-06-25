const API_BASE_URL = 'http://localhost:3000/api';

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

      const response = await fetch(`${API_BASE_URL}/images/search?${params}`);
      if (!response.ok) throw new Error('Failed to search images');
      return await response.json();
    } catch (error) {
      console.error('Error searching images:', error);
      throw error;
    }
  }
}; 