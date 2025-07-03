/**
 * 消息主屏幕
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MessageStackParamList } from '../../navigation/types';

// 定义组件属性类型
type MessageScreenProps = StackScreenProps<MessageStackParamList, 'MessageScreen'>;

// 消息类型
interface Message {
  id: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  type: 'system' | 'promotion' | 'order' | 'other';
}

/**
 * 消息主屏幕组件
 */
const MessageScreen: React.FC<MessageScreenProps> = ({ navigation }) => {
  // 消息数据（模拟）
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      title: '系统通知',
      content: '尊敬的用户，您的账号已完成实名认证，感谢您的配合。',
      time: '2023-06-15 10:30',
      isRead: false,
      type: 'system',
    },
    {
      id: '2',
      title: '订单状态更新',
      content: '您的订单 #10086 已发货，预计 3-5 天送达，请注意查收。',
      time: '2023-06-14 15:22',
      isRead: false,
      type: 'order',
    },
    {
      id: '3',
      title: '优惠活动',
      content: '618 大促即将开始，全场商品低至 5 折，更有限时秒杀活动等您参与！',
      time: '2023-06-10 09:15',
      isRead: true,
      type: 'promotion',
    },
    {
      id: '4',
      title: '账户安全提醒',
      content: '您的账户于昨日在新设备上登录，如非本人操作，请及时修改密码。',
      time: '2023-06-08 18:45',
      isRead: true,
      type: 'system',
    },
    {
      id: '5',
      title: '评价提醒',
      content: '您购买的商品已收货 7 天，别忘了对商品进行评价哦，分享您的使用体验。',
      time: '2023-06-05 14:30',
      isRead: true,
      type: 'order',
    },
  ]);

  // 跳转到消息详情
  const navigateToDetail = (id: string, isRead: boolean) => {
    // 如果消息未读，则标记为已读
    if (!isRead) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, isRead: true } : msg
        )
      );
    }
    
    navigation.navigate('MessageDetail', { id, isRead });
  };

  // 获取未读消息数量
  const getUnreadCount = () => {
    return messages.filter(msg => !msg.isRead).length;
  };

  // 标记所有消息为已读
  const markAllAsRead = () => {
    setMessages(prev =>
      prev.map(msg => ({ ...msg, isRead: true }))
    );
  };

  // 获取消息类型对应的图标（示例文本）
  const getMessageTypeIcon = (type: Message['type']) => {
    switch (type) {
      case 'system':
        return '系统';
      case 'promotion':
        return '促销';
      case 'order':
        return '订单';
      case 'other':
      default:
        return '其他';
    }
  };

  // 渲染消息项
  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.messageItem, item.isRead && styles.messageItemRead]}
      onPress={() => navigateToDetail(item.id, item.isRead)}
    >
      {/* 消息标记（未读/已读） */}
      {!item.isRead && <View style={styles.unreadDot} />}
      
      {/* 消息类型图标 */}
      <View style={[styles.typeIcon, styles[`typeIcon${item.type}`]]}>
        <Text style={styles.typeIconText}>{getMessageTypeIcon(item.type)}</Text>
      </View>
      
      {/* 消息内容 */}
      <View style={styles.messageContent}>
        <Text style={[styles.messageTitle, !item.isRead && styles.messageTitleUnread]}>
          {item.title}
        </Text>
        <Text
          style={styles.messagePreview}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.content}
        </Text>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  // 渲染消息列表头部
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.headerTitle}>消息中心</Text>
      <View style={styles.headerRight}>
        {getUnreadCount() > 0 && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllReadText}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // 渲染空消息列表
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无消息</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        style={styles.list}
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
  list: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllReadButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  markAllReadText: {
    fontSize: 12,
    color: '#666',
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  messageItemRead: {
    backgroundColor: '#f9f9f9',
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f50',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconsystem: {
    backgroundColor: '#e6f7ff',
  },
  typeIconpromotion: {
    backgroundColor: '#fff7e6',
  },
  typeIconorder: {
    backgroundColor: '#f6ffed',
  },
  typeIconother: {
    backgroundColor: '#f5f5f5',
  },
  typeIconText: {
    fontSize: 12,
    color: '#666',
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  messageTitleUnread: {
    fontWeight: 'bold',
    color: '#000',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default MessageScreen; 