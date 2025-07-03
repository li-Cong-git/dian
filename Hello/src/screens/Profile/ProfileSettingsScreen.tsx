/**
 * 个人设置屏幕
 */
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert 
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';

// 定义组件属性类型
type ProfileSettingsScreenProps = StackScreenProps<ProfileStackParamList, 'ProfileSettings'>;

/**
 * 个人设置屏幕组件
 */
const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ navigation }) => {
  // 开关设置状态
  const [settings, setSettings] = useState({
    pushNotification: true,
    emailNotification: false,
    darkMode: false,
    autoPlay: true,
    locationService: true,
    dataCollection: true,
  });

  // 设置项列表
  const settingItems = [
    {
      title: '账号安全',
      items: [
        { label: '修改密码', type: 'arrow', action: 'changePassword' },
        { label: '修改手机号', type: 'arrow', action: 'changePhone' },
        { label: '修改邮箱', type: 'arrow', action: 'changeEmail' },
        { label: '实名认证', type: 'arrow', action: 'verification' },
        { label: '账号绑定', type: 'arrow', action: 'accountBinding' },
      ],
    },
    {
      title: '隐私',
      items: [
        { label: '隐私设置', type: 'arrow', action: 'privacySettings' },
        { label: '位置服务', type: 'switch', action: 'locationService' },
        { label: '数据收集', type: 'switch', action: 'dataCollection' },
      ],
    },
    {
      title: '通知',
      items: [
        { label: '推送通知', type: 'switch', action: 'pushNotification' },
        { label: '邮件通知', type: 'switch', action: 'emailNotification' },
        { label: '短信通知', type: 'arrow', action: 'smsNotification' },
      ],
    },
    {
      title: '通用',
      items: [
        { label: '深色模式', type: 'switch', action: 'darkMode' },
        { label: '自动播放视频', type: 'switch', action: 'autoPlay' },
        { label: '清除缓存', type: 'arrow', action: 'clearCache' },
        { label: '语言设置', type: 'arrow', action: 'language' },
      ],
    },
    {
      title: '关于',
      items: [
        { label: '关于我们', type: 'arrow', action: 'aboutUs' },
        { label: '用户协议', type: 'arrow', action: 'userAgreement' },
        { label: '隐私政策', type: 'arrow', action: 'privacyPolicy' },
        { label: '版本信息', type: 'text', action: 'version', value: '1.0.0' },
      ],
    },
  ];

  // 处理开关改变
  const handleSwitchChange = (action: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [action]: value,
    }));
  };

  // 处理点击
  const handlePress = (action: string) => {
    switch (action) {
      case 'logout':
        Alert.alert(
          '退出登录',
          '确定要退出登录吗？',
          [
            { text: '取消', style: 'cancel' },
            { text: '确定', onPress: () => console.log('用户确认退出登录') },
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
              onPress: () => Alert.alert('提示', '缓存已清除')
            },
          ]
        );
        break;
      default:
        Alert.alert('提示', `您点击了 ${action}`);
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
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
                onPress={() => item.type !== 'switch' && handlePress(item.action)}
                disabled={item.type === 'switch' || item.type === 'text'}
              >
                <Text style={styles.settingLabel}>{item.label}</Text>
                {item.type === 'arrow' && (
                  <Text style={styles.arrowIcon}>&gt;</Text>
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
        <Text style={styles.logoutButtonText}>退出登录</Text>
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#999',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#ccc',
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#f50',
  },
  footer: {
    height: 50,
  },
});

export default ProfileSettingsScreen; 