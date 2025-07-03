/**
 * VoiceAssistant.tsx
 * React Native语音助手组件，支持语音输入和语音输出
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Alert
} from 'react-native';
// @ts-ignore
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
// @ts-ignore
import { Audio } from 'expo-av';
// @ts-ignore
import * as FileSystem from 'expo-file-system';
// @ts-ignore
import { FontAwesome } from '@expo/vector-icons';
import { apiClient, API_PATHS } from '../services/api';
// 导入API工具函数
import { extractCozeResponseText, formatApiError } from '../utils/apiUtils';
// 导入环境配置
import env from '../config/env';

// 创建音频录制播放实例
const audioRecorderPlayer = new AudioRecorderPlayer();

// 使用导入的环境配置
const BASE_URL = env.apiBaseUrl; // 使用环境配置的API基础URL

// 定义消息类型
interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

// 定义组件属性类型
interface VoiceAssistantProps {
  // 可以添加组件属性
}

/**
 * 语音助手组件
 * @returns {React.ReactElement} - 语音助手组件
 */
const VoiceAssistant: React.FC<VoiceAssistantProps> = () => {
  // 状态
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<string>('00:00');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // 初始化
  useEffect(() => {
    // 请求音频录制权限
    requestPermission();

    // 组件卸载时停止录音和播放
    return () => {
      stopRecording();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  /**
   * 请求麦克风权限
   */
  const requestPermission = async (): Promise<void> => {
    try {
      const granted = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('需要麦克风权限才能使用语音助手');
      }
    } catch (err) {
      console.error('权限请求错误:', err);
      setError('无法获取麦克风权限');
    }
  };

  /**
   * 开始录音
   */
  const startRecording = async (): Promise<void> => {
    try {
      // 清除错误
      setError(null);
      
      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // 准备录音文件路径
      const path = FileSystem.documentDirectory + 'recording.wav';
      
      // 开始录音
      await audioRecorderPlayer.startRecorder(path);
      
      // 设置录音状态
      setIsRecording(true);

      // 监听录音进度
      audioRecorderPlayer.addRecordBackListener((e: any) => {
        const time = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        setRecordTime(time.substring(0, 5));
      });
      
      // 添加用户消息提示开始录音
      addMessage('system', '开始录音，请说话...');
      
    } catch (err: any) {
      console.error('开始录音错误:', err);
      setError(`录音失败: ${err.message}`);
    }
  };

  /**
   * 停止录音
   */
  const stopRecording = async (): Promise<void> => {
    try {
      if (!isRecording) return;
      
      // 停止录音
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      
      // 更新状态
      setIsRecording(false);
      
      console.log('录音已保存:', result);
      addMessage('system', '录音已完成，处理中...');
      
      // 处理录音
      await processAudio(result);
      
    } catch (err: any) {
      console.error('停止录音错误:', err);
      setError(`停止录音失败: ${err.message}`);
    }
  };

  /**
   * 处理音频
   * @param {string} audioUri - 音频文件URI
   */
  const processAudio = async (audioUri: string): Promise<void> => {
    try {
      // 设置处理状态
      setIsProcessing(true);
      
      // 准备上传数据
      const formData = new FormData();
      
      // 获取文件名
      const uriParts = audioUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // 添加音频文件
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: fileName
      } as any);
      
          // 发送请求
    console.log('发送语音识别请求...');
    const response = await fetch(`${BASE_URL}${API_PATHS.SPEECH.RECOGNIZE}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '语音识别失败');
      }
      
      console.log('语音识别响应:', data);
      
      // 处理识别结果
      if (data.recognizedText) {
        // 添加用户消息
        addMessage('user', data.recognizedText);
        
        // 处理Coze响应
        if (data.cozeResponse) {
          await handleCozeResponse(data.cozeResponse);
        }
      } else {
        setError('未能识别语音内容');
      }
      
    } catch (err: any) {
      console.error('处理音频错误:', err);
      setError(formatApiError(err));
    } finally {
      // 关闭处理状态
      setIsProcessing(false);
    }
  };

  /**
   * 处理Coze响应
   * @param {Object|string} cozeResponse - Coze响应
   */
  const handleCozeResponse = async (cozeResponse: any): Promise<void> => {
    try {
      // 使用工具函数提取响应文本
      const responseText = extractCozeResponseText(cozeResponse);
      
      // 添加AI响应消息
      if (responseText) {
        addMessage('ai', responseText);
        setAiResponse(responseText);
        
        // 合成语音
        await synthesizeSpeech(responseText);
      } else {
        setError('未能获取有效的AI响应');
      }
    } catch (err: any) {
      console.error('处理Coze响应错误:', err);
      setError(formatApiError(err));
    }
  };

  /**
   * 文本转语音
   * @param {string} text - 需要转为语音的文本
   */
  const synthesizeSpeech = async (text: string): Promise<void> => {
    try {
      // 准备请求数据
      const requestData = {
        text: text, // 直接使用文本而不是cozeOutput对象
      };
      
          // 发送请求
    console.log('发送文本转语音请求...');
    const response = await fetch(`${BASE_URL}${API_PATHS.SPEECH.SYNTHESIZE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      // 检查响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '文本转语音失败');
      }
      
      // 获取音频数据
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // 保存音频URI
      setAudioUri(audioUrl);
      
      // 播放合成的语音
      await playAudio(audioUrl);
      
    } catch (err: any) {
      console.error('文本转语音错误:', err);
      setError(formatApiError(err));
    }
  };

  /**
   * 播放音频
   * @param {string} uri - 音频URI
   */
  const playAudio = async (uri: string): Promise<void> => {
    try {
      // 如果已有声音对象，先卸载
      if (sound) {
        await sound.unloadAsync();
      }
      
      // 加载音频
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      // 保存声音对象
      setSound(newSound);
      setIsPlaying(true);
      
      // 监听播放完成
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      
    } catch (err: any) {
      console.error('播放音频错误:', err);
      setError(formatApiError(err));
      setIsPlaying(false);
    }
  };

  /**
   * 添加消息到消息列表
   * @param {string} sender - 发送者
   * @param {string} text - 消息内容
   */
  const addMessage = (sender: 'user' | 'ai' | 'system', text: string): void => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  /**
   * 渲染消息气泡
   * @param {Object} message - 消息对象
   * @returns {React.ReactElement} - 消息气泡组件
   */
  const renderMessage = (message: Message): React.ReactElement => {
    // 根据发送者设置不同样式
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    
    return (
      <View 
        key={message.id} 
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : isSystem ? styles.systemBubble : styles.aiBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          isSystem ? styles.systemText : null
        ]}>
          {message.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>语音助手</Text>
      </View>
      
      {/* 消息区域 */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>
      
      {/* 错误提示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* 控制区域 */}
      <View style={styles.controlsContainer}>
        {/* 录音按钮 */}
        <TouchableOpacity 
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : null
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <FontAwesome 
            name={isRecording ? 'stop-circle' : 'microphone'} 
            size={32} 
            color="#fff" 
          />
          {isRecording && (
            <Text style={styles.recordingTime}>{recordTime}</Text>
          )}
        </TouchableOpacity>
        
        {/* 处理指示器 */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#1677ff" />
            <Text style={styles.processingText}>处理中...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1677ff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#1677ff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  systemBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  systemText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1677ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  recordingTime: {
    position: 'absolute',
    bottom: -25,
    color: '#333',
    fontSize: 14,
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
});

export default VoiceAssistant; 