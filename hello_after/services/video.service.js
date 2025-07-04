const Video = require('../database/Video');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

/**
 * 视频服务类
 */
class VideoService {
  /**
   * 创建新视频
   * @param {Object} videoData - 视频数据
   * @returns {Promise<Object>} - 创建的视频对象
   */
  async createVideo(videoData) {
    try {
      const video = new Video(videoData);
      return await video.save();
    } catch (error) {
      console.error('创建视频失败:', error);
      throw error;
    }
  }

  /**
   * 获取视频列表
   * @param {Object} query - 查询条件
   * @param {Object} options - 分页排序选项
   * @returns {Promise<Array>} - 视频列表
   */
  async getVideos(query = {}, options = {}) {
    try {
      const { limit = 20, skip = 0, sort = { createdAt: -1 } } = options;
      
      // 默认只返回已发布的视频
      if (!query.status) {
        query.status = 'published';
      }
      
      const videos = await Video.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('merchantId', 'shopName logo')
        .populate('productIds', 'name price images');
      
      const total = await Video.countDocuments(query);
      
      return { videos, total };
    } catch (error) {
      console.error('获取视频列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取商家视频列表
   * @param {string} merchantId - 商家ID
   * @param {Object} options - 分页排序选项
   * @returns {Promise<Array>} - 视频列表
   */
  async getMerchantVideos(merchantId, options = {}) {
    try {
      return await this.getVideos({ merchantId }, options);
    } catch (error) {
      console.error('获取商家视频列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取视频
   * @param {string} videoId - 视频ID
   * @returns {Promise<Object>} - 视频对象
   */
  async getVideoById(videoId) {
    try {
      const video = await Video.findById(videoId)
        .populate('merchantId', 'shopName logo')
        .populate('productIds', 'name price images');
      
      if (!video) {
        throw new Error('视频不存在');
      }
      
      // 增加浏览次数
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
      
      return video;
    } catch (error) {
      console.error('获取视频详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新视频信息
   * @param {string} videoId - 视频ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新后的视频对象
   */
  async updateVideo(videoId, updateData) {
    try {
      const video = await Video.findByIdAndUpdate(
        videoId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!video) {
        throw new Error('视频不存在');
      }
      
      return video;
    } catch (error) {
      console.error('更新视频失败:', error);
      throw error;
    }
  }

  /**
   * 删除视频
   * @param {string} videoId - 视频ID
   * @param {string} merchantId - 商家ID (用于验证权限)
   * @returns {Promise<boolean>} - 是否删除成功
   */
  async deleteVideo(videoId, merchantId) {
    try {
      // 查找视频并验证商家
      const video = await Video.findOne({ _id: videoId, merchantId });
      
      if (!video) {
        throw new Error('视频不存在或无权删除');
      }
      
      // 删除存储的视频文件
      if (video.videoUrl) {
        try {
          const filePath = path.join(__dirname, '..', 'uploads', 'videos', path.basename(video.videoUrl));
          await unlinkAsync(filePath);
        } catch (fileError) {
          console.warn('删除视频文件失败:', fileError.message);
          // 继续删除数据库记录
        }
      }
      
      // 删除存储的缩略图
      if (video.thumbnailUrl) {
        try {
          const thumbnailPath = path.join(__dirname, '..', 'uploads', 'thumbnails', path.basename(video.thumbnailUrl));
          await unlinkAsync(thumbnailPath);
        } catch (thumbError) {
          console.warn('删除缩略图失败:', thumbError.message);
          // 继续删除数据库记录
        }
      }
      
      // 从数据库中删除视频记录
      await Video.findByIdAndDelete(videoId);
      
      return true;
    } catch (error) {
      console.error('删除视频失败:', error);
      throw error;
    }
  }

  /**
   * 搜索视频
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 分页排序选项
   * @returns {Promise<Array>} - 视频列表
   */
  async searchVideos(keyword, options = {}) {
    try {
      const query = {
        status: 'published',
        $or: [
          { title: new RegExp(keyword, 'i') },
          { description: new RegExp(keyword, 'i') },
          { tags: { $in: [new RegExp(keyword, 'i')] } }
        ]
      };
      
      return await this.getVideos(query, options);
    } catch (error) {
      console.error('搜索视频失败:', error);
      throw error;
    }
  }
}

module.exports = new VideoService(); 