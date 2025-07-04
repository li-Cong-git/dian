const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/video.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// 配置 multer 处理文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB 限制
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 只接受视频和图片文件
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅接受视频或图片文件'));
    }
  }
});

/**
 * @route GET /api/videos/merchant
 * @desc 获取当前商家的视频列表
 * @access 私有 (商家)
 */
router.get('/merchant', authMiddleware(['merchant']), videoController.getMerchantVideos);

/**
 * @route GET /api/videos/search
 * @desc 搜索视频
 * @access 公共
 */
router.get('/search', videoController.searchVideos);

/**
 * @route GET /api/videos/:id
 * @desc 获取视频详情
 * @access 公共
 */
router.get('/:id', videoController.getVideoDetail);

/**
 * @route POST /api/videos
 * @desc 上传新视频
 * @access 私有 (商家)
 */
router.post('/', authMiddleware(['merchant']), upload.single('video'), videoController.uploadVideo);

/**
 * @route PUT /api/videos/:id
 * @desc 更新视频信息
 * @access 私有 (商家)
 */
router.put('/:id', authMiddleware(['merchant']), upload.single('thumbnail'), videoController.updateVideo);

/**
 * @route DELETE /api/videos/:id
 * @desc 删除视频
 * @access 私有 (商家)
 */
router.delete('/:id', authMiddleware(['merchant']), videoController.deleteVideo);

module.exports = router; 