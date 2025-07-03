/**
 * 讯飞语音API服务
 * 提供语音识别(ASR)和语音合成(TTS)功能
 */
const crypto = require('crypto-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 导入讯飞配置
const XFYUN_CONFIG = require('../config/xfyun.config');

/**
 * 生成讯飞API请求需要的认证信息
 * @param {string} apiSecret - API密钥
 * @param {string} method - 请求方法，如'POST'
 * @param {string} url - 请求URL
 * @param {Date} date - 请求时间
 * @param {Object} params - 请求参数
 * @returns {Object} 认证信息
 */
function generateAuthInfo(apiSecret, method, url, date, params = {}) {
  const urlObj = new URL(url);
  const hostDomain = urlObj.host;
  const requestUri = urlObj.pathname;
  
  // 生成RFC1123格式的时间戳
  const timestamp = date.toUTCString();
  
  // 构建待签名字符串
  const signatureOrigin = `host: ${hostDomain}\ndate: ${timestamp}\n${method} ${requestUri} HTTP/1.1`;
  
  // 使用HMAC-SHA256进行签名
  const signature = crypto.enc.Base64.stringify(
    crypto.HmacSHA256(signatureOrigin, apiSecret)
  );

  // 构建认证字符串
  return {
    date: timestamp,
    authorization: `api_key="${XFYUN_CONFIG.API_KEY}",algorithm="hmac-sha256",headers="host date request-line",signature="${signature}"`
  };
}

/**
 * 语音识别(ASR)服务
 * @param {Buffer|string} audioData - 音频数据Buffer或音频文件路径
 * @param {Object} options - 识别选项
 * @returns {Promise<string>} 识别结果文本
 */
exports.speechToText = async (audioData, options = {}) => {
  try {
    console.log('开始语音识别处理...');
    
    // 如果是文件路径，则读取文件
    if (typeof audioData === 'string') {
      audioData = fs.readFileSync(audioData);
    }
    
    // 使用配置中的设置
    const audioFormat = options.audioFormat || XFYUN_CONFIG.ASR_CONFIG.audio_encode === 'raw' ? 'audio/L16;rate=16000' : 'audio/mpeg';
    const engineType = 'iat';
    const accent = options.accent || XFYUN_CONFIG.ASR_CONFIG.accent;
    
    // 准备请求参数
    const url = XFYUN_CONFIG.ASR_API_URL;
    const date = new Date();
    const method = 'POST';
    
    // 生成认证信息
    const authInfo = generateAuthInfo(XFYUN_CONFIG.API_SECRET, method, url, date);
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json,version=1.0',
      'Host': new URL(url).host,
      'Date': authInfo.date,
      'Authorization': authInfo.authorization,
    };
    
    // 准备请求数据
    const requestData = {
      common: {
        app_id: XFYUN_CONFIG.APP_ID,
      },
      business: {
        language: XFYUN_CONFIG.ASR_CONFIG.language,
        domain: 'iat',
        accent: accent,
        vad_eos: XFYUN_CONFIG.ASR_CONFIG.vad_eos,
        dwa: 'wpgs',
        punctuation: XFYUN_CONFIG.ASR_CONFIG.punctuation,
      },
      data: {
        status: 2, // 2表示最后一帧音频
        format: audioFormat,
        encoding: 'raw',
        audio: audioData.toString('base64'),
      },
    };
    
    console.log('发送语音识别请求...');
    
    // 发送请求
    const response = await axios.post(url, requestData, { headers });
    
    // 处理响应
    if (response.data && response.data.code === 0) {
      // 解析识别结果
      let result = '';
      if (response.data.data && response.data.data.result) {
        response.data.data.result.ws.forEach(ws => {
          ws.cw.forEach(cw => {
            result += cw.w;
          });
        });
      }
      
      console.log('语音识别成功!');
      return result;
    } else {
      throw new Error(`语音识别失败: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('语音识别出错:', error);
    throw new Error(`语音识别处理失败: ${error.message}`);
  }
};

/**
 * 语音合成(TTS)服务
 * @param {string} text - 要合成的文本
 * @param {Object} options - 合成选项
 * @returns {Promise<Buffer>} 合成的音频数据
 */
exports.textToSpeech = async (text, options = {}) => {
  try {
    console.log('开始语音合成处理...');
    
    if (!text || text.trim() === '') {
      throw new Error('合成文本不能为空');
    }
    
    // 使用配置中的设置
    const audioFormat = options.audioFormat || XFYUN_CONFIG.TTS_CONFIG.audio_format;
    const voiceName = options.voiceName || XFYUN_CONFIG.TTS_CONFIG.DEFAULT_VOICE;
    const speed = options.speed !== undefined ? options.speed : XFYUN_CONFIG.TTS_CONFIG.speed;
    const volume = options.volume !== undefined ? options.volume : XFYUN_CONFIG.TTS_CONFIG.volume;
    const pitch = options.pitch !== undefined ? options.pitch : XFYUN_CONFIG.TTS_CONFIG.pitch;
    
    // 准备请求参数
    const url = XFYUN_CONFIG.TTS_API_URL;
    const date = new Date();
    const method = 'POST';
    
    // 生成认证信息
    const authInfo = generateAuthInfo(XFYUN_CONFIG.API_SECRET, method, url, date);
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json,version=1.0',
      'Host': new URL(url).host,
      'Date': authInfo.date,
      'Authorization': authInfo.authorization,
    };
    
    // 准备请求数据
    const requestData = {
      common: {
        app_id: XFYUN_CONFIG.APP_ID,
      },
      business: {
        aue: XFYUN_CONFIG.TTS_CONFIG.aue,
        sfl: 1,
        auf: 'audio/L16;rate=' + XFYUN_CONFIG.TTS_CONFIG.sample_rate,
        vcn: voiceName,
        speed,
        volume,
        pitch,
        bgs: 0,
        tte: 'UTF8',
      },
      data: {
        text: Buffer.from(text).toString('base64'),
        status: 2, // 2表示最后一帧
      },
    };
    
    console.log('发送语音合成请求...');
    
    // 发送请求
    const response = await axios.post(url, requestData, { 
      headers,
      responseType: 'arraybuffer' 
    });
    
    // 检查是否是JSON错误响应
    try {
      const errorData = JSON.parse(response.data.toString());
      if (errorData.code !== 0) {
        throw new Error(`语音合成失败: ${errorData.message}`);
      }
    } catch (e) {
      // 不是JSON，继续处理二进制响应
    }
    
    console.log('语音合成成功!');
    
    // 返回音频数据
    return Buffer.from(response.data);
  } catch (error) {
    console.error('语音合成出错:', error);
    throw new Error(`语音合成处理失败: ${error.message}`);
  }
};

/**
 * 保存音频数据到文件
 * @param {Buffer} audioData - 音频数据
 * @param {string} filePath - 保存路径
 * @returns {Promise<string>} 文件完整路径
 */
exports.saveAudioToFile = (audioData, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入文件
      fs.writeFile(filePath, audioData, (err) => {
        if (err) {
          console.error('保存音频文件失败:', err);
          reject(err);
        } else {
          console.log('音频文件已保存:', filePath);
          resolve(filePath);
        }
      });
    } catch (error) {
      console.error('保存音频文件出错:', error);
      reject(error);
    }
  });
}; 