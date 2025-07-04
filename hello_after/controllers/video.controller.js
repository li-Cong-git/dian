const videoService = require('../services/video.service');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 确保上传目录存在
const videoUploadDir = path.join(__dirname, '..', 'uploads', 'videos');
const thumbnailUploadDir = path.join(__dirname, '..', 'uploads', 'thumbnails');

if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

if (!fs.existsSync(thumbnailUploadDir)) {
  fs.mkdirSync(thumbnailUploadDir, { recursive: true });
}

/**
 * 视频控制器
 */
class VideoController {
  /**
   * 获取商家视频列表
   */
  async getMerchantVideos(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const merchantId = req.user.id;
      
      const options = {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        sort: { createdAt: -1 }
      };
      
      const query = { merchantId };
      if (status) {
        query.status = status;
      }
      
      const result = await videoService.getVideos(query, options);
      
      return res.json({
        code: 0,
        message: '获取视频列表成功',
        data: result.videos,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('获取商家视频列表失败:', error);
      return res.status(500).json({
        code: 500,
        message: '获取视频列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取视频详情
   */
  async getVideoDetail(req, res) {
    try {
      const { id } = req.params;
      
      const video = await videoService.getVideoById(id);
      
      return res.json({
        code: 0,
        message: '获取视频详情成功',
        data: video
      });
    } catch (error) {
      console.error('获取视频详情失败:', error);
      return res.status(404).json({
        code: 404,
        message: '获取视频详情失败',
        error: error.message
      });
    }
  }
  
  /**
   * 上传视频
   */
  async uploadVideo(req, res) {
    try {
      const { title, description, tags } = req.body;
      const productIds = req.body.productIds ? JSON.parse(req.body.productIds) : [];
      const merchantId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: '请上传视频文件'
        });
      }
      
      const videoFile = req.file;
      
      // 生成唯一文件名
      const fileName = `${uuidv4()}_${Date.now()}${path.extname(videoFile.originalname)}`;
      const videoPath = path.join(videoUploadDir, fileName);
      
      // 写入文件
      fs.writeFileSync(videoPath, videoFile.buffer);
      
      // 视频URL
      const videoUrl = `/uploads/videos/${fileName}`;
      
      // 创建视频记录
      const videoData = {
        title,
        description,
        videoUrl,
        fileName,
        thumbnailUrl: '', // 稍后处理缩略图
        merchantId,
        productIds,
        tags: tags ? JSON.parse(tags) : [],
        status: 'published'
      };
      
      const video = await videoService.createVideo(videoData);
      
      return res.json({
        code: 0,
        message: '视频上传成功',
        data: video
      });
    } catch (error) {
      console.error('上传视频失败:', error);
      return res.status(500).json({
        code: 500,
        message: '上传视频失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新视频信息
   */
  async updateVideo(req, res) {
    try {
      const { id } = req.params;
      const { title, description, productIds, tags, status } = req.body;
      const merchantId = req.user.id;
      
      // 验证视频所有权
      const existingVideo = await videoService.getVideoById(id);
      
      if (existingVideo.merchantId.toString() !== merchantId) {
        return res.status(403).json({
          code: 403,
          message: '无权更新此视频'
        });
      }
      
      // 准备更新数据
      const updateData = {};
      
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (productIds) updateData.productIds = JSON.parse(productIds);
      if (tags) updateData.tags = JSON.parse(tags);
      if (status) updateData.status = status;
      
      // 上传缩略图
      if (req.file) {
        const thumbnailFile = req.file;
        const fileName = `${uuidv4()}_${Date.now()}${path.extname(thumbnailFile.originalname)}`;
        const thumbnailPath = path.join(thumbnailUploadDir, fileName);
        
        // 写入文件
        fs.writeFileSync(thumbnailPath, thumbnailFile.buffer);
        
        updateData.thumbnailUrl = `/uploads/thumbnails/${fileName}`;
      }
      
      // 更新视频
      const video = await videoService.updateVideo(id, updateData);
      
      return res.json({
        code: 0,
        message: '更新视频成功',
        data: video
      });
    } catch (error) {
      console.error('更新视频失败:', error);
      return res.status(500).json({
        code: 500,
        message: '更新视频失败',
        error: error.message
      });
    }
  }
  
  /**
   * 删除视频
   */
  async deleteVideo(req, res) {
    try {
      const { id } = req.params;
      const merchantId = req.user.id;
      
      await videoService.deleteVideo(id, merchantId);
      
      return res.json({
        code: 0,
        message: '视频删除成功'
      });
    } catch (error) {
      console.error('删除视频失败:', error);
      return res.status(500).json({
        code: 500,
        message: '删除视频失败',
        error: error.message
      });
    }
  }
  
  /**
   * 搜索视频
   */
  async searchVideos(req, res) {
    try {
      const { keyword, page = 1, limit = 10 } = req.query;
      
      if (!keyword) {
        return res.status(400).json({
          code: 400,
          message: '请提供搜索关键词'
        });
      }
      
      const options = {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        sort: { views: -1, createdAt: -1 } // 按浏览量和创建时间排序
      };
      
      const result = await videoService.searchVideos(keyword, options);
      
      return res.json({
        code: 0,
        message: '搜索视频成功',
        data: result.videos,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('搜索视频失败:', error);
      return res.status(500).json({
        code: 500,
        message: '搜索视频失败',
        error: error.message
      });
    }
  }
}

module.exports = new VideoController(); 