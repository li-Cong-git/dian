/**
 * 忘记密码页面
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
import { AuthStackParamList } from '../../navigation/types';
import { apiClient, API_PATHS } from '../../services/api';

// 定义组件属性类型
interface ForgotPasswordScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
}

// 定义错误状态类型
interface FormErrors {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
  general: string;
}

/**
 * 忘记密码页面组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} - 忘记密码页面
 */
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  // 状态
  const [email, setEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [step, setStep] = useState<number>(1); // 1: 输入邮箱, 2: 输入验证码和新密码
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  
  // 错误状态
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  });
  
  /**
   * 验证邮箱
   * @returns {boolean} - 验证结果
   */
  const validateEmail = (): boolean => {
    // 清除之前的错误
    setErrors({ ...errors, email: '', general: '' });
    
    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors({ ...errors, email: '请输入邮箱' });
      return false;
    } else if (!emailRegex.test(email)) {
      setErrors({ ...errors, email: '请输入有效的邮箱地址' });
      return false;
    }
    
    return true;
  };
  
  /**
   * 验证验证码和新密码
   * @returns {boolean} - 验证结果
   */
  const validateResetForm = (): boolean => {
    const newErrors: FormErrors = {
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
      general: ''
    };
    let isValid = true;
    
    // 验证验证码
    if (!verificationCode) {
      newErrors.verificationCode = '请输入验证码';
      isValid = false;
    } else if (verificationCode.length !== 6) {
      newErrors.verificationCode = '验证码应为6位数字';
      isValid = false;
    }
    
    // 验证密码
    if (!newPassword) {
      newErrors.newPassword = '请输入新密码';
      isValid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = '密码长度至少为6位';
      isValid = false;
    }
    
    // 验证确认密码
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }
    
    setErrors({ ...errors, ...newErrors });
    return isValid;
  };
  
  /**
   * 发送验证码
   */
  const sendVerificationCode = async (): Promise<void> => {
    if (!validateEmail()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 调用发送验证码API
      const response = await apiClient.post(API_PATHS.USER.SEND_VERIFICATION_CODE, { email });
      
      if (response.success) {
        // 发送成功
        setStep(2);
        startCountdown();
        Alert.alert('验证码已发送', '请查看您的邮箱获取验证码');
      } else {
        // 发送失败
        setErrors({
          ...errors,
          general: response.message || '发送验证码失败，请稍后再试'
        });
      }
    } catch (error: any) {
      console.error('发送验证码错误:', error);
      setErrors({
        ...errors,
        general: '发送验证码时发生错误，请稍后再试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * 重置密码
   */
  const resetPassword = async (): Promise<void> => {
    if (!validateResetForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 调用重置密码API
      const response = await apiClient.post(API_PATHS.USER.RESET_PASSWORD, {
        email,
        verificationCode,
        newPassword
      });
      
      if (response.success) {
        // 重置成功
        Alert.alert(
          '密码重置成功',
          '您的密码已成功重置，请使用新密码登录',
          [
            { 
              text: '去登录', 
              onPress: () => navigation.navigate('Login') 
            }
          ]
        );
      } else {
        // 重置失败
        setErrors({
          ...errors,
          general: response.message || '重置密码失败，请检查验证码是否正确'
        });
      }
    } catch (error: any) {
      console.error('重置密码错误:', error);
      setErrors({
        ...errors,
        general: '重置密码时发生错误，请稍后再试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * 开始倒计时
   */
  const startCountdown = (): void => {
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);
  };
  
  /**
   * 重新发送验证码
   */
  const resendVerificationCode = async (): Promise<void> => {
    try {
      setIsSubmitting(true);
      
      // 调用发送验证码API
      const response = await apiClient.post(API_PATHS.USER.SEND_VERIFICATION_CODE, { email });
      
      if (response.success) {
        // 发送成功
        startCountdown();
        Alert.alert('验证码已重新发送', '请查看您的邮箱获取验证码');
      } else {
        // 发送失败
        setErrors({
          ...errors,
          general: response.message || '发送验证码失败，请稍后再试'
        });
      }
    } catch (error: any) {
      console.error('发送验证码错误:', error);
      setErrors({
        ...errors,
        general: '发送验证码时发生错误，请稍后再试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * 返回上一步
   */
  const goBack = (): void => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({
        ...errors,
        verificationCode: '',
        newPassword: '',
        confirmPassword: '',
        general: ''
      });
    } else {
      navigation.goBack();
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
          <Text style={styles.title}>重置密码</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? '请输入您的邮箱地址，我们将发送验证码'
              : '请输入验证码和新密码'}
          </Text>
        </View>
        
        {/* 错误信息 */}
        {errors.general ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        ) : null}
        
        {/* 步骤1：输入邮箱 */}
        {step === 1 && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>邮箱地址</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="请输入您的邮箱"
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
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={sendVerificationCode}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>发送验证码</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* 步骤2：输入验证码和新密码 */}
        {step === 2 && (
          <View style={styles.formContainer}>
            {/* 验证码 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>验证码</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.codeInput,
                    errors.verificationCode && styles.inputError
                  ]}
                  placeholder="请输入6位验证码"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isSubmitting}
                />
                
                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    countdown > 0 && styles.resendButtonDisabled
                  ]}
                  onPress={resendVerificationCode}
                  disabled={countdown > 0 || isSubmitting}
                >
                  <Text
                    style={[
                      styles.resendButtonText,
                      countdown > 0 && styles.resendButtonTextDisabled
                    ]}
                  >
                    {countdown > 0 ? `重新发送(${countdown}s)` : '重新发送'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.verificationCode ? (
                <Text style={styles.errorText}>{errors.verificationCode}</Text>
              ) : null}
            </View>
            
            {/* 新密码 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>新密码</Text>
              <TextInput
                style={[styles.input, errors.newPassword && styles.inputError]}
                placeholder="请输入新密码"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
              {errors.newPassword ? (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              ) : null}
            </View>
            
            {/* 确认密码 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>确认密码</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={resetPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>重置密码</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>
            {step === 1 ? '返回登录' : '返回上一步'}
          </Text>
        </TouchableOpacity>
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
    textAlign: 'center',
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
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    marginRight: 10,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  resendButtonText: {
    color: '#1677ff',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen; 