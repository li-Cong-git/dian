/**
 * 商家聊天列表屏幕
 * 显示与用户的聊天会话列表
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantChatStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat, ChatRoom } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 定义组件属性类型
interface MerchantChatScreenProps {
  navigation: StackNavigationProp<MerchantChatStackParamList, 'MerchantChatList'>;
}

/**
 * 商家聊天列表屏幕组件
 */
const MerchantChatScreen: React.FC<MerchantChatScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { rooms, getRooms, unreadCount } = useChat();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  
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
      
      setLoading(false);
    } catch (error) {
      console.error('加载聊天列表失败:', error);
      setLoading(false);
    }
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
    navigation.navigate('MerchantChatDetail', {
      roomId: chatRoom.roomId,
      userId: chatRoom.userId,
      userName: chatRoom.userInfo.nickname || chatRoom.userInfo.username || '用户',
    });
  };
  
  /**
   * 格式化时间显示
   */
  const formatTime = (time: string | Date) => {
    try {
      const date = typeof time === 'string' ? new Date(time) : time;
      // 判断是否是今天
      const today = new Date();
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // 判断是否是昨天
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) {
        return '昨天';
      }
      
      // 否则显示日期
      return date.toLocaleDateString();
    } catch (error) {
      return '未知时间';
    }
  };
  
  /**
   * 过滤聊天室
   */
  const filteredRooms = searchText
    ? rooms.filter(room => 
        (room.userInfo.nickname || room.userInfo.username || '')
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        (room.lastMessage?.content || '')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
    : rooms;
  
  /**
   * 渲染聊天室项
   */
  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    // 确定未读消息数量
    const unreadCount = user?.role === 'merchant' ? item.unreadCount.merchant : 0;
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatRoomPress(item)}
      >
        {/* 用户头像 */}
        <View style={styles.avatarContainer}>
          {item.userInfo.avatar ? (
            <Image source={{ uri: item.userInfo.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.userInfo.username
                  ? item.userInfo.username.substring(0, 1).toUpperCase()
                  : '?'}
              </Text>
            </View>
          )}
          
          {/* 未读消息数量 */}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        {/* 聊天内容 */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.userInfo.nickname || item.userInfo.username || '用户'}
            </Text>
            <Text style={styles.chatTime}>
              {item.lastMessage?.timestamp ? formatTime(item.lastMessage.timestamp) : ''}
            </Text>
          </View>
          
          <Text style={styles.chatPreview} numberOfLines={1}>
            {item.lastMessage?.content || '暂无消息'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  /**
   * 渲染空状态
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="message" size={60} color="#ccc" />
      <Text style={styles.emptyText}>暂无聊天消息</Text>
      <Text style={styles.emptySubText}>
        用户发起的咨询会显示在这里
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
  
  /**
   * 渲染标题
   */
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>客户消息</Text>
    </View>
  );
  
  // 如果加载中，显示加载动画
  if (loading && !refreshing) {
    return renderLoading();
  }
  
  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索客户名称"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      
      <FlatList
        data={filteredRooms}
        renderItem={renderChatRoomItem}
        keyExtractor={(item) => item.roomId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 16,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
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
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4d4f',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
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
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default MerchantChatScreen; 