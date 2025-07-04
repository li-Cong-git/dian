/**
 * 商家店铺信息编辑页面
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import merchantService, { MerchantInfo } from '../../services/merchant.service';

// 定义组件属性类型
type ShopInfoScreenProps = StackScreenProps<MerchantCenterStackParamList, 'ShopInfo'>;

/**
 * 商家店铺信息编辑页面组件
 */
const ShopInfoScreen: React.FC<ShopInfoScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  
  // 表单状态
  const [shopName, setShopName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [addressDetail, setAddressDetail] = useState<string>('');
  const [logo, setLogo] = useState<string>('');

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '店铺信息',
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
  }, [navigation, shopName, description, phone, email, province, city, district, addressDetail, saving]);

  // 加载商家信息
  useEffect(() => {
    loadMerchantInfo();
  }, []);

  /**
   * 加载商家信息
   */
  const loadMerchantInfo = async () => {
    if (!user?._id) {
      navigation.goBack();
      return;
    }

    setLoading(true);
    
    try {
      const merchantData = await merchantService.getMerchantInfo(user._id);
      setMerchantInfo(merchantData);
      
      // 设置表单初始值
      setShopName(merchantData.name || '');
      setDescription(merchantData.description || '');
      setPhone(merchantData.phone || '');
      setEmail(merchantData.email || '');
      if (merchantData.address) {
        setProvince(merchantData.address.province || '');
        setCity(merchantData.address.city || '');
        setDistrict(merchantData.address.district || '');
        setAddressDetail(merchantData.address.detail || '');
      }
      setLogo(merchantData.logo || '');
    } catch (error) {
      console.error('加载商家信息失败:', error);
      Alert.alert('加载失败', '无法加载商家信息，请稍后重试');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理选择Logo
   */
  const handleSelectLogo = () => {
    // 模拟上传Logo
    setUploadingLogo(true);
    
    // 生成随机Logo URL (模拟上传成功)
    setTimeout(() => {
      const demoLogos = [
        'https://randomuser.me/api/portraits/men/1.jpg',
        'https://randomuser.me/api/portraits/women/1.jpg',
        'https://via.placeholder.com/150/0000FF/808080?text=Shop',
        'https://via.placeholder.com/150/FF0000/FFFFFF?text=Logo',
      ];
      
      const randomLogo = demoLogos[Math.floor(Math.random() * demoLogos.length)];
      setLogo(randomLogo);
      setUploadingLogo(false);
      Alert.alert('上传成功', 'Logo已成功更新');
    }, 1500);
  };

  /**
   * 处理保存
   */
  const handleSave = async () => {
    if (!user?._id) return;
    
    // 表单验证
    if (!shopName) {
      Alert.alert('提示', '请输入店铺名称');
      return;
    }
    
    if (!phone) {
      Alert.alert('提示', '请输入联系电话');
      return;
    }
    
    setSaving(true);
    
    try {
      // 更新商家信息
      await merchantService.updateMerchantInfo({
        merchantId: user._id,
        data: {
          name: shopName,
          description,
          phone,
          email,
          address: {
            province,
            city,
            district,
            detail: addressDetail,
          },
          logo,
        },
      });
      
      Alert.alert('保存成功', '店铺信息已更新', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('更新商家信息失败:', error);
      Alert.alert('保存失败', '无法更新店铺信息，请稍后重试');
    } finally {
      setSaving(false);
    }
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
      {/* Logo上传 */}
      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={handleSelectLogo} disabled={uploadingLogo}>
          {uploadingLogo ? (
            <View style={styles.logoPlaceholder}>
              <ActivityIndicator size="small" color="#1677ff" />
              <Text style={styles.uploadingText}>上传中...</Text>
            </View>
          ) : logo ? (
            <Image source={{ uri: logo }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>上传Logo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.logoHint}>点击更换Logo</Text>
      </View>
      
      {/* 店铺基本信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>店铺名称 *</Text>
          <TextInput
            style={styles.input}
            value={shopName}
            onChangeText={setShopName}
            placeholder="请输入店铺名称"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>店铺描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="请输入店铺描述"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
      
      {/* 联系方式 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>联系方式</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>联系电话 *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="请输入联系电话"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>电子邮箱</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="请输入电子邮箱"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
      
      {/* 店铺地址 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>店铺地址</Text>
        
        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>省份</Text>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              value={province}
              onChangeText={setProvince}
              placeholder="省份"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>城市</Text>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              value={city}
              onChangeText={setCity}
              placeholder="城市"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>区/县</Text>
          <TextInput
            style={styles.input}
            value={district}
            onChangeText={setDistrict}
            placeholder="区/县"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>详细地址</Text>
          <TextInput
            style={styles.input}
            value={addressDetail}
            onChangeText={setAddressDetail}
            placeholder="详细地址"
          />
        </View>
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
          <Text style={styles.submitButtonText}>保存店铺信息</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#999',
  },
  uploadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  logoHint: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#fff',
  },
  inputHalf: {
    width: '90%',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 20,
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

export default ShopInfoScreen; 