/**
 * 商家注册页面
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/types';

// 定义组件属性类型
interface MerchantRegisterScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'MerchantRegister'>;
}

// 定义错误状态类型
interface FormErrors {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  description: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  businessLicense: string;
  general: string;
}

/**
 * 商家注册页面组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} - 商家注册页面
 */
const MerchantRegisterScreen: React.FC<MerchantRegisterScreenProps> = ({ navigation }) => {
  // 状态
  const [name, setName] = useState<string>(''); // 店铺名称
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // 地址信息
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [detail, setDetail] = useState<string>('');
  
  const [businessLicense, setBusinessLicense] = useState<string>('');
  const [businessScope, setBusinessScope] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 获取认证上下文
  const { merchantRegister, error: authError } = useAuth();
  
  // 本地错误状态
  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    businessLicense: '',
    general: ''
  });
  
  /**
   * 表单验证
   * @returns {boolean} - 验证结果
   */
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      description: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      businessLicense: '',
      general: ''
    };
    
    // 验证店铺名称
    if (!name.trim()) {
      newErrors.name = '请输入店铺名称';
      isValid = false;
    }
    
    // 验证手机号
    if (!phone.trim()) {
      newErrors.phone = '请输入手机号';
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入有效的手机号';
      isValid = false;
    }
    
    // 验证邮箱（可选）
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
      isValid = false;
    }
    
    // 验证密码
    if (!password) {
      newErrors.password = '请设置密码';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少为6位';
      isValid = false;
    }
    
    // 验证确认密码
    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }
    
    // 验证地址信息
    if (!province.trim()) {
      newErrors.province = '请输入省份';
      isValid = false;
    }
    
    if (!city.trim()) {
      newErrors.city = '请输入城市';
      isValid = false;
    }
    
    if (!district.trim()) {
      newErrors.district = '请输入区/县';
      isValid = false;
    }
    
    if (!detail.trim()) {
      newErrors.detail = '请输入详细地址';
      isValid = false;
    }
    
    // 验证营业执照
    if (!businessLicense.trim()) {
      newErrors.businessLicense = '请输入营业执照号码';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  /**
   * 处理注册
   */
  const handleRegister = async (): Promise<void> => {
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrors({ ...errors, general: '' });
      
      // 准备商家数据
      const merchantData = {
        name,
        password,
        phone,
        email: email || undefined,
        address: {
          province,
          city,
          district,
          detail
        },
        description,
        businessLicense,
        businessScope: businessScope || undefined
      };
      
      // 调用商家注册API
      const result = await merchantRegister(merchantData);
      
      if (result.success) {
        // 注册成功
        Alert.alert(
          '注册成功',
          `商家账号已成功创建，您的登录账号为: ${result.data.accountName}`,
          [
            {
              text: '去登录',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        // 注册失败
        setErrors({
          ...errors,
          general: result.error || '注册失败，请稍后重试'
        });
      }
    } catch (error: any) {
      console.error('注册错误:', error);
      setErrors({
        ...errors,
        general: '注册时发生错误，请稍后再试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>商家注册</Text>
          <Text style={styles.subtitle}>创建您的店铺账号</Text>
        </View>
        
        {/* 错误信息 */}
        {(errors.general || authError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general || authError}</Text>
          </View>
        )}
        
        {/* 注册表单 */}
        <View style={styles.formContainer}>
          {/* 店铺名称 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>店铺名称 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="请输入店铺名称"
              value={name}
              onChangeText={setName}
              editable={!isSubmitting}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
          </View>
          
          {/* 手机号 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>联系电话 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="请输入手机号"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
            {errors.phone ? (
              <Text style={styles.errorText}>{errors.phone}</Text>
            ) : null}
          </View>
          
          {/* 邮箱 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>邮箱</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="请输入邮箱（选填）"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>
          
          {/* 密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>密码 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="请设置密码，至少6位"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>
          
          {/* 确认密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>确认密码 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>
          
          {/* 店铺地址 */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>店铺地址</Text>
          </View>
          
          {/* 省份 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>省份 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.province && styles.inputError]}
              placeholder="请输入省份"
              value={province}
              onChangeText={setProvince}
              editable={!isSubmitting}
            />
            {errors.province ? (
              <Text style={styles.errorText}>{errors.province}</Text>
            ) : null}
          </View>
          
          {/* 城市 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>城市 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="请输入城市"
              value={city}
              onChangeText={setCity}
              editable={!isSubmitting}
            />
            {errors.city ? (
              <Text style={styles.errorText}>{errors.city}</Text>
            ) : null}
          </View>
          
          {/* 区/县 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>区/县 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.district && styles.inputError]}
              placeholder="请输入区/县"
              value={district}
              onChangeText={setDistrict}
              editable={!isSubmitting}
            />
            {errors.district ? (
              <Text style={styles.errorText}>{errors.district}</Text>
            ) : null}
          </View>
          
          {/* 详细地址 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>详细地址 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.detail && styles.inputError]}
              placeholder="请输入详细地址"
              value={detail}
              onChangeText={setDetail}
              editable={!isSubmitting}
            />
            {errors.detail ? (
              <Text style={styles.errorText}>{errors.detail}</Text>
            ) : null}
          </View>
          
          {/* 店铺信息 */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>店铺信息</Text>
          </View>
          
          {/* 营业执照 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>营业执照号码 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.businessLicense && styles.inputError]}
              placeholder="请输入营业执照号码"
              value={businessLicense}
              onChangeText={setBusinessLicense}
              editable={!isSubmitting}
            />
            {errors.businessLicense ? (
              <Text style={styles.errorText}>{errors.businessLicense}</Text>
            ) : null}
          </View>
          
          {/* 经营范围 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>经营范围</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入经营范围（选填）"
              value={businessScope}
              onChangeText={setBusinessScope}
              editable={!isSubmitting}
            />
          </View>
          
          {/* 店铺描述 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>店铺描述</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder="请输入店铺描述（选填）"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
            />
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
          </View>
          
          {/* 注册按钮 */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>注册商家</Text>
            )}
          </TouchableOpacity>
          
          {/* 返回登录 */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={isSubmitting}
          >
            <Text style={styles.loginLinkText}>已有账号？返回登录</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  registerButton: {
    height: 48,
    backgroundColor: '#1677ff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loginLink: {
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#1677ff',
    fontSize: 14,
  },
});

export default MerchantRegisterScreen; 