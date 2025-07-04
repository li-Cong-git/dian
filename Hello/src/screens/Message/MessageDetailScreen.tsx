/**
 * 消息详情屏幕
 * 支持WebSocket实时聊天
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MessageStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat, ChatMessage, ChatRoom } from '../../contexts/ChatContext';
import chatService from '../../services/chat.service';

// 定义组件属性类型
type MessageDetailScreenProps = StackScreenProps<MessageStackParamList, 'MessageDetail'>;

/**
 * 消息详情类型
 */
interface MessageDetail {
  id: string;
  title: string;
  content: string;
  time: string;
  type: 'system' | 'promotion' | 'order' | 'other';
  isRead: boolean;
  sender?: string;
  actions?: Array<{
    label: string;
    type: 'primary' | 'default' | 'danger';
    action: string;
  }>;
}

/**
 * 消息详情屏幕组件
 */
const MessageDetailScreen: React.FC<MessageDetailScreenProps> = ({ route, navigation }) => {
  const { id: roomId, isRead } = route.params;
  const { user } = useAuth();
  const { joinRoom, leaveRoom, sendMessage, messages, currentRoom } = useChat();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [merchantId, setMerchantId] = useState<string>('');

  // 引用
  const flatListRef = useRef<FlatList>(null);
  const mounted = useRef(true);
  
  // 初始化
  useEffect(() => {
    mounted.current = true;

    // 加载聊天室信息
    loadChatRoom();
    
    // 加入聊天室
    if (roomId) {
      joinRoom(roomId);
    }
    
    // 设置标题
    navigation.setOptions({
      title: chatRoom?.merchantInfo?.name || '商家聊天',
    });
    
    // 清理
    return () => {
      mounted.current = false;
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId]);

  // 聊天室加载成功后更新标题
  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({
        title: chatRoom.merchantInfo.name || '商家聊天',
      });
    }
  }, [chatRoom, navigation]);
  
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
   * 加载聊天室信息
   */
  const loadChatRoom = async () => {
    try {
      // 这里应该调用API获取聊天室信息
      // 目前使用模拟数据
      const mockChatRoom: ChatRoom = {
        roomId,
        userId: user?._id || '',
        merchantId: 'merchant_123', // 实际环境中应从API获取
        userInfo: {
          username: user?.username || '',
          avatar: user?.avatar || '',
        },
        merchantInfo: {
          name: '示例商家',
          accountName: 'merchant_account',
        },
        unreadCount: {
          user: 0,
          merchant: 0
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setChatRoom(mockChatRoom);
      setMerchantId(mockChatRoom.merchantId);
      setLoading(false);
    } catch (error) {
      console.error('加载聊天室信息失败:', error);
      setLoading(false);
    }
  };
  
  /**
   * 处理发送消息
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending || !user) return;
    
    try {
      setSending(true);
      
      // 发送消息
      const success = await sendMessage(
        roomId,
        inputMessage.trim(),
        merchantId,
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
    const isFromSelf = item.senderType === 'user' && user?._id === item.senderId;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isFromSelf ? styles.userMessageContainer : styles.merchantMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isFromSelf ? styles.userMessageBubble : styles.merchantMessageBubble
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
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
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  merchantMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: '#1677ff',
    borderTopRightRadius: 4,
  },
  merchantMessageBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  userMessageText: {
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

export default MessageDetailScreen; 