/**
 * 注册页面
 */
import React, { useState, useEffect } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/types';

// 定义组件属性类型
interface RegisterScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
  route: RouteProp<AuthStackParamList, 'Register'>;
}

// 定义表单数据类型
interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  shopName: string;
  shopAddress: string;
  businessLicense: string;
}

// 定义错误状态类型
interface FormErrors {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  shopName: string;
  shopAddress: string;
  businessLicense: string;
  general: string;
}

/**
 * 注册页面组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} - 注册页面
 */
const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, route }) => {
  // 获取路由参数中的用户类型，默认为普通用户
  const initialUserType = route.params?.userType || ROLES.USER;
  
  // 状态
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    // 商家特有字段
    shopName: '',
    shopAddress: '',
    businessLicense: '',
  });
  const [userType, setUserType] = useState<ROLES>(initialUserType);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 获取认证上下文
  const { register, error: authError } = useAuth();
  
  // 表单错误状态
  const [errors, setErrors] = useState<FormErrors>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    shopName: '',
    shopAddress: '',
    businessLicense: '',
    general: ''
  });
  
  // 当用户类型变化时，重置相关错误
  useEffect(() => {
    setErrors({
      ...errors,
      shopName: '',
      shopAddress: '',
      businessLicense: '',
      general: ''
    });
  }, [userType]);
  
  /**
   * 处理表单输入变化
   * @param {string} field - 字段名
   * @param {string} value - 字段值
   */
  const handleChange = (field: keyof FormData, value: string): void => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  /**
   * 表单验证
   * @returns {boolean} - 验证结果
   */
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // 验证用户名
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
      isValid = false;
    }
    
    // 验证密码
    if (!formData.password) {
      newErrors.password = '请输入密码';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少为6位';
      isValid = false;
    }
    
    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }
    
    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
      isValid = false;
    }
    
    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!formData.phone) {
      newErrors.phone = '请输入手机号';
      isValid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = '请输入有效的手机号';
      isValid = false;
    }
    
    // 商家特有字段验证
    if (userType === ROLES.MERCHANT) {
      if (!formData.shopName.trim()) {
        newErrors.shopName = '请输入店铺名称';
        isValid = false;
      }
      
      if (!formData.shopAddress.trim()) {
        newErrors.shopAddress = '请输入店铺地址';
        isValid = false;
      }
      
      if (!formData.businessLicense.trim()) {
        newErrors.businessLicense = '请输入营业执照号';
        isValid = false;
      }
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
      
      // 根据用户类型准备注册数据
      const registerData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone
      };
      
      // 添加商家特有字段
      if (userType === ROLES.MERCHANT) {
        registerData.shopName = formData.shopName;
        registerData.shopAddress = formData.shopAddress;
        registerData.businessLicense = formData.businessLicense;
      }
      
      // 调用注册API
      const result = await register(registerData, userType);
      
      console.log('注册结果:', result);
      
      if (result.success) {
        // 注册成功
        Alert.alert(
          '注册成功',
          '您已成功注册账号，现在可以登录了',
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
          general: result.error || '注册失败，请稍后再试'
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
  
  /**
   * 切换用户类型
   * @param {ROLES} type - 用户类型
   */
  const switchUserType = (type: ROLES): void => {
    setUserType(type);
    // 清除之前的错误
    setErrors({
      ...errors,
      shopName: '',
      shopAddress: '',
      businessLicense: '',
      general: ''
    });
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.subtitle}>请填写以下信息完成注册</Text>
        </View>
        
        {/* 用户类型切换 */}
        <View style={styles.userTypeContainer}>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === ROLES.USER && styles.activeUserType
            ]}
            onPress={() => switchUserType(ROLES.USER)}
          >
            <Text
              style={[
                styles.userTypeText,
                userType === ROLES.USER && styles.activeUserTypeText
              ]}
            >
              用户注册
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === ROLES.MERCHANT && styles.activeUserType
            ]}
            onPress={() => switchUserType(ROLES.MERCHANT)}
          >
            <Text
              style={[
                styles.userTypeText,
                userType === ROLES.MERCHANT && styles.activeUserTypeText
              ]}
            >
              商家注册
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 错误信息 */}
        {(errors.general || authError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general || authError}</Text>
          </View>
        )}
        
        {/* 注册表单 */}
        <View style={styles.formContainer}>
          {/* 基本信息 */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>基本信息</Text>
            
            {/* 用户名 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>用户名</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="请输入用户名"
                value={formData.username}
                onChangeText={(value) => handleChange('username', value)}
                autoCapitalize="none"
                editable={!isSubmitting}
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>
            
            {/* 密码 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>密码</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="请输入密码"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry
                editable={!isSubmitting}
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>
            
            {/* 确认密码 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>确认密码</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
                secureTextEntry
                editable={!isSubmitting}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>
            
            {/* 邮箱 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>邮箱</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="请输入邮箱"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>
            
            {/* 手机号 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>手机号</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="请输入手机号"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                editable={!isSubmitting}
              />
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>
          </View>
          
          {/* 商家信息 */}
          {userType === ROLES.MERCHANT && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>商家信息</Text>
              
              {/* 店铺名称 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>店铺名称</Text>
                <TextInput
                  style={[styles.input, errors.shopName && styles.inputError]}
                  placeholder="请输入店铺名称"
                  value={formData.shopName}
                  onChangeText={(value) => handleChange('shopName', value)}
                  editable={!isSubmitting}
                />
                {errors.shopName ? (
                  <Text style={styles.errorText}>{errors.shopName}</Text>
                ) : null}
              </View>
              
              {/* 店铺地址 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>店铺地址</Text>
                <TextInput
                  style={[styles.input, errors.shopAddress && styles.inputError]}
                  placeholder="请输入店铺地址"
                  value={formData.shopAddress}
                  onChangeText={(value) => handleChange('shopAddress', value)}
                  editable={!isSubmitting}
                />
                {errors.shopAddress ? (
                  <Text style={styles.errorText}>{errors.shopAddress}</Text>
                ) : null}
              </View>
              
              {/* 营业执照号 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>营业执照号</Text>
                <TextInput
                  style={[styles.input, errors.businessLicense && styles.inputError]}
                  placeholder="请输入营业执照号"
                  value={formData.businessLicense}
                  onChangeText={(value) => handleChange('businessLicense', value)}
                  editable={!isSubmitting}
                />
                {errors.businessLicense ? (
                  <Text style={styles.errorText}>{errors.businessLicense}</Text>
                ) : null}
              </View>
            </View>
          )}
          
          {/* 注册按钮 */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>注册</Text>
            )}
          </TouchableOpacity>
          
          {/* 登录链接 */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>已有账号? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>立即登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1677ff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeUserType: {
    backgroundColor: '#1677ff',
  },
  userTypeText: {
    fontSize: 16,
    color: '#666',
  },
  activeUserTypeText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  registerButton: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#1677ff',
    fontWeight: '600',
  },
});

export default RegisterScreen; 