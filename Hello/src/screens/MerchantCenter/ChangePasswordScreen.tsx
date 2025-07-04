/**
 * 商家修改密码页面
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import merchantService from '../../services/merchant.service';

// 定义组件属性类型
type ChangePasswordScreenProps = StackScreenProps<MerchantCenterStackParamList, 'ChangePassword'>;

/**
 * 商家修改密码页面组件
 */
const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '修改密码',
    });
  }, [navigation]);

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!currentPassword) {
      newErrors.currentPassword = '请输入当前密码';
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = '请输入新密码';
      isValid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = '新密码长度至少为6位';
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * 处理修改密码
   */
  const handleChangePassword = async () => {
    if (!validateForm() || !user?._id) return;

    setLoading(true);
    try {
      // 调用商家服务修改密码
      const result = await merchantService.changePassword({
        merchantId: user._id,
        currentPassword,
        newPassword,
      });
      
      if (result.success) {
        Alert.alert('修改成功', '密码已成功修改', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('修改失败', result.message || '密码修改失败');
      }
    } catch (error: any) {
      console.error('修改密码失败:', error);
      Alert.alert('修改失败', error.message || '无法修改密码，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {/* 当前密码 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>当前密码</Text>
          <TextInput
            style={[styles.input, errors.currentPassword && styles.inputError]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="请输入当前密码"
            secureTextEntry
          />
          {errors.currentPassword ? (
            <Text style={styles.errorText}>{errors.currentPassword}</Text>
          ) : null}
        </View>

        {/* 新密码 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>新密码</Text>
          <TextInput
            style={[styles.input, errors.newPassword && styles.inputError]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="请输入新密码"
            secureTextEntry
          />
          {errors.newPassword ? (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          ) : null}
        </View>

        {/* 确认密码 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>确认新密码</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="请再次输入新密码"
            secureTextEntry
          />
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}
        </View>

        {/* 密码要求提示 */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>密码要求：</Text>
          <Text style={styles.tipsText}>• 长度至少为6位</Text>
          <Text style={styles.tipsText}>• 建议包含字母和数字的组合</Text>
          <Text style={styles.tipsText}>• 区分大小写</Text>
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>修改密码</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    marginTop: 20,
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 5,
  },
  tipsContainer: {
    backgroundColor: '#f6f6f6',
    padding: 15,
    borderRadius: 4,
    marginVertical: 15,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#97c2ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChangePasswordScreen; 