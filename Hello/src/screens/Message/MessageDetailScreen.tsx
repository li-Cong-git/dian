/**
 * 消息详情屏幕
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MessageStackParamList } from '../../navigation/types';

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
  // 获取路由参数
  const { id, isRead } = route.params;
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    // 模拟网络请求
    const timer = setTimeout(() => {
      // 根据 ID 获取不同类型的消息
      let messageData: MessageDetail;
      
      switch (id) {
        case '1':
          messageData = {
            id: '1',
            title: '系统通知',
            content: '尊敬的用户，您的账号已完成实名认证，感谢您的配合。\n\n实名认证是保障您账号安全的重要措施，同时也将为您开启更多服务功能。如您在使用过程中遇到任何问题，请随时联系客服。\n\n祝您购物愉快！',
            time: '2023-06-15 10:30',
            isRead: true, // 标记为已读
            type: 'system',
            sender: '系统管理员',
          };
          break;
        case '2':
          messageData = {
            id: '2',
            title: '订单状态更新',
            content: '您的订单 #10086 已发货，预计 3-5 天送达，请注意查收。\n\n物流信息：\n快递公司：顺丰速运\n运单号码：SF1234567890\n发货时间：2023-06-14 14:30\n\n您可以点击下方按钮查看物流详情或联系客服。',
            time: '2023-06-14 15:22',
            isRead: true,
            type: 'order',
            sender: '订单系统',
            actions: [
              { label: '查看物流', type: 'primary', action: 'viewLogistics' },
              { label: '联系客服', type: 'default', action: 'contactService' },
            ],
          };
          break;
        case '3':
          messageData = {
            id: '3',
            title: '优惠活动',
            content: '618 大促即将开始，全场商品低至 5 折，更有限时秒杀活动等您参与！\n\n活动时间：2023-06-18 00:00 - 2023-06-20 23:59\n\n主要活动内容：\n1. 全场商品低至 5 折\n2. 每满 300 减 50\n3. 限时秒杀，爆品低至 1 折\n4. 新用户专享优惠券包\n\n点击下方按钮立即查看活动详情，抢先加购心仪商品！',
            time: '2023-06-10 09:15',
            isRead: true,
            type: 'promotion',
            sender: '营销中心',
            actions: [
              { label: '查看活动', type: 'primary', action: 'viewPromotion' },
              { label: '不再提醒', type: 'danger', action: 'noMoreRemind' },
            ],
          };
          break;
        default:
          messageData = {
            id,
            title: '消息详情',
            content: '这是消息 ID 为 ' + id + ' 的详细内容。\n\n消息内容较长时会自动换行显示，保证良好的阅读体验。',
            time: '2023-06-01 12:00',
            isRead: true,
            type: 'other',
          };
      }
      
      setMessage(messageData);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [id, isRead]);

  // 处理按钮点击
  const handleActionClick = (action: string) => {
    switch (action) {
      case 'viewLogistics':
        // 查看物流（示例）
        alert('查看物流详情');
        break;
      case 'contactService':
        // 联系客服（示例）
        alert('联系客服');
        break;
      case 'viewPromotion':
        // 查看活动（示例）
        alert('查看活动详情');
        break;
      case 'noMoreRemind':
        // 不再提醒（示例）
        alert('已设置不再提醒此类消息');
        break;
      default:
        alert(`执行操作: ${action}`);
    }
  };

  // 删除消息
  const deleteMessage = () => {
    alert('消息已删除');
    navigation.goBack();
  };

  // 加载状态
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>加载中...</Text>
      </View>
    );
  }

  // 数据为空
  if (!message) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>未找到消息</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 消息头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>{message.title}</Text>
          {message.sender && (
            <Text style={styles.sender}>发送人: {message.sender}</Text>
          )}
          <Text style={styles.time}>{message.time}</Text>
        </View>

        {/* 消息内容 */}
        <View style={styles.content}>
          <Text style={styles.contentText}>{message.content}</Text>
        </View>

        {/* 操作按钮 */}
        {message.actions && message.actions.length > 0 && (
          <View style={styles.actions}>
            {message.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  action.type === 'primary' && styles.primaryButton,
                  action.type === 'danger' && styles.dangerButton,
                ]}
                onPress={() => handleActionClick(action.action)}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    action.type === 'primary' && styles.primaryButtonText,
                    action.type === 'danger' && styles.dangerButtonText,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            消息 ID: {message.id}
          </Text>
          <TouchableOpacity onPress={deleteMessage}>
            <Text style={styles.deleteText}>删除消息</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sender: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1677ff',
    borderColor: '#1677ff',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderColor: '#ff4d4f',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  primaryButtonText: {
    color: '#fff',
  },
  dangerButtonText: {
    color: '#ff4d4f',
  },
  footer: {
    padding: 16,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  deleteText: {
    fontSize: 14,
    color: '#ff4d4f',
  },
});

export default MessageDetailScreen; 