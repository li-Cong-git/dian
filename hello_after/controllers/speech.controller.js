/**
 * 语音控制器
 * 处理语音识别和语音合成的API请求
 */
const path = require('path');
const fs = require('fs');
const xfyunService = require('../services/xfyun.service');
const cozeService = require('../services/coze.service');

// 上传目录配置
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');
const OUTPUT_DIR = path.join(UPLOAD_DIR, 'output');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 语音识别并调用Coze工作流
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.speechToCoze = async (req, res) => {
  try {
    console.log('接收到语音识别请求');
    
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传音频文件'
      });
    }

    const audioFile = req.file.path;
    console.log('音频文件路径:', audioFile);

    // 调用讯飞API进行语音识别
    const recognizedText = await xfyunService.speechToText(audioFile);
    console.log('识别结果:', recognizedText);

    if (!recognizedText || recognizedText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '语音识别结果为空'
      });
    }

    // 调用Coze工作流处理识别出的文本
    const cozeResult = await cozeService.executeWorkflow({
      userQuery: recognizedText
    });

    // 返回结果
    res.json({
      success: true,
      recognizedText,
      cozeResponse: cozeResult
    });
  } catch (error) {
    console.error('语音识别处理失败:', error);
    res.status(500).json({
      success: false,
      message: '语音识别处理失败',
      error: error.message
    });
  }
};

/**
 * 文本转语音
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.textToSpeech = async (req, res) => {
  try {
    console.log('接收到语音合成请求');
    
    const { text, options } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '合成文本不能为空'
      });
    }

    // 调用讯飞API进行语音合成
    const audioData = await xfyunService.textToSpeech(text, options);
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const audioFormat = (options && options.audioFormat) || 'wav';
    const fileName = `tts_${timestamp}.${audioFormat}`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    // 保存音频文件
    const savedFilePath = await xfyunService.saveAudioToFile(audioData, filePath);
    
    // 构建访问URL
    const fileUrl = `/api/v1/speech/audio/${fileName}`;
    
    // 返回结果
    res.json({
      success: true,
      message: '语音合成成功',
      audioUrl: fileUrl,
      text
    });
  } catch (error) {
    console.error('语音合成处理失败:', error);
    res.status(500).json({
      success: false,
      message: '语音合成处理失败',
      error: error.message
    });
  }
};

/**
 * 流式返回音频文件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getAudioFile = async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '音频文件不存在'
      });
    }
    
    // 设置内容类型
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'audio/wav';
    
    if (ext === '.mp3') {
      contentType = 'audio/mpeg';
    } else if (ext === '.pcm') {
      contentType = 'audio/l16';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    // 流式返回文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('获取音频文件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取音频文件失败',
      error: error.message
    });
  }
};

/**
 * Coze工作流输出转语音
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.cozeToSpeech = async (req, res) => {
  try {
    console.log('接收到Coze输出转语音请求');
    
    const { cozeOutput, options } = req.body;
    
    if (!cozeOutput || typeof cozeOutput !== 'object' && typeof cozeOutput !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Coze输出数据无效'
      });
    }

    // 从Coze输出中提取文本
    let textToSynthesize = '';
    
    // 根据Coze工作流的输出格式提取文本
    // 处理新的Coze API响应格式
    if (cozeOutput.message && cozeOutput.message.content) {
      // 新的Coze API格式 - 处理可能的数组内容
      const content = cozeOutput.message.content;
      if (Array.isArray(content)) {
        // 处理内容数组
        textToSynthesize = content
          .filter(item => item.type === 'text' && item.text)
          .map(item => item.text)
          .join('\n');
      } else if (typeof content === 'string') {
        textToSynthesize = content;
      }
    } 
    // 处理旧的格式
    else if (cozeOutput.result) {
      textToSynthesize = cozeOutput.result;
    } else if (cozeOutput.output) {
      textToSynthesize = cozeOutput.output;
    } else if (cozeOutput.data && cozeOutput.data.output) {
      textToSynthesize = cozeOutput.data.output;
    } else if (typeof cozeOutput === 'string') {
      textToSynthesize = cozeOutput;
    } else {
      textToSynthesize = JSON.stringify(cozeOutput);
    }
    
    if (!textToSynthesize || textToSynthesize.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '无法从Coze输出中提取文本'
      });
    }

    // 调用讯飞API进行语音合成
    const audioData = await xfyunService.textToSpeech(textToSynthesize, options);
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const audioFormat = (options && options.audioFormat) || 'wav';
    const fileName = `coze_tts_${timestamp}.${audioFormat}`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    // 保存音频文件
    const savedFilePath = await xfyunService.saveAudioToFile(audioData, filePath);
    
    // 构建访问URL
    const fileUrl = `/api/v1/speech/audio/${fileName}`;
    
    // 返回结果
    res.json({
      success: true,
      message: 'Coze输出语音合成成功',
      audioUrl: fileUrl,
      text: textToSynthesize
    });
  } catch (error) {
    console.error('Coze输出语音合成处理失败:', error);
    res.status(500).json({
      success: false,
      message: 'Coze输出语音合成处理失败',
      error: error.message
    });
  }
}; 