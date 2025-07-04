 /**
 * 添加商品页面
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
import productService, { Product, ProductImage } from '../../services/product.service';

// 定义组件属性类型
type AddProductScreenProps = StackScreenProps<MerchantCenterStackParamList, 'AddProduct'>;

/**
 * 商品状态选项
 */
const STATUS_OPTIONS = [
  { label: '上架', value: 'on_sale' },
  { label: '下架', value: 'off_shelf' },
  { label: '售罄', value: 'sold_out' }
];

/**
 * 添加商品页面组件
 */
const AddProductScreen: React.FC<AddProductScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  
  // 页面状态
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  
  // 商品表单状态
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<'on_sale' | 'off_shelf' | 'sold_out'>('on_sale');
  const [images, setImages] = useState<ProductImage[]>([]);
  
  // 分类列表
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState<boolean>(false);

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '添加商品',
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
  }, [navigation, name, description, price, originalPrice, stock, category, status, images, saving]);

  // 加载分类
  useEffect(() => {
    loadCategories();
  }, []);

  /**
   * 加载商品分类
   */
  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      console.log('分类数据:', response);
      if (response && response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error('分类数据格式不正确:', response);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  /**
   * 处理添加商品图片
   */
  const handleAddImage = () => {
    if (!user?._id) return;
    
    // 模拟上传图片
    setUploadingImage(true);
    
    // 生成随机图片URL (模拟上传成功)
    setTimeout(() => {
      // 生成随机颜色
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);
      
      // 创建新图片
      const newImage: ProductImage = {
        url: `https://via.placeholder.com/500/${randomColor}/FFFFFF?text=Product+Image`,
        isMain: images.length === 0 // 第一张图片默认为主图
      };
      
      // 更新图片列表
      setImages(prevImages => [...prevImages, newImage]);
      setUploadingImage(false);
      
      Alert.alert('上传成功', '图片已添加');
    }, 1000);
  };

  /**
   * 设置主图
   */
  const setMainImage = (index: number) => {
    setImages(prevImages => 
      prevImages.map((img, i) => ({
        ...img,
        isMain: i === index
      }))
    );
  };

  /**
   * 删除图片
   */
  const deleteImage = (index: number) => {
    Alert.alert(
      '删除图片',
      '确定要删除这张图片吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            const newImages = [...images];
            newImages.splice(index, 1);
            
            // 如果删除的是主图，且还有其他图片，则设置第一张为主图
            if (images[index].isMain && newImages.length > 0) {
              newImages[0].isMain = true;
            }
            
            setImages(newImages);
          }
        }
      ]
    );
  };

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入商品名称');
      return false;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('提示', '请输入有效的价格');
      return false;
    }

    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0) {
      Alert.alert('提示', '请输入有效的库存');
      return false;
    }

    if (!category) {
      Alert.alert('提示', '请选择商品分类');
      return false;
    }
    
    if (images.length === 0) {
      Alert.alert('提示', '请至少上传一张商品图片');
      return false;
    }

    return true;
  };

  /**
   * 处理保存
   */
  const handleSave = async () => {
    if (!user?._id) return;
    
    // 表单验证
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      // 创建商品信息
      // 将ProductImage数组转换为字符串数组
      const imageUrls = images.map(img => img.url);
      
      // 找到主图设为缩略图
      const mainImage = images.find(img => img.isMain);
      const thumbnail = mainImage ? mainImage.url : (images.length > 0 ? images[0].url : undefined);

      const productData: Product = {
        name,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        stock: Number(stock),
        category,
        status,
        images: imageUrls,
        thumbnail: thumbnail,
        merchantId: user._id
      };
      
      await productService.addProduct(productData);
      
      Alert.alert('添加成功', '商品已成功添加', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('添加商品失败:', error);
      Alert.alert('添加失败', '无法添加商品，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 商品图片 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品图片</Text>
        <View style={styles.imageList}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageItem}>
              <Image source={{ uri: image.url }} style={styles.productImage} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={[styles.imageAction, image.isMain && styles.mainImageAction]}
                  onPress={() => setMainImage(index)}
                  disabled={image.isMain}
                >
                  <Text style={[styles.imageActionText, image.isMain && styles.mainImageActionText]}>
                    {image.isMain ? '主图' : '设为主图'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.imageAction, styles.deleteImageAction]}
                  onPress={() => deleteImage(index)}
                >
                  <Text style={[styles.imageActionText, styles.deleteImageActionText]}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {/* 添加图片按钮 */}
          <TouchableOpacity 
            style={styles.imageItem}
            onPress={handleAddImage}
            disabled={uploadingImage}
          >
            <View style={styles.addImageButtonInner}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#1677ff" />
              ) : (
                <Text style={styles.addImageButtonText}>+ 添加图片</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 基本信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>商品名称 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="请输入商品名称"
            maxLength={100}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>商品描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="请输入商品描述"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>售价 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>原价</Text>
            <TextInput
              style={styles.input}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>库存 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>状态</Text>
            <View style={styles.statusSelector}>
              {STATUS_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    status === option.value && styles.selectedStatusOption
                  ]}
                  onPress={() => setStatus(option.value as 'on_sale' | 'off_shelf' | 'sold_out')}
                >
                  <Text 
                    style={[
                      styles.statusOptionText,
                      status === option.value && styles.selectedStatusOptionText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>商品分类 <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            style={styles.categorySelector}
            onPress={() => setShowCategorySelector(!showCategorySelector)}
          >
            <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
              {category ? categories.find(c => c.id === category)?.name || category : '请选择商品分类'}
            </Text>
            <Text style={styles.categoryArrow}>▼</Text>
          </TouchableOpacity>
          
          {/* 分类选择器 */}
          {showCategorySelector && (
            <View style={styles.categoryDropdown}>
              {categories.length > 0 ? (
                categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      category === cat.id && styles.selectedCategoryOption
                    ]}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategorySelector(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.categoryOptionText,
                        category === cat.id && styles.selectedCategoryOptionText
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noCategoryContainer}>
                  <Text style={styles.noCategoryText}>暂无分类</Text>
                </View>
              )}
            </View>
          )}
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
          <Text style={styles.submitButtonText}>添加商品</Text>
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
  section: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  imageItem: {
    width: '33.33%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  imageAction: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  mainImageAction: {
    backgroundColor: '#e6f7ff',
  },
  deleteImageAction: {
    backgroundColor: '#fff1f0',
  },
  imageActionText: {
    fontSize: 12,
    color: '#666',
  },
  mainImageActionText: {
    color: '#1677ff',
  },
  deleteImageActionText: {
    color: '#ff4d4f',
  },
  addImageButtonInner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageButtonText: {
    color: '#1677ff',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  halfWidth: {
    width: '50%',
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  required: {
    color: '#ff4d4f',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  selectedStatusOption: {
    backgroundColor: '#e6f7ff',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedStatusOptionText: {
    color: '#1677ff',
    fontWeight: '500',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  categoryArrow: {
    fontSize: 12,
    color: '#999',
  },
  categoryDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 5,
    maxHeight: 200,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  selectedCategoryOption: {
    backgroundColor: '#f0f7ff',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryOptionText: {
    color: '#1677ff',
    fontWeight: '500',
  },
  noCategoryContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noCategoryText: {
    color: '#999',
    fontSize: 14,
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

export default AddProductScreen;