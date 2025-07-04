/**
 * 商家支付设置页面
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
  ActivityIndicator,
  TextInput,
  Image
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';

// 支付方式类型
type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  accountInfo?: string;
};

// 定义组件属性类型
type PaymentSettingsScreenProps = StackScreenProps<MerchantCenterStackParamList, 'PaymentSettings'>;

/**
 * 商家支付设置页面组件
 */
const PaymentSettingsScreen: React.FC<PaymentSettingsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // 商户配置
  const [autoConfirm, setAutoConfirm] = useState<boolean>(true);
  const [autoRefund, setAutoRefund] = useState<boolean>(false);
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0');
  const [maxRefundDays, setMaxRefundDays] = useState<string>('7');
  
  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '支付设置',
      headerRight: () => (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving]);

  // 加载支付设置
  useEffect(() => {
    loadPaymentSettings();
  }, []);
  
  /**
   * 加载支付设置
   */
  const loadPaymentSettings = async () => {
    setLoading(true);
    try {
      // 模拟从API或本地存储加载数据
      // 实际应该从后端获取数据
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 假数据，实际应该从API获取
      const mockPaymentMethods = getMockPaymentMethods();
      setPaymentMethods(mockPaymentMethods);
      
      // 假设从本地存储加载
      const savedSettings = await AsyncStorage.getItem('payment_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAutoConfirm(settings.autoConfirm ?? true);
        setAutoRefund(settings.autoRefund ?? false);
        setMinOrderAmount(settings.minOrderAmount?.toString() ?? '0');
        setMaxRefundDays(settings.maxRefundDays?.toString() ?? '7');
      }
    } catch (error) {
      console.error('加载支付设置失败:', error);
      Alert.alert('加载失败', '无法加载支付设置，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 获取模拟支付方式数据
   */
  const getMockPaymentMethods = (): PaymentMethod[] => {
    return [
      {
        id: 'alipay',
        name: '支付宝',
        icon: 'https://img.alicdn.com/imgextra/i4/O1CN01XCiY1B1nx2NX9xVCk_!!6000000005140-2-tps-200-200.png',
        enabled: true,
        accountInfo: '136****8888',
      },
      {
        id: 'wechat',
        name: '微信支付',
        icon: 'https://img.alicdn.com/imgextra/i1/O1CN01DsMAId1mzjOiYPO8F_!!6000000005025-2-tps-200-200.png',
        enabled: true,
        accountInfo: '微信商户号：1230000****',
      },
      {
        id: 'unionpay',
        name: '银联',
        icon: 'https://img.alicdn.com/imgextra/i1/O1CN01yYxxG71CtBYi8FS4P_!!6000000000146-2-tps-200-200.png',
        enabled: false,
      },
      {
        id: 'cod',
        name: '货到付款',
        icon: 'https://img.alicdn.com/imgextra/i1/O1CN01ZBqRmg1vjpjEQUjQi_!!6000000006211-2-tps-200-200.png',
        enabled: false,
      }
    ];
  };
  
  /**
   * 处理支付方式开关
   */
  const handlePaymentMethodToggle = (id: string, value: boolean) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, enabled: value } : method
      )
    );
  };
  
  /**
   * 处理编辑支付账号
   */
  const handleEditAccount = (method: PaymentMethod) => {
    // 根据不同支付方式展示不同的编辑界面
    Alert.alert('配置支付账号', `请前往支付平台配置${method.name}商户信息`);
  };
  
  /**
   * 处理保存
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // 保存数据
      const settings = {
        autoConfirm,
        autoRefund,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxRefundDays: parseInt(maxRefundDays) || 7,
        paymentMethods: paymentMethods.map(({ id, enabled }) => ({ id, enabled })),
      };
      
      // 保存到本地存储
      await AsyncStorage.setItem('payment_settings', JSON.stringify(settings));
      
      // 实际应该调用API保存到后端
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Alert.alert('保存成功', '支付设置已更新', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('保存支付设置失败:', error);
      Alert.alert('保存失败', '更新支付设置失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    // 验证最小订单金额
    const minAmount = parseFloat(minOrderAmount);
    if (isNaN(minAmount) || minAmount < 0) {
      Alert.alert('输入错误', '请输入有效的最小订单金额');
      return false;
    }
    
    // 验证最长退款天数
    const refundDays = parseInt(maxRefundDays);
    if (isNaN(refundDays) || refundDays < 0 || refundDays > 30) {
      Alert.alert('输入错误', '请输入0-30之间的退款天数');
      return false;
    }
    
    // 至少启用一种支付方式
    const hasEnabledMethod = paymentMethods.some(method => method.enabled);
    if (!hasEnabledMethod) {
      Alert.alert('配置错误', '请至少启用一种支付方式');
      return false;
    }
    
    return true;
  };
  
  /**
   * 渲染加载状态
   */
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
      {/* 支付方式 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>支付方式</Text>
        <Text style={styles.sectionDescription}>
          设置您店铺支持的支付方式，至少需要开启一种支付方式
        </Text>
        
        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentMethodItem}>
            <View style={styles.paymentMethodInfo}>
              <Image
                source={{ uri: method.icon }}
                style={styles.paymentIcon}
              />
              <View style={styles.paymentDetail}>
                <Text style={styles.paymentName}>{method.name}</Text>
                {method.accountInfo && method.enabled && (
                  <Text style={styles.accountInfo}>{method.accountInfo}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.paymentControls}>
              {method.enabled && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditAccount(method)}
                >
                  <Text style={styles.editButtonText}>编辑</Text>
                </TouchableOpacity>
              )}
              
              <Switch
                value={method.enabled}
                onValueChange={(value) => handlePaymentMethodToggle(method.id, value)}
                trackColor={{ false: '#ddd', true: '#4cd964' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        ))}
      </View>
      
      {/* 订单设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>订单设置</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>自动确认收货</Text>
          <Switch
            value={autoConfirm}
            onValueChange={setAutoConfirm}
            trackColor={{ false: '#ddd', true: '#4cd964' }}
            thumbColor="#fff"
          />
        </View>
        
        <Text style={styles.settingDescription}>
          买家确认收货后，系统自动完成订单
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>最小订单金额</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>¥</Text>
            <TextInput
              style={styles.input}
              value={minOrderAmount}
              onChangeText={setMinOrderAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <Text style={styles.settingDescription}>
          设置客户下单的最低金额限制，0表示无限制
        </Text>
      </View>
      
      {/* 退款设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>退款设置</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>自动退款审核</Text>
          <Switch
            value={autoRefund}
            onValueChange={setAutoRefund}
            trackColor={{ false: '#ddd', true: '#4cd964' }}
            thumbColor="#fff"
          />
        </View>
        
        <Text style={styles.settingDescription}>
          系统将自动处理符合条件的退款申请
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>最大退款天数</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={maxRefundDays}
              onChangeText={setMaxRefundDays}
              placeholder="7"
              keyboardType="number-pad"
            />
            <Text style={styles.inputSuffix}>天</Text>
          </View>
        </View>
        <Text style={styles.settingDescription}>
          买家收到商品后可申请退款的最长天数，建议设置为7-15天
        </Text>
      </View>
      
      {/* 提交按钮 */}
      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>保存设置</Text>
        )}
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
  section: {
    marginTop: 12,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  paymentDetail: {
    marginLeft: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#333',
  },
  accountInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  paymentControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 12,
  },
  editButtonText: {
    fontSize: 12,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  formGroup: {
    marginTop: 8,
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    height: 40,
  },
  inputPrefix: {
    paddingLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  inputSuffix: {
    paddingRight: 10,
    fontSize: 16,
    color: '#666',
  },
  input: {
    flex: 1,
    padding: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#97c2ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 15,
  },
  saveButtonText: {
    color: '#1677ff',
    fontSize: 16,
  },
  footer: {
    height: 40,
  },
});

export default PaymentSettingsScreen; 