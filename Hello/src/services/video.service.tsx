import { API_BASE_URL } from '../config/env';
import { apiPost, apiGet, apiPut, apiDelete } from '../utils/apiUtils';

/**
 * 视频服务类
 */
class VideoService {
  /**
   * 获取商家的视频列表
   * @param params 查询参数
   * @returns 视频列表
   */
  async getMerchantVideos(params: { page?: number; limit?: number; status?: string; }) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      
      const url = `${API_BASE_URL}/videos/merchant?${queryParams.toString()}`;
      const response = await apiGet(url);
      
      return response;
    } catch (error) {
      console.error('获取视频列表失败', error);
      throw error;
    }
  }
  
  /**
   * 获取视频详情
   * @param videoId 视频ID
   * @returns 视频详情
   */
  async getVideoById(videoId: string) {
    try {
      const url = `${API_BASE_URL}/videos/${videoId}`;
      const response = await apiGet(url);
      
      return response;
    } catch (error) {
      console.error('获取视频详情失败', error);
      throw error;
    }
  }
  
  /**
   * 上传视频
   * @param videoData 视频数据
   * @returns 上传结果
   */
  async uploadVideo(videoData: FormData, onProgress?: (progress: number) => void) {
    try {
      const url = `${API_BASE_URL}/videos`;
      const response = await apiPost(url, videoData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      
      return response;
    } catch (error) {
      console.error('上传视频失败', error);
      throw error;
    }
  }
  
  /**
   * 更新视频信息
   * @param videoId 视频ID
   * @param updateData 更新数据
   * @returns 更新结果
   */
  async updateVideo(videoId: string, updateData: FormData) {
    try {
      const url = `${API_BASE_URL}/videos/${videoId}`;
      const response = await apiPut(url, updateData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      console.error('更新视频失败', error);
      throw error;
    }
  }
  
  /**
   * 删除视频
   * @param videoId 视频ID
   * @returns 删除结果
   */
  async deleteVideo(videoId: string) {
    try {
      const url = `${API_BASE_URL}/videos/${videoId}`;
      const response = await apiDelete(url);
      
      return response;
    } catch (error) {
      console.error('删除视频失败', error);
      throw error;
    }
  }
  
  /**
   * 搜索视频
   * @param keyword 关键词
   * @param params 查询参数
   * @returns 搜索结果
   */
  async searchVideos(keyword: string, params: { page?: number; limit?: number; }) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('keyword', keyword);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `${API_BASE_URL}/videos/search?${queryParams.toString()}`;
      const response = await apiGet(url);
      
      return response;
    } catch (error) {
      console.error('搜索视频失败', error);
      throw error;
    }
  }
}

export default new VideoService(); 