/**
 * 登录页面
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
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/types';

// 定义组件属性类型
interface LoginScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
}

// 定义错误状态类型
interface FormErrors {
  username: string;
  password: string;
  general: string;
}

/**
 * 登录页面组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} - 登录页面
 */
const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // 状态
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userType, setUserType] = useState<ROLES>(ROLES.USER); // 默认为普通用户
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 获取认证上下文
  const { login, error: authError } = useAuth();
  
  // 本地错误状态
  const [errors, setErrors] = useState<FormErrors>({
    username: '',
    password: '',
    general: ''
  });
  
  /**
   * 表单验证
   * @returns {boolean} - 验证结果
   */
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {
      username: '',
      password: '',
      general: ''
    };
    
    // 验证用户名
    if (!username.trim()) {
      newErrors.username = '请输入用户名';
      isValid = false;
    }
    
    // 验证密码
    if (!password) {
      newErrors.password = '请输入密码';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少为6位';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  /**
   * 处理登录
   */
  const handleLogin = async (): Promise<void> => {
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrors({ ...errors, general: '' });
      
      // 调用登录API
      const result = await login(
        { username, password }
      );
      
      if (result.success) {
        // 登录成功，导航到首页或相应的页面
        navigation.navigate('Home');
        // 或者直接重置导航栈
        // navigation.reset({
        //   index: 0,
        //   routes: [{ name: 'Home' }],
        // });
      } else {
        // 登录失败
        setErrors({
          ...errors,
          general: result.error || '登录失败，请检查您的凭证'
        });
      }
    } catch (error: any) {
      console.error('登录错误:', error);
      setErrors({
        ...errors,
        general: '登录时发生错误，请稍后再试'
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
    setErrors({ ...errors, general: '' });
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
          <Text style={styles.title}>欢迎登录</Text>
          <Text style={styles.subtitle}>请输入您的账号信息</Text>
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
              用户登录
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
              商家登录
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 错误信息 */}
        {(errors.general || authError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general || authError}</Text>
          </View>
        )}
        
        {/* 登录表单 */}
        <View style={styles.formContainer}>
          {/* 用户名 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>用户名</Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              placeholder="请输入用户名"
              value={username}
              onChangeText={setUsername}
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
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>
          
          {/* 忘记密码 */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>忘记密码?</Text>
          </TouchableOpacity>
          
          {/* 登录按钮 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>登录</Text>
            )}
          </TouchableOpacity>
          
          {/* 注册链接 */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>还没有账号? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register', { userType })}
            >
              <Text style={styles.registerLink}>立即注册</Text>
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
    justifyContent: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#1677ff',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#1677ff',
    fontWeight: '600',
  },
});

export default LoginScreen; 