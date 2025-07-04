/**
 * 商家聊天详情界面
 * 支持WebSocket实时通信
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MerchantChatStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat, ChatMessage } from '../../contexts/ChatContext';
import chatService from '../../services/chat.service';

// 定义组件属性类型
interface MerchantChatDetailScreenProps {
  navigation: StackNavigationProp<MerchantChatStackParamList, 'MerchantChatDetail'>;
  route: RouteProp<MerchantChatStackParamList, 'MerchantChatDetail'>;
}

/**
 * 商家聊天详情界面
 */
const MerchantChatDetailScreen: React.FC<MerchantChatDetailScreenProps> = ({ navigation, route }) => {
  const { roomId, userId, userName } = route.params;
  const { user } = useAuth();
  const { joinRoom, leaveRoom, sendMessage, messages, currentRoom } = useChat();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  
  const flatListRef = useRef<FlatList>(null);
  const mounted = useRef(true);
  
  // 设置导航标题
  useEffect(() => {
    navigation.setOptions({
      title: userName,
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
      }
    });
  }, [navigation, userName]);
  
  // 初始化
  useEffect(() => {
    mounted.current = true;
    
    console.log('初始化商家聊天详情页面，roomId:', roomId, 'userId:', userId);
    
    // 加入聊天室
    if (roomId) {
      joinRoom(roomId);
    }
    
    // 清理
    return () => {
      mounted.current = false;
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, []);
  
  // 消息列表变化时滚动到底部
  useEffect(() => {
    if (messages[roomId] && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    setLoading(false);
  }, [messages, roomId]);
  
  /**
   * 发送消息
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending || !user || !roomId) {
      return;
    }
    
    try {
      setSending(true);
      console.log('发送消息:', inputMessage, '到roomId:', roomId, '接收者:', userId);
      
      // 使用WebSocket发送消息
      const success = await sendMessage(
        roomId,
        inputMessage.trim(),
        userId
      );
      
      // 成功发送后清空输入框
      if (success) {
        setInputMessage('');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };
  
  /**
   * 渲染消息项
   */
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isFromSelf = item.senderType === 'merchant' && user?._id === item.senderId;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isFromSelf ? styles.merchantMessageContainer : styles.userMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isFromSelf ? styles.merchantMessageBubble : styles.userMessageBubble
          ]}
        >
          <Text style={[
            styles.messageText,
            isFromSelf ? styles.merchantMessageText : styles.userMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {typeof item.createdAt === 'string'
            ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };
  
  /**
   * 渲染加载中状态
   */
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1677ff" />
      <Text style={styles.loadingText}>加载聊天记录中...</Text>
    </View>
  );
  
  /**
   * 渲染空消息提示
   */
  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无消息记录，发送消息开始聊天</Text>
    </View>
  );
  
  /**
   * 渲染内容
   */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 聊天记录列表 */}
      {loading ? renderLoading() : (
        <FlatList
          ref={flatListRef}
          data={messages[roomId] || []}
          renderItem={renderMessageItem}
          keyExtractor={item => item.messageId}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          ListEmptyComponent={renderEmptyMessages()}
        />
      )}
      
      {/* 输入框区域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="请输入消息..."
          placeholderTextColor="#999"
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputMessage.trim() || sending) && styles.disabledSendButton
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>发送</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  messagesList: {
    padding: 12,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'column',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  merchantMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  merchantMessageBubble: {
    backgroundColor: '#1677ff',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#333',
  },
  merchantMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#1677ff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MerchantChatDetailScreen; 