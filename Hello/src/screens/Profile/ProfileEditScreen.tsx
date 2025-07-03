/**
 * 个人资料编辑页面
 */
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';

// 定义组件属性类型
type ProfileEditScreenProps = StackScreenProps<ProfileStackParamList, 'ProfileEdit'>;

/**
 * 个人资料编辑页面组件
 */
const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation, route }) => {
  // 从路由参数中获取用户ID
  const { userId } = route.params;

  // 用户信息状态（模拟初始数据）
  const [userInfo, setUserInfo] = useState({
    username: '用户名',
    nickname: '昵称',
    gender: '男',
    birthday: '1990-01-01',
    phone: '138****1234',
    email: 'example@email.com',
    description: '这是个人简介，用户可以在这里展示自己的兴趣爱好或其他信息。',
  });

  // 表单字段更新处理函数
  const handleChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 保存资料
  const handleSave = () => {
    // 这里实际应用中会有表单验证和API调用
    // 模拟保存成功
    Alert.alert(
      '保存成功',
      '个人资料已更新',
      [
        { 
          text: '确定', 
          onPress: () => navigation.goBack() 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* 头像编辑 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInfo.username.charAt(0)}</Text>
          </View>
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Text style={styles.changeAvatarText}>更换头像</Text>
          </TouchableOpacity>
        </View>

        {/* 表单项 */}
        <View style={styles.formItem}>
          <Text style={styles.label}>用户ID</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{userId}</Text>
            <Text style={styles.hint}>(不可修改)</Text>
          </View>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>用户名</Text>
          <TextInput
            style={styles.input}
            value={userInfo.username}
            onChangeText={(text) => handleChange('username', text)}
            placeholder="请输入用户名"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>昵称</Text>
          <TextInput
            style={styles.input}
            value={userInfo.nickname}
            onChangeText={(text) => handleChange('nickname', text)}
            placeholder="请输入昵称"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>性别</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                userInfo.gender === '男' && styles.radioSelected
              ]}
              onPress={() => handleChange('gender', '男')}
            >
              <Text style={userInfo.gender === '男' ? styles.radioTextSelected : styles.radioText}>
                男
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioOption,
                userInfo.gender === '女' && styles.radioSelected
              ]}
              onPress={() => handleChange('gender', '女')}
            >
              <Text style={userInfo.gender === '女' ? styles.radioTextSelected : styles.radioText}>
                女
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>生日</Text>
          <TouchableOpacity style={styles.datePickerContainer}>
            <Text style={styles.dateText}>{userInfo.birthday}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>手机号</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{userInfo.phone}</Text>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>修改</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>邮箱</Text>
          <TextInput
            style={styles.input}
            value={userInfo.email}
            onChangeText={(text) => handleChange('email', text)}
            placeholder="请输入邮箱"
            placeholderTextColor="#999"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>个人简介</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={userInfo.description}
            onChangeText={(text) => handleChange('description', text)}
            placeholder="请输入个人简介"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
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
  form: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  changeAvatarButton: {
    padding: 8,
  },
  changeAvatarText: {
    color: '#1677ff',
    fontSize: 14,
  },
  formItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  hint: {
    fontSize: 12,
    color: '#999',
  },
  linkButton: {
    padding: 4,
  },
  linkText: {
    color: '#1677ff',
    fontSize: 14,
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioOption: {
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  radioSelected: {
    borderColor: '#1677ff',
    backgroundColor: '#e6f7ff',
  },
  radioText: {
    color: '#333',
  },
  radioTextSelected: {
    color: '#1677ff',
  },
  datePickerContainer: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    height: 44,
    backgroundColor: '#1677ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen; 