/**
 * 讯飞语音服务配置
 * 用于配置讯飞语音识别和合成相关参数
 */
require('dotenv').config();

// 讯飞语音服务配置
const XFYUN_CONFIG = {
  // 应用ID - 从环境变量获取，不再硬编码
  APP_ID: process.env.XFYUN_APP_ID,

  // API密钥 - 从环境变量获取，不再硬编码
  API_KEY: process.env.XFYUN_API_KEY,

  // API密钥 - 从环境变量获取，不再硬编码
  API_SECRET: process.env.XFYUN_API_SECRET,

  // 讯飞API地址
  API_BASE_URL: process.env.XFYUN_API_BASE_URL || 'http://api.xfyun.cn',

  // 语音听写接口地址(WebSocket)
  ASR_API_URL: process.env.XFYUN_ASR_API_URL || 'wss://iat-api.xfyun.cn/v2/iat',

  // 语音合成接口地址
  TTS_API_URL: process.env.XFYUN_TTS_API_URL || 'https://tts-api.xfyun.cn/v2/tts',

  // 请求超时时间(毫秒)
  TIMEOUT_MS: parseInt(process.env.XFYUN_TIMEOUT_MS) || 30000,

  // 语音听写(ASR)配置
  ASR_CONFIG: {
    // 音频编码, 可选值：raw (PCM), lame (MP3)
    audio_encode: process.env.XFYUN_AUDIO_ENCODE || 'lame',
    
    // 采样率, 可选值：8000, 16000
    sample_rate: parseInt(process.env.XFYUN_SAMPLE_RATE) || 16000,
    
    // 语言, 可选值：zh_cn(中文), en_us(英语)
    language: process.env.XFYUN_LANGUAGE || 'zh_cn',
    
    // 方言，可选值：mandarin(普通话)等
    accent: process.env.XFYUN_ACCENT || 'mandarin',
    
    // 是否开启标点符号
    vad_eos: parseInt(process.env.XFYUN_VAD_EOS) || 5000,
    
    // 是否需要标点符号
    punctuation: process.env.XFYUN_PUNCTUATION || 'on',
    
    // 字词级别时间戳, 可选值：on, off
    word_time_offset: process.env.XFYUN_WORD_TIME_OFFSET || 'off'
  },

  // 语音合成(TTS)配置
  TTS_CONFIG: {
    // 发音人列表
    VOICE_LIST: [
      { name: '讯飞小燕', code: 'xiaoyan' },
      { name: '讯飞许久', code: 'aisjiuxu' },
      { name: '讯飞小萍', code: 'aisxping' },
      { name: '讯飞小婧', code: 'aisjinger' }
    ],
    
    // 默认发音人
    DEFAULT_VOICE: process.env.XFYUN_DEFAULT_VOICE || 'xiaoyan',
    
    // 音频采样率, 可选值：8000, 16000
    sample_rate: parseInt(process.env.XFYUN_TTS_SAMPLE_RATE) || 16000,
    
    // 音频编码, 可选值：raw, lame, speex...
    aue: process.env.XFYUN_AUE || 'lame',
    
    // 语速, 可选值：[0-100]
    speed: parseInt(process.env.XFYUN_SPEED) || 50,
    
    // 音量, 可选值：[0-100]
    volume: parseInt(process.env.XFYUN_VOLUME) || 50,
    
    // 音高, 可选值：[0-100]
    pitch: parseInt(process.env.XFYUN_PITCH) || 50,
    
    // 音频格式, 可选值：mp3, wav, pcm
    audio_format: process.env.XFYUN_AUDIO_FORMAT || 'mp3'
  }
};

// 检查必要的配置是否存在
const validateConfig = () => {
  const requiredFields = ['APP_ID', 'API_KEY', 'API_SECRET'];
  const missingFields = requiredFields.filter(field => !XFYUN_CONFIG[field]);
  
  if (missingFields.length > 0) {
    console.warn(`讯飞语音服务配置警告: 缺少关键配置项 ${missingFields.join(', ')}。请在环境变量中提供这些值。`);
    
    // 在开发环境中，如果环境变量不存在，提供警告信息
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`请创建或更新.env文件，添加以下变量:
XFYUN_APP_ID=您的应用ID
XFYUN_API_KEY=您的API_KEY
XFYUN_API_SECRET=您的API_SECRET`);
    }
  }
};

// 在非生产环境下验证配置
if (process.env.NODE_ENV !== 'production') {
  validateConfig();
}

module.exports = XFYUN_CONFIG; 