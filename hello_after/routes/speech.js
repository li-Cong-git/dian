/**
 * 语音相关路由
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// 导入控制器（稍后会创建）
const speechController = require('../controllers/speech.controller');

// 确保上传目录存在
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'audio-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB最大限制
  },
  fileFilter: function (req, file, cb) {
    // 接受的音频文件类型
    const allowedTypes = [
      'audio/wav', 'audio/x-wav', 
      'audio/mp3', 'audio/mpeg',
      'audio/pcm', 'audio/l16'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。仅支持WAV、MP3和PCM格式。'));
    }
  }
});

// 语音识别并调用Coze工作流
router.post('/recognize', upload.single('audio'), speechController.speechToCoze);

// 文本转语音
router.post('/synthesize', speechController.textToSpeech);

// Coze输出转语音
router.post('/coze-to-speech', speechController.cozeToSpeech);

// 获取音频文件
router.get('/audio/:fileName', speechController.getAudioFile);

module.exports = router; 