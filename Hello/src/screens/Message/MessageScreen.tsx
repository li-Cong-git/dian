/**
 * 消息屏幕
 * 显示用户的聊天室列表和系统消息
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat, ChatRoom } from '../../contexts/ChatContext';
import chatService from '../../services/chat.service';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 类型定义
type MessageScreenProps = StackScreenProps<MessageStackParamList, 'MessageList'>;

// 系统消息类型
interface SystemMessage {
  id: string;
  title: string;
  preview: string;
  time: string | Date;
  isRead: boolean;
  type: 'system' | 'order' | 'promotion';
}

/**
 * 消息屏幕组件
 */
const MessageScreen: React.FC<MessageScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { rooms, getRooms, unreadCount } = useChat();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  
  // 初始加载
  useEffect(() => {
    loadData();
    
    // 添加导航监听器，当屏幕聚焦时刷新数据
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  /**
   * 加载数据
   */
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 加载聊天室列表
      if (user?._id) {
        await getRooms();
      }
      
      // 加载系统消息
      loadSystemMessages();
      
      setLoading(false);
    } catch (error) {
      console.error('加载消息列表失败:', error);
      setLoading(false);
    }
  };
  
  /**
   * 加载系统消息
   */
  const loadSystemMessages = () => {
    // 模拟从服务器获取系统消息
    const mockSystemMessages: SystemMessage[] = [
      {
        id: '1',
        title: '系统通知',
        preview: '您的账号已完成实名认证，感谢您的配合。',
        time: '2023-06-15 10:30',
        isRead: true,
        type: 'system',
      },
      {
        id: '2',
        title: '订单状态更新',
        preview: '您的订单 #10086 已发货，预计 3-5 天送达，请注意查收。',
        time: '2023-06-14 15:22',
        isRead: false,
        type: 'order',
      },
      {
        id: '3',
        title: '优惠活动',
        preview: '618 大促即将开始，全场商品低至 5 折，更有限时秒杀活动等您参与！',
        time: '2023-06-10 09:15',
        isRead: false,
        type: 'promotion',
      }
    ];
    
    setSystemMessages(mockSystemMessages);
  };
  
  /**
   * 刷新数据
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  /**
   * 处理聊天室点击
   */
  const handleChatRoomPress = (chatRoom: ChatRoom) => {
    navigation.navigate('MessageDetail', {
      id: chatRoom.roomId,
      isRead: true,
    });
  };
  
  /**
   * 处理系统消息点击
   */
  const handleSystemMessagePress = (message: SystemMessage) => {
    navigation.navigate('MessageDetail', {
      id: message.id,
      isRead: message.isRead,
    });
  };
  
  /**
   * 格式化时间显示
   */
  const formatTime = (time: string | Date) => {
    try {
      const date = typeof time === 'string' ? new Date(time) : time;
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (error) {
      return '未知时间';
    }
  };
  
  /**
   * 渲染聊天室项
   */
  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    // 确定未读消息数量
    const unreadCount = user?.role === 'user' ? item.unreadCount.user : 0;
    
    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => handleChatRoomPress(item)}
      >
        {/* 商家头像 */}
        <View style={styles.avatarContainer}>
          {item.merchantInfo.logo ? (
            <Image source={{ uri: item.merchantInfo.logo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.merchantInfo.name ? item.merchantInfo.name.substring(0, 1).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
        
        {/* 消息内容 */}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTitle} numberOfLines={1}>
              {item.merchantInfo.name || '商家'}
            </Text>
            <Text style={styles.messageTime}>
              {item.lastMessage?.timestamp ? formatTime(item.lastMessage.timestamp) : ''}
            </Text>
          </View>
          
          <Text style={styles.messagePreview} numberOfLines={1}>
            {item.lastMessage?.content || '暂无消息'}
          </Text>
        </View>
        
        {/* 未读消息数量 */}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  /**
   * 渲染系统消息项
   */
  const renderSystemMessageItem = ({ item }: { item: SystemMessage }) => {
    // 根据消息类型选择图标
    let iconName: string = 'notifications';
    let iconColor: string = '#1677ff';
    
    switch (item.type) {
      case 'order':
        iconName = 'local-shipping';
        iconColor = '#52c41a';
        break;
      case 'promotion':
        iconName = 'local-offer';
        iconColor = '#fa8c16';
        break;
      default:
        iconName = 'notifications';
        iconColor = '#1677ff';
    }
    
    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => handleSystemMessagePress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <MaterialIcons name={iconName} size={24} color={iconColor} />
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.messageTime}>
              {formatTime(item.time)}
            </Text>
          </View>
          
          <Text style={styles.messagePreview} numberOfLines={1}>
            {item.preview}
          </Text>
        </View>
        
        {!item.isRead && (
          <View style={styles.dot} />
        )}
      </TouchableOpacity>
    );
  };
  
  /**
   * 渲染列表头部
   */
  const renderListHeader = () => {
    if (rooms.length === 0 && systemMessages.length === 0) {
      return null;
    }
    
    return (
      <>
        {rooms.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>商家聊天</Text>
          </View>
        )}
      </>
    );
  };
  
  /**
   * 渲染系统消息部分
   */
  const renderSystemMessagesSection = () => {
    if (systemMessages.length === 0) {
      return null;
    }
    
    return (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>系统消息</Text>
        </View>
        
        {systemMessages.map(message => renderSystemMessageItem({ item: message }))}
      </>
    );
  };
  
  /**
   * 渲染空状态
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="message" size={60} color="#ccc" />
      <Text style={styles.emptyText}>暂无消息</Text>
      <Text style={styles.emptySubText}>
        您可以与商家沟通商品信息，或接收系统通知
      </Text>
    </View>
  );
  
  /**
   * 渲染加载中状态
   */
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1677ff" />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );
  
  // 如果加载中，显示加载动画
  if (loading && !refreshing) {
    return renderLoading();
  }
  
  // 主体内容
  return (
    <View style={styles.container}>
      {/* 聊天室列表 */}
      {rooms.length === 0 && systemMessages.length === 0 ? (
        <View style={styles.container}>
          {renderEmpty()}
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderChatRoomItem}
          keyExtractor={(item) => item.roomId}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader()}
          ListFooterComponent={renderSystemMessagesSection()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#ff4d4f',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4d4f',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
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
});

export default MessageScreen; 