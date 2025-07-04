/**
 * 商家设置页面
 */
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  Platform 
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import merchantService, { MerchantInfo } from '../../services/merchant.service';

// 定义组件属性类型
type MerchantSettingsScreenProps = StackScreenProps<MerchantCenterStackParamList, 'MerchantSettings'>;

/**
 * 商家设置页面组件
 */
const MerchantSettingsScreen: React.FC<MerchantSettingsScreenProps> = ({ navigation }) => {
  // 获取认证上下文
  const { logout, user } = useAuth();
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 开关设置状态
  const [settings, setSettings] = useState({
    pushNotification: true,
    emailNotification: true,
    autoPublish: false,
    dataCollection: true,
  });

  // 加载商家信息和设置
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?._id) {
          // 加载商家信息
          const merchantData = await merchantService.getMerchantInfo(user._id);
          setMerchantInfo(merchantData);
          
          // 加载设置
          const storedSettings = await AsyncStorage.getItem('merchant_settings');
          if (storedSettings) {
            setSettings(JSON.parse(storedSettings));
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '设置',
    });
  }, [navigation]);

  // 设置项列表
  const settingItems = [
    {
      title: '账号与安全',
      items: [
        { label: '店铺信息', type: 'arrow', action: 'shopInfo', icon: '🏪' },
        { label: '修改密码', type: 'arrow', action: 'changePassword', icon: '🔒' },
        { label: '修改联系电话', type: 'arrow', action: 'changePhone', icon: '📱' },
        { label: '修改邮箱', type: 'arrow', action: 'changeEmail', icon: '📧' },
        { label: '店铺认证', type: 'arrow', action: 'verification', icon: '✅' },
      ],
    },
    {
      title: '经营设置',
      items: [
        { label: '经营类目', type: 'arrow', action: 'categories', icon: '📋' },
        { label: '支付设置', type: 'arrow', action: 'paymentSettings', icon: '💰' },
        { label: '物流设置', type: 'arrow', action: 'logistics', icon: '🚚' },
      ],
    },
    {
      title: '通知设置',
      items: [
        { label: '推送通知', type: 'switch', action: 'pushNotification', icon: '🔔' },
        { label: '邮件通知', type: 'switch', action: 'emailNotification', icon: '📩' },
        { label: '订单提醒', type: 'arrow', action: 'orderNotification', icon: '📦' },
      ],
    },
    {
      title: '数据与缓存',
      items: [
        { label: '自动发布', type: 'switch', action: 'autoPublish', icon: '🔄' },
        { label: '数据收集', type: 'switch', action: 'dataCollection', icon: '📊' },
        { label: '清除缓存', type: 'arrow', action: 'clearCache', icon: '🧹' },
      ],
    },
    {
      title: '关于',
      items: [
        { label: '商家协议', type: 'arrow', action: 'merchantAgreement', icon: '📜' },
        { label: '隐私政策', type: 'arrow', action: 'privacyPolicy', icon: '🔐' },
        { label: '版本信息', type: 'text', action: 'version', value: '1.0.0', icon: 'ℹ️' },
      ],
    },
  ];

  // 处理开关改变
  const handleSwitchChange = async (action: string, value: boolean) => {
    const newSettings = {
      ...settings,
      [action]: value,
    };
    
    setSettings(newSettings);
    
    try {
      // 保存到本地存储
      await AsyncStorage.setItem('merchant_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  // 处理点击
  const handlePress = (action: string) => {
    switch (action) {
      case 'shopInfo':
        navigation.navigate('ShopInfo');
        break;
      case 'changePassword':
        navigation.navigate('ChangePassword');
        break;
      case 'categories':
        navigation.navigate('Categories');
        break;
      case 'paymentSettings':
        navigation.navigate('PaymentSettings');
        break;
      case 'logout':
        Alert.alert(
          '退出登录',
          '确定要退出商家账号吗？',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '确定', 
              onPress: async () => {
                try {
                  await logout();
                  // 退出登录后不需要导航，因为AuthContext的状态变化会触发AppNavigator中的条件渲染
                  console.log('商家已成功退出登录');
                } catch (error) {
                  console.error('退出登录失败:', error);
                  Alert.alert('退出失败', '退出登录时发生错误，请稍后重试');
                }
              }
            },
          ]
        );
        break;
      case 'clearCache':
        Alert.alert(
          '清除缓存',
          '确定要清除缓存吗？此操作不可撤销。',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '确定', 
              onPress: async () => {
                try {
                  // 清除设置缓存
                  await AsyncStorage.removeItem('merchant_settings');
                  // 重置设置状态
                  setSettings({
                    pushNotification: true,
                    emailNotification: true,
                    autoPublish: false,
                    dataCollection: true,
                  });
                  Alert.alert('提示', '缓存已清除');
                } catch (error) {
                  console.error('清除缓存失败:', error);
                  Alert.alert('清除失败', '清除缓存时发生错误，请稍后重试');
                }
              }
            },
          ]
        );
        break;
      default:
        Alert.alert('提示', `该功能正在开发中`);
        break;
    }
  };

  // 渲染商家信息卡片
  const renderMerchantInfoCard = () => (
    <View style={styles.merchantInfoCard}>
      <Image
        source={{
          uri: merchantInfo?.logo || 'https://via.placeholder.com/60'
        }}
        style={styles.merchantLogo}
      />
      <View style={styles.merchantInfoContent}>
        <Text style={styles.merchantName}>{merchantInfo?.name || '商家名称'}</Text>
        <Text style={styles.merchantAccount}>{merchantInfo?.accountName || '账号ID'}</Text>
        
        <View style={styles.merchantStatusContainer}>
          <View style={[
            styles.statusIndicator,
            merchantInfo?.status === 'active' ? styles.statusActive :
            merchantInfo?.status === 'suspended' ? styles.statusSuspended : 
            styles.statusClosed
          ]} />
          <Text style={styles.merchantStatus}>
            {merchantInfo?.status === 'active' ? '正常营业' : 
             merchantInfo?.status === 'suspended' ? '已暂停' : '已关闭'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handlePress('shopInfo')}
      >
        <Text style={styles.editButtonText}>编辑</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 商家信息卡片 */}
      {renderMerchantInfoCard()}

      {/* 设置项组 */}
      {settingItems.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.settingGroup}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.groupItems}>
            {group.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
                  itemIndex === group.items.length - 1 && styles.lastSettingItem,
                ]}
                onPress={() => item.type !== 'switch' && item.type !== 'text' && handlePress(item.action)}
                disabled={item.type === 'switch' || item.type === 'text'}
              >
                {item.icon && (
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                )}
                <Text style={styles.settingLabel}>{item.label}</Text>
                
                {item.type === 'arrow' && (
                  <Text style={styles.arrowIcon}>›</Text>
                )}
                {item.type === 'switch' && (
                  <Switch
                    value={settings[item.action as keyof typeof settings]}
                    onValueChange={(value) => handleSwitchChange(item.action, value)}
                    trackColor={{ false: '#ddd', true: '#4cd964' }}
                    thumbColor="#fff"
                  />
                )}
                {item.type === 'text' && item.value && (
                  <Text style={styles.settingValue}>{item.value}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* 退出登录按钮 */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => handlePress('logout')}
      >
        <Text style={styles.logoutButtonText}>退出商家账号</Text>
      </TouchableOpacity>

      {/* 底部安全区域 */}
      <View style={styles.footer} />
    </ScrollView>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  merchantInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  merchantLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  merchantInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  merchantAccount: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  merchantStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusActive: {
    backgroundColor: '#52c41a',
  },
  statusSuspended: {
    backgroundColor: '#faad14',
  },
  statusClosed: {
    backgroundColor: '#ff4d4f',
  },
  merchantStatus: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#666',
    fontSize: 12,
  },
  settingGroup: {
    marginTop: 12,
  },
  groupTitle: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupItems: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#f50',
  },
  footer: {
    height: 50,
  },
});

export default MerchantSettingsScreen; 